/**
 * El aviso: un tono generado y una notificación del sistema.
 *
 * Salió del pomodoro cuando llegó el reloj, que necesita exactamente lo
 * mismo tres veces —alarma, cronómetro y temporizador—. Estaba escrito
 * dentro de la isla y habría acabado copiado, que es como dos sonidos que
 * eran el mismo empiezan a separarse sin que nadie lo decida.
 *
 * ---------------------------------------------------------------------
 * Por qué el tono se genera y no se descarga
 *
 * Son dos osciladores y kilo y medio de segundo. Sin archivo no hay nada
 * que descargar, nada que se quede a medias con mala conexión, y nada que
 * la política de seguridad tenga que autorizar: `media-src` sigue sin
 * hacer falta.
 */

/**
 * El contexto de audio, uno por página.
 *
 * Se crea a la primera pulsación y no al cargar: los navegadores exigen
 * un gesto para dejar sonar algo, y un contexto creado antes nace
 * suspendido y nunca llega a sonar.
 */
let contexto: AudioContext | null = null;

/** Crea el contexto si no lo hay. Se llama desde un gesto. */
export function arrancarAudio(): void {
  if (contexto) return;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) contexto = new Ctx();
  } catch {
    // Sin audio, el aviso se queda en la notificación y en el título de
    // la pestaña. No poder sonar no es motivo para romper la cuenta.
  }
}

/**
 * Suena el aviso.
 *
 * `agudo` sube las dos notas y `!agudo` las baja. Sirve para distinguir
 * qué ha pasado sin mirar la pantalla: en el pomodoro sube al acabar el
 * trabajo y baja al acabar el descanso.
 *
 * El motivo se repite tres veces con un silencio en medio. Con una sola
 * pasada duraba medio segundo, que es menos de lo que tarda alguien
 * concentrado en registrar que ha sonado algo: si justo estabas
 * tecleando, se lo llevaba el ruido del teclado.
 */
export function sonar(agudo: boolean, repeticiones = 3): void {
  const ctx = contexto;
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();

  const t0 = ctx.currentTime;
  const motivo = agudo ? [660, 880] : [880, 660];
  const notas = Array.from({ length: repeticiones }, () => motivo).flat();

  notas.forEach((hz, i) => {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = hz;
    osc.connect(vol);
    vol.connect(ctx.destination);

    // El silencio entre repeticiones va DENTRO del hueco de la primera
    // nota de cada par, que es donde se oye como una pausa y no como un
    // tropiezo.
    const inicio = t0 + i * 0.19 + Math.floor(i / 2) * 0.22;
    vol.gain.setValueAtTime(0.0001, inicio);
    vol.gain.exponentialRampToValueAtTime(0.18, inicio + 0.02);
    vol.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.28);
    osc.start(inicio);
    osc.stop(inicio + 0.3);
  });
}

/**
 * Manda una notificación del sistema, si hay permiso.
 *
 * `etiqueta` agrupa: dos avisos con la misma etiqueta se sustituyen en
 * vez de apilarse, que es lo que hace que un temporizador no deje seis
 * notificaciones si se le mira tarde.
 */
export function notificar(titulo: string, cuerpo: string, etiqueta: string): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    new Notification(titulo, { body: cuerpo, tag: etiqueta });
  } catch {
    // Algunos navegadores solo dejan notificar desde un service worker.
    // No poder avisar no es motivo para romper la cuenta.
  }
}

/** Qué dice el navegador sobre las notificaciones, ahora mismo. */
export type Permiso = NotificationPermission | 'no-hay';

export function permisoActual(): Permiso {
  return typeof Notification === 'undefined' ? 'no-hay' : Notification.permission;
}

/** Pide el permiso. Tiene que llamarse desde un gesto. */
export async function pedirPermiso(): Promise<Permiso> {
  if (typeof Notification === 'undefined') return 'no-hay';
  try {
    return await Notification.requestPermission();
  } catch {
    // Algunos navegadores solo lo permiten desde un gesto; este lo es.
    return Notification.permission;
  }
}
