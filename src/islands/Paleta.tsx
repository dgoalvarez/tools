/**
 * La herramienta de paletas.
 *
 * Genera la rampa, sí — eso lo hace cualquiera. Lo que aquí importa es lo
 * que dice de cada paso: si aguanta texto encima y con qué tinta, si el
 * gamut se comió parte de su croma, y cuál de los once es exactamente el
 * color que pegaste. Una paleta que no contesta a eso obliga a llevarse
 * cada shade a otra herramienta para comprobarlo.
 *
 * La aritmética vive en `src/lib/rampa.ts`. Aquí solo están el estado, la
 * cuadrícula y el panel de detalle.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, PencilSimpleIcon, PlusIcon, TrashIcon, WarningIcon } from '@phosphor-icons/react';

import AvisoFlotante from '@/components/AvisoFlotante';
import BotonCopiar from '@/components/BotonCopiar';
import SelectorColor from '@/islands/SelectorColor';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t, type Lang } from '@/i18n/config';
import { CONTRASTE as C } from '@/i18n/contrast';
import { PALETA as P } from '@/i18n/paleta';
import { leerColor } from '@/lib/contrast';
import {
  AJUSTES_INICIALES,
  LIMITES,
  aCss,
  aOklchCss,
  aplicarRetoque,
  buscarNombresRepetidos,
  construirPaleta,
  limpiarNombre,
  medirPaso,
  pasosIndistinguibles,
  retoquesQueRompen,
  nombresPaso,
  retoquesDormidos,
  soltarRetoque,
  type Ajustes,
  type Rampa,
  type Tonalidad,
} from '@/lib/rampa';
import { escribirParams, leerParams } from '@/lib/url-state';

/** El texto con el que se juzga cada paso: cuerpo normal. */
const TEXTO = { px: 16, peso: 400 };

/**
 * Con lo que se abre la herramienta.
 *
 * Tres tonalidades y no una: lo que distingue a esta herramienta es que
 * las rampas de varias tonalidades comparten escalera, y con una sola no
 * se ve. Los tres colores son los de una interfaz cualquiera —principal,
 * bien y mal— para que la primera pantalla ya se parezca a algo útil.
 */
const SEMILLAS = ['#3b82f6', '#16a34a', '#dc2626'] as const;

/**
 * Los nombres de fábrica: color1, color2, color3.
 *
 * Neutros a propósito, y no «azul», «verde» y «rojo». Un nombre de
 * variable no tiene idioma, y poner el color en él —«azul»— envejece mal:
 * en cuanto alguien cambia ese azul por un turquesa, la variable se llama
 * «azul» y no lo es. Que cada quien los llame como se llamen en su
 * sistema: «marca», «peligro», «acento».
 */
function iniciales(): Tonalidad[] {
  return SEMILLAS.map((semilla, i) => ({
    id: ['a', 'b', 'c'][i],
    nombre: `color${i + 1}`,
    semilla,
    anclaForzada: null,
    retoques: {},
  }));
}

/** Las claves de la dirección, cortas para que el enlace no sea un muro. */
const CLAVES: Record<keyof Ajustes, string> = {
  pasos: 'n',
  claridadMax: 'lx',
  claridadMin: 'ln',
  cromaCentro: 'cc',
  derivaTono: 'dt',
};

const BOTON =
  'border border-[var(--solido)] bg-[var(--solido)] font-semibold text-[var(--solido-ink)] hover:bg-[color-mix(in_srgb,var(--solido)_86%,#000)]';

interface Props {
  lang: Lang;
}

export default function Paleta({ lang }: Props) {
  const tr = (clave: keyof typeof P) => t(P[clave], lang);

  const [tonalidades, setTonalidades] = useState<Tonalidad[]>(iniciales);
  const [ajustes, setAjustes] = useState<Ajustes>(AJUSTES_INICIALES);
  const [prefijo, setPrefijo] = useState('');
  const [enlaceLeido, setEnlaceLeido] = useState(false);

  /** Qué casilla acaba de copiarse: «idDeTonalidad/nombreDePaso». */
  const [copiado, setCopiado] = useState<string | null>(null);
  /** Lo que anuncia el aviso flotante. Lleva un contador para que copiar
      el mismo color dos veces vuelva a avisar. */
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  const [formato, setFormato] = useState<'oklch' | 'hex'>('hex');

  // ---------- al llegar ----------

  useEffect(() => {
    const p = leerParams();
    const leidos: Partial<Ajustes> = {};

    for (const [campo, clave] of Object.entries(CLAVES) as [keyof Ajustes, string][]) {
      const crudo = p.get(clave);
      if (crudo === null) continue;
      const n = Number(crudo);
      if (!Number.isFinite(n)) continue;
      const { min, max } = LIMITES[campo];
      leidos[campo] = Math.min(max, Math.max(min, n));
    }
    if (Object.keys(leidos).length) setAjustes((previo) => ({ ...previo, ...leidos }));

    const pre = p.get('p');
    if (pre !== null) setPrefijo(limpiarNombre(pre));

    /*
     * Las tonalidades viajan como «nombre:hex» separadas por comas, y la
     * lectura se sanea entera: el nombre pasa por `limpiarNombre` y el
     * color por `leerColor`. Lo que llega por una dirección acaba dentro
     * de un bloque de CSS que alguien va a pegar en su proyecto.
     */
    const crudas = p.get('t');
    if (crudas) {
      const leidas = crudas
        .split(',')
        .slice(0, 12)
        .map((trozo, i) => {
          const [nombre, hex] = trozo.split(':');
          const color = leerColor(hex ?? '');
          if (!color) return null;
          const leida: Tonalidad = {
            id: `u${i}`,
            nombre: limpiarNombre(nombre ?? '') || `color${i + 1}`,
            semilla: color.hex,
            anclaForzada: null,
            retoques: {},
          };
          return leida;
        })
        .filter((x): x is Tonalidad => x !== null);

      if (leidas.length) setTonalidades(leidas);
    }

    setEnlaceLeido(true);
  }, []);

  useEffect(() => {
    if (!enlaceLeido) return;

    const salida: Record<string, string | null> = {};
    for (const [campo, clave] of Object.entries(CLAVES) as [keyof Ajustes, string][]) {
      salida[clave] = ajustes[campo] === AJUSTES_INICIALES[campo] ? null : String(ajustes[campo]);
    }
    salida.p = prefijo || null;

    const dePartida = iniciales();
    const iguales =
      tonalidades.length === dePartida.length &&
      tonalidades.every(
        (t, i) => t.nombre === dePartida[i].nombre && t.semilla === dePartida[i].semilla
      );
    salida.t = iguales ? null : tonalidades.map((t) => `${t.nombre}:${t.semilla.slice(1)}`).join(',');

    escribirParams(salida);
  }, [enlaceLeido, ajustes, tonalidades, prefijo]);

  // ---------- lo calculado ----------

  const paleta = useMemo(() => {
    const conPrefijo = prefijo
      ? tonalidades.map((t) => ({ ...t, nombre: `${limpiarNombre(prefijo)}-${t.nombre}` }))
      : tonalidades;
    return construirPaleta(conPrefijo, ajustes);
  }, [tonalidades, ajustes, prefijo]);

  const repetidos = useMemo(() => buscarNombresRepetidos(paleta), [paleta]);
  const css = useMemo(() => aCss(paleta, formato), [paleta, formato]);
  const dormidos = useMemo(
    () => tonalidades.flatMap((t) => retoquesDormidos(t, ajustes)),
    [tonalidades, ajustes]
  );
  const juntos = useMemo(
    () => paleta.rampas.some((r) => pasosIndistinguibles(r.pasos).length > 0),
    [paleta]
  );
  const rompen = useMemo(
    () => paleta.rampas.some((r) => retoquesQueRompen(r.pasos).length > 0),
    [paleta]
  );

  // ---------- los mandos ----------

  const cambiar = useCallback(<K extends keyof Ajustes>(clave: K, valor: Ajustes[K]) => {
    setAjustes((previo) => ({ ...previo, [clave]: valor }));
  }, []);

  function editar(id: string, cambio: Partial<Tonalidad>) {
    setTonalidades((previas) => previas.map((t) => (t.id === id ? { ...t, ...cambio } : t)));
  }

  /** Sustituye una tonalidad entera por lo que devuelva la función. */
  function conTonalidad(id: string, hacer: (t: Tonalidad) => Tonalidad) {
    setTonalidades((previas) => previas.map((t) => (t.id === id ? hacer(t) : t)));
  }

  function anadir() {
    const n = tonalidades.length + 1;
    setTonalidades((previas) => [
      ...previas,
      {
        id: `n${Date.now()}`,
        nombre: `color${n}`,
        semilla: '#8b5cf6',
        anclaForzada: null,
        retoques: {},
      },
    ]);
  }

  function quitar(id: string) {
    setTonalidades((previas) => previas.filter((t) => t.id !== id));
  }

  /** Copia un color y deja la palomita puesta un par de segundos. */
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (reloj.current) clearTimeout(reloj.current);
    },
    []
  );

  async function copiarColor(clave: string, texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
      setAviso((previo) => ({ texto, n: (previo?.n ?? 0) + 1 }));
      if (reloj.current) clearTimeout(reloj.current);
      reloj.current = setTimeout(() => setCopiado(null), 1800);
    } catch {
      // Sin portapapeles el color sigue en el bloque de CSS de abajo.
    }
  }

  /**
   * ¿Los mandos están como salieron de fábrica?
   *
   * Cuatro mandos se desajustan enseguida, y volver a mano a 97, 18, 100
   * y 8 es imposible sin saberse los números de memoria.
   */
  const deFabrica = (Object.keys(AJUSTES_INICIALES) as (keyof Ajustes)[]).every(
    (k) => ajustes[k] === AJUSTES_INICIALES[k]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,var(--col-controles))_minmax(0,1fr)] lg:items-start">
      {/* ================= Los mandos ================= */}
      <div className="columna-herramienta gap-4">
        {/* ---------- Las tonalidades ---------- */}
        <fieldset className="tarjeta-control" data-tour="tonalidades">
          <legend className="sr-only">{tr('tonalidades')}</legend>
          <p className="titulo" aria-hidden="true">
            {tr('tonalidades')}
          </p>

          <div className="lista-tonalidades">
            {tonalidades.map((tono) => (
              <FilaTonalidad
                key={tono.id}
                tono={tono}
                lang={lang}
                nombresDePaso={nombresPaso(ajustes.pasos)}
                sePuedeQuitar={tonalidades.length > 1}
                onSemilla={(valor) => editar(tono.id, { semilla: valor })}
                onNombre={(valor) => editar(tono.id, { nombre: limpiarNombre(valor) })}
                onAncla={(valor) => editar(tono.id, { anclaForzada: valor })}
                onQuitar={() => quitar(tono.id)}
              />
            ))}
          </div>

          <Button size="sm" onClick={anadir} className={`justify-self-start ${BOTON}`}>
            <PlusIcon aria-hidden="true" />
            {tr('anadir')}
          </Button>

          {repetidos.length > 0 && (
            <p className="aviso-paleta">
              <WarningIcon aria-hidden="true" />
              {tr('nombreRepetido')}
            </p>
          )}
        </fieldset>

        {/* ---------- La rampa ---------- */}
        <fieldset className="tarjeta-control" data-tour="rampa">
          <legend className="sr-only">{tr('laRampa')}</legend>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="titulo" aria-hidden="true">
              {tr('laRampa')}
            </p>
            {/* Cuatro mandos se desajustan enseguida, y volver a mano a
                97/18/100/8 es imposible sin saberse los números. */}
            {!deFabrica && (
              <Button variant="outline" size="sm" onClick={() => setAjustes(AJUSTES_INICIALES)}>
                {tr('deFabrica')}
              </Button>
            )}
          </div>

          <div className="filas-ajuste">
            <div className="fila-ajuste">
              <Label htmlFor="pasos">{tr('pasos')}</Label>
              <div className="campo">
                {/* Solo impares: con un número par no hay paso central y
                    la rampa se queda sin «500», que es el nombre que todo
                    el mundo escribe primero. */}
                <select
                  id="pasos"
                  className="select-paleta"
                  value={ajustes.pasos}
                  onChange={(e) => cambiar('pasos', Number(e.target.value))}
                >
                  {[5, 7, 9, 11, 13, 15].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Deslizador
              id="lx"
              etiqueta={tr('claridadMax')}
              valor={Math.round(ajustes.claridadMax * 100)}
              min={LIMITES.claridadMax.min * 100}
              max={LIMITES.claridadMax.max * 100}
              paso={1}
              unidad="%"
              onCambio={(v) => cambiar('claridadMax', v / 100)}
            />
            <Deslizador
              id="ln"
              etiqueta={tr('claridadMin')}
              valor={Math.round(ajustes.claridadMin * 100)}
              min={LIMITES.claridadMin.min * 100}
              max={LIMITES.claridadMin.max * 100}
              paso={1}
              unidad="%"
              onCambio={(v) => cambiar('claridadMin', v / 100)}
            />
            <Deslizador
              id="cc"
              etiqueta={tr('cromaCentro')}
              valor={Math.round(ajustes.cromaCentro * 100)}
              min={0}
              max={200}
              paso={5}
              unidad="%"
              onCambio={(v) => cambiar('cromaCentro', v / 100)}
            />
            <Deslizador
              id="dt"
              etiqueta={tr('derivaTono')}
              valor={ajustes.derivaTono}
              min={LIMITES.derivaTono.min}
              max={LIMITES.derivaTono.max}
              paso={1}
              unidad="°"
              onCambio={(v) => cambiar('derivaTono', v)}
            />
          </div>

          <details className="acordeon acordeon-fino">
            <summary>{tr('queHaceCada')}</summary>
            <div className="cuerpo">
              <p className="intro">{tr('cromaAyuda')}</p>
              <p className="intro">{tr('derivaAyuda')}</p>
            </div>
          </details>
        </fieldset>

        {/* ---------- Los nombres ---------- */}
        <fieldset className="tarjeta-control" data-tour="nombres">
          <legend className="sr-only">{tr('nombres')}</legend>
          <p className="titulo" aria-hidden="true">
            {tr('nombres')}
          </p>

          <div className="filas-ajuste">
            <div className="fila-ajuste">
              <Label htmlFor="prefijo">{tr('prefijo')}</Label>
              <Input
                id="prefijo"
                value={prefijo}
                placeholder={lang === 'es' ? 'tema' : 'theme'}
                onChange={(e) => setPrefijo(limpiarNombre(e.target.value))}
                className="font-mono text-[0.8rem]"
              />
            </div>
          </div>

          <p className="ayuda-paleta">{tr('prefijoAyuda')}</p>
        </fieldset>
      </div>

      {/* ================= La paleta ================= */}
      <div className="columna-herramienta gap-5">
        <section className="tarjeta-control" data-tour="cuadricula">
          <div className="cabecera-paleta">
            <p className="titulo" aria-hidden="true">
              {tr('laPaleta')}
            </p>

            {/*
              El formato va aquí arriba y no en el bloque de CSS: es lo que
              decide qué se lleva uno al pulsar un color, así que tiene que
              estar a la vista de la cuadrícula, no dentro de un acordeón.
            */}
            <div className="segmento segmento-formato" role="group" aria-label={tr('formatoTitulo')}>
              {(['hex', 'oklch'] as const).map((f) => (
                <label key={f}>
                  <input
                    type="radio"
                    name="formato"
                    checked={formato === f}
                    onChange={() => setFormato(f)}
                  />
                  <span>{f === 'oklch' ? tr('formatoOklch') : tr('formatoHex')}</span>
                </label>
              ))}
            </div>
          </div>

          <p className="ayuda-paleta">{tr('pulsaParaCopiar')}</p>

          <div className="rejilla-paleta" style={{ '--pasos': ajustes.pasos } as React.CSSProperties}>
            <span className="esquina" aria-hidden="true" />
            {paleta.rampas[0]?.pasos.map((p) => (
              <span key={p.nombre} className="cabeza-paso" aria-hidden="true">
                {p.nombre}
              </span>
            ))}

            {paleta.rampas.map((rampa) => (
              <FilaPaleta
                key={rampa.tonalidad.id}
                rampa={rampa}
                lang={lang}
                formato={formato}
                copiado={copiado}
                onCopiar={copiarColor}
                onRetocar={(nombre, hex) =>
                  conTonalidad(rampa.tonalidad.id, (t) => aplicarRetoque(t, nombre, hex))
                }
                onDevolver={(nombre) =>
                  conTonalidad(rampa.tonalidad.id, (t) => soltarRetoque(t, nombre))
                }
              />
            ))}
          </div>

          {/*
            Los avisos van pegados a la cuadrícula, dentro de su tarjeta.

            Estaban en una tarjeta aparte más abajo, y ahí un aviso sobre
            un paso concreto quedaba a dos tarjetas de distancia del paso
            del que hablaba. Un aviso que no está junto a lo que avisa es
            un aviso que se lee tarde.
          */}
          <div className="avisos-paleta" data-tour="avisos">
            {paleta.rampas.some((r) => r.escaleraDeformada) && (
              <p className="aviso-paleta">
                <WarningIcon aria-hidden="true" />
                {tr('escaleraDeformada')}
              </p>
            )}
            {rompen && (
              <p className="aviso-paleta">
                <WarningIcon aria-hidden="true" />
                {tr('retoqueRompe')}
              </p>
            )}
            {juntos && (
              <p className="aviso-paleta">
                <WarningIcon aria-hidden="true" />
                {tr('pasosJuntos')}
              </p>
            )}
            {dormidos.length > 0 && (
              <p className="aviso-paleta">
                <WarningIcon aria-hidden="true" />
                {tr('retoquesDormidos')}
              </p>
            )}
            <p className="ayuda-paleta">{tr('soloSrgb')}</p>
          </div>
        </section>

        {/* =================================================================
             Las tintas, plegadas.

             Es información de comprobación, no de creación: se mira una
             vez cuando ya hay una paleta que convence, no mientras se
             está eligiendo el color. Abierta ocupaba tanto como la propia
             paleta y duplicaba su cuadrícula justo debajo.
           ================================================================= */}
        <details className="acordeon" data-tour="tintas">
          <summary>{tr('tintas')}</summary>
          <div className="cuerpo">
          <p className="intro">{tr('tintasIntro')}</p>

          <div className="rejilla-paleta" style={{ '--pasos': ajustes.pasos } as React.CSSProperties}>
            <span className="esquina" aria-hidden="true" />
            {paleta.rampas[0]?.pasos.map((p) => (
              <span key={p.nombre} className="cabeza-paso" aria-hidden="true">
                {p.nombre}
              </span>
            ))}

            {paleta.rampas.map((rampa) => (
              <FilaTintas key={rampa.tonalidad.id} rampa={rampa} lang={lang} />
            ))}
          </div>

          <ul className="leyenda-tintas">
            <li>
              <span className="chip" style={{ background: '#3b82f6', color: '#ffffff' }}>
                Aa
              </span>
              {tr('leyendaBlanco')}
            </li>
            <li>
              <span className="chip" style={{ background: '#bfd9fe', color: '#000000' }}>
                Aa
              </span>
              {tr('leyendaNegro')}
            </li>
            <li>
              <span className="chip vacio" aria-hidden="true">
                —
              </span>
              {tr('leyendaNinguno')}
            </li>
          </ul>
          </div>
        </details>

        {/* ---------- El CSS ---------- */}
        <details className="acordeon" data-tour="css">
          <summary>
            <span className="flex-1">{tr('cssTitulo')}</span>
            <BotonCopiar
              texto={() => css}
              etiqueta={tr('copiarCss')}
              etiquetaCopiado={tr('copiado')}
              onAntes={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          </summary>
          <div className="cuerpo">
            <p className="intro">{tr('cssIntro')}</p>
            <pre className="overflow-x-auto rounded-lg border border-line bg-surface-2 p-4 font-mono text-[0.78rem] leading-relaxed text-ink">
              <code>{css}</code>
            </pre>
          </div>
        </details>
      </div>

      <AvisoFlotante mensaje={aviso ? `${tr('copiadoAviso')} ${aviso.texto}` : null} />
    </div>
  );
}

// ------------------------------------------------------------- auxiliares

/**
 * Una fila de la lista de tonalidades.
 *
 * El color se elige con el MISMO selector que la herramienta de contraste
 * —hexadecimal, rgb(), oklch(), un nombre, el cuadro visual y las tres
 * barras— pero dentro de un popover.
 *
 * Flotando y no desplegado debajo: con seis tonalidades, abrir los
 * controles de una empujaba las otras cinco hacia abajo, y elegir un
 * color acababa moviendo de sitio la cuadrícula que estabas mirando.
 */
function FilaTonalidad({
  tono,
  lang,
  nombresDePaso,
  sePuedeQuitar,
  onSemilla,
  onNombre,
  onAncla,
  onQuitar,
}: {
  tono: Tonalidad;
  lang: Lang;
  nombresDePaso: string[];
  sePuedeQuitar: boolean;
  onSemilla: (valor: string) => void;
  onNombre: (valor: string) => void;
  onAncla: (valor: number | null) => void;
  onQuitar: () => void;
}) {
  const tr = (clave: keyof typeof P) => t(P[clave], lang);

  /*
   * El campo guarda lo tecleado tal cual, y NO se vuelve a rellenar desde
   * el color.
   *
   * Antes había un efecto que hacía `setBruto(tono.semilla)` cada vez que
   * el color cambiaba, y eso hacía imposible escribir un hexadecimal: al
   * teclear «#ff8» —que es un hex válido de tres dígitos— el color pasaba
   * a #ffff88 y el efecto reescribía el campo con esos seis caracteres.
   * Lo que se seguía tecleando se pegaba detrás y salía cualquier cosa.
   *
   * Todos los caminos que cambian el color —el cuadro, las barras, el
   * cuentagotas— pasan por `cambiar`, así que el campo nunca se queda
   * desincronizado sin que este componente se entere.
   */
  const [bruto, setBruto] = useState(tono.semilla);
  const color = leerColor(bruto);

  function cambiar(valor: string) {
    setBruto(valor);
    const leido = leerColor(valor);
    if (leido) onSemilla(leido.hex);
  }

  const [soportaCuentagotas, setSoportaCuentagotas] = useState(false);
  useEffect(() => {
    setSoportaCuentagotas(typeof window !== 'undefined' && 'EyeDropper' in window);
  }, []);

  async function usarCuentagotas() {
    const Api = typeof window !== 'undefined' ? window.EyeDropper : undefined;
    if (!Api) return;
    try {
      const { sRGBHex } = await new Api().open();
      cambiar(sRGBHex);
    } catch {
      // Cancelar el cuentagotas no es un error: se cierra y ya.
    }
  }

  return (
    <div className="fila-tonalidad">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="disparador-color"
            style={{ background: tono.semilla }}
            aria-label={`${tr('colorSemilla')} ${tono.nombre}`}
          />
        </PopoverTrigger>

        {/* Al lado y no debajo: debajo tapaba las otras tonalidades de la
            lista justo mientras se elige un color para compararlo con
            ellas. Radix lo voltea solo cuando no cabe. */}
        <PopoverContent side="right" align="start">
          <SelectorColor
            lang={lang}
            id={`semilla-${tono.id}`}
            etiqueta={`${tr('colorSemilla')} · ${tono.nombre}`}
            bruto={bruto}
            hex={tono.semilla}
            valido={color !== null}
            onCambio={cambiar}
            onCuentagotas={soportaCuentagotas ? usarCuentagotas : undefined}
            sinTarjeta
          />

          {/*
            El anclaje vive aquí, con el color, porque es una propiedad de
            ESTA tonalidad y no de la rampa entera. Sin este control, un
            amarillo se quedaba para siempre llamándose «200».
          */}
          <div className="fila-ajuste anclaje">
            <Label htmlFor={`ancla-${tono.id}`}>{tr('anclarEn')}</Label>
            <select
              id={`ancla-${tono.id}`}
              className="select-paleta"
              value={tono.anclaForzada ?? ''}
              onChange={(e) => onAncla(e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">{tr('anclaAuto')}</option>
              {nombresDePaso.map((nombre, i) => (
                <option key={nombre} value={i}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
        </PopoverContent>
      </Popover>

      <Input
        value={tono.nombre}
        aria-label={`${tr('nombreTonalidad')} ${tono.nombre}`}
        onChange={(e) => onNombre(e.target.value)}
        className="min-w-0 font-mono text-[0.8rem]"
      />

      {/* Contorno y no fantasma: un botón sin borde sobre una tarjeta no
          se lee como pulsable hasta que el puntero pasa por encima, y en
          una pantalla táctil no pasa por encima nunca. */}
      <div className="acciones-tonalidad">
        <Button
          variant="outline"
          size="icon"
          onClick={onQuitar}
          title={tr('quitar')}
          aria-label={`${tr('quitar')} ${tono.nombre}`}
          disabled={!sePuedeQuitar}
        >
          <TrashIcon aria-hidden="true" />
        </Button>
      </div>

      {/*
        El color se escribe AQUÍ, en la tarjeta, y no solo dentro del
        popover. Es lo que se toca de verdad —se pega un hexadecimal de
        una marca y ya está— y esconderlo detrás de un clic obligaba a
        abrir un panel para hacer lo más común.

        Acepta lo mismo que el campo de la herramienta de contraste:
        hexadecimal, rgb(), hsl(), oklch() o un nombre como «teal». El
        marcador de posición lo dice.
      */}
      <Input
        value={bruto}
        onChange={(e) => cambiar(e.target.value)}
        placeholder={t(C.formatoPlaceholder, lang)}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={color === null}
        aria-label={`${tr('colorSemilla')} ${tono.nombre}`}
        className="campo-semilla min-w-0 font-mono text-[0.8rem]"
      />
    </div>
  );
}

/** Una fila de la cuadrícula: el nombre y sus casillas, que copian. */
function FilaPaleta({
  rampa,
  lang,
  formato,
  copiado,
  onCopiar,
  onRetocar,
  onDevolver,
}: {
  rampa: Rampa;
  lang: Lang;
  formato: 'oklch' | 'hex';
  copiado: string | null;
  onCopiar: (clave: string, texto: string) => void;
  onRetocar: (nombre: string, hex: string) => void;
  onDevolver: (nombre: string) => void;
}) {
  const tr = (clave: keyof typeof P) => t(P[clave], lang);
  const nombre = rampa.tonalidad.nombre;

  return (
    <>
      <span className="nombre-fila">{nombre}</span>
      {rampa.pasos.map((paso) => {
        const clave = `${rampa.tonalidad.id}/${paso.nombre}`;
        const valor = formato === 'hex' ? paso.hex : aOklchCss(paso);

        return (
          <div key={paso.nombre} className="casilla-paleta" style={{ background: paso.hex }}>
            <button
              type="button"
              className="copiar"
              aria-label={`${tr('copiarColor')} ${nombre} ${paso.nombre}, ${valor}`}
              onClick={() => onCopiar(clave, valor)}
            >
              {copiado === clave ? (
                <CheckIcon
                  aria-hidden="true"
                  style={{ color: paso.l < 0.55 ? '#ffffff' : '#000000' }}
                />
              ) : (
                <span
                  className="marcas"
                  aria-hidden="true"
                  style={{ color: paso.l < 0.55 ? '#ffffff' : '#000000' }}
                >
                  {paso.ancla && <span className="punto-ancla" />}
                  {paso.tocado && <span className="punto-tocado" />}
                </span>
              )}
            </button>

            {/* Ajustar un paso a mano es raro y copiarlo es lo normal, así
                que el lápiz se esconde hasta que el puntero pasa por
                encima. En pantallas táctiles, donde no hay «encima», se
                queda siempre. */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="editar"
                  aria-label={`${tr('ajustar')} ${nombre} ${paso.nombre}`}
                  style={{ color: paso.l < 0.55 ? '#ffffff' : '#000000' }}
                >
                  <PencilSimpleIcon aria-hidden="true" />
                </button>
              </PopoverTrigger>

              <PopoverContent side="bottom" align="end">
                <div className="grid gap-3">
                  <div>
                    <p className="variable">{paso.variable}</p>
                    <p className="valores">
                      {paso.hex} · {aOklchCss(paso)}
                    </p>
                  </div>

                  {paso.ancla && <p className="ayuda-paleta">{tr('anclaExplicado')}</p>}
                  {paso.recortado && <p className="ayuda-paleta">{tr('recortadoExplicado')}</p>}

                  {/* El mismo selector que la semilla, no un cuadrado
                      del sistema: retocar un paso es elegir un color, y
                      elegir un color se hace igual en todo el sitio. */}
                  <SelectorColor
                    lang={lang}
                    id={`retoque-${rampa.tonalidad.id}-${paso.nombre}`}
                    etiqueta={tr('retocar')}
                    bruto={paso.hex}
                    hex={paso.hex}
                    valido
                    onCambio={(valor) => {
                      const leido = leerColor(valor);
                      if (leido) onRetocar(paso.nombre, leido.hex);
                    }}
                    sinTarjeta
                  />

                  {paso.tocado && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDevolver(paso.nombre)}
                      className="justify-self-start"
                    >
                      {tr('devolver')}
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        );
      })}
    </>
  );
}

/**
 * Una fila de la cuadrícula de tintas.
 *
 * La misma geometría que la paleta, pero cada casilla enseña con qué
 * color de texto se puede escribir encima. Es la pregunta que se le hace
 * de verdad a una muestra —«¿qué etiqueta le pongo?»— y estaba escondida
 * detrás de pulsar cada uno de los treinta y tres colores.
 */
function FilaTintas({ rampa, lang }: { rampa: Rampa; lang: Lang }) {
  const tr = (clave: keyof typeof P) => t(P[clave], lang);

  return (
    <>
      <span className="nombre-fila">{rampa.tonalidad.nombre}</span>
      {rampa.pasos.map((paso) => {
        const m = medirPaso(paso.hex, TEXTO);
        const blanco = m.conBlanco.wcag.pasaAA;
        const negro = m.conNegro.wcag.pasaAA;

        const titulo = blanco
          ? `${paso.nombre} · ${tr('leyendaBlanco')} (${m.conBlanco.wcag.razon.toFixed(2)}:1)`
          : negro
            ? `${paso.nombre} · ${tr('leyendaNegro')} (${m.conNegro.wcag.razon.toFixed(2)}:1)`
            : `${paso.nombre} · ${tr('leyendaNinguno')}`;

        return (
          <span
            key={paso.nombre}
            className={'casilla-tinta' + (blanco || negro ? '' : ' sin-tinta')}
            style={{ background: paso.hex, color: blanco ? '#ffffff' : '#000000' }}
            title={titulo}
          >
            <span className="sr-only">{titulo}</span>
            <span aria-hidden="true">{blanco || negro ? 'Aa' : '—'}</span>
          </span>
        );
      })}
    </>
  );
}

/** Una barra con su número al lado. */
function Deslizador({
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
  unidad: string;
  onCambio: (valor: number) => void;
}) {
  return (
    <div className="fila-deslizador">
      <Label htmlFor={id}>{etiqueta}</Label>
      <span className="valor" aria-hidden="true">
        {valor}
        {unidad}
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={(e) => onCambio(Number(e.target.value))}
      />
    </div>
  );
}
