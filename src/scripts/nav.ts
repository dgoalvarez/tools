/**
 * Lo que la navegación necesita de JavaScript: el lanzador, plegar el
 * riel y abrir la hoja de móvil.
 *
 * No es imprescindible. Sin este archivo la barra sigue navegando con sus
 * enlaces, y por eso el botón que lo abre nace con `hidden` y es este
 * script quien lo enseña: un botón que no responde es peor que un botón
 * que no está.
 *
 * Astro lo empaqueta aparte, así que no añade ningún script en línea y la
 * política de seguridad no se entera.
 */
const dialogo = document.querySelector<HTMLDialogElement>('[data-bento-dialog]');
const botones = document.querySelectorAll<HTMLButtonElement>('[data-bento]');
const cerrar = document.querySelector<HTMLButtonElement>('[data-bento-cerrar]');

if (dialogo && typeof dialogo.showModal === 'function') {
  for (const boton of botones) {
    boton.hidden = false;
    boton.addEventListener('click', () => dialogo.showModal());
  }

  cerrar?.addEventListener('click', () => dialogo.close());

  // Pulsar fuera de la tarjeta cierra. El <dialog> no lo trae de fábrica:
  // el clic en el fondo llega al propio diálogo, así que se comprueba que
  // el punto pulsado caiga fuera de su caja.
  dialogo.addEventListener('click', (evento) => {
    const caja = dialogo.getBoundingClientRect();
    const fuera =
      evento.clientX < caja.left ||
      evento.clientX > caja.right ||
      evento.clientY < caja.top ||
      evento.clientY > caja.bottom;
    if (fuera) dialogo.close();
  });

  // El atajo que anuncia la propia pastilla. Si no funcionara, la
  // pastilla estaría mintiendo.
  document.addEventListener('keydown', (evento) => {
    if (evento.key.toLowerCase() !== 'k' || !(evento.metaKey || evento.ctrlKey)) return;
    evento.preventDefault();
    if (dialogo.open) dialogo.close();
    else dialogo.showModal();
  });

  // En Windows y Linux el atajo se escribe Ctrl, no ⌘. La pastilla lo
  // dice bien en cada sitio en vez de asumir un Mac.
  if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
    for (const atajo of document.querySelectorAll('[data-atajo]')) {
      atajo.textContent = 'Ctrl K';
    }
  }
}


/* ============================================================
   Plegar y desplegar el riel

   El estado vive en `data-riel` del <html> y se recuerda en
   `localStorage`. Lo lee además el script en línea de `Base.astro`, que
   corre ANTES del primer pintado: sin eso, quien lo deja abierto vería el
   riel plegarse y desplegarse de un salto en cada carga.
   ============================================================ */

const RIEL = 'dgo-tools-riel';
const plegar = document.querySelector<HTMLButtonElement>('[data-riel-plegar]');

if (plegar) {
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

  plegar.hidden = false;
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

const hoja = document.querySelector<HTMLDialogElement>('[data-hoja]');
const abrirHoja = document.querySelector<HTMLButtonElement>('[data-hoja-abrir]');

if (hoja && abrirHoja && typeof hoja.showModal === 'function') {
  abrirHoja.hidden = false;
  abrirHoja.addEventListener('click', () => hoja.showModal());

  hoja.querySelector<HTMLButtonElement>('[data-hoja-cerrar]')?.addEventListener('click', () => {
    hoja.close();
  });

  // El clic en el fondo llega al propio diálogo, así que se comprueba que
  // el punto pulsado caiga fuera de su caja.
  hoja.addEventListener('click', (evento) => {
    const caja = hoja.getBoundingClientRect();
    const fuera =
      evento.clientX < caja.left ||
      evento.clientX > caja.right ||
      evento.clientY < caja.top ||
      evento.clientY > caja.bottom;
    if (fuera) hoja.close();
  });

  // Seguir un enlace cierra la hoja. En una navegación normal da igual
  // —la página se recarga entera— pero el buscador que abre desde dentro
  // sí necesita que la hoja se aparte.
  for (const enlace of hoja.querySelectorAll('a, [data-bento]')) {
    enlace.addEventListener('click', () => hoja.close());
  }
}
