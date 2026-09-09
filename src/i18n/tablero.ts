/**
 * Los textos del tablero, en los dos idiomas.
 */
import type { T } from './config';

export const TABLERO_TEXTOS = {
  /**
   * Lo que se ve con el tablero vacío.
   *
   * No es un rectángulo en blanco con un botón: es donde se explica qué
   * es esto, porque quien llega la primera vez no tiene ninguna pista. Y
   * de paso es lo que hace que el paso a paso tenga un ancla firme que
   * existe en el HTML publicado, con el tablero recién estrenado.
   */
  vacioTitulo: { es: 'Tu tablero está vacío', en: 'Your board is empty' },
  vacioCuerpo: {
    es: 'Junta aquí las herramientas que uses a la vez: una lista, una nota, un dibujo, un pomodoro. Eliges cuáles, de qué tamaño y en qué orden.',
    en: 'Put the tools you use together in one place: a list, a note, a drawing, a pomodoro. You choose which ones, what size and in what order.',
  },

  anadir: { es: 'Añadir una herramienta', en: 'Add a tool' },
  elegir: { es: 'Qué quieres añadir', en: 'What do you want to add' },
  cerrar: { es: 'Cerrar', en: 'Close' },

  /**
   * Lo que exige la casa: si se guarda algo, la pantalla lo dice.
   *
   * Y dice las dos mitades, porque no se guardan en el mismo sitio: el
   * REPARTO —qué hay y de qué tamaño— se queda en el aparato, y lo que
   * hay DENTRO de cada pieza sigue donde ya vivía. Callarse la segunda
   * mitad haría creer que la lista del tablero sobrevive a cerrar la
   * pestaña, y no.
   */
  aviso: {
    es: 'El reparto de tu tablero se queda en este aparato y no sale de él. Lo que escribas dentro de cada herramienta sigue viviendo donde ya vivía: la lista y la nota, mientras la pestaña siga abierta.',
    en: 'Your board layout stays on this device and never leaves it. Whatever you write inside each tool still lives where it already did: the list and the note, for as long as this tab is open.',
  },

  /** El código: copiarlo, pegarlo, y qué decir cuando no vale. */
  codigo: { es: 'El código de tu tablero', en: 'Your board code' },
  copiarCodigo: { es: 'Copiar el código', en: 'Copy the code' },
  copiado: { es: 'Copiado', en: 'Copied' },
  pegarCodigo: { es: 'Pegar un código', en: 'Paste a code' },
  codigoAyuda: {
    es: 'Cópialo para llevarte este tablero a otro navegador o pasárselo a alguien. No es un enlace a nada: el tablero entero va dentro del código.',
    en: 'Copy it to take this board to another browser or pass it to someone. It is not a link to anything: the whole board travels inside the code.',
  },

  /*
   * Los motivos, uno por uno.
   *
   * «Es de una versión más nueva» y «no se puede leer» son problemas
   * distintos para quien tiene el código en la mano: con el primero hay
   * algo que hacer —actualizar, o pedir otro—, con el segundo no.
   */
  codigoIlegible: {
    es: 'Ese código no se puede leer. Puede que se haya copiado a medias.',
    en: 'That code cannot be read. It may have been copied halfway.',
  },
  codigoNuevo: {
    es: 'Ese código es de una versión más nueva del tablero.',
    en: 'That code is from a newer version of the board.',
  },
  codigoIntacto: {
    es: 'Tu tablero sigue como estaba.',
    en: 'Your board is still as it was.',
  },

  /** Los mandos de cada pieza. */
  talla: { es: 'Tamaño', en: 'Size' },
  quitar: { es: 'Quitar del tablero', en: 'Remove from the board' },
  moverAntes: { es: 'Mover antes', en: 'Move earlier' },
  moverDespues: { es: 'Mover después', en: 'Move later' },
  arrastrar: { es: 'Arrastrar para reordenar', en: 'Drag to reorder' },

  /** Cuando un widget solo admite una copia y ya está puesto. */
  yaPuesto: { es: 'Ya está en el tablero', en: 'Already on the board' },
} satisfies Record<string, T>;
