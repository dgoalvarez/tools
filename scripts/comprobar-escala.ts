/**
 * Comprobación de la escala tipográfica. Se ejecuta a mano.
 *
 * Lo que de verdad hay que demostrar es que la tabla no miente: que los
 * píxeles que enseña son los que un navegador calcularía a partir del
 * clamp() que la herramienta genera. Se hace evaluando ese clamp() aparte,
 * igual que lo evaluaría el navegador, y comparando.
 */
import {
  construirEscala,
  buscarCruces,
  anchoParaFraccion,
  ANCHOS_TABLA,
  ESQUEMAS,
  aCss,
  alturaDeLinea,
  aplicarEsquema,
  buscarNombresRepetidos,
  limpiarNombre,
  type Ajustes,
} from '../src/lib/scale.ts';

const RAIZ = 16;
let fallos = 0;

function afirmar(condicion: boolean, mensaje: string) {
  console.log((condicion ? '  ok    ' : '  FALLO ') + mensaje);
  if (!condicion) fallos++;
}

/**
 * Evalúa un valor CSS como lo haría el navegador, a una anchura dada.
 * Entiende un valor suelto y un clamp() con términos en rem, vw y px.
 */
function evaluarCss(valor: string, ancho: number): number {
  const unidad = (parte: string): number => {
    const n = parseFloat(parte);
    if (!Number.isFinite(n)) return 0;
    if (parte.includes('rem')) return n * RAIZ;
    if (parte.includes('vw')) return (n / 100) * ancho;
    return n; // px o número pelado
  };

  /** Suma los términos de algo como «1.2rem + 3.4vw» o «6.4vw». */
  const sumar = (expr: string): number =>
    expr
      .replace(/\s*-\s*/g, ' + -')
      .split('+')
      .map((p) => p.trim())
      .filter(Boolean)
      .reduce((total, p) => total + unidad(p), 0);

  const m = valor.match(/^clamp\((.+?),\s*(.+?),\s*(.+?)\)$/);
  if (!m) return sumar(valor);

  return Math.min(Math.max(sumar(m[2]!), sumar(m[1]!)), sumar(m[3]!));
}

const base: Ajustes = {
  baseMin: 16,
  baseMax: 20,
  razonMin: 1.2,
  razonMax: 1.25,
  arriba: 5,
  abajo: 2,
  anchoMin: 390,
  anchoMax: 1920,
  prefijo: 'step',
  nombres: {},
  omitidos: [],
};

console.log('\n0. El evaluador de CSS de esta prueba es correcto');
{
  afirmar(evaluarCss('2rem', 1000) === 32, '2rem = 32 px');
  afirmar(evaluarCss('6.4vw', 1000) === 64, '6.4vw a 1000 px = 64 px');
  afirmar(
    evaluarCss('clamp(1rem, 5vw, 3rem)', 1000) === 48,
    'clamp elige el término del medio cuando cabe'
  );
  afirmar(evaluarCss('clamp(1rem, 5vw, 3rem)', 200) === 16, 'clamp respeta el mínimo');
  afirmar(evaluarCss('clamp(1rem, 5vw, 3rem)', 5000) === 48, 'clamp respeta el máximo');
  afirmar(
    Math.abs(evaluarCss('clamp(1rem, 0.5rem + 2vw, 3rem)', 1000) - 28) < 0.001,
    'suma rem y vw'
  );
  afirmar(
    Math.abs(evaluarCss('clamp(1rem, 3vw - 0.5rem, 5rem)', 1000) - 22) < 0.001,
    'resta rem de vw'
  );
}

console.log('\n1. La tabla coincide con lo que el navegador calcularía del clamp() generado');
{
  const pasos = construirEscala(base);
  let maxDesvio = 0;
  for (const paso of pasos) {
    for (let i = 0; i < ANCHOS_TABLA.length; i++) {
      const delNavegador = evaluarCss(paso.valor, ANCHOS_TABLA[i]!);
      maxDesvio = Math.max(maxDesvio, Math.abs(delNavegador - paso.enTabla[i]!));
    }
  }
  afirmar(
    maxDesvio < 0.02,
    `desvío máximo en ${pasos.length} pasos x 4 anchuras: ${maxDesvio.toFixed(4)} px`
  );
}

console.log('\n2. Los extremos son exactamente el mínimo y el máximo pedidos');
{
  const pasos = construirEscala(base);
  const p0 = pasos.find((p) => p.indice === 0)!;
  afirmar(
    Math.abs(evaluarCss(p0.valor, 390) - 16) < 0.02,
    `en 390 px el paso 0 mide ${evaluarCss(p0.valor, 390).toFixed(2)} (pedido 16)`
  );
  afirmar(
    Math.abs(evaluarCss(p0.valor, 1920) - 20) < 0.02,
    `en 1920 px el paso 0 mide ${evaluarCss(p0.valor, 1920).toFixed(2)} (pedido 20)`
  );
  afirmar(Math.abs(evaluarCss(p0.valor, 320) - 16) < 0.02, 'por debajo del mínimo se queda fijo');
  afirmar(Math.abs(evaluarCss(p0.valor, 2560) - 20) < 0.02, 'por encima del máximo se queda fijo');

  const p3 = pasos.find((p) => p.indice === 3)!;
  afirmar(
    Math.abs(evaluarCss(p3.valor, 390) - 16 * 1.2 ** 3) < 0.02,
    `el paso +3 respeta la proporción estrecha: ${evaluarCss(p3.valor, 390).toFixed(2)}`
  );
  afirmar(
    Math.abs(evaluarCss(p3.valor, 1920) - 20 * 1.25 ** 3) < 0.02,
    `el paso +3 respeta la proporción ancha: ${evaluarCss(p3.valor, 1920).toFixed(2)}`
  );
}

console.log('\n3. Los cruces se detectan cuando los hay, y no cuando no');
{
  afirmar(
    buscarCruces(construirEscala(base), base).length === 0,
    'una escala sana no da ningún aviso'
  );

  const razonBaja: Ajustes = { ...base, razonMin: 0.9, razonMax: 0.9 };
  const cruces = buscarCruces(construirEscala(razonBaja), razonBaja);
  afirmar(
    cruces.length > 0,
    `proporción menor que uno: ${cruces.length} avisos, el primero ${cruces[0]?.menor} contra ${cruces[0]?.mayor}`
  );

  const mezclada: Ajustes = { ...base, razonMin: 1.35, razonMax: 1.02 };
  const cruces2 = buscarCruces(construirEscala(mezclada), mezclada);
  console.log(`        (proporciones muy dispares 1.35 / 1.02: ${cruces2.length} avisos)`);
}

console.log('\n4. El CSS generado es válido');
{
  const css = aCss(construirEscala(base));
  afirmar(css.startsWith(':root {') && css.trim().endsWith('}'), 'el bloque abre y cierra');
  // Cada paso emite DOS variables: su tamaño y su alto de línea. Se
  // cuentan solo las de tamaño, que son las que no acaban en `-lh`.
  const tamanos = (css.match(/--step-[\w-]+:/g) || []).filter((v) => !v.endsWith('-lh:'));
  afirmar(tamanos.length === 8, `declara los ocho pasos (${tamanos.length})`);
  afirmar((css.match(/-lh:/g) || []).length === 8, 'y el alto de línea de cada uno');
  afirmar(!/NaN|Infinity|undefined/.test(css), 'no hay NaN ni Infinity en el CSS');
  afirmar(
    /rem/.test(css) && /vw/.test(css),
    'cada paso lleva un término en rem, así el zoom sigue funcionando'
  );
}

console.log('\n5. La escala real de dgoalvarez.com, evaluada con esta misma aritmética');
{
  // Copiadas literalmente de C:\portfolio\src\styles\global.css
  const reales: [string, string][] = [
    ['--fs-hero', 'clamp(2.7rem, 6.4vw, 8.2rem)'],
    ['--fs-case-title', 'clamp(2.8rem, 6.6vw, 7.2rem)'],
    ['--fs-h2', 'clamp(1.5rem, 2.2vw, 2.5rem)'],
    ['--fs-lead', 'clamp(1.25rem, 1.9vw, 2.2rem)'],
    ['--fs-body', 'clamp(17px, 1vw, 18.5px)'],
  ];

  console.log('        variable            390     768    1360    1920  | % de su máximo a 1360');
  for (const [nombre, valor] of reales) {
    const maximo = evaluarCss(valor, 100000);
    const fila = [390, 768, 1360, 1920].map((w) => evaluarCss(valor, w).toFixed(1).padStart(7));
    const pct = ((evaluarCss(valor, 1360) / maximo) * 100).toFixed(0);
    console.log(`        ${nombre.padEnd(16)}${fila.join('')}  | ${pct.padStart(3)} %`);
  }

  const cuerpoA1360 = evaluarCss('clamp(17px, 1vw, 18.5px)', 1360);
  afirmar(
    cuerpoA1360 === 17,
    `a 1360 px el cuerpo del portafolio sigue clavado en su mínimo (${cuerpoA1360} px)`
  );
}

console.log('\n6. anchoParaFraccion: a qué anchura un paso casi ha terminado de crecer');
{
  const pasos = construirEscala(base);
  const p0 = pasos.find((p) => p.indice === 0)!;
  const w = anchoParaFraccion(p0, 0.95, base)!;
  const enEseAncho = evaluarCss(p0.valor, w);
  afirmar(
    Math.abs(enEseAncho / p0.maxPx - 0.95) < 0.01,
    `el paso 0 llega al 95 % (${enEseAncho.toFixed(2)} de ${p0.maxPx}) en ${w} px`
  );

  const plano = construirEscala({ ...base, baseMax: 16, razonMax: 1.2 });
  afirmar(
    anchoParaFraccion(plano[0]!, 0.95, base) === null,
    'un paso que no crece devuelve «no crece»'
  );
}

console.log('\n7. Los nombres de cada paso');
{
  const semantico = ESQUEMAS.find((e) => e.clave === 'semantico')!;
  const conNombres: Ajustes = {
    ...base,
    nombres: aplicarEsquema(semantico, base.abajo, base.arriba),
  };

  const pasos = construirEscala(conNombres);
  const css = aCss(pasos);

  afirmar(css.includes('--step-body:'), 'el paso 0 se llama body con el esquema semántico');
  afirmar(css.includes('--step-title:'), 'el +1 se llama title');
  afirmar(css.includes('--step-caption:'), 'el −1 se llama caption');

  // El esquema semántico trae cuatro nombres hacia arriba y la escala tiene
  // cinco pasos: el que sobra tiene que seguir numerado, no quedarse vacío.
  afirmar(css.includes('--step-5:'), 'el paso que se queda sin nombre sigue numerado');

  const tailwind = ESQUEMAS.find((e) => e.clave === 'tailwind')!;
  const cssTw = aCss(
    construirEscala({ ...base, nombres: aplicarEsquema(tailwind, base.abajo, base.arriba) })
  );
  afirmar(
    cssTw.includes('--step-base:') && cssTw.includes('--step-2xl:'),
    'el esquema de Tailwind se ancla en base'
  );

  afirmar(
    limpiarNombre('mi nombre!! raro') === 'minombreraro',
    'los nombres se limpian de lo que no vale en CSS'
  );
  afirmar(limpiarNombre('a'.repeat(80)).length === 32, 'y se recortan a 32 caracteres');
  afirmar(limpiarNombre('') === '', 'un nombre vacío sigue vacío, y el paso vuelve a su número');

  afirmar(
    buscarNombresRepetidos(construirEscala(base)).length === 0,
    'la escala numérica no repite ningún nombre'
  );

  const repes = buscarNombresRepetidos(
    construirEscala({ ...base, nombres: { '0': 'title', '1': 'title' } })
  );
  afirmar(
    repes.length === 1 && repes[0] === '--step-title',
    `dos pasos con el mismo nombre se detectan (${repes.join(', ')})`
  );

  // Un nombre inventado en la dirección no debe poder colarse en el bloque
  // de CSS que alguien va a pegar en su proyecto.
  const sucio = aCss(
    construirEscala({ ...base, nombres: { '0': limpiarNombre('x; } body { display:none') } })
  );
  afirmar(!sucio.includes('display:none'), 'un nombre con CSS dentro no sobrevive a la limpieza');
}

console.log('\nSaltarse pasos');
{
  const tailwind = ESQUEMAS.find((e) => e.clave === 'tailwind')!;

  // Lo que sale de fábrica: el esquema de Tailwind con el prefijo «text».
  const deFabrica: Ajustes = {
    ...base,
    prefijo: 'text',
    nombres: aplicarEsquema(tailwind, 2, 5),
  };
  const nombres = construirEscala(deFabrica).map((p) => p.nombre);
  afirmar(
    nombres.join(' ') ===
      '--text-xs --text-sm --text-base --text-lg --text-xl --text-2xl --text-3xl --text-4xl',
    `de fábrica sale la rampa de Tailwind (${nombres.join(' ')})`
  );

  // Un paso apagado sigue en la rampa pero no llega al CSS. Es la mitad de
  // la función: se ve el hueco, pero no se puede usar por accidente.
  const conSalto: Ajustes = { ...deFabrica, omitidos: [2] };
  const pasosConSalto = construirEscala(conSalto);
  afirmar(
    pasosConSalto.length === 8 && pasosConSalto.some((p) => p.omitido),
    'el paso apagado se queda en la rampa'
  );

  const css = aCss(pasosConSalto);
  const tamanos = (css.match(/--text-[\w-]+:/g) || []).filter((v) => !v.endsWith('-lh:'));
  afirmar(tamanos.length === 7, `el CSS declara 7 tamaños y no 8 (${tamanos.length})`);

  // Y la otra mitad, que es la que hace útil la función: los nombres se
  // corren para no dejar hueco. Saltarse el +2 no deja «lg» y luego
  // «3xl»; los que quedan siguen siendo lg, xl, 2xl, 3xl seguidos.
  const repartidos = aplicarEsquema(tailwind, 2, 5, [2]);
  const arribaSeguidos = [1, 3, 4, 5].map((i) => repartidos[String(i)]);
  afirmar(
    arribaSeguidos.join(' ') === 'lg xl 2xl 3xl',
    `los nombres que quedan siguen seguidos (${arribaSeguidos.join(' ')})`
  );
  afirmar(repartidos['2'] === undefined, 'y el apagado no se lleva ninguno');

  const negativos = aplicarEsquema(tailwind, 2, 5, [-1]);
  afirmar(negativos['-2'] === 'sm', 'lo mismo hacia abajo');

  // Un cruce con un paso apagado no es un cruce: no llega al CSS.
  const invertida: Ajustes = { ...base, razonMin: 0.9, razonMax: 0.9, arriba: 2, abajo: 0 };
  afirmar(
    buscarCruces(construirEscala(invertida), invertida).length > 0,
    'una escala invertida sí cruza'
  );
  const todoApagado: Ajustes = { ...invertida, omitidos: [1, 2] };
  afirmar(
    buscarCruces(construirEscala(todoApagado), todoApagado).length === 0,
    'y apagar los pasos que cruzan quita el aviso'
  );

  const repesApagadas = buscarNombresRepetidos(
    construirEscala({ ...base, nombres: { '0': 'title', '1': 'title' }, omitidos: [1] })
  );
  afirmar(repesApagadas.length === 0, 'dos nombres iguales no chocan si uno está apagado');
}

console.log('\nEl alto de línea sugerido');
{
  // Lo único que no puede fallar: que baje al subir el tamaño. Si en
  // algún tramo subiera, la sugerencia estaría diciendo lo contrario de
  // lo que dice explicar.
  let monotono = true;
  let previo = Infinity;
  for (let px = 8; px <= 200; px++) {
    const lh = alturaDeLinea(px);
    if (lh > previo + 0.0001) monotono = false;
    previo = lh;
  }
  afirmar(monotono, 'nunca sube: a más tamaño, menos aire entre líneas');

  afirmar(alturaDeLinea(16) === 1.5, `16 px pide 1,5 (${alturaDeLinea(16)})`);
  afirmar(alturaDeLinea(61) < 1.3, `61 px pide menos de 1,3 (${alturaDeLinea(61)})`);
  afirmar(alturaDeLinea(11) === 1.6, `11 px se queda en el tope de 1,6 (${alturaDeLinea(11)})`);
  afirmar(alturaDeLinea(400) >= 1.1, `un tamaño absurdo no baja del suelo (${alturaDeLinea(400)})`);

  // Sale del tamaño MÍNIMO del paso, que es la proporción más holgada de
  // las dos. Pasarse de holgado se nota menos que quedarse corto.
  const pasos = construirEscala(base);
  const p3 = pasos.find((p) => p.indice === 3)!;
  afirmar(
    p3.interlineado === alturaDeLinea(p3.minPx),
    `el paso +3 usa su mínimo (${p3.minPx.toFixed(0)} px → ${p3.interlineado})`
  );

  // Y llega al CSS pegado a su tamaño, no en una lista aparte al final.
  const css = aCss(pasos);
  const lineas = css.split('\n');
  const iTam = lineas.findIndex((l) => l.includes('--step-0:'));
  afirmar(
    lineas[iTam + 1]?.includes('--step-0-lh:') ?? false,
    'en el CSS va en la línea de justo debajo de su tamaño'
  );
}

console.log(fallos === 0 ? '\nTODO CORRECTO\n' : `\n${fallos} FALLOS\n`);
process.exit(fallos === 0 ? 0 : 1);
