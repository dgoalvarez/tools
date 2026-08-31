/**
 * La aritmética de las rampas de color.
 *
 * ---------------------------------------------------------------------
 * De dónde salen las constantes
 *
 * Ninguna está puesta a ojo. Se extrajeron las 23 familias OKLCH que
 * Tailwind v4 publica en su `theme.css`, se normalizó cada una a su
 * propio rango y se ajustaron las curvas por mínimos cuadrados sobre esa
 * media. Los números están en los comentarios de cada curva, y las
 * comprobaciones de `scripts/comprobar-rampas.ts` los clavan: si alguien
 * mueve una constante, suena una alarma con el valor delante.
 *
 * ---------------------------------------------------------------------
 * Las tres decisiones que sostienen todo
 *
 *   · **La escalera de luminosidad es común a todas las tonalidades.** Es
 *     lo único que hace útil una paleta de sistema: que el 500 azul y el
 *     500 rojo pesen lo mismo. Se paga con los amarillos, que en sRGB no
 *     pueden ser oscuros y vivos a la vez.
 *
 *   · **La semilla se ancla, y se ancla EXACTA.** El color que pega
 *     alguien vuelve carácter a carácter en su paso. No pasa por la
 *     curva, ni por el recorte, ni por el redondeo.
 *
 *   · **Se avisa, no se arregla.** Cuando el gamut recorta un paso, o
 *     cuando dos anclajes distintos deforman la escalera, se marca y se
 *     enseña. Corregirlo por detrás —apagar la paleta entera para que
 *     case un paso— sería mentir sobre lo que se puede pintar.
 */
import { clampChroma, converter, formatHex, parse } from 'culori';

import { aHexEnGama, medirApca, medirWcag, type ResultadoApca, type ResultadoWcag, type Texto } from './contrast.ts';

const aOklch = converter('oklch');

// ============================================================ los mandos

export interface Ajustes {
  /**
   * Cuántos pasos tiene cada rampa.
   *
   * Solo impares. Con un número par no hay paso central, y sin paso
   * central no hay «500»: la rampa se queda sin el nombre que todo el
   * mundo escribe primero.
   */
  pasos: number;
  /** La luminosidad del paso más claro, de 0 a 1. */
  claridadMax: number;
  /** La del más oscuro. */
  claridadMin: number;
  /**
   * Cuánto se abulta el croma en el centro de la rampa.
   *
   * Es el EXPONENTE de la joroba, no un multiplicador. Con un factor
   * —`C = Cs · (1 + k(r−1))`— el croma se vuelve negativo en cuanto k
   * pasa de 1 y r es pequeño. Con el exponente: 0 deja el croma plano de
   * punta a punta (que es lo que se quiere para una paleta apagada), 1 es
   * la joroba completa, 2 la exagera, y nunca sale de cero.
   */
  cromaCentro: number;
  /**
   * Cuántos grados gira el tono entre el extremo claro y el oscuro.
   *
   * Positivo: el extremo oscuro gira hacia ángulos mayores. En un azul de
   * 260° eso deja el claro tirando a cian y el oscuro a violeta, que es
   * lo que hace la vista con la luz.
   */
  derivaTono: number;
}

export const AJUSTES_INICIALES: Ajustes = {
  pasos: 11,
  claridadMax: 0.97,
  claridadMin: 0.18,
  cromaCentro: 1,
  /*
   * Ocho grados, y no cero.
   *
   * Medido sobre Tailwind (h del paso 950 menos la del 50, dejando fuera
   * naranja, ámbar y amarillo, cuyo giro es un artefacto del gamut y no
   * una decisión): rojo +8,7 · lima +11,4 · esmeralda +6,4 · turquesa
   * +11,8 · cielo +6,5 · azul +13,3 · índigo +9,0 · rosa +20,7. La
   * mediana es +7,6, y ocho es esa mediana redondeada.
   *
   * Se puede aplicar de fábrica sin faltar al respeto al color de nadie
   * porque la deriva vale CERO en el paso anclado: la semilla conserva su
   * tono exacto y solo giran los demás.
   */
  derivaTono: 8,
};

export const LIMITES = {
  pasos: { min: 3, max: 15 },
  claridadMax: { min: 0.8, max: 1 },
  claridadMin: { min: 0, max: 0.4 },
  cromaCentro: { min: 0, max: 2 },
  derivaTono: { min: -40, max: 40 },
} as const;

// ========================================================= una tonalidad

export interface Tonalidad {
  /** Identificador estable: no cambia al renombrar ni al recolorear. */
  id: string;
  /** Lo que va delante de cada variable: «azul» produce --azul-500. */
  nombre: string;
  /** El color que se pegó, en hexadecimal. */
  semilla: string;
  /**
   * El paso al que se fuerza el anclaje, o null para el más cercano.
   *
   * Existe por los amarillos. Un amarillo vivo cae por su luminosidad en
   * el paso 200 —no existe un amarillo oscuro y saturado en sRGB— y casi
   * nadie quiere que el color de su marca se llame «200».
   */
  anclaForzada: number | null;
  /**
   * Los pasos retocados a mano, indexados por su NOMBRE y no por su
   * índice.
   *
   * Por el nombre porque el índice no significa lo mismo con once pasos
   * que con siete: el índice 1 es el «100» en una rampa y el «200» en la
   * otra, y el retoque saltaría de sitio él solo al mover el número de
   * pasos. Con el nombre, bajar a siete deja dormido el retoque del
   * «100» y subir otra vez lo devuelve intacto.
   */
  retoques: Record<string, string>;
}

// =============================================================== un paso

export interface Paso {
  /** 0 es el más claro. */
  indice: number;
  /** El nombre que le ha tocado: «50», «500», «950»… */
  nombre: string;
  /** La variable CSS entera: --azul-500. */
  variable: string;
  l: number;
  c: number;
  /** Indefinido si el paso es acromático: en OKLCH un gris no tiene tono. */
  h: number | undefined;
  hex: string;
  /** Cierto en el paso donde vive la semilla, tal cual se pegó. */
  ancla: boolean;
  /** Sobrescrito a mano: su color es el del retoque, no el de la curva. */
  tocado: boolean;
  /**
   * Lo que la curva habría dado.
   *
   * Se guarda siempre, esté tocado o no. Es lo que permite devolver un
   * paso a lo calculado sin rehacer la rampa entera, y lo que deja
   * enseñar «vuelve a #2867d3» ANTES de pulsar el botón.
   */
  calculado: { l: number; c: number; h: number | undefined; hex: string };
  /** El croma que pedía la curva antes de tropezar con el gamut. */
  cromaTeorico: number;
  /** El croma máximo que aguanta sRGB a esta luminosidad y este tono. */
  cromaTecho: number;
  /** El recorte se comió croma perceptible: este paso está contra la pared. */
  recortado: boolean;
}

export interface Rampa {
  tonalidad: Tonalidad;
  pasos: Paso[];
  /** El índice del paso anclado. */
  ancla: number;
  /** La posición real de la semilla en la escalera, de 0 a 1. */
  posicionSemilla: number;
  /** La semilla es un gris: sin croma y sin tono. */
  acromatica: boolean;
  /**
   * El anclaje tuvo que deformar la escalera entera y no solo su entorno.
   *
   * Pasa al forzar el ancla lejos de donde cae la semilla, y es lo que
   * rompe la coherencia con las demás tonalidades. Por eso se marca.
   */
  escaleraDeformada: boolean;
}

export interface Paleta {
  ajustes: Ajustes;
  rampas: Rampa[];
}

// =========================================== la escalera de luminosidad

/**
 * La curva de luminosidad, normalizada: 0 en el paso claro, 1 en el
 * oscuro.
 *
 * Es la acumulada de una Kumaraswamy, `1 − (1 − t^a)^b`, y se eligió por
 * tres motivos en este orden:
 *
 *   1. **Tiene inversa cerrada**, y hace falta para anclar. Sin ella,
 *      saber en qué punto de la escalera cae una semilla exige una
 *      bisección, y el anclaje pasa de ser exacto por construcción a
 *      serlo por tolerancia.
 *   2. Con a > 1 la derivada es cero en el extremo claro y con b > 1
 *      también en el oscuro: los pasos se aprietan en los dos extremos y
 *      se abren en el centro, que es la forma que se mide en Tailwind.
 *   3. Dos constantes, no cuatro.
 *
 * El ajuste por mínimos cuadrados sobre la media de las 23 familias:
 *
 *     lineal                        RMS 0,0790
 *     potencia t^1,235              RMS 0,0275
 *     gamma + smoothstep            RMS 0,0215
 *     Kumaraswamy a=1,44 b=1,20     RMS 0,0218   ← esta
 *
 * La mezcla gamma+smoothstep empata y pierde por no tener inversa.
 */
const CURVA_A = 1.45;
const CURVA_B = 1.2;

export function curvaClaridad(t: number): number {
  return 1 - Math.pow(1 - Math.pow(t, CURVA_A), CURVA_B);
}

export function curvaClaridadInversa(u: number): number {
  return Math.pow(1 - Math.pow(1 - u, 1 / CURVA_B), 1 / CURVA_A);
}

/**
 * Las luminosidades de los pasos, sin anclar nada.
 *
 * Con once pasos y el rango de fábrica sale 97,0 · 93,6 · 87,9 · 80,8 ·
 * 72,6 · 63,7 · 54,3 · 44,6 · 34,9 · 25,6 · 18,0. Los tres primeros
 * saltos suman 16,2 puntos y los tres últimos 26,6: el ojo distingue más
 * en las claras y ahí es donde se ponen más pasos. El 50, el 100 y el 200
 * son fondos de interfaz que tienen que distinguirse entre sí a un metro
 * de la pantalla; el 800 y el 900 casi siempre son «texto oscuro» y da
 * igual cuánto disten.
 *
 * Propiedad que sale gratis: `curvaClaridad(0,5)` no depende del número
 * de pasos, así que el 500 vale lo mismo con 11, 9, 7 y 5. Los tres
 * puntos fijos de la escalera no se mueven al cambiar la resolución.
 */
export function escaleraNominal(ajustes: Ajustes): number[] {
  const n = ajustes.pasos;
  if (n < 2) return [ajustes.claridadMax];

  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return ajustes.claridadMax + (ajustes.claridadMin - ajustes.claridadMax) * curvaClaridad(t);
  });
}

// ================================================================ gamut

/**
 * El croma máximo que aguanta sRGB a esa luminosidad y ese tono.
 *
 * Se apoya en la bisección de culori en vez de escribir otra: pedirle que
 * recorte un croma imposible devuelve justo el techo. Ochenta y ocho
 * llamadas —ocho tonalidades por once pasos— cuestan dos milisegundos, y
 * no hay nada que optimizar.
 *
 * El techo depende muchísimo de las dos cosas. Medido:
 *
 *     L      rojo 25°   amarillo 95°   verde 150°   azul 264°
 *     0,90     0,052        0,159         0,182       0,048
 *     0,60     0,243        0,123         0,165       0,217
 *     0,50     0,203        0,103         0,138       0,281
 *     0,18     0,073        0,037         0,050       0,104
 *
 * La cúspide del amarillo está arriba y la del azul en la zona media.
 * No hay una curva teórica que sirva para los dos: el recorte no es un
 * fallo del diseño, es el diseño.
 */
export function cromaMaximo(l: number, h: number): number {
  const recortado = clampChroma({ mode: 'oklch', l, c: 0.5, h }, 'oklch') as { c?: number };
  return recortado.c ?? 0;
}

/** Margen contra el techo. Deja sitio al redondeo del CSS. */
const MARGEN_GAMUT = 0.98;

/**
 * Rodilla: se acerca al techo suavemente en vez de chocar con él.
 *
 * Un `min()` seco deja una esquina en la derivada del croma, y una
 * esquina en la derivada es exactamente lo que se ve como «este paso está
 * apagado respecto a sus vecinos». La rodilla la reparte entre tres.
 *
 * Es continua en la derivada: vale 1 en u = 0,8 y 0 en u = 1,2.
 */
function rodilla(valor: number, techo: number): number {
  if (techo <= 0) return 0;
  const u = valor / techo;
  if (u <= 0.8) return valor;
  if (u >= 1.2) return techo;
  return techo * (1 - 0.2 * Math.pow((1.2 - u) / 0.4, 2));
}

// ================================================== la curva de croma

/**
 * La joroba del croma: gaussiana ASIMÉTRICA.
 *
 * Ajustada al croma normalizado de las 17 familias cromáticas de
 * Tailwind. La simétrica da RMS 0,0483 y esta 0,0286 — un setenta por
 * ciento mejor. La asimetría es real y tiene sentido físico: hacia el
 * negro el croma se conserva bastante (0,38 en el paso 950) y hacia el
 * blanco se derrumba (0,08 en el 50).
 */
const SIGMA_CLARO = 0.31;
const SIGMA_OSCURO = 0.49;

function joroba(t: number): number {
  const sigma = t < 0.5 ? SIGMA_CLARO : SIGMA_OSCURO;
  return Math.exp(-Math.pow((t - 0.5) / sigma, 2));
}

/**
 * Tope de cuánto puede inflarse el croma respecto al de la semilla.
 *
 * La joroba se divide por su valor en el paso anclado para pasar por el
 * croma de la semilla exactamente ahí. Eso infla el resto por `1/g(ts)`,
 * y cuando la semilla está lejos del centro el factor se dispara: 2,2×
 * para un amarillo anclado en el 200 y **13,5× para un casi-blanco
 * anclado en el 50**.
 *
 * Sin este tope, una semilla casi gris como `#f5f5f4` produce un 500
 * `#8c8c80` —un oliva descarado— a partir de un color que nadie
 * llamaría verde. Con el tope sale `#8b8b8a`.
 *
 * Es el caso que no se prueba a mano porque nadie piensa en pegar un
 * casi-blanco en una herramienta de paletas.
 */
const TOPE_INFLACION = 2;

/** Por debajo de esto, una semilla es un gris y no un color. */
const UMBRAL_ACROMATICO = 0.002;

// ============================================== el reparto de nombres

/** Los once de Tailwind, que es lo que casi todo el mundo reconoce. */
export const NOMBRES_TAILWIND = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/**
 * Los nombres para cada número de pasos.
 *
 * La regla: cada nombre tiene una posición nominal `(v − 50)/900`, con su
 * número real y no con su índice, y al paso `i` de `n` le toca el nombre
 * libre cuya posición queda más cerca de `i/(n−1)`.
 *
 * Está precalculada a mano y no generada, por lo mismo que `ESQUEMAS` en
 * `scale.ts`: una tabla de siete filas se revisa de un vistazo y un
 * algoritmo goloso no. La regla queda aquí escrita como justificación.
 *
 * Solo impares. Con `n` par no hay paso central y por tanto no hay «500»:
 * con ocho pasos el reparto daría 50, 200, 300, 400, 600, 700, 800, 950,
 * y una rampa sin 500 es una rampa que no se puede nombrar.
 *
 * El 50, el 500 y el 950 no se van nunca, y el índice central se llama
 * «500» en las cuatro resoluciones.
 */
export const NOMBRES_POR_PASOS: Record<number, string[]> = {
  3: ['50', '500', '950'],
  5: ['50', '300', '500', '700', '950'],
  7: ['50', '200', '300', '500', '700', '800', '950'],
  9: ['50', '200', '300', '400', '500', '600', '700', '800', '950'],
  11: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
  13: ['50', '100', '200', '300', '350', '400', '500', '600', '650', '700', '800', '900', '950'],
  15: [
    '50', '100', '150', '200', '300', '350', '400', '500',
    '600', '650', '700', '800', '850', '900', '950',
  ],
};

export function nombresPaso(pasos: number): string[] {
  const tabla = NOMBRES_POR_PASOS[pasos];
  if (tabla) return tabla;
  // Un número impar que no esté en la tabla —no debería llegar, porque la
  // interfaz solo ofrece los que están— se numera y ya.
  return Array.from({ length: pasos }, (_, i) => String((i + 1) * 100));
}

/** Solo lo que puede ser un nombre de variable CSS. */
export function limpiarNombre(bruto: string): string {
  return bruto.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
}

/** El nombre completo de la variable de un paso. */
export function nombreDePaso(tonalidad: Tonalidad, nombre: string): string {
  return `--${limpiarNombre(tonalidad.nombre) || 'color'}-${nombre}`;
}

// ================================================== construir la rampa

/** El alcance de la deformación del anclaje, en pasos a cada lado. */
const ALCANCE_WARP = 2;

/**
 * Construye la rampa de una tonalidad.
 *
 * ---------------------------------------------------------------------
 * El anclaje, que es la parte delicada
 *
 * La semilla cae en un punto continuo de la escalera; el paso más cercano
 * se queda con ella. Para que el paso valga EXACTAMENTE la semilla hay
 * que deformar la escalera, y cómo se deforme decide si las tonalidades
 * siguen siendo coherentes entre sí.
 *
 * Se usa una joroba triangular de alcance dos pasos centrada en el ancla:
 *
 *     w(t) = t + δ · B(t)      B = triángulo de alcance r, cero fuera
 *
 * Tres propiedades, y las tres importan:
 *
 *   · `w(ta) = ts` — la semilla cae exacta.
 *   · `w(0) = 0` y `w(1) = 1` — los extremos siguen siendo los que pidió
 *     el mando de rango. Quien puso 97→18 sigue teniendo 97→18.
 *   · **A dos pasos o más del ancla, `w(t) = t`.** Esta es la respuesta a
 *     «¿y si dos tonalidades anclan en pasos distintos?»: los pasos
 *     lejanos tienen la MISMA luminosidad en las dos rampas, bit a bit.
 *     Un reescalado global habría contaminado la rampa entera.
 *
 * Como el ancla es siempre el paso más cercano, |δ| ≤ 0,5/(n−1), así que
 * la derivada de w queda entre 0,75 y 1,25: la escalera nunca se invierte.
 */
export function construirRampa(tonalidad: Tonalidad, ajustes: Ajustes): Rampa {
  const n = Math.max(2, Math.round(ajustes.pasos));
  const nombres = nombresPaso(n);

  const semilla = aOklch(parse(tonalidad.semilla) ?? undefined);
  const sl = semilla?.l ?? 0.5;
  const sc = semilla?.c ?? 0;
  const sh = semilla?.h;

  const acromatica = sc < UMBRAL_ACROMATICO;

  // ---------- dónde cae la semilla y a qué paso se ancla ----------
  let claro = ajustes.claridadMax;
  let oscuro = ajustes.claridadMin;

  const rango = claro - oscuro;
  const u = rango === 0 ? 0 : (claro - sl) / rango;

  let ts: number;
  if (u <= 0) {
    // Más clara que el extremo: la semilla ES el paso más claro, y el
    // extremo se desplaza hasta ella. Inventar un paso por encima sería
    // inventarse un color que nadie pidió.
    ts = 0;
    claro = sl;
  } else if (u >= 1) {
    ts = 1;
    oscuro = sl;
  } else {
    ts = curvaClaridadInversa(u);
  }

  let ancla = Math.round(ts * (n - 1));
  if (tonalidad.anclaForzada !== null) {
    ancla = Math.min(n - 1, Math.max(0, Math.round(tonalidad.anclaForzada)));
  }
  if (ancla === 0) {
    claro = sl;
    ts = 0;
  } else if (ancla === n - 1) {
    oscuro = sl;
    ts = 1;
  }

  // ---------- la deformación ----------
  const ta = ancla / (n - 1);
  const delta = ts - ta;
  const alcance = ALCANCE_WARP / (n - 1);
  const izq = Math.min(alcance, ta);
  const der = Math.min(alcance, 1 - ta);

  // Si el desplazamiento no cabe en la joroba —pasa al forzar el ancla
  // lejos de donde cae la semilla— hay que deformar la escalera entera, y
  // eso rompe la coherencia con las demás. Se marca.
  const deformada = Math.abs(delta) >= Math.min(izq || Infinity, der || Infinity);

  const warp = (t: number): number => {
    if (delta === 0) return t;

    if (deformada) {
      // Lineal a trozos: conserva los extremos y pasa por la semilla.
      if (ta <= 0) return ts + (1 - ts) * (t / 1);
      if (ta >= 1) return ts * (t / 1);
      return t <= ta ? (t / ta) * ts : ts + ((t - ta) / (1 - ta)) * (1 - ts);
    }

    const b =
      t < ta
        ? izq > 0
          ? Math.max(0, 1 - (ta - t) / izq)
          : 0
        : der > 0
          ? Math.max(0, 1 - (t - ta) / der)
          : 0;
    return t + delta * b;
  };

  // ---------- cada paso ----------
  const gAncla = joroba(ts);

  const pasos: Paso[] = Array.from({ length: n }, (_, i) => {
    const nombre = nombres[i] ?? String(i);
    const variable = nombreDePaso(tonalidad, nombre);

    const t = warp(i / (n - 1));
    const l = claro + (oscuro - claro) * curvaClaridad(t);

    // El tono gira alrededor del ancla, así que la semilla lo conserva.
    const h = acromatica || sh === undefined ? undefined : (((sh + ajustes.derivaTono * (t - ts)) % 360) + 360) % 360;

    // La joroba se normaliza por su valor en el ancla para pasar por el
    // croma de la semilla exactamente ahí, con tope de inflación.
    const factor = gAncla > 0 ? Math.min(TOPE_INFLACION, Math.pow(joroba(t) / gAncla, ajustes.cromaCentro)) : 1;
    const cromaTeorico = acromatica ? 0 : sc * factor;

    const cromaTecho = acromatica || h === undefined ? 0 : MARGEN_GAMUT * cromaMaximo(l, h);
    const c = acromatica ? 0 : rodilla(cromaTeorico, cromaTecho);

    const hex = acromatica
      ? aHexEnGama({ mode: 'oklch', l, c: 0, h: undefined })
      : aHexEnGama({ mode: 'oklch', l, c, h });

    const calculado = { l, c, h, hex };
    const esAncla = i === ancla;

    // El ancla se copia VERBATIM: ni curva, ni recorte, ni redondeo.
    const base = esAncla
      ? { l: sl, c: sc, h: acromatica ? undefined : sh, hex: normalizarHex(tonalidad.semilla) }
      : calculado;

    const retoque = tonalidad.retoques[nombre];
    const tocado = typeof retoque === 'string' && retoque.length > 0;
    const final = tocado ? desdeHex(retoque) : base;

    return {
      indice: i,
      nombre,
      variable,
      l: final.l,
      c: final.c,
      h: final.h,
      hex: final.hex,
      ancla: esAncla,
      tocado,
      calculado,
      cromaTeorico,
      cromaTecho,
      // El ancla y los retoques no se recortan: son colores dados, no
      // calculados, y decir que se les recortó algo sería mentira.
      recortado: !esAncla && !tocado && cromaTeorico - c >= 0.004,
    };
  });

  return {
    tonalidad,
    pasos,
    ancla,
    posicionSemilla: ts,
    acromatica,
    escaleraDeformada: deformada,
  };
}

/** Todas las rampas de la paleta, con los mismos mandos. */
export function construirPaleta(tonalidades: Tonalidad[], ajustes: Ajustes): Paleta {
  return { ajustes, rampas: tonalidades.map((t) => construirRampa(t, ajustes)) };
}

/** Un hexadecimal de seis dígitos en minúsculas, o negro si no se entiende. */
function normalizarHex(bruto: string): string {
  const color = parse(bruto);
  return color ? (formatHex(color) ?? '#000000') : '#000000';
}

function desdeHex(bruto: string): { l: number; c: number; h: number | undefined; hex: string } {
  const hex = normalizarHex(bruto);
  const o = aOklch(parse(hex) ?? undefined);
  return { l: o?.l ?? 0, c: o?.c ?? 0, h: o?.h, hex };
}

// ============================================================ retoques

export function aplicarRetoque(tonalidad: Tonalidad, nombre: string, hex: string): Tonalidad {
  return { ...tonalidad, retoques: { ...tonalidad.retoques, [nombre]: normalizarHex(hex) } };
}

export function soltarRetoque(tonalidad: Tonalidad, nombre: string): Tonalidad {
  const retoques = { ...tonalidad.retoques };
  delete retoques[nombre];
  return { ...tonalidad, retoques };
}

export function soltarTodos(tonalidad: Tonalidad): Tonalidad {
  return { ...tonalidad, retoques: {} };
}

/**
 * Los retoques que ahora mismo no se aplican a ningún paso.
 *
 * Pasa al bajar el número de pasos: el retoque del «100» se queda dormido
 * porque con siete pasos no hay «100». No se borra —al subir otra vez
 * vuelve intacto— pero hay que poder decirlo, o alguien acabará con dos
 * retoques puestos recordando haber hecho uno.
 */
export function retoquesDormidos(tonalidad: Tonalidad, ajustes: Ajustes): string[] {
  const vivos = new Set(nombresPaso(Math.max(2, Math.round(ajustes.pasos))));
  return Object.keys(tonalidad.retoques).filter((n) => !vivos.has(n));
}

// ======================================================= accesibilidad

export interface AccesibilidadDePaso {
  /** Texto blanco sobre este paso. */
  conBlanco: { wcag: ResultadoWcag; apca: ResultadoApca };
  /** Texto negro sobre este paso. */
  conNegro: { wcag: ResultadoWcag; apca: ResultadoApca };
}

/**
 * Los dos veredictos de un paso, con blanco y con negro encima.
 *
 * **El paso es el FONDO y la tinta es el texto**, en ese orden. Para WCAG
 * daría igual —la razón es simétrica— pero para APCA no: el signo y el
 * umbral cambian con la polaridad, y llamar a `medirApca` al revés
 * devuelve un número que parece razonable y está mal. La pregunta que se
 * le hace a una muestra de color es «¿qué etiqueta le puedo poner
 * encima?», nunca al revés.
 */
export function medirPaso(hex: string, texto: Texto): AccesibilidadDePaso {
  return {
    conBlanco: { wcag: medirWcag('#ffffff', hex, texto), apca: medirApca('#ffffff', hex, texto) },
    conNegro: { wcag: medirWcag('#000000', hex, texto), apca: medirApca('#000000', hex, texto) },
  };
}

/** ¿Este paso aguanta texto encima, con alguna de las dos tintas? */
export function aguantaTexto(hex: string, texto: Texto): boolean {
  const m = medirPaso(hex, texto);
  return m.conBlanco.wcag.pasaAA || m.conNegro.wcag.pasaAA;
}

/**
 * El primer paso (el más claro) sobre el que el texto BLANCO pasa AA.
 *
 * Es la frontera de polaridad de la rampa: por encima se escribe en
 * negro, de ahí para abajo en blanco. Saberlo de un número evita tener
 * que mirar once veredictos.
 */
export function limiteDePolaridad(pasos: Paso[], texto: Texto): number | null {
  const i = pasos.findIndex((p) => medirWcag('#ffffff', p.hex, texto).pasaAA);
  return i === -1 ? null : i;
}

// ============================================================== avisos

/**
 * Cuánto se aparta la luminosidad de cada índice de la nominal.
 *
 * Es el precio del anclaje, medido y enseñado en vez de escondido: dice
 * «tu 500 azul pesa 63,7 y tu 500 rojo 61,3». Misma política que
 * `buscarCruces` en `scale.ts` — avisar, no arreglar por detrás.
 */
export function desviacionDeEscalera(paleta: Paleta): number[] {
  const nominal = escaleraNominal(paleta.ajustes);
  return nominal.map((l, i) =>
    paleta.rampas.reduce((peor, r) => Math.max(peor, Math.abs((r.pasos[i]?.calculado.l ?? l) - l)), 0)
  );
}

/**
 * Los pasos cuyo croma es un mínimo local que la curva no explica.
 *
 * En 600 rampas medidas —120 tonos por cinco derivas— no aparece
 * ninguno: el techo de sRGB es monótono en L por debajo de la cúspide y
 * la deriva es demasiado pequeña para cruzar una arista. Se deja como
 * alarma y no como corrección, para que suene si alguien toca las
 * constantes de la joroba o el margen del gamut.
 */
export function buscarVallesDeCroma(pasos: Paso[]): number[] {
  const valles: number[] = [];
  for (let i = 1; i < pasos.length - 1; i++) {
    const a = pasos[i - 1].calculado.c;
    const b = pasos[i].calculado.c;
    const c = pasos[i + 1].calculado.c;
    if (b < a - 0.004 && b < c - 0.004) valles.push(i);
  }
  return valles;
}

/**
 * Cuántos puntos de luminosidad hacen falta entre dos pasos vecinos para
 * que se distingan.
 *
 * Dos puntos de OKLCH es el salto más pequeño que se ve con seguridad en
 * dos superficies grandes puestas una al lado de la otra. Por debajo de
 * eso, dos pasos son el mismo color con dos nombres.
 */
export const SALTO_MINIMO = 0.02;

/**
 * Los pasos que quedan pegados a su vecino de arriba.
 *
 * Existe porque nada impide pedir quince pasos entre el 90 % y el 70 %:
 * la rampa sale, es correcta, y es inservible — quince variables para
 * quince colores que nadie distingue. La herramienta no lo corrige (bajar
 * pasos o abrir el rango es una decisión de quien la usa) pero tiene que
 * decirlo.
 */
export function pasosIndistinguibles(pasos: Paso[]): number[] {
  const juntos: number[] = [];
  for (let i = 1; i < pasos.length; i++) {
    if (pasos[i - 1].l - pasos[i].l < SALTO_MINIMO) juntos.push(i);
  }
  return juntos;
}

/** Nombres de variable repetidos: el segundo pisaría al primero sin avisar. */
export function buscarNombresRepetidos(paleta: Paleta): string[] {
  const vistos = new Set<string>();
  const repes = new Set<string>();
  for (const rampa of paleta.rampas) {
    const nombre = limpiarNombre(rampa.tonalidad.nombre) || 'color';
    if (vistos.has(nombre)) repes.add(nombre);
    vistos.add(nombre);
  }
  return [...repes];
}

// ============================================================== salida

/**
 * Un paso como `oklch(63.7% 0.188 259.8)`, garantizado dentro de sRGB.
 *
 * El redondeo saca colores del gamut, y no es raro: medido, 882 de 50 000
 * colores que estaban pegados al techo se salen al aplicar `toFixed` a
 * secas. El navegador los recorta entonces a su manera, que no es la
 * nuestra, y el hexadecimal que enseña la herramienta deja de ser el
 * color que sale en pantalla.
 *
 * Por eso se redondean primero la luminosidad y el tono, se recalcula el
 * techo CON esos valores ya redondeados, y el croma se trunca hacia
 * abajo. Medido: 1 de 50 000 fuera de gamut sin el respaldo final, 0 con
 * él, y la pérdida máxima de croma es de una milésima. La versión
 * ingenua —bajar el croma hasta que entre, sin recalcular el techo—
 * necesitaba hasta treinta y un decrementos, que ya son bien visibles.
 */
export function aOklchCss(paso: Paso): string {
  const l = Math.round(paso.l * 1000) / 10;
  if (paso.h === undefined || paso.c <= 0) return `oklch(${l}% 0 none)`;

  const h = Math.round(paso.h * 10) / 10;
  const techo = cromaMaximo(l / 100, h);
  let c = Math.floor(Math.min(paso.c, techo) * 1000) / 1000;

  const dentro = (valor: number) =>
    clampChroma({ mode: 'oklch', l: l / 100, c: valor, h }, 'oklch').c === valor;
  if (!dentro(c) && c > 0) c = Math.max(0, c - 0.001);

  return `oklch(${l}% ${c.toFixed(3)} ${h})`;
}

/**
 * El bloque `:root` listo para pegar.
 *
 * Sale de los valores OKLCH y **nunca del hexadecimal**: el hex es de
 * ocho bits y en un 0,75 % de los casos la ida y vuelta mueve la
 * luminosidad más de 0,006. El hexadecimal es para copiar suelto y para
 * pintar la muestra; la variable CSS es la fuente de verdad.
 */
export function aCss(paleta: Paleta, formato: 'oklch' | 'hex' = 'oklch'): string {
  const lineas: string[] = [];
  const todas = paleta.rampas.flatMap((r) => r.pasos);
  if (!todas.length) return ':root {\n}';

  const ancho = Math.max(...todas.map((p) => p.variable.length + 1));

  for (const rampa of paleta.rampas) {
    if (lineas.length) lineas.push('');
    for (const paso of rampa.pasos) {
      const valor = formato === 'hex' ? paso.hex : aOklchCss(paso);
      lineas.push(`  ${(paso.variable + ':').padEnd(ancho + 1)} ${valor};`);
    }
  }

  return `:root {\n${lineas.join('\n')}\n}`;
}
