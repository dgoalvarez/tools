/**
 * El código del tablero. Se ejecuta con `npm run comprobar`.
 *
 * Lo que de verdad hay que demostrar aquí no es que codificar y
 * descodificar se deshagan —eso es lo fácil— sino las tres cosas que
 * duelen si fallan:
 *
 *   · que un código **corrupto se rechace** en vez de abrir otro tablero
 *     en silencio, que es el peor fallo posible de un formato así;
 *   · que un código **de la versión 1 siga valiendo para siempre**,
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
import { CLAVES, TALLAS, WIDGETS, type Talla, type WidgetKey } from '../src/lib/widgets.ts';

let fallos = 0;

function afirmar(condicion: boolean, mensaje: string) {
  console.log((condicion ? '  ok    ' : '  FALLO ') + mensaje);
  if (!condicion) fallos++;
}

/** Una pieza, con los ajustes de fábrica de su widget. */
function pieza(tipo: WidgetKey, talla?: Talla) {
  return {
    id: 'x',
    tipo,
    talla: talla ?? WIDGETS[tipo].tallas[0]!,
    ajustes: { ...WIDGETS[tipo].ajustesIniciales },
  };
}

/** Lo que se compara: el código no lleva los identificadores. */
const forma = (t: Tablero) =>
  t.map((p) => `${p.tipo}:${p.talla}:${JSON.stringify(p.ajustes)}`).join(' | ');

// =====================================================================
console.log('\n1. Ida y vuelta');
{
  const casos: [string, Tablero][] = [
    ['vacío', []],
    ['una pieza', [pieza('nota')]],
    ['las cuatro', CLAVES.map((c) => pieza(c))],
  ];

  // Cada widget en cada talla que declara: es donde se cazaría una talla
  // mal indexada, que devolvería otra pieza sin que nada más se queje.
  for (const clave of CLAVES) {
    for (const talla of WIDGETS[clave].tallas) {
      casos.push([`${clave} en ${talla}`, [pieza(clave, talla)]]);
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
  // El tablero de ejemplo del plan. Si un cambio de formato duplica el
  // código, esta afirmación es la que lo dice — y sin ella, «es corto»
  // se convierte en una promesa que nadie vuelve a mirar.
  const cinco: Tablero = [
    pieza('pomodoro', '2x2'),
    pieza('lista', '2x2'),
    pieza('nota', '2x1'),
    pieza('dibujo', '2x2'),
    pieza('pomodoro', '1x1'),
  ];
  const codigo = codificar(cinco);
  console.log(`        el de cinco: «${codigo}»`);
  afirmar(codigo.length <= 16, `cinco piezas caben en 16 caracteres (son ${codigo.length})`);

  afirmar(codificar([]).length <= 4, `un tablero vacío son ${codificar([]).length} caracteres`);

  const lleno: Tablero = [];
  while (lleno.length < TOPE_PIEZAS) lleno.push(pieza(CLAVES[lleno.length % CLAVES.length]!));
  const largo = codificar(lleno).length;
  console.log(`        el de quince: ${largo} caracteres`);
  afirmar(largo <= 40, `y el tope de quince no pasa de 40 (son ${largo})`);
}

// =====================================================================
console.log('\n3. Un código corrupto se rechaza, y se cuenta');
{
  const tableros: Tablero[] = [
    [pieza('nota')],
    [pieza('pomodoro', '2x1'), pieza('dibujo')],
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
  const bueno = codificar([pieza('pomodoro', '2x1'), pieza('dibujo')]);

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
console.log('\n5. La versión se distingue del resto de fallos');
{
  // Un código de la versión 2: la cabecera lleva 2 en los cuatro bits de
  // arriba, y el checksum se recalcula para que sea válido salvo por eso.
  const bytes = [(2 << 4) | 0];
  let c = 0x5a;
  for (const b of bytes) c = (c * 31 + b) & 0xff;
  const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const dos = [...bytes, c];
  let texto = '';
  for (let i = 0; i < dos.length; i += 3) {
    const trio = (dos[i]! << 16) | ((dos[i + 1] ?? 0) << 8) | (dos[i + 2] ?? 0);
    texto += ALFABETO[(trio >> 18) & 63]! + ALFABETO[(trio >> 12) & 63]!;
    if (dos[i + 1] !== undefined) texto += ALFABETO[(trio >> 6) & 63]!;
    if (dos[i + 2] !== undefined) texto += ALFABETO[trio & 63]!;
  }

  const leido = decodificar(texto);
  afirmar(!leido.ok && leido.motivo === 'version', 'un código de otra versión dice «version»');
}

// =====================================================================
console.log('\n6. La cadena de oro: los códigos de la v1 valen para siempre');
{
  /*
    Un código LITERAL de la versión 1, copiado a mano el día que se
    escribió el formato.

    Tiene que ser un literal y no `codificar(...)`: calculándolo, la
    comprobación se deshace sola en cuanto cambie el formato y pasaría en
    verde para siempre sin comprobar nada. Así es la única afirmación del
    archivo que protege de verdad los códigos que ya circulan — si
    alguien reordena el catálogo o toca la cabecera, todo lo demás puede
    seguir verde y esto no.
  */
  const ORO = 'EwEKDwAz';

  afirmar(
    WIDGETS.lista.codigo === 0 &&
      WIDGETS.nota.codigo === 1 &&
      WIDGETS.pomodoro.codigo === 2 &&
      WIDGETS.dibujo.codigo === 3,
    'los cuatro códigos de la v1 siguen siendo 0, 1, 2 y 3'
  );
  afirmar(
    TALLAS.join() === '1x1,1x2,2x1,2x2',
    `el orden de las tallas no ha cambiado (${TALLAS.join()})`
  );

  const leido = decodificar(ORO);
  afirmar(
    leido.ok && forma(leido.tablero) === 'lista:1x2:{} | pomodoro:2x1:{} | dibujo:2x2:{"tinta":0}',
    'y la cadena de oro sigue abriendo el mismo tablero'
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

  const tallaMala = validar([{ ...pieza('pomodoro'), talla: '9x9' as Talla }]);
  afirmar(
    tallaMala[0]!.talla === WIDGETS.pomodoro.tallas[0],
    'una talla que el widget no declara cae a la de fábrica'
  );

  const inventado = validar([{ ...pieza('nota'), tipo: 'inventado' as WidgetKey }]);
  afirmar(inventado.length === 0, 'un widget que no existe se descarta sin reventar');

  const sinAjustes = validar([{ ...pieza('dibujo'), ajustes: undefined }]);
  afirmar(sinAjustes[0]!.ajustes.tinta === 0, 'una pieza sin ajustes recibe los de fábrica');
}

// =====================================================================
console.log('\n8. Las columnas y el recorte, en los cinco anchos de «romper»');
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

  afirmar(piezaCabe('2x2', 1).cols === 1, 'a una columna, una pieza de dos se recorta a una');
  afirmar(
    piezaCabe('2x2', 1).filas === 2,
    'y conserva su alto: a una columna, la talla es el alto'
  );
  afirmar(piezaCabe('1x2', 4).cols === 1, 'y una estrecha no se ensancha porque haya sitio');
}

console.log(fallos === 0 ? '\nTODO CORRECTO\n' : `\n${fallos} FALLOS\n`);
process.exit(fallos === 0 ? 0 : 1);
