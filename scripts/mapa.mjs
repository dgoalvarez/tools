/**
 * El mapa del proyecto, derivado del código.
 *
 * Uso:  node scripts/mapa.mjs              escribe docs/MAPA.md
 *       node scripts/mapa.mjs --comprobar  falla si el que hay se quedó viejo
 *
 * ---------------------------------------------------------------------
 * Para qué
 *
 * Para no volver a averiguar lo mismo. Cada sesión gasta un rato en
 * preguntas que el código ya contesta: qué herramientas hay, qué ruta
 * tiene cada una en cada idioma, de qué materia es y por tanto de qué
 * color, qué archivos son suyos, qué exporta cada módulo de `src/lib`,
 * qué caza cada alarma. Son respuestas que no cambian mientras nadie las
 * cambie, y buscarlas cuesta media docena de lecturas cada vez.
 *
 * ---------------------------------------------------------------------
 * Por qué se genera y no se escribe
 *
 * Un mapa escrito a mano es exacto el día que se escribe. A la tercera
 * herramienta miente, y un mapa que miente es peor que no tenerlo:
 * manda a leer un archivo que ya no existe.
 *
 * Este sale del código, así que solo puede mentir si el código cambió y
 * nadie lo volvió a generar — y de eso se encarga `--comprobar`, que va
 * en la compilación con las demás alarmas.
 *
 * ---------------------------------------------------------------------
 * Cómo sabe qué archivo es de qué herramienta
 *
 * Siguiendo las importaciones, no adivinando por el nombre. Las claves
 * son inglesas y los archivos españoles: `clock` vive en `Reloj.tsx`,
 * `palette` calcula en `rampa.ts`, `scale` se pinta en `TypeScale.tsx`.
 * El primer intento emparejaba por nombre y dejaba media tabla vacía.
 *
 * Se empieza por las vistas, que son las que dicen a qué herramienta
 * sirven —`<Tool tool="palette">`— y desde ahí se tira del hilo: la
 * vista importa su isla, la isla importa su aritmética y sus textos, y
 * las comprobaciones importan la aritmética.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const destino = join(raiz, 'docs', 'MAPA.md');
const comprobando = process.argv.includes('--comprobar');

/** Fuera los comentarios: una clave detrás de un comentario se perdía. */
const limpio = (fuente) => fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const leer = (ruta) => limpio(readFileSync(join(raiz, ruta), 'utf8'));
const crudo = (ruta) => readFileSync(join(raiz, ruta), 'utf8');
const hay = (ruta) => existsSync(join(raiz, ruta));

const routes = leer('src/i18n/routes.ts');
const tools = leer('src/i18n/tools.ts');
const labels = leer('src/i18n/labels.ts');
const tour = leer('src/i18n/tour.ts');
const css = crudo('src/styles/global.css');
const paquete = JSON.parse(crudo('package.json'));

// ------------------------------------------------------------ utilidades

const listaDe = (fuente, expresion) =>
  (expresion.exec(fuente)?.[1] ?? '')
    .split(',')
    .map((s) => s.trim().replace(/'/g, ''))
    .filter(Boolean);

/**
 * El trozo de un objeto que va desde `clave: {` o `clave: [` hasta que se
 * cierra.
 *
 * El cierre es `\n  },` o `\n  ],` con dos espacios: la sangría dice que
 * es de primer nivel. Buscar el cierre seguido de la siguiente clave no
 * valía —entre una entrada y otra del paso a paso hay una línea en blanco
 * y un comentario— y el bloque se comía hasta el final del archivo. Se
 * notaba en que el pomodoro decía tener veintinueve pasos.
 */
function bloqueDe(fuente, clave, abre) {
  const desde = fuente.indexOf(`\n  ${clave}: ${abre}`);
  if (desde === -1) return '';
  const hasta = fuente.indexOf(abre === '{' ? '\n  },' : '\n  ],', desde);
  return fuente.slice(desde, hasta === -1 ? undefined : hasta);
}

/** Los archivos del proyecto que importa un archivo. */
function importaciones(ruta) {
  const fuente = crudo(ruta);
  const salida = [];
  for (const m of fuente.matchAll(/from '([^']+)'/g)) {
    const destino = m[1];
    if (!destino.startsWith('.') && !destino.startsWith('@/')) continue;
    const limpia = destino.replace(/^@\//, 'src/').replace(/^\.\.\//, 'src/').replace(/^\.\//, '');
    salida.push(limpia);
  }
  return salida;
}

/** Resuelve una importación sin extensión al archivo que existe. */
function resolver(parcial) {
  for (const fin of ['', '.ts', '.tsx', '.astro']) {
    const r = parcial.startsWith('src/') ? parcial + fin : `src/${parcial}${fin}`;
    if (hay(r) && statSync(join(raiz, r)).isFile()) return r;
  }
  return null;
}

// ------------------------------------------------------- las herramientas

const CLAVES = listaDe(routes, /const TOOL_KEYS = \[([\s\S]*?)\] as const/);

const rutas = {};
for (const m of routes.matchAll(/^\s{2}(\w+): \{ en: '([^']*)', es: '([^']*)' \},/gm)) {
  rutas[m[1]] = { en: m[2], es: m[3] };
}

/**
 * Lo compartido no es de nadie.
 *
 * `config.ts` y `ui.ts` los importa todo el mundo, y listarlos en las
 * siete herramientas no dice nada: siete listas idénticas son ruido. Se
 * quedan fuera, igual que las maquetas y los componentes.
 */
const COMPARTIDO = /(config|routes|labels|tools|tour|ui|url-state|utils)\.ts$/;
const propio = (ruta) =>
  !!ruta &&
  !ruta.startsWith('src/layouts') &&
  !ruta.startsWith('src/components') &&
  !COMPARTIDO.test(ruta);

/** Qué vista sirve a qué herramienta, y de ahí todo lo demás. */
const archivosPorClave = Object.fromEntries(CLAVES.map((c) => [c, new Set()]));

for (const archivo of readdirSync(join(raiz, 'src/views'))) {
  if (!archivo.endsWith('.astro')) continue;
  const ruta = `src/views/${archivo}`;
  const clave = /tool="(\w+)"/.exec(crudo(ruta))?.[1];
  if (!clave || !archivosPorClave[clave]) continue;

  archivosPorClave[clave].add(ruta);

  for (const parcial of importaciones(ruta)) {
    const suyo = resolver(parcial);
    if (!propio(suyo)) continue;
    archivosPorClave[clave].add(suyo);

    // Y lo que a su vez importa la isla: su aritmética y sus textos.
    if (suyo.startsWith('src/islands')) {
      for (const dentro of importaciones(suyo)) {
        const hondo = resolver(dentro);
        if (propio(hondo)) archivosPorClave[clave].add(hondo);
      }
    }
  }
}

// Las comprobaciones se emparejan por la aritmética que importan.
for (const archivo of readdirSync(join(raiz, 'scripts'))) {
  if (!archivo.startsWith('comprobar-') || !archivo.endsWith('.ts')) continue;
  const fuente = crudo(`scripts/${archivo}`);
  /*
    A una sola herramienta: la primera del riel que use esa aritmética.

    `timezones.ts` lo usan ahora dos —husos y el reloj mundial— y sin este
    corte `comprobar-husos.ts` aparecía también bajo Reloj, que es cierto
    y engañoso a la vez.
  */
  let colocada = false;
  for (const m of fuente.matchAll(/from '\.\.\/src\/lib\/(\w+)\.ts'/g)) {
    if (colocada) break;
    const lib = `src/lib/${m[1]}.ts`;
    for (const clave of CLAVES) {
      if (archivosPorClave[clave].has(lib)) {
        archivosPorClave[clave].add(`scripts/${archivo}`);
        colocada = true;
        break;
      }
    }
  }
}

// ------------------------------------------------------------- el mapa

const lineas = [];
const pon = (s = '') => lineas.push(s);

pon('# El mapa');
pon();
pon('> **Generado.** No lo edites a mano: sale de `scripts/mapa.mjs`, que lo');
pon('> deriva del propio código siguiendo las importaciones. Si algo aquí no');
pon('> cuadra, es que hay que volver a generarlo — y la compilación lo dice.');
pon('>');
pon('> `npm run mapa`');
pon();
pon('Existe para no volver a averiguar lo mismo cada sesión.');
pon();

const materias = {};

pon('## Las herramientas');
pon();
pon('| | Ruta · es | Ruta · en | Materia | Tarea | Ámbito | Pasos |');
pon('| --- | --- | --- | --- | --- | --- | --- |');

for (const clave of CLAVES) {
  const bloque = bloqueDe(tools, clave, '{');
  const nombre = /name: \{ es: '([^']*)'/.exec(bloque)?.[1] ?? clave;
  const materia = /materia: '(\w+)'/.exec(bloque)?.[1] ?? '—';
  const tarea = /tarea: '(\w+)'/.exec(bloque)?.[1] ?? '—';
  const ambito = listaDe(bloque, /ambito: \[([^\]]*)\]/)[0] ?? '—';
  const pasos = (bloqueDe(tour, clave, '[').match(/ancla: '/g) ?? []).length;
  const r = rutas[clave] ?? { es: '?', en: '?' };

  materias[materia] = (materias[materia] ?? 0) + 1;
  pon(
    `| **${nombre}** | \`${r.es}\` | \`${r.en}\` | ${materia} | ${tarea} | ${ambito} | ${pasos} |`
  );
}
pon();

pon('### Los archivos de cada una');
pon();
for (const clave of CLAVES) {
  const nombre = /name: \{ es: '([^']*)'/.exec(bloqueDe(tools, clave, '{'))?.[1] ?? clave;
  const suyos = [...archivosPorClave[clave]].sort();
  pon(`**${nombre}** · \`${clave}\``);
  pon();
  for (const a of suyos) pon(`- \`${a}\``);
  pon();
}

// ---------- los colores ----------
const MATERIAS = [...labels.matchAll(/^\s{2}(\w+): \{ es: '[^']*', en: '[^']*' \},/gm)]
  .map((m) => m[1])
  .filter((m) => new RegExp(`--l-${m}:`).test(css));

pon('## Materias y colores');
pon();
pon('Dos herramientas comparten color solo si comparten materia. Los valores');
pon('salen de `design/*.ts`, derivados en OKLCH y medidos: nada entra si no');
pon('pasa AA sobre los tres fondos de su tema.');
pon();
pon('| Materia | Tema claro | Tema oscuro | Herramientas |');
pon('| --- | --- | --- | --- |');
for (const m of MATERIAS) {
  const claro = new RegExp(`--l-${m}: (#[0-9a-f]{6})`, 'i').exec(css)?.[1] ?? '—';
  const oscuro = new RegExp(`--d-${m}: (#[0-9a-f]{6})`, 'i').exec(css)?.[1] ?? '—';
  pon(`| ${m} | \`${claro}\` | \`${oscuro}\` | ${materias[m] ?? 0} |`);
}
const peligro = /--l-danger: (#[0-9a-f]{6})/i.exec(css)?.[1];
if (peligro) pon(`| *(peligro)* | \`${peligro}\` | \`${/--d-danger: (#[0-9a-f]{6})/i.exec(css)?.[1]}\` | — |`);
pon();
pon('El relleno de los botones es `--solido-<materia>`: el valor claro en los');
pon('dos temas, con tinta blanca encima. **Nunca el acento** — con tinta');
pon('oscura ninguno pasa, y está medido en `comprobar-contraste.ts` §10.');
pon();

// ---------- la aritmética ----------
pon('## La aritmética · `src/lib`');
pon();
pon('Sin React ni DOM: se corre con `node`, y por eso se puede comprobar.');
pon();
for (const archivo of readdirSync(join(raiz, 'src/lib')).sort()) {
  if (!archivo.endsWith('.ts')) continue;
  const fuente = leer(`src/lib/${archivo}`);
  const funciones = [...fuente.matchAll(/^export (?:async )?function (\w+)/gm)].map((m) => m[1]);
  const constantes = [...fuente.matchAll(/^export const (\w+)/gm)].map((m) => m[1]);
  const tipos = [...fuente.matchAll(/^export (?:interface|type) (\w+)/gm)].map((m) => m[1]);

  pon(`**\`${archivo}\`**`);
  if (funciones.length) pon(`- funciones · ${funciones.map((n) => `\`${n}\``).join(', ')}`);
  if (constantes.length) pon(`- constantes · ${constantes.map((n) => `\`${n}\``).join(', ')}`);
  if (tipos.length) pon(`- tipos · ${tipos.map((n) => `\`${n}\``).join(', ')}`);
  pon();
}

// ---------- las alarmas ----------
pon('## Las alarmas');
pon();
pon('| Guion | Cuándo | Qué caza |');
pon('| --- | --- | --- |');
const QUE_CAZA = {
  'check-routes.mjs': 'que `routes.ts` y `astro.config.mjs` se separen',
  'check-etiquetas.mjs': 'una etiqueta o un color que no existe',
  'check-pages.mjs': 'una ruta declarada sin HTML publicado',
  'check-tour.mjs': 'un paso que señala a algo que ya no está',
  'check-csp.mjs': 'un script en línea sin su hash en la CSP',
  'mapa.mjs': 'que este mapa se quede viejo',
};
for (const archivo of readdirSync(join(raiz, 'scripts')).sort()) {
  if (!archivo.startsWith('check-') && archivo !== 'mapa.mjs') continue;
  pon(`| \`${archivo}\` | compilación | ${QUE_CAZA[archivo] ?? '—'} |`);
}
pon('| `comprobar-*.ts` | `npm run comprobar` | la aritmética de cada herramienta |');
pon('| `comprobar-roturas.mjs` | `npm run romper` | que algo se salga de su caja |');
pon('| `comprobar-navegacion.mjs` | `npm run navegar` | tirones al cargar y recargas al navegar |');
pon('| `ver.mjs` | `npm run ver` | nada: hace capturas para mirarlas |');
pon();

// ---------- los datos ----------
const dirDatos = join(raiz, 'public', 'data');
if (existsSync(dirDatos)) {
  pon('## Los datos');
  pon();
  pon('Salen de `scripts/build-data.mjs`, que **no** se ejecuta salvo que se');
  pon('pida: descarga 780 MB de GeoNames y regenera esto, que va versionado.');
  pon();
  pon('| Archivo | Tamaño | Contiene |');
  pon('| --- | --- | --- |');
  for (const archivo of readdirSync(dirDatos).sort()) {
    const kb = (statSync(join(dirDatos, archivo)).size / 1024).toFixed(0);
    const datos = JSON.parse(readFileSync(join(dirDatos, archivo), 'utf8'));
    const trozos = Object.entries(datos)
      .filter(([, v]) => v && typeof v === 'object')
      .map(
        ([k, v]) =>
          `${(Array.isArray(v) ? v.length : Object.keys(v).length).toLocaleString('es')} ${k}`
      );
    pon(`| \`${archivo}\` | ${kb} KB | ${trozos.join(', ')} |`);
  }
  pon();
}

// ---------- los comandos ----------
pon('## Los comandos');
pon();
for (const [nombre, orden] of Object.entries(paquete.scripts)) {
  const corta = orden.length > 88 ? orden.slice(0, 85) + '…' : orden;
  pon(`- **\`npm run ${nombre}\`** — \`${corta}\``);
}
pon();

const nuevo = lineas.join('\n') + '\n';

// --------------------------------------------------------------- salida

if (comprobando) {
  const viejo = existsSync(destino) ? readFileSync(destino, 'utf8') : '';
  if (viejo !== nuevo) {
    console.error('\n✗ docs/MAPA.md se quedó viejo. Vuelve a generarlo:\n');
    console.error('    npm run mapa\n');
    process.exit(1);
  }
  console.log('✓ el mapa cuadra con el código');
  process.exit(0);
}

mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, nuevo);
console.log(`✓ docs/MAPA.md · ${CLAVES.length} herramientas`);
