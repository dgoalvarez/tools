/**
 * Dos cosas que solo se ven con el navegador puesto: que la navegación no
 * dé un tirón al cargar, y que cambiar de herramienta no recargue.
 *
 * ---------------------------------------------------------------------
 * El tirón
 *
 * Los botones que necesitan JavaScript —plegar el riel, abrir el
 * buscador, abrir la hoja— nacían con el atributo `hidden` y los enseñaba
 * el script de la navegación, que llega bastante después del primer
 * pintado. La fila del buscador aparecía de la nada y empujaba hacia
 * abajo las seis herramientas, en cada carga de cada página.
 *
 * Se mide en dos momentos: con la página recién analizada —el guion va
 * justo antes de `</body>` y los módulos aún no han corrido— y ya
 * asentada. Si una caja se movió un píxel, se dice cuál y cuánto.
 *
 * El tercer caso es el control: vuelve a poner `hidden` a mano para que
 * el tirón OCURRA. Si ese caso saliera limpio, la sonda estaría midiendo
 * cualquier otra cosa y los dos primeros no probarían nada.
 *
 * ---------------------------------------------------------------------
 * La recarga
 *
 * Se marca `window` antes de pulsar un enlace del riel. Si tras el cambio
 * de página la marca sigue ahí, no hubo recarga: el enrutador sustituyó
 * el contenido. Y de paso se comprueba lo que esa sustitución podría
 * dejarse por el camino —la herramienta marcada, el enlace de idioma, el
 * acento de la materia, el tema elegido y el riel desplegado—, porque el
 * documento nuevo viene del servidor sin saber nada de lo guardado.
 *
 * ---------------------------------------------------------------------
 * Cómo se cierra el círculo, y por qué así
 *
 * La sonda **avisa por la red**: cuando tiene el veredicto pide
 * `/resultado?m=…` y este mismo archivo, que es quien sirve las páginas,
 * lo recoge. El navegador corre con el reloj de verdad y se le mata en
 * cuanto contesta.
 *
 * Antes iba de otra forma —`--virtual-time-budget` para acelerar el reloj
 * y `--dump-dom` para leer el veredicto del título— y **fallaba una de
 * cada tres veces**, no siempre en el mismo caso. La causa: con el reloj
 * acelerado los temporizadores se disparan a toda velocidad y la red no,
 * así que el tiempo virtual se agotaba mientras la página siguiente
 * venía por el cable. Chrome volcaba el DOM y se iba a mitad de la
 * navegación, y la sonda lo contaba como «no respondió». Una alarma que
 * falla una de cada tres enseña a ignorar el rojo, que es peor que no
 * tenerla.
 *
 * Tarda unos segundos más y sale siempre igual, que es lo único que se le
 * pide a una alarma.
 *
 * ---------------------------------------------------------------------
 * Tres trampas más, por si vuelven
 *
 *   · **Nada de `execFileSync`.** El servidor de aquí abajo comparte
 *     proceso con la sonda, y una llamada síncrona deja parado el bucle
 *     de eventos: Chrome pedía la página, nadie contestaba, y el proceso
 *     se quedaba colgado hasta el tiempo de espera.
 *   · **El rastro no avisa.** El título va contando por dónde va la
 *     sonda, y eso es solo para mirar una captura: si el rastro también
 *     avisara por la red, el primer aviso sería «llego a la carga 1» y
 *     ese sería el veredicto. Avisa `__decir`, y nadie más.
 *   · **Puerto 0.** Con uno fijo esto fallaba con EADDRINUSE en Windows
 *     sin que nadie estuviera escuchando: hay rangos que Hyper-V reserva
 *     y que no se ven ocupados hasta que se intentan abrir.
 *
 * Uso:  npm run build && node scripts/comprobar-navegacion.mjs
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'dist');

/** Chrome descuenta el marco de la ventana del `--window-size`. */
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
  console.error('✗ No hay Chrome ni Edge donde suelen estar.');
  process.exit(1);
}
if (!existsSync(dist)) {
  console.error('✗ No existe dist/. Compila antes: npm run build');
  process.exit(1);
}

/* ============================================================
   El servidor

   Con `cleanUrls`, que es lo que hace Vercel: /es/pomodoro sirve
   es/pomodoro.html. Sin esto el enrutador del cliente pediría una
   dirección que da 404 y se caería a una recarga entera — o sea, la
   sonda diría que hay recarga donde en producción no la hay.
   ============================================================ */

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.xml': 'application/xml',
};

/** El caso en marcha: qué página se somete y con qué guion. */
let sonda = null;

/**
 * Lo que la página tiene que contar, cuando lo cuente.
 *
 * La sonda avisa pidiendo /resultado, y aquí se resuelve la espera. Antes
 * el veredicto se leía del DOM volcado con `--dump-dom`, y eso ataba el
 * resultado al momento en que Chrome decidía volcar: con el reloj virtual
 * acelerado, el tiempo se agotaba mientras la página siguiente venía por
 * la red, y la sonda decía «no respondió» a una navegación que estaba a
 * medio hacer. Fallaba una de cada tres veces, y no siempre la misma.
 *
 * Contándolo por la red, el volcado deja de importar: se espera al aviso
 * y ya está.
 */
let contar = null;

const servidor = createServer((pet, res) => {
  // Sin esto Chrome deja los sockets abiertos y el tiempo virtual no se
  // agota: el proceso no llega a volcar el DOM.
  res.setHeader('connection', 'close');

  const ruta = decodeURIComponent(new URL(pet.url, 'http://x').pathname);

  if (ruta === '/resultado') {
    const mensaje = new URL(pet.url, 'http://x').searchParams.get('m') ?? '';
    res.writeHead(204);
    res.end();
    contar?.(mensaje);
    return;
  }

  if (ruta === '/sonda') {
    const html = readFileSync(join(dist, sonda.pagina), 'utf8');
    res.writeHead(200, { 'content-type': TIPOS['.html'] });
    res.end(html.replace('</body>', '<script>' + sonda.guion + '</script></body>'));
    return;
  }

  for (const intento of [ruta, ruta + '.html', join(ruta, 'index.html')]) {
    const archivo = join(dist, intento);
    if (!archivo.startsWith(dist) || !existsSync(archivo)) continue;
    if (!statSync(archivo).isFile()) continue;
    res.writeHead(200, { 'content-type': TIPOS[extname(archivo)] || 'application/octet-stream' });
    res.end(readFileSync(archivo));
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('no esta');
});

await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const PUERTO = servidor.address().port;

/* ============================================================
   Los guiones

   Se escriben como listas de líneas y sin plantillas: van dentro de un
   <script> en línea, y una comilla invertida de más aquí se convierte en
   un error de sintaxis silencioso allí — que además no avisa, porque un
   error de sintaxis impide que se registre el propio manejador de
   errores.
   ============================================================ */

/** Las cajas que no deben moverse solas, y cómo se miden. */
const COMUN = [
  'window.__vivo = 1;',
  'var __CAJAS = [',
  "  '.riel-cabecera',",
  "  '.riel-lista a.riel-item',",
  "  '.riel-pie',",
  "  '.barra-movil',",
  "  '[data-hoja-abrir]',",
  "  '#main',",
  "  '.pie-lista',",
  "  '.campo-nota',",
  '];',
  'function __medir() {',
  '  var out = {};',
  '  for (var i = 0; i < __CAJAS.length; i++) {',
  '    var el = document.querySelector(__CAJAS[i]);',
  '    if (!el) { out[__CAJAS[i]] = null; continue; }',
  '    var r = el.getBoundingClientRect();',
  '    out[__CAJAS[i]] = [',
  '      Math.round(r.top), Math.round(r.left), Math.round(r.width), Math.round(r.height),',
  '    ];',
  '  }',
  '  return out;',
  '}',
  // El título se sigue escribiendo: sirve para mirar una captura. Lo que
  // cuenta de verdad es el aviso, que llega cuando llega.
  'function __decir(texto) {',
  '  document.title = "SONDA:" + texto;',
  '  try { fetch("/resultado?m=" + encodeURIComponent(texto)); } catch (e) {}',
  '}',
  // Un error dentro de un guion no dice nada por su cuenta: la sonda solo
  // ve que el titulo no cambio. Esto lo cuenta.
  'window.addEventListener("error", function (e) {',
  '  document.title = "SONDA:error " + e.message + " en " + (e.filename || "?") + ":" + e.lineno;',
  '});',
  // El aviso de que la página está montada de verdad: `astro:page-load`
  // corre después de los módulos, así que el de la navegación ya pasó.
  // La espera corta que sigue es para ir DETRÁS de él: los manejadores se
  // llaman en el orden en que se registraron, y este se registró antes.
  'function __cuandoListo(n, fn) {',
  '  var veces = 0;',
  '  document.addEventListener("astro:page-load", function () {',
  '    veces++;',
  // Deja rastro de por donde va: si algo se queda a medias, lo ultimo
  // que quedo escrito dice en que carga fue. Cada cambio de pagina pisa el
  // titulo con el suyo, asi que sobrevive el ultimo.
  '    document.title = "SONDA:llego a la carga " + veces + ", esperando la " + n;',
  '    if (veces !== n) return;',
  '    setTimeout(fn, 150);',
  '  });',
  '}',
].join('\n');

/**
 * Mide antes y después.
 *
 * `control` reintroduce el fallo a propósito. `siembra` deja algo en el
 * almacenamiento de la pestaña ANTES de que la isla hidrate: es la única
 * forma de comprobar lo que de verdad preocupa de la libreta, que
 * restaurar doce líneas no empuje hacia abajo lo que hay debajo.
 */
function guionSalto(control, siembra) {
  return [
    COMUN,
    siembra
      ? 'try { sessionStorage.setItem(' +
        JSON.stringify(siembra.clave) +
        ', ' +
        JSON.stringify(JSON.stringify(siembra.valor)) +
        '); } catch (e) {}'
      : '',
    control
      ? [
          'var __b = document.querySelector("[data-bento]");',
          'if (__b) { __b.hidden = true; }',
          '__cuandoListo(1, function () { if (__b) __b.hidden = false; });',
        ].join('\n')
      : '',
    'var __antes = __medir();',
    '__cuandoListo(1, function () {',
    '  var d = __medir();',
    '  var males = [];',
    '  var lados = ["arriba", "izquierda", "ancho", "alto"];',
    '  for (var i = 0; i < __CAJAS.length; i++) {',
    '    var k = __CAJAS[i];',
    '    var a = __antes[k], b = d[k];',
    '    if (a === null && b === null) continue;',
    '    if (a === null || b === null) { males.push(k + " aparece o desaparece"); continue; }',
    '    for (var j = 0; j < 4; j++) {',
    '      if (a[j] !== b[j]) males.push(k + " " + lados[j] + " " + a[j] + " -> " + b[j]);',
    '    }',
    '  }',
    '  __decir(males.length ? males.join(" ;; ") : "quieto");',
    '});',
  ].join('\n');
}

/**
 * Pulsa un enlace y mira qué sobrevivió al cambio de página.
 *
 * `dentroDeLaHoja` va por móvil: allí el riel no se pinta y el enlace
 * está en la hoja, que además tiene que cerrarse sola al seguirlo.
 */
function guionNavegar(dentroDeLaHoja) {
  return [
    COMUN,
    'var __males = [];',
    'var __antesRuta = "";',
    'var __antesAcento = "";',
    '__cuandoListo(1, function () {',
    '  __antesRuta = location.pathname;',
    '  __antesAcento = getComputedStyle(document.body).getPropertyValue("--acento").trim();',
    dentroDeLaHoja
      ? [
          '  var abrir = document.querySelector("[data-hoja-abrir]");',
          '  var hoja = document.querySelector("[data-hoja]");',
          '  if (!abrir || !hoja) { __decir("falta la barra de movil o la hoja"); return; }',
          '  abrir.click();',
          '  if (!hoja.open) { __decir("la hoja no abre"); return; }',
          '  var enlace = hoja.querySelector("a[href$=\'/es/pomodoro\']");',
        ].join('\n')
      : ['  var enlace = document.querySelector(".riel-lista a[href$=\'/es/pomodoro\']");'].join(
          '\n'
        ),
    '  if (!enlace) { __decir("no hay enlace al pomodoro"); return; }',
    '  enlace.click();',
    '});',
    '__cuandoListo(2, function () {',
    '  var males = __males;',
    '  if (!window.__vivo) males.push("hubo recarga: se perdio la marca de window");',
    '  if (location.pathname === __antesRuta) males.push("no cambio la ruta: " + __antesRuta);',
    '  var actual = document.querySelector(".riel-item[aria-current=\'page\']");',
    '  var href = actual ? actual.getAttribute("href") : "(ninguna)";',
    '  if (!/pomodoro/.test(href)) males.push("la herramienta marcada sigue siendo " + href);',
    '  var idioma = document.querySelector("[hreflang]");',
    '  var destino = idioma ? idioma.getAttribute("href") : "(ninguno)";',
    '  if (!/pomodoro/.test(destino)) males.push("el enlace de idioma apunta a " + destino);',
    '  var acento = getComputedStyle(document.body).getPropertyValue("--acento").trim();',
    '  if (acento === __antesAcento) males.push("el acento no cambio: " + acento);',
    '  var raiz = document.documentElement;',
    '  if (raiz.dataset.theme !== "light") males.push("se perdio el tema claro");',
    '  if (raiz.dataset.riel !== "abierto") males.push("se plego el riel solo");',
    '  if (raiz.dataset.js !== "1") males.push("se perdio data-js");',
    dentroDeLaHoja
      ? [
          '  var h = document.querySelector("[data-hoja]");',
          '  if (h && h.open) males.push("la hoja se quedo abierta encima de la pagina nueva");',
        ].join('\n')
      : [
          '  var plegar = document.querySelector("[data-riel-plegar]");',
          '  if (!plegar) males.push("no hay boton de plegar en la pagina nueva");',
          '  else if (plegar.getAttribute("aria-expanded") !== "true") {',
          '    males.push("el boton de plegar dice que el riel esta cerrado");',
          '  }',
        ].join('\n'),
    '  __decir(males.length ? males.join(" ;; ") : "quieto");',
    '});',
    // El tema y el riel se dejan elegidos a mano: es justo lo que el
    // documento nuevo, recién traído del servidor, no sabe.
    'try {',
    '  localStorage.setItem("dgo-tools-theme", "light");',
    '  localStorage.setItem("dgo-tools-riel", "abierto");',
    '} catch (e) {}',
    'document.documentElement.dataset.theme = "light";',
    'document.documentElement.dataset.riel = "abierto";',
  ].join('\n');
}

/**
 * Escribe en la libreta, se va a otra herramienta, vuelve, y comprueba
 * que lo escrito sigue ahí.
 *
 * Es la decisión de fondo de la herramienta puesta a prueba: se guarda en
 * el almacenamiento de la pestaña, y el enrutador del cliente no recarga
 * la pestaña, así que saltar al pomodoro y volver no puede perder nada.
 */
const GUION_LIBRETA = [
  COMUN,
  'var __texto = "sobrevivir al viaje";',
  '__cuandoListo(1, function () {',
  '  var campo = document.querySelector(".campo-nuevo");',
  '  if (!campo) { __decir("no hay campo de añadir"); return; }',
  // El valor va por el setter nativo: puesto a pelo, React no se entera.
  '  var proto = window.HTMLInputElement.prototype;',
  '  Object.getOwnPropertyDescriptor(proto, "value").set.call(campo, __texto);',
  '  campo.dispatchEvent(new Event("input", { bubbles: true }));',
  '  campo.closest("form").requestSubmit();',
  '  setTimeout(function () {',
  '    var puesta = document.querySelectorAll(".texto-tarea");',
  '    if (puesta.length !== 1) { __decir("la tarea no se añadio: " + puesta.length); return; }',
  '    if (String(sessionStorage.getItem("dgo-tools-notas")).indexOf(__texto) === -1) {',
  '      __decir("la tarea no llego al almacenamiento de la pestaña"); return;',
  '    }',
  '    var enlace = document.querySelector(".riel-lista a[href$=\'/es/contraste\']");',
  '    if (!enlace) { __decir("no hay enlace a contraste"); return; }',
  '    enlace.click();',
  '  }, 500);',
  '});',
  '__cuandoListo(2, function () {',
  '  var males = [];',
  '  if (!window.__vivo) males.push("hubo recarga: se perdio la marca de window");',
  '  if (location.pathname.indexOf("/es/contraste") === -1) {',
  '    males.push("no llego a contraste: " + location.pathname);',
  '  }',
  '  var guardado = String(sessionStorage.getItem("dgo-tools-notas"));',
  '  if (guardado.indexOf(__texto) === -1) males.push("la libreta se perdio al cambiar de pagina");',
  '  __decir(males.length ? males.join(" ;; ") : "quieto");',
  '});',
].join('\n');

/** Doce líneas y una nota, para mirar el tirón al restaurar. */
const LIBRETA_SEMBRADA = {
  clave: 'dgo-tools-notas',
  valor: {
    v: 1,
    tareas: Array.from({ length: 12 }, (_, i) => ({
      id: 'x' + i,
      texto: 'una tarea de la sesion, la numero ' + i,
      hecha: i % 3 === 0,
    })),
    nota: 'Tres lineas\nde nota\npara que ocupe.',
  },
};

const CASOS = [
  {
    nombre: 'sin tiron · escritorio',
    pagina: 'es/paleta.html',
    ancho: 1440,
    guion: guionSalto(false),
  },
  { nombre: 'sin tiron · movil', pagina: 'es/paleta.html', ancho: 485, guion: guionSalto(false) },
  {
    nombre: 'sin tiron · notas vacia',
    pagina: 'es/notas.html',
    ancho: 1440,
    guion: guionSalto(false),
  },
  {
    nombre: 'sin tiron · notas llena',
    pagina: 'es/notas.html',
    ancho: 1440,
    guion: guionSalto(false, LIBRETA_SEMBRADA),
  },
  {
    nombre: 'sin tiron · notas llena movil',
    pagina: 'es/notas.html',
    ancho: 485,
    guion: guionSalto(false, LIBRETA_SEMBRADA),
  },
  {
    nombre: 'sin tiron · husos en vivo',
    pagina: 'es/horarios.html',
    ancho: 1440,
    guion: guionSalto(false),
  },
  {
    nombre: 'sin tiron · reloj mundial',
    pagina: 'es/reloj.html',
    ancho: 1440,
    guion: guionSalto(false),
  },
  {
    nombre: 'control · con hidden salta',
    pagina: 'es/paleta.html',
    ancho: 1440,
    guion: guionSalto(true),
    esperado: 'roto',
  },
  {
    nombre: 'cambiar desde el riel',
    pagina: 'es/paleta.html',
    ancho: 1440,
    guion: guionNavegar(false),
  },
  {
    nombre: 'cambiar desde la hoja',
    pagina: 'es/paleta.html',
    ancho: 485,
    guion: guionNavegar(true),
  },
  {
    nombre: 'la libreta sobrevive al salto',
    pagina: 'es/notas.html',
    ancho: 1440,
    guion: GUION_LIBRETA,
  },
];

let fallos = 0;

try {
  for (const caso of CASOS) {
    sonda = caso;
    process.stdout.write(`  ...   ${caso.nombre}\r`);

    /*
      Sin `--virtual-time-budget`: aquí el reloj es el de verdad.

      El reloj acelerado servía cuando lo único que había que hacer era
      esperar a que una página se asentara. En cuanto hay que pulsar un
      enlace y esperar a la siguiente, estorba: los temporizadores corren a
      toda velocidad y la red no, así que las esperas se cumplen antes de
      que llegue nada. Estas comprobaciones tardan unos segundos más y
      salen siempre igual, que es lo único que se le pide a una alarma.
    */
    const espera = new Promise((r) => {
      contar = r;
    });

    const hijo = spawn(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--disable-extensions',
        `--window-size=${caso.ancho + MARCO},900`,
        `http://127.0.0.1:${PUERTO}/sonda`,
      ],
      { stdio: 'ignore' }
    );

    const dicho = await Promise.race([
      espera,
      new Promise((r) => setTimeout(() => r('(no respondió en 45 s)'), 45_000)),
    ]);

    contar = null;
    hijo.kill();
    const bien = caso.esperado === 'roto' ? dicho !== 'quieto' : dicho === 'quieto';
    const ancho = String(caso.ancho).padStart(4);

    if (bien) {
      console.log(`  ok    ${caso.nombre.padEnd(28)} ${ancho} px`);
      if (caso.esperado === 'roto') console.log(`        salta, como debe: ${dicho}`);
    } else {
      fallos++;
      console.log(`  MAL   ${caso.nombre.padEnd(28)} ${ancho} px`);
      console.log(`        ${dicho}`);
    }
  }
} finally {
  servidor.close();
}

console.log(
  fallos === 0
    ? `\n✓ la navegación no salta ni recarga (${CASOS.length} comprobaciones)\n`
    : `\n✗ ${fallos} de ${CASOS.length} mal\n`
);

process.exit(fallos === 0 ? 0 : 1);
