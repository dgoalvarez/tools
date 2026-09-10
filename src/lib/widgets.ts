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
import { ZONA_INICIAL, zonaDe } from './zonas-codigo.ts';

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

export type WidgetKey =
  | 'lista'
  | 'nota'
  | 'pomodoro'
  | 'dibujo'
  | 'hora'
  | 'mundial'
  | 'cronometro'
  | 'temporizador'
  | 'contraste'
  | 'paleta'
  | 'escala';

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

/**
 * Una elección entre unas pocas posibilidades con nombre.
 *
 * Se pinta como un grupo de botones y no como un desplegable: son dos o
 * tres, se ven todas a la vez y se elige de un toque. Un desplegable con
 * dos opciones esconde una de las dos detrás de un clic.
 */
export interface CampoOpcion {
  tipo: 'opcion';
  clave: string;
  rotulo: T;
  opciones: readonly { valor: number; nombre: T }[];
}

/**
 * Una zona horaria, de la lista congelada de `zonas-codigo.ts`.
 *
 * Es su propio tipo y no una `opcion` con noventa entradas: con esas
 * son un buscador, no un grupo de botones, y el nombre de cada una lo
 * da `Intl` en el idioma de quien mira en vez de venir escrito aquí.
 */
export interface CampoZona {
  tipo: 'zona';
  clave: string;
  rotulo: T;
}

/**
 * Un color, en hexadecimal.
 *
 * Se pinta con el selector visual del sitio y no con el `<input
 * type="color">` del sistema: el nativo abre el diálogo del sistema
 * operativo, que en cada uno es distinto y en ninguno enseña la rampa
 * OKLCH con la que están hechos los colores de aquí.
 */
export interface CampoColor {
  tipo: 'color';
  clave: string;
  rotulo: T;
}

export type Campo = CampoNumero | CampoOpcion | CampoZona | CampoColor;

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

/** Lo que distingue a una copia del reloj: si enseña los segundos. */
export interface AjustesHora {
  /** 0 sin segundos, 1 con ellos. */
  segundos: number;
  /** 0 de 24 horas, 1 de 12 con am/pm. */
  doce: number;
}

/** Lo que distingue a un reloj mundial de otro: su ciudad. */
export interface AjustesMundial {
  zona: number;
  doce: number;
}

/** Lo que distingue a un temporizador: cuánto cuenta. */
export interface AjustesTemporizador {
  /** Minutos. Admite medios, como el pomodoro. */
  minutos: number;
}

/** Los dos colores que se comparan. */
export interface AjustesContraste {
  texto: string;
  fondo: string;
}

/** El color del que sale la rampa. */
export interface AjustesPaleta {
  semilla: string;
}

/** Los dos números que definen una escala tipográfica. */
export interface AjustesEscala {
  /** El tamaño del paso 0, en píxeles. */
  base: number;
  /** La proporción entre un paso y el siguiente, por cien. */
  razon: number;
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
  /**
   * Lee los ajustes que escribió `aBytes`, en la versión que sea.
   *
   * La versión importa porque un widget puede haber estrenado ajustes: el
   * pomodoro no escribía nada hasta la v2 y desde la v3 escribe su
   * máscara. Sin saber quién escribió el código, un lector nuevo se come
   * un byte que no está y todo lo que viene detrás sale corrido.
   *
   * `null` invalida el código entero: es un dato que no cuadra.
   */
  deBytes(l: Lector, version: number): A | null;
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

  deBytes: (l, version) => {
    // Hasta la v2 el pomodoro no escribía nada: sus duraciones eran las de
    // fábrica y no había forma de cambiarlas. Leer una máscara de un
    // código de entonces se comería el byte de la pieza siguiente.
    if (version < 3) return { ...POMODORO_FABRICA };

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

/** El formato de la hora, que lo piden los tres relojes. */
const CAMPO_DOCE = {
  tipo: 'opcion' as const,
  clave: 'doce',
  rotulo: { es: 'Formato', en: 'Format' },
  opciones: [
    { valor: 0, nombre: { es: '24 h', en: '24 h' } },
    { valor: 1, nombre: { es: '12 h', en: '12 h' } },
  ],
};

/*
  El reloj de aquí.

  Lleva ajustes y aun así su tope es uno: dos relojes de la MISMA hora
  con formatos distintos no son dos cosas, son la misma dos veces. La
  regla de «lo que lleva ajustes se repite» vale cuando los ajustes
  cambian QUÉ se mira, no cómo se escribe.
*/
const hora: Widget<AjustesHora> = {
  codigo: 4,
  min: { cols: 1, filas: 1 },
  max: { cols: 2, filas: 2 },
  medidaInicial: { cols: 1, filas: 1 },
  icono: 'reloj',
  nombre: { es: 'La hora', en: 'The time' },
  ajustesIniciales: { segundos: 0, doce: 0 },
  aBytes: (a, e) => {
    // Dos banderas en un byte: son dos bits y un byte es lo mínimo que
    // se puede escribir, así que caben de sobra.
    e.byte((a.segundos ? 1 : 0) | (a.doce ? 2 : 0));
  },
  deBytes: (l) => {
    const b = l.byte();
    if (b > 3) return null;
    return { segundos: b & 1, doce: (b >> 1) & 1 };
  },
  tope: 1,
  campos: [
    {
      tipo: 'opcion' as const,
      clave: 'segundos',
      rotulo: { es: 'Segundos', en: 'Seconds' },
      opciones: [
        { valor: 0, nombre: { es: 'No', en: 'No' } },
        { valor: 1, nombre: { es: 'Sí', en: 'Yes' } },
      ],
    },
    CAMPO_DOCE,
  ],
};

/*
  El reloj de otra ciudad.

  Este SÍ se repite, y hasta seis veces: cada copia enseña una hora
  distinta, que es exactamente lo que hace útil tener varias. Es el
  widget que sustituye a la herramienta de husos en compacto — en una
  pieza, husos ES un reloj mundial.
*/
const mundial: Widget<AjustesMundial> = {
  codigo: 5,
  min: { cols: 1, filas: 1 },
  max: { cols: 2, filas: 2 },
  medidaInicial: { cols: 1, filas: 1 },
  icono: 'globo',
  nombre: { es: 'Otra ciudad', en: 'Another city' },
  ajustesIniciales: { zona: ZONA_INICIAL, doce: 0 },
  aBytes: (a, e) => {
    // Dos bytes para la zona: la lista pasa de 64 entradas y va a seguir
    // creciendo por el final.
    e.doble(a.zona).byte(a.doce ? 1 : 0);
  },
  deBytes: (l) => {
    const zona = l.doble();
    const doce = l.byte();
    // Una zona fuera de la lista viene de un catálogo que no es este, y
    // enseñar otra ciudad en silencio sería peor que rechazar el código.
    if (zonaDe(zona) === null || doce > 1) return null;
    return { zona, doce };
  },
  tope: 6,
  campos: [{ tipo: 'zona' as const, clave: 'zona', rotulo: { es: 'Ciudad', en: 'City' } }, CAMPO_DOCE],
};

/* El cronómetro. Sin nada que configurar: cuenta hacia arriba y ya. */
const cronometro: Widget<SinAjustes> = {
  codigo: 6,
  min: { cols: 1, filas: 1 },
  max: { cols: 2, filas: 2 },
  medidaInicial: { cols: 1, filas: 1 },
  icono: 'cuentaAtras',
  nombre: { es: 'El cronómetro', en: 'The stopwatch' },
  ...SIN_AJUSTES,
};

/*
  El temporizador.

  Uno solo, como el pomodoro y por lo mismo: la cuenta en marcha vive en
  el almacenamiento de la pestaña y dos copias se la pisarían.
*/
const temporizador: Widget<AjustesTemporizador> = {
  codigo: 7,
  min: { cols: 1, filas: 1 },
  max: { cols: 2, filas: 2 },
  medidaInicial: { cols: 1, filas: 1 },
  icono: 'arena',
  nombre: { es: 'El temporizador', en: 'The timer' },
  ajustesIniciales: { minutos: 5 },
  aBytes: (a, e) => {
    // En medios de minuto, como el pomodoro: 90 minutos son 180 medios y
    // caben en un byte.
    e.byte(Math.round(a.minutos * 2));
  },
  deBytes: (l) => {
    const minutos = l.byte() / 2;
    if (minutos < 0.5 || minutos > 90) return null;
    return { minutos };
  },
  tope: 1,
  campos: [
    {
      tipo: 'numero' as const,
      clave: 'minutos',
      rotulo: { es: 'Cuenta', en: 'Counts' },
      min: 0.5,
      max: 90,
      paso: 0.5,
      unidad: { es: 'min', en: 'min' },
    },
  ],
};

/*
  Los tres de diseño.

  Los tres son «de mirar y tocar poco», y por eso caben en una pieza: la
  mesa de trabajo —los canales, los retoques, el CSS que se copia— se
  queda en su página. Aquí está el veredicto, la rampa y los tamaños,
  que es lo que se consulta veinte veces al día mientras se hace otra
  cosa.

  Los tres se repiten: dos parejas de colores comparadas a la vez es el
  caso normal, y dos rampas al lado son la marca y el acento.
*/
const contraste: Widget<AjustesContraste> = {
  codigo: 8,
  // Dos columnas de mínimo: el veredicto es «AA · 4,6:1» y en una
  // columna se parte por la mitad.
  min: { cols: 2, filas: 1 },
  max: { cols: 4, filas: 2 },
  medidaInicial: { cols: 2, filas: 1 },
  icono: 'contraste',
  nombre: { es: 'El contraste', en: 'Contrast' },
  ajustesIniciales: { texto: '#1a1a1a', fondo: '#ffffff' },
  aBytes: (a, e) => {
    e.color(a.texto).color(a.fondo);
  },
  deBytes: (l) => {
    const texto = l.color();
    const fondo = l.color();
    return { texto, fondo };
  },
  tope: 4,
  campos: [
    { tipo: 'color' as const, clave: 'texto', rotulo: { es: 'Texto', en: 'Text' } },
    { tipo: 'color' as const, clave: 'fondo', rotulo: { es: 'Fondo', en: 'Background' } },
  ],
};

const paleta: Widget<AjustesPaleta> = {
  codigo: 9,
  // Once pasos en una columna salen a menos de un centímetro cada uno:
  // se ven pero no se distinguen dos vecinos, que es para lo que sirve
  // una rampa.
  min: { cols: 2, filas: 1 },
  max: { cols: 4, filas: 2 },
  medidaInicial: { cols: 2, filas: 1 },
  icono: 'paleta',
  nombre: { es: 'La rampa', en: 'The ramp' },
  ajustesIniciales: { semilla: '#3b82f6' },
  aBytes: (a, e) => {
    e.color(a.semilla);
  },
  deBytes: (l) => ({ semilla: l.color() }),
  tope: 4,
  campos: [{ tipo: 'color' as const, clave: 'semilla', rotulo: { es: 'Color', en: 'Colour' } }],
};

const escala: Widget<AjustesEscala> = {
  codigo: 10,
  min: { cols: 1, filas: 2 },
  max: { cols: 2, filas: 4 },
  medidaInicial: { cols: 1, filas: 2 },
  icono: 'tipografia',
  nombre: { es: 'La escala', en: 'The scale' },
  ajustesIniciales: { base: 16, razon: 125 },
  aBytes: (a, e) => {
    // La razón va POR CIEN y en un byte: 1,25 se guarda como 125. En
    // decimales no cabe, y con dos decimales de verdad no hace falta
    // más — nadie afina una escala en la tercera cifra.
    e.byte(a.base).byte(a.razon);
  },
  deBytes: (l) => {
    const base = l.byte();
    const razon = l.byte();
    if (base < 8 || base > 32 || razon < 105 || razon > 200) return null;
    return { base, razon };
  },
  tope: 2,
  campos: [
    {
      tipo: 'numero' as const,
      clave: 'base',
      rotulo: { es: 'Base', en: 'Base' },
      min: 8,
      max: 32,
      paso: 1,
      unidad: { es: 'px', en: 'px' },
    },
    {
      tipo: 'numero' as const,
      clave: 'razon',
      rotulo: { es: 'Proporción', en: 'Ratio' },
      min: 105,
      max: 200,
      paso: 1,
      unidad: { es: '%', en: '%' },
    },
  ],
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const WIDGETS: Record<WidgetKey, Widget<any>> = {
  lista,
  nota,
  pomodoro,
  dibujo,
  hora,
  mundial,
  cronometro,
  temporizador,
  contraste,
  paleta,
  escala,
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export const CLAVES = Object.keys(WIDGETS) as WidgetKey[];

/** Del número que viaja en el código a la clave, o `undefined`. */
export function porCodigo(codigo: number): WidgetKey | undefined {
  return CLAVES.find((c) => WIDGETS[c].codigo === codigo);
}
