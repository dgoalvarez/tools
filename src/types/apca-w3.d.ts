/**
 * `apca-w3` es la implementación oficial de APCA y no trae tipos.
 *
 * Se declaran solo las dos funciones que usa este proyecto, con la firma
 * que tienen de verdad en `node_modules/apca-w3/src/apca-w3.js`. Declarar
 * el módulo entero como `any` haría desaparecer el error sin ganar nada:
 * lo que interesa es que TypeScript sepa que `calcAPCA` puede devolver un
 * texto, porque con `places` distinto de -1 devuelve una cadena con
 * decimales fijos. Por eso en contrast.ts todo pasa por `Number()`.
 */
declare module 'apca-w3' {
  /**
   * El contraste de luminosidad entre un color de texto y uno de fondo.
   * Devuelve un número (Lc) cuando `places` es -1, que es lo de fábrica.
   */
  export function calcAPCA(
    textColor: string | number[],
    bgColor: string | number[],
    places?: number,
    round?: boolean
  ): number | string;

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
