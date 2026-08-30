/**
 * Los iconos del menú, como datos.
 *
 * Van aquí y no como componentes de `lucide-react` por una razón concreta:
 * el menú es navegación, y la navegación tiene que funcionar sin
 * JavaScript. Un icono de React obligaría a convertir todo el menú en una
 * isla, y entonces quien tenga el JavaScript bloqueado —o quien llegue
 * antes de que cargue— se quedaría sin poder moverse por el sitio.
 *
 * Así son SVG que Astro escribe directamente en el HTML: cero bytes de
 * JavaScript y visibles en el primer pintado.
 *
 * Los trazos están copiados literalmente de `lucide-react` (licencia ISC),
 * que ya es una dependencia del proyecto para los iconos de dentro de las
 * herramientas. Si hace falta uno nuevo, se saca de
 * `node_modules/lucide-react/dist/esm/icons/<nombre>.mjs`, del array
 * `__iconNode`, y se pega aquí con el mismo formato.
 */

/** Un elemento SVG: el nombre de la etiqueta y sus atributos. */
export type Trazo = [string, Record<string, string>];

export const ICONOS = {
  // --- de las herramientas ---
  reloj: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'M12 6v6l4 2' }],
  ],
  contraste: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'M12 18a6 6 0 0 0 0-12v12z' }],
  ],
  tipografia: [
    ['path', { d: 'M12 4v16' }],
    ['path', { d: 'M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2' }],
    ['path', { d: 'M9 20h6' }],
  ],

  // --- de la propia interfaz ---
  rejilla: [
    ['rect', { width: '7', height: '7', x: '3', y: '3', rx: '1' }],
    ['rect', { width: '7', height: '7', x: '14', y: '3', rx: '1' }],
    ['rect', { width: '7', height: '7', x: '14', y: '14', rx: '1' }],
    ['rect', { width: '7', height: '7', x: '3', y: '14', rx: '1' }],
  ],
  panel: [
    ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
    ['path', { d: 'M9 3v18' }],
  ],
  cerrar: [
    ['path', { d: 'M18 6 6 18' }],
    ['path', { d: 'm6 6 12 12' }],
  ],
} satisfies Record<string, Trazo[]>;

export type IconoKey = keyof typeof ICONOS;
