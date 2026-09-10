/**
 * El temporizador, en una pieza.
 *
 * Su página lo pone con tres campos —horas, minutos y segundos— porque
 * ahí se cronometra cualquier cosa. En el tablero la puesta es UN número
 * de minutos que se configura con la rueda, y eso cubre lo que se pone en
 * un tablero: el té, el horno, los quince minutos de una pausa. Quien
 * necesite 1 h 12 min 30 s tiene la herramienta a un clic en el riel.
 *
 * ---------------------------------------------------------------------
 * Sigue contando después de cero
 *
 * Cuando llega a cero no se apaga: pasa a contar hacia ARRIBA hasta que
 * alguien lo para. No es un adorno — un temporizador que se apaga solo no
 * deja saber cuánto tiempo lleva sonando, y «se me pasó el arroz» empieza
 * justo ahí. Con la cuenta a la vista, quien vuelve a la cocina sabe si
 * llega tarde por medio minuto o por diez. Es la misma decisión que ya
 * está tomada en su herramienta.
 */
import { useEffect, useState } from 'react';
import { ArrowCounterClockwiseIcon, PauseIcon, PlayIcon } from '@phosphor-icons/react';

import { useAhora } from '../../../hooks/useAhora';
import { t } from '../../../i18n/config';
import { RELOJ } from '../../../i18n/reloj';
import { arrancarAudio, sonar } from '../../../lib/aviso';
import { comoCuenta } from '../../../lib/reloj';
import type { AjustesTemporizador } from '../../../lib/widgets';
import type { PropsWidget } from '../tipos';

type Cuenta =
  | { estado: 'parado' }
  | { estado: 'andando'; terminaEn: number }
  | { estado: 'pausa'; restanteMs: number }
  | { estado: 'sonando'; desde: number };

export default function WidgetTemporizador({ lang, ajustes }: PropsWidget<AjustesTemporizador>) {
  const tr = (clave: keyof typeof RELOJ) => t(RELOJ[clave], lang);

  const [cuenta, setCuenta] = useState<Cuenta>({ estado: 'parado' });

  const total = ajustes.minutos * 60_000;
  const corriendo = cuenta.estado === 'andando' || cuenta.estado === 'sonando';
  const tic = useAhora(corriendo ? 250 : null);
  const ahora = tic || Date.now();

  /*
    Al cambiar los minutos con la rueda, un temporizador PARADO se pone al
    valor nuevo; uno andando sigue con lo suyo.

    Cambiar la puesta a mitad de cuenta y que la cuenta salte sería perder
    lo que llevaba corrido sin haberlo pedido.
  */

  // ---------- llegar a cero ----------
  useEffect(() => {
    if (cuenta.estado !== 'andando') return;
    if (cuenta.terminaEn > ahora) return;
    sonar(false);
    setCuenta({ estado: 'sonando', desde: cuenta.terminaEn });
  }, [ahora, cuenta]);

  const queda =
    cuenta.estado === 'andando'
      ? Math.max(0, cuenta.terminaEn - ahora)
      : cuenta.estado === 'pausa'
        ? cuenta.restanteMs
        : cuenta.estado === 'sonando'
          ? ahora - cuenta.desde
          : total;

  const andando = cuenta.estado === 'andando';
  const sonando = cuenta.estado === 'sonando';

  function alternar() {
    arrancarAudio();
    setCuenta((c) => {
      if (c.estado === 'andando') {
        return { estado: 'pausa', restanteMs: Math.max(0, c.terminaEn - Date.now()) };
      }
      if (c.estado === 'sonando') return { estado: 'parado' };
      const resto = c.estado === 'pausa' ? c.restanteMs : total;
      return { estado: 'andando', terminaEn: Date.now() + resto };
    });
  }

  return (
    <div className="reloj-widget" data-sonando={sonando || undefined}>
      <p className="cifra-widget" suppressHydrationWarning>
        {/* Con el signo delante cuando va pasado: sin él, «01:30» significa
            dos cosas contrarias según el estado y no hay forma de saber
            cuál. */}
        {sonando ? `+${comoCuenta(queda)}` : comoCuenta(queda)}
      </p>

      <div className="mandos-widget">
        <button
          type="button"
          className="mando-pieza"
          aria-label={sonando ? tr('pararTemporizador') : andando ? tr('pausar') : tr('empezar')}
          onClick={alternar}
        >
          {andando || sonando ? (
            <PauseIcon aria-hidden="true" size={15} weight="fill" />
          ) : (
            <PlayIcon aria-hidden="true" size={15} weight="fill" />
          )}
        </button>

        <button
          type="button"
          className="mando-pieza"
          disabled={cuenta.estado === 'parado'}
          aria-label={tr('aCero')}
          onClick={() => setCuenta({ estado: 'parado' })}
        >
          <ArrowCounterClockwiseIcon aria-hidden="true" size={15} />
        </button>
      </div>
    </div>
  );
}
