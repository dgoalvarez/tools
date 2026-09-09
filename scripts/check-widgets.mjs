/**
 * Los códigos de los widgets no se cambian nunca.
 *
 * El número de cada widget viaja DENTRO de cada código de tablero que
 * alguien haya copiado. Cambiar uno no rompe nada de forma ruidosa: el
 * código sigue siendo válido, pasa el checksum, y abre un tablero
 * distinto del que se guardó. Es la peor clase de fallo — el que no se
 * nota hasta que alguien dice «esto no es lo que yo tenía».
 *
 * `comprobar-tablero.ts` ya clava los cuatro de la primera versión con
 * una cadena de oro, pero eso solo cubre lo que existía entonces. Esto
 * cubre lo que venga: cualquier widget que ya estuviera en el último
 * commit tiene que conservar su número.
 *
 * ---------------------------------------------------------------------
 * Por qué contra git y no contra un archivo de registro
 *
 * Un archivo paralelo con «lista=0, nota=1…» habría que acordarse de
 * actualizarlo, y el día que alguien lo actualice a la vez que cambia el
 * código, la alarma se calla justo cuando hacía falta. La historia no se
 * puede actualizar de paso: es la única fuente que no miente.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVO = 'src/lib/widgets.ts';

/** Saca el mapa `clave → código` de un texto de `widgets.ts`. */
function codigosDe(texto) {
  const mapa = new Map();
  // `const lista: Widget<...> = {` seguido, más abajo, de `codigo: 0,`
  const bloques = texto.matchAll(/const (\w+): Widget<[^>]*> = \{([\s\S]*?)\n\};/g);
  for (const [, clave, cuerpo] of bloques) {
    const codigo = /^\s*codigo:\s*(\d+),/m.exec(cuerpo)?.[1];
    if (codigo !== undefined) mapa.set(clave, Number(codigo));
  }
  return mapa;
}

const ahora = codigosDe(readFileSync(join(raiz, ARCHIVO), 'utf8'));

if (ahora.size === 0) {
  console.error(`\n✗ No se pudo leer ningún código de ${ARCHIVO}. ¿Cambió su formato?\n`);
  process.exit(1);
}

/* Repetidos: dos widgets con el mismo número son indistinguibles dentro
   de un código, y eso no lo caza la comparación con git. */
const porNumero = new Map();
for (const [clave, codigo] of ahora) {
  if (porNumero.has(codigo)) {
    console.error(
      `\n✗ Dos widgets con el mismo código: «${porNumero.get(codigo)}» y «${clave}» valen ${codigo}.\n` +
        '  Dentro de un código de tablero serían la misma pieza.\n'
    );
    process.exit(1);
  }
  porNumero.set(codigo, clave);
}

let antes;
try {
  antes = codigosDe(
    execFileSync('git', ['show', `HEAD:${ARCHIVO}`], {
      cwd: raiz,
      encoding: 'utf8',
      // Sin esto, el «fatal: …» de git se cuela por la salida de error
      // la primera vez y parece que algo va mal cuando no va mal.
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  );
} catch {
  // Todavía no está en git: es el commit que lo estrena y no hay con qué
  // comparar. No es un fallo.
  console.log(`✓ códigos de widgets (${ahora.size}, primera vez: nada con que comparar)`);
  process.exit(0);
}

const cambiados = [];
for (const [clave, codigo] of antes) {
  if (!ahora.has(clave)) {
    cambiados.push(`    «${clave}» tenía el ${codigo} y ha desaparecido`);
    continue;
  }
  if (ahora.get(clave) !== codigo) {
    cambiados.push(`    «${clave}» pasó del ${codigo} al ${ahora.get(clave)}`);
  }
}

if (cambiados.length) {
  console.error('\n✗ Un código de widget cambió, y eso rompe los tableros que ya circulan.\n');
  cambiados.forEach((c) => console.error(c));
  console.error(
    '\n  Los códigos se AÑADEN al final y no se reordenan ni se quitan.\n' +
      '  Un tablero copiado con el número viejo seguiría siendo válido y\n' +
      '  abriría otra cosa, sin decir nada.\n'
  );
  process.exit(1);
}

const nuevos = [...ahora.keys()].filter((c) => !antes.has(c));
console.log(
  `✓ códigos de widgets (${ahora.size} en total` +
    (nuevos.length ? `, ${nuevos.length} nuevo${nuevos.length > 1 ? 's' : ''}` : '') +
    ', ninguno cambiado)'
);

if (!existsSync(join(raiz, 'scripts/comprobar-tablero.ts'))) {
  console.error('✗ Falta scripts/comprobar-tablero.ts, que es quien prueba los códigos.');
  process.exit(1);
}
