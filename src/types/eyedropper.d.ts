/**
 * La API EyeDropper todavía no está en las definiciones estándar de
 * TypeScript porque no la implementan todos los navegadores: hoy la traen
 * Chrome y Edge, y no Firefox ni Safari.
 *
 * Por eso `window.EyeDropper` se declara opcional: el código tiene que
 * comprobar que existe antes de usarla, y el tipo obliga a hacerlo.
 */
interface EyeDropperResult {
  /** El color bajo el cursor, en hexadecimal. */
  sRGBHex: string;
}

declare class EyeDropper {
  constructor();
  open(options?: { signal?: AbortSignal }): Promise<EyeDropperResult>;
}

interface Window {
  EyeDropper?: typeof EyeDropper;
}
