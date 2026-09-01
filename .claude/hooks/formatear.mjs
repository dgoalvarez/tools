/**
 * Pasa Prettier por el archivo que se acaba de tocar.
 *
 * Se engancha en `PostToolUse` sobre Edit y Write. Existe porque escribir
 * `npx prettier --write` a mano después de cada tanda de cambios es una
 * tarea que nadie recuerda hasta que el archivo ya está feo, y porque un
 * formato que va y viene ensucia los diffs de cosas que nadie decidió.
 *
 * Tres decisiones:
 *
 *   · **Los `.astro` no se tocan.** El Prettier de este proyecto no trae
 *     su intérprete y responde «No parser could be inferred». Se arregla
 *     con `prettier-plugin-astro`, pero eso reformatearía todas las
 *     vistas de golpe, y eso es una decisión, no un hook.
 *   · **Se llama al binario, no a `npx`.** `npx` mira si hay que
 *     descargar algo antes de arrancar, y eso son cientos de
 *     milisegundos en CADA edición.
 *   · **Nunca falla.** Un hook que rompe por un archivo a medio escribir
 *     interrumpe el trabajo por un problema de formato. Si algo sale mal,
 *     se calla y sale con cero.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { extname, join, relative, isAbsolute } from 'node:path';

const EXTENSIONES = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.json', '.md']);

let entrada = '';
process.stdin.setEncoding('utf8');
for await (const trozo of process.stdin) entrada += trozo;

try {
  const evento = JSON.parse(entrada);
  const archivo = evento?.tool_input?.file_path;
  if (!archivo || !EXTENSIONES.has(extname(archivo))) process.exit(0);

  const raiz = evento.cwd ?? process.cwd();

  // Solo lo que está dentro del proyecto: un archivo del bloc de notas o
  // de otro repo no es asunto de este formateador.
  const dentro = relative(raiz, archivo);
  if (dentro.startsWith('..') || isAbsolute(dentro)) process.exit(0);

  const prettier = join(raiz, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
  if (!existsSync(prettier) || !existsSync(archivo)) process.exit(0);

  spawnSync(process.execPath, [prettier, '--write', archivo], {
    cwd: raiz,
    stdio: 'ignore',
    timeout: 15_000,
  });
} catch {
  // Ni una palabra: esto no puede estorbar.
}

process.exit(0);
