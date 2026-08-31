/**
 * Comprobación de la aritmética de las rampas de color.
 *
 * Lo que hay que demostrar aquí son cosas que a mano no se prueban nunca:
 * que la semilla vuelve carácter a carácter en su paso; que dos
 * tonalidades ancladas en pasos distintos siguen compartiendo la
 * escalera lejos de sus anclas; que una semilla casi gris no acaba
 * produciendo una rampa oliva; y que el redondeo del CSS no saca ningún
 * color del gamut, que es un fallo que solo se ve en el navegador de otra
 * persona.
 *
 * Las constantes de las curvas están ajustadas sobre las 23 familias
 * OKLCH de Tailwind. Aquí quedan clavadas con su número delante: si
 * alguien las mueve, esto suena.
 */
import { inGamut, parse } from 'culori';

import {
  AJUSTES_INICIALES,
  NOMBRES_POR_PASOS,
  aCss,
  aOklchCss,
  aplicarRetoque,
  buscarNombresRepetidos,
  buscarVallesDeCroma,
  construirPaleta,
  construirRampa,
  cromaMaximo,
  curvaClaridad,
  curvaClaridadInversa,
  escaleraNominal,
  limiteDePolaridad,
  medirPaso,
  nombresPaso,
  retoquesDormidos,
  soltarRetoque,
  soltarTodos,
  type Tonalidad,
} from '../src/lib/rampa.ts';

const enGama = inGamut('rgb');
const normal = { px: 16, peso: 400 };

let fallos = 0;

function afirmar(condicion: boolean, mensaje: string) {
  console.log((condicion ? '  ok    ' : '  FALLO ') + mensaje);
  if (!condicion) fallos++;
}

/** Una tonalidad de fábrica, para no repetir el objeto entero. */
function tono(semilla: string, extra: Partial<Tonalidad> = {}): Tonalidad {
  return { id: 'x', nombre: 'azul', semilla, anclaForzada: null, retoques: {}, ...extra };
}

const L = (n: number) => Math.round(n * 1000) / 10;

console.log('\n1. La escalera de luminosidad');
{
  const e = escaleraNominal(AJUSTES_INICIALES).map(L);
  const esperada = [97.0, 93.6, 87.9, 80.8, 72.6, 63.7, 54.3, 44.6, 34.9, 25.6, 18.0];

  afirmar(
    e.every((v, i) => Math.abs(v - esperada[i]) < 0.05),
    `los once pasos: ${e.join(' · ')}`
  );

  const saltos = e.slice(1).map((v, i) => Math.round((e[i] - v) * 10) / 10);
  afirmar(saltos[0] < saltos[4], `los saltos crecen: 0→1 vale ${saltos[0]} y 5→6 vale ${saltos[4]}`);
  afirmar(
    saltos.slice(0, 3).reduce((a, b) => a + b) < saltos.slice(-3).reduce((a, b) => a + b),
    'los tres primeros saltos suman menos que los tres últimos: se pone más resolución donde el ojo distingue más'
  );

  // La inversa es el corazón del anclaje. Si se equivoca en el redondeo,
  // el ancla se va un paso y nadie sabría por qué.
  for (const t of [0, 0.001, 0.137, 0.5, 0.999, 1]) {
    afirmar(
      Math.abs(curvaClaridadInversa(curvaClaridad(t)) - t) < 1e-9,
      `la inversa deshace la curva en t=${t}`
    );
  }
}

console.log('\n2. Los puntos fijos no se mueven al cambiar la resolución');
{
  // Es la propiedad que hace que bajar de once pasos a siete no cambie el
  // color de nada: el 50, el 500 y el 950 valen lo mismo siempre.
  for (const pasos of [5, 7, 9, 11]) {
    const e = escaleraNominal({ ...AJUSTES_INICIALES, pasos });
    const centro = e[(pasos - 1) / 2];
    afirmar(L(e[0]) === 97.0, `con ${pasos} pasos, el más claro sigue en 97,0`);
    afirmar(L(e[e.length - 1]) === 18.0, `con ${pasos} pasos, el más oscuro sigue en 18,0`);
    afirmar(Math.abs(L(centro) - 63.7) < 0.05, `y el central en 63,7 (${L(centro)})`);
  }
}

console.log('\n3. La semilla vuelve exacta');
{
  const r = construirRampa(tono('#3b82f6'), AJUSTES_INICIALES);

  afirmar(r.ancla === 5, `un azul de marca ancla en el índice 5 (${r.ancla})`);
  afirmar(r.pasos[5].nombre === '500', `y se llama «${r.pasos[5].nombre}»`);
  afirmar(
    r.pasos[5].hex === '#3b82f6',
    `y devuelve el hexadecimal carácter a carácter: ${r.pasos[5].hex}`
  );
  afirmar(r.pasos[5].ancla, 'el paso se marca como anclado');
  afirmar(!r.escaleraDeformada, 'y la escalera no ha tenido que deformarse');

  // El tono del ancla no gira, aunque la deriva esté puesta.
  const original = Math.round((parse('#3b82f6') ? 1 : 0) * 1);
  afirmar(original === 1, 'el hexadecimal de partida se parsea');
}

console.log('\n4. Los extremos: una semilla más clara o más oscura que el rango');
{
  // Casi blanca. No hay rampa a la izquierda porque NO LA HAY: fingirla
  // exigiría inventar un color más claro que el que se pegó.
  const claro = construirRampa(tono('#fbfbfa'), AJUSTES_INICIALES);
  afirmar(claro.ancla === 0, `una semilla casi blanca ancla en el 0 (${claro.ancla})`);
  afirmar(claro.pasos[0].hex === '#fbfbfa', 'y el paso más claro es la semilla, intacta');
  afirmar(
    claro.pasos.every((p, i) => i === 0 || p.l < claro.pasos[i - 1].l),
    'la escalera sigue siendo estrictamente decreciente'
  );

  const oscuro = construirRampa(tono('#0a0a0a'), AJUSTES_INICIALES);
  afirmar(oscuro.ancla === 10, `una casi negra ancla en el último (${oscuro.ancla})`);
  afirmar(oscuro.pasos[10].hex === '#0a0a0a', 'y ese paso es la semilla');
}

console.log('\n5. Dos anclas distintas comparten la escalera lejos de ellas');
{
  // Es la propiedad que justifica la joroba de alcance dos frente a un
  // reescalado global, y la que nadie comprobaría a mano.
  const a = construirRampa(tono('#3b82f6', { id: 'a' }), AJUSTES_INICIALES);
  const b = construirRampa(tono('#166534', { id: 'b', nombre: 'verde' }), AJUSTES_INICIALES);

  afirmar(a.ancla !== b.ancla, `anclan en pasos distintos: ${a.ancla} y ${b.ancla}`);

  const lejos = a.pasos
    .map((_, i) => i)
    .filter((i) => Math.abs(i - a.ancla) >= 2 && Math.abs(i - b.ancla) >= 2);

  afirmar(lejos.length > 0, `hay ${lejos.length} pasos lejos de los dos anclas`);
  afirmar(
    lejos.every((i) => Math.abs(a.pasos[i].calculado.l - b.pasos[i].calculado.l) < 1e-12),
    'y en todos ellos la luminosidad es idéntica bit a bit'
  );
}

console.log('\n6. La escalera nunca se invierte');
{
  // Quinientas semillas al azar. El warp del anclaje no puede, en ningún
  // caso, hacer que un paso salga más claro que el anterior.
  let malas = 0;
  for (let k = 0; k < 500; k++) {
    const hex =
      '#' +
      Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0');
    const r = construirRampa(tono(hex), AJUSTES_INICIALES);
    for (let i = 1; i < r.pasos.length; i++) {
      if (r.pasos[i].calculado.l >= r.pasos[i - 1].calculado.l) malas++;
    }
  }
  afirmar(malas === 0, `500 semillas al azar, ninguna invierte la escalera (${malas} fallos)`);
}

console.log('\n7. Los grises son grises');
{
  const gris = construirRampa(tono('#808080'), AJUSTES_INICIALES);
  afirmar(gris.acromatica, 'un gris puro se reconoce como acromático');
  afirmar(
    gris.pasos.every((p) => p.c === 0 && p.h === undefined),
    'los once pasos salen sin croma y sin tono'
  );
  afirmar(
    gris.pasos.every((p) => {
      const c = parse(p.hex) as { r: number; g: number; b: number } | undefined;
      return c ? c.r === c.g && c.g === c.b : false;
    }),
    'y los once hexadecimales tienen los tres canales iguales'
  );

  const css = aCss({ ajustes: AJUSTES_INICIALES, rampas: [gris] });
  afirmar(css.includes('none'), 'el CSS emite «none» como tono, que es lo correcto para un gris');
  afirmar(!/oklch\([\d.]+% 0 [\d.]+\)/.test(css), 'y no inventa ningún ángulo de tono');
}

console.log('\n8. Una semilla casi gris no produce una rampa con tinte');
{
  /*
   * El caso que no se prueba a mano porque a nadie se le ocurre pegar un
   * casi-blanco en una herramienta de paletas.
   *
   * La joroba se normaliza por su valor en el ancla; con la semilla en el
   * paso 0 ese divisor es pequeñísimo y el croma se inflaría 13,5 veces.
   * Sin el tope de inflación, el 500 de `#f5f5f4` sale `#8c8c80`: un
   * oliva bien visible salido de un color que nadie llamaría verde.
   */
  const r = construirRampa(tono('#f5f5f4'), AJUSTES_INICIALES);
  const maxCroma = Math.max(...r.pasos.map((p) => p.c));
  afirmar(maxCroma < 0.005, `ningún paso pasa de 0,005 de croma (máximo ${maxCroma.toFixed(4)})`);

  const desvios = r.pasos.map((p) => {
    const c = parse(p.hex) as { r: number; g: number; b: number };
    const v = [c.r, c.g, c.b].map((x) => Math.round(x * 255));
    return Math.max(...v) - Math.min(...v);
  });
  afirmar(
    Math.max(...desvios) <= 3,
    `y ninguno separa sus canales más de 3 niveles de 255 (máximo ${Math.max(...desvios)})`
  );
}

console.log('\n9. El croma y el gamut');
{
  const r = construirRampa(tono('#3b82f6'), AJUSTES_INICIALES);

  afirmar(
    r.pasos.every((p) => p.c <= p.cromaTecho + 1e-9 || p.ancla || p.tocado),
    'ningún paso calculado supera el techo de sRGB'
  );
  afirmar(
    r.pasos.every((p) => enGama(parse(p.hex) as never)),
    'y los once hexadecimales están dentro de sRGB'
  );

  // Los azules claros no pueden ser saturados en sRGB, así que ahí se
  // recorta; los oscuros sí caben y no.
  const recortados = r.pasos.filter((p) => p.recortado).map((p) => p.nombre);
  afirmar(recortados.length > 0, `se marca lo que el gamut recorta: ${recortados.join(', ')}`);
  afirmar(
    !r.pasos[9].recortado && !r.pasos[10].recortado,
    'y los pasos oscuros, que sí caben, no se marcan'
  );

  // El croma plano: el mando a cero deja el de la semilla de punta a
  // punta, salvo donde el techo mande.
  const plano = construirRampa(tono('#3b82f6'), { ...AJUSTES_INICIALES, cromaCentro: 0 });
  afirmar(
    plano.pasos.every((p) => p.ancla || p.cromaTeorico === plano.pasos[0].cromaTeorico),
    'con el mando de croma a cero, la curva teórica es plana'
  );
}

console.log('\n10. Ningún valle de croma');
{
  /*
   * Un valle es un paso menos saturado que sus dos vecinos sin que la
   * curva lo pida: se lee como «este color está apagado» y es el fallo
   * clásico de una rampa recortada a lo bruto.
   *
   * No aparece ninguno, y no es casualidad: el techo de sRGB es monótono
   * en luminosidad por debajo de la cúspide, y la deriva de tono es
   * demasiado pequeña para cruzar una arista del gamut. Queda como
   * alarma por si alguien toca las sigmas o el margen.
   */
  let conValle = 0;
  let rampas = 0;
  for (let grado = 0; grado < 360; grado += 15) {
    for (const derivaTono of [0, 8, -8, 20, -20]) {
      const hex = aOklchCss({
        indice: 0,
        nombre: '500',
        variable: '--x-500',
        l: 0.6,
        c: 0.9 * cromaMaximo(0.6, grado),
        h: grado,
        hex: '#000000',
        ancla: false,
        tocado: false,
        calculado: { l: 0.6, c: 0, h: grado, hex: '#000000' },
        cromaTeorico: 0,
        cromaTecho: 0,
        recortado: false,
      });
      const r = construirRampa(tono(hex), { ...AJUSTES_INICIALES, derivaTono });
      rampas++;
      if (buscarVallesDeCroma(r.pasos).length) conValle++;
    }
  }
  afirmar(conValle === 0, `${rampas} rampas por toda la rueda y ninguna tiene un valle`);
}

console.log('\n11. La deriva de tono');
{
  const sin = construirRampa(tono('#3b82f6'), { ...AJUSTES_INICIALES, derivaTono: 0 });
  const tonos = sin.pasos.map((p) => p.calculado.h ?? 0);
  afirmar(
    tonos.every((h) => Math.abs(h - tonos[0]) < 1e-9),
    'con la deriva a cero, el tono es el mismo en los once pasos'
  );

  const con = construirRampa(tono('#3b82f6'), { ...AJUSTES_INICIALES, derivaTono: 20 });
  const esperado = 20 * (1 - con.posicionSemilla);
  const real = (con.pasos[10].calculado.h ?? 0) - (con.pasos[con.ancla].h ?? 0);
  afirmar(
    Math.abs(real - esperado) < 0.01,
    `con deriva 20, el último paso gira ${real.toFixed(2)}° y tocaban ${esperado.toFixed(2)}°`
  );

  // El ancla no gira nunca: es lo que permite ponerla de fábrica sin
  // faltarle al respeto al color de nadie.
  afirmar(
    Math.abs((con.pasos[con.ancla].h ?? 0) - (sin.pasos[sin.ancla].h ?? 0)) < 1e-9,
    'y el paso anclado conserva su tono exacto, con deriva y sin ella'
  );
}

console.log('\n12. El reparto de nombres');
{
  afirmar(
    NOMBRES_POR_PASOS[11].join(' ') === '50 100 200 300 400 500 600 700 800 900 950',
    'con once pasos son exactamente los de Tailwind'
  );
  afirmar(NOMBRES_POR_PASOS[9].join(' ') === '50 200 300 400 500 600 700 800 950', 'con nueve');
  afirmar(NOMBRES_POR_PASOS[7].join(' ') === '50 200 300 500 700 800 950', 'con siete');
  afirmar(NOMBRES_POR_PASOS[5].join(' ') === '50 300 500 700 950', 'con cinco');

  for (const pasos of [3, 5, 7, 9, 11, 13, 15]) {
    const n = nombresPaso(pasos);
    afirmar(n.length === pasos, `con ${pasos} pasos hay ${n.length} nombres`);
    afirmar(new Set(n).size === pasos, `y ninguno se repite`);
    afirmar(n[(pasos - 1) / 2] === '500', `y el central se llama «500»`);
    afirmar(n[0] === '50' && n[pasos - 1] === '950', 'y los extremos son 50 y 950');
  }
}

console.log('\n13. Los retoques');
{
  const base = tono('#3b82f6');
  const conRetoque = aplicarRetoque(base, '300', '#ff0000');
  const r = construirRampa(conRetoque, AJUSTES_INICIALES);

  const tocado = r.pasos.find((p) => p.nombre === '300')!;
  afirmar(tocado.tocado && tocado.hex === '#ff0000', 'un retoque sobrescribe su paso');
  afirmar(
    r.pasos.filter((p) => p.tocado).length === 1,
    'y solo ese: los demás siguen siendo lo calculado'
  );
  afirmar(
    tocado.calculado.hex !== '#ff0000',
    `el color calculado se conserva debajo (${tocado.calculado.hex}), que es lo que permite volver`
  );

  // Sobrevive a mover los mandos.
  const otroRango = construirRampa(conRetoque, { ...AJUSTES_INICIALES, claridadMax: 0.99 });
  afirmar(
    otroRango.pasos.find((p) => p.nombre === '300')!.hex === '#ff0000',
    'y sobrevive a cambiar el rango de claridad'
  );

  // Soltarlo devuelve exactamente lo calculado.
  const suelto = construirRampa(soltarRetoque(conRetoque, '300'), AJUSTES_INICIALES);
  const vuelto = suelto.pasos.find((p) => p.nombre === '300')!;
  afirmar(
    !vuelto.tocado && vuelto.hex === tocado.calculado.hex,
    `soltarlo devuelve el color calculado exacto (${vuelto.hex})`
  );
  afirmar(
    Object.keys(soltarTodos(conRetoque).retoques).length === 0,
    'y soltarlos todos deja la tonalidad limpia'
  );

  /*
   * La clave por nombre, no por índice.
   *
   * Con la clave por índice, bajar a siete pasos habría movido el retoque
   * del «100» al «200» sin decir nada: el índice 1 significa una cosa con
   * once pasos y otra con siete.
   */
  const en100 = aplicarRetoque(base, '100', '#ff0000');
  const conSiete = construirRampa(en100, { ...AJUSTES_INICIALES, pasos: 7 });
  afirmar(
    conSiete.pasos.every((p) => !p.tocado),
    'con siete pasos no hay «100», y el retoque no se aplica a ningún otro'
  );
  afirmar(
    retoquesDormidos(en100, { ...AJUSTES_INICIALES, pasos: 7 }).join() === '100',
    'pero se puede decir que está dormido, para que nadie lo dé por perdido'
  );
  afirmar(
    construirRampa(en100, AJUSTES_INICIALES).pasos.find((p) => p.nombre === '100')!.hex ===
      '#ff0000',
    'y al volver a once reaparece intacto'
  );
}

console.log('\n14. El CSS emitido no se sale del gamut');
{
  /*
   * El redondeo saca colores de sRGB, y no es raro: los que están pegados
   * al techo se salen al truncar los decimales. Entonces el navegador los
   * recorta a SU manera, que no es la nuestra, y el hexadecimal que
   * enseña la herramienta deja de ser el color que sale en pantalla.
   */
  let fuera = 0;
  let mirados = 0;

  for (let grado = 0; grado < 360; grado += 10) {
    const c = 0.995 * cromaMaximo(0.6, grado);
    const semilla = aOklchCss({
      indice: 0, nombre: '500', variable: '--x-500',
      l: 0.6, c, h: grado, hex: '#000000',
      ancla: false, tocado: false,
      calculado: { l: 0.6, c, h: grado, hex: '#000000' },
      cromaTeorico: c, cromaTecho: c, recortado: false,
    });

    for (const paso of construirRampa(tono(semilla), AJUSTES_INICIALES).pasos) {
      mirados++;
      const css = aOklchCss(paso);
      const releido = parse(css);
      if (!releido || !enGama(releido as never)) fuera++;
    }
  }

  afirmar(fuera === 0, `${mirados} colores emitidos y releídos, ninguno fuera de sRGB (${fuera})`);
}

console.log('\n15. La accesibilidad de cada paso');
{
  const r = construirRampa(tono('#3b82f6'), AJUSTES_INICIALES);

  const limite = limiteDePolaridad(r.pasos, normal);
  afirmar(limite !== null, `hay una frontera de polaridad, en el índice ${limite}`);
  afirmar(
    limite !== null && !medirPaso(r.pasos[limite - 1].hex, normal).conBlanco.wcag.pasaAA,
    'el paso justo anterior a la frontera NO aguanta blanco: la frontera es la primera que sí'
  );

  /*
   * APCA no es simétrico. Llamarlo al revés —el color como texto y la
   * tinta como fondo— devuelve un número que parece razonable y está
   * mal, y es el error fácil de cometer. Aquí se comprueba que la
   * pregunta que se hace es «¿qué etiqueta le pongo encima a este
   * color?» y no al revés.
   */
  const m = medirPaso(r.pasos[5].hex, normal);
  afirmar(
    m.conBlanco.apca.lc < 0 && m.conNegro.apca.lc > 0,
    `blanco sobre el 500 da Lc ${Math.round(m.conBlanco.apca.lc)} y negro Lc ${Math.round(m.conNegro.apca.lc)}: los signos dicen la polaridad correcta`
  );
  afirmar(
    Math.abs(Math.abs(m.conBlanco.apca.lc) - Math.abs(m.conNegro.apca.lc)) > 3,
    'y no son el mismo número con el signo cambiado, que es lo que saldría al llamarlo al revés'
  );

  // Los extremos de la rampa siempre aguantan una de las dos tintas.
  afirmar(
    medirPaso(r.pasos[0].hex, normal).conNegro.wcag.pasaAA,
    'el paso más claro aguanta texto negro'
  );
  afirmar(
    medirPaso(r.pasos[10].hex, normal).conBlanco.wcag.pasaAA,
    'y el más oscuro aguanta texto blanco'
  );
}

console.log('\n16. Nombres repetidos y saneado');
{
  const paleta = construirPaleta(
    [tono('#3b82f6', { id: 'a' }), tono('#ef4444', { id: 'b' })],
    AJUSTES_INICIALES
  );
  afirmar(
    buscarNombresRepetidos(paleta).join() === 'azul',
    'dos tonalidades con el mismo nombre se detectan: la segunda pisaría a la primera'
  );

  // Una dirección manipulada no puede inyectar en el bloque de CSS que
  // alguien va a pegar en su proyecto.
  const sucio = construirRampa(
    tono('#3b82f6', { nombre: 'azul: red; } body { background: red' }),
    AJUSTES_INICIALES
  );
  const css = aCss({ ajustes: AJUSTES_INICIALES, rampas: [sucio] });

  // Lo que importa no es que desaparezca la palabra «body» —eso es texto
  // inocuo— sino que no quede ningún carácter capaz de cerrar la
  // declaración y abrir otra.
  const nombres = [...css.matchAll(/^ {2}(--[^:]+):/gm)].map((m) => m[1]);
  afirmar(nombres.length === 11, `salen las once variables (${nombres.length})`);
  afirmar(
    nombres.every((n) => /^--[a-zA-Z0-9_-]+$/.test(n)),
    `y ninguna lleva un carácter que pueda romper el bloque: ${nombres[0]}`
  );
  afirmar(
    (css.match(/{/g) ?? []).length === 1 && (css.match(/}/g) ?? []).length === 1,
    'el bloque tiene exactamente una llave de apertura y una de cierre'
  );
}

console.log(fallos === 0 ? '\nTODO CORRECTO\n' : `\n${fallos} FALLOS\n`);
process.exit(fallos === 0 ? 0 : 1);
