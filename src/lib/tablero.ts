/**
 * El tablero: una lista de piezas, y su código.
 *
 * Aquí se junta lo de `codigo.ts` —bytes y texto— con lo de `widgets.ts`
 * —qué widget hay y qué ajustes lleva—. Sigue siendo puro: sin React, sin
 * DOM, comprobable desde node, que es lo que exige la casa para todo lo
 * que es aritmética.
 */
import { Escritor, Lector, VERSION, aBase64url, deBase64url, sumaDeControl } from './codigo.ts';
import { TALLAS, WIDGETS, medidasDe, porCodigo, type Talla, type WidgetKey } from './widgets.ts';

/** Una pieza puesta en el tablero. */
export interface Pieza {
  /** Solo vive en memoria: no viaja en el código, se recrea al leer. */
  id: string;
  tipo: WidgetKey;
  talla: Talla;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ajustes: any;
}

export type Tablero = Pieza[];

/**
 * El tope de piezas.
 *
 * Quince, porque la cuenta va en cuatro bits de la cabecera. No es un
 * accidente del formato: un tablero de más de quince deja de ser un
 * tablero y pasa a ser otra página que hay que recorrer.
 */
export const TOPE_PIEZAS = 15;

export type Motivo =
  'formato' | 'version' | 'checksum' | 'widget' | 'talla' | 'ajustes' | 'sobra' | 'falta';

export type Lectura = { ok: true; tablero: Tablero } | { ok: false; motivo: Motivo };

let siguienteId = 0;
/** Un identificador de andar por casa: solo tiene que ser único en la página. */
export function nuevoId(): string {
  return `p${++siguienteId}`;
}

/**
 * Comprime el tablero.
 *
 * ```
 * byte 0      : VVVVNNNN   versión · cuántas piezas
 * por pieza   : TTTTTTSS   código de widget · índice de talla
 *               + sus ajustes, de largo variable
 * último byte : suma de control
 * ```
 *
 * **No hay byte de largo por pieza**, y es una decisión. Costaría un byte
 * de cada seis para que un lector viejo pudiera saltarse un widget que no
 * conoce — pero saltárselo devuelve un tablero al que le falta una pieza
 * sin decirlo, que es peor que avisar de que el código es de una versión
 * más nueva. Un widget desconocido invalida el código entero.
 */
export function codificar(tablero: Tablero): string {
  const e = new Escritor();
  const piezas = tablero.slice(0, TOPE_PIEZAS);

  e.byte((VERSION << 4) | piezas.length);

  for (const pieza of piezas) {
    const widget = WIDGETS[pieza.tipo];
    const talla = Math.max(0, TALLAS.indexOf(pieza.talla));
    e.byte((widget.codigo << 2) | talla);
    widget.aBytes(pieza.ajustes, e);
  }

  const bytes = e.sacar();
  bytes.push(sumaDeControl(bytes));
  return aBase64url(bytes);
}

/**
 * Descomprime, o dice por qué no.
 *
 * Devuelve un MOTIVO y no lanza, porque quien lo llama tiene que poder
 * decir cosas distintas: «este código es de un tablero más nuevo» no es
 * lo mismo que «este código no se puede leer», y el que lo tiene en la
 * mano hace cosas distintas con cada una.
 */
export function decodificar(texto: string): Lectura {
  const bytes = deBase64url(texto);
  if (!bytes || bytes.length < 2) return { ok: false, motivo: 'formato' };

  const control = bytes[bytes.length - 1]!;
  const cuerpo = bytes.slice(0, -1);
  if (sumaDeControl(cuerpo) !== control) return { ok: false, motivo: 'checksum' };

  const l = new Lector(cuerpo);
  const cabecera = l.byte();
  const version = cabecera >> 4;
  const cuantas = cabecera & 0x0f;

  if (version !== VERSION) return { ok: false, motivo: 'version' };

  const tablero: Tablero = [];

  for (let i = 0; i < cuantas; i++) {
    const marca = l.byte();
    if (l.agotado) return { ok: false, motivo: 'falta' };

    const tipo = porCodigo(marca >> 2);
    if (!tipo) return { ok: false, motivo: 'widget' };

    const talla = TALLAS[marca & 0x03];
    if (!talla || !WIDGETS[tipo].tallas.includes(talla)) return { ok: false, motivo: 'talla' };

    const ajustes = WIDGETS[tipo].deBytes(l);
    if (l.agotado) return { ok: false, motivo: 'falta' };
    if (ajustes === null) return { ok: false, motivo: 'ajustes' };

    tablero.push({ id: nuevoId(), tipo, talla, ajustes });
  }

  // Que sobren bytes significa que lo leído no era lo que se escribió:
  // otra versión del catálogo, o un pegado con basura detrás.
  if (l.sobran() > 0) return { ok: false, motivo: 'sobra' };

  return { ok: true, tablero };
}

/**
 * Recorta un tablero a lo que es legal.
 *
 * Se usa con lo que viene de fuera —el respaldo del aparato, sobre todo—
 * donde no hay checksum que valga: lo guardado puede ser de una versión
 * anterior del catálogo, o alguien pudo tocarlo desde la consola.
 */
export function validar(tablero: Tablero): Tablero {
  const cuantos = new Map<WidgetKey, number>();
  const salida: Tablero = [];

  for (const pieza of tablero) {
    if (salida.length >= TOPE_PIEZAS) break;

    const widget = WIDGETS[pieza.tipo];
    if (!widget) continue;

    const puestos = cuantos.get(pieza.tipo) ?? 0;
    if (puestos >= widget.tope) continue;
    cuantos.set(pieza.tipo, puestos + 1);

    salida.push({
      id: pieza.id || nuevoId(),
      tipo: pieza.tipo,
      talla: widget.tallas.includes(pieza.talla) ? pieza.talla : widget.tallas[0]!,
      ajustes: { ...widget.ajustesIniciales, ...(pieza.ajustes ?? {}) },
    });
  }

  return salida;
}

/**
 * Cuántas columnas caben a este ancho.
 *
 * Los cortes son los cinco anchos que ya visita `npm run romper`, para
 * que lo que se comprueba aquí y lo que se comprueba en el navegador
 * hablen de los mismos números.
 */
export function columnasPara(ancho: number): 1 | 2 | 3 | 4 {
  if (ancho >= 1200) return 4;
  if (ancho >= 1024) return 3;
  if (ancho >= 700) return 2;
  return 1;
}

/**
 * La talla recortada a las columnas que hay.
 *
 * Es el espejo en TypeScript del `min()` que hace el CSS. Existe para
 * poder comprobar que los dos dicen lo mismo: si un día divergen, el
 * tablero se vería de una forma y se mediría de otra.
 */
export function piezaCabe(talla: Talla, columnas: number): { cols: number; filas: number } {
  const { cols, filas } = medidasDe(talla);
  return { cols: Math.min(cols, columnas), filas };
}
