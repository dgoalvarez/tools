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
import reloj from '@phosphor-icons/core/regular/clock.svg?raw';
import contraste from '@phosphor-icons/core/regular/circle-half.svg?raw';
import cronometro from '@phosphor-icons/core/regular/timer.svg?raw';
import tipografia from '@phosphor-icons/core/regular/text-aa.svg?raw';
import rejilla from '@phosphor-icons/core/regular/squares-four.svg?raw';
import lupa from '@phosphor-icons/core/regular/magnifying-glass.svg?raw';
import cerrar from '@phosphor-icons/core/regular/x.svg?raw';
import casa from '@phosphor-icons/core/regular/house.svg?raw';
import mas from '@phosphor-icons/core/regular/dots-three.svg?raw';

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
  reloj: interior(reloj),
  cronometro: interior(cronometro),
  contraste: interior(contraste),
  tipografia: interior(tipografia),

  // --- de la propia interfaz ---
  rejilla: interior(rejilla),
  lupa: interior(lupa),
  cerrar: interior(cerrar),
  casa: interior(casa),
  mas: interior(mas),
} satisfies Record<string, string>;

export type IconoKey = keyof typeof ICONOS;
