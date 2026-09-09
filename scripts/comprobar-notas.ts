/**
 * Comprobación de la libreta. Se ejecuta con `npm run comprobar`.
 *
 * Lo que de verdad hay que demostrar aquí no es que añadir una tarea
 * añada una tarea, sino lo otro: que **lo guardado se relee tal cual** y
 * que **lo guardado roto no tumba la herramienta**.
 *
 * Esto último no es una precaución teórica. Lo que hay en
 * `sessionStorage` no es un dato del programa: es una cadena que puede
 * haber escrito otra versión de esta herramienta, otra pestaña, una
 * extensión o alguien a mano desde la consola. Si la isla se fía y hace
 * `tareas.map(...)` sobre lo que salga, un almacenamiento con basura no
 * enseña una lista vacía — tumba la página, y encima en cada recarga
 * hasta que alguien sepa vaciarlo.
 */
import {
  CLAVE,
  LIMITE_LINEA,
  LIMITE_TAREAS,
  VERSION,
  aMarkdown,
  anadir,
  borrar,
  borrarHechas,
  cuantasHechas,
  escribir,
  guardar,
  leer,
  limpiarLinea,
  marcar,
  mover,
  aProporcion,
  cajaDePixeles,
  rellenar,
  type Caja,
  notaAMarkdown,
  nuevaTarea,
  restaurar,
  retiradas,
  sanearNota,
  textoDeNota,
  type Tarea,
} from '../src/lib/notas.ts';

let fallos = 0;

function afirmar(condicion: boolean, mensaje: string) {
  console.log((condicion ? '  ok    ' : '  FALLO ') + mensaje);
  if (!condicion) fallos++;
}

/** Una lista de partida, con la del medio marcada. */
function lista(): Tarea[] {
  let t: Tarea[] = [];
  t = anadir(t, 'revisar el contraste');
  t = anadir(t, 'subir la rama');
  t = anadir(t, 'escribir el mensaje');
  return marcar(t, t[1].id, true);
}

const textos = (t: Tarea[]) => t.map((x) => x.texto).join(' | ');

// =====================================================================
console.log('\n1. Añadir, marcar y borrar');
{
  const t = lista();
  afirmar(t.length === 3, 'tres líneas');
  afirmar(
    textos(t) === 'revisar el contraste | subir la rama | escribir el mensaje',
    'en su orden'
  );
  afirmar(cuantasHechas(t) === 1, 'una marcada');

  afirmar(anadir(t, '   ').length === 3, 'un texto en blanco no añade nada');
  afirmar(anadir(t, '\n\t ').length === 3, 'ni uno que solo son saltos y tabuladores');

  const sinPrimera = borrar(t, t[0].id);
  afirmar(
    sinPrimera.length === 2 && sinPrimera[0].texto === 'subir la rama',
    'borrar quita la suya'
  );
  afirmar(borrar(t, 'no-existe').length === 3, 'borrar algo que no está no borra nada');

  const desmarcada = marcar(t, t[1].id, false);
  afirmar(cuantasHechas(desmarcada) === 0, 'desmarcar también funciona');

  // Las funciones no tocan la lista que reciben: la isla compara por
  // identidad para decidir si repinta.
  afirmar(cuantasHechas(t) === 1, 'y la lista original no se toca');

  const editada = escribir(t, t[0].id, 'revisar el contraste otra vez');
  afirmar(editada[0].texto === 'revisar el contraste otra vez', 'el texto se cambia en su sitio');
  afirmar(editada[1].texto === t[1].texto, 'y las demás se quedan como estaban');

  // Al escribir NO se recorta: quien está tecleando tiene derecho a un
  // espacio al final mientras piensa la siguiente palabra.
  afirmar(
    escribir(t, t[0].id, 'a medio escribir ')[0].texto === 'a medio escribir ',
    'escribiendo, el espacio del final se respeta'
  );
}

// =====================================================================
console.log('\n2. Mover, y los extremos');
{
  const t = lista();

  const subida = mover(t, t[1].id, -1);
  afirmar(
    textos(subida) === 'subir la rama | revisar el contraste | escribir el mensaje',
    'subir intercambia con la de arriba'
  );
  afirmar(cuantasHechas(subida) === 1, 'y se lleva su marca consigo');

  const bajada = mover(t, t[1].id, 1);
  afirmar(
    textos(bajada) === 'revisar el contraste | escribir el mensaje | subir la rama',
    'bajar intercambia con la de abajo'
  );

  // El mismo array y no una copia: así la isla sabe que no pasó nada.
  afirmar(mover(t, t[0].id, -1) === t, 'subir la primera no hace nada');
  afirmar(mover(t, t[2].id, 1) === t, 'bajar la última tampoco');
  afirmar(mover(t, 'no-existe', 1) === t, 'ni mover algo que no está');

  // Ida y vuelta deja todo como estaba, incluidos los identificadores.
  const ida = mover(t, t[0].id, 1);
  const vuelta = mover(ida, t[0].id, -1);
  afirmar(
    vuelta.map((x) => x.id).join() === t.map((x) => x.id).join(),
    'bajar y volver a subir deja la lista igual'
  );
}

// =====================================================================
console.log('\n3. Borrar las hechas');
{
  let t = lista();
  t = marcar(t, t[0].id, true);

  const quedan = borrarHechas(t);
  afirmar(quedan.length === 1, 'quita exactamente las marcadas');
  afirmar(quedan[0].texto === 'escribir el mensaje', 'y deja la que no lo estaba');
  afirmar(borrarHechas(quedan).length === 1, 'sin ninguna marcada no quita nada');
  afirmar(borrarHechas([]).length === 0, 'con la lista vacía no revienta');
}

// =====================================================================
console.log('\n4. El Markdown que sale');
{
  const t = lista();
  const md = aMarkdown(t);
  afirmar(
    md === '- [ ] revisar el contraste\n- [x] subir la rama\n- [ ] escribir el mensaje',
    'casillas marcadas y sin marcar, una por línea'
  );
  afirmar(aMarkdown([]) === '', 'una lista vacía da una cadena vacía');

  // Los corchetes y los guiones no se escapan: dentro de un elemento de
  // lista no cambian de significado, y escaparlos ensuciaría lo que se
  // pega. Lo que sí hace falta es que no rompan el formato.
  const raros = anadir([], '- [x] esto ya parecía una casilla # con almohadilla');
  afirmar(
    aMarkdown(raros) === '- [ ] - [x] esto ya parecía una casilla # con almohadilla',
    'un texto que ya parece Markdown va tal cual'
  );

  const conSalto = anadir([], 'primera línea\nsegunda línea');
  afirmar(
    aMarkdown(conSalto) === '- [ ] primera línea segunda línea',
    'pegar dos párrafos no parte la casilla en dos'
  );
}

// =====================================================================
console.log('\n5. Guardar y volver a leer');
{
  const t = lista();
  const nota = 'Rama: acento/texto\n\nÉsta lleva tildes, ñ y 🎧\n\tY un tabulador.';
  const vuelta = leer(guardar({ tareas: t, nota }));

  afirmar(textos(vuelta.tareas) === textos(t), 'las tareas vuelven idénticas');
  afirmar(
    vuelta.tareas.map((x) => x.id).join() === t.map((x) => x.id).join(),
    'con sus identificadores'
  );
  afirmar(cuantasHechas(vuelta.tareas) === 1, 'y con sus marcas');
  afirmar(vuelta.nota === nota, 'la nota vuelve con tildes, emoji y saltos de línea');

  // Quinientas líneas: no es un caso raro, es una sesión larga.
  let muchas: Tarea[] = [];
  for (let i = 0; i < LIMITE_TAREAS; i++) muchas = anadir(muchas, `tarea ${i}`);
  const releidas = leer(guardar({ tareas: muchas, nota: '' })).tareas;
  afirmar(releidas.length === LIMITE_TAREAS, `${LIMITE_TAREAS} líneas se releen enteras`);
  afirmar(releidas[499].texto === 'tarea 499', 'y la última es la última');
  afirmar(anadir(muchas, 'una más').length === LIMITE_TAREAS, 'pasado el tope no se añade más');
}

// =====================================================================
console.log('\n6. Lo guardado roto no tumba nada');
{
  const rotos: [string, string][] = [
    ['nada', ''],
    ['no es JSON', 'esto no es json {{{'],
    ['un número suelto', '42'],
    ['null', 'null'],
    ['un array de números', '[1, 2, 3]'],
    ['un array de tareas sin envoltorio', '[{"id":"a","texto":"hola","hecha":false}]'],
    ['de otra versión', JSON.stringify({ v: 99, tareas: [{ texto: 'hola' }], nota: 'x' })],
    ['sin versión', JSON.stringify({ tareas: [{ texto: 'hola' }] })],
  ];

  for (const [nombre, bruto] of rotos) {
    const c = leer(bruto);
    afirmar(c.tareas.length === 0 && c.nota === '', `${nombre.padEnd(34)} abre la libreta vacía`);
  }

  afirmar(leer(null).tareas.length === 0, 'y no haber guardado nunca, también');
  afirmar(leer(undefined).tareas.length === 0, 'y undefined, también');
}

// =====================================================================
console.log('\n7. Una línea rota se cae sola, las buenas se quedan');
{
  const mezcla = JSON.stringify({
    v: VERSION,
    tareas: [
      { id: 'a', texto: 'la buena', hecha: false },
      { id: 'b', hecha: true },
      { id: 'c', texto: '   ', hecha: false },
      { id: 'd', texto: 42, hecha: false },
      null,
      'una cadena suelta',
      { id: 'e', texto: 'la otra buena', hecha: 'sí' },
    ],
    nota: 'sigue aquí',
  });

  const c = leer(mezcla);
  afirmar(c.tareas.length === 2, 'se quedan las dos que valen');
  afirmar(textos(c.tareas) === 'la buena | la otra buena', 'y son las que valen');
  afirmar(c.tareas[1].hecha === false, 'un «hecha» que no es booleano cuenta como no hecha');
  afirmar(c.nota === 'sigue aquí', 'y la nota sobrevive a las líneas rotas');

  const sinId = leer(JSON.stringify({ v: VERSION, tareas: [{ texto: 'sin id' }], nota: '' }));
  afirmar(sinId.tareas.length === 1 && !!sinId.tareas[0].id, 'una línea sin id recibe uno nuevo');

  const notaRara = leer(JSON.stringify({ v: VERSION, tareas: [], nota: { no: 'soy texto' } }));
  afirmar(notaRara.nota === '', 'una nota que no es texto se queda en blanco');
}

// =====================================================================
console.log('\n8. Los topes y la limpieza');
{
  afirmar(
    limpiarLinea('  hola   qué   tal  ') === 'hola qué tal',
    'los espacios seguidos se juntan'
  );
  afirmar(limpiarLinea('a\nb\r\nc') === 'a b c', 'los saltos de línea también');
  afirmar(limpiarLinea('   ') === '', 'lo que solo son espacios se queda en nada');

  const larga = 'x'.repeat(LIMITE_LINEA + 200);
  afirmar(nuevaTarea(larga).texto.length === LIMITE_LINEA, `una línea se corta en ${LIMITE_LINEA}`);
  afirmar(
    escribir(anadir([], 'algo'), anadir([], 'algo')[0].id, larga).length === 1,
    'y escribir una larguísima no revienta'
  );

  const guardado = JSON.parse(guardar({ tareas: [], nota: 'x'.repeat(200_000) }));
  afirmar(guardado.nota.length === 100_000, 'la nota se corta en cien mil caracteres');
  afirmar(guardado.v === VERSION, 'y lo guardado lleva su versión');
}

// =====================================================================
console.log('\n9. La clave del almacenamiento');
{
  // Va con el prefijo del sitio, como el tema y el riel: en un dominio
  // compartido, una clave llamada «notas» a secas se pisa con cualquiera.
  afirmar(CLAVE.startsWith('dgo-tools-'), `la clave lleva el prefijo del sitio (${CLAVE})`);
}

// =====================================================================
console.log('\n10. El saneador de la nota');
{
  /*
    Esto es lo que se pinta con `dangerouslySetInnerHTML`, así que la
    pregunta no es si funciona con lo normal —eso se ve mirando— sino si
    aguanta lo que no lo es. Las cargas de aquí abajo son las de siempre:
    las que trae una nota pegada desde una página cualquiera.
  */
  const venenos: [string, string][] = [
    ['<script>alert(1)</script>', 'un script entero'],
    ['<scr' + 'ipt>alert(1)', 'un script sin cerrar'],
    ['<img src=x onerror=alert(1)>', 'un manejador en un atributo'],
    ['<b onclick="robar()">hola</b>', 'un manejador en una etiqueta permitida'],
    ['<a href="javascript:alert(1)">clic</a>', 'un enlace con javascript:'],
    ['<div style="position:fixed;inset:0">tapa</div>', 'un style que tapa la página'],
    ['<iframe src="//malo"></iframe>', 'un marco'],
    ['<svg><script>alert(1)</script></svg>', 'un script dentro de un svg'],
    ['<b class="x" id="y" data-z="1">hola</b>', 'atributos inocentes'],
  ];

  for (const [entrada, que] of venenos) {
    const salida = sanearNota(entrada);
    const limpio =
      !/on\w+\s*=/i.test(salida) &&
      !/javascript:/i.test(salida) &&
      !/<script|<iframe|<img|<a\b|<svg|style=|class=|id=|href=/i.test(salida);
    afirmar(limpio, `${que} no sobrevive  →  ${JSON.stringify(salida)}`);
  }

  // Y lo que SÍ tiene que sobrevivir, que es la otra mitad: un saneador
  // que se lo come todo es igual de inútil que uno que no filtra nada.
  const bueno = '<b>hola</b> <i>que</i> <u>tal</u> <s>ya</s><ul><li>uno</li></ul>';
  afirmar(sanearNota(bueno) === bueno, 'los seis formatos de la barra pasan enteros');
  afirmar(sanearNota('<B>hola</B>') === '<b>hola</b>', 'las etiquetas en mayúsculas se normalizan');

  afirmar(textoDeNota('<p><br></p>') === '', 'un contenteditable vacío no cuenta como texto');
  afirmar(
    textoDeNota('<b>uno</b><br><i>dos</i>') === 'uno\ndos',
    'el texto pelado conserva los saltos'
  );
}

// =====================================================================
console.log('\n11. La nota, en Markdown');
{
  afirmar(
    notaAMarkdown('<b>negrita</b> y <i>cursiva</i>') === '**negrita** y *cursiva*',
    'negrita y cursiva viajan'
  );
  afirmar(notaAMarkdown('<s>tachado</s>') === '~~tachado~~', 'el tachado viaja');
  // El subrayado se pierde y es a propósito: Markdown no lo tiene, y una
  // marca inventada se veria como dos guiones sueltos en el destino.
  afirmar(
    notaAMarkdown('<u>subrayado</u>') === 'subrayado',
    'el subrayado se queda en texto, no inventa marca'
  );

  const conListas = '<ul><li>uno</li><li>dos</li></ul><ol><li>a</li><li>b</li></ol>';
  const md = notaAMarkdown(conListas);
  afirmar(
    md.includes('- uno') && md.includes('- dos'),
    `las viñetas salen con guion (${JSON.stringify(md)})`
  );
  afirmar(md.includes('1. a') && md.includes('2. b'), 'la lista numerada se numera de verdad');
}

// =====================================================================
console.log('\n12. Deshacer un borrado devuelve lo borrado a su sitio');
{
  // Cinco líneas para poder borrar salteado, que es lo que hace «Borrar
  // las hechas» y donde un deshacer ingenuo se delata.
  let t = anadir(anadir(anadir(anadir(anadir([], 'a'), 'b'), 'c'), 'd'), 'e');

  t = marcar(t, t[1].id, true);
  t = marcar(t, t[3].id, true);

  const despues = borrarHechas(t);
  const fuera = retiradas(t, despues);

  afirmar(fuera.length === 2, 'se apuntan las dos que se fueron');
  afirmar(
    fuera[0].posicion === 1 && fuera[1].posicion === 3,
    'con la posición de la que salieron, no con la de después'
  );

  const vuelta = restaurar(despues, fuera);
  afirmar(
    vuelta.map((x) => x.texto).join('') === 'abcde',
    `vuelven a su sitio y no al final (${vuelta.map((x) => x.texto).join('')})`
  );

  // El caso que decidió que esto RESTAURA en vez de revertir: se borra
  // sin querer, se siguen apuntando cosas, y luego se deshace. Con un
  // deshacer que sustituye la lista entera, las nuevas desaparecerían.
  const conMas = anadir(anadir(despues, 'f'), 'g');
  const mezcla = restaurar(conMas, fuera);
  afirmar(
    mezcla.length === 7 &&
      mezcla.some((x) => x.texto === 'f') &&
      mezcla.some((x) => x.texto === 'g'),
    'lo escrito después del borrado sobrevive al deshacer'
  );

  // Dos pulsaciones seguidas del mismo botón no duplican nada.
  afirmar(restaurar(vuelta, fuera).length === 5, 'deshacer dos veces no duplica');

  // Un borrado de una sola línea, que es el otro botón.
  const una = borrar(t, t[0].id);
  const fueraUna = retiradas(t, una);
  afirmar(fueraUna.length === 1 && fueraUna[0].posicion === 0, 'el borrado de una sola se apunta');
  afirmar(restaurar(una, fueraUna)[0].texto === 'a', 'y vuelve a la cabeza de la lista');

  afirmar(retiradas(t, t).length === 0, 'sin borrar nada no hay nada que deshacer');
  afirmar(restaurar([], fuera).length === 2, 'con la lista vaciada entera vuelven las dos');
}

// =====================================================================
console.log('\n13. El encuadre de la descarga del dibujo');
{
  /** Un lienzo RGBA en blanco, para pintarle cosas a mano. */
  function lienzo(ancho: number, alto: number) {
    return new Uint8ClampedArray(ancho * alto * 4);
  }
  function poner(d: Uint8ClampedArray, ancho: number, x: number, y: number, c: number[]) {
    const i = (y * ancho + x) * 4;
    d[i] = c[0]!;
    d[i + 1] = c[1]!;
    d[i + 2] = c[2]!;
    d[i + 3] = c[3]!;
  }

  const NEGRO = [0, 0, 0, 255];

  // Una mancha de (10,4) a (13,6): cuatro columnas por tres filas.
  const d = lienzo(20, 10);
  for (let y = 4; y <= 6; y++) for (let x = 10; x <= 13; x++) poner(d, 20, x, y, NEGRO);

  const c = cajaDePixeles(d, 20, 10, 2)!;
  afirmar(c.x === 8 && c.y === 2, `arranca en el mínimo menos el margen (${c.x},${c.y})`);
  afirmar(
    c.ancho === 8 && c.alto === 7,
    `y mide lo pintado más dos márgenes, contando el último píxel (${c.ancho}×${c.alto})`
  );

  afirmar(cajaDePixeles(lienzo(20, 10), 20, 10, 2) === null, 'un lienzo vacío no tiene caja');

  // Lo transparente no cuenta aunque lleve color: el lienzo se sirve sin
  // fondo, así que un píxel con alfa 0 es sitio vacío.
  const fantasma = lienzo(20, 10);
  poner(fantasma, 20, 5, 5, [255, 0, 0, 0]);
  afirmar(cajaDePixeles(fantasma, 20, 10, 0) === null, 'un píxel con alfa 0 no cuenta');

  afirmar(aProporcion(c, 0) === c, 'con «ceñido» la caja no se toca');

  const cuadrada = aProporcion(c, 1);
  afirmar(
    cuadrada.ancho === 8 && cuadrada.alto === 8,
    `a 1:1 crece el lado corto hasta el largo (${cuadrada.ancho}×${cuadrada.alto})`
  );

  const centro = (k: Caja) => [k.x + k.ancho / 2, k.y + k.alto / 2].join();
  afirmar(centro(cuadrada) === centro(c), 'sin mover el centro');

  // Nunca se pierde dibujo: la caja nueva contiene entera a la ceñida.
  const alta = cajaDePixeles(
    (() => {
      const a = lienzo(20, 40);
      for (let y = 2; y < 38; y++) poner(a, 20, 10, y, NEGRO);
      return a;
    })(),
    20,
    40,
    0
  )!;

  for (const razon of [1, 4 / 5, 16 / 9]) {
    for (const partida of [c, alta]) {
      const r = aProporcion(partida, razon);
      afirmar(
        r.x <= partida.x + 0.001 &&
          r.y <= partida.y + 0.001 &&
          r.x + r.ancho >= partida.x + partida.ancho - 0.001 &&
          r.y + r.alto >= partida.y + partida.alto - 0.001,
        `a ${razon.toFixed(2)} la caja nueva contiene entera a la ceñida`
      );
    }
  }

  const yaCuadrada = cajaDePixeles(d, 20, 10, 2.5)!;
  afirmar(
    aProporcion(yaCuadrada, yaCuadrada.ancho / yaCuadrada.alto) === yaCuadrada,
    'una caja que ya cuadra con lo pedido no se toca'
  );
}

// =====================================================================
console.log('\n14. El bote de pintura');
{
  const ANCHO = 24;
  const ALTO = 24;
  const NEGRO: [number, number, number, number] = [0, 0, 0, 255];
  const ROJO: [number, number, number, number] = [255, 0, 0, 255];

  /** Un cuadrado hueco de 8×8 con la esquina en (6,6). */
  function conCaja(hueco = false) {
    const d = new Uint8ClampedArray(ANCHO * ALTO * 4);
    const poner = (x: number, y: number) => {
      const i = (y * ANCHO + x) * 4;
      d[i] = 0;
      d[i + 1] = 0;
      d[i + 2] = 0;
      d[i + 3] = 255;
    };
    for (let x = 6; x <= 13; x++) {
      poner(x, 6);
      // El hueco se abre en la línea de abajo: es por donde se escapa.
      if (!(hueco && x === 10)) poner(x, 13);
    }
    for (let y = 6; y <= 13; y++) {
      poner(6, y);
      poner(13, y);
    }
    return d;
  }

  // Dentro de la caja cerrada: se llena el hueco de 6×6 y nada más.
  const cerrada = conCaja();
  const dentro = rellenar(cerrada, ANCHO, ALTO, 9, 9, ROJO, 8);
  afirmar(dentro === 36, `dentro de una forma cerrada pinta justo su hueco (${dentro}, van 36)`);

  const leerPunto = (d: Uint8ClampedArray, x: number, y: number) => {
    const i = (y * ANCHO + x) * 4;
    return [d[i], d[i + 1], d[i + 2], d[i + 3]].join();
  };
  afirmar(leerPunto(cerrada, 9, 9) === ROJO.join(), 'el punto tocado queda del color pedido');
  afirmar(leerPunto(cerrada, 6, 9) === NEGRO.join(), 'y el contorno no se toca');
  afirmar(leerPunto(cerrada, 2, 2) === '0,0,0,0', 'lo de fuera se queda como estaba');

  // Con un hueco en el contorno, el color se escapa y baña el resto. Es
  // el comportamiento esperado, no un fallo: por eso lo dice la ficha.
  const rota = conCaja(true);
  const escapado = rellenar(rota, ANCHO, ALTO, 9, 9, ROJO, 8);
  afirmar(escapado > 400, `por un hueco del contorno se escapa (${escapado} de 576)`);
  afirmar(leerPunto(rota, 2, 2) === ROJO.join(), 'y llega hasta la esquina de fuera');

  // Tocar el contorno lo pinta a él, no al hueco.
  const sobreLinea = conCaja();
  rellenar(sobreLinea, ANCHO, ALTO, 6, 9, ROJO, 8);
  afirmar(leerPunto(sobreLinea, 6, 9) === ROJO.join(), 'tocando la línea se pinta la línea');
  afirmar(leerPunto(sobreLinea, 9, 9) === '0,0,0,0', 'y el hueco de dentro se queda vacío');

  // Volver a tocar donde ya está el color no hace nada, y sobre todo no
  // se queda dando vueltas.
  afirmar(rellenar(cerrada, ANCHO, ALTO, 9, 9, ROJO, 8) === 0, 'repetir el bote no pinta nada');

  // Fuera del lienzo no revienta.
  afirmar(rellenar(cerrada, ANCHO, ALTO, -1, 5, ROJO, 8) === 0, 'un punto fuera no pinta nada');
  afirmar(rellenar(cerrada, ANCHO, ALTO, 99, 5, ROJO, 8) === 0, 'ni uno pasado el borde');

  // Un lienzo entero vacío se llena de punta a punta.
  const vacio = new Uint8ClampedArray(ANCHO * ALTO * 4);
  afirmar(
    rellenar(vacio, ANCHO, ALTO, 12, 12, ROJO, 8) === ANCHO * ALTO,
    'sin nada dibujado se llena el lienzo entero'
  );
}

console.log(fallos === 0 ? '\nTODO CORRECTO\n' : `\n${fallos} FALLOS\n`);
process.exit(fallos === 0 ? 0 : 1);
