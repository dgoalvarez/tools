/**
 * El pomodoro.
 *
 * La aritmética vive en src/lib/pomodoro.ts; aquí solo están el estado,
 * los avisos y la pantalla.
 *
 * Tres cosas que no son de estilo:
 *
 *   · **La cuenta se calcula, no se acumula.** Se guarda el instante en
 *     que acaba la fase y lo que queda sale de restar `Date.now()`. El
 *     intervalo solo repinta: si el navegador estrangula la pestaña o el
 *     portátil se suspende, el número siguiente sigue siendo el correcto.
 *
 *   · **Los ajustes van en la dirección y la cuenta en `sessionStorage`.**
 *     Así un pomodoro configurado se guarda en marcadores, y recargar no
 *     mata la cuenta atrás — pero al cerrar la pestaña no queda nada.
 *
 *   · **El permiso de notificaciones se pide al arrancar, no al entrar.**
 *     Un navegador que pregunta nada más abrir una página es un navegador
 *     al que se le dice que no.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PauseIcon,
  PlayIcon,
  ArrowCounterClockwiseIcon,
  SkipForwardIcon,
} from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t, type Lang } from '@/i18n/config';
import { POMODORO as P } from '@/i18n/pomodoro';
import {
  AJUSTES_INICIALES,
  LIMITES,
  avance,
  comoReloj,
  duracionMs,
  guardarCuenta,
  leerCuenta,
  limitar,
  margenRestanteMs,
  restanteMs,
  siguiente,
  type Ajustes,
  type Cuenta,
  type Fase,
} from '@/lib/pomodoro';
import { escribirParams, leerParams } from '@/lib/url-state';

/** Las claves de la dirección, cortas para que el enlace no sea un muro. */
const CLAVES: Record<keyof Ajustes, string> = {
  trabajo: 'w',
  corto: 'b',
  largo: 'l',
  cada: 'c',
  margen: 'g',
};

interface Props {
  lang: Lang;
}

export default function Pomodoro({ lang }: Props) {
  const tr = (clave: keyof typeof P) => t(P[clave], lang);

  const [ajustes, setAjustes] = useState<Ajustes>(AJUSTES_INICIALES);
  const [cuenta, setCuenta] = useState<Cuenta>({ estado: 'parado', fase: 'trabajo', hechos: 0 });
  const [ahora, setAhora] = useState(() => Date.now());
  const [listo, setListo] = useState(false);

  const [conSonido, setConSonido] = useState(true);
  const [permiso, setPermiso] = useState<NotificationPermission | 'no-hay'>('default');

  const nombreDeFase = (fase: Fase) =>
    fase === 'trabajo' ? tr('faseTrabajo') : fase === 'corto' ? tr('faseCorto') : tr('faseLargo');

  // ---------- al llegar ----------

  useEffect(() => {
    const params = leerParams();
    const leidos: Partial<Ajustes> = {};

    for (const [campo, clave] of Object.entries(CLAVES) as [keyof Ajustes, string][]) {
      const crudo = params.get(clave);
      if (crudo !== null) leidos[campo] = limitar(Number(crudo), campo);
    }
    if (Object.keys(leidos).length) setAjustes((previo) => ({ ...previo, ...leidos }));

    // Lo que hubiera en marcha antes de recargar.
    const guardada = leerCuenta();
    if (guardada) setCuenta(guardada);

    setPermiso(typeof Notification === 'undefined' ? 'no-hay' : Notification.permission);
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    escribirParams(
      Object.fromEntries(
        (Object.entries(CLAVES) as [keyof Ajustes, string][]).map(([campo, clave]) => [
          clave,
          ajustes[campo] === AJUSTES_INICIALES[campo] ? null : String(ajustes[campo]),
        ])
      )
    );
  }, [listo, ajustes]);

  useEffect(() => {
    if (listo) guardarCuenta(cuenta);
  }, [listo, cuenta]);

  // ---------- el latido ----------

  useEffect(() => {
    // También durante el margen: ahí la cuenta atrás va de cinco a cero y
    // si no se repintara se quedaría clavada en el cinco.
    if (cuenta.estado !== 'andando' && cuenta.estado !== 'margen') return;

    // Cuatro veces por segundo: el número solo cambia una, pero así nunca
    // se ve un segundo congelado al volver de otra pestaña.
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, [cuenta.estado]);

  // ---------- el aviso ----------

  /**
   * Un tono corto, generado en el momento.
   *
   * Sin archivo de audio: son dos osciladores y medio segundo, así que no
   * hay nada que descargar ni nada que la política de seguridad tenga que
   * autorizar. El contexto se crea al pulsar «Empezar», que es el gesto
   * que los navegadores exigen para dejar sonar algo.
   */
  const audio = useRef<AudioContext | null>(null);

  const sonar = useCallback((agudo: boolean) => {
    const ctx = audio.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const t0 = ctx.currentTime;

    /*
     * Dos notas: sube al acabar el trabajo, baja al acabar el descanso.
     * Se distingue qué ha pasado sin mirar la pantalla.
     *
     * Y el motivo se repite tres veces, con un silencio en medio. Con una
     * sola pasada duraba medio segundo, que es menos de lo que tarda
     * alguien concentrado en registrar que ha sonado algo: si justo
     * estabas tecleando, se lo llevaba el ruido del teclado. Kilo y medio
     * de segundo con un hueco a la mitad es lo que hace que un sonido
     * pase de «creo que oí algo» a «ha acabado».
     */
    const motivo = agudo ? [660, 880] : [880, 660];
    const notas = [...motivo, ...motivo, ...motivo];

    notas.forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = hz;
      osc.connect(vol);
      vol.connect(ctx.destination);

      // El silencio entre repeticiones va DENTRO del hueco de la
      // primera nota de cada par, que es donde se oye como una pausa y no
      // como un tropiezo.
      const inicio = t0 + i * 0.19 + Math.floor(i / 2) * 0.22;
      vol.gain.setValueAtTime(0.0001, inicio);
      vol.gain.exponentialRampToValueAtTime(0.18, inicio + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.28);
      osc.start(inicio);
      osc.stop(inicio + 0.3);
    });
  }, []);

  const notificar = useCallback((titulo: string, cuerpo: string) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      new Notification(titulo, { body: cuerpo, tag: 'dgo-pomodoro' });
    } catch {
      // Algunos navegadores solo dejan notificar desde un service worker.
      // No poder avisar no es motivo para romper la cuenta.
    }
  }, []);

  // ---------- el cambio de fase ----------

  useEffect(() => {
    if (cuenta.estado !== 'andando') return;
    if (restanteMs(cuenta, ajustes, ahora) > 0) return;

    const acababaTrabajo = cuenta.fase === 'trabajo';
    const paso = siguiente(cuenta.fase, cuenta.hechos, ajustes);

    if (conSonido) sonar(acababaTrabajo);
    notificar(
      acababaTrabajo ? tr('finTrabajoTitulo') : tr('finDescansoTitulo'),
      acababaTrabajo ? tr('finTrabajoCuerpo') : tr('finDescansoCuerpo')
    );

    /*
     * La siguiente fase arranca sola —parar aquí obligaría a estar
     * delante de la pantalla, que es lo que un temporizador viene a
     * evitar— pero no al instante: primero corre el margen.
     *
     * Encadenar sin hueco es malo por el otro lado. El descanso empieza a
     * contar mientras todavía estás cerrando lo que hacías, así que los
     * primeros segundos de descanso te los quitas tú.
     */
    setCuenta(
      ajustes.margen > 0
        ? {
            estado: 'margen',
            fase: paso.fase,
            hechos: paso.hechos,
            empiezaEn: Date.now() + ajustes.margen * 1000,
          }
        : {
            estado: 'andando',
            fase: paso.fase,
            hechos: paso.hechos,
            terminaEn: Date.now() + duracionMs(paso.fase, ajustes),
          }
    );
    // `tr` y las funciones de aviso son estables dentro de un render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ahora, cuenta, ajustes, conSonido]);

  // ---------- del margen a la fase ----------

  useEffect(() => {
    if (cuenta.estado !== 'margen') return;
    if (margenRestanteMs(cuenta, ahora) > 0) return;

    setCuenta({
      estado: 'andando',
      fase: cuenta.fase,
      hechos: cuenta.hechos,
      terminaEn: Date.now() + duracionMs(cuenta.fase, ajustes),
    });
  }, [ahora, cuenta, ajustes]);

  // ---------- el título de la pestaña ----------

  const queda = restanteMs(cuenta, ajustes, ahora);

  useEffect(() => {
    if (!listo) return;
    const original = document.title;

    // La cuenta en el título es lo que hace que sirva desde otra pestaña.
    if (cuenta.estado !== 'parado') {
      document.title = `${comoReloj(queda)} · ${nombreDeFase(cuenta.fase)}`;
    }

    return () => {
      document.title = original;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, cuenta.estado, cuenta.fase, comoReloj(queda)]);

  // ---------- los mandos ----------

  function arrancarAudio() {
    if (audio.current) return;
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) audio.current = new Ctx();
    } catch {
      // Sin audio, el aviso se queda en la notificación y el título.
    }
  }

  function empezar() {
    arrancarAudio();
    setCuenta((c) => {
      // Desde el margen, «Empezar ya» se salta lo que quede de espera.
      const restante = c.estado === 'pausa' ? c.restanteMs : duracionMs(c.fase, ajustes);
      return {
        estado: 'andando',
        fase: c.fase,
        hechos: c.hechos,
        terminaEn: Date.now() + restante,
      };
    });
    setAhora(Date.now());
  }

  function pausar() {
    setCuenta((c) => {
      // Pausar durante el margen lo detiene ahí: la fase se queda a punto
      // de empezar, entera, esperando a que se pulse.
      if (c.estado === 'margen') return { estado: 'parado', fase: c.fase, hechos: c.hechos };

      return c.estado === 'andando'
        ? {
            estado: 'pausa',
            fase: c.fase,
            hechos: c.hechos,
            restanteMs: Math.max(0, c.terminaEn - Date.now()),
          }
        : c;
    });
  }

  /** Suena el aviso a demanda, para poder oírlo antes de necesitarlo. */
  function probarSonido() {
    arrancarAudio();
    // Un tic para que el contexto de audio esté listo tras el gesto.
    setTimeout(() => sonar(true), 0);
  }

  function reiniciarFase() {
    setCuenta((c) => ({ estado: 'parado', fase: c.fase, hechos: c.hechos }));
  }

  function saltar() {
    setCuenta((c) => {
      const paso = siguiente(c.fase, c.hechos, ajustes);
      return { estado: 'parado', fase: paso.fase, hechos: paso.hechos };
    });
  }

  function desdeCero() {
    setCuenta({ estado: 'parado', fase: 'trabajo', hechos: 0 });
  }

  async function pedirPermiso() {
    if (typeof Notification === 'undefined') return;
    try {
      setPermiso(await Notification.requestPermission());
    } catch {
      // Algunos navegadores solo lo permiten desde un gesto; este lo es.
    }
  }
  // ---------- pintado ----------

  const proporcion = avance(cuenta, ajustes, ahora);
  const paso = siguiente(cuenta.fase, cuenta.hechos, ajustes);
  const enMargen = cuenta.estado === 'margen';
  const margenQueda = Math.ceil(margenRestanteMs(cuenta, ahora) / 1000);

  /** Cuántos pomodoros van dentro del ciclo actual, de 0 a `cada`. */
  const enCiclo = cuenta.hechos % ajustes.cada;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,var(--col-controles))_minmax(0,1fr)] lg:items-start">
      {/* ---------------- Ajustes ---------------- */}
      <div className="columna-herramienta gap-4">
        <fieldset className="tarjeta-control" data-tour="duraciones">
          <legend className="sr-only">{tr('ajustes')}</legend>
          <p className="titulo" aria-hidden="true">
            {tr('ajustes')}
          </p>

          {/*
            Una fila por ajuste, con la etiqueta a la IZQUIERDA del campo.

            Antes iban en dos columnas con la etiqueta encima, y ahí
            «Descanso largo cada» tenía que caber en media tarjeta: partía
            en dos líneas y descuadraba la rejilla. En fila, la etiqueta
            dispone del ancho que le sobra al campo, que es mucho, y las
            cuatro quedan alineadas por su número.

            De paso ocupa menos alto: cuatro filas en vez de dos filas de
            etiqueta más campo.
          */}
          <div className="filas-ajuste">
            <Minutos
              id="min-trabajo"
              etiqueta={tr('minutosTrabajo')}
              unidad={tr('minutos')}
              valor={ajustes.trabajo}
              limites={LIMITES.trabajo}
              paso={0.5}
              onCambio={(v) => setAjustes((a) => ({ ...a, trabajo: v }))}
            />
            <Minutos
              id="min-corto"
              etiqueta={tr('minutosCorto')}
              unidad={tr('minutos')}
              valor={ajustes.corto}
              limites={LIMITES.corto}
              paso={0.5}
              onCambio={(v) => setAjustes((a) => ({ ...a, corto: v }))}
            />
            <Minutos
              id="min-largo"
              etiqueta={tr('minutosLargo')}
              unidad={tr('minutos')}
              valor={ajustes.largo}
              limites={LIMITES.largo}
              paso={0.5}
              onCambio={(v) => setAjustes((a) => ({ ...a, largo: v }))}
            />
          </div>

          {/* La cadencia, fuera de la rejilla: no es una duración, es una
              cuenta de pomodoros, y era la única fila que no se medía en
              minutos. Ahí «pomodoros» le imponía su ancho a «min». */}
          <div className="fila-cada">
            <Label htmlFor="cada">{tr('cada')}</Label>
            <Numero
              id="cada"
              valor={ajustes.cada}
              limites={LIMITES.cada}
              paso={1}
              onCambio={(v) => setAjustes((a) => ({ ...a, cada: v }))}
              className="w-[3.75rem] text-center"
            />
            <span className="unidad">{tr('pomodoros')}</span>
          </div>

          <p className="text-[length:var(--fs-small)] text-ink-soft">{tr('admiteMedios')}</p>

          {cuenta.estado === 'andando' && (
            <p className="text-[length:var(--fs-small)] text-ink-soft">{tr('cambioEnMarcha')}</p>
          )}
        </fieldset>

        <fieldset className="tarjeta-control" data-tour="aviso">
          <legend className="sr-only">{tr('aviso')}</legend>
          <p className="titulo" aria-hidden="true">
            {tr('aviso')}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="interruptor">
              <input
                type="checkbox"
                role="switch"
                checked={conSonido}
                onChange={(e) => setConSonido(e.target.checked)}
              />
              <span className="texto">{tr('sonido')}</span>
            </label>

            {/* Poder oírlo antes de necesitarlo: si no, la primera vez que
                suena es a los veinticinco minutos y con el volumen que
                hubiera puesto. */}
            {conSonido && (
              <Button variant="outline" size="sm" onClick={probarSonido}>
                {tr('probarSonido')}
              </Button>
            )}
          </div>

          {/* El margen vive aquí y no con las duraciones: no es cuánto
              dura una fase, es cuánto tardas tú en reaccionar al aviso. */}
          <div className="filas-ajuste">
            <Minutos
              id="margen"
              etiqueta={tr('margen')}
              unidad={tr('segundos')}
              anchoUnidad="1.75rem"
              valor={ajustes.margen}
              limites={LIMITES.margen}
              paso={1}
              onCambio={(v) => setAjustes((a) => ({ ...a, margen: v }))}
            />
          </div>
          <p className="text-[length:var(--fs-small)] text-ink-soft">{tr('margenAyuda')}</p>

          {permiso === 'granted' && (
            <p className="text-[length:var(--fs-small)] text-ink-soft">{tr('notificacion')} ✓</p>
          )}
          {permiso === 'default' && (
            <Button
              variant="outline"
              size="sm"
              onClick={pedirPermiso}
              className="justify-self-start"
            >
              {tr('notificacionPedir')}
            </Button>
          )}
          {permiso === 'denied' && (
            <p className="text-[length:var(--fs-small)] text-ink-soft">
              {tr('notificacionDenegada')}
            </p>
          )}
          {permiso === 'no-hay' && (
            <p className="text-[length:var(--fs-small)] text-ink-soft">{tr('notificacionNoHay')}</p>
          )}
        </fieldset>
      </div>

      {/*
        ---------------- La cuenta y el ciclo, en una sola tarjeta ----------

        Estaban en dos tarjetas apiladas, y el ciclo quedaba tan abajo que
        había que bajar la vista para saber cuántos tramos faltaban para el
        descanso largo — que es justo el dato que este método pide llevar
        encima. Ahora comparten tarjeta: el reloj a la izquierda, el ciclo
        a la derecha, los dos a la vista de una.
      */}
      <section className="panel-pomodoro" data-tour="cuenta">
        <div className="reloj-pomodoro">
          <div className="anillo">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle className="pista" cx="50" cy="50" r="45" />
              <circle
                className="hecho"
                cx="50"
                cy="50"
                r="45"
                style={{ strokeDashoffset: 283 - 283 * proporcion }}
              />
            </svg>

            <div className="centro">
              <p className="fase">{nombreDeFase(cuenta.fase)}</p>
              <p className="tiempo">{comoReloj(queda)}</p>
              {/* Durante el margen la cuenta atrás pequeña dice cuánto
                  falta para que arranque, sin tapar el tiempo de la fase
                  que viene: se ve a la vez lo que va a empezar y cuándo. */}
              {enMargen && (
                <p className="margen">
                  {tr('empiezaEn')} {margenQueda} {tr('segundos')}
                </p>
              )}
            </div>
          </div>

          {/* Lo que un lector de pantalla necesita y el anillo no da. */}
          <p aria-live="polite" className="sr-only">
            {tr('anuncioFase')} {nombreDeFase(cuenta.fase)}
          </p>

          <div className="mandos">
            {cuenta.estado === 'andando' ? (
              <Button
                onClick={pausar}
                className="h-11 border border-[var(--solido)] bg-[var(--solido)] px-5 text-[0.9375rem] font-semibold text-[var(--solido-ink)] hover:bg-[color-mix(in_srgb,var(--solido)_86%,#000)]"
              >
                <PauseIcon aria-hidden="true" weight="fill" />
                {tr('pausar')}
              </Button>
            ) : (
              <Button
                onClick={empezar}
                className="h-11 border border-[var(--solido)] bg-[var(--solido)] px-5 text-[0.9375rem] font-semibold text-[var(--solido-ink)] hover:bg-[color-mix(in_srgb,var(--solido)_86%,#000)]"
              >
                <PlayIcon aria-hidden="true" weight="fill" />
                {enMargen
                  ? tr('empezarYa')
                  : cuenta.estado === 'pausa'
                    ? tr('seguir')
                    : tr('empezar')}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={reiniciarFase}
              title={tr('reiniciar')}
              aria-label={tr('reiniciar')}
            >
              <ArrowCounterClockwiseIcon aria-hidden="true" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={saltar}
              title={tr('saltar')}
              aria-label={tr('saltar')}
            >
              <SkipForwardIcon aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="ciclo-pomodoro" data-tour="ciclo">
          <p className="titulo">{tr('ciclo')}</p>

          {/*
            Un punto por pomodoro del ciclo. Se ve de un vistazo cuántos
            faltan para el descanso largo, que es la única cuenta que hay
            que llevar en la cabeza con este método.
          */}
          <div className="ciclo-puntos" role="img" aria-label={`${tr('hechos')}: ${cuenta.hechos}`}>
            {Array.from({ length: ajustes.cada }, (_, i) => (
              <span
                key={i}
                className={i < enCiclo || (enCiclo === 0 && cuenta.hechos > 0) ? 'lleno' : ''}
              />
            ))}
          </div>

          {/* Dos líneas y no una con un punto en medio: en una columna
              estrecha, «Pomodoros hechos: 0 · Después: Descanso» partía
              justo después de «Después:» y dejaba la palabra suelta. */}
          <p className="dato">
            {tr('hechos')}: <strong>{cuenta.hechos}</strong>
          </p>
          <p className="dato">
            {tr('siguienteEs')} <strong>{nombreDeFase(paso.fase)}</strong>
          </p>

          {/* Era un botón fantasma y no se veía que fuera pulsable. Con
              borde, y solo cuando hay algo que poner a cero. */}
          {cuenta.hechos > 0 && (
            <Button variant="outline" size="sm" onClick={desdeCero} className="justify-self-start">
              {tr('desdeCero')}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

// ------------------------------------------------------------- auxiliares

/**
 * El campo desnudo: solo el <input> y las reglas de cuándo se aplica lo
 * que se escribe.
 *
 * Se separó de la fila porque hay dos formas de presentarlo —con la
 * unidad dentro de la caja, y suelto dentro de una frase— y las dos
 * necesitan exactamente el mismo comportamiento.
 *
 * Sobre cuándo se aplica lo que se escribe, que es donde estaba el fallo:
 *
 *   · **Al teclear**, si el número ya vale. Antes solo se aplicaba al
 *     salir del campo, así que escribías «50» en trabajo, mirabas el
 *     reloj y seguía diciendo «25:00». Parecía que la herramienta
 *     ignoraba el ajuste, y lo que pasaba es que todavía no se lo había
 *     contado a nadie.
 *   · **Al salir**, se limita. Limitar en cada pulsación sería peor:
 *     borrar el «5» de «25» para escribir «30» convertiría el «2» en el
 *     mínimo antes de llegar al segundo dígito. Por eso lo que está
 *     fuera de rango —o a medio escribir— se deja estar hasta el blur.
 */
function Numero({
  id,
  valor,
  limites,
  paso,
  onCambio,
  describe,
  className,
}: {
  id: string;
  valor: number;
  limites: { min: number; max: number };
  paso: number;
  onCambio: (valor: number) => void;
  describe?: string;
  /**
   * El ancho y el relleno tienen que venir como UTILIDADES de Tailwind y
   * no desde `global.css`. Las utilidades viven en una capa que gana a la
   * de componentes, así que el `w-full` y el `px-3` que trae el Input de
   * shadcn pisaban cualquier regla escrita allí: la unidad se pintaba
   * encima del número —«m25»— y el campo de la cadencia ocupaba la fila
   * entera.
   */
  className?: string;
}) {
  const [bruto, setBruto] = useState(String(valor));

  useEffect(() => {
    setBruto(String(valor));
  }, [valor]);

  /** Al medio o al entero, según el paso del ajuste. */
  const aPaso = (n: number) => Math.round(n / paso) * paso;

  return (
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      min={limites.min}
      max={limites.max}
      step={paso}
      value={bruto}
      aria-describedby={describe}
      className={className}
      onChange={(e) => {
        const texto = e.target.value;
        setBruto(texto);

        // Solo se aplica lo que ya es un número válido dentro de su
        // rango. Un campo vacío o un «0» de camino a «30» se quedan
        // esperando al blur.
        const n = Number(texto.replace(',', '.'));
        if (texto.trim() !== '' && Number.isFinite(n) && n >= limites.min && n <= limites.max) {
          onCambio(aPaso(n));
        }
      }}
      onBlur={() => {
        const n = Number(bruto.replace(',', '.'));
        if (!Number.isFinite(n)) {
          setBruto(String(valor));
          return;
        }
        onCambio(aPaso(Math.min(limites.max, Math.max(limites.min, n))));
      }}
    />
  );
}

/**
 * Una fila de ajuste: etiqueta a la izquierda, campo a la derecha con su
 * unidad dentro de la caja.
 *
 * La unidad va dentro y no en una columna aparte porque en una rejilla
 * una columna mide lo que mide su contenido más ancho: con «pomodoros»
 * en la lista, las filas de «min» quedaban con un hueco enorme a la
 * derecha del número. El porqué largo está en `global.css`.
 */
function Minutos({
  id,
  etiqueta,
  unidad,
  anchoUnidad,
  valor,
  limites,
  paso,
  onCambio,
}: {
  id: string;
  etiqueta: string;
  unidad: string;
  /** Sitio que hay que reservarle a la unidad dentro de la caja. */
  anchoUnidad?: string;
  valor: number;
  limites: { min: number; max: number };
  paso: number;
  onCambio: (valor: number) => void;
}) {
  return (
    <div className="fila-ajuste">
      <Label htmlFor={id}>
        {etiqueta}
        {/* La unidad de dentro es decorativa —está pintada encima del
            campo— así que el lector de pantalla la oye aquí, dentro del
            nombre del campo: «Trabajo, min». */}
        <span className="sr-only"> {unidad}</span>
      </Label>

      <div
        className="campo"
        style={anchoUnidad ? ({ '--ancho-unidad': anchoUnidad } as React.CSSProperties) : undefined}
      >
        <Numero
          id={id}
          valor={valor}
          limites={limites}
          paso={paso}
          onCambio={onCambio}
          className="pr-[var(--ancho-unidad,2.5rem)]"
        />
        <span className="unidad" aria-hidden="true">
          {unidad}
        </span>
      </div>
    </div>
  );
}
