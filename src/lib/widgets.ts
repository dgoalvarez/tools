/**
 * El catálogo de widgets: qué se puede poner en el tablero.
 *
 * Esto es la parte PURA —sin React y sin DOM— a propósito: es lo que
 * permite que `comprobar-tablero.ts` demuestre desde node que los códigos
 * van y vuelven. Los componentes viven aparte, en
 * `src/islands/tablero/catalogo.ts`, y se cargan bajo demanda: un tablero
 * sin dibujo no se descarga la biblioteca de trazado.
 *
 * Que los metadatos estén aquí y no junto a cada componente no es
 * capricho: el selector necesita el nombre y el icono de todos para
 * pintar la lista, y sacándolos del catálogo de componentes tendría que
 * cargarlos todos para enseñar un menú.
 *
 * ---------------------------------------------------------------------
 * Los códigos NO se cambian nunca
 *
 * El número de cada widget viaja dentro de cada código que alguien haya
 * copiado. Cambiar uno rompe todos los tableros que circulen con ese
 * widget dentro, en silencio y para siempre: el código seguiría siendo
 * válido y abriría otra cosa.
 *
 * Se añade al final y no se reordena. Lo vigila
 * `scripts/check-widgets.mjs`, que compara contra lo que hay en git.
 */
import { Escritor, Lector } from './codigo.ts';
import type { IconoKey } from '../components/iconos.ts';
import type { T } from '../i18n/config.ts';

/**
 * Las cuatro tallas, en dos bits.
 *
 * Cubren las cuatro formas que de verdad se piden: un cuadrado pequeño
 * para una cifra, una alta y estrecha para una lista, una ancha y baja
 * para una cuenta atrás, y una grande para dibujar o escribir. Cuatro
 * caben en dos bits, y más de cuatro dejarían de ser «elegir una talla»
 * para volver a ser redimensionar, que es lo que se descartó.
 */
export const TALLAS = ['1x1', '1x2', '2x1', '2x2'] as const;
export type Talla = (typeof TALLAS)[number];

export function medidasDe(talla: Talla): { cols: number; filas: number } {
  const [cols, filas] = talla.split('x').map(Number);
  return { cols: cols!, filas: filas! };
}

export type WidgetKey = 'lista' | 'nota' | 'pomodoro' | 'dibujo';

/** Lo que hace distinta a una copia del dibujo. */
export interface AjustesDibujo {
  /** Con qué tinta arranca: 0-2 las de fábrica, 3 la libre. */
  tinta: number;
}

/** Los widgets que no se distinguen entre sí no llevan ajustes. */
export type SinAjustes = Record<string, never>;

export interface Widget<A> {
  /** Viaja en el código. INMUTABLE. */
  codigo: number;
  tallas: readonly Talla[];
  ajustesIniciales: A;
  aBytes(a: A, e: Escritor): void;
  /** `null` invalida el código entero: es un dato que no cuadra. */
  deBytes(l: Lector): A | null;
  /**
   * Cuántas copias caben en un tablero.
   *
   * Uno para lo que tiene estado compartido —solo hay un cuaderno y una
   * cuenta atrás en marcha—, y varios para lo que se distingue por sus
   * ajustes. La regla se lee sola: **lo que no lleva ajustes no se
   * repite, porque dos copias serían la misma cosa dos veces.**
   */
  tope: number;
  icono: IconoKey;
  nombre: T;
}

/** Para los que no se distinguen: cero bytes y nada que validar. */
const SIN_AJUSTES = {
  ajustesIniciales: {} as SinAjustes,
  aBytes: () => {},
  deBytes: (): SinAjustes => ({}),
  tope: 1,
};

const lista: Widget<SinAjustes> = {
  codigo: 0,
  tallas: ['1x2', '2x2'],
  icono: 'notas',
  nombre: { es: 'La lista', en: 'The list' },
  ...SIN_AJUSTES,
};

const nota: Widget<SinAjustes> = {
  codigo: 1,
  tallas: ['2x1', '2x2'],
  icono: 'notas',
  nombre: { es: 'La nota', en: 'The note' },
  ...SIN_AJUSTES,
};

const pomodoro: Widget<SinAjustes> = {
  codigo: 2,
  tallas: ['1x1', '2x1', '2x2'],
  icono: 'cronometro',
  nombre: { es: 'El pomodoro', en: 'The pomodoro' },
  ...SIN_AJUSTES,
};

const dibujo: Widget<AjustesDibujo> = {
  codigo: 3,
  tallas: ['2x2'],
  ajustesIniciales: { tinta: 0 },
  aBytes: (a, e) => {
    e.byte(a.tinta);
  },
  deBytes: (l) => {
    const tinta = l.byte();
    // Cuatro tintas: tres de fábrica y la libre. Un índice mayor viene de
    // otra versión del catálogo, o de un código corrupto.
    return tinta > 3 ? null : { tinta };
  },
  tope: 1,
  icono: 'notas',
  nombre: { es: 'El dibujo', en: 'The drawing' },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const WIDGETS: Record<WidgetKey, Widget<any>> = { lista, nota, pomodoro, dibujo };
/* eslint-enable @typescript-eslint/no-explicit-any */

export const CLAVES = Object.keys(WIDGETS) as WidgetKey[];

/** Del número que viaja en el código a la clave, o `undefined`. */
export function porCodigo(codigo: number): WidgetKey | undefined {
  return CLAVES.find((c) => WIDGETS[c].codigo === codigo);
}
