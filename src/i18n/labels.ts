/**
 * Las etiquetas con las que se ordenan las herramientas.
 *
 * Hay tres dimensiones, y cada una responde a una pregunta distinta:
 *
 *   ámbito   ¿para qué sirve?  Productividad, Diseño, Atención al cliente…
 *   materia  ¿de qué trata?    Tiempo, Color, Tipografía…
 *   tarea    ¿qué hace?        Convertir, Comprobar, Generar…
 *
 * En la navegación manda el **ámbito**, y es una decisión de fondo: quien
 * llega buscando «algo para agendar citas» entiende «Productividad» y no
 * tiene por qué entender «Tiempo». La materia y la tarea son el modelo
 * mental de quien construye herramientas, no el de quien las usa, así que
 * viven en la ficha y no en el menú.
 *
 * Añadir una herramienta es añadirle sus tres etiquetas. Si falta alguna o
 * si apunta a una clave que no existe aquí, `check-etiquetas.mjs` rompe la
 * compilación en vez de dejar una herramienta suelta fuera de todo grupo.
 */
import type { T } from './config';

// ------------------------------------------------------------------ ámbito

export const AMBITOS = {
  productividad: { es: 'Productividad', en: 'Productivity' },
  diseno: { es: 'Diseño', en: 'Design' },
  atencionCliente: { es: 'Atención al cliente', en: 'Customer relations' },
} satisfies Record<string, T>;

export type AmbitoKey = keyof typeof AMBITOS;

/**
 * El orden en el que salen los grupos, de arriba abajo.
 *
 * No es alfabético a propósito: lo primero que se ve tiene que ser lo que
 * le sirve a más gente, y las herramientas de productividad las usa
 * cualquiera mientras que las de diseño no.
 */
export const ORDEN_AMBITOS: AmbitoKey[] = ['productividad', 'diseno', 'atencionCliente'];

// ----------------------------------------------------------------- materia

export const MATERIAS = {
  tiempo: { es: 'Tiempo', en: 'Time' },
  color: { es: 'Color', en: 'Colour' },
  tipografia: { es: 'Tipografía', en: 'Type' },
  lugares: { es: 'Lugares', en: 'Places' },
} satisfies Record<string, T>;

export type MateriaKey = keyof typeof MATERIAS;

// ------------------------------------------------------------------- tarea

export const TAREAS = {
  convertir: { es: 'Convertir', en: 'Convert' },
  comprobar: { es: 'Comprobar', en: 'Check' },
  generar: { es: 'Generar', en: 'Generate' },
  buscar: { es: 'Buscar', en: 'Find' },
} satisfies Record<string, T>;

export type TareaKey = keyof typeof TAREAS;

// ------------------------------------------------------------------ juntas

export interface Etiquetas {
  /**
   * Puede haber varios. El primero decide bajo qué grupo sale en el menú,
   * para que ninguna herramienta aparezca dos veces en la misma lista.
   */
  ambito: [AmbitoKey, ...AmbitoKey[]];
  materia: MateriaKey;
  tarea: TareaKey;
}

/** El ámbito bajo el que una herramienta se lista en el menú. */
export const ambitoPrincipal = (etiquetas: Etiquetas): AmbitoKey => etiquetas.ambito[0];
