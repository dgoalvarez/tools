/**
 * Configurar una pieza, sin salir del tablero.
 *
 * ---------------------------------------------------------------------
 * El formulario no está escrito: se deriva
 *
 * Cada widget declara sus campos en `src/lib/widgets.ts` —tipo, rótulo,
 * mínimo, máximo, salto y unidad— y este panel los pinta. Nadie escribe
 * un formulario por widget, que es lo que garantiza que los cinco números
 * del pomodoro y los que vengan después se comporten igual: mismos topes,
 * mismo teclado, mismo aspecto.
 *
 * El precio es que un ajuste raro no se puede pintar hasta que exista su
 * tipo de campo. Sale barato: la alternativa era siete formularios que se
 * separan en silencio.
 *
 * ---------------------------------------------------------------------
 * Se aplica al momento, y no hay «Guardar»
 *
 * Un botón de guardar obligaría a llevar una copia del estado y a decidir
 * qué pasa si alguien cierra sin pulsarlo. Aquí cada cambio va derecho a
 * la pieza y se ve detrás del panel — con el pomodoro, cambiar el trabajo
 * a 50 mueve la cifra mientras se mira. Y deshacer es volver a poner el
 * número, que es lo que se acaba de hacer.
 *
 * ---------------------------------------------------------------------
 * El campo NO gobierna su valor mientras se escribe
 *
 * Un `<input type="number">` atado a un estado ceñido a mínimo y máximo
 * es imposible de escribir: al teclear el «5» de «50» el valor se ciñe a
 * su mínimo y el cursor se va. Se guarda el texto en bruto mientras la
 * mano está encima y se ciñe al salir del campo, que es cuando ya se sabe
 * qué se quiso escribir. Es el mismo patrón que ya usa `Numero` en
 * `Pomodoro.tsx`.
 */
import { useEffect, useState } from 'react';
import { XIcon } from '@phosphor-icons/react';

import { Sheet, SheetClose, SheetContent, SheetTitle } from '../../components/ui/sheet';
import { t, type Lang } from '../../i18n/config';
import { TABLERO_TEXTOS as TX } from '../../i18n/tablero';
import { WIDGETS, type Campo } from '../../lib/widgets';
import type { Pieza } from '../../lib/tablero';

interface Props {
  lang: Lang;
  /** La pieza que se está configurando, o `null` si el panel está cerrado. */
  pieza: Pieza | null;
  onCerrar: () => void;
  onAjustes: (id: string, parcial: Record<string, number>) => void;
}

export default function PanelAjustes({ lang, pieza, onCerrar, onAjustes }: Props) {
  const tr = (clave: keyof typeof TX) => t(TX[clave], lang);

  const widget = pieza ? WIDGETS[pieza.tipo] : null;
  const campos = widget?.campos ?? [];

  return (
    <Sheet open={pieza !== null} onOpenChange={(v) => !v && onCerrar()}>
      <SheetContent aria-describedby={undefined} className="hoja-ajustes">
      <div className="fila-hoja-lateral">
        <SheetTitle>{widget ? t(widget.nombre, lang) : tr('ajustes')}</SheetTitle>
        <SheetClose className="cerrar-hoja-lateral" aria-label={tr('cerrar')}>
          <XIcon aria-hidden="true" size={16} />
        </SheetClose>
      </div>

      <div className="lista-ajustes">
        {pieza &&
          campos.map((campo) => (
            <CampoAjuste
              key={campo.clave}
              lang={lang}
              campo={campo}
              valor={pieza.ajustes[campo.clave] as number}
              onValor={(v) => onAjustes(pieza.id, { [campo.clave]: v })}
            />
          ))}
      </div>
      </SheetContent>
    </Sheet>
  );
}

function CampoAjuste({
  lang,
  campo,
  valor,
  onValor,
}: {
  lang: Lang;
  campo: Campo;
  valor: number;
  onValor: (v: number) => void;
}) {
  const [bruto, setBruto] = useState(String(valor));

  // Si el valor cambia por fuera —al abrir otra pieza, o al restablecer—
  // el campo tiene que enterarse. Mientras se escribe no pasa: `valor`
  // solo se mueve cuando el propio campo lo mueve.
  useEffect(() => {
    setBruto(String(valor));
  }, [valor]);

  const ceñir = (n: number) => Math.min(Math.max(n, campo.min), campo.max);

  function confirmar() {
    // La coma decimal es lo que se escribe en español, y `Number` no la
    // entiende: sin esto, «2,5» se convierte en NaN y el campo salta a su
    // mínimo delante de quien lo acaba de escribir.
    const n = Number(bruto.replace(',', '.'));
    const bueno = Number.isFinite(n) ? redondear(ceñir(n), campo.paso) : valor;
    setBruto(String(bueno));
    if (bueno !== valor) onValor(bueno);
  }

  const id = `ajuste-${campo.clave}`;

  return (
    <div className="campo-ajuste">
      <label htmlFor={id}>{t(campo.rotulo, lang)}</label>

      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={campo.min}
        max={campo.max}
        step={campo.paso}
        value={bruto}
        onChange={(e) => setBruto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      />
      <span className="unidad-ajuste">{t(campo.unidad, lang)}</span>
    </div>
  );
}

/**
 * Redondea al salto del campo.
 *
 * Sin esto, escribir «2,7» en un campo de medios minutos se acepta tal
 * cual y el código no lo puede guardar: se escriben medios, así que al
 * copiar el tablero y volver a abrirlo saldría 2,5 y nadie sabría por
 * qué. Se redondea aquí, delante de quien lo escribe.
 */
function redondear(valor: number, paso: number): number {
  const n = Math.round(valor / paso) * paso;
  // Un paso de 0,5 da 2.5000000000000004 más veces de las que parece.
  return Math.round(n * 1000) / 1000;
}
