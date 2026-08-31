/**
 * Lo que la navegación necesita de JavaScript: el lanzador, plegar el
 * riel y abrir la hoja de móvil.
 *
 * No es imprescindible. Sin este archivo la barra sigue navegando con sus
 * enlaces; los tres botones que sí lo necesitan llevan `solo-con-js` y no
 * se pintan hasta que el script en línea de la maqueta marca `data-js` en
 * el <html>, antes del primer pintado. Un botón que no responde es peor
 * que un botón que no está.
 *
 * Astro lo empaqueta aparte, así que no añade ningún script en línea y la
 * política de seguridad no se entera.
 *
 * ---------------------------------------------------------------------
 * Por qué todo cuelga de `astro:page-load`
 *
 * Con el enrutador del cliente, cambiar de herramienta ya no recarga el
 * navegador: se sustituye el cuerpo de la página. Este módulo se ejecuta
 * UNA sola vez, y los nodos a los que se enganchó dejan de existir en la
 * primera navegación — el riel de la página nueva es otro riel, sin
 * ningún escuchador.
 *
 * `astro:page-load` corre en la carga inicial y después de cada cambio de
 * página, así que es el único sitio donde esto funciona en los dos casos.
 * Lo que va a nivel de `document` —el atajo de teclado— se engancha una
 * vez y busca su diálogo en el momento de usarlo, porque el documento sí
 * sobrevive a los cambios de página.
 */

const RIEL = 'dgo-tools-riel';

/** ¿Cae el punto pulsado fuera de la caja del diálogo? */
function pulsoFuera(dialogo: HTMLDialogElement, evento: MouseEvent): boolean {
  const caja = dialogo.getBoundingClientRect();
  return (
    evento.clientX < caja.left ||
    evento.clientX > caja.right ||
    evento.clientY < caja.top ||
    evento.clientY > caja.bottom
  );
}

/* ============================================================
   El lanzador
   ============================================================ */

function montarLanzador() {
  const botones = document.querySelectorAll<HTMLButtonElement>('[data-bento]');
  const dialogo = document.querySelector<HTMLDialogElement>('[data-bento-dialog]');

  // Sin <dialog> el buscador no abre, así que su botón se esconde: es la
  // misma regla de siempre, un botón que no responde es peor que uno que
  // no está. Se esconde solo este, no todo lo que necesita JavaScript.
  if (!dialogo || typeof dialogo.showModal !== 'function') {
    for (const boton of botones) boton.hidden = true;
    return;
  }

  for (const boton of botones) {
    boton.addEventListener('click', () => dialogo.showModal());
  }

  dialogo
    .querySelector<HTMLButtonElement>('[data-bento-cerrar]')
    ?.addEventListener('click', () => dialogo.close());

  // Pulsar fuera de la tarjeta cierra. El <dialog> no lo trae de fábrica:
  // el clic en el fondo llega al propio diálogo.
  dialogo.addEventListener('click', (evento) => {
    if (pulsoFuera(dialogo, evento)) dialogo.close();
  });

  // En Windows y Linux el atajo se escribe Ctrl, no ⌘. La pastilla lo
  // dice bien en cada sitio en vez de asumir un Mac.
  if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
    for (const atajo of document.querySelectorAll('[data-atajo]')) {
      atajo.textContent = 'Ctrl K';
    }
  }
}

// El atajo que anuncia la propia pastilla. Si no funcionara, la pastilla
// estaría mintiendo. Va en el documento y se engancha una sola vez, así
// que busca el diálogo de la página que haya en ese momento.
document.addEventListener('keydown', (evento) => {
  if (evento.key.toLowerCase() !== 'k' || !(evento.metaKey || evento.ctrlKey)) return;
  const dialogo = document.querySelector<HTMLDialogElement>('[data-bento-dialog]');
  if (!dialogo || typeof dialogo.showModal !== 'function') return;
  evento.preventDefault();
  if (dialogo.open) dialogo.close();
  else dialogo.showModal();
});

/* ============================================================
   Plegar y desplegar el riel

   El estado vive en `data-riel` del <html> y se recuerda en
   `localStorage`. Lo lee además el script en línea de `Base.astro`, que
   corre ANTES del primer pintado y después de cada cambio de página: sin
   eso, quien lo deja abierto vería el riel plegarse y desplegarse de un
   salto cada vez.
   ============================================================ */

function montarPlegado() {
  const plegar = document.querySelector<HTMLButtonElement>('[data-riel-plegar]');
  if (!plegar) return;

  const raiz = document.documentElement;

  const pintar = () => {
    const abierto = raiz.dataset.riel === 'abierto';
    plegar.setAttribute('aria-expanded', String(abierto));
    const etiqueta = abierto ? plegar.dataset.plegar : plegar.dataset.desplegar;
    if (etiqueta) {
      plegar.setAttribute('aria-label', etiqueta);
      plegar.setAttribute('title', etiqueta);
    }
  };

  pintar();

  plegar.addEventListener('click', () => {
    const abierto = raiz.dataset.riel === 'abierto';
    if (abierto) delete raiz.dataset.riel;
    else raiz.dataset.riel = 'abierto';

    try {
      localStorage.setItem(RIEL, abierto ? 'plegado' : 'abierto');
    } catch {
      // Almacenamiento bloqueado: se pliega igual, solo que no se
      // recuerda al recargar.
    }
    pintar();
  });
}

/* ============================================================
   La hoja de móvil

   Un `<dialog>` de verdad: atrapa el foco, cierra con Escape y devuelve
   el foco al botón que lo abrió. Lo único que hay que añadir a mano es
   cerrar al pulsar el fondo y al seguir un enlace — si no, la hoja se
   quedaría abierta encima de la página nueva.
   ============================================================ */

function montarHoja() {
  const hoja = document.querySelector<HTMLDialogElement>('[data-hoja]');
  const abrir = document.querySelector<HTMLButtonElement>('[data-hoja-abrir]');
  if (!abrir) return;

  if (!hoja || typeof hoja.showModal !== 'function') {
    abrir.hidden = true;
    return;
  }

  abrir.addEventListener('click', () => hoja.showModal());

  hoja.querySelector<HTMLButtonElement>('[data-hoja-cerrar]')?.addEventListener('click', () => {
    hoja.close();
  });

  hoja.addEventListener('click', (evento) => {
    if (pulsoFuera(hoja, evento)) hoja.close();
  });

  // Seguir un enlace cierra la hoja. Con el enrutador del cliente esto ya
  // no es un detalle: la página cambia sin recargar, así que sin esto la
  // hoja se quedaría abierta encima de la herramienta recién abierta.
  for (const enlace of hoja.querySelectorAll('a, [data-bento]')) {
    enlace.addEventListener('click', () => hoja.close());
  }
}

function iniciar() {
  // El cinturón del script en línea: si aquel no llegó a correr —lo tumbó
  // la política de seguridad, o el hash se quedó viejo— los botones
  // seguirían escondidos aunque sí haya JavaScript. Aquí ya es tarde para
  // evitar el salto, pero es mejor que perderlos.
  document.documentElement.dataset.js = '1';

  montarLanzador();
  montarPlegado();
  montarHoja();
}

document.addEventListener('astro:page-load', iniciar);
