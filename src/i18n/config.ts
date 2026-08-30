/**
 * Los dos idiomas del sitio.
 *
 * Cada página existe en una URL propia por idioma (/en/retto y /es/retto),
 * en vez de mandar los dos textos y ocultar uno con CSS como antes. Eso
 * permite declarar el idioma real en <html lang>, que es lo que usan los
 * lectores de pantalla para pronunciar, y lo que Google necesita para
 * mostrar la versión correcta a cada persona.
 */

export const LANGS = ['en', 'es'] as const;

export type Lang = (typeof LANGS)[number];

/** El que vive en la raíz redirigida y al que apunta hreflang="x-default". */
export const DEFAULT_LANG: Lang = 'en';

/** Un texto en los dos idiomas. */
export interface T {
  en: string;
  es: string;
}

/** Elige la variante que toca. */
export const t = (value: T, lang: Lang): string => value[lang];

/** El otro idioma, para el conmutador. */
export const otherLang = (lang: Lang): Lang => (lang === 'en' ? 'es' : 'en');

/** Etiquetas de los idiomas, en su propia lengua. */
export const LANG_NAME: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
};

/** Códigos completos para og:locale. */
export const OG_LOCALE: Record<Lang, string> = {
  en: 'en_US',
  es: 'es_ES',
};
