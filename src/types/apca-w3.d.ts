/**
 * `apca-w3` es la implementación oficial de APCA y no trae tipos.
 *
 * Se declaran las funciones con la firma que tienen de verdad en
 * `node_modules/apca-w3/src/apca-w3.js`. Declarar el módulo entero como
 * `any` haría desaparecer el error sin ganar nada: lo que interesa es que
 * TypeScript sepa que `APCAcontrast` puede devolver un texto, porque con
 * `places` distinto de -1 devuelve una cadena con decimales fijos. Por eso
 * en contrast.ts todo pasa por `Number()`.
 *
 * `calcAPCA` NO se declara, a propósito. Lee los colores con
 * `colorparsley`, que es AGPL-3.0, y usarla mete ese código en lo que se
 * sirve al navegador. Sin declaración, `astro check` falla antes de que
 * llegue a la alarma de licencias. La alternativa está en `lcApca`.
 */
declare module 'apca-w3' {
  /**
   * La tabla de tamaños mínimos. El índice 0 es el propio Lc; del 1 al 9,
   * los grosores de 100 a 900. Los valores 999 y 777 no son tamaños sino
   * avisos: prohibido y solo decorativo.
   */
  export function fontLookupAPCA(contrast: number, places?: number): Array<string | number>;

  export function APCAcontrast(txtY: number, bgY: number, places?: number): number | string;
  export function sRGBtoY(rgb?: number[] | string): number;
  export function displayP3toY(rgb?: number[]): number;
  export function adobeRGBtoY(rgb?: number[]): number;
  export function alphaBlend(rgbaFG?: number[], rgbBG?: number[], round?: boolean): number[];
  export function reverseAPCA(
    contrast?: number,
    knownY?: number,
    knownType?: string,
    returnAs?: string
  ): number | string | false;
}
