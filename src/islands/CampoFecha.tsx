/**
 * El campo de fecha: un botón que dice qué día es y abre un calendario.
 *
 * Sustituye a un `<input type="date">`. El nativo no costaba nada y
 * funcionaba sin JavaScript, pero en escritorio es el widget del navegador
 * —distinto en cada uno, ajeno al resto de la página— y aquí la fecha no
 * es un dato de formulario cualquiera: es «¿qué día es la cita?», y eso se
 * contesta mirando un mes, no escribiendo tres números.
 *
 * ---------------------------------------------------------------------
 * La trampa de las fechas sueltas
 *
 * Una fecha sin hora ni zona parece inofensiva y no lo es. `new
 * Date('2026-09-04')` la lee como medianoche UTC, y en cualquier sitio al
 * oeste de Greenwich eso ya es el día 3: el calendario marcaría el día
 * anterior al que pone en el campo. En una herramienta de husos horarios
 * ese fallo sería especialmente ridículo.
 *
 * Por eso la conversión va en las dos direcciones con los números por
 * separado —que es local— y a MEDIODÍA, para que ni el domingo en que se
 * adelanta el reloj pueda empujarla al día de al lado.
 */
import { Suspense, lazy, useState } from 'react';
import { CalendarBlankIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Lang } from '@/i18n/config';
import { localeDe } from '@/lib/timezones';

/*
  El calendario llega tarde y a propósito.

  react-day-picker y los nombres de los meses de date-fns pesan 23 KB
  comprimidos —el trozo de esta herramienta pasaba de 7 a 30—, y quien
  entra a mirar qué hora es en Manila no abre nunca el campo de fecha.
  Así que se descarga al abrirlo, que es el mismo trato que ya tenía el
  polyfill de `Temporal` en esta página.
*/
const CalendarioMes = lazy(() => import('./CalendarioMes'));

interface Props {
  id: string;
  /** «2026-09-04». Vacío mientras la herramienta no ha hidratado. */
  valor: string;
  lang: Lang;
  onCambio: (valor: string) => void;
  /** Se llama al abrir: es el momento de parar el reloj. */
  onAbrir?: () => void;
}

/** «2026-09-04» → el mediodía local de ese día. Ver la cabecera. */
function aFecha(texto: string): Date | undefined {
  const [año, mes, dia] = texto.split('-').map(Number);
  if (!año || !mes || !dia) return undefined;
  return new Date(año, mes - 1, dia, 12);
}

/** Y de vuelta, con los descriptores locales por el mismo motivo. */
function aTexto(fecha: Date): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

export default function CampoFecha({ id, valor, lang, onCambio, onAbrir }: Props) {
  const [abierto, setAbierto] = useState(false);
  const fecha = aFecha(valor);

  /*
    El rótulo lo escribe `Intl` en el idioma de la página y no date-fns.
    date-fns entra igualmente —react-day-picker lo necesita para los
    nombres de los meses de dentro— pero para esta línea `Intl` ya está
    ahí y no hay que elegir formato: el locale sabe si va «4 sept» o
    «Sep 4».
  */
  /*
    Sin el dia de la semana y con el mes corto: «1 sept 2026».

    Con «mar, 1 de septiembre de 2026» el disparador se comia el campo de
    la hora de al lado — son dos columnas de media tarjeta y ahi no cabe
    una fecha escrita entera. El dia de la semana no se pierde: la lista
    de la derecha lo dice en cada fila, y el calendario lo ensena al abrirse.
  */
  const rotulo = fecha
    ? new Intl.DateTimeFormat(localeDe(lang), {
        day: 'numeric',
        month: 'short',
        // El año solo cuando NO es este. En español el locale mete sus
        // «de» —«4 de sept de 2026»— y eso ya no cabe en media tarjeta;
        // y el año de este año no le dice nada a nadie. Cuando de verdad
        // importa, que es cruzando diciembre, sí aparece.
        ...(fecha.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' as const } : {}),
      }).format(fecha)
    : '';

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
          <CalendarBlankIcon aria-hidden="true" />
          <span className="min-w-0 truncate">{rotulo}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="selector-fecha w-auto p-0" align="start">
        {/* El hueco mide lo que va a medir el calendario, para que el
            popover no dé un salto cuando llegue. */}
        <Suspense fallback={<div className="calendario-esperando" />}>
          <CalendarioMes
            seleccionada={fecha}
            lang={lang}
            onElegir={(elegida) => {
              onCambio(aTexto(elegida));
              setAbierto(false);
            }}
          />
        </Suspense>
      </PopoverContent>
    </Popover>
  );
}
