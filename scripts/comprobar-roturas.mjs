/**
 * ¿Se sale algo de su caja?
 *
 * Uso:  npm run build && node scripts/comprobar-roturas.mjs
 *
 * Existe por un fallo concreto. Al elegir un origen de nombre largo en
 * husos horarios —«Santo Domingo de los Colorados, Santo Domingo de los
 * Tsáchilas»— la tarjeta de la cita crecía de 352 px a 597 y se llevaba
 * por delante su título y los campos de fecha y hora, montándose encima
 * de la columna de al lado.
 *
 * Lo que lo hace peligroso es que NO desbordaba la página: la tarjeta
 * crecía dentro de su columna, así que `scrollWidth === clientWidth`
 * seguía diciendo que todo iba bien. Ninguna de las comprobaciones que
 * había lo habría visto, y una captura solo lo enseña si a alguien se le
 * ocurre escribir justo ese nombre.
 *
 * Aquí se compara cada elemento con su padre, y se le da contenido
 * hostil a propósito: nombres largos, ocho ciudades, prefijos absurdos.
 *
 * ---------------------------------------------------------------------
 * Por qué no va en `npm run build`
 *
 * Necesita un navegador, y la compilación tiene que funcionar en una
 * máquina que no lo tenga. Se ejecuta a mano, como `npm run comprobar`.
 *
 * Se ha comprobado que la sonda sirve para algo de las dos maneras: sobre
 * la versión con el fallo dice «se sale 263px», y sobre la arreglada dice
 * «nada roto». Una alarma que nunca suena no es una alarma.
 */
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'dist');
const PUERTO = 8787;

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
  console.error('✗ No hay Chrome ni Edge donde suelen estar. Sin navegador no se puede comprobar.');
  process.exit(1);
}

if (!existsSync(dist)) {
  console.error('✗ No existe dist/. Compila antes: npm run build');
  process.exit(1);
}

/**
 * La sonda. Compara cada elemento con su padre y se salta los padres que
 * recortan o desplazan a propósito: ahí salirse es lo que se ha pedido,
 * que es exactamente cómo funciona `truncate`.
 */
const SONDA = `
window.__romperse = function () {
  const rotos = [];
  for (const el of document.querySelectorAll('body *')) {
    const padre = el.parentElement;
    if (!padre || padre === document.body) continue;
    const cp = getComputedStyle(padre);
    if (cp.overflowX !== 'visible' || cp.overflowY !== 'visible') continue;
    const ce = getComputedStyle(el);
    if (ce.position === 'absolute' || ce.position === 'fixed' || ce.display === 'none') continue;
    const r = el.getBoundingClientRect();
    const rp = padre.getBoundingClientRect();
    if (r.width === 0 || rp.width === 0) continue;

    const exceso = Math.max(rp.left - r.left, r.right - rp.right);
    if (exceso > 1) {
      if (rotos.some((x) => x.el.contains(el))) continue;
      rotos.push({ el, que: 'se sale ' + Math.round(exceso) + 'px' });
    }
  }

  /*
   * Segunda pregunta, y distinta de la primera: ¿hay alguna caja a la
   * que no le quepan sus propios hijos a lo alto?
   *
   * Existe porque al llegar la quinta herramienta, la barra de abajo del
   * móvil —que tiene el alto fijo— dejó de dar de sí: «Escala
   * tipográfica» partió en dos líneas y la segunda se quedó por debajo
   * del borde de la barra, encima de la página. De ANCHO no sobraba
   * nada, así que la comprobación de arriba decía que todo iba bien.
   *
   * Se miran los HIJOS y no «scrollHeight», que era lo primero que se
   * probó y marcaba las 39 comprobaciones. Un titular con el interlineado
   * ajustado tiene «scrollHeight» mayor que «clientHeight» por dos o
   * tres píxeles —el glifo asoma de su caja de línea— y eso es
   * tipografía normal, no una rotura. Los hijos, en cambio, o caben o no
   * caben.
   */
  for (const el of document.querySelectorAll('body *')) {
    const c = getComputedStyle(el);
    if (c.overflowY !== 'visible' || c.display === 'none') continue;
    if (!el.firstElementChild) continue;

    // Un <details> cerrado mide lo que mide su resumen, pero su cuerpo
    // sigue devolviendo el alto entero. No se ve, así que no se sale.
    if (el.tagName === 'DETAILS' && !el.open) continue;

    const r = el.getBoundingClientRect();
    if (r.height === 0) continue;

    let sobra = 0;
    for (const hijo of el.children) {
      const ch = getComputedStyle(hijo);
      if (ch.position === 'absolute' || ch.position === 'fixed' || ch.display === 'none') continue;

      // Un hijo en línea devuelve sus cajas de LÍNEA, no una caja de
      // bloque, y esas asoman por encima y por debajo de un padre con el
      // interlineado ajustado. Es el mismo ruido tipográfico de antes,
      // entrando por la puerta de al lado.
      if (ch.display === 'inline') continue;

      const rh = hijo.getBoundingClientRect();
      if (rh.height === 0) continue;
      sobra = Math.max(sobra, rh.bottom - r.bottom, r.top - rh.top);
    }

    if (sobra > 1) {
      if (rotos.some((x) => x.el.contains(el))) continue;
      rotos.push({
        el,
        que: 'no le caben sus hijos, le faltan ' + Math.round(sobra) + 'px de alto',
      });
    }
  }

  return rotos.slice(0, 6).map((x) =>
    x.el.tagName.toLowerCase() + '.' + (String(x.el.className).slice(0, 30) || '-') +
    ' ' + x.que
  );
};
`;

/** Escribe en un campo de React: el valor va por el setter nativo. */
const ESCRIBIR = `
function __escribir(el, valor) {
  var proto = el.tagName === 'TEXTAREA'
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(el, valor);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
function __esperar(fn, ms) {
  return new Promise((ok, mal) => {
    const t0 = Date.now();
    const t = setInterval(() => {
      const r = fn();
      if (r) { clearInterval(t); ok(r); }
      else if (Date.now() - t0 > (ms || 12000)) { clearInterval(t); mal(new Error('no llegó')); }
    }, 100);
  });
}
`;

/** El caso que destapó todo: elegir a mano un origen de nombre larguísimo. */
const ORIGEN_LARGO = `
(async () => {
  const d = await __esperar(() => document.querySelector('details[data-tour="origen"]'));
  d.open = true;
  const campo = await __esperar(() => document.querySelector('#origen'));
  __escribir(campo, 'santo domingo de los');
  const opcion = await __esperar(() => d.querySelector('ul button'));
  opcion.click();
  await new Promise((r) => setTimeout(r, 900));
  d.open = false;
})()
`;

/**
 * El pomodoro en marcha y con varios tramos hechos: es cuando aparece
 * «Empezar de cero» junto al título y los puntos del ciclo se llenan.
 * Se llega pulsando, porque un estado en marcha no cabe en la dirección.
 */
const POMODORO_ANDANDO = `
(async () => {
  const mandos = await __esperar(() => document.querySelector('.reloj-pomodoro .mandos'));
  mandos.querySelector('button').click();
  const saltar = mandos.querySelectorAll('button')[2];
  for (let i = 0; i < 5; i++) { saltar.click(); await new Promise((r) => setTimeout(r, 60)); }
  await new Promise((r) => setTimeout(r, 400));
})()
`;

/** La alarma puesta: aparece la cuenta atrás y el día en que caerá. */
const RELOJ_ALARMA = `
(async () => {
  // Hijo directo de la tarjeta: el botón salió de «.fila-alarma» cuando
  // el campo de la hora pasó a ir solo en su fila.
  const boton = await __esperar(() => document.querySelector('[data-tour="alarma"] > button'));
  boton.click();
  await new Promise((r) => setTimeout(r, 400));
})()
`;

/** El cronómetro con vueltas, que es cuando aparece la tabla. */
const RELOJ_VUELTAS = `
(async () => {
  const mandos = await __esperar(() => document.querySelector('[data-tour="cronometro"] .mandos-modo'));
  mandos.querySelectorAll('button')[0].click();
  const vuelta = () => document.querySelectorAll('[data-tour="cronometro"] .mandos-modo button')[1];
  for (let i = 0; i < 4; i++) { vuelta().click(); await new Promise((r) => setTimeout(r, 90)); }
  await new Promise((r) => setTimeout(r, 400));
})()
`;

/** El temporizador ya cumplido: cuenta hacia arriba y ofrece más tiempo. */
const RELOJ_CUMPLIDO = `
(async () => {
  const min = await __esperar(() => document.querySelector('#puesta-minutos'));
  __escribir(min, '0');
  __escribir(document.querySelector('#puesta-segundos'), '1');
  await new Promise((r) => setTimeout(r, 200));
  const botones = document.querySelectorAll('[data-tour="temporizador"] button');
  botones[botones.length - 1].click();
  await new Promise((r) => setTimeout(r, 2500));
})()
`;

/** Cuarenta líneas con texto largo, y una nota de un párrafo. */
const NOTAS_LLENA = `
(async () => {
  const campo = await __esperar(() => document.querySelector('.campo-nuevo'));
  const formulario = campo.closest('form');
  for (let i = 0; i < 40; i++) {
    __escribir(campo, 'tarea numero ' + i + ' con un texto bastante largo para apretar la fila');
    formulario.requestSubmit();
    await new Promise((r) => setTimeout(r, 15));
  }
  const nota = document.querySelector('.campo-nota');
  __escribir(nota, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(30));
  await new Promise((r) => setTimeout(r, 500));
})()
`;

/** Una línea de trescientos caracteres sin un solo espacio. */
const NOTAS_SIN_ESPACIOS = `
(async () => {
  const campo = await __esperar(() => document.querySelector('.campo-nuevo'));
  const formulario = campo.closest('form');
  __escribir(campo, 'x'.repeat(300));
  formulario.requestSubmit();
  await new Promise((r) => setTimeout(r, 100));
  __escribir(document.querySelector('.campo-nota'), 'y'.repeat(300));
  await new Promise((r) => setTimeout(r, 500));
})()
`;

/**
 * Qué se somete a qué.
 *
 * `hacer` es lo que hay que tocar antes de mirar, para los estados a los
 * que no se llega por la dirección.
 */
const CASOS = [
  {
    nombre: 'husos · ocho ciudades',
    ruta: 'es/horarios',
    query:
      'z=America/New_York,Asia/Tokyo,Europe/Madrid,Asia/Kolkata,Pacific/Auckland,Europe/London,America/Sao_Paulo,America/Los_Angeles',
  },
  { nombre: 'husos · origen de nombre largo', ruta: 'es/horarios', hacer: ORIGEN_LARGO },
  { nombre: 'contraste · par que suspende', ruta: 'es/contraste', query: 't=8a8a8a&b=ffffff' },
  { nombre: 'contraste · par que aprueba', ruta: 'es/contraste' },
  {
    nombre: 'escala · nombres y prefijo absurdos',
    ruta: 'es/escala',
    query:
      'p=prefijoLarguisimoDeVerdad&n=0:nombreExageradamenteLargoParaProbar,1:otroNombreMuyMuyLargo',
  },
  { nombre: 'escala · con pasos apagados', ruta: 'es/escala', query: 'x=2,4' },
  { nombre: 'escala · fluida encendida', ruta: 'es/escala', query: 'f=1' },
  {
    nombre: 'escala · fluida y con nombres largos',
    ruta: 'es/escala',
    query: 'f=1&p=prefijoLarguisimoDeVerdad&n=0:nombreExageradamenteLargoParaProbar',
  },
  {
    nombre: 'pomodoro · duraciones al máximo',
    ruta: 'es/pomodoro',
    query: 'w=180&b=60&l=120&c=12',
  },
  {
    nombre: 'pomodoro · en marcha, ciclo largo',
    ruta: 'es/pomodoro',
    query: 'c=12',
    hacer: POMODORO_ANDANDO,
  },
  { nombre: 'pomodoro · en inglés', ruta: 'en/pomodoro', query: 'w=180&c=12' },
  { nombre: 'reloj · digital', ruta: 'es/reloj' },
  { nombre: 'reloj · esfera', ruta: 'es/reloj', query: 'c=analogica' },
  { nombre: 'reloj · alarma puesta', ruta: 'es/reloj', hacer: RELOJ_ALARMA },
  { nombre: 'reloj · cronómetro con vueltas', ruta: 'es/reloj', hacer: RELOJ_VUELTAS },
  { nombre: 'reloj · temporizador cumplido', ruta: 'es/reloj', hacer: RELOJ_CUMPLIDO },
  { nombre: 'reloj · en inglés', ruta: 'en/clock', query: 'h=12' },
  { nombre: 'paleta · de fábrica', ruta: 'es/paleta' },
  {
    nombre: 'paleta · seis tonos y nombres largos',
    ruta: 'es/paleta',
    query:
      't=nombreLarguisimoDeVerdad:3b82f6,otroNombreMuyMuyLargo:16a34a,tercerNombreExagerado:dc2626,cuarto:f59e0b,quinto:8b5cf6,sexto:06b6d4&p=prefijoLarguisimo',
  },
  { nombre: 'paleta · quince pasos', ruta: 'es/paleta', query: 'n=15' },
  { nombre: 'paleta · semilla casi blanca', ruta: 'es/paleta', query: 't=casi:fbfbfa' },
  { nombre: 'paleta · con las tintas', ruta: 'es/paleta' },
  {
    nombre: 'reloj · mundial lleno',
    ruta: 'es/reloj',
    query: 'w=America%2FNew_York~Carolina%20del%20Norte%20(hora%20oriental)%3BAmerica%2FChicago~Florida%20(hora%20central)%3BAsia%2FKathmandu~Katmand%C3%BA%3BPacific%2FKiritimati~Kiribati%20(hora%20de%20las%20Line)%3BEurope%2FMadrid~Comunidad%20Valenciana%3BAsia%2FTokyo~Jap%C3%B3n%3BAmerica%2FSao_Paulo~S%C3%A3o%20Paulo%3BAustralia%2FPerth~Australia%20Occidental',
  },
  {
    nombre: 'husos · hora fija y seis sitios',
    ruta: 'es/horarios',
    query: 'd=2026-11-01&h=23:30&' + 'z=America%2FNew_York~Carolina%20del%20Norte%20(hora%20oriental)%3BAmerica%2FChicago~Florida%20(hora%20central)%3BAsia%2FKathmandu~Katmand%C3%BA%3BPacific%2FKiritimati~Kiribati%3BEurope%2FMadrid~Madrid%3BAsia%2FTokyo~Tokio',
  },
  { nombre: 'notas · vacía', ruta: 'es/notas' },
  { nombre: 'notas · cuarenta líneas', ruta: 'es/notas', hacer: NOTAS_LLENA },
  { nombre: 'notas · sin un espacio', ruta: 'es/notas', hacer: NOTAS_SIN_ESPACIOS },
  { nombre: 'notas · en inglés', ruta: 'en/notes' },
  { nombre: 'portada', ruta: 'es' },
  { nombre: 'portada en inglés', ruta: 'en' },
];

/** Los anchos donde la maqueta cambia de forma. */
const ANCHOS = [1440, 869, 485];

/** Chrome descuenta el marco de la ventana y tiene un mínimo por abajo. */
const MARCO = 31;

const temporales = [];
const servidor = spawn('python', ['-m', 'http.server', String(PUERTO)], {
  cwd: dist,
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 700));

let fallos = 0;
let mirados = 0;

try {
  for (const caso of CASOS) {
    const archivo = join(dist, `_rot_${caso.nombre.replace(/[^a-z0-9]+/gi, '_')}.html`);
    const guion =
      SONDA +
      ESCRIBIR +
      `window.addEventListener('load', () => {
         const listo = () => setTimeout(() => {
           document.title = 'ROTURAS:' + (window.__romperse().join(' ;; ') || 'ninguna');
         }, 700);
         ${caso.hacer ? `${caso.hacer}.then(listo).catch((e) => { document.title = 'ROTURAS:FALLO ' + e.message; });` : 'setTimeout(listo, 1200);'}
       });`;

    const html = readFileSync(join(dist, `${caso.ruta}.html`), 'utf8');
    writeFileSync(archivo, html.replace('</body>', `<script>${guion}</script></body>`));
    temporales.push(archivo);

    const url = `http://localhost:${PUERTO}/${archivo.slice(dist.length + 1).replace(/\\/g, '/')}${
      caso.query ? `?${caso.query}` : ''
    }`;

    for (const ancho of ANCHOS) {
      const salida = execFileSync(
        chrome,
        [
          '--headless=new',
          '--disable-gpu',
          `--window-size=${ancho + MARCO},900`,
          '--virtual-time-budget=22000',
          '--dump-dom',
          url,
        ],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
      );

      const titulo = /<title>([^<]*)<\/title>/.exec(salida)?.[1] ?? '';
      const roturas = titulo.startsWith('ROTURAS:') ? titulo.slice(8) : '(no respondió)';
      mirados++;

      if (roturas === 'ninguna') {
        console.log(`  ok    ${caso.nombre.padEnd(34)} ${ancho} px`);
      } else {
        fallos++;
        console.log(`  ROTO  ${caso.nombre.padEnd(34)} ${ancho} px`);
        console.log(`        ${roturas}`);
      }
    }
  }
} finally {
  servidor.kill();
  for (const t of temporales) rmSync(t, { force: true });
}

console.log(
  fallos === 0
    ? `\n✓ nada se sale de su caja (${mirados} comprobaciones)\n`
    : `\n✗ ${fallos} de ${mirados} se salen de su caja\n`
);
process.exit(fallos === 0 ? 0 : 1);
