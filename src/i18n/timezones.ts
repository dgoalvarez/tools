/**
 * Los textos de la herramienta de husos horarios, en los dos idiomas.
 */
import type { T } from './config';

export const HUSOS = {
  // ---------- El origen ----------
  origenTitulo: { es: 'La cita', en: 'The appointment' },
  fecha: { es: 'Fecha', en: 'Date' },
  hora: { es: 'Hora', en: 'Time' },
  zonaOrigen: { es: 'Hora de', en: 'Time in' },
  cambiarOrigen: { es: 'Cambiar de dónde es esa hora', en: 'Change whose time that is' },
  cambiar: { es: 'cambiar', en: 'change' },

  // ---------- Añadir destinos ----------
  destinosTitulo: { es: 'Para quién', en: 'Who for' },
  buscar: { es: 'Ciudad o código ZIP de Estados Unidos', en: 'City or US ZIP code' },
  buscarAyuda: {
    es: 'Escribe el nombre de una ciudad o cinco dígitos de un código postal estadounidense.',
    en: 'Type a city name or the five digits of a US ZIP code.',
  },
  miUbicacion: { es: 'Mi ubicación', en: 'My location' },
  cargando: { es: 'Cargando…', en: 'Loading…' },
  sinResultados: { es: 'Ninguna ciudad se llama así', en: 'No city by that name' },
  zipDesconocido: {
    es: 'Ese código postal no está en los datos',
    en: 'That ZIP code is not in the data',
  },
  quitar: { es: 'Quitar', en: 'Remove' },
  quitarTodas: { es: 'Quitar todas', en: 'Remove all' },
  vacio: {
    es: 'Añade a quien tenga que estar en la cita y verás su hora aquí.',
    en: 'Add whoever has to be at the appointment and you will see their time here.',
  },

  // ---------- Resultados ----------
  resultados: { es: 'A qué hora les toca', en: 'What time it is for them' },
  mismoDia: { es: 'el mismo día', en: 'same day' },
  diaSiguiente: { es: 'Allí ya es el día siguiente', en: 'That is the next day there' },
  diaAnterior: {
    es: 'Allí todavía es el día anterior',
    en: 'That is still the previous day there',
  },
  /**
   * Los mismos avisos, en corto.
   *
   * En la lista comparten renglón con la fecha y la diferencia, y la
   * frase larga no cabía. Lo que hace que se vea de lejos no es el texto
   * sino la franja roja del borde de la fila, que no cuesta alto.
   */
  diaSiguienteCorto: { es: 'día siguiente', en: 'next day' },
  diaAnteriorCorto: { es: 'día anterior', en: 'previous day' },
  /** El rótulo de la fila del origen dentro de la lista. */
  tuHora: { es: 'Tu hora', en: 'Your time' },
  misma: { es: 'la misma hora', en: 'same time' },
  adelanto: { es: 'por delante', en: 'ahead' },
  retraso: { es: 'por detrás', en: 'behind' },

  // ---------- La frase ----------
  copiarFrase: { es: 'Copiar la frase', en: 'Copy the sentence' },
  copiarTodas: { es: 'Copiar las horas', en: 'Copy the times' },
  copiado: { es: 'Copiado', en: 'Copied' },

  // ---------- Los saltos de horario de verano ----------
  noExisteTitulo: { es: 'Esa hora no existe ese día', en: 'That time does not exist that day' },
  noExisteCuerpo: {
    es: 'Es el domingo en que ahí adelantan el reloj, así que esa hora se salta. Se usa la siguiente que sí existe:',
    en: 'It is the Sunday the clocks go forward there, so that hour is skipped. The next one that does exist is used:',
  },
  dosVecesTitulo: {
    es: 'Esa hora ocurre dos veces ese día',
    en: 'That time happens twice that day',
  },
  dosVecesCuerpo: {
    es: 'Es el domingo en que ahí atrasan el reloj, así que esa hora se repite. Se usa la primera de las dos, que es lo que hacen los calendarios.',
    en: 'It is the Sunday the clocks go back there, so that hour repeats. The first of the two is used, which is what calendars do.',
  },

  // ---------- Atribución y límites ----------
  precisionTitulo: { es: 'Hasta dónde llega el código postal', en: 'How far the ZIP code goes' },
  ubicacionTitulo: { es: 'Qué es «mi ubicación»', en: 'What “my location” means' },
  ubicacionCuerpo: {
    es: 'La zona horaria que ya tiene configurada tu sistema operativo. El navegador la publica sin pedir permiso y sin decirle a nadie dónde estás: no es geolocalización, y esta página no la envía a ningún sitio.',
    en: 'The time zone your operating system is already set to. The browser reports it without asking for permission and without telling anyone where you are: it is not geolocation, and this page sends it nowhere.',
  },
  saltosTitulo: { es: 'Los dos domingos raros del año', en: 'The two odd Sundays of the year' },
  saltosCuerpo: {
    es: 'En los sitios que cambian la hora hay un domingo en que una hora no existe y otro en que ocurre dos veces. Cuando la cita cae ahí, la herramienta lo dice en vez de elegir en silencio.',
    en: 'Where clocks change there is one Sunday when an hour does not exist and another when it happens twice. When the appointment lands there, the tool says so instead of choosing silently.',
  },
  datosTitulo: { es: 'De dónde salen los datos', en: 'Where the data comes from' },
  datosCuerpo: {
    es: 'Las ciudades y los códigos postales vienen de GeoNames. El huso de cada código postal se deduce del condado al que pertenece, que es el nivel al que existen de verdad las fronteras horarias.',
    en: 'Cities and ZIP codes come from GeoNames. Each ZIP code’s zone is worked out from its county, which is the level at which time-zone borders actually exist.',
  },
  /**
   * La atribución, resumida a una línea.
   *
   * Es lo único de todo lo que explicaba la herramienta que NO se puede
   * mover al paso a paso: la licencia CC BY obliga a atribuir donde se usa
   * la obra, y el paso a paso necesita JavaScript. Se queda impresa en la
   * página.
   */
  atribucion: {
    es: 'Ciudades, regiones y códigos postales de',
    en: 'Cities, regions and ZIP codes from',
  },
  /**
   * Lo que se ve del desplegable esté abierto o cerrado.
   *
   * Nombra la fuente y la licencia porque eso es exactamente lo que la
   * CC BY pide identificar. Lo que se pliega detrás es la explicación de
   * la precisión, que es opcional; esto no lo es.
   */
  fuenteResumen: {
    es: 'Datos de GeoNames · CC BY 4.0',
    en: 'Data from GeoNames · CC BY 4.0',
  },
  precisionCuerpo: {
    es: 'Las zonas horarias siguen fronteras políticas —países, estados, condados—, nunca barrios. El código postal sirve para distinguir los estados partidos en dos husos, como Florida o Indiana; dentro de una misma ciudad no cambia nada.',
    en: 'Time zones follow political borders — countries, states, counties — never neighbourhoods. The ZIP code is what tells apart the states split across two zones, such as Florida or Indiana; within one city it changes nothing.',
  },
} satisfies Record<string, T>;
