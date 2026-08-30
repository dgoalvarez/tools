/**
 * Qué es cada herramienta, en los dos idiomas.
 *
 * Un solo sitio del que salen: las tarjetas de la portada, el título y la
 * descripción de cada página, y las etiquetas <meta>. Si el nombre de una
 * herramienta cambia, cambia en todas partes a la vez.
 *
 * Su dirección no está aquí: está en `routes.ts`, y se busca por la misma
 * clave.
 */
import type { T } from './config';
import type { ToolKey } from './routes';

interface Tool {
  /** El nombre corto, el del menú y el de la tarjeta. */
  name: T;
  /** Una línea: qué hace. Va en la tarjeta de la portada. */
  summary: T;
  /** Dos o tres líneas: qué problema resuelve. Va en <meta description>. */
  description: T;
  /**
   * Si la herramienta ya existe o su página todavía dice «próximamente».
   * La portada lo enseña: prometer tres cosas y tener una es una forma
   * barata de perder a alguien en la primera visita.
   */
  listo: boolean;
}

export const TOOLS: Record<ToolKey, Tool> = {
  timezones: {
    name: { es: 'Husos horarios', en: 'Time zones' },
    summary: {
      es: 'Una hora, varias ciudades, y el aviso de cuándo cae en otro día.',
      en: 'One time, several cities, and a warning when it lands on another day.',
    },
    description: {
      es: 'Convierte una hora a los husos de quien tenga que estar en la cita, por ciudad o por código ZIP de Estados Unidos, y te da la frase lista para copiar. Avisa cuando la hora cae en otro día, que es el error que de verdad se comete al agendar.',
      en: 'Convert a time to the zones of everyone who has to be in the meeting, by city or by US ZIP code, and get the sentence ready to copy. It warns when the time lands on another day, which is the mistake people actually make when scheduling.',
    },
    listo: false,
  },
  contrast: {
    name: { es: 'Contraste', en: 'Contrast' },
    summary: {
      es: 'WCAG 2.2 y APCA sobre los mismos dos colores, y qué hacer si no pasan.',
      en: 'WCAG 2.2 and APCA on the same two colours, and what to do if they fail.',
    },
    description: {
      es: 'Comprueba el contraste de un color de texto sobre su fondo con WCAG 2.2 y con APCA, explica por qué los dos veredictos pueden no coincidir, y propone el color más cercano que sí aprueba.',
      en: 'Check the contrast of a text colour over its background with WCAG 2.2 and with APCA, understand why the two verdicts can disagree, and get the nearest colour that does pass.',
    },
    listo: true,
  },
  scale: {
    name: { es: 'Escala tipográfica', en: 'Type scale' },
    summary: {
      es: 'Una escala con clamp(), y la tabla de a cuántos píxeles queda de verdad.',
      en: 'A scale with clamp(), and the table of what it really measures.',
    },
    description: {
      es: 'Genera una escala tipográfica fluida con clamp(), lista para copiar como variables CSS, y enseña a cuántos píxeles queda cada paso en 390, 768, 1360 y 1920. Avisa cuando dos pasos se cruzan a algún ancho.',
      en: 'Generate a fluid type scale with clamp(), ready to copy as CSS variables, and see what each step really measures at 390, 768, 1360 and 1920. It warns when two steps cross over at some width.',
    },
    listo: true,
  },
};
