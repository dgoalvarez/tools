/**
 * El selector de color: un campo de texto, un cuentagotas, y cuatro formas
 * de mover el color a mano.
 *
 * Sustituye al `<input type="color">` del sistema, que se veía distinto en
 * cada plataforma, no sabe de OKLCH y obligaba a abrir una ventana aparte
 * para hacer algo tan simple como aclarar un poco un color.
 *
 * Las cuatro formas no son cuatro caprichos:
 *
 *   · **Visual** es el cuadrado de saturación y brillo con el tono debajo.
 *     Es el de Figma, el de Photoshop y el de casi todo, y por eso es el
 *     que viene puesto: mucha gente lo reconoce antes que a tres barras
 *     con nombres de canal.
 *   · **OKLCH** es la única con la que se puede subir el contraste sin
 *     cambiar el color: se mueve la luminosidad y ya está.
 *   · **RGB** y **HSL** están porque son las que trae la cabeza de quien
 *     lleva años escribiendo CSS.
 *
 * Las tres de barras son `<input type="range">` nativos: se mueven con las
 * flechas del teclado y se anuncian con su valor sin escribir ARIA. El
 * cuadrado no puede serlo —son dos ejes a la vez— así que responde a las
 * flechas por su cuenta y anuncia el color con `aria-valuetext`. Aun así,
 * las barras se quedan: un cuadrado de dos dimensiones nunca se explora
 * tan bien con un lector de pantalla, y el camino completo tiene que
 * existir.
 */
import { useRef, useState } from 'react';
import { EyedropperIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t, type Lang } from '@/i18n/config';
import { CONTRASTE as C, CANALES } from '@/i18n/contrast';
import { ESPACIOS, canalesDe, conCanal, desdeVisual, visualDe, type Espacio } from '@/lib/contrast';

/** Los cuatro modos: el visual y los tres de barras. */
type Modo = 'visual' | Espacio;
const MODOS: Modo[] = ['visual', ...ESPACIOS];

interface Props {
  lang: Lang;
  /** Un identificador único: hay dos selectores en la misma página. */
  id: string;
  etiqueta: string;
  /** Lo que hay escrito en el campo, tal cual. */
  bruto: string;
  /** El último valor que sí era un color. Es el que mueven los controles. */
  hex: string;
  valido: boolean;
  onCambio: (valor: string) => void;
  /** Abre el cuentagotas del navegador. Solo donde existe la API. */
  onCuentagotas?: () => void;
}

export default function SelectorColor({
  lang,
  id,
  etiqueta,
  bruto,
  hex,
  valido,
  onCambio,
  onCuentagotas,
}: Props) {
  const tr = (clave: keyof typeof C) => t(C[clave], lang);

  // Cada selector recuerda su propio modo. Quien piensa en RGB para el
  // fondo puede estar pensando en OKLCH para el texto.
  const [modo, setModo] = useState<Modo>('visual');
  const canales = modo === 'visual' ? [] : canalesDe(hex, modo);
  const visual = visualDe(hex);

  // El selector del sistema, escondido. Es el plan B del cuentagotas:
  // donde el navegador no trae la API de EyeDropper —Firefox y Safari— el
  // botón abre esto, que en Windows y en macOS trae su propio cuentagotas
  // dentro. Así el botón nunca desaparece.
  const delSistema = useRef<HTMLInputElement>(null);

  function cogerColor() {
    if (onCuentagotas) onCuentagotas();
    else delSistema.current?.click();
  }

  // ---------- el cuadro ----------

  const plano = useRef<HTMLDivElement>(null);

  function moverPlano(evento: React.PointerEvent<HTMLDivElement>) {
    const caja = plano.current?.getBoundingClientRect();
    if (!caja) return;

    const dentro = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
    const saturacion = dentro((evento.clientX - caja.left) / caja.width, 0, 1);
    // El eje vertical va al revés: arriba es más brillo.
    const brillo = 1 - dentro((evento.clientY - caja.top) / caja.height, 0, 1);

    onCambio(desdeVisual({ ...visual, saturacion, brillo }));
  }

  function teclasPlano(evento: React.KeyboardEvent<HTMLDivElement>) {
    // Con Mayús el salto es de diez en diez, como en un range nativo.
    const paso = evento.shiftKey ? 0.1 : 0.01;
    const mover: Record<string, [number, number]> = {
      ArrowLeft: [-paso, 0],
      ArrowRight: [paso, 0],
      ArrowUp: [0, paso],
      ArrowDown: [0, -paso],
    };

    const delta = mover[evento.key];
    if (!delta) return;
    evento.preventDefault();

    const limitar = (n: number) => Math.min(1, Math.max(0, n));
    onCambio(
      desdeVisual({
        ...visual,
        saturacion: limitar(visual.saturacion + delta[0]),
        brillo: limitar(visual.brillo + delta[1]),
      })
    );
  }

  return (
    <div className="tarjeta-control" data-tour={id === 'color-texto' ? 'colores' : undefined}>
      <div className="grid gap-1.5">
        <Label htmlFor={id}>{etiqueta}</Label>

        <div className="flex items-center gap-2">
          {/* La muestra no es un control: es la respuesta a «¿qué color es
              este?», y por eso va pegada al campo donde se escribe. */}
          <span
            aria-hidden="true"
            className="size-9 shrink-0 rounded-md border border-line"
            style={{ background: hex }}
          />

          <Input
            id={id}
            value={bruto}
            onChange={(e) => onCambio(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={!valido}
            className="font-mono"
          />

          <Button
            variant="outline"
            size="icon"
            onClick={cogerColor}
            title={tr('cuentagotas')}
            aria-label={tr('cuentagotas')}
            data-tour={id === 'color-texto' ? 'cuentagotas' : undefined}
          >
            <EyedropperIcon aria-hidden="true" />
          </Button>

          <input
            ref={delSistema}
            type="color"
            value={hex}
            onChange={(e) => onCambio(e.target.value)}
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
        </div>

        {!valido && (
          <p className="text-[var(--fs-small)] text-[var(--danger)]">{tr('noEsColor')}</p>
        )}
      </div>

      {/* Un grupo de radios y no pestañas de biblioteca: las flechas del
          teclado ya recorren un grupo de radios sin ayuda de nadie. */}
      <fieldset data-tour={id === 'color-texto' ? 'espacio' : undefined}>
        <legend className="sr-only">{tr('espacio')}</legend>

        <div className="segmento" role="none">
          {MODOS.map((m) => (
            <label key={m}>
              <input
                type="radio"
                name={`${id}-modo`}
                value={m}
                checked={modo === m}
                onChange={() => setModo(m)}
              />
              <span>{m === 'visual' ? tr('visual') : m.toUpperCase()}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {modo === 'visual' ? (
        <div className="grid gap-3">
          {/*
            Sin `role="application"` y sin `aria-valuetext`.

            La tentación era ponerle `role="slider"`, pero un slider tiene
            un valor y esto tiene dos, así que sería mentira. Y
            `aria-valuetext` solo significa algo sobre un rol de rango.

            Lo honesto es esto: un elemento enfocable con su etiqueta, que
            responde a las flechas, y que anuncia el resultado por una
            región viva. La ruta completa para quien navega con lector de
            pantalla siguen siendo las tres pestañas de barras, que son
            `<input type="range">` de verdad.
          */}
          <div
            ref={plano}
            className="plano-color"
            style={{ '--tono': `hsl(${visual.tono} 100% 50%)` } as React.CSSProperties}
            tabIndex={0}
            aria-label={tr('planoEtiqueta')}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              moverPlano(e);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) moverPlano(e);
            }}
            onKeyDown={teclasPlano}
          >
            <span
              className="puntero"
              style={{
                left: `${visual.saturacion * 100}%`,
                top: `${(1 - visual.brillo) * 100}%`,
                background: hex,
              }}
            />
          </div>

          <p aria-live="polite" className="sr-only">
            {`${hex} · ${tr('saturacion')} ${Math.round(visual.saturacion * 100)} % · ${tr('brillo')} ${Math.round(visual.brillo * 100)} %`}
          </p>

          {/* El tono sí es una sola dimensión, así que aquí sí vale un
              range de verdad, con su teclado y su anuncio de fábrica. */}
          <div className="grid gap-1">
            <div className="flex items-baseline justify-between gap-2 text-[var(--fs-small)]">
              <label htmlFor={`${id}-tono`} className="text-ink-muted">
                {tr('tono')}
              </label>
              <span className="font-mono text-ink tabular-nums">{Math.round(visual.tono)}°</span>
            </div>
            <input
              id={`${id}-tono`}
              type="range"
              className="barra-color"
              min={0}
              max={360}
              step={1}
              value={visual.tono}
              style={
                {
                  '--degradado':
                    'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                } as React.CSSProperties
              }
              onChange={(e) => onCambio(desdeVisual({ ...visual, tono: Number(e.target.value) }))}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {canales.map((canal) => {
            const idCanal = `${id}-${modo}-${canal.clave}`;
            const nombre = t(CANALES[`${modo}.${canal.clave}`]!, lang);

            return (
              <div key={canal.clave} className="grid gap-1">
                <div className="flex items-baseline justify-between gap-2 text-[var(--fs-small)]">
                  <label htmlFor={idCanal} className="text-ink-muted">
                    {nombre}
                    <span className="ml-1 text-ink-soft uppercase">{canal.clave}</span>
                  </label>
                  <span className="font-mono text-ink tabular-nums">
                    {canal.valor.toFixed(canal.decimales)}
                    {canal.sufijo ?? ''}
                  </span>
                </div>

                {/* El degradado viaja como variable y no como
                    `background-image` del propio input. Puesto en el
                    input, se pintaba también su caja —que es un rectángulo
                    sin redondear— y asomaba por fuera de las esquinas del
                    carril. */}
                <input
                  id={idCanal}
                  type="range"
                  className="barra-color"
                  min={canal.min}
                  max={canal.max}
                  step={canal.paso}
                  value={canal.valor}
                  style={{ '--degradado': canal.degradado } as React.CSSProperties}
                  onChange={(e) =>
                    onCambio(conCanal(hex, modo, canal.clave, Number(e.target.value)))
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
