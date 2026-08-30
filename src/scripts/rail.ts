/**
 * Las dos cosas del riel que necesitan JavaScript.
 *
 * Ninguna es imprescindible: sin este archivo el riel sigue navegando, se
 * sigue abriendo al pasar por encima y se sigue abriendo con el tabulador.
 * Por eso los dos botones que dependen de él nacen con `hidden` y es este
 * script quien los enseña. Un botón que no responde es peor que un botón
 * que no está.
 *
 * Astro empaqueta este archivo aparte, así que no añade ningún script en
 * línea y la política de seguridad no se entera.
 */
const CLAVE_FIJADO = 'dgo-tools-riel';

/** El estado fijado se aplica antes del primer pintado, en Base.astro. */
function fijado(): boolean {
  return document.documentElement.dataset.riel === 'fijo';
}

function guardar(valor: boolean) {
  try {
    if (valor) localStorage.setItem(CLAVE_FIJADO, 'fijo');
    else localStorage.removeItem(CLAVE_FIJADO);
  } catch {
    // Navegación privada: el riel se fija igual, solo que no se recuerda.
  }
}

// ---------------------------------------------------------- dejarlo fijo

const botonFijar = document.querySelector<HTMLButtonElement>('[data-fijar]');
const textoFijar = document.querySelector<HTMLElement>('[data-fijar-texto]');

if (botonFijar) {
  // Los dos textos vienen del HTML para no escribir castellano ni inglés
  // aquí dentro: este archivo no debería saber en qué idioma está la
  // página.
  const textoAbrir = textoFijar?.textContent ?? '';
  const textoPlegar = botonFijar.dataset.textoSoltar ?? textoAbrir;

  const pintar = () => {
    const activo = fijado();
    botonFijar.setAttribute('aria-pressed', String(activo));
    if (textoFijar) textoFijar.textContent = activo ? textoPlegar : textoAbrir;
  };

  botonFijar.hidden = false;
  pintar();

  botonFijar.addEventListener('click', () => {
    const siguiente = !fijado();
    if (siguiente) document.documentElement.dataset.riel = 'fijo';
    else delete document.documentElement.dataset.riel;
    guardar(siguiente);
    pintar();
  });
}

// ------------------------------------------------------------ el lanzador

const botonBento = document.querySelector<HTMLButtonElement>('[data-bento]');
const dialogo = document.querySelector<HTMLDialogElement>('[data-bento-dialog]');
const botonCerrar = document.querySelector<HTMLButtonElement>('[data-bento-cerrar]');

if (botonBento && dialogo && typeof dialogo.showModal === 'function') {
  botonBento.hidden = false;

  botonBento.addEventListener('click', () => dialogo.showModal());
  botonCerrar?.addEventListener('click', () => dialogo.close());

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
}
