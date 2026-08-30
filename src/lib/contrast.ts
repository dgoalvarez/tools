/**
 * Las dos formas de medir el contraste, y qué hacer cuando no coinciden.
 *
 * WCAG 2.2 es la norma vigente: es la que se puede citar como cumplimiento,
 * y solo mira la luminancia relativa de los dos colores.
 *
 * APCA es el algoritmo perceptual que propone el borrador de WCAG 3.0. Pesa
 * la polaridad (texto claro sobre oscuro no se lee igual que al revés) y el
 * tamaño y grosor de la letra. No es norma todavía, y la interfaz tiene que
 * decirlo, o estaría enseñando algo falso.
 *
 * Aquí no se reimplementa ninguno de los dos:
 *   · culori.wcagContrast para WCAG 2.x, comprobado contra WebAIM.
 *   · apca-w3, que es la implementación oficial de APCA.
 */
import {
  parse,
  formatHex,
  converter,
  inGamut,
  clampChroma,
  wcagContrast,
  type Oklch,
} from 'culori';
import { calcAPCA, fontLookupAPCA } from 'apca-w3';

const aOklch = converter('oklch');
const enGamaSrgb = inGamut('rgb');

/** Redondeo a dos decimales, que es como se enseña y como se juzga. */
const dosDecimales = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------- colores

export interface Color {
  /** Siempre hexadecimal de seis dígitos, sin alfa. */
  hex: string;
  /** De 0 a 1. Los dos algoritmos trabajan sobre colores opacos. */
  alpha: number;
  /** El formato en que se escribió: rgb, hsl, oklch… */
  formato: string;
}

/**
 * Lee un color escrito en cualquier formato que entienda el navegador:
 * hexadecimal, rgb(), hsl(), oklch(), lab(), o un nombre como «teal».
 * Devuelve null si no es un color.
 */
export function leerColor(entrada: string): Color | null {
  const texto = entrada.trim();
  if (!texto) return null;

  const color = parse(texto);
  if (!color) return null;

  const hex = formatHex(color);
  if (!hex) return null;

  return { hex, alpha: color.alpha ?? 1, formato: color.mode };
}

/**
 * Compone un color translúcido sobre su fondo.
 *
 * Ni WCAG ni APCA saben qué hacer con la transparencia: los dos miden dos
 * colores opacos. Un texto al 60 % no tiene contraste propio — tiene el del
 * color que resulta de mezclarlo con lo que haya detrás. Esto hace esa
 * mezcla, en el mismo espacio con gamma en el que la hace el navegador.
 */
export function componerSobre(color: Color, fondoHex: string): string {
  if (color.alpha >= 1) return color.hex;

  const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const mezcla = [0, 1, 2].map((i) => {
    const frente = canal(color.hex, i);
    const fondo = canal(fondoHex, i);
    return Math.round(color.alpha * frente + (1 - color.alpha) * fondo);
  });

  return '#' + mezcla.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ------------------------------------------------------------------ texto

export interface Texto {
  /** Tamaño en píxeles CSS. */
  px: number;
  /** Grosor de 100 a 900, en pasos de 100. */
  peso: number;
}

/**
 * Qué considera WCAG «texto grande»: 18 pt (24 px) normal, o 14 pt
 * (18.66 px) en negrita. Importa porque le baja el listón de 4.5 a 3.
 */
export function esTextoGrande({ px, peso }: Texto): boolean {
  return px >= 24 || (px >= 18.66 && peso >= 700);
}

// -------------------------------------------------------------- WCAG 2.2

export interface ResultadoWcag {
  /** La razón de contraste, de 1 a 21. */
  razon: number;
  grande: boolean;
  umbralAA: number;
  umbralAAA: number;
  pasaAA: boolean;
  pasaAAA: boolean;
  /** El 3:1 de controles de interfaz, iconos y bordes de campos. */
  pasaComponentes: boolean;
}

export function medirWcag(textoHex: string, fondoHex: string, texto: Texto): ResultadoWcag {
  const razon = wcagContrast(textoHex, fondoHex);
  const grande = esTextoGrande(texto);

  const umbralAA = grande ? 3 : 4.5;
  const umbralAAA = grande ? 4.5 : 7;

  // El veredicto se da sobre el valor redondeado, que es el que se muestra
  // y el que usa la calculadora de WebAIM. Si no, un 4.4996 aparecería como
  // «4.50» con un «no pasa» al lado, y nadie entendería la contradicción.
  const mostrada = dosDecimales(razon);

  return {
    razon,
    grande,
    umbralAA,
    umbralAAA,
    pasaAA: mostrada >= umbralAA,
    pasaAAA: mostrada >= umbralAAA,
    pasaComponentes: mostrada >= 3,
  };
}

// ------------------------------------------------------------------ APCA

export type EstadoApca = 'pasa' | 'insuficiente' | 'solo-decorativo' | 'prohibido';

export interface ResultadoApca {
  /** Lc, de -108 a 106. El signo es la polaridad, no un defecto. */
  lc: number;
  /** Tamaño mínimo en px para el grosor elegido, si es que hay alguno. */
  minimoPx: number | null;
  estado: EstadoApca;
}

/**
 * La tabla de APCA devuelve, para cada grosor de 100 a 900, el tamaño
 * mínimo en píxeles. Dos valores no son tamaños sino avisos:
 *
 *   999 — prohibido: ese contraste no vale para texto de ningún tamaño.
 *   777 — solo para texto decorativo, nunca para leer.
 */
export function medirApca(textoHex: string, fondoHex: string, texto: Texto): ResultadoApca {
  const lc = Number(calcAPCA(textoHex, fondoHex));
  const tabla = fontLookupAPCA(lc) as Array<string | number>;

  // El índice 0 es el propio Lc; del 1 al 9, los grosores de 100 a 900.
  const indice = Math.min(9, Math.max(1, Math.round(texto.peso / 100)));
  const valor = Number(tabla[indice]);

  if (valor === 999) return { lc, minimoPx: null, estado: 'prohibido' };
  if (valor === 777) return { lc, minimoPx: null, estado: 'solo-decorativo' };

  return { lc, minimoPx: valor, estado: texto.px >= valor ? 'pasa' : 'insuficiente' };
}

// ------------------------------------------------------------- sugerencia

export interface Sugerencia {
  hex: string;
  /** Hacia dónde hubo que moverse. */
  direccion: 'oscurecer' | 'aclarar';
  razon: number;
  lc: number;
  /**
   * Verdadero si hubo que bajar el croma para que el color siguiera siendo
   * representable en pantalla. Pasa con los colores muy saturados cuando se
   * los lleva a los extremos de luminosidad.
   */
  cromaAjustado: boolean;
}

/**
 * El color más cercano al original que sí aprueba, moviendo solo la
 * luminosidad en OKLCH y conservando tono y croma.
 *
 * Es el paso que casi ninguna herramienta da: decirte que un color no pasa
 * es fácil, y no sirve de nada si luego tienes que adivinar cuál sí.
 *
 * OKLCH y no HSL porque en OKLCH mover la luminosidad no cambia el tono que
 * se percibe. En HSL, bajarle la «lightness» a un amarillo lo vuelve verde.
 *
 * El barrido es lineal, en pasos de 0.002, y no una búsqueda binaria: la
 * razón de contraste no es monótona respecto a la luminosidad —tiene un
 * mínimo justo en la del fondo— y una binaria puede caer en el lado
 * equivocado. Quinientos pasos en JavaScript son gratis.
 */
export function sugerirColor(
  textoHex: string,
  fondoHex: string,
  objetivo: number
): Sugerencia | null {
  // Si ya cumple, no hay nada que sugerir.
  if (dosDecimales(wcagContrast(textoHex, fondoHex)) >= objetivo) return null;

  const partida = aOklch(textoHex);
  if (!partida) return null;

  const paso = 0.002;
  let mejor: Sugerencia | null = null;
  let mejorDistancia = Infinity;

  for (const direccion of ['oscurecer', 'aclarar'] as const) {
    const signo = direccion === 'oscurecer' ? -1 : 1;

    for (let n = 1; n * paso <= 1; n++) {
      const l = partida.l + signo * n * paso;
      if (l < 0 || l > 1) break;

      const candidato: Oklch = { ...partida, l };
      const cromaAjustado = !enGamaSrgb(candidato);
      const hex = formatHex(cromaAjustado ? clampChroma(candidato, 'oklch') : candidato);
      if (!hex) continue;

      const razon = wcagContrast(hex, fondoHex);
      if (dosDecimales(razon) < objetivo) continue;

      const distancia = n * paso;
      if (distancia < mejorDistancia) {
        mejorDistancia = distancia;
        mejor = { hex, direccion, razon, lc: Number(calcAPCA(hex, fondoHex)), cromaAjustado };
      }
      // Dentro de una dirección, el primero que pasa es el más cercano.
      break;
    }
  }

  return mejor;
}

// ------------------------------------------------------------- desacuerdo

/**
 * Si los dos veredictos coinciden no hay nada que explicar. Cuando no
 * coinciden, saber por qué es lo que separa una herramienta de la enésima
 * calculadora de contraste.
 */
export function hayDesacuerdo(wcag: ResultadoWcag, apca: ResultadoApca): boolean {
  return wcag.pasaAA !== (apca.estado === 'pasa');
}

/** Texto claro sobre fondo oscuro. APCA lo trata distinto; WCAG no. */
export function esPolaridadClara(lc: number): boolean {
  return lc < 0;
}
