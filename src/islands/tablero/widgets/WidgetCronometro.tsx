/**
 * El cronómetro, en una pieza.
 *
 * Lo que se recorta son las VUELTAS. En su página son una lista con el
 * número, la duración de cada una y el total, y esa lista es media
 * herramienta; en una pieza de 1×1 no cabe ni la primera línea. Quien
 * cronometra vueltas está mirando la herramienta, no un tablero.
 *
 * Queda contar, parar y poner a cero, que es para lo que se pone un
 * cronómetro en un tablero: medir cuánto llevas en algo.
 *
 * ---------------------------------------------------------------------
 * Su reloj no es el de las horas
 *
 * Un cronómetro se mide con `performance.now()` y no con `Date.now()`: el
 * segundo es monótono, no salta con el cambio de horario ni cuando el
 * sistema sincroniza su reloj. Con la hora del día, un ajuste de un
 * segundo hacia atrás mientras corre haría que el cronómetro retrocediera.
 *
 * Por eso no usa `useAhora`, que reparte `Date.now()`. Lleva su propio
 * latido, y solo mientras corre.
 */
import { useEffect, useRef, useState } from 'react';
import { ArrowCounterClockwiseIcon, PauseIcon, PlayIcon } from '@phosphor-icons/react';

import { t } from '../../../i18n/config';
import { RELOJ } from '../../../i18n/reloj';
import {
  CRONOMETRO_INICIAL,
  comoCronometro,
  transcurrido,
  type Cronometro,
} from '../../../lib/reloj';
import type { SinAjustes } from '../../../lib/widgets';
import type { PropsWidget } from '../tipos';

export default function WidgetCronometro({ lang }: PropsWidget<SinAjustes>) {
  const tr = (clave: keyof typeof RELOJ) => t(RELOJ[clave], lang);

  const [crono, setCrono] = useState<Cronometro>(CRONOMETRO_INICIAL);
  const [, repintar] = useState(0);
  const cuadro = useRef<number | null>(null);

  const andando = crono.estado === 'andando';

  /*
    Un `requestAnimationFrame` mientras corre, y ninguno parado.

    Las centésimas cambian cien veces por segundo: con un intervalo se ve
    saltar, y con `rAF` va al ritmo de la pantalla. Se para en cuanto se
    para el cronómetro — un bucle de animación corriendo sobre una cifra
    quieta gasta batería para nada.
  */
  useEffect(() => {
    if (!andando) return;
    const latir = () => {
      repintar((n) => n + 1);
      cuadro.current = requestAnimationFrame(latir);
    };
    cuadro.current = requestAnimationFrame(latir);
    return () => {
      if (cuadro.current !== null) cancelAnimationFrame(cuadro.current);
    };
  }, [andando]);

  const ahora = typeof performance !== 'undefined' ? performance.now() : 0;
  const llevado = transcurrido(crono, ahora);

  const arrancar = () =>
    setCrono((c) =>
      c.estado === 'andando'
        ? { estado: 'parado', acumulado: transcurrido(c, performance.now()), vueltas: c.vueltas }
        : {
            estado: 'andando',
            acumulado: c.acumulado,
            desde: performance.now(),
            vueltas: c.vueltas,
          }
    );

  const aCero = () => setCrono(CRONOMETRO_INICIAL);

  return (
    <div className="reloj-widget">
      <p className="cifra-widget cifra-crono" suppressHydrationWarning>
        {comoCronometro(llevado)}
      </p>

      <div className="mandos-widget">
        <button
          type="button"
          className="mando-pieza"
          aria-label={andando ? tr('pausar') : tr('empezar')}
          onClick={arrancar}
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
          disabled={llevado === 0}
          aria-label={tr('aCero')}
          onClick={aCero}
        >
          <ArrowCounterClockwiseIcon aria-hidden="true" size={15} />
        </button>
      </div>
    </div>
  );
}
