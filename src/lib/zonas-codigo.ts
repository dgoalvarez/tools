/**
 * Las zonas horarias que caben en el código del tablero.
 *
 * ---------------------------------------------------------------------
 * Por qué una lista y no el nombre
 *
 * «America/Argentina/Buenos_Aires» son 30 bytes. Un reloj mundial en el
 * código del tablero costaría más que todo el resto del tablero junto, y
 * la promesa entera del código es que sea corto.
 *
 * Con una lista, una zona son dos bytes: su posición. El precio es que la
 * lista tiene que estar CONGELADA — reordenarla o quitar una entrada
 * cambiaría la ciudad de todos los tableros que circulen con un reloj
 * dentro, en silencio y para siempre. Se añade al final y no se toca
 * nada más, igual que los códigos de los widgets.
 *
 * ---------------------------------------------------------------------
 * Por qué no `Intl.supportedValuesOf('timeZone')`
 *
 * Sería la lista completa y gratis, pero cambia entre navegadores y entre
 * versiones del mismo navegador: guardar un índice de ahí significa que
 * el mismo código abre ciudades distintas en dos aparatos. Es exactamente
 * el fallo silencioso que el checksum no puede cazar, porque el código
 * sería válido.
 *
 * ---------------------------------------------------------------------
 * Qué entra aquí
 *
 * No todas las zonas del mundo: las que alguien pone en un tablero. Son
 * las capitales y centros de trabajo de cada franja, de modo que
 * cualquier hora del planeta esté a menos de una hora de alguna de la
 * lista. Quien necesite la suya exacta la tiene en la herramienta de
 * husos, que no pasa por aquí.
 *
 * El nombre que se enseña sale de `Intl`, en el idioma de quien mira; lo
 * que se guarda aquí es solo el identificador IANA.
 */

/** Congelada. Se añade AL FINAL y no se reordena. */
export const ZONAS = [
  'Pacific/Midway',
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Vancouver',
  'America/Denver',
  'America/Phoenix',
  'America/Mexico_City',
  'America/Chicago',
  'America/Guatemala',
  'America/Bogota',
  'America/Lima',
  'America/New_York',
  'America/Toronto',
  'America/Panama',
  'America/Havana',
  'America/Caracas',
  'America/Santiago',
  'America/La_Paz',
  'America/Asuncion',
  'America/Halifax',
  'America/Santo_Domingo',
  'America/Puerto_Rico',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'America/Montevideo',
  'Atlantic/Azores',
  'Atlantic/Cape_Verde',
  'UTC',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Lisbon',
  'Africa/Casablanca',
  'Europe/Madrid',
  'Europe/Paris',
  'Europe/Brussels',
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/Zurich',
  'Europe/Rome',
  'Europe/Vienna',
  'Europe/Prague',
  'Europe/Warsaw',
  'Europe/Stockholm',
  'Europe/Oslo',
  'Europe/Copenhagen',
  'Africa/Lagos',
  'Africa/Algiers',
  'Europe/Athens',
  'Europe/Helsinki',
  'Europe/Bucharest',
  'Europe/Kyiv',
  'Europe/Istanbul',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Nairobi',
  'Asia/Jerusalem',
  'Asia/Beirut',
  'Asia/Riyadh',
  'Europe/Moscow',
  'Asia/Tehran',
  'Asia/Dubai',
  'Asia/Baku',
  'Asia/Karachi',
  'Asia/Tashkent',
  'Asia/Kolkata',
  'Asia/Colombo',
  'Asia/Kathmandu',
  'Asia/Dhaka',
  'Asia/Yangon',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Ho_Chi_Minh',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Taipei',
  'Asia/Manila',
  'Australia/Perth',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Guadalcanal',
  'Pacific/Norfolk',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Chatham',
  'Pacific/Apia',
  'Pacific/Kiritimati',
] as const;

export type ZonaIndice = number;

/** El índice de la zona de fábrica: UTC, que no depende de dónde estés. */
export const ZONA_INICIAL = ZONAS.indexOf('UTC');

/**
 * La zona que corresponde a un índice, o `null` si el índice no existe.
 *
 * `null` y no una zona por defecto: un índice fuera de la lista viene de
 * un catálogo que no es este, y devolver otra ciudad en silencio sería
 * enseñar una hora que nadie pidió.
 */
export function zonaDe(indice: number): string | null {
  return ZONAS[indice] ?? null;
}

/**
 * El nombre de una zona en el idioma de quien mira.
 *
 * Sale de `Intl` y no de una tabla escrita a mano: son noventa y tantas
 * zonas por dos idiomas, y mantener eso a mano es garantizar que se
 * quede viejo. Si el navegador no sabe dar el nombre largo, se enseña la
 * última parte del identificador con los guiones bajos quitados, que es
 * legible aunque no esté traducido.
 */
export function nombreDeZona(zona: string, lang: string): string {
  const suelto = zona.split('/').pop()!.replace(/_/g, ' ');
  if (zona === 'UTC') return 'UTC';

  try {
    const formato = new Intl.DateTimeFormat(lang, { timeZone: zona, timeZoneName: 'long' });
    const parte = formato.formatToParts(new Date()).find((p) => p.type === 'timeZoneName');
    // El nombre largo de una zona es «hora central europea», que dice la
    // franja pero no la ciudad. Interesan las dos, y la ciudad primero:
    // es lo que alguien busca cuando pone un reloj en su tablero.
    return parte ? `${suelto} · ${parte.value}` : suelto;
  } catch {
    return suelto;
  }
}
