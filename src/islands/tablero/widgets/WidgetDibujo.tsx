/**
 * El dibujo, dentro del tablero.
 *
 * `Dibujo` ya era una isla suelta con props —`lang` y un objeto de
 * textos— y sin nada de su página dentro, así que aquí no hay versión
 * compacta que escribir: se envuelve y ya. Es el caso fácil, y por eso
 * es uno de los dos primeros: demuestra el contrato sin pelearse con él.
 *
 * A diferencia de la nota, este NO comparte nada con `/es/notas`: sus
 * trazos son estado propio, viven dentro del componente y mueren con él.
 * El dibujo del tablero y el de la libreta son dos dibujos distintos, que
 * es lo que ya prometía la tarjeta de allí: «este no aguanta una
 * recarga».
 */
import Dibujo from '../../Dibujo';
import { NOTAS } from '../../../i18n/notas';
import { t } from '../../../i18n/config';
import type { SinAjustes } from '../../../lib/widgets';
import type { PropsWidget } from '../tipos';

export default function WidgetDibujo({ lang }: PropsWidget<SinAjustes>) {
  return (
    <Dibujo
      lang={lang}
      textos={{
        etiqueta: t(NOTAS.elDibujo, lang),
        deshacer: t(NOTAS.deshacerTrazo, lang),
        rehacer: t(NOTAS.rehacerTrazo, lang),
        borrar: t(NOTAS.borrarDibujo, lang),
        descargar: t(NOTAS.descargarDibujo, lang),
        vacio: t(NOTAS.dibujoVacio, lang),
        // En el tablero no se repite el aviso de que no aguanta una
        // recarga: ya lo dice la línea de abajo de la página, y repetirlo
        // en cada pieza sería llenar de letra pequeña una vista que no
        // quiere texto.
        efimero: t(NOTAS.dibujoPng, lang),
        tinta: t(NOTAS.tinta, lang),
        tintaLibre: t(NOTAS.tintaLibre, lang),
        grosor: t(NOTAS.grosor, lang),
        proporcion: t(NOTAS.proporcion, lang),
        cenido: t(NOTAS.cenido, lang),
        lapiz: t(NOTAS.lapiz, lang),
        bote: t(NOTAS.bote, lang),
      }}
    />
  );
}
