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
  guardarCuenta,
  leerCuenta,
  limitar,
  minutosDe,
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
    if (cuenta.estado !== 'andando') return;

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
    // Dos notas: sube al acabar el trabajo, baja al acabar el descanso.
    // Se distingue qué ha pasado sin mirar la pantalla.
    const notas = agudo ? [660, 880] : [880, 660];

    notas.forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = hz;
      osc.connect(vol);
      vol.connect(ctx.destination);

      const inicio = t0 + i * 0.18;
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

    // La siguiente fase arranca sola: parar aquí obligaría a estar
    // delante de la pantalla para que el pomodoro siguiera, que es justo
    // lo que un temporizador viene a evitar.
    setCuenta({
      estado: 'andando',
      fase: paso.fase,
      hechos: paso.hechos,
      terminaEn: Date.now() + minutosDe(paso.fase, ajustes) * 60_000,
    });
    // `tr` y las funciones de aviso son estables dentro de un render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ahora, cuenta, ajustes, conSonido]);

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
      const restante = c.estado === 'pausa' ? c.restanteMs : minutosDe(c.fase, ajustes) * 60_000;
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
    setCuenta((c) =>
      c.estado === 'andando'
        ? {
            estado: 'pausa',
            fase: c.fase,
            hechos: c.hechos,
            restanteMs: Math.max(0, c.terminaEn - Date.now()),
          }
        : c
    );
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

          <div className="grid grid-cols-2 gap-3">
            <Minutos
              id="min-trabajo"
              etiqueta={tr('minutosTrabajo')}
              unidad={tr('minutos')}
              valor={ajustes.trabajo}
              limites={LIMITES.trabajo}
              onCambio={(v) => setAjustes((a) => ({ ...a, trabajo: v }))}
            />
            <Minutos
              id="min-corto"
              etiqueta={tr('minutosCorto')}
              unidad={tr('minutos')}
              valor={ajustes.corto}
              limites={LIMITES.corto}
              onCambio={(v) => setAjustes((a) => ({ ...a, corto: v }))}
            />
            <Minutos
              id="min-largo"
              etiqueta={tr('minutosLargo')}
              unidad={tr('minutos')}
              valor={ajustes.largo}
              limites={LIMITES.largo}
              onCambio={(v) => setAjustes((a) => ({ ...a, largo: v }))}
            />
            <Minutos
              id="cada"
              etiqueta={tr('cada')}
              unidad={tr('pomodoros')}
              valor={ajustes.cada}
              limites={LIMITES.cada}
              onCambio={(v) => setAjustes((a) => ({ ...a, cada: v }))}
            />
          </div>

          {cuenta.estado === 'andando' && (
            <p className="text-[length:var(--fs-small)] text-ink-soft">{tr('cambioEnMarcha')}</p>
          )}
        </fieldset>

        <fieldset className="tarjeta-control" data-tour="aviso">
          <legend className="sr-only">{tr('aviso')}</legend>
          <p className="titulo" aria-hidden="true">
            {tr('aviso')}
          </p>

          <label className="interruptor">
            <input
              type="checkbox"
              role="switch"
              checked={conSonido}
              onChange={(e) => setConSonido(e.target.checked)}
            />
            <span className="texto">{tr('sonido')}</span>
          </label>

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

      {/* ---------------- La cuenta ---------------- */}
      <div className="columna-herramienta gap-5">
        <div className="reloj-pomodoro" data-tour="cuenta">
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
            </div>
          </div>

          {/* Lo que un lector de pantalla necesita y el anillo no da. */}
          <p aria-live="polite" className="sr-only">
            {tr('anuncioFase')} {nombreDeFase(cuenta.fase)}
          </p>

          <div className="mandos">
            {cuenta.estado === 'andando' ? (
              <Button onClick={pausar} className="h-11 px-5 text-[0.9375rem] border border-[var(--solido)] bg-[var(--solido)] font-semibold text-[var(--solido-ink)] hover:bg-[color-mix(in_srgb,var(--solido)_86%,#000)]">
                <PauseIcon aria-hidden="true" weight="fill" />
                {tr('pausar')}
              </Button>
            ) : (
              <Button onClick={empezar} className="h-11 px-5 text-[0.9375rem] border border-[var(--solido)] bg-[var(--solido)] font-semibold text-[var(--solido-ink)] hover:bg-[color-mix(in_srgb,var(--solido)_86%,#000)]">
                <PlayIcon aria-hidden="true" weight="fill" />
                {cuenta.estado === 'pausa' ? tr('seguir') : tr('empezar')}
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

        {/* ---------------- El ciclo ---------------- */}
        <section className="tarjeta-control" data-tour="ciclo">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="titulo">{tr('ciclo')}</p>
            {cuenta.hechos > 0 && (
              <Button variant="ghost" size="sm" onClick={desdeCero}>
                {tr('desdeCero')}
              </Button>
            )}
          </div>

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

          <p className="text-[length:var(--fs-small)] text-ink-soft">
            {tr('hechos')}: <strong className="text-ink">{cuenta.hechos}</strong>
            {' · '}
            {tr('siguienteEs')} {nombreDeFase(paso.fase)}
          </p>
        </section>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- auxiliares

/**
 * Un campo de minutos.
 *
 * El valor se limita al salir del campo y no al teclear: limitando en cada
 * pulsación, borrar el «5» de «25» para escribir «30» convertiría el «2»
 * en el mínimo antes de llegar al segundo dígito.
 */
function Minutos({
  id,
  etiqueta,
  unidad,
  valor,
  limites,
  onCambio,
}: {
  id: string;
  etiqueta: string;
  unidad: string;
  valor: number;
  limites: { min: number; max: number };
  onCambio: (valor: number) => void;
}) {
  const [bruto, setBruto] = useState(String(valor));

  useEffect(() => {
    setBruto(String(valor));
  }, [valor]);

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={limites.min}
          max={limites.max}
          value={bruto}
          onChange={(e) => setBruto(e.target.value)}
          onBlur={() => {
            const n = Math.min(limites.max, Math.max(limites.min, Math.round(Number(bruto))));
            onCambio(Number.isFinite(n) ? n : valor);
          }}
        />
        <span className="shrink-0 text-[length:var(--fs-small)] text-ink-soft">{unidad}</span>
      </div>
    </div>
  );
}
