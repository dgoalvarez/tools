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
  // No es lo mismo que `tipografia`: aquella es de letras y escalas, esta
  // es de palabras que alguien escribe. Le servirá también a las
  // utilidades que vengan (expresiones regulares, JSON, códigos).
  texto: { es: 'Texto', en: 'Text' },
  lugares: { es: 'Lugares', en: 'Places' },
} satisfies Record<string, T>;

export type MateriaKey = keyof typeof MATERIAS;

/**
 * El acento con el que se pinta cada herramienta, por su materia.
 *
 * Los valores viven en `src/styles/global.css`, uno por tema, y están
 * comprobados: todos pasan AA sobre las tres superficies del sitio. Aquí
 * solo se dice cuál le toca a cada materia.
 *
 * Al añadir una herramienta de una materia nueva hay que derivar su
 * acento con `design/paleta-final.ts` y darlo de alta allí; mientras
 * tanto, la que no tenga el suyo se pinta con el de la marca.
 */
export const ACENTO_POR_MATERIA: Record<MateriaKey, string> = {
  tiempo: 'var(--acento-tiempo)',
  color: 'var(--acento-color)',
  tipografia: 'var(--acento-tipografia)',
  texto: 'var(--acento-texto)',
  lugares: 'var(--brand)',
};

/**
 * El relleno de los botones principales, por materia.
 *
 * No es el acento: un acento se derivó para leerse COMO TEXTO sobre el
 * fondo, y rellenar un botón con él suspende en tema oscuro. El porqué,
 * con los números medidos, está en `global.css` junto a estos valores.
 */
export const SOLIDO_POR_MATERIA: Record<MateriaKey, string> = {
  tiempo: 'var(--solido-tiempo)',
  color: 'var(--solido-color)',
  tipografia: 'var(--solido-tipografia)',
  texto: 'var(--solido-texto)',
  lugares: 'var(--l-brand)',
};

// ------------------------------------------------------------------- tarea

export const TAREAS = {
  convertir: { es: 'Convertir', en: 'Convert' },
  comprobar: { es: 'Comprobar', en: 'Check' },
  generar: { es: 'Generar', en: 'Generate' },
  buscar: { es: 'Buscar', en: 'Find' },
  cronometrar: { es: 'Cronometrar', en: 'Time it' },
  anotar: { es: 'Anotar', en: 'Jot down' },
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
