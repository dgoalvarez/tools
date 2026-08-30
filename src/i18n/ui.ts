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
  /** La marca. Es lo que se ve; el nombre completo no aparece en el sitio. */
  brand: { es: 'DGO', en: 'DGO' },
  tagline: {
    es: 'Herramientas que hacen una cosa y la hacen bien.',
    en: 'Tools that do one thing and do them well.',
  },
  /** El <title> de la portada. El de cada herramienta es su nombre + la marca. */
  homeTitle: { es: 'Herramientas · DGO', en: 'Tools · DGO' },
  siteDescription: {
    es: 'Herramientas gratuitas: husos horarios, contraste de color y escalas tipográficas. Calculan en tu navegador y no guardan ningún dato de nadie.',
    en: 'Free tools: time zones, colour contrast and type scales. They run in your browser and store nobody’s data.',
  },

  // ---------- Navegación ----------
  navHome: { es: 'Inicio', en: 'Home' },
  navTools: { es: 'Herramientas', en: 'Tools' },
  backHome: { es: 'Volver al inicio', en: 'Back to home' },

  // ---------- Portada ----------
  homeIntro: {
    es: 'Tres herramientas para problemas concretos del trabajo diario. Todo se calcula en tu navegador: no hay cuentas, no hay cookies y no se guarda nada de nadie.',
    en: 'Three tools for concrete problems of everyday work. Everything runs in your browser: no accounts, no cookies, nothing about anyone is stored.',
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

  // ---------- Sin JavaScript ----------
  sinJs: {
    es: 'Esta herramienta calcula en tu navegador, así que necesita JavaScript. Sin él, los controles de arriba se ven pero no responden.',
    en: 'This tool computes in your browser, so it needs JavaScript. Without it the controls above are visible but inert.',
  },

  // ---------- Accesibilidad ----------
  skipToContent: { es: 'Saltar al contenido', en: 'Skip to content' },
  toLightMode: { es: 'Cambiar a modo claro', en: 'Switch to light mode' },
  toDarkMode: { es: 'Cambiar a modo oscuro', en: 'Switch to dark mode' },
  switchLanguage: { es: 'View this page in English', en: 'Ver esta página en español' },
  // Describe la imagen que se comparte. Cuando cambie og.png, cambia esto.
  ogImageAlt: {
    es: 'DGO · Herramientas gratuitas',
    en: 'DGO · Free tools',
  },
} satisfies Record<string, T>;

export type UIKey = keyof typeof UI;
