/**
 * El acento de la materia «texto», derivado y medido.
 *
 * Mismo método que `paleta-final.ts`: se busca en OKLCH y se comprueba con
 * la propia herramienta de contraste del sitio. Nada entra si no pasa AA.
 *
 *   node design/acento-texto.ts
 *
 * ---------------------------------------------------------------------
 * Por qué azul y no el frambuesa que se había planeado
 *
 * El plan decía «frambuesa hacia los 15–20°, que es el hueco que queda
 * entre el morado y el ámbar». Al medirlo apareció el problema: **ahí ya
 * vive `--danger`**, en el tono 30. Un acento a 15° y el color de error a
 * 30° son el mismo rojo a los ojos de cualquiera — y el acento pinta el
 * rótulo de materia, la herramienta abierta en el riel y el relleno de los
 * botones, así que la herramienta entera diría «cuidado».
 *
 * El hueco de verdad es el otro: entre el teal (189) y el morado (304) hay
 * 115° sin nadie. El 255 queda a 66° del teal y a 49° del morado, que es la
 * mejor separación disponible. Y viene bien de significado: una nota se
 * escribe con tinta, y la tinta es azul.
 *
 * ---------------------------------------------------------------------
 * Qué tiene que cumplir, y por qué cada cosa
 *
 *   · **En tema claro** es a la vez el color del rótulo de materia (texto
 *     pequeño: 4,5:1 sobre los tres fondos claros) **y** el relleno de los
 *     botones principales, con tinta blanca encima. Lo segundo es lo que
 *     costó una tanda entera: un acento derivado para leerse COMO TEXTO no
 *     aguanta tinta oscura encima, así que el relleno es el acento oscuro
 *     y la letra es blanca.
 *   · Ese botón oscuro tiene que separarse de la página oscura: 3:1, que
 *     es lo que WCAG le pide a un componente.
 *   · **En tema oscuro** solo es texto: 4,5:1 sobre los tres fondos
 *     oscuros.
 *
 * De todos los que cumplen se elige el más cromático de su tono, que es el
 * que más se distingue de los otros acentos en el riel plegado — donde
 * solo se ve el icono, a 19 px.
 */
import { converter, formatHex, wcagContrast, inGamut } from 'culori';
import { medirWcag, medirApca } from '../src/lib/contrast.ts';

const aOklch = converter('oklch');
const cabe = inGamut('rgb');

const chico = { px: 13, peso: 500 };
const boton = { px: 15, peso: 600 };

const CLARO = { bg: '#f3f6f7', surface: '#ffffff', surface2: '#e9edee' };
const OSCURO = { bg: '#10191b', surface: '#182123', surface2: '#1e282a' };

/** Lo elegido, que es lo que está copiado en global.css. */
const ELEGIDO = { claro: '#0169cd', oscuro: '#2c8efe' };

/** Lo que ya existe, para ver a qué distancia de tono queda el nuevo. */
const EXISTEN: Record<string, string> = {
  'tiempo claro': '#946000',
  'color claro': '#884fc4',
  'tipo claro': '#007872',
  'peligro claro': '#a4271c',
  'tiempo oscuro': '#e8a33d',
  'color oscuro': '#b47cf5',
  'tipo oscuro': '#31c5bc',
  'peligro oscuro': '#ff8a7a',
};

interface Candidato {
  hex: string;
  h: number;
  l: number;
  c: number;
}

/** El más cromático que cumpla, para un tono y una claridad dados. */
function masCroma(l: number, h: number, cumple: (hex: string) => boolean): string | null {
  for (let c = 0.3; c >= 0; c -= 0.002) {
    const col = { mode: 'oklch' as const, l, c, h };
    if (!cabe(col)) continue;
    const hex = formatHex(col);
    if (cumple(hex)) return hex;
  }
  return null;
}

function buscar(claridades: [number, number], cumple: (hex: string) => boolean): Candidato[] {
  const out: Candidato[] = [];
  for (const h of [230, 235, 240, 245, 250, 255, 260]) {
    for (let l = claridades[0]; l <= claridades[1] + 1e-9; l += 0.01) {
      const hex = masCroma(l, h, cumple);
      if (!hex) continue;
      out.push({ hex, h, l, c: aOklch(hex)!.c });
    }
  }
  return out.sort((a, b) => b.c - a.c);
}

/** El más cromático de cada tono, que es la decisión real. */
function mejorPorTono(lista: Candidato[]): Candidato[] {
  const vistos = new Map<number, Candidato>();
  for (const c of lista) if (!vistos.has(c.h)) vistos.set(c.h, c);
  return [...vistos.values()].sort((a, b) => a.h - b.h);
}

console.log('=== CLARO · es texto Y es el relleno del botón ===');
console.log('   L    tono  hex       bg    sup   sup2  blanco encima  sobre página oscura');

const claros = buscar([0.4, 0.58], (hex) => {
  const fondos = [CLARO.bg, CLARO.surface, CLARO.surface2];
  if (!fondos.every((f) => medirWcag(hex, f, chico).pasaAA)) return false;
  if (!medirWcag('#ffffff', hex, boton).pasaAA) return false;
  return wcagContrast(hex, OSCURO.bg) >= 3;
});

for (const cand of mejorPorTono(claros)) {
  const marca = cand.hex === ELEGIDO.claro ? '  <- elegido' : '';
  console.log(
    `  ${cand.l.toFixed(2)}  ${String(cand.h).padStart(3)}   ${cand.hex}  ` +
      `${wcagContrast(cand.hex, CLARO.bg).toFixed(2)}  ` +
      `${wcagContrast(cand.hex, CLARO.surface).toFixed(2)}  ` +
      `${wcagContrast(cand.hex, CLARO.surface2).toFixed(2)}  ` +
      `${wcagContrast('#ffffff', cand.hex).toFixed(2)}           ` +
      `${wcagContrast(cand.hex, OSCURO.bg).toFixed(2)}   croma ${cand.c.toFixed(3)}${marca}`
  );
}

console.log('\n=== OSCURO · solo es texto ===');
console.log('   L    tono  hex       bg    sup   sup2');

const oscuros = buscar([0.62, 0.84], (hex) =>
  [OSCURO.bg, OSCURO.surface, OSCURO.surface2].every((f) => medirWcag(hex, f, chico).pasaAA)
);

for (const cand of mejorPorTono(oscuros)) {
  const marca = cand.hex === ELEGIDO.oscuro ? '  <- elegido' : '';
  console.log(
    `  ${cand.l.toFixed(2)}  ${String(cand.h).padStart(3)}   ${cand.hex}  ` +
      `${wcagContrast(cand.hex, OSCURO.bg).toFixed(2)}  ` +
      `${wcagContrast(cand.hex, OSCURO.surface).toFixed(2)}  ` +
      `${wcagContrast(cand.hex, OSCURO.surface2).toFixed(2)}   croma ${cand.c.toFixed(3)}${marca}`
  );
}

console.log('\n=== A qué distancia de tono queda de lo que ya hay ===');
const tonoNuevo = aOklch(ELEGIDO.claro)!.h!;
for (const [nombre, hex] of Object.entries(EXISTEN)) {
  const o = aOklch(hex)!;
  const bruto = Math.abs(o.h! - tonoNuevo);
  const dist = Math.min(bruto, 360 - bruto);
  console.log(
    `  ${nombre.padEnd(14)} ${hex}  tono ${o.h!.toFixed(0).padStart(3)}  ` +
      `a ${dist.toFixed(0).padStart(3)} grados del nuevo`
  );
}

console.log('\n=== El botón, en APCA, como el resto de los sólidos ===');
const blanco = medirApca('#ffffff', ELEGIDO.claro, boton);
const oscura = medirApca(OSCURO.bg, ELEGIDO.claro, boton);
console.log(`  blanco sobre ${ELEGIDO.claro}        Lc ${blanco.lc.toFixed(0)}  ${blanco.estado}`);
console.log(`  tinta oscura sobre ${ELEGIDO.claro}  Lc ${oscura.lc.toFixed(0)}  ${oscura.estado}`);
