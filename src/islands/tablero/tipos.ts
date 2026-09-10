/**
 * El contrato entre el tablero y cada widget.
 *
 * ---------------------------------------------------------------------
 * Quién es dueño de qué
 *
 * Hay tres clases de estado y cada una tiene un dueño distinto. No
 * decidirlo por adelantado es lo que convierte un tablero en un sitio
 * donde las cosas se pisan:
 *
 *   · **Propio** — los trazos del dibujo, el buffer de deshacer. Vive en
 *     un `useState` DENTRO del widget y el tablero no lo ve nunca.
 *   · **Ajuste** — lo que hace distinta a ESTA copia de la de al lado.
 *     Lo guarda el tablero, y es exactamente lo que se comprime en el
 *     código.
 *   · **Compartido** — lo que tiene que ser el MISMO objeto que en la
 *     página de su herramienta: la libreta, la cuenta del pomodoro. No es
 *     de nadie de los dos: vive en su almacén, y los dos lo miran.
 *
 * ---------------------------------------------------------------------
 * Y una regla que no se salta: los widgets NO tocan la dirección
 *
 * Cada isla de herramienta escribe su estado en `window.location.search`
 * con claves de una letra, y las letras chocan entre herramientas: `h` es
 * «formato 12/24» en el reloj y «hora HH:MM» en los husos; `t` es «puesta
 * del temporizador» y «color de texto». Nunca ha estallado porque son
 * páginas distintas.
 *
 * En el tablero conviven. Así que aquí manda **una página, un escritor**:
 * el único que escribe la dirección es el tablero, y escribe una sola
 * clave. Los widgets reciben `ajustes` y `onAjustes` y ni siquiera
 * importan `url-state`.
 */
import type { Lang } from '../../i18n/config';
import type { Medida } from '../../lib/widgets';

export interface PropsWidget<A> {
  lang: Lang;
  ajustes: A;
  onAjustes: (parcial: Partial<A>) => void;
  /**
   * El tamaño en el que está puesto: columnas y filas.
   *
   * Baja como prop porque **decide el widget qué recorta**: un pomodoro
   * de 1×1 enseña la cifra y un botón, y uno de 2×2 enseña además el
   * ciclo y los cuatro mandos. El tablero no mete la mano dentro de una
   * pieza para quitarle cosas.
   */
  medida: Medida;
}
