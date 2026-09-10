/**
 * El pomodoro, dentro del tablero.
 *
 * ---------------------------------------------------------------------
 * La cuenta es la MISMA que la de /es/pomodoro
 *
 * Se guarda en `sessionStorage` con `guardarCuenta`, así que arrancar
 * aquí y saltar a la herramienta sigue la misma cuenta, y al revés. Es lo
 * mismo que hacen la lista y la nota con su cuaderno.
 *
 * ---------------------------------------------------------------------
 * Las duraciones son las de fábrica, y eso es una renuncia consciente
 *
 * En su página las duraciones viven en la DIRECCIÓN, y esa es la regla
 * que no se toca: una página, un escritor de la URL. En el tablero el
 * único escritor es el tablero, así que este widget no puede leer ni
 * escribir esos parámetros sin romperla.
 *
 * Se podría haber guardado un juego de duraciones propio del widget
 * dentro del código del tablero —los ajustes son justo para eso—, y se
 * descartó por ahora: son cuatro números y añadirlos antes de que nadie
 * los pida es inventar trabajo. Quien quiera 50/10 lo pone en la
 * herramienta, que está a un clic en el riel.
 *
 * ---------------------------------------------------------------------
 * La campana suena UNA vez, y por eso el efecto está aquí
 *
 * Un hook compartido con `Pomodoro.tsx` habría sido lo elegante, pero el
 * efecto de cambio de fase dentro de un hook con dos suscriptores en el
 * mismo documento suena dos veces. Aquí no puede pasar: el pomodoro tiene
 * tope de una copia y su página es otra página. El día que dos cosas del
 * mismo documento quieran la cuenta, el efecto tendrá que subir a un
 * módulo con un solo dueño — no a un hook que cada uno ejecuta por su
 * cuenta.
 *
 * Lo que se recorta: los ajustes de duración, el permiso de las
 * notificaciones del sistema y el recuento del ciclo. Queda lo que un
 * temporizador tiene que hacer: contar, y avisar cuando acaba.
 */
import { useEffect, useState } from 'react';
import { ArrowClockwiseIcon, PauseIcon, PlayIcon, SkipForwardIcon } from '@phosphor-icons/react';

import { useAhora } from '../../../hooks/useAhora';
import { t } from '../../../i18n/config';
import { POMODORO } from '../../../i18n/pomodoro';
import { arrancarAudio, sonar } from '../../../lib/aviso';
import {
  AJUSTES_INICIALES,
  comoReloj,
  duracionMs,
  leerCuenta,
  guardarCuenta,
  margenRestanteMs,
  restanteMs,
  siguiente,
  type Cuenta,
  type Fase,
} from '../../../lib/pomodoro';
import type { SinAjustes } from '../../../lib/widgets';
import type { PropsWidget } from '../tipos';

const AJUSTES = AJUSTES_INICIALES;

export default function WidgetPomodoro({ lang, medida }: PropsWidget<SinAjustes>) {
  const tr = (clave: keyof typeof POMODORO) => t(POMODORO[clave], lang);

  const [cuenta, setCuenta] = useState<Cuenta>({ estado: 'parado', fase: 'trabajo', hechos: 0 });
  const [listo, setListo] = useState(false);

  /*
    El reloj compartido, no un intervalo propio.

    `useAhora` mantiene UN temporizador por documento al periodo más fino
    que alguien pida y lo para con la pestaña de fondo. Y devuelve 0 en el
    servidor a propósito: con `Date.now()` el HTML pintado y el primer
    render del navegador dirían horas distintas.
  */
  const corriendo = cuenta.estado === 'andando' || cuenta.estado === 'margen';
  const tic = useAhora(corriendo ? 250 : null);
  const ahora = tic || Date.now();

  useEffect(() => {
    const guardada = leerCuenta();
    if (guardada) setCuenta(guardada);
    setListo(true);
  }, []);

  useEffect(() => {
    if (listo) guardarCuenta(cuenta);
  }, [listo, cuenta]);

  // ---------- el cambio de fase ----------

  useEffect(() => {
    if (cuenta.estado !== 'andando') return;
    if (restanteMs(cuenta, AJUSTES, ahora) > 0) return;

    const acababaTrabajo = cuenta.fase === 'trabajo';
    const paso = siguiente(cuenta.fase, cuenta.hechos, AJUSTES);

    sonar(acababaTrabajo);

    /*
      La fase siguiente arranca sola, pero antes corre el margen: el
      descanso no puede empezar a contar mientras todavía estás cerrando
      lo que hacías, porque esos segundos te los quitas tú.
    */
    setCuenta(
      AJUSTES.margen > 0
        ? {
            estado: 'margen',
            fase: paso.fase,
            hechos: paso.hechos,
            empiezaEn: Date.now() + AJUSTES.margen * 1000,
          }
        : {
            estado: 'andando',
            fase: paso.fase,
            hechos: paso.hechos,
            terminaEn: Date.now() + duracionMs(paso.fase, AJUSTES),
          }
    );
  }, [ahora, cuenta]);

  useEffect(() => {
    if (cuenta.estado !== 'margen') return;
    if (margenRestanteMs(cuenta, ahora) > 0) return;

    setCuenta({
      estado: 'andando',
      fase: cuenta.fase,
      hechos: cuenta.hechos,
      terminaEn: Date.now() + duracionMs(cuenta.fase, AJUSTES),
    });
  }, [ahora, cuenta]);

  // ---------- los mandos ----------

  function empezar() {
    // El navegador no deja sonar nada hasta que alguien ha tocado algo:
    // el contexto de audio se despierta en el gesto, no cuando suena.
    arrancarAudio();
    setCuenta((c) => {
      if (c.estado === 'andando') return c;
      const queda = c.estado === 'pausa' ? c.restanteMs : duracionMs(c.fase, AJUSTES);
      return { estado: 'andando', fase: c.fase, hechos: c.hechos, terminaEn: Date.now() + queda };
    });
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

  const reiniciar = () => setCuenta((c) => ({ estado: 'parado', fase: c.fase, hechos: c.hechos }));

  const saltar = () =>
    setCuenta((c) => {
      const paso = siguiente(c.fase, c.hechos, AJUSTES);
      return { estado: 'parado', fase: paso.fase, hechos: paso.hechos };
    });

  const nombreDeFase = (fase: Fase) =>
    fase === 'trabajo' ? tr('faseTrabajo') : fase === 'corto' ? tr('faseCorto') : tr('faseLargo');

  const queda =
    cuenta.estado === 'margen'
      ? margenRestanteMs(cuenta, ahora)
      : restanteMs(cuenta, AJUSTES, ahora);

  const andando = cuenta.estado === 'andando';

  return (
    <div className="pomodoro-widget" data-talla={medida.cols + 'x' + medida.filas}>
      <p className="fase-widget">
        {cuenta.estado === 'margen' ? tr('empiezaEn') : nombreDeFase(cuenta.fase)}
      </p>

      {/*
        `tabular-nums` no es decoración: sin él, cada segundo cambia el
        ancho de las cifras y el reloj entero tiembla dentro de la pieza.
      */}
      <p className="cifra-widget">{comoReloj(queda)}</p>

      <div className="mandos-widget">
        <button
          type="button"
          className="mando-pieza"
          aria-label={
            andando ? tr('pausar') : cuenta.estado === 'pausa' ? tr('seguir') : tr('empezar')
          }
          onClick={andando ? pausar : empezar}
        >
          {andando ? (
            <PauseIcon aria-hidden="true" size={15} weight="fill" />
          ) : (
            <PlayIcon aria-hidden="true" size={15} weight="fill" />
          )}
        </button>

        <button
          type="button"
          className="mando-pieza"
          aria-label={tr('reiniciar')}
          onClick={reiniciar}
        >
          <ArrowClockwiseIcon aria-hidden="true" size={15} />
        </button>

        <button type="button" className="mando-pieza" aria-label={tr('saltar')} onClick={saltar}>
          <SkipForwardIcon aria-hidden="true" size={15} />
        </button>
      </div>
    </div>
  );
}
