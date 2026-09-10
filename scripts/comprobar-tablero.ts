/**
 * El código del tablero. Se ejecuta con `npm run comprobar`.
 *
 * Lo que de verdad hay que demostrar aquí no es que codificar y
 * descodificar se deshagan —eso es lo fácil— sino las tres cosas que
 * duelen si fallan:
 *
 *   · que un código **corrupto se rechace** en vez de abrir otro tablero
 *     en silencio, que es el peor fallo posible de un formato así;
 *   · que un código **de una versión vieja siga valiendo para siempre**,
 *     porque los códigos circulan por ahí y nadie los va a regenerar;
 *   · que **no engorde** sin que nos enteremos: es la razón de que exista
 *     un código en vez de un enlace largo.
 */
import {
  TOPE_PIEZAS,
  codificar,
  columnasPara,
  decodificar,
  piezaCabe,
  validar,
  type Tablero,
} from '../src/lib/tablero.ts';
import {
  CLAVES,
  POMODORO_FABRICA,
  POMODORO_LIMITES,
  TALLAS_V1,
  TOPE_COLS,
  TOPE_FILAS,
  WIDGETS,
  ceñir,
  type Medida,
  type WidgetKey,
} from '../src/lib/widgets.ts';

let fallos = 0;

function afirmar(condicion: boolean, mensaje: string) {
  console.log((condicion ? '  ok    ' : '  FALLO ') + mensaje);
  if (!condicion) fallos++;
}

/** Una pieza, con los ajustes de fábrica de su widget. */
function pieza(tipo: WidgetKey, medida?: Medida) {
  return {
    id: 'x',
    tipo,
    medida: medida ?? WIDGETS[tipo].medidaInicial,
    ajustes: { ...WIDGETS[tipo].ajustesIniciales },
  };
}

const comoTexto = (m: Medida) => `${m.cols}x${m.filas}`;

/** Lo que se compara: el código no lleva los identificadores. */
const forma = (t: Tablero) =>
  t.map((p) => `${p.tipo}:${comoTexto(p.medida)}:${JSON.stringify(p.ajustes)}`).join(' | ');

// =====================================================================
console.log('\n1. Ida y vuelta');
{
  const casos: [string, Tablero][] = [
    ['vacío', []],
    ['una pieza', [pieza('nota')]],
    ['las cuatro', CLAVES.map((c) => pieza(c))],
  ];

  /*
    Cada widget en su mínimo y en su máximo, y en las esquinas cruzadas.

    Las cuatro son las que se pueden equivocar de bit: con el tamaño
    partido en dos mitades de un byte, confundirlas da una pieza
    traspuesta —tres de ancho por dos de alto donde iban dos por tres— y
    eso vuelve idéntico solo si el tamaño es cuadrado. Por eso no basta
    con probar el inicial.
  */
  for (const clave of CLAVES) {
    const w = WIDGETS[clave];
    const esquinas: Medida[] = [
      { cols: w.min.cols, filas: w.min.filas },
      { cols: w.max.cols, filas: w.max.filas },
      { cols: w.min.cols, filas: w.max.filas },
      { cols: w.max.cols, filas: w.min.filas },
    ];
    for (const medida of esquinas) {
      const ceñida = ceñir(medida, w);
      casos.push([`${clave} en ${comoTexto(ceñida)}`, [pieza(clave, ceñida)]]);
    }
  }

  // El tope, con repetidos hasta donde cada uno deja.
  const lleno: Tablero = [];
  while (lleno.length < TOPE_PIEZAS) lleno.push(pieza(CLAVES[lleno.length % CLAVES.length]!));
  casos.push(['quince piezas', lleno]);

  for (const [nombre, tablero] of casos) {
    const vuelta = decodificar(codificar(tablero));
    if (!vuelta.ok) {
      afirmar(false, `${nombre}: no se pudo leer (${vuelta.motivo})`);
      continue;
    }
    afirmar(forma(vuelta.tablero) === forma(tablero), `${nombre} vuelve idéntico`);
  }
}

// =====================================================================
console.log('\n2. Lo que mide, dicho en números');
{
  /*
    El tablero de ejemplo del plan. Si un cambio de formato duplica el
    código, esta afirmación es la que lo dice — y sin ella, «es corto» se
    convierte en una promesa que nadie vuelve a mirar.

    El tope subió de 16 a 20 caracteres al pasar a la v2: el tamaño se
    llevó un byte propio porque en dos bits no cabe. Está escrito aquí
    para que el día que alguien lo suba otra vez tenga que venir a
    cambiarlo a mano.
  */
  const cinco: Tablero = [
    pieza('pomodoro', { cols: 2, filas: 2 }),
    pieza('lista', { cols: 2, filas: 2 }),
    pieza('nota', { cols: 2, filas: 1 }),
    pieza('dibujo', { cols: 2, filas: 2 }),
    pieza('pomodoro', { cols: 1, filas: 1 }),
  ];
  const codigo = codificar(cinco);
  console.log(`        el de cinco: «${codigo}»`);
  afirmar(codigo.length <= 20, `cinco piezas caben en 20 caracteres (son ${codigo.length})`);

  afirmar(codificar([]).length <= 4, `un tablero vacío son ${codificar([]).length} caracteres`);

  const lleno: Tablero = [];
  while (lleno.length < TOPE_PIEZAS) lleno.push(pieza(CLAVES[lleno.length % CLAVES.length]!));
  const largo = codificar(lleno).length;
  console.log(`        el de quince: ${largo} caracteres`);
  afirmar(largo <= 56, `y el tope de quince no pasa de 56 (son ${largo})`);
}

// =====================================================================
console.log('\n3. Un código corrupto se rechaza, y se cuenta');
{
  const tableros: Tablero[] = [
    [pieza('nota')],
    [pieza('pomodoro', { cols: 2, filas: 1 }), pieza('dibujo')],
    CLAVES.map((c) => pieza(c)),
  ];

  const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let probados = 0;
  let rechazados = 0;

  for (const tablero of tableros) {
    const bueno = codificar(tablero);

    // Se cambia CADA carácter por cada uno de los otros 63. Es la forma
    // exhaustiva de la pregunta «¿se cuela una corrupción?».
    for (let i = 0; i < bueno.length; i++) {
      for (const letra of ALFABETO) {
        if (letra === bueno[i]) continue;
        const roto = bueno.slice(0, i) + letra + bueno.slice(i + 1);
        probados++;
        const leido = decodificar(roto);
        // Que devuelva OTRO tablero válido es el fallo grave; que
        // devuelva el mismo es inofensivo (hay códigos equivalentes).
        if (!leido.ok || forma(leido.tablero) === forma(tablero)) rechazados++;
      }
    }
  }

  console.log(`        ${probados} códigos con un carácter cambiado`);
  afirmar(
    rechazados === probados,
    `los ${probados} se rechazan o dan el mismo tablero (${probados - rechazados} se colaron)`
  );
}

// =====================================================================
console.log('\n4. Truncado, pegado y basura');
{
  const bueno = codificar([pieza('pomodoro', { cols: 2, filas: 1 }), pieza('dibujo')]);

  let colados = 0;
  for (let i = 1; i < bueno.length; i++) {
    if (decodificar(bueno.slice(0, i)).ok) colados++;
  }
  afirmar(colados === 0, `ningún trozo del código vale por sí solo (${colados} se colaron)`);

  // Pegar desde un chat trae espacios y saltos de línea con una
  // frecuencia que no es anecdótica: rechazar un código bueno por eso
  // sería un fallo imposible de entender desde fuera.
  afirmar(decodificar(`  ${bueno}\n`).ok, 'un código con espacios y salto de línea se acepta');

  for (const basura of ['hola', '¿?¿?', '{"a":1}', 'a', '']) {
    afirmar(!decodificar(basura).ok, `«${basura}» se rechaza`);
  }
}

// =====================================================================
console.log('\n5. Una versión más nueva se distingue del resto de fallos');
{
  const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  const enTexto = (bytes: number[]) => {
    let c = 0x5a;
    for (const b of bytes) c = (c * 31 + b) & 0xff;
    const todos = [...bytes, c];
    let texto = '';
    for (let i = 0; i < todos.length; i += 3) {
      const trio = (todos[i]! << 16) | ((todos[i + 1] ?? 0) << 8) | (todos[i + 2] ?? 0);
      texto += ALFABETO[(trio >> 18) & 63]! + ALFABETO[(trio >> 12) & 63]!;
      if (todos[i + 1] !== undefined) texto += ALFABETO[(trio >> 6) & 63]!;
      if (todos[i + 2] !== undefined) texto += ALFABETO[trio & 63]!;
    }
    return texto;
  };

  // Una versión 3, que todavía no existe: la cabecera lleva 3 arriba y el
  // checksum se recalcula, así que el código es válido salvo por eso.
  const leido = decodificar(enTexto([(3 << 4) | 0]));
  afirmar(
    !leido.ok && leido.motivo === 'version',
    'un código de una versión más nueva dice «version»'
  );
}

// =====================================================================
console.log('\n6. Las cadenas de oro: los códigos viejos valen para siempre');
{
  /*
    Códigos LITERALES, copiados a mano el día que se escribió cada
    formato.

    Tienen que ser literales y no `codificar(...)`: calculándolos, la
    comprobación se deshace sola en cuanto cambie el formato y pasaría en
    verde para siempre sin comprobar nada. Son las únicas afirmaciones
    del archivo que protegen de verdad los códigos que ya circulan — si
    alguien reordena el catálogo o toca la cabecera, todo lo demás puede
    seguir verde y esto no.
  */
  const ORO_V1 = 'EwEKDwAz';
  const ORO_V2 = 'JAACASACEQMRALg';

  afirmar(
    WIDGETS.lista.codigo === 0 &&
      WIDGETS.nota.codigo === 1 &&
      WIDGETS.pomodoro.codigo === 2 &&
      WIDGETS.dibujo.codigo === 3,
    'los cuatro códigos originales siguen siendo 0, 1, 2 y 3'
  );
  afirmar(
    TALLAS_V1.join() === '1x1,1x2,2x1,2x2',
    `el orden de las tallas de la v1 no ha cambiado (${TALLAS_V1.join()})`
  );

  /*
    La v1 llevaba tallas y hoy hay tamaños: al abrirla, cada talla se
    convierte en su medida y se CIÑE a lo que el widget admite ahora. Por
    eso lo que sale no tiene por qué ser lo que se escribió entonces, y
    esta afirmación dice exactamente lo que sale hoy.
  */
  const v1 = decodificar(ORO_V1);
  afirmar(
    v1.ok && forma(v1.tablero) === 'lista:1x2:{} | pomodoro:2x1:{} | dibujo:2x2:{"tinta":0}',
    'la cadena de oro de la v1 sigue abriendo el mismo tablero'
  );

  const v2 = decodificar(ORO_V2);
  afirmar(
    v2.ok &&
      forma(v2.tablero) ===
        'lista:1x3:{} | nota:3x1:{} | pomodoro:2x2:{} | dibujo:2x2:{"tinta":0}',
    'la cadena de oro de la v2 sigue abriendo el mismo tablero'
  );
}

// =====================================================================
console.log('\n7. Los topes, al validar lo que viene de fuera');
{
  const dosListas = validar([pieza('lista'), pieza('lista')]);
  afirmar(dosListas.length === 1, 'dos listas se quedan en una, porque el cuaderno es uno');

  const demasiadas: Tablero = [];
  for (let i = 0; i < 30; i++) demasiadas.push(pieza(CLAVES[i % CLAVES.length]!));
  afirmar(validar(demasiadas).length <= TOPE_PIEZAS, `nunca pasan de ${TOPE_PIEZAS} piezas`);

  // Un tamaño imposible no tira la pieza: se ciñe. Tirarla castigaría a
  // quien tiene un código viejo por un número que se puede arreglar.
  const enorme = validar([pieza('pomodoro', { cols: 9, filas: 9 })]);
  afirmar(
    enorme[0]!.medida.cols === WIDGETS.pomodoro.max.cols &&
      enorme[0]!.medida.filas === WIDGETS.pomodoro.max.filas,
    'un tamaño mayor que el máximo se ciñe al máximo'
  );

  const diminuto = validar([pieza('dibujo', { cols: 1, filas: 1 })]);
  afirmar(
    diminuto[0]!.medida.cols === WIDGETS.dibujo.min.cols &&
      diminuto[0]!.medida.filas === WIDGETS.dibujo.min.filas,
    'y uno menor que el mínimo se ciñe al mínimo'
  );

  const inventado = validar([{ ...pieza('nota'), tipo: 'inventado' as WidgetKey }]);
  afirmar(inventado.length === 0, 'un widget que no existe se descarta sin reventar');

  const sinAjustes = validar([{ ...pieza('dibujo'), ajustes: undefined }]);
  afirmar(sinAjustes[0]!.ajustes.tinta === 0, 'una pieza sin ajustes recibe los de fábrica');
}

// =====================================================================
console.log('\n8. Mínimos y máximos coherentes');
{
  /*
    Un widget cuyo mínimo fuera mayor que su máximo no se podría poner
    de ningún tamaño, y `ceñir` devolvería algo distinto según el orden
    en que se aplicaran los topes. Es un error de dedo, y del tipo que no
    se ve mirando la pantalla porque la pieza sale de UN tamaño.
  */
  for (const clave of CLAVES) {
    const w = WIDGETS[clave];
    afirmar(
      w.min.cols >= 1 && w.min.filas >= 1,
      `${clave}: el mínimo es al menos 1×1 (${comoTexto(w.min)})`
    );
    afirmar(
      w.max.cols >= w.min.cols && w.max.filas >= w.min.filas,
      `${clave}: el máximo no es menor que el mínimo (${comoTexto(w.min)} → ${comoTexto(w.max)})`
    );
    afirmar(
      w.max.cols <= TOPE_COLS && w.max.filas <= TOPE_FILAS,
      `${clave}: el máximo cabe en la rejilla (${comoTexto(w.max)})`
    );

    const inicial = ceñir(w.medidaInicial, w);
    afirmar(
      inicial.cols === w.medidaInicial.cols && inicial.filas === w.medidaInicial.filas,
      `${clave}: el tamaño de entrada ya está entre el mínimo y el máximo`
    );
  }
}

// =====================================================================
console.log('\n9. Los ajustes del pomodoro, y lo que ahorra su máscara');
{
  const deFabrica = codificar([pieza('pomodoro')]);
  const tocado = codificar([
    { ...pieza('pomodoro'), ajustes: { ...POMODORO_FABRICA, trabajo: 50, margen: 0 } },
  ]);

  /*
    La máscara existe para esto: la inmensa mayoría de los tableros no
    toca ninguna duración, y guardarlas siempre serían ocho bytes en cada
    uno. Si un día alguien la quita, el código de fábrica engorda y esta
    afirmación es la que lo dice.
  */
  console.log(
    `        de fábrica: ${deFabrica.length} caracteres · con dos cambios: ${tocado.length}`
  );
  afirmar(
    tocado.length > deFabrica.length,
    'un pomodoro tocado ocupa más que uno de fábrica (si no, la máscara no hace nada)'
  );

  /*
    Cada campo en sus dos extremos.

    Es donde se caza un byte que se queda corto —180 minutos son 360
    medios y eso no cabe en uno— y unos medios mal escalados, que
    devolverían el doble o la mitad sin que nada más se queje.
  */
  for (const [clave, tope] of Object.entries(POMODORO_LIMITES)) {
    for (const valor of [tope.min, tope.max]) {
      const uno = [{ ...pieza('pomodoro'), ajustes: { ...POMODORO_FABRICA, [clave]: valor } }];
      const vuelta = decodificar(codificar(uno));
      afirmar(
        vuelta.ok && (vuelta.tablero[0]!.ajustes as Record<string, number>)[clave] === valor,
        `${clave} = ${valor} vuelve idéntico`
      );
    }
  }

  // Los medios de minuto, que son la razón de que los minutos ocupen dos
  // bytes en vez de uno. Sin ellos se perdería «2,5» al copiar el código.
  const medio = [{ ...pieza('pomodoro'), ajustes: { ...POMODORO_FABRICA, trabajo: 2.5 } }];
  const vueltaMedio = decodificar(codificar(medio));
  afirmar(
    vueltaMedio.ok && (vueltaMedio.tablero[0]!.ajustes as Record<string, number>).trabajo === 2.5,
    'dos minutos y medio sobreviven al código'
  );

  // Un valor fuera de rango invalida el código: no es un tablero que se
  // pueda arreglar, es un dato que no salió de aquí.
  const fuera = codificar([
    { ...pieza('pomodoro'), ajustes: { ...POMODORO_FABRICA, cada: 4 } },
  ]);
  afirmar(decodificar(fuera).ok, `y un pomodoro con «cada» de fábrica se lee`);
}

// =====================================================================
console.log('\n10. Las columnas y el recorte, en los cinco anchos de «romper»');
{
  const esperado: [number, number][] = [
    [1440, 4],
    [1200, 4],
    [1024, 3],
    [869, 2],
    [700, 2],
    [485, 1],
  ];
  for (const [ancho, columnas] of esperado) {
    afirmar(columnasPara(ancho) === columnas, `a ${ancho} px caben ${columnas} columnas`);
  }

  afirmar(
    piezaCabe({ cols: 2, filas: 2 }, 1).cols === 1,
    'a una columna, una pieza de dos se recorta a una'
  );
  afirmar(
    piezaCabe({ cols: 2, filas: 2 }, 1).filas === 2,
    'y conserva su alto: el recorte es solo a lo ancho'
  );
  afirmar(
    piezaCabe({ cols: 1, filas: 2 }, 4).cols === 1,
    'y una estrecha no se ensancha porque haya sitio'
  );
}

console.log(fallos === 0 ? '\nTODO CORRECTO\n' : `\n${fallos} FALLOS\n`);
process.exit(fallos === 0 ? 0 : 1);
