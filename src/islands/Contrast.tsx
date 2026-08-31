/**
 * La herramienta de contraste.
 *
 * Toda la aritmética vive en src/lib/contrast.ts; aquí solo está la
 * interfaz y el estado. La separación importa porque los números son lo
 * que hay que poder comprobar contra WebAIM y contra la demo de APCA, y
 * eso se hace mejor sobre funciones sueltas que a través de una pantalla.
 *
 * El estado va en la dirección, no en el navegador: compartir un cálculo
 * es pegar un enlace.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowsLeftRightIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import SelectorColor from './SelectorColor';
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
import { CONTRASTE as C, GROSORES } from '@/i18n/contrast';
import {
  componerSobre,
  esPolaridadClara,
  hayDesacuerdo,
  leerColor,
  medirApca,
  medirWcag,
  sugerirColor,
} from '@/lib/contrast';
import { escribirParams, leerParams } from '@/lib/url-state';

// Los colores de partida son los del propio sitio en modo claro: así lo
// primero que se ve es un caso real que aprueba, y no dos grises inventados.
const TEXTO_INICIAL = '#101314';
const FONDO_INICIAL = '#f6f7f6';
const PX_INICIAL = 16;
const PESO_INICIAL = 400;

interface Props {
  lang: Lang;
}

export default function Contrast({ lang }: Props) {
  const tr = (clave: keyof typeof C) => t(C[clave], lang);

  // De cada color se guardan dos cosas: lo que hay escrito en el campo, y
  // el último valor que sí era un color. Así, mientras se teclea «#10131»
  // los resultados no parpadean ni desaparecen.
  const [textoBruto, setTextoBruto] = useState(TEXTO_INICIAL);
  const [textoHex, setTextoHex] = useState(TEXTO_INICIAL);
  const [textoAlpha, setTextoAlpha] = useState(1);

  const [fondoBruto, setFondoBruto] = useState(FONDO_INICIAL);
  const [fondoHex, setFondoHex] = useState(FONDO_INICIAL);

  const [px, setPx] = useState(PX_INICIAL);
  const [peso, setPeso] = useState(PESO_INICIAL);

  const [soportaCuentagotas, setSoportaCuentagotas] = useState(false);
  // Hasta que no se haya leído el enlace, no se escribe: si no, el efecto
  // que escribe correría con los valores por defecto y borraría de la
  // dirección justo lo que el otro efecto acaba de leer de ella.
  const [enlaceLeido, setEnlaceLeido] = useState(false);

  const cambiarTexto = useCallback((valor: string) => {
    setTextoBruto(valor);
    const color = leerColor(valor);
    if (color) {
      setTextoHex(color.hex);
      setTextoAlpha(color.alpha);
    }
  }, []);

  const cambiarFondo = useCallback((valor: string) => {
    setFondoBruto(valor);
    const color = leerColor(valor);
    // El fondo se toma siempre opaco: no sabemos qué hay detrás de él.
    if (color) setFondoHex(color.hex);
  }, []);

  // ---------- la dirección ----------

  // Al llegar, lo que diga el enlace. Va en un efecto y no en el estado
  // inicial para que el HTML que genera el servidor y el primer render del
  // navegador coincidan.
  useEffect(() => {
    const params = leerParams();

    const enlaceTexto = params.get('t');
    if (enlaceTexto) cambiarTexto(enlaceTexto.startsWith('#') ? enlaceTexto : `#${enlaceTexto}`);

    const enlaceFondo = params.get('b');
    if (enlaceFondo) cambiarFondo(enlaceFondo.startsWith('#') ? enlaceFondo : `#${enlaceFondo}`);

    const enlacePx = Number(params.get('s'));
    if (Number.isFinite(enlacePx) && enlacePx >= 8 && enlacePx <= 200) setPx(enlacePx);

    const enlacePeso = Number(params.get('w'));
    if (GROSORES.some((g) => g.valor === enlacePeso)) setPeso(enlacePeso);

    setSoportaCuentagotas(typeof window !== 'undefined' && 'EyeDropper' in window);
    setEnlaceLeido(true);
  }, [cambiarTexto, cambiarFondo]);

  // Y al cambiar algo, la dirección lo refleja. Solo lo que se aparta de lo
  // que hay por defecto, para no ensuciar un enlace que no hace falta.
  useEffect(() => {
    if (!enlaceLeido) return;

    escribirParams({
      t: textoHex === TEXTO_INICIAL ? null : textoHex.slice(1),
      b: fondoHex === FONDO_INICIAL ? null : fondoHex.slice(1),
      s: px === PX_INICIAL ? null : String(px),
      w: peso === PESO_INICIAL ? null : String(peso),
    });
  }, [enlaceLeido, textoHex, fondoHex, px, peso]);

  // ---------- las cuentas ----------

  const medidas = useMemo(() => {
    const efectivo = componerSobre({ hex: textoHex, alpha: textoAlpha, formato: 'rgb' }, fondoHex);
    const forma = { px, peso };
    const wcag = medirWcag(efectivo, fondoHex, forma);
    const apca = medirApca(efectivo, fondoHex, forma);

    return {
      efectivo,
      wcag,
      apca,
      sugerencia: sugerirColor(efectivo, fondoHex, wcag.umbralAA),
      desacuerdo: hayDesacuerdo(wcag, apca),
    };
  }, [textoHex, textoAlpha, fondoHex, px, peso]);

  const { efectivo, wcag, apca, sugerencia, desacuerdo } = medidas;

  const textoEsColor = leerColor(textoBruto) !== null;
  const fondoEsColor = leerColor(fondoBruto) !== null;

  // ---------- acciones ----------

  function intercambiar() {
    const bruto = textoBruto;
    const hex = textoHex;
    cambiarTexto(fondoBruto);
    setFondoBruto(bruto);
    setFondoHex(hex);
    setTextoAlpha(1);
  }

  async function usarCuentagotas(destino: 'texto' | 'fondo') {
    const Api = typeof window !== 'undefined' ? window.EyeDropper : undefined;
    if (!Api) return;
    try {
      const { sRGBHex } = await new Api().open();
      if (destino === 'texto') cambiarTexto(sRGBHex);
      else cambiarFondo(sRGBHex);
    } catch {
      // Cerrar el cuentagotas con Escape lanza; no es un error que contar.
    }
  }

  // ---------- pintado ----------

  /*
    ---------------------------------------------------------------
    Dos columnas, y a la derecha lo que sale de ellas.

    Hubo un intento de ponerlo todo en filas a lo ancho: los dos
    selectores de color uno al lado del otro, y debajo la muestra y los
    veredictos. La página bajaba de 1316 px a 1277, así que sobre el
    papel salía ganando — y era peor.

    El motivo es el recorrido de quien llega. A un comprobador de
    contraste se entra con dos colores ya decididos y una sola pregunta:
    «¿esto pasa?». Con todo en filas, la respuesta quedaba 460 px más
    abajo que antes: primero dos selectores enormes, luego la muestra, y
    al final el número. Se había optimizado el alto de la página a costa
    de esconder lo único que la gente viene a ver.

    En dos columnas los selectores y la respuesta ocupan el mismo alto a
    la vez —la página mide lo que mida la más larga, no la suma— y todo
    queda a la altura de los ojos desde el primer momento, sin moverse
    mientras se toquetean los colores.

    El orden de la derecha es: la muestra, el veredicto, y el color que
    sí pasaría. Primero lo que acabas de hacer, luego la nota que le
    ponen, luego la salida si suspende.

    La muestra va arriba y el número debajo, y no al revés, porque la
    muestra es lo que se acaba de fabricar con los dos selectores de la
    izquierda: queda a la misma altura que ellos y cambia a la vez.
    Cuesta unos 190 px de bajada al veredicto, que es un precio muy
    distinto de los 460 que costaba ponerlo todo en filas.
    ---------------------------------------------------------------
  */
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,var(--col-controles))_minmax(0,1fr)] lg:items-start">
      {/* ---------------- Los dos colores ---------------- */}
      <div className="columna-herramienta gap-4">
        <SelectorColor
          lang={lang}
          id="color-texto"
          etiqueta={tr('colorTexto')}
          bruto={textoBruto}
          hex={textoHex}
          valido={textoEsColor}
          onCambio={cambiarTexto}
          onCuentagotas={soportaCuentagotas ? () => usarCuentagotas('texto') : undefined}
        />

        {/* Con solo el icono y sin borde pasaba desapercibido, y es la
            acción que más se repite: se prueba un par, se le da la vuelta
            y se vuelve a mirar. Las dos líneas a los lados dicen que lo
            que hay arriba y lo que hay abajo son las dos cosas que
            cambia. */}
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
          <Button
            variant="outline"
            size="sm"
            onClick={intercambiar}
            title={tr('intercambiarLargo')}
          >
            <ArrowsLeftRightIcon aria-hidden="true" />
            {tr('intercambiar')}
          </Button>
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </div>

        <SelectorColor
          lang={lang}
          id="color-fondo"
          etiqueta={tr('colorFondo')}
          bruto={fondoBruto}
          hex={fondoHex}
          valido={fondoEsColor}
          onCambio={cambiarFondo}
          onCuentagotas={soportaCuentagotas ? () => usarCuentagotas('fondo') : undefined}
        />

        {textoAlpha < 1 && (
          <p className="rounded-md border border-line bg-surface-2 p-3 text-[length:var(--fs-small)] text-ink-muted">
            {tr('avisoAlfa')} <code className="font-mono text-ink">{efectivo}</code>
          </p>
        )}
      </div>

      {/* ---------------- La respuesta ---------------- */}
      <div className="columna-herramienta gap-4">
        {/*
          -------- La muestra, con sus dos mandos dentro --------

          El tamaño y el grosor eran una tarjeta aparte, y no lo merecen:
          no son ajustes de la herramienta, son la forma de la letra que
          se está mirando justo debajo. Metidos en la cabecera de la
          muestra dejan de costar una tarjeta entera y quedan donde se ve
          su efecto.

          Que no son decoración se nota en los números de arriba: WCAG
          baja su umbral de 4,5:1 a 3:1 en cuanto el texto cuenta como
          grande, y APCA calcula con ellos el tamaño mínimo al que ese par
          se lee.
        */}
        <div className="overflow-hidden rounded-lg border border-line">
          <div
            data-tour="forma"
            className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-line bg-surface px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <Label htmlFor="tamano" className="text-ink-soft">
                {tr('tamano')}
              </Label>
              <Input
                id="tamano"
                type="number"
                min={8}
                max={200}
                value={px}
                onChange={(e) => setPx(Math.max(8, Math.min(200, Number(e.target.value) || 8)))}
                className="w-20"
              />
              <span className="text-[length:var(--fs-small)] text-ink-soft">px</span>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="grosor" className="text-ink-soft">
                {tr('grosor')}
              </Label>
              <Select value={String(peso)} onValueChange={(v) => setPeso(Number(v))}>
                <SelectTrigger id="grosor" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROSORES.map((g) => (
                    <SelectItem key={g.valor} value={String(g.valor)}>
                      {g.valor} · {t(g.nombre, lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {wcag.grande && (
              <p className="text-[length:var(--fs-small)] text-ink-soft">
                <span className="font-medium text-ink-muted">{tr('textoGrande')}.</span>{' '}
                {tr('textoGrandePor')}
              </p>
            )}
          </div>

          {/* El color real, al tamaño real, sobre el fondo real. */}
          <div
            data-tour="muestra"
            className="grid min-h-28 place-items-center p-6"
            style={{ background: fondoHex }}
          >
            <p
              className="text-center"
              style={{
                color: efectivo,
                fontSize: `${px}px`,
                fontWeight: peso,
                lineHeight: 1.35,
              }}
            >
              {tr('muestra')}
            </p>
          </div>
        </div>

        {/* Los dos veredictos, uno al lado del otro y del mismo alto.
            WCAG trae tres filas y APCA una, así que la celda de la
            derecha apila dos módulos: el de APCA y, cuando los dos no
            coinciden, el que lo explica. Apilar en vez de estirar es lo
            que mantiene la fila cuadrada. */}
        <div className="grid items-stretch gap-4 sm:grid-cols-2">
          {/* -------- WCAG 2.2 -------- */}
          <section
            data-tour="wcag"
            className="flex h-full flex-col rounded-lg border border-line bg-surface p-4"
          >
            <Cabecera titulo={tr('wcagTitulo')} etiqueta={tr('wcagEtiqueta')} destacada />

            <p className="mt-3.5 font-mono text-[1.75rem] leading-none font-semibold text-ink tabular-nums">
              {wcag.razon.toFixed(2)}
              <span className="text-base text-ink-soft">:1</span>
            </p>
            <p className="mt-1 text-[length:var(--fs-small)] text-ink-soft">{tr('wcagRazon')}</p>

            <div className="mt-4 grid gap-2 text-[length:var(--fs-small)]">
              <Fila
                nombre={`AA · ${wcag.umbralAA}:1`}
                pasa={wcag.pasaAA}
                si={tr('pasa')}
                no={tr('noPasa')}
              />
              <Fila
                nombre={`AAA · ${wcag.umbralAAA}:1`}
                pasa={wcag.pasaAAA}
                si={tr('pasa')}
                no={tr('noPasa')}
              />
              <Fila
                nombre={tr('wcagComponentes')}
                pasa={wcag.pasaComponentes}
                si={tr('pasa')}
                no={tr('noPasa')}
              />
            </div>
          </section>

          <div className="flex h-full flex-col gap-4">
            {/* -------- APCA -------- */}
            <section
              data-tour="apca"
              className="flex flex-1 flex-col rounded-lg border border-line bg-surface p-4"
            >
              <Cabecera titulo={tr('apcaTitulo')} etiqueta={tr('apcaEtiqueta')} />

              <p className="mt-3.5 font-mono text-[1.75rem] leading-none font-semibold text-ink tabular-nums">
                {apca.lc.toFixed(1)}
                <span className="text-base text-ink-soft"> Lc</span>
              </p>
              <p className="mt-1 text-[length:var(--fs-small)] text-ink-soft">
                {tr('apcaLc')} ·{' '}
                {esPolaridadClara(apca.lc) ? tr('apcaPolaridadClara') : tr('apcaPolaridadOscura')}
              </p>

              <div className="mt-4 text-[length:var(--fs-small)]">
                {apca.estado === 'pasa' && (
                  <Fila
                    nombre={`${tr('apcaMinimo')}: ${apca.minimoPx} px`}
                    pasa
                    si={tr('apcaPasa')}
                    no={tr('apcaInsuficiente')}
                  />
                )}
                {apca.estado === 'insuficiente' && (
                  <Fila
                    nombre={`${tr('apcaMinimo')}: ${apca.minimoPx} px`}
                    pasa={false}
                    si={tr('apcaPasa')}
                    no={tr('apcaInsuficiente')}
                  />
                )}
                {apca.estado === 'solo-decorativo' && (
                  <>
                    <Fila
                      nombre={tr('apcaSoloDecorativo')}
                      pasa={false}
                      si={tr('apcaPasa')}
                      no={tr('apcaInsuficiente')}
                    />
                    <p className="mt-2 text-ink-soft">{tr('apcaSoloDecorativoPor')}</p>
                  </>
                )}
                {apca.estado === 'prohibido' && (
                  <>
                    <Fila
                      nombre={tr('apcaProhibido')}
                      pasa={false}
                      si={tr('apcaPasa')}
                      no={tr('apcaInsuficiente')}
                    />
                    <p className="mt-2 text-ink-soft">{tr('apcaProhibidoPor')}</p>
                  </>
                )}
              </div>
            </section>

            {/* -------- Cuando los dos no dicen lo mismo -------- */}
            {desacuerdo && (
              <section
                data-tour="desacuerdo"
                className="rounded-lg border border-line bg-surface-2 p-4"
              >
                <h3 className="text-[length:var(--fs-h3)] font-semibold text-ink">
                  {tr('desacuerdoTitulo')}
                </h3>
                <p className="mt-2 text-[length:var(--fs-small)] text-ink-muted">
                  {wcag.pasaAA ? tr('desacuerdoWcagSi') : tr('desacuerdoApcaSi')}
                </p>
              </section>
            )}
          </div>
        </div>

        {/* -------- El color que sí pasaría --------
            Solo aparece cuando hace falta, y entonces cierra el
            recorrido: la pregunta era «¿pasa?», la respuesta fue «no», y
            esto es la salida. */}
        {!wcag.pasaAA && (
          <section data-tour="sugerencia" className="rounded-lg border border-line bg-surface p-4">
            <h3 className="text-[length:var(--fs-h3)] font-semibold text-ink">
              {tr('sugerenciaTitulo')}
            </h3>

            {sugerencia ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div
                    className="grid h-14 w-20 shrink-0 place-items-center rounded-md border border-line"
                    style={{ background: fondoHex }}
                  >
                    <span style={{ color: sugerencia.hex, fontSize: `${px}px`, fontWeight: peso }}>
                      Aa
                    </span>
                  </div>

                  <div className="grid min-w-0 gap-0.5">
                    <code className="font-mono text-[length:var(--fs-h3)] text-ink">
                      {sugerencia.hex}
                    </code>
                    <p className="text-[length:var(--fs-small)] text-ink-soft tabular-nums">
                      {sugerencia.direccion === 'oscurecer'
                        ? tr('sugerenciaOscurecer')
                        : tr('sugerenciaAclarar')}{' '}
                      · {sugerencia.razon.toFixed(2)}:1 · {sugerencia.lc.toFixed(1)} Lc
                    </p>
                  </div>

                  {/*
                    Seguía leyéndose como una etiqueta y no como algo que
                    se pulsa. Tres motivos, los tres arreglados aquí:

                      · Medía 32 px de alto con texto de 12,8. A ese
                        tamaño una caja de color con una palabra dentro es
                        un tag, no un botón.
                      · Llevaba una bolita del color delante, que es justo
                        lo que hace que algo parezca un tag — y además
                        sobraba: el «Aa» de al lado ya enseña el color.
                      · Iba en el teal de la marca y no en el acento de la
                        herramienta, que aquí es morado. Un botón de un
                        color que no aparece en ningún otro sitio de la
                        página se lee como una insignia.
                  */}
                  <Button
                    onClick={() => cambiarTexto(sugerencia.hex)}
                    className="ml-auto h-10 border border-[var(--acento)] bg-[var(--acento)] px-4 text-[0.9rem] font-medium text-[var(--brand-ink)] hover:bg-[color-mix(in_srgb,var(--acento)_86%,var(--ink))]"
                  >
                    {tr('sugerenciaUsar')}
                  </Button>
                </div>

                <p className="mt-3 text-[length:var(--fs-small)] text-ink-soft">
                  {tr('sugerenciaComo')}
                  {sugerencia.cromaAjustado && ` ${tr('sugerenciaCroma')}`}
                </p>
              </>
            ) : (
              <p className="mt-2 text-[length:var(--fs-small)] text-ink-muted">
                {tr('sugerenciaNinguna')}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------- auxiliares

function Cabecera({
  titulo,
  etiqueta,
  destacada = false,
}: {
  titulo: string;
  etiqueta: string;
  destacada?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="text-[length:var(--fs-h3)] font-semibold text-ink">{titulo}</h3>
      <span
        className={
          destacada
            ? 'rounded-full bg-primary px-2 py-0.5 text-[0.7rem] font-medium text-primary-foreground'
            : 'rounded-full border border-line px-2 py-0.5 text-[0.7rem] font-medium text-ink-soft'
        }
      >
        {etiqueta}
      </span>
    </div>
  );
}

function Fila({ nombre, pasa, si, no }: { nombre: string; pasa: boolean; si: string; no: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
      <span className="text-ink-muted">{nombre}</span>
      <span className={pasa ? 'font-medium text-brand' : 'font-medium text-[var(--danger)]'}>
        {pasa ? si : no}
      </span>
    </div>
  );
}
