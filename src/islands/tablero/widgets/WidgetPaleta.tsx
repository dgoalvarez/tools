/**
 * Una rampa de color, en una pieza.
 *
 * Su página construye una paleta entera: varias tonalidades, los nombres
 * de las variables, el número de pasos, los retoques a mano, el anclaje
 * forzado y el CSS que se copia. Aquí hay UNA rampa, derivada del color
 * que se le dé, y se toca para copiar el paso.
 *
 * Es «de mirar»: sirve para tener la rampa de la marca delante mientras
 * se trabaja en otra cosa, que es exactamente lo que un tablero es.
 *
 * ---------------------------------------------------------------------
 * Copiar al tocar, sin botón
 *
 * Cada paso es un botón que copia su hexadecimal. Un botón de copiar por
 * paso serían once botones en una tira de dos centímetros; el paso ES el
 * botón, y el aviso de copiado sale encima del que se tocó.
 */
import { useState } from 'react';

import { t } from '../../../i18n/config';
import { TABLERO_TEXTOS as TX } from '../../../i18n/tablero';
import { AJUSTES_INICIALES, construirRampa, type Tonalidad } from '../../../lib/rampa';
import type { AjustesPaleta } from '../../../lib/widgets';
import type { PropsWidget } from '../tipos';

export default function WidgetPaleta({ lang, ajustes }: PropsWidget<AjustesPaleta>) {
  const [copiado, setCopiado] = useState<string | null>(null);

  /*
    La rampa se deriva en cada pintado y no se guarda en estado.

    Depende de una sola cosa —la semilla— y calcularla es aritmética de
    OKLCH sobre once pasos: menos trabajo que el efecto y el estado que
    haría falta para no repetirla, y sin la posibilidad de que se quede
    desincronizada del color.
  */
  const tonalidad: Tonalidad = {
    id: 'w',
    nombre: 'color',
    semilla: ajustes.semilla,
    anclaForzada: null,
    retoques: {},
  };
  const rampa = construirRampa(tonalidad, AJUSTES_INICIALES);

  async function copiar(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiado(hex);
      // Se borra solo: un aviso que se queda obliga a mirar cuál fue el
      // último y no dice nada nuevo.
      setTimeout(() => setCopiado((c) => (c === hex ? null : c)), 1200);
    } catch {
      // Sin permiso de portapapeles no se puede copiar y no hay nada que
      // hacer al respecto. Se calla en vez de enseñar un error que quien
      // mira no puede resolver.
    }
  }

  return (
    <div className="paleta-widget">
      {rampa.pasos.map((paso) => (
        <button
          key={paso.nombre}
          type="button"
          className="paso-paleta"
          style={{ background: paso.hex }}
          aria-label={`${paso.nombre}: ${paso.hex}`}
          title={`${paso.nombre} · ${paso.hex}`}
          onClick={() => copiar(paso.hex)}
        >
          {copiado === paso.hex && <span className="copiado-paleta">{t(TX.copiado, lang)}</span>}
        </button>
      ))}
    </div>
  );
}
