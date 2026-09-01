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
  // El riel desplegado, que es el estado que hay que mirar además del
  // plegado: se guarda en el <html> antes del primer pintado.
  {
    nombre: 'riel-abierto',
    ruta: 'es/paleta',
    ancho: 1440,
    alto: 1000,
    guion: "document.documentElement.dataset.riel = 'abierto';",
  },
  // La hoja de móvil abierta.
  {
    nombre: 'hoja-movil',
    ruta: 'es/paleta',
    ancho: 485,
    alto: 900,
    clics: ['[data-hoja-abrir]'],
  },
  // Sin nada puesto: el primer vistazo de verdad, con la tarjeta de en
  // vivo todavía vacía y enseñando para qué sirve.
  { nombre: 'husos', ruta: 'es/horarios', ancho: 1440, alto: 900 },
  // La tarjeta de en vivo con sitio puesto y sin hora: la cifra grande
  // corriendo, y debajo la diferencia con la referencia.
  {
    nombre: 'husos-vivo',
    ruta: 'es/horarios',
    ancho: 1440,
    alto: 900,
    query: 'v=America%2FNew_York~Miami%2C%20Florida&z=Europe/Madrid,America/Lima',
  },
  // Con una hora puesta: el estado al que se llega tocando cualquier
  // hora, y en el que cada fila enseña además la de verdad en pequeño.
  {
    nombre: 'husos-fija',
    ruta: 'es/horarios',
    ancho: 1440,
    alto: 900,
    query:
      'd=2026-09-04&h=17:00&v=America%2FNew_York~Miami%2C%20Florida&z=America/Los_Angeles,Europe/Madrid',
  },
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
    query: 'v=Asia%2FTokyo~Tokio&z=America/New_York,Asia/Kolkata,Europe/Madrid',
  },
  {
    nombre: 'husos-estrecho',
    ruta: 'es/horarios',
    ancho: 485,
    alto: 900,
    query: 'v=America%2FNew_York~Miami%2C%20Florida&z=Asia/Tokyo,Asia/Kolkata',
  },
  { nombre: 'paleta', ruta: 'es/paleta', ancho: 1440, alto: 1200 },
  { nombre: 'paleta-claro', ruta: 'es/paleta', ancho: 1440, alto: 1200, tema: 'light' },
  { nombre: 'paleta-estrecho', ruta: 'es/paleta', ancho: 485, alto: 900 },
  // Las tintas desplegadas: es donde se comprueba que la frontera de
  // polaridad se ve.
  {
    nombre: 'paleta-tintas',
    ruta: 'es/paleta',
    ancho: 1440,
    alto: 1200,
    clics: ['[data-tour="tintas"] summary'],
  },
  // El selector abierto: es lo que hay que mirar para saber si el popover
  // tapa algo o si empuja la cuadrícula.
  {
    nombre: 'paleta-selector',
    ruta: 'es/paleta',
    ancho: 1440,
    alto: 1200,
    clics: ['.disparador-color'],
  },
  // En inglés, para ver que los nombres de las variables van en inglés.
  { nombre: 'paleta-en', ruta: 'en/palette', ancho: 1440, alto: 1000 },
  { nombre: 'contraste', ruta: 'es/contraste', ancho: 1440, alto: 1000 },
  { nombre: 'escala', ruta: 'es/escala', ancho: 1440, alto: 1000 },
  { nombre: 'contraste-claro', ruta: 'es/contraste', ancho: 1440, alto: 1000, tema: 'light' },
  { nombre: 'escala-claro', ruta: 'es/escala', ancho: 1440, alto: 1000, tema: 'light' },
  { nombre: 'reloj', ruta: 'es/reloj', ancho: 1440, alto: 1100 },
  { nombre: 'reloj-claro', ruta: 'es/reloj', ancho: 1440, alto: 1100, tema: 'light' },
  { nombre: 'reloj-esfera', ruta: 'es/reloj', ancho: 1440, alto: 1100, query: 'c=analogica' },
  // El reloj mundial con sitios puestos: no se llega de otra forma.
  {
    nombre: 'reloj-mundial',
    ruta: 'es/reloj',
    ancho: 1440,
    alto: 1200,
    query:
      'w=America%2FNew_York~Carolina%20del%20Norte%20(hora%20oriental)%3BAmerica%2FLos_Angeles~Los%20%C3%81ngeles%3BAsia%2FTokyo~Tokio%3BEurope%2FMadrid~Madrid',
  },
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
      clave: 'dgo-pomodoro',
      valor: { estado: 'andando', fase: 'trabajo', hechos: 2, terminaEn: Date.now() + 9 * 60_000 },
    },
  },
  // El margen entre fases, que no se alcanza de ninguna otra forma: hay
  // que esperar a que una fase acabe.
  {
    nombre: 'pomodoro-margen',
    ruta: 'es/pomodoro',
    ancho: 1440,
    alto: 1000,
    siembra: {
      clave: 'dgo-pomodoro',
      valor: { estado: 'margen', fase: 'corto', hechos: 3, empiezaEn: Date.now() + 300_000 },
    },
  },
  // La libreta: vacía, que es como se llega, y con cosas dentro, que es
  // el estado al que no se llega de otra forma que sembrándolo.
  { nombre: 'notas', ruta: 'es/notas', ancho: 1440, alto: 900 },
  {
    nombre: 'notas-llena',
    ruta: 'es/notas',
    ancho: 1440,
    alto: 900,
    siembra: {
      clave: 'dgo-tools-notas',
      valor: {
        v: 1,
        tareas: [
          {
            id: 'a',
            texto: 'derivar el acento y medirlo con la propia herramienta',
            hecha: true,
          },
          {
            id: 'b',
            texto: 'reencuadrar los copys de husos',
            hecha: true,
          },
          {
            id: 'c',
            texto: 'comprobar que no da tirón al restaurar',
            hecha: false,
          },
          {
            id: 'd',
            texto: 'capturas en claro y en oscuro',
            hecha: false,
          },
          {
            id: 'e',
            texto: 'subir y mirar en producción',
            hecha: false,
          },
        ],
        nota: 'Rama: notas\nAcento: #0169cd claro / #2c8efe oscuro\n\nEl frambuesa del plan chocaba con --danger (tono 30).',
      },
    },
  },
  {
    nombre: 'notas-llena-claro',
    ruta: 'es/notas',
    ancho: 1440,
    alto: 900,
    tema: 'light',
    siembra: {
      clave: 'dgo-tools-notas',
      valor: {
        v: 1,
        tareas: [
          {
            id: 'a',
            texto: 'derivar el acento y medirlo con la propia herramienta',
            hecha: true,
          },
          {
            id: 'b',
            texto: 'reencuadrar los copys de husos',
            hecha: true,
          },
          {
            id: 'c',
            texto: 'comprobar que no da tirón al restaurar',
            hecha: false,
          },
          {
            id: 'd',
            texto: 'capturas en claro y en oscuro',
            hecha: false,
          },
          {
            id: 'e',
            texto: 'subir y mirar en producción',
            hecha: false,
          },
        ],
        nota: 'Rama: notas\nAcento: #0169cd claro / #2c8efe oscuro\n\nEl frambuesa del plan chocaba con --danger (tono 30).',
      },
    },
  },
  {
    nombre: 'notas-estrecho',
    ruta: 'es/notas',
    ancho: 485,
    alto: 900,
    siembra: {
      clave: 'dgo-tools-notas',
      valor: {
        v: 1,
        tareas: [
          {
            id: 'a',
            texto: 'derivar el acento y medirlo con la propia herramienta',
            hecha: true,
          },
          {
            id: 'b',
            texto: 'reencuadrar los copys de husos',
            hecha: true,
          },
          {
            id: 'c',
            texto: 'comprobar que no da tirón al restaurar',
            hecha: false,
          },
          {
            id: 'd',
            texto: 'capturas en claro y en oscuro',
            hecha: false,
          },
          {
            id: 'e',
            texto: 'subir y mirar en producción',
            hecha: false,
          },
        ],
        nota: 'Rama: notas\nAcento: #0169cd claro / #2c8efe oscuro\n\nEl frambuesa del plan chocaba con --danger (tono 30).',
      },
    },
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

/**
 * Siembra `sessionStorage` antes de que hidrate la isla.
 *
 * Era solo del pomodoro y ahora la usan dos herramientas, así que la
 * clave viaja con el valor. Es la única forma de mirar un estado al que
 * no se llega pulsando: una cuenta a medias o una libreta con doce cosas
 * apuntadas.
 *
 * El valor se mete con `JSON.stringify` DOS veces, y no es un descuido.
 * La primera hace el JSON que se guarda; la segunda lo convierte en un
 * literal de JavaScript bien escapado. Sin la segunda, un salto de línea
 * dentro de la nota salía como \n dentro de una cadena de JavaScript, que
 * al ejecutarse volvía a ser un salto de verdad, y ese salto dentro de una
 * cadena de JSON la invalida. La libreta se leía rota y la captura salía
 * vacía — en verde, sin decir nada.
 */
const sembrar = ({ clave, valor }) => `<script>
  try { sessionStorage.setItem(${JSON.stringify(clave)}, ${JSON.stringify(JSON.stringify(valor))}); } catch (e) {}
</script>`;

/**
 * Una copia de la página, retocada para poder mirar lo que no se ve solo:
 * el tema claro —que no hay bandera de Chrome para pedirlo— y el paso a
 * paso, que solo aparece si alguien pulsa el botón.
 */
function preparar(ruta, { tema, tour, siembra, clics, guion }) {
  const marca = [
    tema ?? '',
    tour === undefined ? '' : `t${tour}`,
    siembra ? 's' : '',
    clics ? 'c' : '',
    guion ? 'g' : '',
  ]
    .filter(Boolean)
    .join('_');
  const copia = join(dist, `_ver_${marca}_${ruta.replace(/\//g, '_')}.html`);

  let html = readFileSync(join(dist, `${ruta}.html`), 'utf8');

  /*
    Todo lo que hay que dejar puesto ANTES de que la página se monte, y va
    nada más abrir el <head> por un motivo concreto.

    El tema se pedía escribiendo `data-theme` en el <html>. Dejó de
    funcionar el día que el script en línea de la maqueta pasó a BORRAR ese
    atributo cuando nadie ha elegido tema — que es lo correcto, porque si
    no, al cambiar de página con el enrutador se quedaría pegado el tema de
    la anterior. La captura «clara» salía oscura, sin decir nada.

    Ahora se pide como lo pediría una persona: dejando la elección en
    `localStorage`. Y por eso esto tiene que ir ANTES del script de la
    maqueta, no al final del <head>, que es donde iba la siembra.
  */
  const preludio =
    (tema
      ? `<script>try { localStorage.setItem('dgo-tools-theme', '${tema}'); } catch (e) {}</script>`
      : '') + (siembra ? sembrar(siembra) : '');

  if (preludio) html = html.replace('<head>', '<head>' + preludio);
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
      ruta = copia
        .slice(dist.length + 1)
        .replace(/\\/g, '/')
        .replace(/\.html$/, '');
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
