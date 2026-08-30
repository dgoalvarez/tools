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
    const efectivo = componerSobre(
      { hex: textoHex, alpha: textoAlpha, formato: 'rgb' },
      fondoHex
    );
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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      {/* ---------------- Controles ---------------- */}
      <div className="grid gap-5">
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

        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={intercambiar}
            title={tr('intercambiar')}
            aria-label={tr('intercambiar')}
          >
            <ArrowsLeftRightIcon aria-hidden="true" />
          </Button>
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

        {/* La indicación de formato, una sola vez para los dos campos. */}
        <p className="text-[var(--fs-small)] text-ink-soft">{tr('formatoLibre')}</p>

        {textoAlpha < 1 && (
          <p className="rounded-md border border-line bg-surface-2 p-3 text-[var(--fs-small)] text-ink-muted">
            {tr('avisoAlfa')}{' '}
            <code className="font-mono text-ink">{efectivo}</code>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
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
        </div>

        {wcag.grande && (
          <p className="text-[var(--fs-small)] text-ink-soft">
            <span className="font-medium text-ink-muted">{tr('textoGrande')}.</span>{' '}
            {tr('textoGrandePor')}
          </p>
        )}
      </div>

      {/* ---------------- Resultados ---------------- */}
      <div className="grid gap-5">
        {/* La muestra: el color real, al tamaño real, sobre el fondo real. */}
        <div
          className="grid min-h-36 place-items-center rounded-lg border border-line p-6"
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

        <div className="grid gap-4 sm:grid-cols-2">
          {/* -------- WCAG 2.2 -------- */}
          <section className="rounded-lg border border-line bg-surface p-5">
            <Cabecera titulo={tr('wcagTitulo')} etiqueta={tr('wcagEtiqueta')} destacada />

            <p className="mt-4 font-mono text-4xl leading-none font-semibold text-ink tabular-nums">
              {wcag.razon.toFixed(2)}
              <span className="text-xl text-ink-soft">:1</span>
            </p>
            <p className="mt-1 text-[var(--fs-small)] text-ink-soft">{tr('wcagRazon')}</p>

            <div className="mt-4 grid gap-2 text-[var(--fs-small)]">
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

          {/* -------- APCA -------- */}
          <section className="rounded-lg border border-line bg-surface p-5">
            <Cabecera titulo={tr('apcaTitulo')} etiqueta={tr('apcaEtiqueta')} />

            <p className="mt-4 font-mono text-4xl leading-none font-semibold text-ink tabular-nums">
              {apca.lc.toFixed(1)}
              <span className="text-xl text-ink-soft"> Lc</span>
            </p>
            <p className="mt-1 text-[var(--fs-small)] text-ink-soft">
              {tr('apcaLc')} ·{' '}
              {esPolaridadClara(apca.lc) ? tr('apcaPolaridadClara') : tr('apcaPolaridadOscura')}
            </p>

            <div className="mt-4 text-[var(--fs-small)]">
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
        </div>

        {/* -------- Cuando los dos no dicen lo mismo -------- */}
        {desacuerdo && (
          <section className="rounded-lg border border-line bg-surface-2 p-5">
            <h3 className="text-[length:var(--fs-h3)] font-semibold text-ink">
              {tr('desacuerdoTitulo')}
            </h3>
            <p className="mt-2 max-w-[var(--measure)] text-[var(--fs-small)] text-ink-muted">
              {wcag.pasaAA ? tr('desacuerdoWcagSi') : tr('desacuerdoApcaSi')}
            </p>
          </section>
        )}

        {/* -------- El color que sí pasaría -------- */}
        {!wcag.pasaAA && (
          <section className="rounded-lg border border-line bg-surface p-5">
            <h3 className="text-[length:var(--fs-h3)] font-semibold text-ink">
              {tr('sugerenciaTitulo')}
            </h3>

            {sugerencia ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div
                    className="grid h-16 w-24 shrink-0 place-items-center rounded-md border border-line"
                    style={{ background: fondoHex }}
                  >
                    <span
                      style={{ color: sugerencia.hex, fontSize: `${px}px`, fontWeight: peso }}
                    >
                      Aa
                    </span>
                  </div>

                  <div className="grid gap-1">
                    <code className="font-mono text-[length:var(--fs-h3)] text-ink">
                      {sugerencia.hex}
                    </code>
                    <p className="text-[var(--fs-small)] text-ink-soft tabular-nums">
                      {sugerencia.direccion === 'oscurecer'
                        ? tr('sugerenciaOscurecer')
                        : tr('sugerenciaAclarar')}{' '}
                      · {sugerencia.razon.toFixed(2)}:1 · {sugerencia.lc.toFixed(1)} Lc
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => cambiarTexto(sugerencia.hex)}
                    className="ml-auto"
                  >
                    {tr('sugerenciaUsar')}
                  </Button>
                </div>

                <p className="mt-4 max-w-[var(--measure)] text-[var(--fs-small)] text-ink-soft">
                  {tr('sugerenciaComo')}
                  {sugerencia.cromaAjustado && ` ${tr('sugerenciaCroma')}`}
                </p>
              </>
            ) : (
              <p className="mt-2 max-w-[var(--measure)] text-[var(--fs-small)] text-ink-muted">
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

function Fila({
  nombre,
  pasa,
  si,
  no,
}: {
  nombre: string;
  pasa: boolean;
  si: string;
  no: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
      <span className="text-ink-muted">{nombre}</span>
      <span className={pasa ? 'font-medium text-brand' : 'font-medium text-[var(--danger)]'}>
        {pasa ? si : no}
      </span>
    </div>
  );
}
