/**
 * El selector de color: un campo de texto, tres barras y un cuentagotas.
 *
 * Sustituye al `<input type="color">` del sistema, que se veía distinto en
 * cada plataforma, no sabe de OKLCH y obligaba a abrir una ventana aparte
 * para hacer algo tan simple como aclarar un poco un color.
 *
 * Las barras son `<input type="range">` nativos: se mueven con las flechas
 * del teclado y se anuncian con su valor sin escribir ARIA. Cada una lleva
 * su degradado de verdad, calculado en vivo, para que se vea adónde lleva
 * antes de moverla — que es lo que convierte tres barras grises en algo que
 * se puede usar sin mirar los números.
 */
import { useState } from 'react';
import { Pipette } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t, type Lang } from '@/i18n/config';
import { CONTRASTE as C, CANALES } from '@/i18n/contrast';
import { ESPACIOS, canalesDe, conCanal, type Espacio } from '@/lib/contrast';

interface Props {
  lang: Lang;
  /** Un identificador único: hay dos selectores en la misma página. */
  id: string;
  etiqueta: string;
  /** Lo que hay escrito en el campo, tal cual. */
  bruto: string;
  /** El último valor que sí era un color. Es el que mueven las barras. */
  hex: string;
  valido: boolean;
  onCambio: (valor: string) => void;
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

  // Cada selector recuerda su propio espacio. Quien piensa en RGB para el
  // fondo puede estar pensando en OKLCH para el texto.
  const [espacio, setEspacio] = useState<Espacio>('oklch');
  const canales = canalesDe(hex, espacio);

  return (
    <div className="grid gap-3 rounded-lg border border-line bg-surface p-4">
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

          {onCuentagotas && (
            <Button
              variant="outline"
              size="icon"
              onClick={onCuentagotas}
              title={tr('cuentagotas')}
              aria-label={tr('cuentagotas')}
            >
              <Pipette aria-hidden="true" />
            </Button>
          )}
        </div>

        {!valido && (
          <p className="text-[var(--fs-small)] text-[var(--danger)]">{tr('noEsColor')}</p>
        )}
      </div>

      {/* Un grupo de radios y no pestañas de biblioteca: las flechas del
          teclado ya recorren un grupo de radios sin ayuda de nadie. */}
      <fieldset className="flex items-center justify-between gap-3">
        <legend className="sr-only">{tr('espacio')}</legend>

        <div className="segmento" role="none">
          {ESPACIOS.map((e) => (
            <label key={e}>
              <input
                type="radio"
                name={`${id}-espacio`}
                value={e}
                checked={espacio === e}
                onChange={() => setEspacio(e)}
              />
              <span>{e.toUpperCase()}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3">
        {canales.map((canal) => {
          const idCanal = `${id}-${espacio}-${canal.clave}`;
          const nombre = t(CANALES[`${espacio}.${canal.clave}`]!, lang);

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

              <input
                id={idCanal}
                type="range"
                className="barra-color"
                min={canal.min}
                max={canal.max}
                step={canal.paso}
                value={canal.valor}
                style={{ backgroundImage: canal.degradado }}
                onChange={(e) =>
                  onCambio(conCanal(hex, espacio, canal.clave, Number(e.target.value)))
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
