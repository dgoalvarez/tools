/**
 * Comprueba que cada paso del paso a paso señale algo que existe.
 *
 * El paso a paso de `src/i18n/tour.ts` apunta a los controles de verdad
 * con `[data-tour="…"]`. Es la forma correcta de hacerlo —una clase de
 * Tailwind cambiaría al reordenar la maqueta— pero tiene un modo de fallo
 * silencioso: si alguien renombra o borra el atributo, driver.js no se
 * queja. Enseña el paso flotando en mitad de la pantalla, sin señalar
 * nada, y quien lo esté leyendo piensa que la herramienta está rota.
 *
 * Esto lo convierte en un fallo ruidoso: se lee el HTML publicado —no el
 * código fuente— y se exige que cada ancla no opcional esté ahí.
 *
 * Las marcadas `opcional: true` no se comprueban: son las que solo salen
 * en algunos estados —el aviso de que la cita cae en otro día, el color
 * que sí pasaría— y en el primer pintado no están.
 *
 * Se ejecuta después de `astro build`, así que también detecta un ancla
 * que se perdió por cualquier otro motivo.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

if (!existsSync(dist)) {
  console.error('✗ No existe dist/. Ejecuta la compilación antes de esta comprobación.');
  process.exit(1);
}

const tourTs = readFileSync(join(root, 'src/i18n/tour.ts'), 'utf8');
const routesTs = readFileSync(join(root, 'src/i18n/routes.ts'), 'utf8');

/**
 * Los pasos de cada herramienta, leídos del propio archivo.
 *
 * Se parte por la clave de herramienta y de cada trozo se sacan los
 * `ancla:` y si el bloque lleva `opcional`. Es lectura de texto y no un
 * `import`, para que la alarma no dependa de compilar TypeScript.
 */
function pasosPorHerramienta() {
  const claves = [...tourTs.matchAll(/^ {2}(\w+): \[$/gm)];
  const salida = {};

  for (let i = 0; i < claves.length; i++) {
    const desde = claves[i].index;
    const hasta = i + 1 < claves.length ? claves[i + 1].index : tourTs.length;
    const trozo = tourTs.slice(desde, hasta);

    // Cada `{ … }` de primer nivel dentro del array es un paso. Se parten
    // por el `ancla:`, que es siempre lo primero de cada uno.
    const pasos = [];
    const anclas = [...trozo.matchAll(/ancla: '([^']+)'/g)];

    for (let j = 0; j < anclas.length; j++) {
      const inicio = anclas[j].index;
      const fin = j + 1 < anclas.length ? anclas[j + 1].index : trozo.length;
      const cuerpo = trozo.slice(inicio, fin);
      pasos.push({
        ancla: anclas[j][1],
        // `abre` marca un paso que vive detrás de una pestaña: no está en
        // el HTML publicado hasta que alguien la pulsa, así que exigirlo
        // aquí sería exigir algo imposible. El paso a paso sí lo enseña,
        // pulsando la pestaña antes de señalar.
        opcional: /opcional:\s*true/.test(cuerpo) || /abre:\s*'/.test(cuerpo),
      });
    }

    salida[claves[i][1]] = pasos;
  }

  return salida;
}

/** La ruta publicada de cada herramienta, en los dos idiomas. */
function rutasPorHerramienta() {
  const salida = {};
  for (const m of routesTs.matchAll(/(\w+):\s*\{\s*en:\s*'([^']+)',\s*es:\s*'([^']+)'\s*\}/g)) {
    salida[m[1]] = [m[2], m[3]];
  }
  return salida;
}

const pasos = pasosPorHerramienta();
const rutas = rutasPorHerramienta();

if (Object.keys(pasos).length === 0) {
  console.error('✗ No se pudo leer ningún paso de src/i18n/tour.ts. ¿Cambió su formato?');
  process.exit(1);
}

const faltan = [];
let comprobados = 0;

for (const [herramienta, listaPasos] of Object.entries(pasos)) {
  const rutasDeLaHerramienta = rutas[herramienta];
  if (!rutasDeLaHerramienta) {
    console.error(`✗ El paso a paso habla de «${herramienta}», que no es ninguna ruta conocida.`);
    process.exit(1);
  }

  for (const ruta of rutasDeLaHerramienta) {
    const archivo = join(dist, `${ruta}.html`);
    if (!existsSync(archivo)) continue; // De eso ya avisa check-pages.

    const html = readFileSync(archivo, 'utf8');

    for (const paso of listaPasos) {
      if (paso.opcional) continue;
      comprobados++;
      if (!html.includes(`data-tour="${paso.ancla}"`)) {
        faltan.push(`${ruta}   →   data-tour="${paso.ancla}"`);
      }
    }
  }
}

if (faltan.length) {
  console.error('\n✗ Hay pasos del paso a paso que señalan a algo que no está en la página.\n');
  faltan.forEach((f) => console.error(`    ${f}`));
  console.error(
    '\n  Cada paso de src/i18n/tour.ts apunta a un [data-tour="…"] del HTML.\n' +
      '  O el atributo se ha perdido al tocar la isla, o el paso sobra.\n' +
      '  Si es algo que solo aparece a veces, márcalo con `opcional: true`.\n'
  );
  process.exit(1);
}

console.log(`✓ paso a paso sincronizado (${comprobados} anclas comprobadas)`);
