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
  convertir,
  componerFrase,
  buscarCiudades,
  nombreDePais,
  zonaDeZip,
  normalizar,
  type Destino,
  type DatosCiudades,
  type DatosZips,
} from '../src/lib/timezones.ts';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ciudades: DatosCiudades = JSON.parse(
  readFileSync(join(raiz, 'public/data/ciudades.json'), 'utf8')
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

console.log('\n5. Las horas que no existen y las que ocurren dos veces');
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

console.log('\n6. La frase que se copia');
{
  const miami = [destino('Miami', 'America/New_York')];
  const r = convertir(
    Temporal,
    { año: 2026, mes: 9, dia: 4, hora: 15, minuto: 0 },
    BOGOTA,
    'Bogotá',
    miami,
    'es'
  );
  const frase = componerFrase(r.destinos[0]!, r.origen, 'es');
  console.log('        ' + frase);
  afirmar(frase.includes('Miami') && frase.includes('Bogotá'), 'nombra los dos lugares');
  afirmar(
    frase.includes(r.destinos[0]!.hora),
    'la hora que va primero es la del destino, que es a quien se le escribe'
  );

  const enIngles = componerFrase(r.destinos[0]!, r.origen, 'en');
  console.log('        ' + enIngles);
  afirmar(/^Your appointment/.test(enIngles), 'y existe en inglés');

  const tarde = convertir(
    Temporal,
    { año: 2026, mes: 7, dia: 16, hora: 1, minuto: 0 },
    BOGOTA,
    'Bogotá',
    [destino('Los Ángeles', 'America/Los_Angeles')],
    'es'
  );
  const conAviso = componerFrase(tarde.destinos[0]!, tarde.origen, 'es');
  console.log('        ' + conAviso);
  afirmar(conAviso.includes('día anterior'), 'cuando cae en otro día, la frase lo dice');
}

console.log('\n7. El buscador de ciudades');
{
  afirmar(normalizar('Bogotá') === 'bogota', 'las tildes se quitan para buscar');
  afirmar(normalizar('  MEDELLÍN ') === 'medellin', 'y los espacios y las mayúsculas');

  const porTilde = buscarCiudades(ciudades, 'bogota', 'es');
  afirmar(
    porTilde.some((c) => c.zona === 'America/Bogota'),
    `«bogota» encuentra Bogotá (${porTilde[0]?.etiqueta})`
  );

  const conTilde = buscarCiudades(ciudades, 'bogotá', 'es');
  afirmar(conTilde.length > 0, '«bogotá» con tilde también');

  const san = buscarCiudades(ciudades, 'san franc', 'es');
  afirmar(san[0]?.zona === 'America/Los_Angeles', `«san franc» -> ${san[0]?.etiqueta}`);

  const medellin = buscarCiudades(ciudades, 'medellin', 'es');
  afirmar(medellin[0]?.zona === 'America/Bogota', `«medellin» -> ${medellin[0]?.etiqueta}`);

  afirmar(buscarCiudades(ciudades, 'x', 'es').length === 0, 'una sola letra no busca nada');
  afirmar(
    buscarCiudades(ciudades, 'qqqqzzz', 'es').length === 0,
    'lo que no existe no devuelve nada'
  );
  afirmar(buscarCiudades(ciudades, 'a', 'es', 8).length === 0, 'ni una letra suelta');
}

console.log('\n8. Las ciudades, en los dos idiomas');
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
    const encontradas = buscarCiudades(ciudades, consulta, 'es');
    afirmar(
      encontradas.some((c) => c.zona === zona),
      `${mensaje} (${encontradas[0]?.ciudad})`
    );
  }

  // Y la ficha tiene que escribirla en el idioma de la página.
  const enEspanol = buscarCiudades(ciudades, 'london', 'es').find(
    (c) => c.zona === 'Europe/London'
  );
  afirmar(enEspanol?.ciudad === 'Londres', `en español se escribe «${enEspanol?.ciudad}»`);

  const enIngles = buscarCiudades(ciudades, 'london', 'en').find((c) => c.zona === 'Europe/London');
  afirmar(enIngles?.ciudad === 'London', `y en inglés «${enIngles?.ciudad}»`);

  // La ciudad y la región van sueltas: es lo que permite pintarlas en dos
  // renglones en vez de en una línea que se desborda.
  const miami = buscarCiudades(ciudades, 'miami', 'es')[0];
  afirmar(
    Boolean(miami?.ciudad && miami?.region && miami.etiqueta.includes(miami.ciudad)),
    `la ciudad y la región van sueltas (${miami?.ciudad} · ${miami?.region})`
  );
  afirmar(nombreDePais('US', 'es') === 'Estados Unidos', 'el país se traduce sin datos propios');
  afirmar(nombreDePais('US', 'en') === 'United States', 'y en inglés también');
}

console.log('\n9. Los datos llevan su atribución');
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

console.log('\n8. Los datos llevan su atribución');
{
  afirmar(/GeoNames/.test(ciudades.fuente), `ciudades.json: ${ciudades.fuente}`);
  afirmar(/CC BY 4\.0/.test(zips.fuente), 'zips.json declara la licencia');
}

console.log(fallos === 0 ? '\nTODO CORRECTO\n' : `\n${fallos} FALLOS\n`);
process.exit(fallos === 0 ? 0 : 1);
