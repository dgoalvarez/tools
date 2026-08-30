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
  ahora: { es: 'Ahora', en: 'Now' },

  // ---------- Añadir destinos ----------
  destinosTitulo: { es: 'Para quién', en: 'Who for' },
  buscar: { es: 'Ciudad o código ZIP de Estados Unidos', en: 'City or US ZIP code' },
  buscarAyuda: {
    es: 'Escribe el nombre de una ciudad o cinco dígitos de un código postal estadounidense.',
    en: 'Type a city name or the five digits of a US ZIP code.',
  },
  miUbicacion: { es: 'Mi ubicación', en: 'My location' },
  miUbicacionAyuda: {
    es: 'La zona que ya tiene configurada tu sistema. No se pide permiso y nadie sabe dónde estás.',
    en: 'The zone your system is already set to. No permission is asked and nobody learns where you are.',
  },
  cargando: { es: 'Cargando…', en: 'Loading…' },
  sinResultados: { es: 'Ninguna ciudad se llama así', en: 'No city by that name' },
  zipDesconocido: { es: 'Ese código postal no está en los datos', en: 'That ZIP code is not in the data' },
  yaEstaba: { es: 'Ese destino ya está en la lista', en: 'That destination is already on the list' },
  quitar: { es: 'Quitar', en: 'Remove' },
  vacio: {
    es: 'Añade a quien tenga que estar en la cita y verás su hora aquí.',
    en: 'Add whoever has to be at the appointment and you will see their time here.',
  },

  // ---------- Resultados ----------
  resultados: { es: 'A qué hora les toca', en: 'What time it is for them' },
  mismoDia: { es: 'el mismo día', en: 'same day' },
  diaSiguiente: { es: 'Allí ya es el día siguiente', en: 'That is the next day there' },
  diaAnterior: { es: 'Allí todavía es el día anterior', en: 'That is still the previous day there' },
  misma: { es: 'la misma hora', en: 'same time' },
  adelanto: { es: 'por delante', en: 'ahead' },
  retraso: { es: 'por detrás', en: 'behind' },

  // ---------- La frase ----------
  copiarFrase: { es: 'Copiar la frase', en: 'Copy the sentence' },
  copiado: { es: 'Copiado', en: 'Copied' },
  copiarEnlace: { es: 'Copiar el enlace de esta cita', en: 'Copy the link to this appointment' },
  fraseAyuda: {
    es: 'Lista para pegar en WhatsApp o en un correo. La hora que va primero es la suya, no la tuya.',
    en: 'Ready to paste into WhatsApp or an email. The time that comes first is theirs, not yours.',
  },

  // ---------- Los saltos de horario de verano ----------
  noExisteTitulo: { es: 'Esa hora no existe ese día', en: 'That time does not exist that day' },
  noExisteCuerpo: {
    es: 'Es el domingo en que ahí adelantan el reloj, así que esa hora se salta. Se usa la siguiente que sí existe:',
    en: 'It is the Sunday the clocks go forward there, so that hour is skipped. The next one that does exist is used:',
  },
  dosVecesTitulo: { es: 'Esa hora ocurre dos veces ese día', en: 'That time happens twice that day' },
  dosVecesCuerpo: {
    es: 'Es el domingo en que ahí atrasan el reloj, así que esa hora se repite. Se usa la primera de las dos, que es lo que hacen los calendarios.',
    en: 'It is the Sunday the clocks go back there, so that hour repeats. The first of the two is used, which is what calendars do.',
  },

  // ---------- Atribución y límites ----------
  precisionTitulo: { es: 'Hasta dónde llega el código postal', en: 'How far the ZIP code goes' },
  precisionCuerpo: {
    es: 'Las zonas horarias siguen fronteras políticas —países, estados, condados—, nunca barrios. El código postal sirve para distinguir los estados partidos en dos husos, como Florida o Indiana; dentro de una misma ciudad no cambia nada.',
    en: 'Time zones follow political borders — countries, states, counties — never neighbourhoods. The ZIP code is what tells apart the states split across two zones, such as Florida or Indiana; within one city it changes nothing.',
  },
} satisfies Record<string, T>;
