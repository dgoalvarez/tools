// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://tools.dgoalvarez.com',

  // Herramientas que calculan en el navegador: no hace falta servidor.
  // Astro genera HTML plano y Vercel lo sirve tal cual.
  output: 'static',

  // Cada idioma con su prefijo, ninguno privilegiado en la estructura de
  // carpetas. Cambiar cuál es el de por defecto es cambiar `defaultLocale`.
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: true,
    },
  },

  build: {
    // Genera contraste.html en vez de contraste/index.html. Para que Vercel
    // lo sirva en /es/contraste (sin extensión ni barra final) hace falta
    // "cleanUrls" en vercel.json: sin eso, esas rutas dan 404 en producción
    // y ninguna en local, que es la peor forma de fallar.
    format: 'file',
  },

  compressHTML: true,

  integrations: [
    react(),
    sitemap({
      serialize(item) {
        // Por el formato "file" las rutas salen como /es/contraste.html. El
        // sitemap debe listar la dirección pública real, o Google indexaría
        // URLs que redirigen.
        item.url = item.url.replace(/(?:index)?\.html$/, '');

        // Declara qué páginas son traducción de cuáles. La detección
        // automática de la integración empareja por ruta idéntica, y aquí
        // no lo son: /en/contrast y /es/contraste. Se emparejan a mano.
        const pair = PAIRS.find((p) => item.url === p.en || item.url === p.es);
        if (pair) {
          item.links = [
            { lang: 'en', url: pair.en },
            { lang: 'es', url: pair.es },
          ];
        }
        return item;
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Sin esto, Astro mete los scripts pequeños dentro del HTML. Y todo
      // script en línea necesita su hash en la Content Security Policy, así
      // que cada vez que se tocara una línea de src/scripts/ habría que
      // volver a copiar un hash a vercel.json. Con cero, todos salen como
      // archivo .js y solo queda en línea el del tema, que tiene que estarlo
      // para aplicarse antes del primer pintado.
      assetsInlineLimit: 0,
    },
  },
});

/**
 * Las mismas rutas de src/i18n/routes.ts, en absoluto.
 *
 * Se repiten aquí porque el archivo de configuración no puede importar
 * TypeScript del proyecto. Si añades una página, añádela en los dos
 * sitios: scripts/check-routes.mjs falla la compilación si divergen.
 */
const SITE_URL = 'https://tools.dgoalvarez.com';
const PAIRS = [
  { en: '/en', es: '/es' },
  { en: '/en/timezones', es: '/es/horarios' },
  { en: '/en/clock', es: '/es/reloj' },
  { en: '/en/pomodoro', es: '/es/pomodoro' },
  { en: '/en/notes', es: '/es/notas' },
  { en: '/en/contrast', es: '/es/contraste' },
  { en: '/en/palette', es: '/es/paleta' },
  { en: '/en/type-scale', es: '/es/escala' },
].map((p) => ({ en: SITE_URL + p.en, es: SITE_URL + p.es }));
