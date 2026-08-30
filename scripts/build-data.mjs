/**
 * Genera los datos de la herramienta de husos horarios a partir de los
 * volcados públicos de GeoNames.
 *
 * Uso:  node scripts/build-data.mjs
 * Sale: public/data/ciudades.json
 *       public/data/zips.json
 *
 * Se ejecuta a mano y el resultado se versiona. No forma parte de
 * `npm run build` a propósito: si corriera en cada despliegue, un servidor
 * ajeno caído tumbaría la publicación del sitio, y los datos cambiarían
 * sin que nadie lo hubiera decidido.
 *
 * ⚠️ GeoNames se publica con licencia CC BY 4.0. La atribución en el pie
 * del sitio es obligatoria, no opcional.
 *
 * ---------------------------------------------------------------------
 * Cómo se averigua el huso de un código ZIP
 *
 * El volcado de códigos postales de GeoNames no trae zona horaria: solo
 * trae estado, condado y coordenadas. Y hace falta, porque siete estados
 * de Estados Unidos están partidos entre dos husos.
 *
 * Las fronteras horarias siguen líneas de condado casi siempre. Así que:
 *
 *   1. De `cities500.txt` se saca, para cada lugar poblado de EE UU, su
 *      condado (código FIPS) y su zona IANA.
 *   2. Se vota por condado: la zona de la mayoría de sus lugares.
 *   3. Cada ZIP hereda la zona de su condado.
 *   4. En los pocos condados donde los lugares no se ponen de acuerdo
 *      —los que la frontera parte por la mitad— se usa el lugar poblado
 *      más cercano al ZIP, que es lo más fino que permiten estos datos.
 *
 * Es exacto a nivel de condado, que es el nivel al que existen de verdad
 * las zonas horarias. No baja de ahí porque por debajo no hay nada que
 * bajar.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = join(raiz, '.geonames');
const salida = join(raiz, 'public', 'data');

/** Población mínima para que una ciudad aparezca en el buscador. */
const POBLACION_MINIMA = 50000;

const FUENTES = [
  { archivo: 'cities500.zip', url: 'https://download.geonames.org/export/dump/cities500.zip' },
  { archivo: 'US.zip', url: 'https://download.geonames.org/export/zip/US.zip' },
  {
    archivo: 'admin1CodesASCII.txt',
    url: 'https://download.geonames.org/export/dump/admin1CodesASCII.txt',
  },
];

// --------------------------------------------------------------- descarga

function descargar() {
  mkdirSync(cache, { recursive: true });

  for (const { archivo, url } of FUENTES) {
    const destino = join(cache, archivo);

    if (existsSync(destino)) {
      const dias = (Date.now() - statSync(destino).mtimeMs) / 86_400_000;
      console.log(`  ya estaba: ${archivo} (${dias.toFixed(0)} días)`);
      continue;
    }

    console.log(`  bajando:   ${archivo}`);
    execFileSync('curl', ['-sSL', '--max-time', '600', '-o', destino, url], {
      stdio: 'inherit',
    });
  }

  // `unzip` viene con git en Windows y con el sistema en macOS y Linux.
  execFileSync('unzip', ['-o', '-q', join(cache, 'cities500.zip'), '-d', cache]);
  execFileSync('unzip', ['-o', '-q', join(cache, 'US.zip'), '-d', join(cache, 'zip')]);
}

/** Lee un archivo separado por tabuladores, saltándose comentarios. */
function leerTsv(ruta) {
  return readFileSync(ruta, 'utf8')
    .split('\n')
    .filter((linea) => linea && !linea.startsWith('#'))
    .map((linea) => linea.split('\t'));
}

// ---------------------------------------------------------------- ciudades

function construirCiudades(lugares, regiones) {
  // Los nombres de zona y de región se repiten miles de veces —«California»
  // aparece en cientos de filas— así que se guardan una sola vez y cada
  // ciudad apunta a su posición. Es la diferencia entre medio mega y algo
  // que se descarga sin pensarlo.
  const zonas = [];
  const nombresRegion = [];
  const indiceZona = new Map();
  const indiceRegion = new Map();

  const internar = (lista, indice, valor) => {
    if (!indice.has(valor)) {
      indice.set(valor, lista.length);
      lista.push(valor);
    }
    return indice.get(valor);
  };

  const idDeZona = (zona) => internar(zonas, indiceZona, zona);
  const idDeRegion = (region) => internar(nombresRegion, indiceRegion, region);

  const ciudades = lugares
    .filter((f) => Number(f[14]) >= POBLACION_MINIMA && f[17])
    .map((f) => {
      const nombre = f[1];
      const ascii = f[2];
      const pais = f[8];
      const region = regiones.get(`${pais}.${f[10]}`) ?? '';
      return [
        nombre,
        // El nombre sin tildes solo se guarda cuando aporta algo: es lo que
        // permite que «bogota» encuentre «Bogotá» sin que quien escribe
        // tenga que acertar con los acentos.
        ascii && ascii !== nombre ? ascii : '',
        pais,
        idDeRegion(region),
        idDeZona(f[17]),
        Number(f[14]),
      ];
    })
    // Por población: quien escribe «san» quiere San Francisco antes que San
    // Pedro de Macorís. Se ordena aquí y luego se tira la cifra: el orden
    // del array ya es la respuesta, y son 90 KB menos.
    .sort((a, b) => b[5] - a[5])
    .map((c) => c.slice(0, 5));

  return { zonas, regiones: nombresRegion, ciudades };
}

// -------------------------------------------------------------------- ZIP

/** Distancia al cuadrado, corregida por la latitud. Sirve para comparar. */
function distancia2(lat1, lon1, lat2, lon2) {
  const dLat = lat1 - lat2;
  const dLon = (lon1 - lon2) * Math.cos((lat1 * Math.PI) / 180);
  return dLat * dLat + dLon * dLon;
}

function construirZips(lugares, codigosPostales) {
  const enEeUu = lugares.filter((f) => f[8] === 'US' && f[17]);

  // 1 y 2. Voto por condado.
  const votos = new Map();
  for (const f of enEeUu) {
    const condado = `${f[10]}${f[11]}`;
    if (!votos.has(condado)) votos.set(condado, new Map());
    const cuenta = votos.get(condado);
    cuenta.set(f[17], (cuenta.get(f[17]) ?? 0) + 1);
  }

  const zonaDeCondado = new Map();
  const condadosPartidos = new Set();

  for (const [condado, cuenta] of votos) {
    const ordenadas = [...cuenta].sort((a, b) => b[1] - a[1]);
    zonaDeCondado.set(condado, ordenadas[0][0]);
    if (ordenadas.length > 1) condadosPartidos.add(condado);
  }

  // Coordenadas de los lugares, para el desempate por cercanía.
  const puntos = enEeUu.map((f) => ({ lat: Number(f[4]), lon: Number(f[5]), zona: f[17] }));

  // 3 y 4. Cada código postal recibe su zona.
  const zonaDeZip = new Map();
  let porCondado = 0;
  let porCercania = 0;

  for (const f of codigosPostales) {
    const zip = f[1];
    if (!/^\d{5}$/.test(zip)) continue;

    const condado = `${f[4]}${f[6]}`;
    const lat = Number(f[9]);
    const lon = Number(f[10]);

    let zona = condadosPartidos.has(condado) ? null : zonaDeCondado.get(condado);

    if (zona) {
      porCondado++;
    } else {
      let mejor = Infinity;
      for (const p of puntos) {
        const d = distancia2(lat, lon, p.lat, p.lon);
        if (d < mejor) {
          mejor = d;
          zona = p.zona;
        }
      }
      porCercania++;
    }

    if (zona) zonaDeZip.set(zip, zona);
  }

  // 5. Se agrupa por prefijo de tres dígitos. Donde todo el prefijo cae en
  // la misma zona basta con guardar el prefijo; donde no, se listan solo
  // los códigos que se salen. De 41.000 filas a poco más de mil.
  const porPrefijo = new Map();
  for (const [zip, zona] of zonaDeZip) {
    const prefijo = zip.slice(0, 3);
    if (!porPrefijo.has(prefijo)) porPrefijo.set(prefijo, new Map());
    const cuenta = porPrefijo.get(prefijo);
    cuenta.set(zona, (cuenta.get(zona) ?? 0) + 1);
  }

  const prefijos = {};
  const excepciones = {};

  for (const [prefijo, cuenta] of [...porPrefijo].sort()) {
    const mayoritaria = [...cuenta].sort((a, b) => b[1] - a[1])[0][0];
    prefijos[prefijo] = mayoritaria;
  }

  for (const [zip, zona] of zonaDeZip) {
    if (prefijos[zip.slice(0, 3)] !== zona) excepciones[zip] = zona;
  }

  return {
    prefijos,
    excepciones,
    resumen: {
      codigos: zonaDeZip.size,
      porCondado,
      porCercania,
      condadosPartidos: condadosPartidos.size,
      prefijos: Object.keys(prefijos).length,
      excepciones: Object.keys(excepciones).length,
    },
  };
}

// ------------------------------------------------------------------ salida

console.log('\nDatos de husos horarios · GeoNames (CC BY 4.0)\n');
descargar();

console.log('\nLeyendo…');
const lugares = leerTsv(join(cache, 'cities500.txt'));
const codigosPostales = leerTsv(join(cache, 'zip', 'US.txt'));
const regiones = new Map(leerTsv(join(cache, 'admin1CodesASCII.txt')).map((f) => [f[0], f[1]]));
console.log(`  ${lugares.length.toLocaleString('es')} lugares poblados`);
console.log(`  ${codigosPostales.length.toLocaleString('es')} códigos postales`);

const generado = new Date().toISOString().slice(0, 10);
const atribucion = 'GeoNames (https://www.geonames.org), CC BY 4.0';

mkdirSync(salida, { recursive: true });

const { zonas, regiones: nombresRegion, ciudades } = construirCiudades(lugares, regiones);
const ciudadesJson = JSON.stringify({
  generado,
  fuente: atribucion,
  zonas,
  regiones: nombresRegion,
  ciudades,
});
writeFileSync(join(salida, 'ciudades.json'), ciudadesJson);

const { prefijos, excepciones, resumen } = construirZips(lugares, codigosPostales);
const zipsJson = JSON.stringify({ generado, fuente: atribucion, prefijos, excepciones });
writeFileSync(join(salida, 'zips.json'), zipsJson);

console.log('\nCiudades');
console.log(`  ${ciudades.length.toLocaleString('es')} con más de ${POBLACION_MINIMA.toLocaleString('es')} habitantes`);
console.log(`  ${zonas.length} zonas horarias distintas`);
console.log(`  ${(ciudadesJson.length / 1024).toFixed(0)} KB sin comprimir`);

console.log('\nCódigos postales');
console.log(`  ${resumen.codigos.toLocaleString('es')} resueltos`);
console.log(`  ${resumen.porCondado.toLocaleString('es')} por su condado, ${resumen.porCercania.toLocaleString('es')} por el lugar más cercano`);
console.log(`  ${resumen.condadosPartidos} condados que la frontera horaria parte por la mitad`);
console.log(`  ${resumen.prefijos} prefijos + ${resumen.excepciones} excepciones`);
console.log(`  ${(zipsJson.length / 1024).toFixed(0)} KB sin comprimir`);

console.log('\nListo. Recuerda que la atribución a GeoNames en el pie es obligatoria.\n');
