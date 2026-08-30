/**
 * La aritmética de una escala tipográfica fluida.
 *
 * Una escala fluida es, por cada paso, un `clamp()` con tres partes: un
 * mínimo, un máximo, y una recta que va del uno al otro conforme crece la
 * ventana. Lo que casi ninguna herramienta enseña —y es donde se rompen las
 * escalas— es a cuántos píxeles queda cada paso en las anchuras reales en
 * las que se mira una página.
 *
 * Todo se calcula sobre una raíz de 16 px, que es el valor por defecto de
 * todos los navegadores. Si alguien lo cambia, cambian los rem, pero la
 * proporción entre pasos se mantiene.
 */

/** El tamaño de la raíz que asume el cálculo, en píxeles. */
export const RAIZ_PX = 16;

/** Las anchuras de la tabla: teléfono, tableta, portátil y monitor. */
export const ANCHOS_TABLA = [390, 768, 1360, 1920] as const;

export interface Ajustes {
  /** Tamaño del paso 0 en la ventana más estrecha, en px. */
  baseMin: number;
  /** Tamaño del paso 0 en la ventana más ancha, en px. */
  baseMax: number;
  /** La proporción entre pasos en la ventana estrecha. */
  razonMin: number;
  /** La proporción entre pasos en la ventana ancha. */
  razonMax: number;
  /** Cuántos pasos por encima del 0. */
  arriba: number;
  /** Cuántos pasos por debajo del 0. */
  abajo: number;
  anchoMin: number;
  anchoMax: number;
  /** El nombre de las variables: «step» produce --step-0, --step-1… */
  prefijo: string;
}

export interface Paso {
  /** 0 es el tamaño base; los negativos van por debajo. */
  indice: number;
  /** El nombre completo de la variable CSS. */
  nombre: string;
  minPx: number;
  maxPx: number;
  /** El valor CSS listo para pegar. */
  valor: string;
  /** Los píxeles a cada anchura de ANCHOS_TABLA, en el mismo orden. */
  enTabla: number[];
}

/** Redondea a un máximo de `decimales` y quita los ceros que sobran. */
function limpiar(n: number, decimales: number): string {
  return String(Number(n.toFixed(decimales)));
}

/**
 * El tamaño de un paso a una anchura de ventana concreta.
 *
 * Fuera del rango del clamp el valor está fijo; dentro, es la recta que une
 * los dos extremos. Es exactamente lo que hace el navegador.
 */
export function tamanoEn(paso: Pick<Paso, 'minPx' | 'maxPx'>, ancho: number, ajustes: Ajustes) {
  const { anchoMin, anchoMax } = ajustes;
  if (ancho <= anchoMin) return paso.minPx;
  if (ancho >= anchoMax) return paso.maxPx;

  const pendiente = (paso.maxPx - paso.minPx) / (anchoMax - anchoMin);
  return paso.minPx + pendiente * (ancho - anchoMin);
}

/**
 * Construye la escala entera.
 *
 * El valor CSS lleva siempre un término en `rem` además del `vw`. No es
 * decorativo: un `font-size` que fuera solo `vw` dejaría de responder al
 * zoom del navegador, y eso es un fallo de accesibilidad, no una elección
 * estética.
 */
export function construirEscala(ajustes: Ajustes): Paso[] {
  const { baseMin, baseMax, razonMin, razonMax, arriba, abajo, anchoMin, anchoMax, prefijo } =
    ajustes;

  const pasos: Paso[] = [];

  for (let i = -abajo; i <= arriba; i++) {
    const minPx = baseMin * Math.pow(razonMin, i);
    const maxPx = baseMax * Math.pow(razonMax, i);

    const minRem = minPx / RAIZ_PX;
    const maxRem = maxPx / RAIZ_PX;

    let valor: string;

    if (Math.abs(maxPx - minPx) < 0.001 || anchoMax === anchoMin) {
      // Sin crecimiento no hace falta clamp: un solo valor se lee mejor.
      valor = `${limpiar(minRem, 4)}rem`;
    } else {
      const pendiente = (maxPx - minPx) / (anchoMax - anchoMin);
      const vw = pendiente * 100;
      const corteRem = (minPx - pendiente * anchoMin) / RAIZ_PX;

      const preferido =
        corteRem < 0
          ? `${limpiar(vw, 4)}vw - ${limpiar(Math.abs(corteRem), 4)}rem`
          : `${limpiar(corteRem, 4)}rem + ${limpiar(vw, 4)}vw`;

      valor = `clamp(${limpiar(minRem, 4)}rem, ${preferido}, ${limpiar(maxRem, 4)}rem)`;
    }

    const paso: Paso = {
      indice: i,
      nombre: `--${prefijo}-${i}`,
      minPx,
      maxPx,
      valor,
      enTabla: [],
    };

    paso.enTabla = ANCHOS_TABLA.map((ancho) => tamanoEn(paso, ancho, ajustes));
    pasos.push(paso);
  }

  return pasos;
}

// ------------------------------------------------------------------ avisos

export interface Cruce {
  /** El paso que se queda por encima del que debería ser mayor. */
  menor: string;
  mayor: string;
  ancho: number;
}

/**
 * Dos pasos se cruzan cuando, a alguna anchura, el que debería ser más
 * pequeño se pone por delante del grande.
 *
 * Con proporciones mayores que uno y un base máximo mayor que el mínimo no
 * puede pasar. Pasa en cuanto alguien invierte algo sin darse cuenta —el
 * base máximo por debajo del mínimo, una proporción menor que uno— y
 * entonces la jerarquía se rompe a ciertas anchuras y no a otras, que es la
 * clase de fallo que nadie ve hasta que está publicado.
 */
export function buscarCruces(pasos: Paso[], ajustes: Ajustes): Cruce[] {
  const anchos = [
    ajustes.anchoMin,
    ...ANCHOS_TABLA,
    ajustes.anchoMax,
    Math.round((ajustes.anchoMin + ajustes.anchoMax) / 2),
  ];

  const cruces: Cruce[] = [];

  for (let i = 0; i < pasos.length - 1; i++) {
    const menor = pasos[i]!;
    const mayor = pasos[i + 1]!;

    for (const ancho of anchos) {
      if (tamanoEn(menor, ancho, ajustes) >= tamanoEn(mayor, ancho, ajustes) - 0.001) {
        cruces.push({ menor: menor.nombre, mayor: mayor.nombre, ancho });
        break;
      }
    }
  }

  return cruces;
}

/**
 * A qué anchura de ventana un paso ya ha alcanzado el porcentaje que se le
 * pida de su tamaño máximo.
 *
 * Es el número que explica el problema que llevó a construir esta
 * herramienta: en el portafolio de Diego los titulares llegaban al 96 % de
 * su máximo ya en 1360 px mientras el cuerpo seguía pegado a su mínimo. De
 * ahí la sensación de «grande y apretado» a la vez. Ninguna herramienta de
 * escalas enseña esto, y es justo donde se rompen.
 */
export function anchoParaFraccion(paso: Paso, fraccion: number, ajustes: Ajustes): number | null {
  if (paso.maxPx <= paso.minPx) return null;

  const objetivo = paso.maxPx * fraccion;
  if (objetivo <= paso.minPx) return ajustes.anchoMin;
  if (objetivo >= paso.maxPx) return ajustes.anchoMax;

  const pendiente = (paso.maxPx - paso.minPx) / (ajustes.anchoMax - ajustes.anchoMin);
  return Math.round(ajustes.anchoMin + (objetivo - paso.minPx) / pendiente);
}

// -------------------------------------------------------------------- CSS

/** El bloque listo para pegar en una hoja de estilos. */
export function aCss(pasos: Paso[]): string {
  const ancho = Math.max(...pasos.map((p) => p.nombre.length));
  const lineas = pasos.map((p) => `  ${(p.nombre + ':').padEnd(ancho + 1)} ${p.valor};`);
  return `:root {\n${lineas.join('\n')}\n}`;
}

/** Las proporciones con nombre, que es como las pide la gente. */
export const RAZONES = [
  { valor: 1.067, clave: 'segundaMenor' },
  { valor: 1.125, clave: 'segundaMayor' },
  { valor: 1.2, clave: 'terceraMenor' },
  { valor: 1.25, clave: 'terceraMayor' },
  { valor: 1.333, clave: 'cuarta' },
  { valor: 1.414, clave: 'aumentada' },
  { valor: 1.5, clave: 'quinta' },
  { valor: 1.618, clave: 'aurea' },
] as const;
