/**
 * Los textos del pomodoro, en los dos idiomas.
 */
import type { T } from './config';

export const POMODORO = {
  // ---------- Las fases ----------
  /**
   * «Trabajo» y no «concentración» ni «foco»: es lo que la gente llama a
   * lo que está haciendo, y el método se explica solo si los nombres no
   * hay que traducirlos mentalmente.
   */
  faseTrabajo: { es: 'Trabajo', en: 'Work' },
  faseCorto: { es: 'Descanso', en: 'Break' },
  faseLargo: { es: 'Descanso largo', en: 'Long break' },

  // ---------- Los mandos ----------
  empezar: { es: 'Empezar', en: 'Start' },
  seguir: { es: 'Seguir', en: 'Resume' },
  pausar: { es: 'Pausar', en: 'Pause' },
  reiniciar: { es: 'Reiniciar la fase', en: 'Restart this phase' },
  saltar: { es: 'Saltar a la siguiente', en: 'Skip to the next' },
  /** Vuelve todo a cero: la fase, la cuenta y los pomodoros hechos. */
  desdeCero: { es: 'Empezar de cero', en: 'Start over' },

  // ---------- El ciclo ----------
  ciclo: { es: 'El ciclo', en: 'The cycle' },
  hechos: { es: 'Pomodoros hechos', en: 'Pomodoros done' },
  siguienteEs: { es: 'Después:', en: 'Next:' },

  // ---------- Los ajustes ----------
  ajustes: { es: 'Duraciones', en: 'Durations' },
  minutosTrabajo: { es: 'Trabajo', en: 'Work' },
  minutosCorto: { es: 'Descanso', en: 'Break' },
  minutosLargo: { es: 'Descanso largo', en: 'Long break' },
  /**
   * «El largo, cada» y no «Descanso largo cada»: la etiqueta va a la
   * izquierda del campo y la de arriba ya dice «Descanso largo», así que
   * repetirlo entero solo gastaba ancho.
   */
  cada: { es: 'El largo, cada', en: 'Long one, every' },
  pomodoros: { es: 'pomodoros', en: 'pomodoros' },
  minutos: { es: 'min', en: 'min' },
  segundos: { es: 's', en: 's' },
  /** Se admiten medios minutos: «2,5 min» son dos minutos y medio. */
  admiteMedios: {
    es: 'Puedes poner medios minutos: 2,5 son dos y medio.',
    en: 'You can use half minutes: 2.5 is two and a half.',
  },
  /**
   * Se avisa de que cambiar las duraciones con algo en marcha no corta la
   * cuenta: se aplica a la fase siguiente. Cortarla sería castigar a
   * quien solo quería mirar los ajustes.
   */
  cambioEnMarcha: {
    es: 'Lo que cambies se aplica en la fase siguiente; la que está en marcha sigue igual.',
    en: 'What you change applies to the next phase; the one running carries on unchanged.',
  },

  // ---------- El margen ----------
  margen: { es: 'Margen entre fases', en: 'Gap between phases' },
  margenAyuda: {
    es: 'El tiempo que pasa desde que suena el aviso hasta que arranca la fase siguiente. A cero, se encadenan sin pausa.',
    en: 'How long from the alert sounding until the next phase starts. At zero, they run straight into each other.',
  },
  /** Lo que se lee en el reloj mientras corre el margen. */
  empiezaEn: { es: 'Empieza en', en: 'Starts in' },
  empezarYa: { es: 'Empezar ya', en: 'Start now' },

  // ---------- El aviso ----------
  aviso: { es: 'Aviso', en: 'Alert' },
  sonido: { es: 'Sonido al acabar', en: 'Sound when time is up' },
  probarSonido: { es: 'Probar', en: 'Play it' },
  notificacion: { es: 'Notificación del sistema', en: 'System notification' },
  notificacionPedir: { es: 'Permitir notificaciones', en: 'Allow notifications' },
  notificacionDenegada: {
    es: 'Tu navegador tiene bloqueadas las notificaciones de esta página. Se cambia en el candado de la barra de direcciones.',
    en: 'Your browser has notifications blocked for this page. You can change it from the padlock in the address bar.',
  },
  notificacionNoHay: {
    es: 'Este navegador no sabe mandar notificaciones. El sonido y el título de la pestaña sí funcionan.',
    en: 'This browser cannot send notifications. The sound and the tab title still work.',
  },

  /** Lo que dice la notificación cuando acaba cada fase. */
  finTrabajoTitulo: { es: 'Se acabó el tramo de trabajo', en: 'Work stretch is over' },
  finTrabajoCuerpo: { es: 'Toca descansar.', en: 'Time for a break.' },
  finDescansoTitulo: { es: 'Se acabó el descanso', en: 'Break is over' },
  finDescansoCuerpo: { es: 'Toca volver.', en: 'Time to get back to it.' },

  // ---------- Lo que no se ve ----------
  /** Lo que anuncia un lector de pantalla al cambiar de fase. */
  anuncioFase: { es: 'Empieza:', en: 'Starting:' },
} satisfies Record<string, T>;
