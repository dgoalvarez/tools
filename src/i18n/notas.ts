/**
 * Los textos de la herramienta de notas, en los dos idiomas.
 */
import type { T } from './config';

export const NOTAS = {
  // ---------- Lo que la herramienta promete y lo que no ----------
  /**
   * Va debajo del encabezado, siempre visible.
   *
   * No es un aviso legal ni una nota al pie: es la regla de uso. Quien
   * escribe aquí tiene que saber, antes de escribir, que esto se va al
   * cerrar la pestaña — y saber también que por eso mismo no acaba en
   * ningún servidor.
   */
  aviso: {
    es: 'Se queda mientras esta pestaña siga abierta, y desaparece al cerrarla. No se envía a ningún sitio ni sale de tu aparato.',
    en: 'It stays as long as this tab is open, and goes when you close it. Nothing is sent anywhere and nothing leaves your device.',
  },

  // ---------- La lista ----------
  laLista: { es: 'La lista', en: 'The list' },
  anadir: { es: 'Añade algo y pulsa Intro', en: 'Add something and press Enter' },
  anadirBoton: { es: 'Añadir', en: 'Add' },
  /** El texto de cada línea, para el lector de pantalla. */
  tarea: { es: 'Tarea', en: 'Task' },
  hecha: { es: 'Hecha', en: 'Done' },
  subir: { es: 'Subir', en: 'Move up' },
  bajar: { es: 'Bajar', en: 'Move down' },
  borrar: { es: 'Borrar', en: 'Delete' },
  borrarHechas: { es: 'Borrar las hechas', en: 'Clear the done ones' },
  /** Vacía la lista entera. Va sin rótulo, así que este texto es su nombre. */
  limpiarLista: { es: 'Vaciar la lista', en: 'Empty the list' },
  /** El asa de arrastrar, para quien navega con lector de pantalla. */
  arrastrarFila: { es: 'Arrastrar para reordenar', en: 'Drag to reorder' },
  /**
   * Aparece solo después de un borrado, y se queda hasta el siguiente.
   *
   * Sin tiempo límite a propósito: un aviso que se va en cinco segundos
   * convierte deshacer en una carrera, y aquí no hay ninguna prisa. Lo
   * único destructivo de la herramienta son los dos borrados, así que el
   * botón solo sale cuando de verdad se ha perdido algo.
   */
  deshacerBorrado: { es: 'Deshacer', en: 'Undo' },
  /** Lo que lee un lector de pantalla. «{n}» se sustituye. */
  deshacerBorradoDetalle: {
    es: 'Deshacer el borrado: vuelven {n}',
    en: 'Undo the delete: {n} coming back',
  },
  unaLinea: { es: '1 línea', en: '1 line' },
  variasLineas: { es: '{n} líneas', en: '{n} lines' },
  /**
   * El aviso de que lo escrito ya no sobrevive a una recarga.
   *
   * La herramienta promete, en su encabezado y sin letra pequeña, que lo
   * escrito se queda mientras la pestaña siga abierta. En una ventana
   * privada o con la cuota llena, `sessionStorage` lanza y esa promesa
   * deja de ser verdad. Antes se tragaba la excepción en silencio: se
   * seguía escribiendo con una garantía que ya no existía. Ahora lo dice.
   */
  sinGuardar: {
    es: 'Este navegador no deja guardar nada, así que lo escrito no sobrevivirá a una recarga. Sigue funcionando todo; copia lo que quieras conservar.',
    en: 'This browser will not let anything be saved, so what you write will not survive a reload. Everything still works; copy anything you want to keep.',
  },
  /** «1 de 3». Los dos números se sustituyen. */
  contador: { es: '{a} de {b}', en: '{a} of {b}' },
  listaVacia: {
    es: 'Todavía no hay nada. Escribe arriba y pulsa Intro.',
    en: 'Nothing here yet. Type above and press Enter.',
  },
  copiarLista: { es: 'Copiar la lista', en: 'Copy the list' },

  // ---------- La nota ----------
  laNota: { es: 'La nota', en: 'The note' },
  notaVacia: {
    es: 'Lo que sea: un enlace, un número, tres frases.',
    en: 'Whatever you need: a link, a number, three sentences.',
  },
  copiarNota: { es: 'Copiar la nota', en: 'Copy the note' },
  /* La barra de formato. Los rótulos van en el `title` y en el nombre
     accesible: los botones son iconos, y un icono sin nombre no lo lee
     nadie que no vea. */
  negrita: { es: 'Negrita', en: 'Bold' },
  cursiva: { es: 'Cursiva', en: 'Italic' },
  subrayado: { es: 'Subrayado', en: 'Underline' },
  tachado: { es: 'Tachado', en: 'Strikethrough' },
  vinetas: { es: 'Lista con viñetas', en: 'Bulleted list' },
  numeros: { es: 'Lista numerada', en: 'Numbered list' },

  // ---------- El dibujo ----------
  elDibujo: { es: 'El dibujo', en: 'The drawing' },
  dibujoVacio: {
    es: 'Dibuja aquí con el dedo, el ratón o el lápiz.',
    en: 'Draw here with your finger, mouse or pen.',
  },
  /**
   * Que el dibujo NO aguanta una recarga.
   *
   * Arriba, la lista y la nota sí. Callarse esta diferencia sería dejar
   * que alguien pierda un croquis por creerse lo que promete la tarjeta
   * de al lado, así que va a la vista y con la salida al lado: bajarlo.
   */
  dibujoEfimero: {
    es: 'Este no aguanta una recarga. Descárgalo si lo quieres guardar.',
    en: 'This one does not survive a reload. Download it if you want to keep it.',
  },
  /**
   * Cómo sale el archivo, dicho antes de descargarlo.
   *
   * Las dos cosas que sorprenderían al abrirlo: que no trae el lienzo
   * entero sino solo el dibujo, y que el fondo es transparente. Lo
   * segundo importa más de lo que parece desde que se puede elegir el
   * color: un trazo claro sobre nada no se ve en un visor de fondo
   * blanco, y sin este aviso parecería que la descarga salió vacía.
   */
  dibujoPng: {
    es: 'El PNG sale ceñido al dibujo y con el fondo transparente.',
    en: 'The PNG comes out trimmed to the drawing, with a transparent background.',
  },
  deshacerTrazo: { es: 'Deshacer', en: 'Undo' },
  rehacerTrazo: { es: 'Rehacer', en: 'Redo' },
  borrarDibujo: { es: 'Borrar el dibujo', en: 'Clear the drawing' },
  descargarDibujo: { es: 'Descargar', en: 'Download' },
  tinta: { es: 'Tinta', en: 'Ink' },
  /** La cuarta muestra, la que abre el selector de color del sitio. */
  tintaLibre: { es: 'Elegir el color', en: 'Pick the colour' },
  /**
   * Las dos herramientas del lienzo.
   *
   * «Bote» y no «Relleno»: lo que se elige es el instrumento, y en
   * español el bote de pintura es el nombre que tiene desde siempre. Un
   * rótulo que dice el efecto —«Relleno»— no explica que hay que TOCAR
   * dentro de la forma.
   */
  lapiz: { es: 'Dibujar', en: 'Draw' },
  /*
   * El rótulo del bote dice DÓNDE hay que tocar, no solo cómo se llama.
   *
   * Se midió: cuatro trazos sueltos que forman un cuadrado dejan las
   * cuatro esquinas con hueco —la biblioteca de trazado afina las puntas—
   * y el color se escapa por ahí y baña el lienzo. Quien lo sufra sin
   * aviso pensará que la herramienta está rota; sabiendo que la forma
   * tiene que estar cerrada, lo entiende y cierra el trazo.
   */
  bote: {
    es: 'Bote de pintura · toca dentro de una forma cerrada',
    en: 'Paint bucket · tap inside a closed shape',
  },
  grosor: { es: 'Grosor', en: 'Thickness' },
  /** El grupo que decide el encuadre de la descarga. */
  proporcion: { es: 'Proporción de la descarga', en: 'Download proportion' },
  /**
   * La primera opción: sin proporción, solo ceñido.
   *
   * «Ceñido» y no «Libre»: lo que hace es apretarse al dibujo, y «libre»
   * habría sonado a que se puede arrastrar un recorte, que no se puede.
   */
  cenido: { es: 'Ceñido', en: 'Trimmed' },
  /** «12 palabras». El número se sustituye. */
  palabras: { es: '{n} palabras', en: '{n} words' },
  unaPalabra: { es: '1 palabra', en: '1 word' },
  copiado: { es: 'Copiado', en: 'Copied' },
} satisfies Record<string, T>;
