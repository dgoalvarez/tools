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
  // Con ciudades de verdad: es donde se ve si la lista aguanta. Van por
  // la dirección, que es como se comparte un cálculo en este sitio.
  {
    nombre: 'husos-llena',
    ruta: 'es/horarios',
    ancho: 1440,
    alto: 900,
    query:
      'z=America/New_York,Europe/Madrid,Asia/Tokyo,Europe/London,America/Los_Angeles,Asia/Kolkata,Pacific/Auckland,America/Sao_Paulo',
  },
  {
    nombre: 'husos-llena-claro',
    ruta: 'es/horarios',
    ancho: 1440,
    alto: 900,
    tema: 'light',
    query: 'z=America/New_York,Asia/Tokyo,Asia/Kolkata,Europe/Madrid',
  },
  {
    nombre: 'husos-estrecho',
    ruta: 'es/horarios',
    ancho: 485,
    alto: 900,
    query: 'z=America/New_York,Asia/Tokyo,Asia/Kolkata',
  },
  { nombre: 'contraste', ruta: 'es/contraste', ancho: 1440, alto: 1000 },
  { nombre: 'escala', ruta: 'es/escala', ancho: 1440, alto: 1000 },
  { nombre: 'contraste-claro', ruta: 'es/contraste', ancho: 1440, alto: 1000, tema: 'light' },
  { nombre: 'escala-claro', ruta: 'es/escala', ancho: 1440, alto: 1000, tema: 'light' },
  { nombre: 'husos-ventana-baja', ruta: 'es/horarios', ancho: 1280, alto: 420 },
  { nombre: 'escala-estrecho', ruta: 'es/escala', ancho: 485, alto: 760 },
  { nombre: 'contraste-estrecho', ruta: 'es/contraste', ancho: 485, alto: 760 },

  // El paso a paso. Se mira el primero, uno de en medio y el último,
  // que es donde «Saltar» desaparece porque «Listo» hace lo mismo.
  { nombre: 'tour-1', ruta: 'es/escala', ancho: 1440, alto: 760, tour: 0 },
  { nombre: 'tour-6', ruta: 'es/escala', ancho: 1440, alto: 760, tour: 5 },
  { nombre: 'tour-9', ruta: 'es/escala', ancho: 1440, alto: 900, tour: 8 },
  { nombre: 'tour-claro', ruta: 'es/contraste', ancho: 1440, alto: 760, tema: 'light', tour: 2 },
];

/**
 * El guion que abre el paso a paso solo y avanza hasta el paso pedido.
 *
 * La animación de entrada se pone a cero: con el tiempo virtual de Chrome
 * una captura la pilla a medias y la tarjeta sale traslúcida, que parece
 * un fallo y no lo es.
 */
const abrirTour = (avanzar) => `<style>
  /* La animación de entrada, apagada del todo. Bajo el tiempo virtual de
     Chrome no llega a completarse, y la captura pilla la tarjeta a medio
     aparecer: sale traslúcida y se lee la página por debajo. Parece un
     fallo de la tarjeta y no lo es. */
  .driver-fade .driver-popover { animation: none !important; opacity: 1 !important; }
</style>
<script>
window.addEventListener('load', () => {
  let hechos = 0;
  const t = setInterval(() => {
    const b = document.querySelector('button.ayuda');
    if (!b) return;
    clearInterval(t);
    b.click();
    const paso = setInterval(() => {
      if (hechos >= ${avanzar}) { clearInterval(paso); return; }
      const n = document.querySelector('.driver-popover-next-btn');
      if (n) { n.click(); hechos++; }
    }, 300);
  }, 120);
});
<\/script>`;

/**
 * Una copia de la página, retocada para poder mirar lo que no se ve solo:
 * el tema claro —que no hay bandera de Chrome para pedirlo— y el paso a
 * paso, que solo aparece si alguien pulsa el botón.
 */
function preparar(ruta, { tema, tour }) {
  const marca = [tema ?? '', tour === undefined ? '' : `t${tour}`].filter(Boolean).join('_');
  const copia = join(dist, `_ver_${marca}_${ruta.replace(/\//g, '_')}.html`);

  let html = readFileSync(join(dist, `${ruta}.html`), 'utf8');
  if (tema) html = html.replace('<html ', `<html data-theme="${tema}" `);
  if (tour !== undefined) html = html.replace('</body>', abrirTour(tour) + '</body>');

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
    if (vista.tema || vista.tour !== undefined) {
      const copia = preparar(vista.ruta, { tema: vista.tema, tour: vista.tour });
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
        // El paso a paso necesita más tiempo: hay que abrirlo y pulsar
        // «Siguiente» una vez por cada paso que se quiera avanzar. Se
        // compara con undefined y no por verdadero: el primer paso es 0.
        `--virtual-time-budget=${vista.tour !== undefined ? 9000 + vista.tour * 1400 : 7000}`,
        `--screenshot=${archivo}`,
        `http://localhost:${PUERTO}/${ruta}.html${vista.query ? `?${vista.query}` : ''}`,
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
