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
  /** «Miami, Florida». Es lo que va en la frase que se copia. */
  etiqueta: string;
  /** El primer renglón de la ficha: «Miami». */
  ciudad: string;
  /**
   * El segundo: «Florida». Vacío cuando el destino se reconstruye desde
   * un enlace, donde solo viaja la zona y el nombre sale de ella.
   */
  region: string;
  /** El código ISO de dos letras, o vacío. */
  pais: string;
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
  /** La misma, en corto: «dom 30 ago». Para la lista. */
  fechaCorta: string;
  /** Horas de diferencia respecto al origen. Puede tener media hora. */
  diferencia: number;
  /**
   * −1 si allí es el día anterior, +1 si es el siguiente, 0 si es el mismo.
   * Este es el error que de verdad se comete: acertar la hora y
   * equivocarse el día.
   */
  saltoDeDia: -1 | 0 | 1;
  /** «EDT», «PST», «GMT-5»… tal como lo nombra el propio sitio. */
  abreviatura: string;
  /**
   * Los minutos desde medianoche que marca el reloj allí.
   *
   * La hora ya viene escrita en `hora`, pero escrita en el idioma de la
   * página: «3:00 p. m.». Para poder EDITARLA hace falta el número, y
   * volver a sacarlo de esa cadena sería analizar un formato que cambia
   * con el idioma.
   */
  minutos: number;
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

/**
 * El reloj de pared de una zona en un instante: la fecha y la hora tal y
 * como las lee alguien que esté allí.
 *
 * Sale en el formato de los campos del formulario —2026-09-04 y 17:00— y
 * no en el del idioma: esto no se enseña, se mete en un `<input>`.
 *
 * Se usa `sv-SE` por una razón práctica: es el único locale común que
 * escribe la fecha en ISO y la hora en 24 horas sin adornos, así que el
 * resultado se parte por el espacio y ya está. La alternativa era pedir
 * las siete partes por separado y volver a montarlas.
 */
export function camposEnZona(instante: Date, zona: string): { fecha: string; hora: string } {
  const texto = new Intl.DateTimeFormat('sv-SE', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(instante);

  const [fecha, hora] = texto.split(' ');
  return { fecha: fecha ?? '', hora: (hora ?? '').slice(0, 5) };
}

/**
 * El desfase de una zona respecto a UTC, en minutos.
 *
 * Lo hay ya en este archivo, pero con `Temporal`, y `Temporal` llega por
 * un `import()` que hay que esperar. Esto es síncrono y sirve para lo que
 * solo necesita pintar una diferencia: el reloj mundial.
 *
 * Sale de `longOffset`, que da «GMT-05:00» y a veces «GMT» a secas. Los
 * husos de media hora —India, Nepal, Chatham— salen bien porque los
 * minutos vienen aparte.
 */
export function desfaseDeZona(instante: Date, zona: string): number {
  try {
    const texto = new Intl.DateTimeFormat('en-US', {
      timeZone: zona,
      timeZoneName: 'longOffset',
    })
      .formatToParts(instante)
      .find((p) => p.type === 'timeZoneName')!.value;

    const partes = /GMT([+-])(\d{2}):(\d{2})/.exec(texto);
    if (!partes) return 0;
    const signo = partes[1] === '-' ? -1 : 1;
    return signo * (Number(partes[2]) * 60 + Number(partes[3]));
  } catch {
    return 0;
  }
}

/** El día del calendario en una zona, para saber si allí es otro día. */
export function diaDeZona(instante: Date, zona: string): string {
  return camposEnZona(instante, zona).fecha;
}

/** Los minutos desde medianoche que marca el reloj de una zona. */
export function minutosEnZona(instante: Date, zona: string): number {
  const [h, m] = camposEnZona(instante, zona).hora.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
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

  // La misma fecha en corto —«dom 30 ago»— para la lista, donde cada
  // línea comparte renglón con la hora y la diferencia. La larga se queda
  // para la frase que se copia, que se lee y no se escanea.
  const fechaCorta = new Intl.DateTimeFormat(locale, {
    timeZone: zona,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
    .format(instante)
    .replace(/,/g, '');

  // `timeZoneName: 'short'` da «EDT» donde el sitio tiene abreviatura y
  // «GMT-5» donde no. Las dos cosas son lo que la gente reconoce.
  const conZona = new Intl.DateTimeFormat(locale, {
    timeZone: zona,
    timeZoneName: 'short',
  }).format(instante);
  const abreviatura = conZona.split(', ').pop() ?? '';

  return { hora, fecha, fechaCorta, abreviatura };
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

  const enOrigen = {
    ...formatear(instante, zonaOrigen, lang),
    minutos: minutosEnZona(instante, zonaOrigen),
  };
  const origen: Conversion = {
    destino: {
      id: 'origen',
      etiqueta: etiquetaOrigen,
      ciudad: etiquetaOrigen,
      region: '',
      pais: '',
      zona: zonaOrigen,
      fuente: 'zona',
    },
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
      minutos: minutosEnZona(instante, destino.zona),
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
 * de conversiones, quiere una línea que se pega y se entiende sola.
 *
 * La forma es «cuando aquí son las X, allí son las Y», que es la pregunta
 * tal y como se hace. Antes decía «tu cita es…», y eso obligaba a que
 * siempre hubiera una cita: la herramienta sirve igual para saber cuándo
 * abre una tienda, cuándo sale un vuelo o a qué hora emiten algo.
 */
export function componerFrase(conversion: Conversion, origen: Conversion, lang: string): string {
  const lugar = conversion.destino.etiqueta;

  if (lang === 'es') {
    const dia =
      conversion.saltoDeDia === 0
        ? `(${conversion.fecha})`
        : `(${conversion.fecha} — ojo: allí ya es ${conversion.saltoDeDia > 0 ? 'el día siguiente' : 'el día anterior'})`;

    return `Cuando en ${origen.destino.etiqueta} son las ${origen.hora}, en ${lugar} son las ${conversion.hora} ${dia}.`;
  }

  const dia =
    conversion.saltoDeDia === 0
      ? `(${conversion.fecha})`
      : `(${conversion.fecha} — note: that is the ${conversion.saltoDeDia > 0 ? 'next' : 'previous'} day there)`;

  return `When it is ${origen.hora} in ${origen.destino.etiqueta}, it is ${conversion.hora} in ${lugar} ${dia}.`;
}

/**
 * Todas las horas en un solo mensaje.
 *
 * Sustituye a las frases sueltas que había bajo cada ficha, y no solo por
 * espacio: cuando son cinco sitios lo que se manda es UN
 * mensaje al grupo, no cinco frases iguales una detrás de otra. El aviso
 * de que allí es otro día viaja dentro de la línea que le toca, que es
 * donde hace falta.
 *
 * `componerFrase` se queda para una sola ciudad; las dos hacen falta.
 */
export function componerLista(destinos: Conversion[], origen: Conversion, lang: string): string {
  const es = lang === 'es';

  const linea = (c: Conversion, esOrigen: boolean) => {
    const quien = esOrigen
      ? `${c.destino.etiqueta} (${es ? 'tu hora' : 'your time'})`
      : c.destino.etiqueta;

    const aviso =
      c.saltoDeDia === 0
        ? ''
        : es
          ? ` (ojo: allí ya es el día ${c.saltoDeDia > 0 ? 'siguiente' : 'anterior'})`
          : ` (note: that is the ${c.saltoDeDia > 0 ? 'next' : 'previous'} day there)`;

    return `· ${quien} — ${c.fecha}, ${c.hora}${aviso}`;
  };

  const cabecera = es ? 'La hora en cada sitio:' : 'The time in each place:';

  return [cabecera, linea(origen, true), ...destinos.map((c) => linea(c, false))].join('\n');
}

// ------------------------------------------------------------------ datos

export interface DatosLugares {
  generado: string;
  fuente: string;
  zonas: string[];
  /** [nombre, enEspañol, enInglés]. Vacío cuando se escribe igual. */
  regiones: [string, string, string][];
  /**
   * [nombre, sinTildes, país, índiceRegión, índiceZona, enEspañol, enInglés]
   *
   * Los dos últimos van vacíos cuando el nombre se escribe igual en ese
   * idioma, que es lo normal: solo 982 ciudades tienen nombre propio en
   * español y 826 en inglés. Guardar «Madrid» dos veces serían bytes que
   * alguien descarga para nada.
   */
  ciudades: [string, string, string, number, number, string, string][];
  /**
   * Estados, departamentos y provincias.
   *
   * [nombre, sinTildes, país, índiceZona, enEspañol, enInglés, partido]
   *
   * Un sitio partido entre husos aparece una vez por huso, y `partido`
   * vale 1 en todas sus filas: es lo que le dice a la interfaz que tiene
   * que escribir de cuál se trata. Florida sale dos veces, Nunavut tres.
   */
  divisiones: [string, string, string, number, string, string, number][];
  /**
   * Países. [códigoISO, índiceZona, partido]
   *
   * Sin nombre: lo pone `Intl.DisplayNames` en el idioma de la página.
   * Doscientos cuarenta nombres por dos idiomas que nadie tiene que
   * descargar, y traducidos por el navegador y no por este proyecto.
   */
  paises: [string, number, number][];
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

/**
 * Cómo se llama un huso, sin decir si está en horario de verano.
 *
 * «hora oriental», «hora del Pacífico», «Eastern Time». Es lo que
 * distingue las dos Floridas, y sale del navegador en el idioma de la
 * página: no se guarda ni un byte de esto.
 */
export function nombreGenericoDeZona(zona: string, lang: string): string {
  try {
    const parte = new Intl.DateTimeFormat(lang, { timeZone: zona, timeZoneName: 'longGeneric' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName');
    return parte?.value ?? '';
  } catch {
    return '';
  }
}

export type TipoLugar = 'ciudad' | 'division' | 'pais';

export interface Coincidencia {
  /** El nombre en el idioma de la página: «Londres» o «London». */
  ciudad: string;
  /** La región, también traducida. Vacía si el lugar no tiene. */
  region: string;
  /** El código ISO de dos letras. El nombre lo pone Intl.DisplayNames. */
  pais: string;
  zona: string;
  /** Ciudad, estado o país. Cambia el icono y el orden, no el cálculo. */
  tipo: TipoLugar;
  /**
   * De qué huso del sitio se trata, cuando el sitio está partido:
   * «hora central». Vacío en todo lo demás, que es casi todo.
   */
  matiz: string;
  /**
   * «Londres, Inglaterra». Es lo que va en la frase que se copia, donde
   * una sola línea tiene que decirlo todo. En pantalla no se usa: ahí van
   * la ciudad y la región en dos renglones, que es lo que impide que un
   * nombre largo reviente la ficha.
   */
  etiqueta: string;
}

/** El nombre de un país en el idioma de la página, o su código. */
export function nombreDePais(codigo: string, lang: string): string {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(codigo) ?? codigo;
  } catch {
    // Un código que no existe, o un navegador sin DisplayNames.
    return codigo;
  }
}

/**
 * Dónde empieza lo buscado dentro de un nombre, mirando todas sus formas.
 *
 * Se busca contra los cuatro nombres a la vez y no contra el del idioma de
 * la página: quien escribe «Londres» en la página en inglés también tiene
 * que encontrarla. La posición que cuenta es la mejor de las cuatro, para
 * que «lond» ponga Londres antes que Nueva Londres.
 */
function dondeEmpieza(busqueda: string, candidatos: (string | undefined)[]): number {
  let posicion = -1;
  for (const candidato of candidatos) {
    if (!candidato) continue;
    const donde = normalizar(candidato).indexOf(busqueda);
    if (donde !== -1 && (posicion === -1 || donde < posicion)) posicion = donde;
  }
  return posicion;
}

/** Los nombres de país en un idioma, calculados una vez. */
const nombresDePais = new Map<string, Map<string, string>>();

function tablaDePaises(codigos: string[], lang: string): Map<string, string> {
  let tabla = nombresDePais.get(lang);
  if (tabla) return tabla;
  tabla = new Map();
  for (const codigo of codigos) tabla.set(codigo, nombreDePais(codigo, lang));
  nombresDePais.set(lang, tabla);
  return tabla;
}

/**
 * Busca sitios: ciudades, estados y países.
 *
 * Los que empiezan por lo escrito van antes que los que solo lo contienen.
 * Dentro de cada grupo mandan dos cosas, en este orden: **primero las
 * ciudades**, y luego la población, porque los tres archivos ya vienen
 * ordenados por ella.
 *
 * Que las ciudades vayan primero es una decisión, no un descuido. «Madrid»
 * es casi siempre la ciudad y no la Comunidad de Madrid; «Guatemala» es
 * casi siempre la ciudad. Cuando lo que se quiere es el país o el estado,
 * está justo debajo — y cuando la ciudad no existe con ese nombre, como
 * «Colombia» o «Florida», el primero de la lista ya es el que se buscaba.
 */
export function buscarLugares(
  datos: DatosLugares,
  consulta: string,
  lang: string,
  limite = 10
): Coincidencia[] {
  const busqueda = normalizar(consulta);
  if (busqueda.length < 2) return [];

  const enEspanol = lang === 'es';
  const empiezan: Coincidencia[] = [];
  const contienen: Coincidencia[] = [];

  const guardar = (posicion: number, c: Coincidencia) => {
    if (posicion === 0) empiezan.push(c);
    else contienen.push(c);
  };

  // ---------- ciudades ----------
  for (const [nombre, ascii, pais, region, zona, es, en] of datos.ciudades) {
    const posicion = dondeEmpieza(busqueda, [nombre, ascii, es, en]);
    if (posicion === -1) continue;

    const ciudad = (enEspanol ? es : en) || nombre;
    const fila = datos.regiones[region];
    const nombreRegion = fila ? (enEspanol ? fila[1] : fila[2]) || fila[0] : '';

    guardar(posicion, {
      ciudad,
      region: nombreRegion,
      pais,
      zona: datos.zonas[zona]!,
      tipo: 'ciudad',
      matiz: '',
      etiqueta: nombreRegion ? `${ciudad}, ${nombreRegion}` : ciudad,
    });

    if (empiezan.length >= limite) break;
  }

  // ---------- estados y departamentos ----------
  for (const [nombre, ascii, pais, zona, es, en, partido] of datos.divisiones) {
    const posicion = dondeEmpieza(busqueda, [nombre, ascii, es, en]);
    if (posicion === -1) continue;

    const division = (enEspanol ? es : en) || nombre;
    const zonaIana = datos.zonas[zona]!;
    const matiz = partido ? nombreGenericoDeZona(zonaIana, lang) : '';

    guardar(posicion, {
      ciudad: division,
      region: '',
      pais,
      zona: zonaIana,
      tipo: 'division',
      matiz,
      etiqueta: matiz ? `${division} (${matiz})` : division,
    });
  }

  // ---------- países ----------
  const tabla = tablaDePaises(
    datos.paises.map((p) => p[0]),
    lang
  );
  for (const [codigo, zona, partido] of datos.paises) {
    const nombre = tabla.get(codigo) ?? codigo;
    const posicion = dondeEmpieza(busqueda, [nombre, codigo]);
    if (posicion === -1) continue;

    const zonaIana = datos.zonas[zona]!;
    const matiz = partido ? nombreGenericoDeZona(zonaIana, lang) : '';

    guardar(posicion, {
      ciudad: nombre,
      region: '',
      pais: codigo,
      zona: zonaIana,
      tipo: 'pais',
      matiz,
      etiqueta: matiz ? `${nombre} (${matiz})` : nombre,
    });
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
