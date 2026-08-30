/**
 * Cuánto pesa de verdad cada página: el HTML más todo el JavaScript que
 * carga, comprimido con brotli, que es lo que viaja por el cable.
 *
 * No forma parte de `npm run build`: es una regla, no una alarma. Se mide
 * antes y después de un cambio para saber qué costó.
 */
import { brotliCompressSync, constants } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const br = (buf) =>
  brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;

for (const pagina of ['es/horarios', 'es/contraste', 'es/escala', 'es']) {
  const ruta = join(dist, `${pagina}.html`);
  if (!existsSync(ruta)) continue;
  const html = readFileSync(ruta);

  // Todo lo que la página acaba cargando: el script de arranque, el
  // runtime de las islas, el componente de cada isla, y lo que cada uno
  // de esos importe a su vez. Se sigue el grafo porque Astro no deja los
  // trozos en un <link rel=modulepreload>: los pide la isla al hidratarse.
  const vistos = new Set();
  const pendientes = [];

  const texto = String(html);
  for (const patron of [/<script[^>]+src="([^"]+)"/g, /(?:component|renderer)-url="([^"]+)"/g]) {
    for (const [, src] of texto.matchAll(patron)) pendientes.push(src);
  }

  let total = br(html);
  while (pendientes.length) {
    const src = pendientes.pop();
    if (!src?.startsWith('/_astro/') || vistos.has(src)) continue;
    vistos.add(src);

    const archivo = join(dist, src);
    if (!existsSync(archivo)) continue;

    const codigo = readFileSync(archivo);
    total += br(codigo);
    // Lo que ese módulo importa a su vez. Se cuentan también los
    // `import()` porque acaban cargándose: lo diferido no es gratis, solo
    // llega más tarde. Lo que de verdad se paga al abrir la página es
    // menos, y por eso al final se dice cuánto de esto es diferido.
    for (const [, dep] of String(codigo).matchAll(/["']([^"']*\/_astro\/[^"']+\.js)["']/g)) {
      pendientes.push(dep.startsWith('/') ? dep : `/_astro/${dep.split('/_astro/')[1]}`);
    }
  }

  // Lo que solo llega si alguien lo pide: el paso a paso al pulsar «?», y
  // el polyfill de Temporal al convertir una hora.
  let diferido = 0;
  for (const src of vistos) {
    if (!/driver|Tour|temporal|polyfill/i.test(src)) continue;
    const archivo = join(dist, src);
    if (existsSync(archivo)) diferido += br(readFileSync(archivo));
  }

  const alAbrir = (total - diferido) / 1024;
  console.log(
    `  ${pagina.padEnd(14)} ${alAbrir.toFixed(1)} KB al abrir` +
      (diferido ? `  +${(diferido / 1024).toFixed(1)} KB si se pide` : '')
  );
}
