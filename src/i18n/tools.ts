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
import type { Etiquetas } from './labels';
import type { IconoKey } from '../components/iconos';

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
  /** Cómo se ordena y se agrupa. Ver src/i18n/labels.ts. */
  etiquetas: Etiquetas;
  /**
   * El icono del menú. Con el menú plegado es lo único que se ve, así que
   * tiene que distinguirse de los otros de un vistazo, no describir bien la
   * herramienta.
   */
  icono: IconoKey;
}

export const TOOLS: Record<ToolKey, Tool> = {
  timezones: {
    name: { es: 'Husos horarios', en: 'Time zones' },
    // Describe el error que evita, no la mecánica. Convertir horas lo hace
    // cualquiera; lo que se agradece a las once de la noche es que alguien
    // te avise de que allí ya es mañana.
    summary: {
      es: 'Di tu hora en la hora del otro, sin equivocarte de día.',
      en: 'Say your time in their time, without getting the day wrong.',
    },
    description: {
      es: 'Escribe la hora de la cita en tu zona y léela en la de cada persona que tenga que estar. Busca por ciudad —en español o en inglés— o por código ZIP, que es lo que distingue los siete estados de Estados Unidos partidos entre dos husos. Avisa en rojo cuando allí ya es otro día, y te da la frase escrita en su hora, lista para pegar.',
      en: 'Type the meeting time in your zone and read it in everyone else’s. Search by city — in English or Spanish — or by ZIP code, which is what tells apart the seven US states split across two zones. It warns in red when it is already another day there, and hands you the sentence written in their time, ready to paste.',
    },
    listo: true,
    // Sale bajo Productividad, que es donde la busca quien agenda; la
    // atención al cliente es su otro uso y aparece en la ficha.
    etiquetas: {
      ambito: ['productividad', 'atencionCliente'],
      materia: 'tiempo',
      tarea: 'convertir',
    },
    icono: 'reloj',
  },
  pomodoro: {
    name: { es: 'Pomodoro', en: 'Pomodoro' },
    // Lo que distingue a este de los cien que hay: cuenta contra el
    // reloj del sistema, así que no se descuadra si cambias de pestaña o
    // si el portátil se duerme. Eso es lo único que de verdad le pasa a
    // un temporizador, y es lo que casi todos hacen mal.
    summary: {
      es: 'Trabaja en tramos, con descansos que no se te olvidan.',
      en: 'Work in stretches, with breaks you will not forget.',
    },
    description: {
      es: 'Un temporizador pomodoro con las duraciones y el ciclo a tu medida: los minutos de trabajo, los de cada descanso y cada cuántos toca el largo. Avisa con un sonido y con una notificación cuando acaba, y cuenta contra el reloj del sistema, así que no se atrasa aunque cambies de pestaña o el ordenador se suspenda.',
      en: 'A pomodoro timer with the durations and the cycle set your way: minutes of work, minutes of each break, and how many stretches before the long one. It tells you with a sound and a notification when time is up, and it counts against the system clock, so it does not fall behind if you switch tabs or the computer sleeps.',
    },
    listo: true,
    etiquetas: { ambito: ['productividad'], materia: 'tiempo', tarea: 'cronometrar' },
    icono: 'cronometro',
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
    etiquetas: { ambito: ['diseno'], materia: 'color', tarea: 'comprobar' },
    icono: 'contraste',
  },
  scale: {
    name: { es: 'Escala tipográfica', en: 'Type scale' },
    // Describe lo que se ve al entrar. La escala fluida es lo que
    // distingue a la herramienta, pero ahora vive detrás de un
    // interruptor apagado, así que abrir prometiendo clamp() sería
    // prometer una pantalla que no es la primera.
    summary: {
      es: 'Una rampa de tamaños con su alto de línea, y fluida si la necesitas.',
      en: 'A ramp of sizes with its line heights, and fluid if you need it.',
    },
    description: {
      es: 'Genera una escala tipográfica lista para copiar como variables CSS, con el alto de línea sugerido de cada paso y sus tamaños en píxeles y en rem. Si la haces fluida con clamp(), enseña además a cuántos píxeles queda cada paso en 390, 768, 1360 y 1920, y avisa cuando dos se cruzan a algún ancho.',
      en: 'Generate a type scale ready to copy as CSS variables, with the suggested line height for each step and its sizes in pixels and rem. Make it fluid with clamp() and it also shows what each step really measures at 390, 768, 1360 and 1920, and warns when two cross over at some width.',
    },
    listo: true,
    etiquetas: { ambito: ['diseno'], materia: 'tipografia', tarea: 'generar' },
    icono: 'tipografia',
  },
};
