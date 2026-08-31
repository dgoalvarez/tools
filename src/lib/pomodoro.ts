/**
 * La aritmética del pomodoro.
 *
 * ---------------------------------------------------------------------
 * La decisión que sostiene todo lo demás: se cuenta contra el reloj, no
 * con un contador.
 *
 * La forma ingenua de hacer una cuenta atrás es restar un segundo cada
 * segundo con `setInterval`. Y falla de tres maneras que no se ven al
 * probarlo un minuto:
 *
 *   · El navegador estrangula los temporizadores de las pestañas que no
 *     se ven. En segundo plano, `setInterval(…, 1000)` pasa a dispararse
 *     una vez por minuto, así que un pomodoro de 25 minutos podría durar
 *     hora y media.
 *   · Si el portátil se suspende, los temporizadores no corren. Al
 *     despertar, la cuenta seguiría donde se quedó.
 *   · Aunque nada de eso pasara, cada tic llega un poco tarde y el error
 *     se acumula.
 *
 * Aquí se guarda **el instante en que termina** y lo que queda se calcula
 * restando de `Date.now()`. El intervalo solo sirve para volver a pintar:
 * si se salta veinte tics, el número siguiente sigue siendo el correcto.
 *
 * Nada de esto se guarda en el disco: los ajustes viven en la dirección y
 * la cuenta en marcha en `sessionStorage`, que muere al cerrar la
 * pestaña.
 */

/** Las tres fases de un pomodoro. */
export type Fase = 'trabajo' | 'corto' | 'largo';

export const FASES: Fase[] = ['trabajo', 'corto', 'largo'];

export interface Ajustes {
  /**
   * Minutos de trabajo.
   *
   * Admite medios minutos. No es un capricho: un descanso de treinta
   * segundos o de minuto y medio es un patrón real —el micro-descanso
   * entre tramos cortos— y obligar a números enteros lo dejaba fuera.
   * Con el paso de 0,5 se escribe «2,5» y se entiende; con un campo de
   * segundos aparte habría cuatro campos más que rellenar.
   */
  trabajo: number;
  /** Minutos del descanso corto. */
  corto: number;
  /** Minutos del descanso largo. */
  largo: number;
  /**
   * Cada cuántos pomodoros toca el descanso largo.
   *
   * Cuatro es lo que dice el método original, pero es un número y no una
   * ley: quien trabaja en tramos más cortos lo pone en tres, y a quien le
   * cuesta arrancar le sirve en seis.
   */
  cada: number;
  /**
   * Segundos de margen entre una fase y la siguiente.
   *
   * Las fases se encadenan solas —parar obligaría a estar delante de la
   * pantalla, que es lo que un temporizador viene a evitar— pero
   * encadenarlas AL INSTANTE es igual de malo por el otro lado: el
   * descanso empieza a correr mientras todavía estás terminando la frase,
   * así que los primeros veinte segundos de descanso te los quitas tú.
   *
   * Cinco segundos por defecto y no tres: tres alcanzan para oír el aviso
   * y no para levantar la vista, cerrar lo que estabas haciendo y
   * decidir. Se puede poner a cero para que no haya margen ninguno.
   */
  margen: number;
}

export const AJUSTES_INICIALES: Ajustes = {
  trabajo: 25,
  corto: 5,
  largo: 15,
  cada: 4,
  margen: 5,
};

/** Los límites de cada ajuste. Valen para los campos y para el enlace. */
export const LIMITES = {
  trabajo: { min: 0.5, max: 180 },
  corto: { min: 0.5, max: 60 },
  largo: { min: 0.5, max: 120 },
  cada: { min: 2, max: 12 },
  margen: { min: 0, max: 60 },
} as const;

/**
 * Los ajustes que se cuentan en minutos y admiten medios.
 *
 * `cada` son pomodoros y `margen` son segundos: los dos son enteros, y
 * redondearlos a medios daría «4,5 pomodoros», que no significa nada.
 */
const CON_MEDIOS: (keyof typeof LIMITES)[] = ['trabajo', 'corto', 'largo'];

/** Encierra un número en su rango, y descarta lo que no sea un número. */
export function limitar(valor: number, clave: keyof typeof LIMITES): number {
  const { min, max } = LIMITES[clave];
  if (!Number.isFinite(valor)) return AJUSTES_INICIALES[clave];

  const paso = CON_MEDIOS.includes(clave) ? 2 : 1;
  const redondeado = Math.round(valor * paso) / paso;
  return Math.min(max, Math.max(min, redondeado));
}

/**
 * Qué fase toca después de haber completado `hechos` pomodoros.
 *
 * La secuencia es trabajo, descanso, trabajo, descanso… y cada `cada`
 * pomodoros el descanso es el largo. Se cuenta con el número de
 * pomodoros terminados y no con una lista de fases, porque así el ciclo
 * no tiene fin ni hay estado que se pueda desincronizar.
 *
 *     cada = 4
 *     hechos:  0  1  2  3  4  5  6  7  8
 *     tras…:   C  C  C  L  C  C  C  L  C
 */
export function descansoTras(hechos: number, ajustes: Ajustes): Fase {
  return hechos > 0 && hechos % ajustes.cada === 0 ? 'largo' : 'corto';
}

/** La fase siguiente a la actual, y cuántos pomodoros van tras ella. */
export function siguiente(
  fase: Fase,
  hechos: number,
  ajustes: Ajustes
): { fase: Fase; hechos: number } {
  // Un descanso siempre lleva de vuelta al trabajo. Solo el trabajo suma.
  if (fase !== 'trabajo') return { fase: 'trabajo', hechos };

  const nuevos = hechos + 1;
  return { fase: descansoTras(nuevos, ajustes), hechos: nuevos };
}

/** Los minutos que dura una fase. */
export function minutosDe(fase: Fase, ajustes: Ajustes): number {
  return fase === 'trabajo' ? ajustes.trabajo : fase === 'corto' ? ajustes.corto : ajustes.largo;
}

/** Lo que dura una fase, en milisegundos. */
export function duracionMs(fase: Fase, ajustes: Ajustes): number {
  return Math.round(minutosDe(fase, ajustes) * 60_000);
}

/**
 * La cuenta en marcha.
 *
 * Andando se guarda el instante en que acaba; en pausa, lo que queda. Son
 * dos formas del mismo dato, y tenerlas separadas evita la pregunta «¿en
 * pausa, qué significa `terminaEn`?».
 *
 * `margen` es el hueco entre una fase y la siguiente: la fase que trae es
 * la que va a EMPEZAR, y `empiezaEn` es cuándo.
 */
export type Cuenta =
  | { estado: 'parado'; fase: Fase; hechos: number }
  | { estado: 'andando'; fase: Fase; hechos: number; terminaEn: number }
  | { estado: 'pausa'; fase: Fase; hechos: number; restanteMs: number }
  | { estado: 'margen'; fase: Fase; hechos: number; empiezaEn: number };

/** Lo que queda de la FASE, en milisegundos y nunca por debajo de cero. */
export function restanteMs(cuenta: Cuenta, ajustes: Ajustes, ahora: number): number {
  if (cuenta.estado === 'andando') return Math.max(0, cuenta.terminaEn - ahora);
  if (cuenta.estado === 'pausa') return cuenta.restanteMs;
  // Parada o en el margen, la fase todavía no ha empezado: se enseña
  // entera. Es lo que hace que cambiar una duración se vea al momento.
  return duracionMs(cuenta.fase, ajustes);
}

/** Lo que queda del margen antes de que arranque la fase. */
export function margenRestanteMs(cuenta: Cuenta, ahora: number): number {
  return cuenta.estado === 'margen' ? Math.max(0, cuenta.empiezaEn - ahora) : 0;
}

/**
 * «25:00», y «1:30:00» cuando pasa de la hora.
 *
 * Los minutos no se rellenan con cero a la izquierda salvo que haya horas
 * delante; los segundos siempre.
 */
export function comoReloj(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;

  const ss = String(segundos).padStart(2, '0');
  if (horas > 0) return `${horas}:${String(minutos).padStart(2, '0')}:${ss}`;
  return `${minutos}:${ss}`;
}

/**
 * Cuánto se lleva andado de la fase, de 0 a 1.
 *
 * Es lo que dibuja el anillo. Va de vacío a lleno según pasa el tiempo,
 * y no al revés: un anillo que se vacía se lee como algo que se agota, y
 * un pomodoro es algo que se completa.
 */
export function avance(cuenta: Cuenta, ajustes: Ajustes, ahora: number): number {
  const total = duracionMs(cuenta.fase, ajustes);
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - restanteMs(cuenta, ajustes, ahora) / total));
}

// ------------------------------------------------------- la cuenta guardada

/** La clave de `sessionStorage`. Con prefijo para no chocar con nada. */
const CLAVE = 'dgo-pomodoro';

/**
 * Guarda la cuenta en marcha para que recargar no la mate.
 *
 * `sessionStorage` y no `localStorage`, y la diferencia importa: lo que
 * hay aquí muere al cerrar la pestaña. El sitio promete «sin cuentas, sin
 * cookies, sin base de datos», y esto no es ninguna de las tres — no
 * viaja en ninguna petición, nadie puede leerlo después, y no sobrevive a
 * la sesión.
 *
 * Los ajustes NO se guardan aquí: viven en la dirección, como en las
 * otras herramientas, así que un pomodoro configurado se puede guardar en
 * marcadores o mandárselo a alguien.
 */
export function guardarCuenta(cuenta: Cuenta): void {
  try {
    if (cuenta.estado === 'parado') sessionStorage.removeItem(CLAVE);
    else sessionStorage.setItem(CLAVE, JSON.stringify(cuenta));
  } catch {
    // Navegación privada o almacenamiento bloqueado: la cuenta sigue
    // andando, solo que recargar la perderá.
  }
}

/**
 * Recupera la cuenta guardada, si la hay y si todavía vale.
 *
 * Se valida a mano en vez de confiar en el JSON: lo que hay en
 * `sessionStorage` puede haberlo escrito cualquiera desde la consola, y
 * un `terminaEn` que no sea un número dejaría la cuenta atrás en NaN.
 */
export function leerCuenta(): Cuenta | null {
  try {
    const bruto = sessionStorage.getItem(CLAVE);
    if (!bruto) return null;

    const d = JSON.parse(bruto) as Record<string, unknown>;
    const fase = d.fase;
    const hechos = d.hechos;

    if (!FASES.includes(fase as Fase)) return null;
    if (typeof hechos !== 'number' || !Number.isFinite(hechos) || hechos < 0) return null;

    if (d.estado === 'andando' && typeof d.terminaEn === 'number' && Number.isFinite(d.terminaEn)) {
      return { estado: 'andando', fase: fase as Fase, hechos, terminaEn: d.terminaEn };
    }

    if (d.estado === 'margen' && typeof d.empiezaEn === 'number' && Number.isFinite(d.empiezaEn)) {
      return { estado: 'margen', fase: fase as Fase, hechos, empiezaEn: d.empiezaEn };
    }

    if (
      d.estado === 'pausa' &&
      typeof d.restanteMs === 'number' &&
      Number.isFinite(d.restanteMs) &&
      d.restanteMs >= 0
    ) {
      return { estado: 'pausa', fase: fase as Fase, hechos, restanteMs: d.restanteMs };
    }

    return null;
  } catch {
    return null;
  }
}
