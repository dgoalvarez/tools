/**
 * La aritmética del reloj: la hora, la alarma, el cronómetro y el
 * temporizador.
 *
 * ---------------------------------------------------------------------
 * Dos relojes distintos, y la diferencia importa
 *
 * · La HORA y la ALARMA van contra `Date.now()`, que es la hora real.
 *   Una alarma a las siete tiene que sonar a las siete aunque el sistema
 *   ajuste su reloj por el camino.
 *
 * · El CRONÓMETRO va contra `performance.now()`, que es monótono: cuenta
 *   desde que se abrió la página y nadie puede moverlo hacia atrás. Con
 *   `Date.now()`, un ajuste de NTP —o cambiar de huso a mano— le daría un
 *   salto al cronómetro, y medir intervalos es su único trabajo.
 *
 *   El precio: en algunos sistemas `performance.now()` no avanza mientras
 *   el equipo está suspendido, así que un cronómetro que pase la noche
 *   dormido puede quedarse corto. Se acepta: cronometrar algo a través de
 *   una suspensión es mucho más raro que un ajuste de reloj, y un salto
 *   hacia atrás sería peor que quedarse corto.
 *
 * · El TEMPORIZADOR va contra `Date.now()`, como el del pomodoro: se
 *   guarda el instante en que acaba y lo que queda se resta. Así no se
 *   atrasa aunque el navegador estrangule la pestaña de fondo.
 */

// ============================================================ el reloj

/** Cómo se enseña la hora. Todo esto viaja en la dirección. */
export interface Cara {
  /** Digital —cifras— o analógica —esfera con agujas—. */
  tipo: 'digital' | 'analogica';
  /** De 12 horas con am/pm, de 24, o lo que use el idioma de la página. */
  formato: '12' | '24' | 'auto';
  /** Si debajo de la hora va la fecha. */
  fecha: boolean;
  /** Si se ven los segundos. Sin ellos el reloj no repinta cada segundo. */
  segundos: boolean;
}

export const CARA_INICIAL: Cara = {
  tipo: 'digital',
  formato: 'auto',
  fecha: true,
  segundos: true,
};

/**
 * La hora, escrita.
 *
 * Se usa `Intl` y no un formato a mano: es lo que sabe que en español se
 * escribe «12:04» y en inglés «12:04 PM», y lo que pone el separador
 * correcto en cada idioma sin que haya que mantener una tabla.
 */
export function horaEscrita(fecha: Date, cara: Cara, lang: string): string {
  /*
   * El relleno de la hora depende del formato, y no es un capricho:
   *
   *   · En 24 h se rellena. Con «7:51:16», al llegar a las diez el número
   *     entero se desplaza —«10:51:16»— y en cifras de este tamaño el
   *     salto se ve desde la otra punta de la mesa.
   *   · En 12 h NO se rellena. «02:04 PM» no es como se escribe la hora
   *     en ningún reloj de doce; ahí la convención es «2:04 PM», y el
   *     número nunca pasa de dos cifras, así que tampoco baila.
   *
   * En «auto» se le pregunta a Intl qué ciclo usa ese idioma en vez de
   * mantener una lista de países.
   */
  const doce =
    cara.formato === 'auto'
      ? (new Intl.DateTimeFormat(lang, { hour: 'numeric' }).resolvedOptions().hour12 ?? false)
      : cara.formato === '12';

  const opciones: Intl.DateTimeFormatOptions = {
    hour: doce ? 'numeric' : '2-digit',
    minute: '2-digit',
    ...(cara.segundos ? { second: '2-digit' } : {}),
    hour12: doce,
  };

  return new Intl.DateTimeFormat(lang, opciones).format(fecha);
}

/** La fecha larga: «domingo, 31 de agosto de 2026». */
export function fechaEscrita(fecha: Date, lang: string): string {
  return new Intl.DateTimeFormat(lang, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
}

/**
 * Los grados de cada aguja, para la esfera.
 *
 * Las agujas se mueven de forma CONTINUA y no a saltos: el minutero
 * avanza con los segundos y la hora avanza con los minutos, que es como
 * se mueve un reloj de verdad y lo que hace que «las dos y media» se vea
 * a media distancia entre el 2 y el 3.
 */
export function agujas(fecha: Date): { horas: number; minutos: number; segundos: number } {
  const ms = fecha.getMilliseconds();
  const s = fecha.getSeconds() + ms / 1000;
  const m = fecha.getMinutes() + s / 60;
  const h = (fecha.getHours() % 12) + m / 60;

  return { horas: h * 30, minutos: m * 6, segundos: s * 6 };
}

// =========================================================== la alarma

export interface Alarma {
  /** La hora del día, «07:30». Vacía mientras no se haya puesto ninguna. */
  hora: string;
  /** Puesta o no. Se puede apagar sin borrar la hora. */
  activa: boolean;
}

export const ALARMA_INICIAL: Alarma = { hora: '07:00', activa: false };

/** ¿«07:30» es una hora del día que existe? */
export function horaValida(hora: string): boolean {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora);
  if (!m) return false;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
}

/**
 * Cuándo suena la alarma a partir de `ahora`.
 *
 * Si la hora ya pasó hoy, es mañana. Se calcula sobre una copia de la
 * fecha —no se toca la que llega— y se deja en el segundo cero, porque
 * una alarma de las 7:00 no debe sonar a las 7:00:43 según cuándo se
 * pusiera.
 */
export function proximaVez(hora: string, ahora: Date): Date | null {
  if (!horaValida(hora)) return null;

  const [h, m] = hora.split(':').map(Number);
  const cuando = new Date(ahora);
  cuando.setHours(h, m, 0, 0);

  if (cuando.getTime() <= ahora.getTime()) cuando.setDate(cuando.getDate() + 1);
  return cuando;
}

/** Lo que falta para que suene, en milisegundos. */
export function faltaParaAlarma(alarma: Alarma, ahora: Date): number | null {
  if (!alarma.activa) return null;
  const cuando = proximaVez(alarma.hora, ahora);
  return cuando ? cuando.getTime() - ahora.getTime() : null;
}

// ======================================================== el cronómetro

/**
 * El cronómetro.
 *
 * Andando se guarda lo ya acumulado más el instante monótono en que
 * arrancó la vuelta actual; parado, solo lo acumulado. `vueltas` son los
 * tiempos TOTALES en que se pulsó vuelta, no las duraciones: las
 * duraciones se derivan restando, y así apuntar una vuelta no puede
 * descuadrar el total.
 */
export type Cronometro =
  | { estado: 'parado'; acumulado: number; vueltas: number[] }
  | { estado: 'andando'; acumulado: number; desde: number; vueltas: number[] };

export const CRONOMETRO_INICIAL: Cronometro = { estado: 'parado', acumulado: 0, vueltas: [] };

/** Lo que lleva contado, en milisegundos. `ahora` es `performance.now()`. */
export function transcurrido(c: Cronometro, ahora: number): number {
  return c.estado === 'andando' ? c.acumulado + Math.max(0, ahora - c.desde) : c.acumulado;
}

/** Una vuelta, con su duración y su sitio en la lista. */
export interface Vuelta {
  numero: number;
  /** Lo que duró esta vuelta sola. */
  duracion: number;
  /** El total del cronómetro cuando se apuntó. */
  total: number;
}

/**
 * Las vueltas, de la última a la primera.
 *
 * La primera de la lista es la vuelta EN CURSO —lo que va desde la última
 * marca hasta ahora—, que es lo que hace que la lista sirva mientras
 * corre y no solo al final.
 */
export function vueltasDe(c: Cronometro, ahora: number): Vuelta[] {
  const total = transcurrido(c, ahora);
  const marcas = [...c.vueltas, total];

  const lista: Vuelta[] = marcas.map((marca, i) => ({
    numero: i + 1,
    duracion: marca - (i === 0 ? 0 : marcas[i - 1]),
    total: marca,
  }));

  // Si no se ha apuntado ninguna, la «vuelta en curso» es el cronómetro
  // entero y enseñarla sería repetir el número grande de arriba.
  if (c.vueltas.length === 0) return [];

  return lista.reverse();
}

/**
 * Cuál es la más rápida y cuál la más lenta, por su número.
 *
 * Solo se compara entre vueltas TERMINADAS: la que está en curso todavía
 * va a crecer, así que marcarla como la más rápida sería mentir durante
 * unos segundos y desmentirse después.
 */
export function extremos(vueltas: Vuelta[]): { rapida: number | null; lenta: number | null } {
  const cerradas = vueltas.filter((v) => v.numero <= vueltas.length - 1);
  if (cerradas.length < 2) return { rapida: null, lenta: null };

  let rapida = cerradas[0];
  let lenta = cerradas[0];
  for (const v of cerradas) {
    if (v.duracion < rapida.duracion) rapida = v;
    if (v.duracion > lenta.duracion) lenta = v;
  }

  /*
   * Si la diferencia no llega a una centésima, no se marca ninguna.
   *
   * El cronómetro enseña centésimas, así que dos vueltas que difieren en
   * tres milésimas se leen EXACTAMENTE iguales. Marcar una «la más
   * rápida» y otra «la más lenta» con el mismo número delante no es un
   * matiz: es una contradicción a la vista, y quien la lea pensará que la
   * tabla está mal.
   */
  if (lenta.duracion - rapida.duracion < 10) return { rapida: null, lenta: null };

  return { rapida: rapida.numero, lenta: lenta.numero };
}

// ====================================================== el temporizador

/** Los minutos y segundos que se han puesto, antes de arrancar. */
export interface Puesta {
  horas: number;
  minutos: number;
  segundos: number;
}

export const PUESTA_INICIAL: Puesta = { horas: 0, minutos: 5, segundos: 0 };

export const LIMITES_PUESTA = {
  horas: { min: 0, max: 23 },
  minutos: { min: 0, max: 59 },
  segundos: { min: 0, max: 59 },
} as const;

/** Encierra un campo en su rango y descarta lo que no sea un número. */
export function limitarPuesta(valor: number, clave: keyof typeof LIMITES_PUESTA): number {
  const { min, max } = LIMITES_PUESTA[clave];
  if (!Number.isFinite(valor)) return 0;
  return Math.min(max, Math.max(min, Math.round(valor)));
}

/** Lo que dura la puesta, en milisegundos. */
export function puestaMs(p: Puesta): number {
  return ((p.horas * 60 + p.minutos) * 60 + p.segundos) * 1000;
}

/**
 * El temporizador.
 *
 * Como el del pomodoro: andando se guarda el instante en que acaba —hora
 * real— y lo que queda se resta. `sonando` es el rato entre que llega a
 * cero y alguien lo calla.
 */
export type Temporizador =
  | { estado: 'parado' }
  | { estado: 'andando'; terminaEn: number; total: number }
  | { estado: 'pausa'; restanteMs: number; total: number }
  /**
   * Llegó a cero y espera a que alguien lo apague.
   *
   * `desde` es el instante en que se cumplió, y sirve para contar hacia
   * ARRIBA mientras nadie lo para. No es adorno: un temporizador que se
   * apaga solo no deja saber cuánto tiempo lleva sonando, y «se me pasó
   * el arroz» empieza justo ahí. Con la cuenta a la vista, quien vuelve
   * a la cocina sabe si llega tarde por medio minuto o por diez.
   */
  | { estado: 'sonando'; total: number; desde: number };

export const TEMPORIZADOR_INICIAL: Temporizador = { estado: 'parado' };

/** Lo que le queda, en milisegundos. `ahora` es `Date.now()`. */
export function restanteTemporizador(t: Temporizador, puesta: Puesta, ahora: number): number {
  if (t.estado === 'andando') return Math.max(0, t.terminaEn - ahora);
  if (t.estado === 'pausa') return t.restanteMs;
  if (t.estado === 'sonando') return 0;
  // Parado enseña lo que se ha puesto, así que cambiar los campos se ve
  // al momento en el número grande.
  return puestaMs(puesta);
}

/** Lo que lleva sonando sin que nadie lo pare. */
export function excedidoMs(t: Temporizador, ahora: number): number {
  return t.estado === 'sonando' ? Math.max(0, ahora - t.desde) : 0;
}

/**
 * Le añade tiempo a un temporizador que ya sonó, y lo vuelve a poner en
 * marcha.
 *
 * El total pasa a ser lo añadido y no lo original, porque el anillo tiene
 * que enseñar lo que queda de ESTE tramo: si conservara el total viejo,
 * añadir un minuto a un temporizador de una hora dejaría el anillo
 * prácticamente lleno desde el primer segundo.
 */
export function conMasTiempo(minutos: number, ahora: number): Temporizador {
  const mas = Math.max(0, Math.round(minutos * 60_000));
  return { estado: 'andando', terminaEn: ahora + mas, total: mas };
}

/** Cuánto lleva hecho, de 0 a 1. Es lo que dibuja el anillo. */
export function avanceTemporizador(t: Temporizador, puesta: Puesta, ahora: number): number {
  const total = t.estado === 'parado' ? puestaMs(puesta) : t.total;
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - restanteTemporizador(t, puesta, ahora) / total));
}

// ================================================= escribir los tiempos

/**
 * «1:05», «12:34», «1:02:03».
 *
 * Los minutos no se rellenan con cero salvo que haya horas delante; los
 * segundos siempre. Se redondea hacia ARRIBA: mientras quede un resto, el
 * número que se ve todavía no es cero, y si no «0:00» aparecería un
 * segundo antes de que la cuenta acabara de verdad.
 */
export function comoCuenta(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;

  const ss = String(segundos).padStart(2, '0');
  if (horas > 0) return `${horas}:${String(minutos).padStart(2, '0')}:${ss}`;
  return `${minutos}:${ss}`;
}

/**
 * «0:12.48» — con centésimas, para el cronómetro.
 *
 * Aquí se redondea hacia ABAJO y no hacia arriba, al revés que en la
 * cuenta atrás: un cronómetro enseña el tiempo que YA ha pasado, y
 * enseñar 0:13 cuando llevas 12,4 segundos sería adelantarse.
 */
export function comoCronometro(ms: number): string {
  const centesimas = Math.floor(ms / 10);
  const cs = centesimas % 100;
  const totalSegundos = Math.floor(centesimas / 100);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  const cc = String(cs).padStart(2, '0');
  const ss = String(segundos).padStart(2, '0');

  if (horas > 0) return `${horas}:${String(minutos).padStart(2, '0')}:${ss}.${cc}`;
  return `${minutos}:${ss}.${cc}`;
}
