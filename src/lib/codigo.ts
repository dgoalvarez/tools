/**
 * Leer y escribir bytes, y pasarlos a texto que se pueda pegar.
 *
 * Es la mitad de abajo del código del tablero: aquí no se sabe qué es un
 * widget ni qué es una talla, solo bytes. Lo que sabe de widgets vive en
 * `widgets.ts`, y lo que junta las dos cosas en `tablero.ts`.
 *
 * ---------------------------------------------------------------------
 * Por qué un código y no un enlace largo
 *
 * El tablero podría ir en la dirección tal cual —`?w=reloj:1x1,...`— y
 * sería legible, pero un panel de diez widgets con sus ajustes son
 * doscientos y pico caracteres, y un enlace así no se pega en un mensaje
 * sin que alguien lo parta por la mitad.
 *
 * Comprimido son unos quince. Y no es un identificador contra una base de
 * datos: **el código ES el tablero**. No hay servidor que consultar, así
 * que un código funciona para siempre y sin que nadie guarde nada.
 */

/** Va por delante de todo y dice cómo leer lo que sigue. */
export const VERSION = 1;

/**
 * Escribe bytes uno detrás de otro.
 *
 * Sin comprobaciones de rango: los valores vienen de `aBytes` de cada
 * widget, que es quien conoce sus propios topes. Meter aquí una segunda
 * red de seguridad haría que un fallo se tapara en vez de saltar.
 */
export class Escritor {
  private readonly bytes: number[] = [];

  byte(n: number): this {
    this.bytes.push(n & 0xff);
    return this;
  }

  /** Dos bytes, el gordo primero. Para índices de hasta 65.535. */
  doble(n: number): this {
    return this.byte(n >> 8).byte(n);
  }

  /** Un color, como tres bytes. Acepta `#abc` y `#aabbcc`. */
  color(hex: string): this {
    const limpio = hex.replace('#', '');
    const largo =
      limpio.length === 3
        ? limpio
            .split('')
            .map((c) => c + c)
            .join('')
        : limpio;
    return this.byte(parseInt(largo.slice(0, 2), 16))
      .byte(parseInt(largo.slice(2, 4), 16))
      .byte(parseInt(largo.slice(4, 6), 16));
  }

  sacar(): number[] {
    return [...this.bytes];
  }
}

/**
 * Lee bytes uno detrás de otro, y se acuerda de si se pasó del final.
 *
 * `agotado` en vez de lanzar: un código truncado —el fallo de verdad, un
 * pegado a medias desde un chat— es un dato malo, no un error del
 * programa. Quien lee comprueba la bandera y devuelve un motivo.
 */
export class Lector {
  private i = 0;
  agotado = false;
  private readonly bytes: number[];

  /* El campo se declara y se asigna a mano, y no con la forma corta de
     TypeScript: node ejecuta estos módulos QUITANDO los tipos, sin
     transformarlos, y una propiedad declarada en el constructor no
     sobrevive a eso. Sin esto, `comprobar-tablero.ts` no arranca. */
  constructor(bytes: number[]) {
    this.bytes = bytes;
  }

  byte(): number {
    if (this.i >= this.bytes.length) {
      this.agotado = true;
      return 0;
    }
    return this.bytes[this.i++]!;
  }

  doble(): number {
    return (this.byte() << 8) | this.byte();
  }

  color(): string {
    const dos = (n: number) => n.toString(16).padStart(2, '0');
    return '#' + dos(this.byte()) + dos(this.byte()) + dos(this.byte());
  }

  /** Cuántos bytes quedan sin leer. Cero es lo que tiene que sobrar. */
  sobran(): number {
    return this.bytes.length - this.i;
  }
}

/**
 * La suma de control: un byte, con sal.
 *
 * Un byte caza 255 de cada 256 corrupciones al azar, que suena poco hasta
 * que se recuerda que hay un segundo detector más fuerte y que es el que
 * de verdad dispara: el estructural. Un código truncado casi siempre deja
 * de cuadrar entre la cuenta de la cabecera y los bytes que se consumen,
 * antes de llegar aquí.
 *
 * La sal existe para que un texto cualquiera que por casualidad sea
 * base64 válido no acabe abriendo un tablero raro en vez de decir que no
 * se puede leer.
 */
export function sumaDeControl(bytes: number[]): number {
  let c = 0x5a;
  for (const b of bytes) c = (c * 31 + b) & 0xff;
  return c;
}

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * A base64url, y SIN relleno.
 *
 * El `=` del final se rompe al pegarlo en según qué chat —hay quien lo
 * come y quien lo escapa— y no hace falta: la longitud se deduce.
 */
export function aBase64url(bytes: number[]): string {
  let texto = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!;
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    const trio = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);

    texto += ALFABETO[(trio >> 18) & 63]! + ALFABETO[(trio >> 12) & 63]!;
    if (b !== undefined) texto += ALFABETO[(trio >> 6) & 63]!;
    if (c !== undefined) texto += ALFABETO[trio & 63]!;
  }
  return texto;
}

/**
 * De base64url a bytes, o `null` si hay algo que no es del alfabeto.
 *
 * Se recortan los espacios de los dos lados antes de mirar: pegar desde
 * un mensaje trae un salto de línea con una frecuencia que no es
 * anecdótica, y rechazar un código bueno por un espacio sería un fallo
 * imposible de entender desde fuera.
 */
export function deBase64url(texto: string): number[] | null {
  const limpio = texto.trim();
  if (limpio.length === 0) return null;

  const bytes: number[] = [];
  for (let i = 0; i < limpio.length; i += 4) {
    const trozo = limpio.slice(i, i + 4);
    let acumulado = 0;

    for (let j = 0; j < trozo.length; j++) {
      const valor = ALFABETO.indexOf(trozo[j]!);
      if (valor === -1) return null;
      acumulado = (acumulado << 6) | valor;
    }

    // Un trozo de un solo carácter no completa ni un byte: sobra, y es
    // señal de un código cortado por la mitad.
    if (trozo.length === 1) return null;

    const relleno = 4 - trozo.length;
    acumulado <<= relleno * 6;
    const cuantos = trozo.length - 1;
    for (let k = 0; k < cuantos; k++) bytes.push((acumulado >> (16 - k * 8)) & 0xff);
  }
  return bytes;
}
