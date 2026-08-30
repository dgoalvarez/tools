/**
 * Comprobación de la aritmética de contraste contra valores de referencia.
 * Se ejecuta a mano; no forma parte del repositorio.
 */
import {
  medirWcag,
  medirApca,
  sugerirColor,
  hayDesacuerdo,
  componerSobre,
  leerColor,
  esTextoGrande,
} from '../src/lib/contrast.ts';
import { converter } from 'culori';

const aOklch = converter('oklch');
const normal = { px: 16, peso: 400 };
let fallos = 0;

function afirmar(condicion: boolean, mensaje: string) {
  console.log((condicion ? '  ok   ' : '  FALLO') + '  ' + mensaje);
  if (!condicion) fallos++;
}

console.log('\n1. WCAG contra los valores publicados de WebAIM');
for (const [t, b, esperado] of [
  ['#767676', '#ffffff', 4.54],
  ['#777777', '#ffffff', 4.48],
  ['#000000', '#ffffff', 21.0],
] as const) {
  const r = medirWcag(t, b, normal);
  afirmar(Math.abs(r.razon - esperado) < 0.006, `${t} sobre ${b} = ${r.razon.toFixed(2)} (WebAIM: ${esperado})`);
}

console.log('\n2. El umbral cambia con el tamaño del texto');
{
  const chico = medirWcag('#949494', '#ffffff', { px: 16, peso: 400 });
  const grande = medirWcag('#949494', '#ffffff', { px: 24, peso: 400 });
  afirmar(!chico.pasaAA, `a 16 px no pasa AA (${chico.razon.toFixed(2)} < 4.5)`);
  afirmar(grande.pasaAA, `a 24 px sí pasa AA (${grande.razon.toFixed(2)} >= 3)`);
  afirmar(esTextoGrande({ px: 19, peso: 700 }), '19 px en negrita cuenta como texto grande');
  afirmar(!esTextoGrande({ px: 19, peso: 400 }), '19 px normal no cuenta como texto grande');
}

console.log('\n3. APCA distingue la polaridad y WCAG no');
{
  const oscuroSobreClaro = medirApca('#767676', '#ffffff', normal);
  const claroSobreOscuro = medirApca('#ffffff', '#767676', normal);
  const w1 = medirWcag('#767676', '#ffffff', normal);
  const w2 = medirWcag('#ffffff', '#767676', normal);

  afirmar(
    Math.abs(w1.razon - w2.razon) < 0.001,
    `WCAG da lo mismo al invertir: ${w1.razon.toFixed(2)} y ${w2.razon.toFixed(2)}`
  );
  afirmar(
    Math.abs(Math.abs(oscuroSobreClaro.lc) - Math.abs(claroSobreOscuro.lc)) > 3,
    `APCA no: ${oscuroSobreClaro.lc.toFixed(1)} Lc contra ${claroSobreOscuro.lc.toFixed(1)} Lc`
  );
  afirmar(claroSobreOscuro.lc < 0, 'el signo negativo marca texto claro sobre fondo oscuro');
}

console.log('\n4. La sugerencia pasa de verdad, y conserva el tono');
for (const [t, b] of [
  ['#949494', '#ffffff'],
  ['#8a8a8a', '#1a1a1a'],
  ['#c94f4f', '#ffffff'],
  ['#0e8c84', '#f6f7f6'],
] as const) {
  const w = medirWcag(t, b, normal);
  const s = sugerirColor(t, b, w.umbralAA);
  if (!s) {
    afirmar(w.pasaAA, `${t} sobre ${b}: no sugiere nada porque ya pasa`);
    continue;
  }
  const comprobado = medirWcag(s.hex, b, normal);
  const tonoOriginal = aOklch(t)!.h ?? 0;
  const tonoNuevo = aOklch(s.hex)!.h ?? 0;
  const desvio = Math.min(Math.abs(tonoOriginal - tonoNuevo), 360 - Math.abs(tonoOriginal - tonoNuevo));

  afirmar(
    comprobado.pasaAA,
    `${t} sobre ${b} -> ${s.hex} (${comprobado.razon.toFixed(2)}:1, ${s.direccion})`
  );
  afirmar(desvio < 1.5 || s.cromaAjustado, `   conserva el tono (desvío ${desvio.toFixed(2)}°)`);
}

console.log('\n5. Si ya pasa, no sugiere nada');
{
  const w = medirWcag('#101314', '#f6f7f6', normal);
  afirmar(sugerirColor('#101314', '#f6f7f6', w.umbralAA) === null, 'un par que aprueba no recibe sugerencia');
}

console.log('\n6. La transparencia se compone sobre el fondo');
{
  const medio = leerColor('rgb(0 0 0 / 50%)')!;
  const compuesto = componerSobre(medio, '#ffffff');
  afirmar(compuesto === '#808080', `negro al 50 % sobre blanco = ${compuesto}`);
  const opaco = leerColor('#101314')!;
  afirmar(componerSobre(opaco, '#ffffff') === '#101314', 'un color opaco no se toca');
}

console.log('\n7. Hay desacuerdo cuando lo hay, y no cuando no');
{
  const chico = { px: 14, peso: 400 };
  const w = medirWcag('#767676', '#ffffff', chico);
  const a = medirApca('#767676', '#ffffff', chico);
  console.log(`      #767676 sobre #ffffff a 14 px: WCAG ${w.pasaAA ? 'pasa' : 'no pasa'} (${w.razon.toFixed(2)}), APCA ${a.estado} (${a.lc.toFixed(1)} Lc, mínimo ${a.minimoPx} px)`);
  afirmar(hayDesacuerdo(w, a) === (w.pasaAA !== (a.estado === 'pasa')), 'el desacuerdo se detecta correctamente');
}

console.log('\n8. Formatos de entrada');
for (const s of ['#0a5f5a', '0a5f5a', 'rgb(10 95 90)', 'hsl(177 81% 21%)', 'oklch(0.44 0.073 188)', 'teal']) {
  afirmar(leerColor(s) !== null, `«${s}» se reconoce -> ${leerColor(s)?.hex}`);
}
afirmar(leerColor('no soy un color') === null, '«no soy un color» se rechaza');
afirmar(leerColor('') === null, 'el campo vacío se rechaza');

console.log(fallos === 0 ? '\nTODO CORRECTO\n' : `\n${fallos} FALLOS\n`);
process.exit(fallos === 0 ? 0 : 1);
