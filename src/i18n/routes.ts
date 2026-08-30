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

export type PageKey = 'home' | 'timezones' | 'contrast' | 'scale';

export const ROUTES: Record<PageKey, Record<Lang, string>> = {
  home: { en: '/en', es: '/es' },
  timezones: { en: '/en/timezones', es: '/es/horarios' },
  contrast: { en: '/en/contrast', es: '/es/contraste' },
  scale: { en: '/en/type-scale', es: '/es/escala' },
};

/** Ruta de una página en un idioma. */
export const route = (page: PageKey, lang: Lang): string => ROUTES[page][lang];

/** Las tres herramientas, en el orden en que se muestran. */
export const TOOL_KEYS = ['timezones', 'contrast', 'scale'] as const satisfies readonly PageKey[];

export type ToolKey = (typeof TOOL_KEYS)[number];
