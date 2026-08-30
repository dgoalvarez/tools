/**
 * Los colores del encabezado de una herramienta, medidos.
 *
 * El rótulo de materia que va encima del título se pinta con el acento de
 * esa materia, y es texto pequeño: WCAG le exige 4,5:1 sobre el fondo. Ya
 * pasó una vez que un acento sobre un halo dejó una etiqueta en 1,45:1, y
 * la forma de que no vuelva a pasar no es mirarlo, es medirlo.
 *
 * Se mide con la propia herramienta de contraste del sitio, en los dos
 * temas y contra los dos fondos sobre los que puede caer.
 */
import { medirWcag, leerColor } from '../src/lib/contrast.ts';

let fallos = 0;

function afirmar(condicion: boolean, mensaje: string) {
  console.log((condicion ? '  ok    ' : '  FALLO ') + mensaje);
  if (!condicion) fallos++;
}

/** Copiados de src/styles/global.css. Si cambian allí, cambian aquí. */
const CLARO = {
  bg: '#f3f6f7',
  surface: '#ffffff',
  line: '#dadfe0',
  inkMuted: '#494f51',
  acentos: { tiempo: '#946000', color: '#884fc4', tipografia: '#007872' },
};

const OSCURO = {
  bg: '#10191b',
  surface: '#182123',
  line: '#262c2d',
  inkMuted: '#b3b9b9',
  acentos: { tiempo: '#e8a33d', color: '#b47cf5', tipografia: '#31c5bc' },
};

/** El rótulo va a 11,2 px y peso 500: texto normal, así que AA son 4,5:1. */
const ROTULO = { px: 11.2, peso: 500 };

console.log('\nEl rótulo de materia sobre el fondo de la página');
for (const [tema, p] of [
  ['claro ', CLARO],
  ['oscuro', OSCURO],
] as const) {
  for (const [materia, acento] of Object.entries(p.acentos)) {
    for (const [dondeNombre, donde] of [
      ['fondo   ', p.bg],
      ['tarjeta ', p.surface],
    ] as const) {
      const m = medirWcag(acento, donde, ROTULO);
      afirmar(
        m.pasaAA,
        `${tema} · ${materia.padEnd(11)} sobre ${dondeNombre} ${m.razon.toFixed(2)}:1`
      );
    }
  }
}

console.log('\nEl resumen bajo el título');
for (const [tema, p] of [
  ['claro ', CLARO],
  ['oscuro', OSCURO],
] as const) {
  const m = medirWcag(p.inkMuted, p.bg, { px: 17, peso: 400 });
  afirmar(m.pasaAA, `${tema} · resumen sobre el fondo  ${m.razon.toFixed(2)}:1`);
}

console.log('\nLa línea que cierra el encabezado');
for (const [tema, p] of [
  ['claro ', CLARO],
  ['oscuro', OSCURO],
] as const) {
  /*
    Una raya decorativa no tiene umbral que cumplir: el 1.4.11 de WCAG
    habla de controles y de gráficos que significan algo, y esta no es
    ninguna de las dos cosas — separa, no informa. Se mide igual, pero
    para comprobar que sigue siendo una hairline y no se ha convertido
    en un borde: es exactamente la misma línea que llevan todas las
    tarjetas del sitio, así que si algún día se ve fuerte aquí, es que
    se ve fuerte en todas partes y el problema está en la paleta.
  */
  const m = medirWcag(p.line, p.bg, { px: 16, peso: 400 });
  afirmar(
    m.razon >= 1.15 && m.razon <= 1.6,
    `${tema} · la raya sigue siendo una hairline  ${m.razon.toFixed(2)}:1`
  );
}

console.log('\nTodos los colores son colores');
for (const p of [CLARO, OSCURO]) {
  for (const hex of [p.bg, p.surface, p.line, p.inkMuted, ...Object.values(p.acentos)]) {
    afirmar(leerColor(hex) !== null, `${hex} se lee`);
  }
}

console.log(fallos === 0 ? '\nTODO CORRECTO\n' : `\n${fallos} FALLOS\n`);
process.exit(fallos === 0 ? 0 : 1);
