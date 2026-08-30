/**
 * Comprueba que la Content Security Policy autorice todos los scripts que
 * van escritos dentro del HTML.
 *
 * La CSP no permite scripts en línea salvo los que declara por su hash. El
 * del tema tiene que ir en línea —si se cargara desde fuera habría un
 * destello del tema equivocado antes de aplicarse— así que va por hash.
 *
 * El problema de un hash escrito a mano es que se queda obsoleto en
 * silencio: alguien edita el script, el hash deja de cuadrar, el navegador
 * lo bloquea, y el sitio ignora el tema elegido sin que nadie entienda por
 * qué. Esto lo convierte en un fallo ruidoso.
 *
 * Revisa TODAS las páginas, no una: una isla de React puede introducir un
 * script en línea en unas páginas y no en otras.
 *
 * Hoy son tres los scripts autorizados, y conviene saber de dónde sale cada
 * uno:
 *
 *   1. El del tema, escrito a mano en src/layouts/Base.astro.
 *   2 y 3. El motor de islas de Astro, que las emite en línea por ser muy
 *      cortas. Cambian al actualizar Astro, no al tocar este proyecto.
 *
 * Por eso, después de un `npm update` de Astro, es normal que esta
 * comprobación falle: pega los hashes nuevos en vercel.json y sigue. Que
 * falle es justo lo que se busca — la alternativa sería que la página se
 * publicara rota.
 *
 * Se ejecuta después de `astro build`, así que también corre en Vercel.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

if (!existsSync(dist)) {
  console.error('✗ No existe dist/. Ejecuta la compilación antes de esta comprobación.');
  process.exit(1);
}

/** Todos los HTML publicados. */
function allHtml(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...allHtml(path));
    else if (entry.name.endsWith('.html')) out.push(path);
  }
  return out;
}

const pages = allHtml(dist);

if (pages.length === 0) {
  console.error('✗ No se encontró ningún HTML en dist/. ¿Falló la compilación?');
  process.exit(1);
}

const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');

/** hash -> páginas donde aparece ese script en línea. */
const encontrados = new Map();

for (const page of pages) {
  const html = readFileSync(page, 'utf8');

  // Los <script> sin src son los que la CSP tiene que autorizar por hash.
  // El JSON-LD no es ejecutable: script-src no lo cubre.
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(([, attrs]) => !/type="application\/ld\+json"/.test(attrs))
    .map(([, , body]) => body);

  for (const body of inline) {
    const hash = `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`;
    if (!encontrados.has(hash)) encontrados.set(hash, []);
    encontrados.get(hash).push(relative(dist, page));
  }
}

if (encontrados.size === 0) {
  console.error('✗ No se encontró ningún script en línea. ¿Desapareció el del tema en Base.astro?');
  process.exit(1);
}

const faltan = [...encontrados.keys()].filter((h) => !vercel.includes(h));

if (faltan.length) {
  console.error('\n✗ La Content Security Policy no autoriza todos los scripts en línea.\n');
  console.error(`  Scripts en línea distintos: ${encontrados.size}`);
  console.error('  Hash que falta en vercel.json:\n');
  faltan.forEach((h) => {
    console.error(`    '${h}'`);
    console.error(`       aparece en: ${encontrados.get(h).slice(0, 3).join(', ')}`);
  });
  console.error(
    '\n  Cópialo dentro de script-src en vercel.json, entre comillas simples,\n' +
      '  sustituyendo al que hubiera antes.\n'
  );
  process.exit(1);
}

console.log(
  `✓ CSP sincronizada (${encontrados.size} scripts en línea autorizados, ${pages.length} páginas revisadas)`
);
