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
      es: 'Qué hora es en otro sitio cuando aquí son las tres.',
      en: 'What time it is somewhere else when it is three o’clock here.',
    },
    description: {
      es: 'Abre en vivo: pones los sitios que te interesen y ves qué hora es allí ahora mismo. Tocas una hora —la tuya o la de cualquier sitio— y se queda quieta, traducida a todas las demás, sin perder de vista la de verdad. Busca por ciudad, estado o departamento, país o código ZIP, y los sitios partidos entre dos husos salen uno por huso en vez de elegir por ti. Avisa en rojo cuando allí ya es otro día.',
      en: 'It opens live: add the places you care about and see what time it is there right now. Touch a time — yours or any other — and it holds still, translated into all the rest, without losing sight of the real one. Search by city, state or province, country or ZIP code, and places split between two zones come up once per zone instead of choosing for you. It warns in red when it is already another day there.',
    },
    listo: true,
    // Sale bajo Productividad, que es donde se busca; la atención al
    // cliente es su otro uso y aparece en la ficha.
    etiquetas: {
      ambito: ['productividad', 'atencionCliente'],
      materia: 'tiempo',
      tarea: 'convertir',
    },
    icono: 'reloj',
  },
  clock: {
    name: { es: 'Reloj', en: 'Clock' },
    // Lo que lo distingue del reloj del sistema: no es la hora, son las
    // tres cosas que se necesitan CON la hora delante y que en un
    // ordenador están cada una en un sitio distinto.
    summary: {
      es: 'La hora de aquí y la de medio mundo, con alarma, cronómetro y temporizador.',
      en: 'The time here and half the world’s, with an alarm, a stopwatch and a timer.',
    },
    description: {
      es: 'Un reloj de pantalla completa —digital o analógico, con la fecha si la quieres y en 12 o 24 horas—, un reloj mundial con los sitios que le pongas, y debajo una alarma, un cronómetro con vueltas y un temporizador. Todos pueden correr a la vez y avisan con sonido y notificación. La alarma solo suena con la pestaña abierta: no hay servidor detrás.',
      en: 'A full-screen clock — digital or analogue, with the date if you want it, in 12 or 24 hours — a world clock with the places you add, and below it an alarm, a stopwatch with laps and a timer. They can all run at once and warn you with a sound and a notification. The alarm only rings while the tab is open: there is no server behind it.',
    },
    listo: true,
    etiquetas: { ambito: ['productividad'], materia: 'tiempo', tarea: 'cronometrar' },
    icono: 'despertador',
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
  notes: {
    name: { es: 'Notas', en: 'Notes' },
    // Dice lo que es y para cuándo es. «Para lo que estás haciendo ahora»
    // hace el trabajo de explicar por qué se borra al cerrar: no es una
    // agenda, es el papel que se tiene al lado mientras dura el rato.
    summary: {
      es: 'Una lista y un papel para lo que estás haciendo ahora.',
      en: 'A list and a scrap of paper for what you are doing right now.',
    },
    description: {
      es: 'Apunta lo que tienes que hacer en este rato y ve marcándolo, con un papel al lado para lo que no es una tarea: un enlace, un número, tres frases. Se queda mientras la pestaña siga abierta —aguanta recargas y saltar a otra herramienta y volver— y desaparece al cerrarla. No hay cuenta ni servidor, y nada de lo que escribas sale de tu aparato. La lista se copia en Markdown para llevártela a donde haga falta.',
      en: 'Jot down what you have to do in this stretch and tick it off as you go, with a scrap of paper beside it for what is not a task: a link, a number, three sentences. It stays as long as the tab is open — it survives reloads and a trip to another tool and back — and goes when you close it. There is no account and no server, and nothing you write leaves your device. The list copies out as Markdown so you can take it wherever you need.',
    },
    listo: true,
    etiquetas: { ambito: ['productividad'], materia: 'texto', tarea: 'anotar' },
    icono: 'notas',
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
  palette: {
    name: { es: 'Paleta', en: 'Palette' },
    // Lo que la distingue de las cien que hay: cada paso dice si aguanta
    // texto encima y con qué tinta. Una paleta que no contesta a eso
    // obliga a llevarse cada shade a otra herramienta.
    summary: {
      es: 'Rampas de color desde el tuyo, y cuáles de sus pasos aguantan texto.',
      en: 'Colour ramps from yours, and which of their steps can carry text.',
    },
    description: {
      es: 'Genera la rampa de cada color que le des —claros, medios y oscuros— con una escalera de luminosidad común a todos, así que el 500 de un azul pesa lo mismo que el de un rojo. El color que pegas vuelve intacto en su paso, cada shade dice si el blanco o el negro pasan AA encima, y sale en variables CSS listas para copiar.',
      en: 'Builds the ramp of every colour you give it — lights, mids and darks — on a lightness ladder shared by all of them, so a blue’s 500 weighs the same as a red’s. The colour you paste comes back untouched at its step, every shade tells you whether white or black passes AA on top, and it comes out as CSS variables ready to copy.',
    },
    listo: true,
    etiquetas: { ambito: ['diseno'], materia: 'color', tarea: 'generar' },
    icono: 'paleta',
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
