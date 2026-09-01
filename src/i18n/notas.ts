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
  /** «12 palabras». El número se sustituye. */
  palabras: { es: '{n} palabras', en: '{n} words' },
  unaPalabra: { es: '1 palabra', en: '1 word' },
  copiado: { es: 'Copiado', en: 'Copied' },

  // ---------- El paso a paso ----------
  porQueSeVaTitulo: {
    es: 'Por qué se va al cerrar',
    en: 'Why it goes when you close it',
  },
  porQueSeVa: {
    es: 'Este sitio no guarda nada de nadie, y eso no admite excepciones cómodas. Lo que escribes aquí vive en la memoria que el navegador reserva para esta pestaña: sobrevive a una recarga, a un despiste y a irte a otra herramienta y volver, pero no a cerrarla. Si algo tiene que durar más, cópialo antes.',
    en: 'This site keeps nothing from anyone, and that does not allow convenient exceptions. What you write here lives in the memory the browser sets aside for this tab: it survives a reload, a slip and a trip to another tool and back — but not closing it. If something needs to outlive that, copy it out first.',
  },
} satisfies Record<string, T>;
