/**
 * Llevar un elemento a otra posición de una lista.
 *
 * Vivía dentro de `src/lib/notas.ts`, escrito para las tareas. Sube aquí
 * porque el tablero necesita exactamente lo mismo para reordenar sus
 * piezas, y dos copias de una función de reordenar se separan en
 * silencio: la de un sitio arreglaría un caso de los extremos y la del
 * otro no, y nadie se enteraría hasta que una lista saliera al revés.
 *
 * `notas.ts` la reexporta, así que `comprobar-notas.ts` sigue pasando sin
 * tocar una línea.
 */

/** Cualquier cosa con identificador estable sirve. */
export interface ConId {
  id: string;
}

/**
 * Lleva un elemento a una posición cualquiera, no de una en una.
 *
 * Es lo que hace falta para arrastrar: intercambiar con el vecino sirve
 * para las flechas, pero arrastrando se salta de la 1 a la 9 de un tirón
 * y hacerlo a base de ocho intercambios daría otra lista — los de en
 * medio acabarían corridos en el orden equivocado.
 *
 * `destino` es la posición FINAL, ya sin el elemento que se mueve. Se
 * recorta a los extremos: soltar por encima del primero lo deja primero,
 * y por debajo del último, último. Y si no cambia nada devuelve el MISMO
 * array, para que quien lo use sepa por identidad que no ha pasado nada.
 */
export function moverA<T extends ConId>(lista: T[], id: string, destino: number): T[] {
  const desde = lista.findIndex((x) => x.id === id);
  if (desde === -1) return lista;

  const hasta = Math.min(Math.max(destino, 0), lista.length - 1);
  if (hasta === desde) return lista;

  const copia = [...lista];
  const [elemento] = copia.splice(desde, 1);
  copia.splice(hasta, 0, elemento!);
  return copia;
}
