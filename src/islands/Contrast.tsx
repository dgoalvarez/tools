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

  return (
    <div className="columna-herramienta gap-6">
      {/*
        ---------------- Los dos colores ----------------

        Uno al lado del otro y no uno encima del otro. Apilados, los dos
        planos de color se comían 760 px de alto ellos solos y empujaban
        todo lo demás fuera de la pantalla; en fila ocupan la mitad y
        además se ven juntos, que es lo que se está comparando.
      */}
      <div>
        {/* La indicación de formato, arriba del todo y no al final.
            Estaba debajo de las dos tarjetas, y ahí llegaba tarde: dice
            cómo se puede escribir un color, así que tiene que leerse
            ANTES de escribir el primero. */}
        <p className="mb-2.5 text-[var(--fs-small)] text-ink-soft">{tr('formatoLibre')}</p>

        <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
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
              acción que más se repite: se prueba un par, se le da la
              vuelta y se vuelve a mirar. Entre las dos tarjetas dice
              además de qué va: cambia una por la otra. */}
          <Button
            variant="outline"
            size="sm"
            onClick={intercambiar}
            title={tr('intercambiarLargo')}
            className="justify-self-center"
          >
            <ArrowsLeftRightIcon aria-hidden="true" />
            {tr('intercambiar')}
          </Button>

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
        </div>

        {textoAlpha < 1 && (
          <p className="mt-3 rounded-md border border-line bg-surface-2 p-3 text-[var(--fs-small)] text-ink-muted">
            {tr('avisoAlfa')} <code className="font-mono text-ink">{efectivo}</code>
          </p>
        )}
      </div>

      {/* ---------------- Resultados ---------------- */}
      <div className="columna-herramienta gap-5">
        {/*
          El tamaño y el grosor estaban al final de la columna de
          controles, detrás de un scroll, y pasaban por decoración. No lo
          son: WCAG baja su umbral de 4,5:1 a 3:1 en cuanto el texto cuenta
          como grande, y APCA calcula con ellos el tamaño mínimo al que ese
          par se lee. Son dos entradas del cálculo, así que van donde está
          el cálculo y encima de la muestra que cambian.
        */}
        {/* La forma de la letra y la muestra comparten fila y alto: son
            la misma pregunta —«¿cómo se ve esto de verdad?»— y separadas
            en dos filas gastaban 90 px en un hueco entre ellas. */}
        <div className="grid items-stretch gap-4 md:grid-cols-[minmax(0,var(--col-controles))_minmax(0,1fr)]">
          <div className="tarjeta-control h-full content-center sm:grid-cols-2" data-tour="forma">
            <div className="grid gap-1.5">
              <Label htmlFor="tamano">{tr('tamano')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tamano"
                  type="number"
                  min={8}
                  max={200}
                  value={px}
                  onChange={(e) => setPx(Math.max(8, Math.min(200, Number(e.target.value) || 8)))}
                />
                <span className="text-[var(--fs-small)] text-ink-soft">px</span>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="grosor">{tr('grosor')}</Label>
              <Select value={String(peso)} onValueChange={(v) => setPeso(Number(v))}>
                <SelectTrigger id="grosor" className="w-full">
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
              <p className="text-[var(--fs-small)] text-ink-soft sm:col-span-2">
                <span className="font-medium text-ink-muted">{tr('textoGrande')}.</span>{' '}
                {tr('textoGrandePor')}
              </p>
            )}
          </div>

          {/* La muestra: el color real, al tamaño real, sobre el fondo real. */}
          <div
            data-tour="muestra"
            className="grid min-h-28 place-items-center rounded-lg border border-line p-6"
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
        {/* Dos columnas cuando el par aprueba, tres cuando no: la
            sugerencia solo existe entonces, y con `grid-cols-2` fijo
            habría caído a una fila propia dejando medio hueco al lado. */}
        <div
          className={`grid items-stretch gap-4 sm:grid-cols-2 ${
            wcag.pasaAA ? '' : 'lg:grid-cols-3'
          }`}
        >
          {/* -------- WCAG 2.2 -------- */}
          <section
            data-tour="wcag"
            className="flex h-full flex-col rounded-lg border border-line bg-surface p-5"
          >
            <Cabecera titulo={tr('wcagTitulo')} etiqueta={tr('wcagEtiqueta')} destacada />

            <p className="mt-4 font-mono text-4xl leading-none font-semibold text-ink tabular-nums">
              {wcag.razon.toFixed(2)}
              <span className="text-xl text-ink-soft">:1</span>
            </p>
            <p className="mt-1 text-[var(--fs-small)] text-ink-soft">{tr('wcagRazon')}</p>

            {/* Con la tarjeta a media pantalla, la etiqueta y su
                veredicto quedaban a 400 px uno de otro y había que
                recorrer la línea entera para emparejarlos. */}
            <div className="mt-4 grid max-w-[26rem] gap-2 text-[var(--fs-small)]">
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
              className="flex flex-1 flex-col rounded-lg border border-line bg-surface p-5"
            >
              <Cabecera titulo={tr('apcaTitulo')} etiqueta={tr('apcaEtiqueta')} />

              <p className="mt-4 font-mono text-4xl leading-none font-semibold text-ink tabular-nums">
                {apca.lc.toFixed(1)}
                <span className="text-xl text-ink-soft"> Lc</span>
              </p>
              <p className="mt-1 text-[var(--fs-small)] text-ink-soft">
                {tr('apcaLc')} ·{' '}
                {esPolaridadClara(apca.lc) ? tr('apcaPolaridadClara') : tr('apcaPolaridadOscura')}
              </p>

              <div className="mt-4 max-w-[26rem] text-[var(--fs-small)]">
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
                className="rounded-lg border border-line bg-surface-2 p-5"
              >
                <h3 className="text-[length:var(--fs-h3)] font-semibold text-ink">
                  {tr('desacuerdoTitulo')}
                </h3>
                <p className="mt-2 text-[var(--fs-small)] text-ink-muted">
                  {wcag.pasaAA ? tr('desacuerdoWcagSi') : tr('desacuerdoApcaSi')}
                </p>
              </section>
            )}
          </div>

          {/* -------- El color que sí pasaría --------
              Tercera columna de la misma fila y no una tarjeta aparte
              debajo. En su propia fila costaba 212 px de alto para
              enseñar un color y un botón; aquí cabe en el hueco que ya
              dejaba APCA, que se estira igual. Y además queda al lado
              del veredicto que la provoca, que es donde se entiende:
              «no pasa» y a continuación «este sí». */}
          {!wcag.pasaAA && (
            <section
              data-tour="sugerencia"
              /* A dos columnas es el tercero en discordia y dejaba medio
                 hueco a su derecha; ahí ocupa la fila entera. A tres, una
                 columna como las otras. */
              className="flex h-full flex-col rounded-lg border border-line bg-surface p-5 sm:col-span-2 lg:col-span-1"
            >
              <h3 className="text-[length:var(--fs-h3)] font-semibold text-ink">
                {tr('sugerenciaTitulo')}
              </h3>

              {sugerencia ? (
                <>
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className="grid h-14 w-20 shrink-0 place-items-center rounded-md border border-line"
                      style={{ background: fondoHex }}
                    >
                      <span
                        style={{ color: sugerencia.hex, fontSize: `${px}px`, fontWeight: peso }}
                      >
                        Aa
                      </span>
                    </div>

                    <div className="grid min-w-0 gap-0.5">
                      <code className="font-mono text-[length:var(--fs-h3)] text-ink">
                        {sugerencia.hex}
                      </code>
                      <p className="text-[var(--fs-small)] text-ink-soft tabular-nums">
                        {sugerencia.direccion === 'oscurecer'
                          ? tr('sugerenciaOscurecer')
                          : tr('sugerenciaAclarar')}{' '}
                        · {sugerencia.razon.toFixed(2)}:1
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-[var(--fs-small)] text-ink-soft">
                    {tr('sugerenciaComo')}
                    {sugerencia.cromaAjustado && ` ${tr('sugerenciaCroma')}`}
                  </p>

                  {/*
                    Seguía leyéndose como una etiqueta y no como algo que
                    se pulsa. Tres motivos, los tres arreglados aquí:

                      · Medía 32 px de alto con texto de 12,8. A ese
                        tamaño una caja de color con una palabra dentro
                        es un tag, no un botón.
                      · Llevaba una bolita del color delante, que es
                        justo lo que hace que algo parezca un tag — y
                        además sobraba: el «Aa» de arriba ya enseña el
                        color.
                      · Iba en el teal de la marca y no en el acento de
                        la herramienta, que aquí es morado. Un botón de un
                        color que no aparece en ningún otro sitio de la
                        página se lee como una insignia.

                    Y va abajo del todo, ocupando el ancho de la tarjeta:
                    es la única acción de este bloque, así que no tiene
                    con quién competir por el sitio.
                  */}
                  <Button
                    onClick={() => cambiarTexto(sugerencia.hex)}
                    className="mt-4 h-10 w-full border border-[var(--acento)] bg-[var(--acento)] px-4 text-[0.9rem] font-medium text-[var(--brand-ink)] hover:bg-[color-mix(in_srgb,var(--acento)_86%,var(--ink))]"
                  >
                    {tr('sugerenciaUsar')}
                  </Button>
                </>
              ) : (
                <p className="mt-2 text-[var(--fs-small)] text-ink-muted">
                  {tr('sugerenciaNinguna')}
                </p>
              )}
            </section>
          )}
        </div>
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
