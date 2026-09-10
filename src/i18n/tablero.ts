/**
 * Los textos del tablero, en los dos idiomas.
 */
import type { T } from './config';

export const TABLERO_TEXTOS = {
  /*
    El estado vacío no lleva texto, y por eso estos dos se han ido.

    Se escribieron para un rectángulo con un título y un párrafo
    explicando qué es un tablero. Lo que se publicó fue un rectángulo
    punteado con un «+», que dice lo mismo sin decir nada, así que
    llevaban aquí sin usarse desde entonces. Lo que hay que explicar se
    explica en el paso a paso.
  */

  anadir: { es: 'Añadir una herramienta', en: 'Add a tool' },
  anadirAlTablero: { es: 'Añadir al tablero', en: 'Add to the board' },
  vistaPrevia: { es: 'Así se verá', en: 'This is how it will look' },
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
    es: 'El reparto se queda en este aparato. Lo que escribas dentro de cada herramienta sigue donde ya vivía.',
    en: 'The layout stays on this device. Whatever you write inside each tool still lives where it did.',
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
  tamano: { es: 'Tamaño', en: 'Size' },
  masAncho: { es: 'Más ancho', en: 'Wider' },
  menosAncho: { es: 'Menos ancho', en: 'Narrower' },
  masAlto: { es: 'Más alto', en: 'Taller' },
  menosAlto: { es: 'Menos alto', en: 'Shorter' },
  quitar: { es: 'Quitar del tablero', en: 'Remove from the board' },
  moverAntes: { es: 'Mover antes', en: 'Move earlier' },
  moverDespues: { es: 'Mover después', en: 'Move later' },
  arrastrar: { es: 'Arrastrar para reordenar', en: 'Drag to reorder' },

  /** Cuando un widget solo admite una copia y ya está puesto. */
  yaPuesto: { es: 'Ya está en el tablero', en: 'Already on the board' },
} satisfies Record<string, T>;
