/**
 * La aritmética de husos horarios.
 *
 * Se hace con `Temporal` y no con `Date` por un motivo concreto: `Temporal`
 * es la única API que sabe representar «las tres de la tarde en Bogotá»
 * como lo que es —una hora de pared con una zona— en vez de como un
 * instante al que hay que adivinarle el desfase.
 *
 * Adivinar el desfase falla justo en los saltos de horario de verano. Y
 * como Colombia no cambia la hora y Estados Unidos sí, ese fallo no sería
 * un caso raro en esta herramienta: sería *el* caso.
 *
 * `Temporal` también es la única que expone `disambiguation`, que es lo que
 * decide qué hacer con las horas que no existen (el salto de primavera) o
 * que ocurren dos veces (el de otoño). Aquí no se decide en silencio: se
 * detecta y se avisa.
 */
import type { Temporal as TemporalTipos } from '@js-temporal/polyfill';

type EspacioTemporal = typeof TemporalTipos;

let cargado: EspacioTemporal | null = null;

/**
 * Devuelve `Temporal`: el del navegador si lo trae, y si no el polyfill.
 *
 * Hoy solo lo traen las versiones recientes de Firefox, así que en la
 * práctica casi siempre se descarga el polyfill. Son unos 40 KB
 * comprimidos, y por eso la carga es diferida y vive solo en esta
 * herramienta: las otras páginas no pagan nada por ella.
 */
export async function obtenerTemporal(): Promise<EspacioTemporal> {
  if (cargado) return cargado;

  const nativo = (globalThis as unknown as { Temporal?: EspacioTemporal }).Temporal;
  if (nativo) {
    cargado = nativo;
    return cargado;
  }

  const modulo = await import('@js-temporal/polyfill');
  cargado = modulo.Temporal as unknown as EspacioTemporal;
  return cargado;
}

// ------------------------------------------------------------------ zonas

/**
 * La zona del navegador, sin pedir permiso y sin que nadie sepa dónde está
 * quien mira. No es geolocalización: es un ajuste del sistema que el
 * navegador ya publica.
 */
export function zonaDelNavegador(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** La última parte del nombre IANA, legible: «America/New_York» → «New York». */
export function nombreDeZona(zona: string): string {
  const ultima = zona.split('/').pop() ?? zona;
  return ultima.replace(/_/g, ' ');
}

// ---------------------------------------------------------------- destinos

export type FuenteDestino = 'ciudad' | 'zip' | 'navegador' | 'zona';

export interface Destino {
  /** Estable mientras el destino esté en la lista. */
  id: string;
  /** Lo que se le enseña a quien usa la herramienta: «Miami, Florida». */
  etiqueta: string;
  /** El identificador IANA. */
  zona: string;
  fuente: FuenteDestino;
}

// ------------------------------------------------------------- conversión

export interface Conversion {
  destino: Destino;
  /** La hora ya escrita en el idioma de la página. */
  hora: string;
  /** El día de la semana y la fecha, en el idioma de la página. */
  fecha: string;
  /** Horas de diferencia respecto al origen. Puede tener media hora. */
  diferencia: number;
  /**
   * −1 si allí es el día anterior, +1 si es el siguiente, 0 si es el mismo.
   * Este es el error que de verdad se comete al agendar.
   */
  saltoDeDia: -1 | 0 | 1;
  /** «EDT», «PST», «GMT-5»… tal como lo nombra el propio sitio. */
  abreviatura: string;
}

export interface Momento {
  año: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
}

export type Ambiguedad = 'ninguna' | 'no-existe' | 'ocurre-dos-veces';

export interface Resultado {
  /** El instante, como lo entiende el origen. */
  instante: Date;
  /** Si la hora de partida cae en un salto de horario de verano. */
  ambiguedad: Ambiguedad;
  /** La hora que se acaba usando cuando la pedida no existía. */
  horaCorregida: string | null;
  origen: Conversion;
  destinos: Conversion[];
}

/**
 * El locale con el que se escriben las horas.
 *
 * «es» a secas da las 16:00, y en Colombia —que es de donde salen casi
 * todas las citas de esta herramienta— la gente dice «4:00 p. m.». Un
 * reloj de 24 horas en una frase que se pega en WhatsApp obliga a quien la
 * lee a traducirla mentalmente, que es justo lo que la herramienta viene a
 * evitar.
 */
export function localeDe(lang: string): string {
  return lang === 'es' ? 'es-CO' : 'en-US';
}

function formatear(instante: Date, zona: string, lang: string) {
  const locale = localeDe(lang);

  const hora = new Intl.DateTimeFormat(locale, {
    timeZone: zona,
    hour: 'numeric',
    minute: '2-digit',
  }).format(instante);

  // El día de la semana y la fecha se piden por separado y se unen con un
  // espacio: `weekday` junto a `day` mete una coma («viernes, 4 de
  // septiembre») que en medio de una frase corriente sobra.
  const diaSemana = new Intl.DateTimeFormat(locale, {
    timeZone: zona,
    weekday: 'long',
  }).format(instante);

  const diaMes = new Intl.DateTimeFormat(locale, {
    timeZone: zona,
    day: 'numeric',
    month: 'long',
  }).format(instante);

  const fecha = `${diaSemana} ${diaMes}`;

  // `timeZoneName: 'short'` da «EDT» donde el sitio tiene abreviatura y
  // «GMT-5» donde no. Las dos cosas son lo que la gente reconoce.
  const conZona = new Intl.DateTimeFormat(locale, {
    timeZone: zona,
    timeZoneName: 'short',
  }).format(instante);
  const abreviatura = conZona.split(', ').pop() ?? '';

  return { hora, fecha, abreviatura };
}

/** El día del calendario en una zona, para saber si hay salto de día. */
function diaEnZona(instante: Date, zona: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instante);
}

/** El desfase de una zona respecto a UTC, en minutos, en ese instante. */
function desfaseMinutos(Temporal: EspacioTemporal, instante: Date, zona: string): number {
  const zdt = Temporal.Instant.fromEpochMilliseconds(instante.getTime()).toZonedDateTimeISO(zona);
  return zdt.offsetNanoseconds / 60_000_000_000;
}

export function convertir(
  Temporal: EspacioTemporal,
  momento: Momento,
  zonaOrigen: string,
  etiquetaOrigen: string,
  destinos: Destino[],
  lang: string
): Resultado {
  const campos = {
    timeZone: zonaOrigen,
    year: momento.año,
    month: momento.mes,
    day: momento.dia,
    hour: momento.hora,
    minute: momento.minuto,
  };

  // Primero se pregunta en serio: ¿esta hora existe, y existe una sola vez?
  // Solo `Temporal` sabe responder, y la respuesta importa.
  let rara = false;
  try {
    Temporal.ZonedDateTime.from(campos, { disambiguation: 'reject' });
  } catch {
    rara = true;
  }

  // 'compatible' es lo que hacen los calendarios: adelanta la hora que no
  // existe y se queda con la primera de las que ocurren dos veces.
  const zdt = Temporal.ZonedDateTime.from(campos, { disambiguation: 'compatible' });

  // Los dos casos raros se distinguen por el reloj de pared, no por si
  // `from` protesta: cuando la hora ocurre dos veces, la que sale es la que
  // se pidió y solo cambia el desfase; cuando no existe, el reloj se ha
  // movido a otra hora distinta de la pedida.
  const ambiguedad: Ambiguedad = !rara
    ? 'ninguna'
    : zdt.hour === momento.hora && zdt.minute === momento.minuto
      ? 'ocurre-dos-veces'
      : 'no-existe';
  const instante = new Date(Number(zdt.epochMilliseconds));

  const desfaseOrigen = desfaseMinutos(Temporal, instante, zonaOrigen);
  const diaOrigen = diaEnZona(instante, zonaOrigen);

  const enOrigen = formatear(instante, zonaOrigen, lang);
  const origen: Conversion = {
    destino: { id: 'origen', etiqueta: etiquetaOrigen, zona: zonaOrigen, fuente: 'zona' },
    ...enOrigen,
    diferencia: 0,
    saltoDeDia: 0,
  };

  const convertidos = destinos.map((destino): Conversion => {
    const partes = formatear(instante, destino.zona, lang);
    const desfase = desfaseMinutos(Temporal, instante, destino.zona);
    const dia = diaEnZona(instante, destino.zona);

    return {
      destino,
      ...partes,
      diferencia: (desfase - desfaseOrigen) / 60,
      saltoDeDia: dia === diaOrigen ? 0 : dia < diaOrigen ? -1 : 1,
    };
  });

  const horaCorregida =
    ambiguedad === 'no-existe'
      ? new Intl.DateTimeFormat(localeDe(lang), {
          timeZone: zonaOrigen,
          hour: 'numeric',
          minute: '2-digit',
        }).format(instante)
      : null;

  return { instante, ambiguedad, horaCorregida, origen, destinos: convertidos };
}

// ------------------------------------------------------------------ frase

/**
 * La frase lista para pegar en WhatsApp o en un correo.
 *
 * Es lo que hace que la herramienta sirva de algo: nadie quiere una tabla
 * de conversiones, quiere poder decirle a alguien a qué hora es la cita en
 * *su* hora. Por eso la hora del destino va primero y la del origen entre
 * paréntesis: la frase se escribe para quien la va a recibir.
 */
export function componerFrase(conversion: Conversion, origen: Conversion, lang: string): string {
  const lugar = conversion.destino.etiqueta;

  if (lang === 'es') {
    const dia =
      conversion.saltoDeDia === 0
        ? `el ${conversion.fecha}`
        : `el ${conversion.fecha} (ojo: allí ya es ${conversion.saltoDeDia > 0 ? 'el día siguiente' : 'el día anterior'})`;

    return `Tu cita es ${dia} a las ${conversion.hora}, hora de ${lugar} (${origen.hora} en ${origen.destino.etiqueta}).`;
  }

  const dia =
    conversion.saltoDeDia === 0
      ? `on ${conversion.fecha}`
      : `on ${conversion.fecha} (note: that is the ${conversion.saltoDeDia > 0 ? 'next' : 'previous'} day where you are)`;

  return `Your appointment is ${dia} at ${conversion.hora}, ${lugar} time (${origen.hora} in ${origen.destino.etiqueta}).`;
}

// ------------------------------------------------------------------ datos

export interface DatosCiudades {
  generado: string;
  fuente: string;
  zonas: string[];
  regiones: string[];
  /** [nombre, nombreSinTildes, país, índiceRegión, índiceZona] */
  ciudades: [string, string, string, number, number][];
}

export interface DatosZips {
  generado: string;
  fuente: string;
  prefijos: Record<string, string>;
  excepciones: Record<string, string>;
}

/** Sin tildes y en minúsculas, para que «bogota» encuentre «Bogotá». */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export interface Coincidencia {
  etiqueta: string;
  zona: string;
  pais: string;
}

/**
 * Busca ciudades por prefijo.
 *
 * Las que empiezan por lo escrito van antes que las que solo lo contienen,
 * y dentro de cada grupo manda la población, porque el archivo ya viene
 * ordenado por ella. Quien escribe «san» quiere San Francisco, no San
 * Pedro de Macorís.
 */
export function buscarCiudades(
  datos: DatosCiudades,
  consulta: string,
  limite = 8
): Coincidencia[] {
  const busqueda = normalizar(consulta);
  if (busqueda.length < 2) return [];

  const empiezan: Coincidencia[] = [];
  const contienen: Coincidencia[] = [];

  for (const [nombre, ascii, pais, region, zona] of datos.ciudades) {
    const contra = normalizar(ascii || nombre);
    const posicion = contra.indexOf(busqueda);
    if (posicion === -1) continue;

    const nombreRegion = datos.regiones[region];
    const coincidencia: Coincidencia = {
      etiqueta: nombreRegion ? `${nombre}, ${nombreRegion}` : nombre,
      zona: datos.zonas[zona]!,
      pais,
    };

    if (posicion === 0) empiezan.push(coincidencia);
    else contienen.push(coincidencia);

    if (empiezan.length >= limite) break;
  }

  return [...empiezan, ...contienen].slice(0, limite);
}

/**
 * El huso de un código ZIP de Estados Unidos.
 *
 * Los datos guardan un huso por cada prefijo de tres dígitos y, aparte,
 * solo los códigos que se salen de lo que dice su prefijo. Es lo que
 * permite cubrir 41.000 códigos en 2 KB comprimidos.
 */
export function zonaDeZip(datos: DatosZips, zip: string): string | null {
  const limpio = zip.trim().slice(0, 5);
  if (!/^\d{5}$/.test(limpio)) return null;
  return datos.excepciones[limpio] ?? datos.prefijos[limpio.slice(0, 3)] ?? null;
}
