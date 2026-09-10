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
 * Un tamaño: cuántas columnas y cuántas filas ocupa una pieza.
 *
 * Sustituye a las cuatro tallas fijas. Cuatro formas elegidas de una
 * lista alcanzaban mientras la rejilla fuera un damero regular; en un
 * bento, donde las piezas se empaquetan rellenando huecos, lo que hace
 * falta es poder decir «esta de tres de ancho y dos de alto» sin que
 * exista una talla llamada así.
 *
 * Cada widget declara su MÍNIMO y su MÁXIMO, que es lo que impide que el
 * tamaño libre se convierta en un tablero ilegible: un dibujo de 1×1 no
 * es un lienzo, y una cifra de 4×4 no es una cifra.
 */
export interface Medida {
  cols: number;
  filas: number;
}

/**
 * El tope de la rejilla, en columnas y filas.
 *
 * Cuatro y cuatro porque es lo que cabe en los cuatro bits de cada mitad
 * del byte de tamaño, y porque cuatro columnas es el reparto más ancho
 * que hace el CSS. Una pieza más alta que cuatro filas deja de verse
 * entera sin desplazarse, que es lo contrario de un tablero.
 */
export const TOPE_COLS = 4;
export const TOPE_FILAS = 4;

/** Deja una medida dentro de lo que el widget admite y de la rejilla. */
export function ceñir(medida: Medida, widget: Widget<unknown>): Medida {
  const entre = (v: number, min: number, max: number, tope: number) =>
    Math.min(Math.max(Math.round(v) || min, min), max, tope);

  return {
    cols: entre(medida.cols, widget.min.cols, widget.max.cols, TOPE_COLS),
    filas: entre(medida.filas, widget.min.filas, widget.max.filas, TOPE_FILAS),
  };
}

/**
 * Las cuatro tallas de la v1 del código, en su orden original.
 *
 * Ya no se elige ninguna: está aquí porque los códigos de la v1 llevan un
 * índice de esta lista, y esos códigos tienen que seguir abriéndose. La
 * cadena de oro de `comprobar-tablero.ts` lo comprueba.
 */
export const TALLAS_V1 = ['1x1', '1x2', '2x1', '2x2'] as const;

export function medidaDeTallaV1(indice: number): Medida | null {
  const talla = TALLAS_V1[indice];
  if (!talla) return null;
  const [cols, filas] = talla.split('x').map(Number);
  return { cols: cols!, filas: filas! };
}

export type WidgetKey = 'lista' | 'nota' | 'pomodoro' | 'dibujo';

/**
 * Un ajuste que se puede tocar desde el tablero.
 *
 * Se declara aquí, en el registro puro, y no dentro de cada componente:
 * así el panel de ajustes se pinta solo a partir de la descripción y no
 * hay que escribir un formulario por widget. Un widget que no declara
 * campos no tiene rueda dentada, y eso también se lee solo.
 *
 * Solo hay «numero» por ahora. Los otros tipos —un color, una zona
 * horaria— entran cuando entre el primer widget que los pida; inventar
 * el tipo antes es escribir código que nadie ejecuta.
 */
export interface CampoNumero {
  tipo: 'numero';
  clave: string;
  rotulo: T;
  min: number;
  max: number;
  /** El salto de cada pulsación. 0,5 para lo que admite medios minutos. */
  paso: number;
  /** Lo que va detrás de la cifra: «min», «s», «pomodoros». */
  unidad: T;
}

export type Campo = CampoNumero;

/** Lo que distingue a una copia del pomodoro: sus duraciones. */
export interface AjustesPomodoro {
  trabajo: number;
  corto: number;
  largo: number;
  cada: number;
  margen: number;
}

export const POMODORO_FABRICA: AjustesPomodoro = {
  trabajo: 25,
  corto: 5,
  largo: 15,
  cada: 4,
  margen: 5,
};

/** Sus topes, los mismos que los de la herramienta entera. */
export const POMODORO_LIMITES = {
  trabajo: { min: 0.5, max: 180, paso: 0.5 },
  corto: { min: 0.5, max: 60, paso: 0.5 },
  largo: { min: 0.5, max: 120, paso: 0.5 },
  cada: { min: 2, max: 12, paso: 1 },
  margen: { min: 0, max: 60, paso: 1 },
} as const;

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
  /**
   * Lo más pequeño que puede ser sin dejar de servir, y lo más grande que
   * tiene sentido.
   *
   * El mínimo no es estético: por debajo, la herramienta deja de hacer su
   * trabajo —una lista de una fila enseña una tarea—. El máximo tampoco:
   * por encima, la pieza ocupa sitio que no usa, y en un bento el sitio
   * que sobra en una pieza se lo quita a otra.
   */
  min: Medida;
  max: Medida;
  /** Con qué tamaño entra al tablero. Entre el mínimo y el máximo. */
  medidaInicial: Medida;
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
  /**
   * Lo que se puede configurar desde el tablero, si algo.
   *
   * Sin campos, la pieza no lleva rueda dentada. Con ellos, el panel se
   * pinta solo a partir de esta lista: no hay un formulario escrito a
   * mano por widget, que es lo que garantiza que los cinco números del
   * pomodoro y los que vengan después se comporten igual.
   */
  campos?: readonly Campo[];
}

/*
  Los rótulos de los campos del pomodoro.

  Viven aquí y no en `src/i18n/pomodoro.ts` porque este archivo tiene que
  poder importarse desde node sin arrastrar media aplicación: es lo que
  permite que `comprobar-tablero.ts` demuestre los códigos sin navegador.
*/
const ROTULOS_POMODORO = {
  trabajo: { es: 'Trabajo', en: 'Work' },
  corto: { es: 'Descanso corto', en: 'Short break' },
  largo: { es: 'Descanso largo', en: 'Long break' },
  cada: { es: 'Descanso largo cada', en: 'Long break every' },
  margen: { es: 'Margen entre fases', en: 'Gap between phases' },
} satisfies Record<string, T>;

const UNIDADES_POMODORO = {
  trabajo: { es: 'min', en: 'min' },
  corto: { es: 'min', en: 'min' },
  largo: { es: 'min', en: 'min' },
  cada: { es: 'pomodoros', en: 'pomodoros' },
  margen: { es: 's', en: 's' },
} satisfies Record<string, T>;

/** Para los que no se distinguen: cero bytes y nada que validar. */
const SIN_AJUSTES = {
  ajustesIniciales: {} as SinAjustes,
  aBytes: () => {},
  deBytes: (): SinAjustes => ({}),
  tope: 1,
};

const lista: Widget<SinAjustes> = {
  codigo: 0,
  // Menos de dos filas enseña una tarea y media: deja de ser una lista.
  min: { cols: 1, filas: 2 },
  max: { cols: 2, filas: 4 },
  medidaInicial: { cols: 1, filas: 2 },
  icono: 'tareas',
  nombre: { es: 'La lista', en: 'The list' },
  ...SIN_AJUSTES,
};

const nota: Widget<SinAjustes> = {
  codigo: 1,
  // Dos columnas de mínimo: la barra de formato son seis botones y en una
  // columna se parte en dos renglones, comiéndose el campo de escribir.
  min: { cols: 2, filas: 1 },
  max: { cols: 4, filas: 4 },
  medidaInicial: { cols: 2, filas: 1 },
  icono: 'notas',
  nombre: { es: 'La nota', en: 'The note' },
  ...SIN_AJUSTES,
};

/*
  Los cinco números del pomodoro, y una máscara para no pagarlos.

  Guardarlos siempre serían ocho bytes en cada tablero que lleve un
  pomodoro, y la inmensa mayoría no toca ninguno. Con un byte de máscara
  —un bit por campo— un pomodoro de fábrica cuesta UN byte y solo se
  escriben los que de verdad se cambiaron.

  Los minutos van en MEDIOS y en dos bytes: la herramienta admite 2,5
  minutos a propósito —el micro-descanso entre tramos cortos es un patrón
  real— y con un byte por minuto eso se perdería al copiar el código.
*/
const ORDEN_POMODORO = ['trabajo', 'corto', 'largo', 'cada', 'margen'] as const;

/** Los dos que se cuentan en medios de minuto. El resto son enteros. */
const EN_MEDIOS = new Set(['trabajo', 'corto', 'largo']);

const pomodoro: Widget<AjustesPomodoro> = {
  codigo: 2,
  // Es una cifra: cabe en la pieza más pequeña que existe, y crecer más
  // de 2×2 solo hace la cifra más grande sin decir nada más.
  min: { cols: 1, filas: 1 },
  max: { cols: 2, filas: 2 },
  medidaInicial: { cols: 1, filas: 1 },
  icono: 'cronometro',
  nombre: { es: 'El pomodoro', en: 'The pomodoro' },

  ajustesIniciales: POMODORO_FABRICA,

  aBytes: (a, e) => {
    let mascara = 0;
    ORDEN_POMODORO.forEach((clave, i) => {
      if (a[clave] !== POMODORO_FABRICA[clave]) mascara |= 1 << i;
    });
    e.byte(mascara);

    ORDEN_POMODORO.forEach((clave, i) => {
      if (!(mascara & (1 << i))) return;
      if (EN_MEDIOS.has(clave)) e.doble(Math.round(a[clave] * 2));
      else e.byte(a[clave]);
    });
  },

  deBytes: (l) => {
    const mascara = l.byte();
    // Los bits de arriba no significan nada todavía: encendidos, el
    // código viene de un catálogo que no es este.
    if (mascara > 0x1f) return null;

    const a: AjustesPomodoro = { ...POMODORO_FABRICA };
    for (let i = 0; i < ORDEN_POMODORO.length; i++) {
      if (!(mascara & (1 << i))) continue;
      const clave = ORDEN_POMODORO[i]!;
      const bruto = EN_MEDIOS.has(clave) ? l.doble() / 2 : l.byte();
      const tope = POMODORO_LIMITES[clave];
      if (bruto < tope.min || bruto > tope.max) return null;
      a[clave] = bruto;
    }
    return a;
  },

  // Uno solo, aunque lleve ajustes: la cuenta en marcha es UNA y vive en
  // el almacenamiento de la pestaña. Dos pomodoros con duraciones
  // distintas se pisarían la cuenta el uno al otro.
  tope: 1,

  campos: ORDEN_POMODORO.map((clave) => ({
    tipo: 'numero' as const,
    clave,
    ...POMODORO_LIMITES[clave],
    rotulo: ROTULOS_POMODORO[clave],
    unidad: UNIDADES_POMODORO[clave],
  })),
};

const dibujo: Widget<AjustesDibujo> = {
  codigo: 3,
  // Un lienzo pequeño no es un lienzo: por debajo de 2×2 no cabe un trazo
  // con la barra de mandos y el pie de descargar.
  min: { cols: 2, filas: 2 },
  max: { cols: 4, filas: 4 },
  medidaInicial: { cols: 2, filas: 2 },
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
  icono: 'pincel',
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
