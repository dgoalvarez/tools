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
import { tmpdir } from 'node:os';
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
  // El tablero, que es la vista nueva. Vacío es su primer estado de
  // verdad: es lo que ve quien llega, y donde se explica qué es esto.
  { nombre: 'tablero-vacio', ruta: 'es/tablero', ancho: 1440, alto: 900 },
  { nombre: 'tablero-estrecho', ruta: 'es/tablero', ancho: 485, alto: 900 },
  /*
    El panel de añadir, abierto y enseñando una herramienta.

    Es la pantalla que decide qué se pone en el tablero, así que es la
    que hay que mirar: si la muestra sale cortada o el botón de añadir
    queda fuera, la vista previa no sirve de nada.
  */
  {
    nombre: 'tablero-panel',
    ruta: 'es/tablero',
    ancho: 1440,
    alto: 1000,
    guion: `
      await esperar(() => !document.querySelector('astro-island[ssr]'));

      const abrir = await esperar(() => document.querySelector('[data-tour="tablero-anadir"]'));
      abrir.click();

      const b = await esperar(() => document.querySelector('.elegir-lista [data-widget="dibujo"]'));
      b.click();

      // Se espera a que la MUESTRA esté montada, no al reloj: el widget
      // llega por import() dinámico y una captura a destiempo saldría con
      // el rectángulo gris de carga en vez de la herramienta.
      await esperar(() => document.querySelector('.muestra-widget > *:not(.cargando-pieza)'));
      await new Promise((r) => setTimeout(r, 250));
    `,
  },
  {
    nombre: 'tablero-panel-estrecho',
    ruta: 'es/tablero',
    ancho: 485,
    alto: 1000,
    guion: `
      await esperar(() => !document.querySelector('astro-island[ssr]'));

      const abrir = await esperar(() => document.querySelector('[data-tour="tablero-anadir"]'));
      abrir.click();

      const b = await esperar(() => document.querySelector('.elegir-lista [data-widget="nota"]'));
      b.click();

      // Se espera a que la MUESTRA esté montada, no al reloj: el widget
      // llega por import() dinámico y una captura a destiempo saldría con
      // el rectángulo gris de carga en vez de la herramienta.
      await esperar(() => document.querySelector('.muestra-widget > *:not(.cargando-pieza)'));
      await new Promise((r) => setTimeout(r, 250));
    `,
  },
  // Y con dos piezas dentro, que es lo que de verdad hay que mirar: el
  // tablero vacío no enseña ni la rejilla ni la barra de cada pieza.
  // A 1440 salen las cuatro columnas; a 700, dos, que es el reparto
  // apretado donde una pieza de 2×1 ocupa la fila entera.
  {
    nombre: 'tablero-con-piezas',
    ruta: 'es/tablero',
    ancho: 1440,
    alto: 1000,
    guion: `
      // Hidratar, no «astro:page-load»: ese evento sale ANTES de que
      // React monte, y un clic de entonces no hace absolutamente nada.
      // Fue el fallo intermitente de la libreta en «navegar».
      await esperar(() => !document.querySelector('astro-island[ssr]'));

      const abrir = await esperar(() => document.querySelector('[data-tour="tablero-anadir"]'));
      // Por clave y no por posición: la lista del panel se reordena sola
      // el día que entre otra herramienta, y un índice no dice cuál es.
      const opcion = (clave) => document.querySelector('.elegir-lista [data-widget="' + clave + '"]');

      // Cada widget llega por import() dinámico, así que se espera a que
      // la pieza tenga cuerpo de verdad y no al reloj: con el hueco de
      // carga puesto, un setTimeout capturaría dos rectángulos grises.
      // Ahora son dos pasos: señalar la herramienta en el panel y darle a
      // añadir. Antes bastaba un clic porque el menú añadía al elegir.
      const poner = async (clave, cuantas, talla) => {
        abrir.click();
        const b = await esperar(() => opcion(clave));
        b.click();
        // El tamaño ya no se elige de una lista: se crece a golpes de
        // «+». Se pulsa hasta llegar, y el botón se apaga solo en el tope.
        if (talla) {
          const [cols, filas] = talla.split(/[x×]/).map(Number);
          const mas = (i) => [...document.querySelectorAll('.elegir-pie .tamano-pieza button')][i];
          const cifra = (i) => Number([...document.querySelectorAll('.elegir-pie .cifra-tamano')][i].textContent);
          for (let k = 0; k < 4 && cifra(0) < cols; k++) mas(1).click();
          for (let k = 0; k < 4 && cifra(1) < filas; k++) mas(3).click();
        }
        // Por clave: «data-anadir» dice QUÉ se va a añadir, y esperarlo con
        // el nombre puesto comprueba de paso que el panel enfocó lo que se
        // le pidió. Con el selector suelto se podía clicar en el mismo tick
        // que elegir, antes de que React actualizara, y se añadía la
        // herramienta anterior.
        const anadir = await esperar(() => document.querySelector('[data-anadir="' + clave + '"]:not(:disabled)'));
        anadir.click();
        await esperar(() => document.querySelectorAll('.cuerpo-pieza > *:not(.cargando-pieza)').length >= cuantas);
      };

      // Las cuatro, y cada una en una talla distinta: es la única forma
      // de ver de un vistazo si el reparto de la rejilla cuadra.
      await poner('pomodoro', 1, '1x1');
      await poner('lista', 2, '1x2');
      await poner('nota', 3, '2x1');
      await poner('dibujo', 4, '2x2');
      await new Promise((r) => setTimeout(r, 150));
    `,
  },
  {
    nombre: 'tablero-con-piezas-estrecho',
    ruta: 'es/tablero',
    ancho: 700,
    alto: 1000,
    guion: `
      // Hidratar, no «astro:page-load»: ese evento sale ANTES de que
      // React monte, y un clic de entonces no hace absolutamente nada.
      // Fue el fallo intermitente de la libreta en «navegar».
      await esperar(() => !document.querySelector('astro-island[ssr]'));

      const abrir = await esperar(() => document.querySelector('[data-tour="tablero-anadir"]'));
      // Por clave y no por posición: la lista del panel se reordena sola
      // el día que entre otra herramienta, y un índice no dice cuál es.
      const opcion = (clave) => document.querySelector('.elegir-lista [data-widget="' + clave + '"]');

      // Cada widget llega por import() dinámico, así que se espera a que
      // la pieza tenga cuerpo de verdad y no al reloj: con el hueco de
      // carga puesto, un setTimeout capturaría dos rectángulos grises.
      // Ahora son dos pasos: señalar la herramienta en el panel y darle a
      // añadir. Antes bastaba un clic porque el menú añadía al elegir.
      const poner = async (clave, cuantas, talla) => {
        abrir.click();
        const b = await esperar(() => opcion(clave));
        b.click();
        // El tamaño ya no se elige de una lista: se crece a golpes de
        // «+». Se pulsa hasta llegar, y el botón se apaga solo en el tope.
        if (talla) {
          const [cols, filas] = talla.split(/[x×]/).map(Number);
          const mas = (i) => [...document.querySelectorAll('.elegir-pie .tamano-pieza button')][i];
          const cifra = (i) => Number([...document.querySelectorAll('.elegir-pie .cifra-tamano')][i].textContent);
          for (let k = 0; k < 4 && cifra(0) < cols; k++) mas(1).click();
          for (let k = 0; k < 4 && cifra(1) < filas; k++) mas(3).click();
        }
        // Por clave: «data-anadir» dice QUÉ se va a añadir, y esperarlo con
        // el nombre puesto comprueba de paso que el panel enfocó lo que se
        // le pidió. Con el selector suelto se podía clicar en el mismo tick
        // que elegir, antes de que React actualizara, y se añadía la
        // herramienta anterior.
        const anadir = await esperar(() => document.querySelector('[data-anadir="' + clave + '"]:not(:disabled)'));
        anadir.click();
        await esperar(() => document.querySelectorAll('.cuerpo-pieza > *:not(.cargando-pieza)').length >= cuantas);
      };

      // Las cuatro, y cada una en una talla distinta: es la única forma
      // de ver de un vistazo si el reparto de la rejilla cuadra.
      await poner('pomodoro', 1, '1x1');
      await poner('lista', 2, '1x2');
      await poner('nota', 3, '2x1');
      await poner('dibujo', 4, '2x2');
      await new Promise((r) => setTimeout(r, 150));
    `,
  },
  { nombre: 'portada', ruta: 'es', ancho: 1440, alto: 900 },
  // El índice es superficie nueva: hay que verlo en los dos temas y
  // apilado, que es donde el nombre y la frase dejan de compartir línea.
  { nombre: 'portada-claro', ruta: 'es', ancho: 1440, alto: 900, tema: 'light' },
  { nombre: 'portada-estrecha', ruta: 'es', ancho: 485, alto: 900 },
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
  // En un teléfono y con una hora puesta, que es cuando las horas de las
  // filas dejan de ser texto y pasan a ser campos. Es donde se vio que el
  // campo reservaba más ancho del que usa y la cifra se despegaba del
  // borde derecho, rompiendo la columna que hace la lista comparable.
  {
    nombre: 'husos-estrecho-fija',
    ruta: 'es/horarios',
    ancho: 485,
    alto: 1500,
    query:
      'd=2026-09-04&h=21:00&v=America%2FNew_York~Carolina%20del%20Norte&z=America/Los_Angeles,Pacific/Honolulu,America/Chicago',
  },
  // El calendario abierto. Va con guion y no con `clics` porque llega
  // por carga diferida: hay que esperar a que el trozo se descargue, o la
  // captura sale con el hueco reservado y sin calendario dentro.
  {
    nombre: 'husos-calendario',
    ruta: 'es/horarios',
    ancho: 1440,
    alto: 1000,
    guion: `
      const boton = await esperar(() => document.querySelector('#fecha'));
      boton.click();
      await esperar(() => document.querySelector('.rdp-month_grid, table'));
      await new Promise((r) => setTimeout(r, 400));
    `,
  },
  // El selector de hora abierto, con las dos columnas puestas donde ya
  // está la hora: es lo que hay que mirar para saber si el desplazamiento
  // automatico acerto.
  {
    nombre: 'husos-selector-hora',
    ruta: 'es/horarios',
    ancho: 1440,
    alto: 1000,
    query: 'd=2026-09-04&h=17:35',
    guion: `
      const boton = await esperar(() => document.querySelector('#hora'));
      boton.click();
      await esperar(() => document.querySelector('.selector-hora'));
      await new Promise((r) => setTimeout(r, 400));
    `,
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
  // Ocho sitios: es donde la lista pasa del tope y aparece la barra de
  // desplazamiento. Hay que mirar que las horas NO se muevan al salir.
  {
    nombre: 'reloj-mundial-lleno',
    ruta: 'es/reloj',
    ancho: 1440,
    alto: 1400,
    query:
      'w=America%2FNew_York~Carolina%20del%20Norte%3BAmerica%2FLos_Angeles~Los%20%C3%81ngeles%3BAsia%2FTokyo~Tokio%3BEurope%2FMadrid~Madrid%3BAsia%2FKathmandu~Katmand%C3%BA%3BPacific%2FAuckland~Auckland%3BAmerica%2FSao_Paulo~S%C3%A3o%20Paulo%3BEurope%2FLondon~Londres',
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
  // La nota con formato y el lienzo con algo dibujado: los dos estados a
  // los que no se llega por la dirección, y los únicos que enseñan si las
  // dos cosas nuevas se ven como se tienen que ver.
  {
    nombre: 'notas-formato',
    ruta: 'es/notas',
    ancho: 1440,
    alto: 1400,
    guion: `
      const campo = await esperar(() => document.querySelector('.campo-nota'));
      campo.focus();
      campo.innerHTML = '<b>Llamar a Marta</b> el jueves<br><u>antes</u> de las cinco<ul><li>pedir el presupuesto</li><li>confirmar la <i>hora</i></li></ul><ol><li>revisar el <s>contrato</s></li><li>firmar</li></ol>';
      campo.dispatchEvent(new Event('input', { bubbles: true }));
      const lienzo = await esperar(() => document.querySelector('.lienzo'));
      const caja = lienzo.getBoundingClientRect();
      const trazo = (puntos) => {
        let id = 1;
        for (let i = 0; i < puntos.length; i++) {
          const [x, y] = puntos[i];
          const tipo = i === 0 ? 'pointerdown' : i === puntos.length - 1 ? 'pointerup' : 'pointermove';
          lienzo.dispatchEvent(new PointerEvent(tipo, {
            bubbles: true, pointerId: id, pressure: 0.6,
            clientX: caja.left + x, clientY: caja.top + y,
          }));
        }
      };
      const onda = [];
      for (let x = 30; x < 260; x += 6) onda.push([x, 90 + Math.sin(x / 22) * 34]);
      trazo(onda);
      await new Promise((r) => setTimeout(r, 60));
      trazo([[300, 60], [380, 60], [380, 130], [300, 130], [300, 60]]);
      await new Promise((r) => setTimeout(r, 60));
      trazo([[420, 120], [470, 60], [520, 120], [420, 120]]);
      await new Promise((r) => setTimeout(r, 300));
    `,
  },
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
  // Con el borrado hecho y «Deshacer» a la vista.
  //
  // Es un control que solo existe después de perder algo, así que sin
  // pulsar no hay nada que mirar. Y hay que mirarlo: es la única fila del
  // pie que puede llevar tres botones a la vez —deshacer, borrar las
  // hechas y copiar— y ahí es donde se envuelve si no cabe.
  {
    nombre: 'notas-deshacer',
    ruta: 'es/notas',
    ancho: 1440,
    alto: 900,
    clics: ['.acciones-tarea button:nth-child(3)'],
    siembra: {
      clave: 'dgo-tools-notas',
      valor: {
        v: 1,
        tareas: [
          { id: 'a', texto: 'derivar el acento y medirlo con la propia herramienta', hecha: true },
          { id: 'b', texto: 'reencuadrar los copys de husos', hecha: true },
          { id: 'c', texto: 'comprobar que no da tirón al restaurar', hecha: false },
          { id: 'd', texto: 'capturas en claro y en oscuro', hecha: false },
          { id: 'e', texto: 'subir y mirar en producción', hecha: false },
        ],
        nota: 'Se borra una línea sin querer y vuelve con un botón.',
      },
    },
  },
  // El dibujo con algo dibujado, que es el único estado donde se ven la
  // muestra de color libre elegida y el grupo de proporciones — los dos
  // salen solo cuando hay trazos.
  {
    nombre: 'notas-dibujo',
    ruta: 'es/notas',
    ancho: 1440,
    alto: 900,
    guion: `
      // El HTML del servidor ya trae el lienzo, pero los eventos no van a
      // ninguna parte hasta que la isla monta. Astro quita el atributo
      // «ssr» de <astro-island> justo cuando termina.
      await esperar(() => !document.querySelector('astro-island[ssr]'));

      // Un puntero sintético no tiene id de verdad, y setPointerCapture(0)
      // lanza NotFoundError: el manejador se abortaría antes de crear el
      // trazo y la tarjeta saldría vacía.
      HTMLElement.prototype.setPointerCapture = function () {};

      const lienzo = await esperar(() => document.querySelector('.lienzo'));
      const c = lienzo.getBoundingClientRect();
      const trazar = (x0, y0, pasos, dx, dy, presion) => {
        lienzo.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: c.left + x0, clientY: c.top + y0, pressure: presion }));
        for (let i = 1; i <= pasos; i++) {
          lienzo.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: c.left + x0 + dx(i), clientY: c.top + y0 + dy(i), pressure: presion }));
        }
        lienzo.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: c.left + x0 + dx(pasos), clientY: c.top + y0 + dy(pasos) }));
      };

      trazar(48, 150, 40, (i) => i * 5, (i) => Math.sin(i / 5) * 28, 0.6);
      await new Promise((r) => setTimeout(r, 120));
      trazar(70, 230, 24, (i) => i * 6, () => 0, 0.9);
      await new Promise((r) => setTimeout(r, 120));
      trazar(70, 275, 24, (i) => i * 6, () => 0, 0.9);
      await new Promise((r) => setTimeout(r, 120));

      // Y se deshace el último: es la única forma de ver la cabecera
      // completa, porque «rehacer» no existe hasta que se deshace algo.
      // Deshacer es el PRIMER .mando-lienzo; la papelera va detrás.
      document.querySelector('[data-mando=\"deshacer\"]').click();
      await new Promise((r) => setTimeout(r, 300));
    `,
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

/*
  Se puede pedir un trozo:  node scripts/ver.mjs notas

  Las 53 vistas arrancan un Chrome cada una, en serie: entre ocho y diez
  minutos. Mientras se está afinando UNA tarjeta eso es esperar diez
  minutos para mirar tres capturas, y esa espera es la que empuja a
  cambiar dos cosas a la vez y no saber luego cuál fue.

  Sin argumentos salen las 53, que es lo que hay que mirar antes de subir.
*/
const filtro = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const pedidas = filtro.length
  ? VISTAS.filter((v) => filtro.some((f) => v.nombre.includes(f)))
  : VISTAS;

if (pedidas.length === 0) {
  console.error(`✗ Ninguna vista se llama así. Hay ${VISTAS.length}:`);
  console.error('   ' + VISTAS.map((v) => v.nombre).join(', '));
  process.exit(1);
}

/** El perfil de usar y tirar de esta pasada. El porqué, abajo con Chrome. */
const perfil = join(tmpdir(), `dgo-capturas-${process.pid}`);

const temporales = [];
mkdirSync(salida, { recursive: true });
mkdirSync(perfil, { recursive: true });

const servidor = spawn('python', ['-m', 'http.server', String(PUERTO)], {
  cwd: dist,
  stdio: 'ignore',
});

// Un respiro para que el servidor levante antes de pedirle nada.
await new Promise((r) => setTimeout(r, 700));

try {
  for (const vista of pedidas) {
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
        /*
          Un perfil de usar y tirar, propio de esta pasada.

          Sin él, Chrome sin cabeza va al perfil de siempre, que es el del
          navegador de verdad. Comparten el cerrojo `SingletonLock`: si
          una pasada anterior murió a lo bruto —o hay una ventana abierta—
          la siguiente escribe la captura y luego se queda esperando el
          cerrojo para siempre. Pasó: el PNG estaba en disco a las 12:30 y
          el proceso seguía vivo a las 12:35, con siete Chrome huérfanos.

          Con un perfil propio no hay cerrojo que compartir y la pasada no
          depende de si Diego tiene el navegador abierto.
        */
        `--user-data-dir=${perfil}`,
        '--no-first-run',
        '--no-default-browser-check',
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
  // El perfil de usar y tirar se va con la pasada.
  rmSync(perfil, { recursive: true, force: true });
  for (const t of temporales) rmSync(t, { force: true });
}

console.log(
  `\n✓ ${pedidas.length} capturas en capturas/` +
    (pedidas.length < VISTAS.length ? ` (de ${VISTAS.length}; sin filtro salen todas)` : '') +
    '\n'
);
