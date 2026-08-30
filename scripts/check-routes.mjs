/**
 * Comprueba que las rutas de astro.config.mjs y las de src/i18n/routes.ts
 * no se hayan separado.
 *
 * El archivo de configuración no puede importar TypeScript del proyecto,
 * así que las rutas están escritas dos veces: una para generar los enlaces
 * del sitio y otra para emparejar las traducciones en el sitemap.
 * Duplicar es aceptable si algo avisa cuando divergen; esto es ese algo.
 *
 * Se ejecuta dentro de `npm run build`, así que también corre en Vercel:
 * si alguien añade una página en un sitio y no en el otro, el despliegue
 * falla en vez de publicar un sitemap incompleto en silencio.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Extrae los pares { en, es } de un texto, ordenados. */
function pairs(source, pattern) {
  return [...source.matchAll(pattern)].map((m) => `${m[1]} | ${m[2]}`).sort();
}

const routesTs = readFileSync(join(root, 'src/i18n/routes.ts'), 'utf8');
const configMjs = readFileSync(join(root, 'astro.config.mjs'), 'utf8');

// En los dos archivos:  { en: '/en/contrast', es: '/es/contraste' },
const PAIR = /\{\s*en:\s*'([^']+)',\s*es:\s*'([^']+)'\s*\}/g;

const fromRoutes = pairs(routesTs, PAIR);
const fromConfig = pairs(configMjs, PAIR);

if (fromRoutes.length === 0) {
  console.error('✗ No se leyó ninguna ruta de src/i18n/routes.ts. ¿Cambió su formato?');
  process.exit(1);
}

const same =
  fromRoutes.length === fromConfig.length && fromRoutes.every((r, i) => r === fromConfig[i]);

if (!same) {
  console.error('\n✗ Las rutas de astro.config.mjs y src/i18n/routes.ts no coinciden.\n');
  console.error('  src/i18n/routes.ts:');
  fromRoutes.forEach((r) => console.error('    ' + r));
  console.error('\n  astro.config.mjs:');
  fromConfig.forEach((r) => console.error('    ' + r));
  console.error('\n  Añade la página que falta en el archivo donde no esté, con la misma ruta.\n');
  process.exit(1);
}

console.log(`✓ rutas sincronizadas (${fromRoutes.length} páginas por idioma)`);
