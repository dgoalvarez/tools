/**
 * La herramienta de escala tipográfica.
 *
 * Genera la escala, sí — eso lo hace cualquiera. Lo que aquí importa es la
 * tabla: a cuántos píxeles queda cada paso en las anchuras en las que la
 * gente mira las páginas de verdad. Es donde se ve que un titular ya está
 * al tope en un portátil mientras el cuerpo sigue en su mínimo.
 *
 * La aritmética vive en src/lib/scale.ts.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckIcon, CopyIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { t, type Lang } from '@/i18n/config';
import { ESCALA as E, NOMBRES_ESQUEMA, NOMBRES_RAZON } from '@/i18n/scale';
import {
  ANCHOS_TABLA,
  RAIZ_PX,
  RAZONES,
  ESQUEMAS,
  aCss,
  anchoParaFraccion,
  aplicarEsquema,
  buscarCruces,
  buscarNombresRepetidos,
  construirEscala,
  limpiarNombre,
  type Ajustes,
} from '@/lib/scale';
import { escribirParams, leerParams } from '@/lib/url-state';

/**
 * Lo que sale al abrir la herramienta.
 *
 * Antes salía `--step-0`, `--step-1`… que no le dice nada a nadie. Ahora
 * sale el esquema de Tailwind con el prefijo «text», o sea `--text-sm`,
 * `--text-base`, `--text-lg`: nombres que se reconocen sin que nadie los
 * explique, y que con 5 pasos arriba y 2 abajo dan exactamente la rampa
 * que Tailwind trae de serie.
 */
const INICIAL: Ajustes = {
  fluida: true,
  baseMin: 16,
  baseMax: 20,
  razonMin: 1.2,
  razonMax: 1.25,
  arriba: 5,
  abajo: 2,
  anchoMin: 390,
  anchoMax: 1920,
  prefijo: 'text',
  nombres: aplicarEsquema(
    ESQUEMAS.find((e) => e.clave === 'tailwind')!,
    2,
    5
  ),
  omitidos: [],
};

/**
 * Las claves de la dirección, cortas para que el enlace no sea un muro.
 * `nombres` y `omitidos` no están aquí: no son números y se serializan
 * aparte.
 */
const CLAVES: Record<Exclude<keyof Ajustes, 'nombres' | 'omitidos' | 'fluida'>, string> = {
  baseMin: 'bn',
  baseMax: 'bx',
  razonMin: 'rn',
  razonMax: 'rx',
  arriba: 'u',
  abajo: 'd',
  anchoMin: 'wn',
  anchoMax: 'wx',
  prefijo: 'p',
};

/** Los nombres propios en la dirección: «0:body,1:title,-1:caption». */
function nombresATexto(nombres: Record<string, string>): string {
  const pares = Object.entries(nombres).filter(([, v]) => v);
  return pares.map(([i, n]) => `${i}:${n}`).join(',');
}

/** Los pasos apagados en la dirección: «2,4». */
function textoAOmitidos(texto: string): number[] {
  return texto
    .split(',')
    .slice(0, 25)
    .filter((n) => /^-?\d{1,2}$/.test(n))
    .map(Number);
}

function textoANombres(texto: string): Record<string, string> {
  const nombres: Record<string, string> = {};
  for (const par of texto.split(',').slice(0, 25)) {
    const [indice, nombre] = par.split(':');
    // Un enlace manipulado no debe poder colar nada en el bloque de CSS
    // que alguien va a pegar en su proyecto.
    if (indice && nombre && /^-?\d{1,2}$/.test(indice)) {
      const limpio = limpiarNombre(nombre);
      if (limpio) nombres[indice] = limpio;
    }
  }
  return nombres;
}

interface Props {
  lang: Lang;
}

export default function TypeScale({ lang }: Props) {
  const tr = (clave: keyof typeof E) => t(E[clave], lang);

  const [ajustes, setAjustes] = useState<Ajustes>(INICIAL);
  const [enlaceLeido, setEnlaceLeido] = useState(false);
  const [copiado, setCopiado] = useState<'css' | null>(null);

  const cambiar = useCallback(<K extends keyof Ajustes>(clave: K, valor: Ajustes[K]) => {
    setAjustes((previo) => ({ ...previo, [clave]: valor }));
    setCopiado(null);
  }, []);

  // ---------- la dirección ----------

  useEffect(() => {
    const params = leerParams();
    const leidos: Partial<Ajustes> = {};

    const enlaceNombres = params.get('n');
    if (enlaceNombres) leidos.nombres = textoANombres(enlaceNombres);

    const enlaceOmitidos = params.get('x');
    if (enlaceOmitidos) leidos.omitidos = textoAOmitidos(enlaceOmitidos);

    // `f=0` apaga lo fluido. Solo viaja cuando se aparta de lo normal.
    if (params.get('f') === '0') leidos.fluida = false;

    for (const [campo, clave] of Object.entries(CLAVES) as [
      Exclude<keyof Ajustes, 'nombres' | 'omitidos' | 'fluida'>,
      string,
    ][]) {
      const crudo = params.get(clave);
      if (crudo === null) continue;

      if (campo === 'prefijo') {
        // Solo lo que puede ser un nombre de variable CSS. Una dirección
        // manipulada no debe poder inyectar nada en el bloque que se copia.
        const limpio = crudo.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
        if (limpio) leidos.prefijo = limpio;
        continue;
      }

      const numero = Number(crudo);
      if (!Number.isFinite(numero)) continue;

      if (campo === 'arriba' || campo === 'abajo') {
        leidos[campo] = Math.max(0, Math.min(12, Math.round(numero)));
      } else if (campo === 'razonMin' || campo === 'razonMax') {
        leidos[campo] = Math.max(0.5, Math.min(3, numero));
      } else if (campo === 'anchoMin' || campo === 'anchoMax') {
        leidos[campo] = Math.max(200, Math.min(3840, Math.round(numero)));
      } else {
        leidos[campo] = Math.max(4, Math.min(200, numero));
      }
    }

    if (Object.keys(leidos).length) setAjustes((previo) => ({ ...previo, ...leidos }));
    setEnlaceLeido(true);
  }, []);

  useEffect(() => {
    if (!enlaceLeido) return;

    const salida: Record<string, string | null> = {};
    for (const [campo, clave] of Object.entries(CLAVES) as [
      Exclude<keyof Ajustes, 'nombres' | 'omitidos' | 'fluida'>,
      string,
    ][]) {
      salida[clave] = ajustes[campo] === INICIAL[campo] ? null : String(ajustes[campo]);
    }
    salida.f = ajustes.fluida ? null : '0';
    salida.n =
      nombresATexto(ajustes.nombres) === nombresATexto(INICIAL.nombres)
        ? null
        : nombresATexto(ajustes.nombres) || null;
    salida.x = ajustes.omitidos.length
      ? [...ajustes.omitidos].sort((a, b) => a - b).join(',')
      : null;
    escribirParams(salida);
  }, [enlaceLeido, ajustes]);

  // ---------- las cuentas ----------

  const { pasos, cruces, repetidos, css } = useMemo(() => {
    // El ancho máximo tiene que quedar por encima del mínimo o la recta se
    // vuelve del revés. Se corrige aquí y no en el campo, para que se pueda
    // teclear un número intermedio sin que salte nada.
    // Sin escala fluida, los dos extremos son el mismo: cada paso vale
    // un número y `construirEscala` emite un valor suelto en vez de un
    // clamp(), que es lo que ya hacía cuando el mínimo y el máximo
    // coincidían. La aritmética no cambia; cambia lo que se le pide.
    const seguros: Ajustes = ajustes.fluida
      ? { ...ajustes, anchoMax: Math.max(ajustes.anchoMin + 1, ajustes.anchoMax) }
      : { ...ajustes, baseMax: ajustes.baseMin, razonMax: ajustes.razonMin };
    const pasos = construirEscala(seguros);
    return {
      pasos,
      cruces: buscarCruces(pasos, seguros),
      repetidos: buscarNombresRepetidos(pasos),
      css: aCss(pasos),
    };
  }, [ajustes]);

  /**
   * Un número escrito como se escribe en el idioma de la página: con
   * coma decimal en español y con punto en inglés. `toFixed` siempre
   * pone punto, y «1.26» en una interfaz en español se lee como mil
   * doscientos veintiséis.
   */
  const cifra = (n: number, decimales: number) =>
    n.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    });

  /** Renombra un paso. Un nombre vacío lo devuelve a su número. */
  function renombrar(indice: number, bruto: string) {
    const limpio = limpiarNombre(bruto);
    setAjustes((previo) => {
      const nombres = { ...previo.nombres };
      if (limpio) nombres[String(indice)] = limpio;
      else delete nombres[String(indice)];
      return { ...previo, nombres };
    });
    setCopiado(null);
  }

  function ponerEsquema(clave: string) {
    const esquema = ESQUEMAS.find((e) => e.clave === clave);
    if (!esquema) return;
    setAjustes((previo) => ({
      ...previo,
      nombres: aplicarEsquema(esquema, previo.abajo, previo.arriba, previo.omitidos),
    }));
    setCopiado(null);
  }

  /**
   * Enciende o apaga un paso.
   *
   * Al apagarlo, si había un esquema puesto, se vuelve a repartir: los
   * nombres tienen que correrse hacia el hueco. Si no, saltarse el +2
   * dejaría `--text-lg` y luego `--text-3xl`, y habría que arreglarlo a
   * mano, que es justo lo que la función viene a ahorrar.
   */
  function alternarPaso(indice: number) {
    setAjustes((previo) => {
      const omitidos = previo.omitidos.includes(indice)
        ? previo.omitidos.filter((i) => i !== indice)
        : [...previo.omitidos, indice];

      const esquema = ESQUEMAS.find(
        (e) =>
          JSON.stringify(aplicarEsquema(e, previo.abajo, previo.arriba, previo.omitidos)) ===
          JSON.stringify(previo.nombres)
      );

      return {
        ...previo,
        omitidos,
        nombres: esquema
          ? aplicarEsquema(esquema, previo.abajo, previo.arriba, omitidos)
          : previo.nombres,
      };
    });
    setCopiado(null);
  }

  /** Qué esquema está puesto, o ninguno si alguien ha editado a mano. */
  const esquemaActual =
    ESQUEMAS.find(
      (e) =>
        JSON.stringify(aplicarEsquema(e, ajustes.abajo, ajustes.arriba, ajustes.omitidos)) ===
        JSON.stringify(ajustes.nombres)
    )?.clave ?? '';

  const alReves = [...pasos].reverse();

  /**
   * Copia el bloque de CSS.
   *
   * Había también un botón para copiar el enlace de la escala. Se ha
   * quitado: el enlace ya está en la barra de direcciones y se actualiza
   * solo con cada cambio, así que el botón repetía a un botón que todos
   * los navegadores traen puesto.
   */
  async function copiarCss() {
    try {
      await navigator.clipboard.writeText(css);
      setCopiado('css');
    } catch {
      // Sin portapapeles, el bloque se queda a la vista para seleccionarlo.
    }
  }

  // ---------- pintado ----------

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,var(--col-controles))_minmax(0,1fr)] lg:items-start">
      {/* ---------------- Controles ---------------- */}
      <div className="columna-herramienta gap-4">
        {/*
          La primera decisión, y la que cambia todo lo demás: si la
          escala crece con la ventana o si cada paso vale un número.

          Va arriba del todo y fuera de las tarjetas porque no es un
          ajuste más entre otros: apagarla hace desaparecer la mitad de
          los campos de abajo —los dos extremos de la base, los dos de la
          proporción, y las anchuras enteras— y cambia el CSS que sale.
          Un mando así puesto en la tercera tarjeta se encuentra tarde.
        */}
        <label className="interruptor tarjeta-control" data-tour="fluida">
          <input
            type="checkbox"
            role="switch"
            checked={ajustes.fluida}
            onChange={(e) => cambiar('fluida', e.target.checked)}
          />
          <span className="texto">
            {tr('fluida')}
            <span className="apunte">{ajustes.fluida ? tr('fluidaSi') : tr('fluidaNo')}</span>
          </span>
        </label>

        <fieldset className="tarjeta-control" data-tour="base">
          <legend className="sr-only">{tr('ajustes')}</legend>
          <p className="titulo" aria-hidden="true">
            {tr('ajustes')}
          </p>

          {/* Dos extremos solo si hay dos extremos. Sin escala fluida,
              «Base en la ventana estrecha» y «ancha» serían la misma
              pregunta hecha dos veces. */}
          <div className={ajustes.fluida ? 'grid grid-cols-2 gap-3' : 'grid gap-3'}>
            <Numero
              id="base-min"
              etiqueta={ajustes.fluida ? tr('baseMin') : tr('baseUnica')}
              valor={ajustes.baseMin}
              min={4}
              max={200}
              paso={0.5}
              unidad="px"
              onCambio={(v) => cambiar('baseMin', v)}
            />
            {ajustes.fluida && (
              <Numero
                id="base-max"
                etiqueta={tr('baseMax')}
                valor={ajustes.baseMax}
                min={4}
                max={200}
                paso={0.5}
                unidad="px"
                onCambio={(v) => cambiar('baseMax', v)}
              />
            )}
          </div>

          <div className="grid gap-3" data-tour="razon">
            <Razon
              id="razon-min"
              etiqueta={ajustes.fluida ? tr('razonMin') : tr('razonUnica')}
              valor={ajustes.razonMin}
              lang={lang}
              personalizada={tr('personalizada')}
              onCambio={(v) => cambiar('razonMin', v)}
            />
            {ajustes.fluida && (
              <Razon
                id="razon-max"
                etiqueta={tr('razonMax')}
                valor={ajustes.razonMax}
                lang={lang}
                personalizada={tr('personalizada')}
                onCambio={(v) => cambiar('razonMax', v)}
              />
            )}
          </div>
        </fieldset>

        <fieldset className="tarjeta-control" data-tour="pasos">
          <legend className="sr-only">{tr('pasos')}</legend>
          <p className="titulo" aria-hidden="true">
            {tr('pasos')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Numero
              id="arriba"
              etiqueta={tr('arriba')}
              valor={ajustes.arriba}
              min={0}
              max={12}
              paso={1}
              onCambio={(v) => cambiar('arriba', Math.round(v))}
            />
            <Numero
              id="abajo"
              etiqueta={tr('abajo')}
              valor={ajustes.abajo}
              min={0}
              max={12}
              paso={1}
              onCambio={(v) => cambiar('abajo', Math.round(v))}
            />
          </div>
        </fieldset>

        {/* Entre qué anchuras crece. Sin escala fluida no crece entre
            ninguna, así que la tarjeta entera sobra. */}
        {ajustes.fluida && (
          <fieldset className="tarjeta-control" data-tour="ventana">
            <legend className="sr-only">{tr('ventana')}</legend>
            <p className="titulo" aria-hidden="true">
              {tr('ventana')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Numero
                id="ancho-min"
                etiqueta={tr('anchoMin')}
                valor={ajustes.anchoMin}
                min={200}
                max={3840}
                paso={10}
                unidad="px"
                onCambio={(v) => cambiar('anchoMin', Math.round(v))}
              />
              <Numero
                id="ancho-max"
                etiqueta={tr('anchoMax')}
                valor={ajustes.anchoMax}
                min={200}
                max={3840}
                paso={10}
                unidad="px"
                onCambio={(v) => cambiar('anchoMax', Math.round(v))}
              />
            </div>
          </fieldset>
        )}

        <fieldset className="tarjeta-control" data-tour="nombres">
          <legend className="sr-only">{tr('nombresTitulo')}</legend>
          <p className="titulo" aria-hidden="true">
            {tr('nombresTitulo')}
          </p>

          <div className="grid gap-1.5">
            <Label htmlFor="esquema">{tr('esquema')}</Label>
            <Select value={esquemaActual || 'aMedida'} onValueChange={ponerEsquema}>
              <SelectTrigger id="esquema" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* «A medida» solo aparece cuando alguien ya ha editado un
                    nombre: como opción a elegir no significaría nada. */}
                {!esquemaActual && <SelectItem value="aMedida">{tr('aMedida')}</SelectItem>}
                {ESQUEMAS.map((e) => (
                  <SelectItem key={e.clave} value={e.clave}>
                    {t(NOMBRES_ESQUEMA[e.clave]!, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="prefijo">{tr('prefijo')}</Label>
            <Input
              id="prefijo"
              value={ajustes.prefijo}
              spellCheck={false}
              autoComplete="off"
              className="font-mono"
              onChange={(e) =>
                cambiar('prefijo', e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24))
              }
            />
          </div>
        </fieldset>
      </div>

      {/* ---------------- Resultados ---------------- */}
      <div className="columna-herramienta gap-8">
        {repetidos.length > 0 && (
          <section className="rounded-lg border border-[var(--danger)] bg-surface p-5">
            <h2 className="text-[length:var(--fs-h3)] font-semibold text-[var(--danger)]">
              {tr('repetidoTitulo')}
            </h2>
            <p className="mt-2 font-mono text-[length:var(--fs-small)] text-ink-muted">
              {repetidos.join(' · ')}
            </p>
            <p className="mt-3 text-[length:var(--fs-small)] text-ink-muted">
              {tr('repetidoCuerpo')}
            </p>
          </section>
        )}

        {cruces.length > 0 && (
          <section className="rounded-lg border border-[var(--danger)] bg-surface p-5">
            <h2 className="text-[length:var(--fs-h3)] font-semibold text-[var(--danger)]">
              {tr('cruceTitulo')}
            </h2>
            <ul className="mt-3 grid gap-1 font-mono text-[length:var(--fs-small)] text-ink-muted">
              {cruces.map((c) => (
                <li key={`${c.menor}-${c.mayor}-${c.ancho}`}>
                  {c.menor} {tr('cruceEn')} {c.mayor} {tr('aA')} {c.ancho} px
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[length:var(--fs-small)] text-ink-muted">{tr('cruceCuerpo')}</p>
          </section>
        )}

        {/* -------- La rampa, con los clamp() de verdad -------- */}
        {/* La rampa se queda abierta y sin descripción: es lo que se
            mira, y lo que hay que saber de ella lo cuenta el paso a
            paso. */}
        <section data-tour="rampa">
          <h2 className="text-[length:var(--fs-h3)] font-semibold text-ink">
            {ajustes.fluida ? tr('muestraTitulo') : tr('muestraTituloFijo')}
          </h2>

          <div className="mt-3 grid min-w-0 gap-0.5 overflow-hidden rounded-lg border border-line bg-surface p-4">
            {alReves.map((paso) => (
              <div key={paso.indice} className={`fila-rampa${paso.omitido ? ' apagado' : ''}`}>
                {/*
                  El interruptor de saltarse el paso.

                  El paso apagado NO desaparece de la rampa: se queda en
                  gris. Hay que poder ver el hueco que se acaba de abrir
                  para juzgar si el salto entre los dos vecinos quedó bien,
                  y eso no se ve si lo que sobra se borra.
                */}
                <input
                  type="checkbox"
                  checked={!paso.omitido}
                  onChange={() => alternarPaso(paso.indice)}
                  data-tour={paso.indice === 0 ? 'saltar' : undefined}
                  aria-label={`${paso.nombre} · ${tr(paso.omitido ? 'encender' : 'apagar')}`}
                  title={tr(paso.omitido ? 'encender' : 'apagar')}
                  className="size-4 cursor-pointer self-center accent-[var(--acento)]"
                />

                <code className="variable truncate">{paso.nombre}</code>

                <span className="muestra truncate" style={{ fontSize: paso.valor }}>
                  {tr('muestraTexto')}
                </span>

                {/*
                  De qué tamaño es esto, y con qué aire entre líneas.

                  Los píxeles arriba, que es lo que se mira para juzgar;
                  los rem y el alto de línea abajo, que es lo que se
                  copia. En rem porque un `font-size` en píxeles deja de
                  responder al zoom del navegador, y eso es un fallo de
                  accesibilidad, no una preferencia.
                */}
                {/* Un solo número cuando la escala no es fluida: «16 → 16
                    px» sería escribir dos veces lo mismo con una flecha
                    en medio. */}
                <span className="medidas">
                  <b>
                    {ajustes.fluida
                      ? `${paso.minPx.toFixed(0)} → ${paso.maxPx.toFixed(0)} px`
                      : `${paso.minPx.toFixed(0)} px`}
                    {paso.indice === 0 && <span className="es-base"> {tr('esLaBase')}</span>}
                  </b>
                  {ajustes.fluida
                    ? `${cifra(paso.minPx / RAIZ_PX, 2)} → ${cifra(paso.maxPx / RAIZ_PX, 2)} rem`
                    : `${cifra(paso.minPx / RAIZ_PX, 2)} rem`}{' '}
                  · {cifra(paso.interlineado, 2)}
                </span>
              </div>
            ))}
          </div>

          {ajustes.omitidos.length > 0 && (
            <p className="mt-3 text-[length:var(--fs-small)] text-ink-soft">
              {tr('saltadosAyuda')}
            </p>
          )}
        </section>

        {/* -------- La tabla: el motivo de la herramienta --------
            Plegada, y no porque importe poco: importa mucho, pero solo
            cuando ya se ha decidido la escala. Abierta desde el principio
            eran cuarenta números encima de la rampa. */}
        {ajustes.fluida && (
          <details data-tour="tabla" className="acordeon">
            <summary>{tr('tablaTitulo')}</summary>

            <div className="cuerpo">
              <p className="intro">{tr('tablaIntro')}</p>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-[length:var(--fs-small)] tabular-nums">
                  <thead>
                    <tr className="border-b border-line text-left">
                      <th scope="col" className="p-3 font-medium text-ink-muted">
                        {tr('columnaPaso')}
                      </th>
                      {ANCHOS_TABLA.map((ancho) => (
                        <th
                          key={ancho}
                          scope="col"
                          className="p-3 text-right font-medium text-ink-muted"
                        >
                          {ancho}
                        </th>
                      ))}
                      <th
                        scope="col"
                        className="p-3 text-right font-medium text-ink-muted"
                        title={tr('llenoAyuda')}
                      >
                        {tr('columnaLlenoCorto')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {alReves
                      .filter((paso) => !paso.omitido)
                      .map((paso) => {
                        const lleno = anchoParaFraccion(paso, 0.95, ajustes);
                        return (
                          <tr key={paso.indice} className="border-b border-line last:border-0">
                            {/* El nombre se edita aquí y no en una lista aparte:
                          es donde ya se está mirando cada paso, y ahorra
                          repetir la escala entera en otro sitio. */}
                            <th scope="row" className="p-2 text-left font-normal">
                              <span className="sr-only">{paso.nombre}</span>
                              <span className="flex items-center font-mono text-ink">
                                <span aria-hidden="true" className="pl-1 text-ink-soft">
                                  --{ajustes.prefijo}-
                                </span>
                                <input
                                  type="text"
                                  value={
                                    ajustes.nombres[String(paso.indice)] ?? String(paso.indice)
                                  }
                                  spellCheck={false}
                                  autoComplete="off"
                                  aria-label={`${tr('nombreDe')} ${paso.indice}`}
                                  className="w-24 rounded-md border border-transparent bg-transparent px-1 py-1 hover:border-line focus:border-line focus:outline-none"
                                  onChange={(e) => renombrar(paso.indice, e.target.value)}
                                />
                              </span>
                            </th>
                            {paso.enTabla.map((px, i) => (
                              <td key={ANCHOS_TABLA[i]} className="p-3 text-right text-ink-muted">
                                {px.toFixed(1)}
                              </td>
                            ))}
                            <td className="p-3 text-right text-ink-soft">
                              {lleno === null ? tr('nunca') : `${lleno} px`}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <p className="border-t border-line px-4 py-3 text-[length:var(--fs-small)] text-ink-soft">
                {tr('llenoAyuda')}
              </p>
            </div>
          </details>
        )}

        {/* -------- El CSS, también plegado --------
            Es el final del camino, no el principio: se abre cuando la
            escala ya está decidida y hay algo que llevarse. */}
        <details data-tour="css" className="acordeon">
          {/*
            El botón de copiar, en la misma fila que el título.

            Va DENTRO del `<summary>`, que es la única forma de que se
            vea con el acordeón cerrado — todo lo demás que hay en un
            `<details>` se esconde al cerrarlo. Y es lo que queremos:
            quien vuelve a por su CSS ya sabe lo que hay dentro, así que
            copiarlo sin abrirlo es un clic menos.

            El precio es que hay que parar el evento a mano: pulsar
            cualquier cosa dentro de un `summary` abre o cierra el
            acordeón, y copiar no debería hacer ni lo uno ni lo otro.
          */}
          <summary>
            <span className="flex-1">{tr('cssTitulo')}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                copiarCss();
              }}
            >
              {copiado === 'css' ? (
                <CheckIcon aria-hidden="true" />
              ) : (
                <CopyIcon aria-hidden="true" />
              )}
              {copiado === 'css' ? tr('copiado') : tr('copiarCss')}
            </Button>
          </summary>

          <div className="cuerpo grid gap-3 p-4">
            <p className="text-[length:var(--fs-small)] text-ink-soft">{tr('cssRaiz')}</p>

            <pre className="overflow-x-auto rounded-lg border border-line bg-surface-2 p-4 font-mono text-[0.78rem] leading-relaxed text-ink">
              <code>{css}</code>
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- auxiliares

function Numero({
  id,
  etiqueta,
  valor,
  min,
  max,
  paso,
  unidad,
  onCambio,
}: {
  id: string;
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  paso: number;
  unidad?: string;
  onCambio: (valor: number) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-[length:var(--fs-small)]">
        {etiqueta}
      </Label>
      <div className="flex items-center gap-1.5">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          step={paso}
          value={valor}
          className="tabular-nums"
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onCambio(Math.max(min, Math.min(max, n)));
          }}
        />
        {unidad && <span className="text-[length:var(--fs-small)] text-ink-soft">{unidad}</span>}
      </div>
    </div>
  );
}

function Razon({
  id,
  etiqueta,
  valor,
  lang,
  personalizada,
  onCambio,
}: {
  id: string;
  etiqueta: string;
  valor: number;
  lang: Lang;
  personalizada: string;
  onCambio: (valor: number) => void;
}) {
  const conocida = RAZONES.find((r) => Math.abs(r.valor - valor) < 0.0005);

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          min={0.5}
          max={3}
          step={0.001}
          value={valor}
          className="w-24 shrink-0 tabular-nums"
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onCambio(Math.max(0.5, Math.min(3, n)));
          }}
        />
        <Select
          value={conocida ? String(conocida.valor) : 'personalizada'}
          onValueChange={(v) => {
            if (v !== 'personalizada') onCambio(Number(v));
          }}
        >
          <SelectTrigger className="w-full" aria-label={etiqueta}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {!conocida && <SelectItem value="personalizada">{personalizada}</SelectItem>}
            {RAZONES.map((r) => (
              <SelectItem key={r.valor} value={String(r.valor)}>
                {r.valor} · {t(NOMBRES_RAZON[r.clave], lang)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
