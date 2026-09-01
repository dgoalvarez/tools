/** Repasa cada par de colores que acaba en el lienzo, en los dos temas. */
import { componerSobre, medirWcag } from '../src/lib/contrast.ts';

const TEMAS = {
  oscuro: { fondo:'#0c0d10', sup:'#14161b', sup2:'#1a1d23', tinta:'#eef0f3', media:'#a3a9b5', suave:'#848c9a',
            ac:{tiempo:'#e8a33d',color:'#b47cf5',tipo:'#6fe0a8'}, sobreAcento:'#0c0d10' },
  claro:  { fondo:'#f7f7f8', sup:'#ffffff', sup2:'#eeeef1', tinta:'#16171b', media:'#4d505a', suave:'#686c78',
            ac:{tiempo:'#9c6600',color:'#8e55cb',tipo:'#008254'}, sobreAcento:'#ffffff' },
};

const chico = { px: 12, peso: 500 };
const cuerpo = { px: 15, peso: 400 };
let fallos = 0;

function ver(etiqueta: string, texto: string, fondo: string, forma = chico) {
  const r = medirWcag(texto, fondo, forma);
  if (!r.pasaAA) fallos++;
  console.log(`  ${r.pasaAA ? 'ok   ' : 'FALLA'} ${r.razon.toFixed(2).padStart(5)}:1  ${etiqueta}`);
}

for (const [tema, t] of Object.entries(TEMAS)) {
  console.log(`\n=== ${tema.toUpperCase()} ===`);

  ver('titular y texto principal sobre el fondo', t.tinta, t.fondo, cuerpo);
  ver('texto secundario sobre el fondo', t.media, t.fondo, cuerpo);
  ver('rótulos sobre el fondo', t.suave, t.fondo);
  ver('texto secundario sobre la superficie', t.media, t.sup, cuerpo);
  ver('rótulos sobre la superficie', t.suave, t.sup);
  ver('rótulos sobre la superficie 2', t.suave, t.sup2);

  for (const [n, a] of Object.entries(t.ac)) {
    // La tarjeta del home: la etiqueta cae sobre el halo del acento al 16 %.
    const halo = componerSobre({ hex: a, alpha: 0.16, formato: 'rgb' }, t.sup2);
    ver(`etiqueta de ámbito sobre el halo de ${n}`, t.media, halo);
    ver(`«Abrir →» en ${n} sobre la tarjeta`, a, t.sup);
    ver(`texto sobre el icono de ${n}`, t.sobreAcento, a);
  }

  // La herramienta abierta en la barra lateral: fondo con el acento al 13 %.
  const fila = componerSobre({ hex: t.ac.color, alpha: 0.13, formato: 'rgb' }, t.sup);
  ver('nombre de la herramienta abierta en la barra', t.tinta, fila, cuerpo);
  ver('su descripción en la barra', t.media, fila);
}

console.log(fallos === 0 ? '\nTODOS LOS PARES PASAN AA\n' : `\n${fallos} PARES NO PASAN\n`);
process.exit(fallos === 0 ? 0 : 1);
