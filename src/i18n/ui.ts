/**
 * Textos de interfaz: los que no son contenido de una página concreta
 * sino que se repiten (menú, pie, botones, etiquetas de accesibilidad).
 *
 * Lo que describe a cada herramienta vive en `tools.ts`.
 */
import type { T } from './config';

export const UI = {
  // ---------- Identidad ----------
  siteName: { es: 'Herramientas', en: 'Tools' },
  siteAuthor: { es: 'Diego Alvarez', en: 'Diego Alvarez' },
  tagline: {
    es: 'Herramientas de diseño que hacen una cosa y la hacen bien.',
    en: 'Design tools that do one thing and do it well.',
  },
  /** Lo que va después del nombre de cada herramienta en el <title>. */
  titleSuffix: { es: 'Herramientas · Diego Alvarez', en: 'Tools · Diego Alvarez' },
  siteDescription: {
    es: 'Herramientas gratuitas de diseño y de trabajo: husos horarios, contraste de color y escalas tipográficas. Calculan en tu navegador y no guardan ningún dato.',
    en: 'Free tools for design and work: time zones, colour contrast and type scales. They run in your browser and store no data.',
  },

  // ---------- Navegación ----------
  navHome: { es: 'Inicio', en: 'Home' },
  navTools: { es: 'Herramientas', en: 'Tools' },
  backHome: { es: 'Volver al inicio', en: 'Back to home' },

  // ---------- Portada ----------
  homeIntro: {
    es: 'Tres herramientas para problemas concretos del oficio. Todo se calcula en tu navegador: no hay cuentas, no hay cookies y no se guarda nada de nadie.',
    en: 'Three tools for concrete problems of the craft. Everything runs in your browser: no accounts, no cookies, nothing about anyone is stored.',
  },
  openTool: { es: 'Abrir', en: 'Open' },

  // ---------- Estado «en construcción» ----------
  soonBadge: { es: 'Próximamente', en: 'Coming soon' },
  soonHeading: { es: 'Todavía no está lista', en: 'Not ready yet' },
  soonBody: {
    es: 'Esta herramienta está en construcción. La página ya existe para que su dirección no cambie cuando se publique: si la guardas ahora, seguirá funcionando.',
    en: 'This tool is being built. The page already exists so its address will not change when it ships: bookmark it now and it will keep working.',
  },

  // ---------- Pie ----------
  privacyNote: {
    es: 'Sin cuentas, sin cookies, sin base de datos. Todo se calcula en tu navegador.',
    en: 'No accounts, no cookies, no database. Everything is computed in your browser.',
  },
  madeBy: { es: 'Hecho por', en: 'Made by' },
  portfolioLink: { es: 'Ver el portafolio', en: 'View the portfolio' },

  // ---------- Accesibilidad ----------
  skipToContent: { es: 'Saltar al contenido', en: 'Skip to content' },
  toLightMode: { es: 'Cambiar a modo claro', en: 'Switch to light mode' },
  toDarkMode: { es: 'Cambiar a modo oscuro', en: 'Switch to dark mode' },
  switchLanguage: { es: 'View this page in English', en: 'Ver esta página en español' },
  ogImageAlt: {
    es: 'Diego Alvarez · Diseñador de Producto UX/UI',
    en: 'Diego Alvarez · Product Designer UX/UI',
  },
} satisfies Record<string, T>;

export type UIKey = keyof typeof UI;
