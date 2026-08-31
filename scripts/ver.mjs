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
  { nombre: 'reloj', ruta: 'es/reloj', ancho: 1440, alto: 1100 },
  { nombre: 'reloj-claro', ruta: 'es/reloj', ancho: 1440, alto: 1100, tema: 'light' },
  { nombre: 'reloj-esfera', ruta: 'es/reloj', ancho: 1440, alto: 1100, query: 'c=analogica' },
  { nombre: 'reloj-estrecho', ruta: 'es/reloj', ancho: 485, alto: 900 },
  // Doce vueltas: es donde la lista deja de crecer y pasa a desplazarse
  // dentro de su caja.
  {
    nombre: 'reloj-muchas-vueltas',
    ruta: 'es/reloj',
    ancho: 1440,
    alto: 1200,
    guion: `
      const mandos = await esperar(() => document.querySelector('[data-tour="cronometro"] .mandos-modo'));
      mandos.querySelectorAll('button')[0].click();
      for (let i = 0; i < 12; i++) {
        document.querySelectorAll('[data-tour="cronometro"] .mandos-modo button')[1].click();
        await new Promise((r) => setTimeout(r, 60));
      }
    `,
  },
  // El temporizador ya cumplido: contando hacia arriba y ofreciendo más
  // tiempo. No se llega pulsando; hay que poner un segundo y esperar.
  {
    nombre: 'reloj-cumplido',
    ruta: 'es/reloj',
    ancho: 1440,
    alto: 1200,
    guion: `
      const campo = await esperar(() => document.querySelector('#puesta-minutos'));
      esc(campo, '0');
      const seg = document.querySelector('#puesta-segundos');
      esc(seg, '1');
      await new Promise((r) => setTimeout(r, 200));
      const botones = document.querySelectorAll('[data-tour="temporizador"] button');
      botones[botones.length - 1].click();
      await new Promise((r) => setTimeout(r, 2500));
    `,
  },
  // El cronómetro con vueltas: se arranca y se le sacan tres, que es lo
  // único que hace aparecer la tabla.
  {
    nombre: 'reloj-vueltas',
    ruta: 'es/reloj',
    ancho: 1440,
    alto: 1300,
    clics: [
      '[data-tour="cronometro"] .mandos-modo button',
      '[data-tour="cronometro"] .mandos-modo button:nth-of-type(2)',
      '[data-tour="cronometro"] .mandos-modo button:nth-of-type(2)',
      '[data-tour="cronometro"] .mandos-modo button:nth-of-type(2)',
    ],
  },
  { nombre: 'pomodoro', ruta: 'es/pomodoro', ancho: 1440, alto: 1000 },
  { nombre: 'pomodoro-claro', ruta: 'es/pomodoro', ancho: 1440, alto: 1000, tema: 'light' },
  // El ciclo largo con las duraciones al tope: doce puntos y «180:00»
  // dentro del anillo, que es donde el reloj puede quedarse estrecho.
  {
    nombre: 'pomodoro-ciclo-largo',
    ruta: 'es/pomodoro',
    ancho: 1440,
    alto: 1000,
    query: 'w=180&b=60&l=120&c=12',
  },
  { nombre: 'pomodoro-estrecho', ruta: 'es/pomodoro', ancho: 485, alto: 900 },
  // En marcha, con el anillo a medio llenar y varios tramos hechos.
  {
    nombre: 'pomodoro-andando',
    ruta: 'es/pomodoro',
    ancho: 1440,
    alto: 1000,
    siembra: {
      estado: 'andando',
      fase: 'trabajo',
      hechos: 2,
      terminaEn: Date.now() + 9 * 60_000,
    },
  },
  // El margen entre fases, que no se alcanza de ninguna otra forma: hay
  // que esperar a que una fase acabe.
  {
    nombre: 'pomodoro-margen',
    ruta: 'es/pomodoro',
    ancho: 1440,
    alto: 1000,
    siembra: { estado: 'margen', fase: 'corto', hechos: 3, empiezaEn: Date.now() + 300_000 },
  },
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
 * Un guion que pulsa cosas antes de la captura.
 *
 * Existe por el reloj: el cronómetro y el temporizador viven detrás de
 * una pestaña, así que sin pulsar no hay nada que mirar. Se espera a que
 * el elemento exista, porque la isla hidrata cuando le toca.
 */
const pulsar = (pasos) => `<script>
window.addEventListener('load', () => {
  const cola = ${JSON.stringify(pasos)};
  let i = 0;
  const t = setInterval(() => {
    if (i >= cola.length) { clearInterval(t); return; }
    const el = document.querySelector(cola[i]);
    if (!el) return;
    el.click();
    i++;
  }, 120);
});
</script>`;

/**
 * Un guion libre que se ejecuta al cargar.
 *
 * Los clics llegan hasta donde llega un botón. Para ver un temporizador
 * ya cumplido hay que escribir en un campo y esperar a que la cuenta
 * llegue a cero, y eso no es una pulsación.
 */
const guionLibre = (cuerpo) => `<script>
window.addEventListener('load', () => {
  function esc(el, v) {
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function esperar(fn) {
    return new Promise((ok) => {
      const t = setInterval(() => { const r = fn(); if (r) { clearInterval(t); ok(r); } }, 100);
    });
  }
  (async () => { ${cuerpo} })();
});
</script>`;

/** Siembra `sessionStorage` antes de que hidrate la isla. */
const sembrar = (cuenta) => `<script>
  try { sessionStorage.setItem('dgo-pomodoro', '${JSON.stringify(cuenta)}'); } catch (e) {}
</script>`;

/**
 * Una copia de la página, retocada para poder mirar lo que no se ve solo:
 * el tema claro —que no hay bandera de Chrome para pedirlo— y el paso a
 * paso, que solo aparece si alguien pulsa el botón.
 */
function preparar(ruta, { tema, tour, siembra, clics, guion }) {
  const marca = [tema ?? '', tour === undefined ? '' : `t${tour}`, siembra ? 's' : '', clics ? 'c' : '', guion ? 'g' : '']
    .filter(Boolean)
    .join('_');
  const copia = join(dist, `_ver_${marca}_${ruta.replace(/\//g, '_')}.html`);

  let html = readFileSync(join(dist, `${ruta}.html`), 'utf8');
  if (tema) html = html.replace('<html ', `<html data-theme="${tema}" `);
  // La siembra va en el <head>: tiene que estar puesta antes de que la
  // isla lea `sessionStorage` al montarse.
  if (siembra) html = html.replace('</head>', sembrar(siembra) + '</head>');
  if (tour !== undefined) html = html.replace('</body>', abrirTour(tour) + '</body>');
  if (clics) html = html.replace('</body>', pulsar(clics) + '</body>');
  if (guion) html = html.replace('</body>', guionLibre(guion) + '</body>');

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
    if (vista.tema || vista.tour !== undefined || vista.siembra || vista.clics || vista.guion) {
      const copia = preparar(vista.ruta, {
        tema: vista.tema,
        tour: vista.tour,
        siembra: vista.siembra,
        clics: vista.clics,
        guion: vista.guion,
      });
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
