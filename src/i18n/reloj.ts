/**
 * Los textos del reloj, en los dos idiomas.
 */
import type { T } from './config';

export const RELOJ = {
  // ---------- Las pestañas ----------
  alarma: { es: 'Alarma', en: 'Alarm' },
  cronometro: { es: 'Cronómetro', en: 'Stopwatch' },
  temporizador: { es: 'Temporizador', en: 'Timer' },
  /** Lo que anuncia el punto del acento en una pestaña. */
  enMarcha: { es: 'en marcha', en: 'running' },

  // ---------- La cara del reloj ----------
  cara: { es: 'El reloj', en: 'The clock' },
  caraDigital: { es: 'Digital', en: 'Digital' },
  caraAnalogica: { es: 'Analógico', en: 'Analogue' },
  formato: { es: 'Formato', en: 'Format' },
  formatoAuto: { es: 'Del idioma', en: 'Match language' },
  formato12: { es: '12 h', en: '12 h' },
  formato24: { es: '24 h', en: '24 h' },
  verFecha: { es: 'Ver la fecha', en: 'Show the date' },
  verSegundos: { es: 'Ver los segundos', en: 'Show seconds' },

  // ---------- La alarma ----------
  aQueHora: { es: 'A qué hora', en: 'At what time' },
  ponerAlarma: { es: 'Poner la alarma', en: 'Set the alarm' },
  quitarAlarma: { es: 'Quitar la alarma', en: 'Turn the alarm off' },
  /** Con la alarma puesta: «Suena en 5 h 12 min». */
  suenaEn: { es: 'Suena en', en: 'Rings in' },
  /** Y a qué hora exacta, para no tener que hacer la cuenta mental. */
  sueneA: { es: 'Será', en: 'That is' },
  alarmaSonando: { es: '¡Es la hora!', en: 'Time is up!' },
  callar: { es: 'Callar', en: 'Stop' },

  /**
   * El límite que hay que decir de frente, no en letra pequeña.
   *
   * Sin servidor no hay notificaciones empujadas, y las alarmas
   * programadas del navegador no existen en la práctica. Quien cierre la
   * pestaña se queda sin alarma, y es mejor saberlo antes de confiarle
   * un despertador.
   */
  alarmaAviso: {
    es: 'La alarma solo suena con esta pestaña abierta. No hay servidor detrás, así que si cierras la pestaña o apagas el ordenador, no sonará.',
    en: 'The alarm only rings while this tab is open. There is no server behind it, so if you close the tab or shut the computer down, it will not ring.',
  },

  // ---------- El cronómetro ----------
  arrancar: { es: 'Arrancar', en: 'Start' },
  parar: { es: 'Parar', en: 'Stop' },
  seguir: { es: 'Seguir', en: 'Resume' },
  vuelta: { es: 'Vuelta', en: 'Lap' },
  vueltas: { es: 'Vueltas', en: 'Laps' },
  aCero: { es: 'A cero', en: 'Reset' },
  masRapida: { es: 'la más rápida', en: 'fastest' },
  masLenta: { es: 'la más lenta', en: 'slowest' },
  /** La cabecera de la lista de vueltas. */
  vueltaNum: { es: 'Vuelta', en: 'Lap' },
  duracion: { es: 'Duración', en: 'Time' },
  total: { es: 'Total', en: 'Total' },

  // ---------- El temporizador ----------
  horas: { es: 'h', en: 'h' },
  minutos: { es: 'min', en: 'min' },
  segundos: { es: 's', en: 's' },
  empezar: { es: 'Empezar', en: 'Start' },
  pausar: { es: 'Pausar', en: 'Pause' },
  reiniciar: { es: 'Reiniciar', en: 'Reset' },
  atajos: { es: 'De un toque', en: 'Quick set' },
  temporizadorSonando: { es: 'Se acabó', en: 'Time is up' },

  // ---------- El aviso ----------
  aviso: { es: 'Aviso', en: 'Alert' },
  sonido: { es: 'Sonido', en: 'Sound' },
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

  /** Lo que dicen las notificaciones. */
  avisoAlarmaTitulo: { es: 'Suena la alarma', en: 'Alarm' },
  avisoAlarmaCuerpo: { es: 'La hora que pusiste.', en: 'The time you set.' },
  avisoTemporizadorTitulo: { es: 'Se acabó el tiempo', en: 'Time is up' },
  avisoTemporizadorCuerpo: { es: 'El temporizador llegó a cero.', en: 'The timer reached zero.' },
} satisfies Record<string, T>;
