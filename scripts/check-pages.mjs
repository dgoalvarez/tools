/**
 * Comprueba que cada ruta declarada tenga de verdad su página publicada.
 *
 * `src/i18n/routes.ts` es la fuente de verdad de las URLs: de ahí salen el
 * menú, el conmutador de idioma y el sitemap. Pero declarar una ruta no
 * crea la página: eso lo hace un archivo en `src/pages/en/` y otro en
 * `src/pages/es/`.
 *
 * Si se añade la ruta y se olvidan las páginas, todo compila sin quejarse,
 * el menú enlaza a esa dirección y quien pulse se encuentra un 404. Esto lo
 * convierte en un fallo ruidoso.
 *
 * Se ejecuta después de `astro build`, sobre lo que realmente se va a
 * publicar, así que también detecta un archivo mal nombrado o una página
 * que dejó de generarse por cualquier otro motivo.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

if (!existsSync(dist)) {
  console.error('✗ No existe dist/. Ejecuta la compilación antes de esta comprobación.');
  process.exit(1);
}

const routesTs = readFileSync(join(root, 'src/i18n/routes.ts'), 'utf8');

const rutas = [...routesTs.matchAll(/\{\s*en:\s*'([^']+)',\s*es:\s*'([^']+)'\s*\}/g)].flatMap(
  (m) => [m[1], m[2]]
);

if (rutas.length === 0) {
  console.error('✗ No se pudo leer ninguna ruta de src/i18n/routes.ts. ¿Cambió su formato?');
  process.exit(1);
}

// El sitio se compila con build.format: 'file', así que /es/contraste se
// publica como dist/es/contraste.html y /es como dist/es.html.
const faltan = rutas.filter((r) => !existsSync(join(dist, `${r}.html`)));

if (faltan.length) {
  console.error('\n✗ Hay rutas declaradas que no tienen página publicada.\n');
  faltan.forEach((r) => console.error(`    ${r}   (falta dist${r}.html)`));
  console.error(
    '\n  Cada ruta de src/i18n/routes.ts necesita su archivo en src/pages/.\n' +
      '  Por ejemplo, /es/contraste necesita src/pages/es/contraste.astro,\n' +
      '  que solo elige idioma y herramienta.\n'
  );
  process.exit(1);
}

console.log(`✓ páginas publicadas (${rutas.length} rutas, todas con su HTML)`);
