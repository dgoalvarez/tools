/**
 * La nota, dentro del tablero.
 *
 * Es la MISMA nota que la de `/es/notas`: las dos leen y escriben el
 * mismo cuaderno a través de `useCuaderno`, así que lo que se escribe
 * aquí está allí al momento y al revés. Eso no es un efecto secundario,
 * es lo que se quiere — un tablero que tuviera «otra» nota sería una
 * segunda libreta que nadie pidió.
 *
 * El componente de escribir es el mismo también, sin una copia compacta:
 * `NotaConFormato` ya recibía todo por props y no sabía nada de su
 * página. Era la pieza más lista del proyecto para esto.
 */
import NotaConFormato from '../../NotaConFormato';
import { useCuaderno, cambiarCuaderno } from '../../../hooks/useCuaderno';
import { NOTAS } from '../../../i18n/notas';
import { t } from '../../../i18n/config';
import type { SinAjustes } from '../../../lib/widgets';
import type { PropsWidget } from '../tipos';

export default function WidgetNota({ lang }: PropsWidget<SinAjustes>) {
  const { cuaderno } = useCuaderno();

  return (
    <NotaConFormato
      valor={cuaderno.nota}
      textos={{
        negrita: t(NOTAS.negrita, lang),
        cursiva: t(NOTAS.cursiva, lang),
        subrayado: t(NOTAS.subrayado, lang),
        tachado: t(NOTAS.tachado, lang),
        vinetas: t(NOTAS.vinetas, lang),
        numeros: t(NOTAS.numeros, lang),
        vacia: t(NOTAS.notaVacia, lang),
        etiqueta: t(NOTAS.laNota, lang),
      }}
      onCambio={(html) => cambiarCuaderno({ ...cuaderno, nota: html })}
    />
  );
}
