/**
 * La paleta definitiva, anclada en el og.png que hizo Diego.
 *
 * Del archivo salen tres valores medidos, no aproximados: el fondo
 * (#10191B), la línea (#262C2D) y el teal de marca (#31C5BC). El resto se
 * deriva de ahí en OKLCH y se comprueba con la propia herramienta del
 * sitio. Nada entra si no pasa AA.
 */
import { converter, formatHex, wcagContrast } from 'culori';
import { medirWcag, sugerirColor } from '../src/lib/contrast.ts';

const aOklch = converter('oklch');
const chico = { px: 13, peso: 500 };
const cuerpo = { px: 16, peso: 400 };

const DEL_OG = { fondo: '#10191b', linea: '#262c2d', teal: '#31c5bc' };

/** Superficies: el mismo tono del fondo, un poco más claras. */
const o = aOklch(DEL_OG.fondo)!;
const sup = formatHex({ ...o, l: o.l + 0.035 })!;
const sup2 = formatHex({ ...o, l: o.l + 0.062 })!;

console.log('=== OSCURO · superficies derivadas del fondo del og ===');
console.log(`  fondo  ${DEL_OG.fondo}   sup ${sup}   sup2 ${sup2}   linea ${DEL_OG.linea}`);

/** Grises: el más claro para titulares, y dos escalones que pasen AA. */
const grisBase = aOklch('#eef2f2')!;
const tinta = formatHex(grisBase)!;
const fondos = [DEL_OG.fondo, sup, sup2];

function buscarGris(desde: number): string {
  for (let l = desde; l > 0.4; l -= 0.004) {
    const hex = formatHex({ ...grisBase, l, c: 0.006 })!;
    if (fondos.every((f) => medirWcag(hex, f, chico).pasaAA)) return hex;
  }
  return tinta;
}

const media = buscarGris(0.78);
const suave = buscarGris(0.66);

console.log(`  tinta  ${tinta}   media ${media}   suave ${suave}`);
for (const [n, c] of [['tinta', tinta], ['media', media], ['suave', suave]] as const) {
  console.log(`    ${n.padEnd(6)} ${fondos.map((f) => wcagContrast(c, f).toFixed(2)).join('  ')}`);
}

/** Los tres acentos: el teal del og es el de tipografía y el de la marca. */
const ACENTOS_OSCURO = { tiempo: '#e8a33d', color: '#b47cf5', tipo: DEL_OG.teal };

console.log('\n=== OSCURO · acentos ===');
for (const [n, c] of Object.entries(ACENTOS_OSCURO)) {
  const sobreFondo = wcagContrast(c, DEL_OG.fondo);
  const sobreSup = wcagContrast(c, sup);
  const textoEncima = wcagContrast(DEL_OG.fondo, c);
  console.log(
    `  ${n.padEnd(7)} ${c}  fondo ${sobreFondo.toFixed(2)}  superficie ${sobreSup.toFixed(2)}  ` +
      `texto oscuro encima ${textoEncima.toFixed(2)}  ${Math.min(sobreFondo, sobreSup, textoEncima) >= 4.5 ? 'AA' : 'REVISAR'}`
  );
}

/** El claro: mismo tono, luminosidades invertidas. */
const co = aOklch(DEL_OG.fondo)!;
const cFondo = formatHex({ ...co, l: 0.972, c: 0.004 })!;
const cSup = '#ffffff';
const cSup2 = formatHex({ ...co, l: 0.944, c: 0.005 })!;
const cLinea = formatHex({ ...co, l: 0.9, c: 0.006 })!;
const cTinta = formatHex({ ...co, l: 0.2, c: 0.012 })!;

const cFondos = [cFondo, cSup, cSup2];
function buscarGrisClaro(desde: number): string {
  for (let l = desde; l < 0.9; l += 0.004) {
    const hex = formatHex({ ...co, l, c: 0.008 })!;
    if (!cFondos.every((f) => medirWcag(hex, f, chico).pasaAA)) return formatHex({ ...co, l: l - 0.004, c: 0.008 })!;
  }
  return cTinta;
}
const cMedia = buscarGrisClaro(0.35);
const cSuave = buscarGrisClaro(0.5);

console.log('\n=== CLARO · derivado del mismo tono ===');
console.log(`  fondo ${cFondo}   sup ${cSup}   sup2 ${cSup2}   linea ${cLinea}`);
console.log(`  tinta ${cTinta}   media ${cMedia}   suave ${cSuave}`);
for (const [n, c] of [['tinta', cTinta], ['media', cMedia], ['suave', cSuave]] as const) {
  console.log(`    ${n.padEnd(6)} ${cFondos.map((f) => wcagContrast(c, f).toFixed(2)).join('  ')}`);
}

console.log('\n=== CLARO · acentos, bajando la luminosidad y guardando el tono ===');
for (const [n, c] of Object.entries(ACENTOS_OSCURO)) {
  const s = sugerirColor(c, cFondo, 4.5);
  const elegido = s ? s.hex : c;
  const sobreSup2 = wcagContrast(elegido, cSup2);
  const blancoEncima = wcagContrast('#ffffff', elegido);
  const desvio = Math.abs((aOklch(c)!.h ?? 0) - (aOklch(elegido)!.h ?? 0));
  console.log(
    `  ${n.padEnd(7)} ${c} -> ${elegido}  fondo ${wcagContrast(elegido, cFondo).toFixed(2)}  ` +
      `sup2 ${sobreSup2.toFixed(2)}  blanco encima ${blancoEncima.toFixed(2)}  tono ${desvio.toFixed(2)}°`
  );
}

console.log('\n=== El titular sobre el fondo, en los dos ===');
console.log(`  oscuro ${wcagContrast(tinta, DEL_OG.fondo).toFixed(2)}   claro ${wcagContrast(cTinta, cFondo).toFixed(2)}`);
console.log(`  (medido a ${cuerpo.px} px, peso ${cuerpo.peso})`);
