/**
 * Comprueba que ninguna herramienta se quede fuera de sus grupos ni sin
 * color.
 *
 * `src/i18n/labels.ts` decía en un comentario que esta comprobación
 * existía. No existía. Se escribe ahora, que es cuando entra la primera
 * materia nueva desde entonces —«texto», la de Notas— y por tanto la
 * primera oportunidad real de equivocarse.
 *
 * Son cuatro modos de fallo, y los cuatro son silenciosos:
 *
 *   1. **Una etiqueta que no existe.** `materia: 'testo'` no rompe nada al
 *      compilar si el tipo se relaja, y la herramienta sale sin rótulo.
 *   2. **Un ámbito fuera de `ORDEN_AMBITOS`.** El grupo no se pinta, así
 *      que la herramienta desaparece del riel y de la hoja de móvil sin
 *      que nadie borre nada.
 *   3. **Una materia sin acento o sin sólido.** El mapa apunta a una
 *      variable CSS que no existe, y `var(--acento-loquesea)` sin valor de
 *      reserva deja el rótulo de materia transparente y el botón sin
 *      relleno. En la pantalla se ve como un hueco, no como un error.
 *   4. **Una herramienta declarada y sin ficha**, o al revés.
 *
 * Se lee el TEXTO de los archivos y no se importan, como el resto de las
 * alarmas de `scripts/check-*.mjs`: así esto corre antes de compilar y no
 * depende de que TypeScript esté sano.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Fuera los comentarios antes de leer nada.
 *
 * Se descubrió en el primer intento: TOOL_KEYS lleva un comentario entre
 * dos claves, la lista se partía por las comas y la clave que venía
 * detrás del comentario se perdía. La alarma decía «6 herramientas»
 * habiendo siete, y en verde — que es la peor forma de fallar.
 *
 * Se quitan los de bloque y los de línea que empiezan una línea, que son
 * los que estorban. Los que van al final de una línea de código no se
 * tocan: ahí un «//» puede ser parte de una dirección.
 */
const limpio = (fuente) =>
  fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const leer = (ruta) => limpio(readFileSync(join(root, ruta), 'utf8'));

const labels = leer('src/i18n/labels.ts');
const tools = leer('src/i18n/tools.ts');
const routes = leer('src/i18n/routes.ts');
const css = readFileSync(join(root, 'src/styles/global.css'), 'utf8');

const problemas = [];

/** Las claves de un objeto `const NOMBRE = { clave: … }`. */
function clavesDe(fuente, nombre) {
  const bloque = new RegExp(`const ${nombre} = \\{([\\s\\S]*?)\\n\\} satisfies`, 'm').exec(fuente);
  if (!bloque) {
    problemas.push(`no se encuentra el objeto ${nombre}`);
    return [];
  }
  return [...bloque[1].matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]);
}

/** Los pares de un `Record<…, string>` como ACENTO_POR_MATERIA. */
function mapaDe(fuente, nombre) {
  const bloque = new RegExp(`const ${nombre}: Record<[^>]*> = \\{([\\s\\S]*?)\\n\\};`, 'm').exec(
    fuente
  );
  if (!bloque) {
    problemas.push(`no se encuentra el mapa ${nombre}`);
    return {};
  }
  const out = {};
  for (const m of bloque[1].matchAll(/^\s{2}(\w+): '([^']*)',/gm)) out[m[1]] = m[2];
  return out;
}

const AMBITOS = clavesDe(labels, 'AMBITOS');
const MATERIAS = clavesDe(labels, 'MATERIAS');
const TAREAS = clavesDe(labels, 'TAREAS');

const ORDEN = (/const ORDEN_AMBITOS: AmbitoKey\[\] = \[([^\]]*)\]/.exec(labels)?.[1] ?? '')
  .split(',')
  .map((s) => s.trim().replace(/'/g, ''))
  .filter(Boolean);

const ACENTOS = mapaDe(labels, 'ACENTO_POR_MATERIA');
const SOLIDOS = mapaDe(labels, 'SOLIDO_POR_MATERIA');

/** Las herramientas declaradas, en el orden en que se listan. */
const CLAVES = (/const TOOL_KEYS = \[([\s\S]*?)\] as const/.exec(routes)?.[1] ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s.startsWith("'"))
  .map((s) => s.replace(/'/g, ''));

if (CLAVES.length === 0) problemas.push('no se encuentra TOOL_KEYS en routes.ts');

// ---------------------------------------------------------------- fichas
for (const clave of CLAVES) {
  const desde = tools.indexOf(`\n  ${clave}: {`);
  if (desde === -1) {
    problemas.push(`${clave}: está en TOOL_KEYS pero no tiene ficha en tools.ts`);
    continue;
  }
  // Hasta la siguiente herramienta, o hasta el final del objeto.
  const siguiente = tools.indexOf('\n  },\n  ', desde);
  const bloque = tools.slice(desde, siguiente === -1 ? undefined : siguiente);

  const ambitos = (/ambito: \[([^\]]*)\]/.exec(bloque)?.[1] ?? '')
    .split(',')
    .map((s) => s.trim().replace(/'/g, ''))
    .filter(Boolean);
  const materia = /materia: '(\w+)'/.exec(bloque)?.[1];
  const tarea = /tarea: '(\w+)'/.exec(bloque)?.[1];

  if (ambitos.length === 0) problemas.push(`${clave}: no declara ningún ámbito`);
  for (const a of ambitos) {
    if (!AMBITOS.includes(a)) problemas.push(`${clave}: el ámbito «${a}» no existe en AMBITOS`);
    if (!ORDEN.includes(a)) {
      problemas.push(`${clave}: el ámbito «${a}» no está en ORDEN_AMBITOS, así que su grupo no se pinta`);
    }
  }

  if (!materia) problemas.push(`${clave}: no declara materia`);
  else if (!MATERIAS.includes(materia)) {
    problemas.push(`${clave}: la materia «${materia}» no existe en MATERIAS`);
  }

  if (!tarea) problemas.push(`${clave}: no declara tarea`);
  else if (!TAREAS.includes(tarea)) {
    problemas.push(`${clave}: la tarea «${tarea}» no existe en TAREAS`);
  }
}

// ------------------------------------------------------------- el color
for (const materia of MATERIAS) {
  for (const [nombre, mapa] of [
    ['ACENTO_POR_MATERIA', ACENTOS],
    ['SOLIDO_POR_MATERIA', SOLIDOS],
  ]) {
    const valor = mapa[materia];
    if (!valor) {
      problemas.push(`la materia «${materia}» no tiene entrada en ${nombre}`);
      continue;
    }
    // Y la variable a la que apunta tiene que existir de verdad: un
    // `var(--acento-loquesea)` sin valor deja el rótulo transparente.
    const variable = /var\((--[\w-]+)\)/.exec(valor)?.[1];
    if (!variable) continue;
    if (!css.includes(`${variable}:`)) {
      problemas.push(`${nombre}[${materia}] apunta a ${variable}, que no está en global.css`);
    }
  }
}

// ------------------------------------------------------- ámbitos huérfanos
for (const a of AMBITOS) {
  if (!ORDEN.includes(a)) problemas.push(`el ámbito «${a}» existe pero no está en ORDEN_AMBITOS`);
}

if (problemas.length > 0) {
  console.error('\n✗ Las etiquetas no cuadran.\n');
  for (const p of problemas) console.error(`  · ${p}`);
  console.error('');
  process.exit(1);
}

console.log(
  `✓ etiquetas en orden (${CLAVES.length} herramientas, ${MATERIAS.length} materias con su color)`
);
