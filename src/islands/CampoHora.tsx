/**
 * El campo de hora: un botón que dice la hora y abre dos columnas.
 *
 * Hora a la izquierda, minuto a la derecha, y a. m./p. m. debajo.
 * Sustituye a un `<input type="time">` en la tarjeta —no en las filas de
 * la lista, donde el campo nativo se queda: ahí lo que se necesita es
 * corregir una hora sin que se abra nada encima, y doce filas con doce
 * popovers serían doce sitios donde equivocarse.
 *
 * ---------------------------------------------------------------------
 * Por qué los sesenta minutos y no cuatro
 *
 * La alternativa era una sola lista en saltos de cuarto, que es lo que
 * hacen los productos de agendar. Se descartó porque esta herramienta no
 * solo agenda: sirve igual para saber a qué hora sale un vuelo o cuándo
 * emiten algo, y esas horas caen donde les da la gana. Con dos columnas
 * cabe cualquier minuto sin que la lista se haga interminable, porque son
 * 12 + 60 opciones repartidas y no 1.440 seguidas.
 *
 * El coste es que son tres decisiones —hora, minuto y meridiano— en vez
 * de una. Se paga abriendo cada columna por donde ya está puesta, que es
 * lo que hace que la mayoría de las veces solo haya que tocar una.
 */
import { useEffect, useRef, useState } from 'react';
import { ClockIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Lang } from '@/i18n/config';
import { localeDe } from '@/lib/timezones';

export interface TextosHora {
  columnaHora: string;
  columnaMinuto: string;
}

interface Props {
  id: string;
  /** «17:00», en 24 horas. Vacío mientras no ha hidratado. */
  valor: string;
  lang: Lang;
  textos: TextosHora;
  onCambio: (valor: string) => void;
  /** Se llama al abrir: es el momento de parar el reloj. */
  onAbrir?: () => void;
}

const HORAS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTOS = Array.from({ length: 60 }, (_, i) => i);

/** Un instante cualquiera con esa hora, solo para que `Intl` lo escriba. */
function comoTexto(h24: number, minuto: number, lang: Lang): string {
  return new Intl.DateTimeFormat(localeDe(lang), {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(2026, 0, 1, h24, minuto));
}

/**
 * Cómo se dice «a. m.» aquí.
 *
 * Sale del propio locale y no de una constante: en español es «a. m.» con
 * puntos y espacio, y en inglés «AM». Escribirlo a mano sería acertar en
 * uno de los dos idiomas.
 */
function meridiano(tarde: boolean, lang: Lang): string {
  const partes = new Intl.DateTimeFormat(localeDe(lang), {
    hour: 'numeric',
    hour12: true,
  }).formatToParts(new Date(2026, 0, 1, tarde ? 15 : 9));
  return partes.find((p) => p.type === 'dayPeriod')?.value ?? (tarde ? 'PM' : 'AM');
}

export default function CampoHora({ id, valor, lang, textos, onCambio, onAbrir }: Props) {
  const [abierto, setAbierto] = useState(false);
  const columnas = useRef<HTMLDivElement>(null);

  const [h24, minuto] = valor.split(':').map(Number);
  const hay = Number.isFinite(h24) && Number.isFinite(minuto);
  const hora24 = hay ? h24! : 0;
  const min = hay ? minuto! : 0;

  const tarde = hora24 >= 12;
  const hora12 = hora24 % 12 || 12;

  const poner = (nuevaH12: number, nuevoMin: number, esTarde: boolean) => {
    const h = (nuevaH12 % 12) + (esTarde ? 12 : 0);
    onCambio(`${String(h).padStart(2, '0')}:${String(nuevoMin).padStart(2, '0')}`);
  };

  /*
    Cada columna se abre por donde ya está puesta.

    Sin esto, la de los minutos abre en el 00 y para llegar al 45 hay que
    desplazarse a ciegas — que es justo lo que hace que un selector de dos
    columnas se sienta peor que escribir la hora. Va en un `rAF` porque
    Radix monta el contenido en el mismo pintado en que lo abre, y antes de
    eso los elementos no tienen sitio al que desplazarse.
  */
  useEffect(() => {
    if (!abierto) return;
    const id = requestAnimationFrame(() => {
      columnas.current
        ?.querySelectorAll('[aria-selected="true"]')
        .forEach((el) => el.scrollIntoView({ block: 'center' }));
    });
    return () => cancelAnimationFrame(id);
  }, [abierto]);

  return (
    <Popover
      open={abierto}
      onOpenChange={(a) => {
        setAbierto(a);
        if (a) onAbrir?.();
      }}
    >
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" className="campo-disparador">
          <ClockIcon aria-hidden="true" />
          <span className="min-w-0 truncate">{hay ? comoTexto(hora24, min, lang) : ''}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <div className="selector-hora">
          <div className="columnas" ref={columnas}>
            <div className="columna">
              <p className="rotulo">{textos.columnaHora}</p>
              <div className="opciones" role="listbox" aria-label={textos.columnaHora}>
                {HORAS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    role="option"
                    aria-selected={h === hora12}
                    className="opcion"
                    onClick={() => poner(h, min, tarde)}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="columna">
              <p className="rotulo">{textos.columnaMinuto}</p>
              <div className="opciones" role="listbox" aria-label={textos.columnaMinuto}>
                {MINUTOS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="option"
                    aria-selected={m === min}
                    className="opcion"
                    onClick={() => poner(hora12, m, tarde)}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/*
            Dos botones y no un interruptor: «a. m.» y «p. m.» se leen los
            dos a la vez y se ve cuál está puesto sin tener que interpretar
            la posición de nada.
          */}
          <div className="meridiano" role="group">
            {[false, true].map((esTarde) => (
              <button
                key={String(esTarde)}
                type="button"
                className="opcion"
                aria-pressed={esTarde === tarde}
                onClick={() => poner(hora12, min, esTarde)}
              >
                {meridiano(esTarde, lang)}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
