/**
 * Los iconos del menú, de Phosphor.
 *
 * Se usan los archivos SVG sueltos de `@phosphor-icons/core` y no los
 * componentes de `@phosphor-icons/react`, y la razón no es el peso: el menú
 * es navegación y tiene que funcionar sin JavaScript. Un icono de React
 * obligaría a convertir todo el riel en una isla, y entonces quien tenga el
 * JavaScript bloqueado —o quien llegue antes de que cargue— se quedaría sin
 * poder moverse por el sitio.
 *
 * Con `?raw`, Vite mete el contenido del archivo en el paquete durante la
 * compilación. Lo que llega al navegador es SVG dentro del HTML: cero bytes
 * de JavaScript y visible en el primer pintado.
 *
 * Para añadir uno: buscarlo en https://phosphoricons.com, importarlo aquí
 * con su nombre exacto y darle una clave en castellano.
 */
import globo from '@phosphor-icons/core/regular/globe.svg?raw';
import contraste from '@phosphor-icons/core/regular/circle-half.svg?raw';
import cronometro from '@phosphor-icons/core/regular/timer.svg?raw';
import despertador from '@phosphor-icons/core/regular/alarm.svg?raw';
import tipografia from '@phosphor-icons/core/regular/text-aa.svg?raw';
import paleta from '@phosphor-icons/core/regular/swatches.svg?raw';
import rejilla from '@phosphor-icons/core/regular/squares-four.svg?raw';
import lupa from '@phosphor-icons/core/regular/magnifying-glass.svg?raw';
import cerrar from '@phosphor-icons/core/regular/x.svg?raw';
import casa from '@phosphor-icons/core/regular/house.svg?raw';
import mas from '@phosphor-icons/core/regular/dots-three.svg?raw';
import barras from '@phosphor-icons/core/regular/list.svg?raw';
// El de la lista con marcas sería el obvio para Notas, pero es casi el
// mismo dibujo que `list`, que ya usa la hamburguesa: en el riel plegado
// se verían dos iconos iguales con destinos distintos.
import notas from '@phosphor-icons/core/regular/note-pencil.svg?raw';
// Los dos del tablero. Nacen aquí porque el menú de añadir enseña las
// cuatro herramientas juntas, y ahí tres iconos iguales no distinguen
// nada: la lista, la nota y el dibujo salían las tres con `note-pencil`.
// La casilla marcada se elige antes que `list-checks` por lo mismo que
// dice el comentario de arriba: `list-checks` es casi el dibujo de
// `list`, que ya es la hamburguesa del riel, y en el tablero los dos se
// ven a la vez.
import tareas from '@phosphor-icons/core/regular/check-square-offset.svg?raw';
import pincel from '@phosphor-icons/core/regular/paint-brush.svg?raw';
// Los tres del tablero que cuentan tiempo. Con el mismo icono los tres,
// el panel de añadir enseñaba «El pomodoro», «El cronómetro» y «El
// temporizador» con el mismo dibujo, que es no distinguir nada. Y la
// hora llevaba un despertador, que es otra cosa.
import reloj from '@phosphor-icons/core/regular/clock.svg?raw';
import cuentaAtras from '@phosphor-icons/core/regular/clock-countdown.svg?raw';
import arena from '@phosphor-icons/core/regular/hourglass-medium.svg?raw';

/**
 * Se queda solo lo de dentro del `<svg>`: la envoltura la pone
 * `Icono.astro`, que es quien sabe de qué tamaño va y si se anuncia o no.
 */
const interior = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

/** El lienzo de Phosphor. Todos sus iconos vienen en esta rejilla. */
export const VIEWBOX = '0 0 256 256';

export const ICONOS = {
  // --- de las herramientas ---
  globo: interior(globo),
  cronometro: interior(cronometro),
  despertador: interior(despertador),
  contraste: interior(contraste),
  paleta: interior(paleta),
  tipografia: interior(tipografia),
  notas: interior(notas),
  tareas: interior(tareas),
  pincel: interior(pincel),
  reloj: interior(reloj),
  cuentaAtras: interior(cuentaAtras),
  arena: interior(arena),

  // --- de la propia interfaz ---
  rejilla: interior(rejilla),
  lupa: interior(lupa),
  cerrar: interior(cerrar),
  casa: interior(casa),
  mas: interior(mas),
  barras: interior(barras),
} satisfies Record<string, string>;

export type IconoKey = keyof typeof ICONOS;
