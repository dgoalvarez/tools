/**
 * El contraste entre dos colores, en una pieza.
 *
 * Su página es una mesa de trabajo: dos selectores completos, el tamaño y
 * el peso del texto, los dos veredictos con su explicación, las
 * sugerencias del color más cercano que aprueba y la comparación entre
 * WCAG y APCA cuando no coinciden.
 *
 * Aquí queda lo que se consulta veinte veces al día: **este par, ¿pasa?**
 * Con la razón a la vista, porque «4,6:1» dice cuánto margen hay y «AA»
 * solo dice que lo hay.
 *
 * ---------------------------------------------------------------------
 * Se mide con WCAG y no con APCA, y conviene saberlo
 *
 * APCA describe mejor la percepción y la herramienta entera enseña los
 * dos. En una pieza no caben, y se elige WCAG porque es el que está en la
 * norma que se cita en los pliegos: quien mira de reojo quiere saber si
 * CUMPLE. Para lo otro está la herramienta, a un clic en el riel.
 *
 * Y se mide sobre texto normal —16 px, peso 400—, que es el caso duro: lo
 * que aprueba ahí aprueba en titulares, y al revés no.
 */
import { medirWcag, type Texto } from '../../../lib/contrast';
import { t } from '../../../i18n/config';
import { TABLERO_TEXTOS as TX } from '../../../i18n/tablero';
import type { AjustesContraste } from '../../../lib/widgets';
import type { PropsWidget } from '../tipos';

const NORMAL: Texto = { px: 16, peso: 400 };

export default function WidgetContraste({ lang, ajustes }: PropsWidget<AjustesContraste>) {
  const wcag = medirWcag(ajustes.texto, ajustes.fondo, NORMAL);
  const nivel = wcag.pasaAAA ? 'AAA' : wcag.pasaAA ? 'AA' : t(TX.noPasa, lang);

  return (
    <div className="contraste-widget">
      {/*
        La muestra enseña los dos colores HACIENDO lo suyo: uno de tinta
        sobre el otro de fondo. Dos cuadraditos dirían los mismos dos
        colores sin decir si se leen juntos, que es la única pregunta.
      */}
      <div
        className="muestra-contraste"
        style={{ background: ajustes.fondo, color: ajustes.texto }}
      >
        Aa
      </div>

      <div className="veredicto-contraste">
        {/* La coma decimal: en español el punto separa millares. */}
        <p className="razon-contraste">{wcag.razon.toFixed(2).replace('.', ',')}:1</p>
        <p className="nivel-contraste" data-pasa={wcag.pasaAA || undefined}>
          {nivel}
        </p>
      </div>
    </div>
  );
}
