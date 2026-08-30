/**
 * Lo único de la navegación que necesita JavaScript: el lanzador.
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
