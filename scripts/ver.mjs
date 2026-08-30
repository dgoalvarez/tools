/**
 * Pantallazos de lo que se acaba de compilar.
 *
 * Uso:  npm run build && node scripts/ver.mjs
 * Sale: capturas/*.png
 *
 * Existe por un motivo concreto: hasta ahora el sitio se razonaba pero no
 * se miraba, y eso deja pasar cosas que solo se ven viéndolas. Tres
 * fallos reales salieron en la primera tanda de capturas —la barra
 * lateral aplastándose con la ventana baja, la barra de móvil
 * desbordando, y el «Más» que no aparecía nunca porque su regla iba
 * después de la consulta de medios—. Ninguno de los tres lo habría
 * cazado una comprobación de las que hay.
 *
 * No es una alarma y no va en `npm run build`: una captura no sabe si
 * está bien, solo la enseña. Es una herramienta para mirar.
 *
 * ---------------------------------------------------------------------
 * Dos avisos sobre Chrome sin cabeza, que costaron un rato:
 *
 *   · `--window-size` NO es el ancho de maquetación. Chrome le descuenta
 *     el marco de la ventana (unos 31 px) y además tiene un mínimo por
 *     abajo de unos 485 px. Aquí se pide el ancho con el descuento ya
 *     sumado, y el propio archivo dice a qué ancho salió de verdad.
 *   · La captura se recorta al `--window-size`, no al ancho de
 *     maquetación. Si no coinciden, el pantallazo parece que desborda
 *     cuando no desborda. Quien mire una captura y crea ver un corte,
 *     que compruebe `scrollWidth` antes de arreglar nada.
 */
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'dist');
const salida = join(raiz, 'capturas');
const PUERTO = 8765;

/** El marco que Chrome le quita a --window-size. */
const MARCO = 31;

const CANDIDATOS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const chrome = CANDIDATOS.find(existsSync);
if (!chrome) {
  console.error('✗ No hay Chrome ni Edge donde suelen estar. Sin navegador no hay capturas.');
  process.exit(1);
}

if (!existsSync(dist)) {
  console.error('✗ No existe dist/. Compila antes: npm run build');
  process.exit(1);
}

/**
 * Qué se mira.
 *
 * `tema: 'light'` no se puede pedir por bandera —Chrome no tiene una para
 * `prefers-color-scheme`— así que se sirve una copia de la página con
 * `data-theme="light"` puesto a mano en el <html>.
 */
const VISTAS = [
  { nombre: 'portada', ruta: 'es', ancho: 1440, alto: 900 },
  { nombre: 'husos', ruta: 'es/horarios', ancho: 1440, alto: 900 },
  { nombre: 'contraste', ruta: 'es/contraste', ancho: 1440, alto: 1000 },
  { nombre: 'escala', ruta: 'es/escala', ancho: 1440, alto: 1000 },
  { nombre: 'contraste-claro', ruta: 'es/contraste', ancho: 1440, alto: 1000, tema: 'light' },
  { nombre: 'escala-claro', ruta: 'es/escala', ancho: 1440, alto: 1000, tema: 'light' },
  { nombre: 'husos-ventana-baja', ruta: 'es/horarios', ancho: 1280, alto: 420 },
  { nombre: 'escala-estrecho', ruta: 'es/escala', ancho: 485, alto: 760 },
  { nombre: 'contraste-estrecho', ruta: 'es/contraste', ancho: 485, alto: 760 },
];

/** Una copia de la página con el tema forzado, para poder verlo en claro. */
function conTema(ruta, tema) {
  const original = join(dist, `${ruta}.html`);
  const copia = join(dist, `_ver_${tema}_${ruta.replace(/\//g, '_')}.html`);
  const html = readFileSync(original, 'utf8').replace('<html ', `<html data-theme="${tema}" `);
  writeFileSync(copia, html);
  return copia;
}

const temporales = [];
mkdirSync(salida, { recursive: true });

const servidor = spawn('python', ['-m', 'http.server', String(PUERTO)], {
  cwd: dist,
  stdio: 'ignore',
});

// Un respiro para que el servidor levante antes de pedirle nada.
await new Promise((r) => setTimeout(r, 700));

try {
  for (const vista of VISTAS) {
    let ruta = vista.ruta;
    if (vista.tema) {
      const copia = conTema(vista.ruta, vista.tema);
      temporales.push(copia);
      ruta = copia.slice(dist.length + 1).replace(/\\/g, '/').replace(/\.html$/, '');
    }

    const archivo = join(salida, `${vista.nombre}.png`);
    execFileSync(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=2',
        `--window-size=${vista.ancho + MARCO},${vista.alto}`,
        '--virtual-time-budget=7000',
        `--screenshot=${archivo}`,
        `http://localhost:${PUERTO}/${ruta}.html`,
      ],
      { stdio: 'ignore' }
    );

    console.log(`  ${vista.nombre.padEnd(20)} ${vista.ancho}×${vista.alto}`);
  }
} finally {
  servidor.kill();
  for (const t of temporales) rmSync(t, { force: true });
}

console.log(`\n✓ ${VISTAS.length} capturas en capturas/\n`);
