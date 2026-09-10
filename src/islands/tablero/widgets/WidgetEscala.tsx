/**
 * Una escala tipográfica, en una pieza.
 *
 * Su página construye la escala entera: fluida entre dos anchuras, con
 * nombres propios por paso, esquemas de nombres, pasos omitidos, la tabla
 * a cuatro anchuras y el CSS que se copia. Aquí quedan los tamaños, uno
 * debajo de otro y escritos a su propio tamaño.
 *
 * Es la versión de mirar: tener la escala delante mientras se maqueta,
 * para saber si el siguiente titular es 24 o 28. Se toca un paso y se
 * copia su tamaño en píxeles.
 *
 * ---------------------------------------------------------------------
 * FIJA, no fluida
 *
 * La escala de la herramienta crece con la ventana, y eso aquí no se
 * puede enseñar: la pieza mide lo que mide y no cambia de ancho con el
 * navegador. Enseñar un `clamp()` en una caja de tamaño fijo sería pintar
 * un tamaño que no es ninguno de los dos extremos. Dos números —la base y
 * la proporción— son toda la escala fija, y la fluida está a un clic.
 */
import { useState } from 'react';

import { t } from '../../../i18n/config';
import { TABLERO_TEXTOS as TX } from '../../../i18n/tablero';
import type { AjustesEscala } from '../../../lib/widgets';
import type { PropsWidget } from '../tipos';

/** Cuántos pasos se enseñan: dos por debajo de la base y cinco por encima. */
const ABAJO = 2;
const ARRIBA = 5;

export default function WidgetEscala({ lang, ajustes, medida }: PropsWidget<AjustesEscala>) {
  const [copiado, setCopiado] = useState<number | null>(null);

  const razon = ajustes.razon / 100;

  /*
    Los pasos se calculan aquí y no con `construirEscala`.

    Aquella devuelve la escala FLUIDA —con sus dos extremos, su `clamp()`,
    sus nombres y su tabla a cuatro anchuras— y de todo eso aquí solo se
    usaría un número por paso. Multiplicar la base por la razón es la
    misma aritmética sin arrastrar lo demás.
  */
  const pasos: { indice: number; px: number }[] = [];
  for (let i = -ABAJO; i <= ARRIBA; i++) {
    pasos.push({ indice: i, px: Math.round(ajustes.base * razon ** i * 10) / 10 });
  }

  // En una pieza baja no caben ocho renglones: se recorta por arriba, que
  // es donde están los tamaños que menos se consultan de reojo.
  const cabe = medida.filas >= 3 ? pasos : pasos.slice(0, 5);

  async function copiar(px: number) {
    try {
      await navigator.clipboard.writeText(`${px}px`);
      setCopiado(px);
      setTimeout(() => setCopiado((c) => (c === px ? null : c)), 1200);
    } catch {
      // Sin permiso de portapapeles no hay nada que hacer, y un error que
      // quien mira no puede resolver es ruido.
    }
  }

  return (
    <ul className="escala-widget">
      {cabe.map((paso) => (
        <li key={paso.indice}>
          <button type="button" onClick={() => copiar(paso.px)} title={`${paso.px}px`}>
            {/*
              La muestra se pinta a SU tamaño, que es lo que hace útil una
              escala: los números dicen la proporción, los glifos dicen si
              se distingue un paso del siguiente.
            */}
            <span className="muestra-escala" style={{ fontSize: `${paso.px}px` }}>
              Aa
            </span>
            <span className="px-escala">
              {copiado === paso.px ? t(TX.copiado, lang) : `${paso.px}`}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
