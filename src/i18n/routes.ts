/**
 * La dirección de cada página en cada idioma.
 *
 * Es la única fuente de verdad de las URLs: de aquí salen los enlaces del
 * menú, el conmutador de idioma, las etiquetas `canonical` y `hreflang` y
 * el sitemap. Cambiar una ruta aquí la cambia en todo el sitio.
 *
 * Las mismas parejas están repetidas en `astro.config.mjs`, que no puede
 * importar TypeScript. `scripts/check-routes.mjs` falla la compilación si
 * los dos archivos se separan.
 */
import type { Lang } from './config';

export type PageKey =
  | 'home'
  | 'board'
  | 'timezones'
  | 'clock'
  | 'pomodoro'
  | 'notes'
  | 'contrast'
  | 'palette'
  | 'scale';

export const ROUTES: Record<PageKey, Record<Lang, string>> = {
  home: { en: '/en', es: '/es' },
  board: { en: '/en/board', es: '/es/tablero' },
  timezones: { en: '/en/timezones', es: '/es/horarios' },
  // «Pomodoro» se dice igual en los dos idiomas, así que la dirección es
  // la misma. Traducirla a «/es/tomate» sería inventar un nombre que
  // nadie busca.
  clock: { en: '/en/clock', es: '/es/reloj' },
  pomodoro: { en: '/en/pomodoro', es: '/es/pomodoro' },
  notes: { en: '/en/notes', es: '/es/notas' },
  contrast: { en: '/en/contrast', es: '/es/contraste' },
  palette: { en: '/en/palette', es: '/es/paleta' },
  scale: { en: '/en/type-scale', es: '/es/escala' },
};

/** Ruta de una página en un idioma. */
export const route = (page: PageKey, lang: Lang): string => ROUTES[page][lang];

/**
 * Las herramientas, en el orden en que se muestran.
 *
 * Este array manda en los TRES sitios donde aparece la lista —el índice
 * de la portada, el riel y la hoja de móvil—, porque los tres filtran de
 * aquí por ámbito. Cambiar el orden aquí lo cambia en los tres a la vez,
 * y esa es justo la propiedad que interesa: quien llega por la portada y
 * luego navega por la barra encuentra las cosas donde ya las había visto.
 *
 * Dentro de cada ámbito van por parejas, y la pareja de delante es la que
 * más se usa. En productividad, la nota y el pomodoro son lo de la sesión
 * que se está haciendo ahora mismo —se apuntan las tres cosas, se pone el
 * temporizador, y se vuelve—; los husos y el reloj son lo de mirar la
 * hora, que se hace de vez en cuando. En diseño, la rampa y el contraste
 * son las dos de color, y la escala va detrás porque es la de letra.
 */
export const TOOL_KEYS = [
  'notes',
  'pomodoro',
  'timezones',
  'clock',
  'palette',
  'contrast',
  'scale',
] as const satisfies readonly PageKey[];

export type ToolKey = (typeof TOOL_KEYS)[number];
