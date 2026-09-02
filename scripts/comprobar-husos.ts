/**
 * Comprobación de la aritmética de husos horarios. Se ejecuta a mano.
 *
 * Son las cuatro pruebas que pide el plan, más las de búsqueda y datos.
 * Todas ellas comprueban cosas que pueden estar mal sin parecerlo: un
 * desfase fijo en vez del huso real da la respuesta correcta once meses al
 * año y la equivocada justo en las semanas que importan.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  obtenerTemporal,
  camposEnZona,
  convertir,
  relojEnVivo,
  componerLista,
  buscarLugares,
  nombreDePais,
  zonaDeZip,
  normalizar,
  type Destino,
  type DatosLugares,
  type DatosZips,
} from '../src/lib/timezones.ts';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ciudades: DatosLugares = JSON.parse(
  readFileSync(join(raiz, 'public/data/lugares.json'), 'utf8')
);
const zips: DatosZips = JSON.parse(readFileSync(join(raiz, 'public/data/zips.json'), 'utf8'));

const Temporal = await obtenerTemporal();
let fallos = 0;

function afirmar(condicion: boolean, mensaje: string) {
  console.log((condicion ? '  ok    ' : '  FALLO ') + mensaje);
  if (!condicion) fallos++;
}

const destino = (etiqueta: string, zona: string): Destino => ({
  id: zona,
  etiqueta,
  ciudad: etiqueta,
  region: '',
  pais: '',
  zona,
  fuente: 'ciudad',
});

const BOGOTA = 'America/Bogota';

console.log('\n1. Los dos domingos en que Estados Unidos cambia la hora y Colombia no');
{
  // En 2026 el horario de verano de EE UU va del 8 de marzo al 1 de noviembre.
  const miami = [destino('Miami', 'America/New_York')];

  const verano = convertir(
    Temporal,
    { año: 2026, mes: 7, dia: 15, hora: 15, minuto: 0 },
    BOGOTA,
    'Bogotá',
    miami,
    'es'
  );
  const invierno = convertir(
    Temporal,
    { año: 2026, mes: 12, dia: 15, hora: 15, minuto: 0 },
    BOGOTA,
    'Bogotá',
    miami,
    'es'
  );

  afirmar(
    verano.destinos[0]!.diferencia === 1,
    `en julio Miami va 1 h por delante de Bogotá (${verano.destinos[0]!.hora})`
  );
  afirmar(
    invierno.destinos[0]!.diferencia === 0,
    `en diciembre van a la misma hora (${invierno.destinos[0]!.hora})`
  );

  // El día exacto del cambio de otoño de 2026: domingo 1 de noviembre.
  const antesDelCambio = convertir(
    Temporal,
    { año: 2026, mes: 10, dia: 31, hora: 15, minuto: 0 },
    BOGOTA,
    'Bogotá',
    miami,
    'es'
  );
  const despuesDelCambio = convertir(
    Temporal,
    { año: 2026, mes: 11, dia: 2, hora: 15, minuto: 0 },
    BOGOTA,
    'Bogotá',
    miami,
    'es'
  );
  afirmar(antesDelCambio.destinos[0]!.diferencia === 1, 'el 31 de octubre, 1 h de diferencia');
  afirmar(
    despuesDelCambio.destinos[0]!.diferencia === 0,
    'el 2 de noviembre, ninguna: el cambio se nota'
  );
}

console.log(
  '\n2. Phoenix contra Denver en julio: los dos son «Mountain», Arizona no cambia la hora'
);
{
  const dos = [destino('Phoenix', 'America/Phoenix'), destino('Denver', 'America/Denver')];
  const julio = convertir(
    Temporal,
    { año: 2026, mes: 7, dia: 15, hora: 15, minuto: 0 },
    BOGOTA,
    'Bogotá',
    dos,
    'es'
  );
  const enero = convertir(
    Temporal,
    { año: 2026, mes: 1, dia: 15, hora: 15, minuto: 0 },
    BOGOTA,
    'Bogotá',
    dos,
    'es'
  );

  afirmar(
    julio.destinos[0]!.hora !== julio.destinos[1]!.hora,
    `en julio NO coinciden: Phoenix ${julio.destinos[0]!.hora}, Denver ${julio.destinos[1]!.hora}`
  );
  afirmar(
    enero.destinos[0]!.hora === enero.destinos[1]!.hora,
    `en enero sí coinciden: las dos a las ${enero.destinos[0]!.hora}`
  );
}

console.log('\n3. Un ZIP de la Florida occidental contra uno de Miami');
{
  const miami = zonaDeZip(zips, '33101');
  const oeste = zonaDeZip(zips, '32401');
  afirmar(miami === 'America/New_York', `33101 (Miami) -> ${miami}`);
  afirmar(oeste === 'America/Chicago', `32401 (Panama City) -> ${oeste}`);
  afirmar(miami !== oeste, 'mismo estado, dos husos: el ZIP aporta algo que la ciudad no');

  afirmar(zonaDeZip(zips, '85001') === 'America/Phoenix', 'Phoenix por ZIP');
  afirmar(zonaDeZip(zips, '96801') === 'Pacific/Honolulu', 'Honolulu por ZIP');
  afirmar(zonaDeZip(zips, 'abcde') === null, 'un ZIP que no es un ZIP devuelve nada');
  afirmar(zonaDeZip(zips, '1234') === null, 'cuatro dígitos tampoco');
}

console.log('\n4. Las 11 de la noche en Colombia, vistas desde California');
{
  const california = [destino('Los Ángeles', 'America/Los_Angeles')];
  // El plan decía que las 11 p. m. de Colombia caen en el día anterior en
  // California. No es cierto: Bogotá va solo dos horas por delante de Los
  // Ángeles, así que a las 23:00 allí son las 21:00 del MISMO día. El salto
  // hacia atrás empieza a partir de la medianoche colombiana.
  const once = convertir(
    Temporal,
    { año: 2026, mes: 7, dia: 15, hora: 23, minuto: 0 },
    BOGOTA,
    'Bogotá',
    california,
    'es'
  );
  afirmar(
    once.destinos[0]!.saltoDeDia === 0,
    `a las 23:00 en Bogotá allí sigue siendo el mismo día (${once.destinos[0]!.hora})`
  );

  const madrugada = convertir(
    Temporal,
    { año: 2026, mes: 7, dia: 16, hora: 1, minuto: 0 },
    BOGOTA,
    'Bogotá',
    california,
    'es'
  );
  afirmar(
    madrugada.destinos[0]!.saltoDeDia === -1,
    `a la 1 de la madrugada allí es el día anterior (${madrugada.destinos[0]!.fecha}, ${madrugada.destinos[0]!.hora})`
  );

  // Y al revés: desde Bogotá hacia Tokio se salta al día siguiente.
  const tokio = convertir(
    Temporal,
    { año: 2026, mes: 7, dia: 15, hora: 15, minuto: 0 },
    BOGOTA,
    'Bogotá',
    [destino('Tokio', 'Asia/Tokyo')],
    'es'
  );
  afirmar(
    tokio.destinos[0]!.saltoDeDia === 1,
    `en Tokio ya es el día siguiente (${tokio.destinos[0]!.fecha})`
  );
}

console.log('\n5. El mensaje con todas las horas');
{
  const varios = [
    destino('Miami', 'America/New_York'),
    destino('Tokio', 'Asia/Tokyo'),
    destino('Madrid', 'Europe/Madrid'),
  ];
  const r = convertir(
    Temporal,
    { año: 2026, mes: 9, dia: 4, hora: 15, minuto: 0 },
    BOGOTA,
    'Bogotá',
    varios,
    'es'
  );

  const mensaje = componerLista(r.destinos, r.origen, 'es');
  const lineas = mensaje.split('\n');
  console.log(lineas.map((l) => '        ' + l).join('\n'));

  afirmar(lineas.length === 5, 'una cabecera y cuatro líneas: la tuya y las tres');
  afirmar(mensaje.includes('(tu hora)'), 'la primera línea se marca como la tuya');
  afirmar(
    mensaje.includes('Miami') && mensaje.includes('Tokio') && mensaje.includes('Madrid'),
    'están las tres ciudades'
  );
  // Lo que no puede faltar: el aviso viaja DENTRO de la línea a la que le
  // toca, no al final del mensaje, donde nadie sabría de quién es.
  const lineaTokio = lineas.find((l) => l.includes('Tokio'))!;
  afirmar(lineaTokio.includes('día siguiente'), `el aviso va en su línea (${lineaTokio.trim()})`);
  const lineaMiami = lineas.find((l) => l.includes('Miami'))!;
  afirmar(!lineaMiami.includes('día siguiente'), 'y no se cuela en las que no lo tienen');

  const enIngles = componerLista(r.destinos, r.origen, 'en');
  afirmar(enIngles.startsWith('The time in each place:'), 'y existe en inglés');
  afirmar(enIngles.includes('(your time)'), 'con su marca de «tu hora»');

  // La fecha corta es la de la lista. Tiene que decir el mismo día que la
  // larga: si se desincronizan, la pantalla y el mensaje se contradicen.
  const tokio = r.destinos.find((c) => c.destino.ciudad === 'Tokio')!;
  afirmar(
    tokio.fechaCorta.length > 0 && tokio.fechaCorta.length < tokio.fecha.length,
    `la fecha corta es más corta que la larga (${tokio.fechaCorta} · ${tokio.fecha})`
  );
  afirmar(
    tokio.fecha.includes('5') && tokio.fechaCorta.includes('5'),
    'y las dos hablan del mismo día'
  );
}

console.log('\n6. El reloj en vivo de la tarjeta de arriba');
{
  /*
    Esta tarjeta no pasa por `convertir`: sale de `Intl` y es síncrona,
    para que la cifra más grande de la pantalla no espere a que se
    descargue el polyfill de `Temporal`.

    Que sean dos caminos distintos es justo lo que hay que vigilar. Si uno
    de los dos se desvía, la tarjeta de arriba y la lista de abajo dirían
    horas distintas del MISMO instante, y no habría forma de saber cuál de
    las dos miente.
  */
  const VERANO = new Date('2026-07-15T20:00:00Z'); // 15:00 en Bogotá
  const INVIERNO = new Date('2026-01-15T20:00:00Z'); // 15:00 en Bogotá

  // El caso que existe la herramienta para no fallar: la misma ciudad,
  // la misma hora de Bogotá, y dos respuestas distintas según el mes.
  // Un desfase fijo daría la misma las dos veces.
  const miamiVerano = relojEnVivo(VERANO, 'America/New_York', BOGOTA, 'es');
  const miamiInvierno = relojEnVivo(INVIERNO, 'America/New_York', BOGOTA, 'es');

  afirmar(miamiVerano.diferencia === 1, `en julio Miami va 1 h por delante (${miamiVerano.hora})`);
  afirmar(
    miamiInvierno.diferencia === 0,
    `en enero Miami va a la misma hora (${miamiInvierno.hora})`
  );
  afirmar(
    miamiVerano.diferencia !== miamiInvierno.diferencia,
    'la misma ciudad, dos respuestas: el horario de verano se está teniendo en cuenta'
  );

  // Los husos de media hora salen enteros o no salen.
  const india = relojEnVivo(VERANO, 'Asia/Kolkata', BOGOTA, 'es');
  afirmar(india.diferencia === 10.5, `India va 10,5 h por delante (${india.diferencia})`);

  // El error que de verdad se comete: acertar la hora y errar el día.
  const tokio = relojEnVivo(VERANO, 'Asia/Tokyo', BOGOTA, 'es');
  afirmar(tokio.saltoDeDia === 1, `en Tokio ya es el día siguiente (${tokio.fechaCorta})`);

  const madrugada = new Date('2026-07-16T06:00:00Z'); // 01:00 en Bogotá
  const california = relojEnVivo(madrugada, 'America/Los_Angeles', BOGOTA, 'es');
  afirmar(
    california.saltoDeDia === -1,
    `a la 1 de la madrugada en Bogotá, en California es el día anterior (${california.fechaCorta})`
  );

  const mismo = relojEnVivo(VERANO, BOGOTA, BOGOTA, 'es');
  afirmar(mismo.diferencia === 0 && mismo.saltoDeDia === 0, 'un sitio contra sí mismo no difiere');

  // Y la que ata los dos caminos: mismo instante, misma hora escrita.
  for (const zona of ['America/New_York', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Eucla']) {
    const campos = camposEnZona(VERANO, BOGOTA);
    const [año, mes, dia] = campos.fecha.split('-').map(Number);
    const [h, m] = campos.hora.split(':').map(Number);

    const porTemporal = convertir(
      Temporal,
      { año: año!, mes: mes!, dia: dia!, hora: h!, minuto: m! },
      BOGOTA,
      'Bogotá',
      [destino(zona, zona)],
      'es'
    ).destinos[0]!;
    const porIntl = relojEnVivo(VERANO, zona, BOGOTA, 'es');

    afirmar(
      porTemporal.hora === porIntl.hora &&
        porTemporal.diferencia === porIntl.diferencia &&
        porTemporal.saltoDeDia === porIntl.saltoDeDia,
      `${zona}: la tarjeta y la lista dicen lo mismo (${porIntl.hora}, ${porIntl.diferencia} h)`
    );
  }
}

console.log('\n7. Las horas que no existen y las que ocurren dos veces');
{
  // 8 de marzo de 2026, 2:30 de la madrugada en Nueva York: esa hora no existe.
  const inexistente = convertir(
    Temporal,
    { año: 2026, mes: 3, dia: 8, hora: 2, minuto: 30 },
    'America/New_York',
    'Nueva York',
    [],
    'es'
  );
  afirmar(
    inexistente.ambiguedad === 'no-existe',
    `2:30 del 8-mar-2026 en Nueva York: ${inexistente.ambiguedad}, se usa ${inexistente.horaCorregida}`
  );

  // 1 de noviembre de 2026, 1:30: ocurre dos veces.
  const doble = convertir(
    Temporal,
    { año: 2026, mes: 11, dia: 1, hora: 1, minuto: 30 },
    'America/New_York',
    'Nueva York',
    [],
    'es'
  );
  afirmar(
    doble.ambiguedad === 'ocurre-dos-veces',
    `1:30 del 1-nov-2026 en Nueva York: ${doble.ambiguedad}`
  );

  const normal = convertir(
    Temporal,
    { año: 2026, mes: 7, dia: 15, hora: 15, minuto: 0 },
    BOGOTA,
    'Bogotá',
    [],
    'es'
  );
  afirmar(
    normal.ambiguedad === 'ninguna',
    'una hora corriente en Bogotá no tiene ninguna ambigüedad'
  );
}

console.log('\n8. El buscador de ciudades');
{
  afirmar(normalizar('Bogotá') === 'bogota', 'las tildes se quitan para buscar');
  afirmar(normalizar('  MEDELLÍN ') === 'medellin', 'y los espacios y las mayúsculas');

  const porTilde = buscarLugares(ciudades, 'bogota', 'es');
  afirmar(
    porTilde.some((c) => c.zona === 'America/Bogota'),
    `«bogota» encuentra Bogotá (${porTilde[0]?.etiqueta})`
  );

  const conTilde = buscarLugares(ciudades, 'bogotá', 'es');
  afirmar(conTilde.length > 0, '«bogotá» con tilde también');

  const san = buscarLugares(ciudades, 'san franc', 'es');
  afirmar(san[0]?.zona === 'America/Los_Angeles', `«san franc» -> ${san[0]?.etiqueta}`);

  const medellin = buscarLugares(ciudades, 'medellin', 'es');
  afirmar(medellin[0]?.zona === 'America/Bogota', `«medellin» -> ${medellin[0]?.etiqueta}`);

  afirmar(buscarLugares(ciudades, 'x', 'es').length === 0, 'una sola letra no busca nada');
  afirmar(
    buscarLugares(ciudades, 'qqqqzzz', 'es').length === 0,
    'lo que no existe no devuelve nada'
  );
  afirmar(buscarLugares(ciudades, 'a', 'es', 8).length === 0, 'ni una letra suelta');
}

console.log('\n9. Las ciudades, en los dos idiomas');
{
  // La forma del archivo. Si alguien vuelve a generar los datos con una
  // versión vieja del guion, esto se cae aquí y no en la cara de quien
  // esté buscando una ciudad.
  const malFormadas = ciudades.ciudades.filter((c) => c.length !== 7);
  afirmar(malFormadas.length === 0, `las ${ciudades.ciudades.length} ciudades traen sus 7 campos`);

  const regionesMalFormadas = ciudades.regiones.filter((r) => r.length !== 3);
  afirmar(
    regionesMalFormadas.length === 0,
    `las ${ciudades.regiones.length} regiones traen sus 3 campos`
  );

  // Buscar en un idioma tiene que encontrar la ciudad esté escrita en el
  // que esté. Es lo que pedía el encargo: «se podría buscar en español o
  // en inglés».
  const casos: [string, string, string][] = [
    ['londres', 'Europe/London', 'el exónimo español encuentra London'],
    ['london', 'Europe/London', 'y el nombre inglés también'],
    ['seville', 'Europe/Madrid', '«seville» encuentra Sevilla'],
    ['sevilla', 'Europe/Madrid', 'y «sevilla» también'],
    ['ginebra', 'Europe/Zurich', '«ginebra» encuentra Geneva'],
    ['pekin', 'Asia/Shanghai', '«pekin» encuentra Beijing'],
    ['nueva york', 'America/New_York', '«nueva york» encuentra New York'],
  ];

  for (const [consulta, zona, mensaje] of casos) {
    const encontradas = buscarLugares(ciudades, consulta, 'es');
    afirmar(
      encontradas.some((c) => c.zona === zona),
      `${mensaje} (${encontradas[0]?.ciudad})`
    );
  }

  // Y la ficha tiene que escribirla en el idioma de la página.
  const enEspanol = buscarLugares(ciudades, 'london', 'es').find((c) => c.zona === 'Europe/London');
  afirmar(enEspanol?.ciudad === 'Londres', `en español se escribe «${enEspanol?.ciudad}»`);

  const enIngles = buscarLugares(ciudades, 'london', 'en').find((c) => c.zona === 'Europe/London');
  afirmar(enIngles?.ciudad === 'London', `y en inglés «${enIngles?.ciudad}»`);

  // La ciudad y la región van sueltas: es lo que permite pintarlas en dos
  // renglones en vez de en una línea que se desborda.
  const miami = buscarLugares(ciudades, 'miami', 'es')[0];
  afirmar(
    Boolean(miami?.ciudad && miami?.region && miami.etiqueta.includes(miami.ciudad)),
    `la ciudad y la región van sueltas (${miami?.ciudad} · ${miami?.region})`
  );
  afirmar(nombreDePais('US', 'es') === 'Estados Unidos', 'el país se traduce sin datos propios');
  afirmar(nombreDePais('US', 'en') === 'United States', 'y en inglés también');
}

console.log('\n10. Las zonas de los datos son válidas');
{
  // Toda zona que aparezca en los datos tiene que ser una zona que el
  // navegador reconozca; si no, la conversión reventaría al usarla.
  let malas = 0;
  for (const zona of ciudades.zonas) {
    try {
      new Intl.DateTimeFormat('es', { timeZone: zona }).format(new Date());
    } catch {
      malas++;
    }
  }
  afirmar(malas === 0, `las ${ciudades.zonas.length} zonas de los datos son válidas`);
}

console.log('\n11. Los datos llevan su atribución');
{
  afirmar(/GeoNames/.test(ciudades.fuente), `lugares.json: ${ciudades.fuente}`);
  afirmar(/CC BY 4\.0/.test(zips.fuente), 'zips.json declara la licencia');
}

// =====================================================================
/*
  Estados, departamentos y países.

  Lo que hay que demostrar no es que se encuentren —eso se ve mirando—
  sino lo otro: que un sitio partido entre husos **sale una vez por huso y
  con su nombre puesto**. Es la decisión de fondo de esta parte: nunca
  elegir por nadie. Si algún día el corte que decide qué husos entran se
  vuelve más estricto y Florida pasa a salir una sola vez, esto lo dice.
*/
console.log('\n12. Estados, departamentos y países');
{
  const soloDivisiones = (q: string) =>
    buscarLugares(ciudades, q, 'es', 12).filter((c) => c.tipo === 'division');
  const soloPaises = (q: string) =>
    buscarLugares(ciudades, q, 'es', 12).filter((c) => c.tipo === 'pais');

  // ---------- que estén ----------
  const antioquia = soloDivisiones('antioquia').find((c) => c.pais === 'CO');
  afirmar(
    antioquia?.zona === 'America/Bogota',
    `Antioquia está y es de Bogotá (${antioquia?.zona})`
  );

  const colombia = soloPaises('colombia');
  afirmar(colombia.length === 1, 'Colombia sale una vez: no está partida');
  afirmar(colombia[0]?.zona === 'America/Bogota', 'y con su huso');
  afirmar(colombia[0]?.matiz === '', 'y sin matiz, porque no hace falta');

  afirmar(soloPaises('japon').length === 1, 'Japón se encuentra sin tilde');

  // El mismo sitio escrito en los dos idiomas encuentra lo mismo.
  const enEspanol = soloDivisiones('carolina del norte').find((c) => c.pais === 'US');
  const enIngles = buscarLugares(ciudades, 'north carolina', 'en', 12).find(
    (c) => c.tipo === 'division' && c.pais === 'US'
  );
  afirmar(
    !!enEspanol && !!enIngles && enEspanol.zona === enIngles.zona,
    `«Carolina del Norte» y «North Carolina» son el mismo sitio (${enEspanol?.zona})`
  );

  // ---------- los partidos ----------
  const floridas = soloDivisiones('florida').filter((c) => c.pais === 'US');
  afirmar(floridas.length === 2, `Florida sale una vez por huso (${floridas.length})`);
  afirmar(
    new Set(floridas.map((c) => c.zona)).size === floridas.length,
    'y son husos distintos, no el mismo repetido'
  );
  afirmar(
    floridas.every((c) => c.matiz.length > 0),
    `y cada una dice de cuál se trata (${floridas.map((c) => c.matiz).join(' · ')})`
  );
  afirmar(
    new Set(floridas.map((c) => c.matiz)).size === floridas.length,
    'y los dos nombres son distintos: dos opciones que se leen igual no son dos opciones'
  );
  afirmar(
    floridas.every((c) => c.etiqueta.includes(c.matiz)),
    'el nombre completo lleva el huso dentro, que es lo que viaja al enlace'
  );

  const eeuu = soloPaises('estados unidos');
  afirmar(eeuu.length > 1, `Estados Unidos sale por husos (${eeuu.length})`);
  afirmar(
    new Set(eeuu.map((c) => c.matiz)).size === eeuu.length,
    'y ninguno de sus husos se llama igual que otro'
  );

  // ---------- las ciudades siguen mandando ----------
  const madrid = buscarLugares(ciudades, 'madrid', 'es', 12)[0];
  afirmar(
    madrid?.tipo === 'ciudad',
    `«Madrid» sigue siendo la ciudad y no la comunidad (${madrid?.tipo})`
  );

  // ---------- los datos, enteros ----------
  const zonasValidas = (i: number) => i >= 0 && i < ciudades.zonas.length;
  afirmar(
    ciudades.divisiones.every((d) => zonasValidas(d[3])),
    `las ${ciudades.divisiones.length.toLocaleString('es')} divisiones apuntan a un huso que existe`
  );
  afirmar(
    ciudades.paises.every((p) => zonasValidas(p[1])),
    `y las ${ciudades.paises.length} entradas de país, también`
  );
  afirmar(
    ciudades.divisiones.every((d) => d[0].length > 0 && d[2].length === 2),
    'todas tienen nombre y código de país'
  );

  // Un sitio marcado como partido tiene que tener compañía: si no, el
  // matiz aparecería en un resultado único y sobraría.
  const cuentaDivision = new Map<string, number>();
  for (const [nombre, , pais, , , , partido] of ciudades.divisiones) {
    if (partido)
      cuentaDivision.set(`${pais}|${nombre}`, (cuentaDivision.get(`${pais}|${nombre}`) ?? 0) + 1);
  }
  afirmar(
    [...cuentaDivision.values()].every((n) => n > 1),
    `las ${cuentaDivision.size} divisiones marcadas como partidas salen más de una vez`
  );
}

console.log(fallos === 0 ? '\nTODO CORRECTO\n' : `\n${fallos} FALLOS\n`);
process.exit(fallos === 0 ? 0 : 1);
