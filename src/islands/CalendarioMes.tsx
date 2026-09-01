/**
 * El calendario, en su propio archivo para poder llegar tarde.
 *
 * Aquí dentro está todo lo que pesa —react-day-picker y los nombres de los
 * meses de date-fns—, y está aquí para que el navegador no lo descargue
 * hasta que alguien abra el campo de fecha. Medido: el trozo de esta
 * herramienta pasaba de 7 a 30 KB comprimidos con el calendario dentro, y
 * la inmensa mayoría de las visitas no llegan a abrirlo nunca.
 *
 * Es el mismo trato que ya tenía `Temporal` en esta página: lo caro se
 * carga cuando se necesita y no antes.
 */
import { enUS, es } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar';
import type { Lang } from '@/i18n/config';

interface Props {
  seleccionada: Date | undefined;
  lang: Lang;
  onElegir: (fecha: Date) => void;
}

export default function CalendarioMes({ seleccionada, lang, onElegir }: Props) {
  return (
    <Calendar
      mode="single"
      selected={seleccionada}
      defaultMonth={seleccionada}
      // Qué día empieza la semana lo sabe el locale —lunes en español,
      // domingo en inglés—, así que no se fuerza aquí: hacerlo sería
      // equivocarse en uno de los dos idiomas.
      locale={lang === 'es' ? es : enUS}
      autoFocus
      onSelect={(elegida) => {
        if (elegida) onElegir(elegida);
      }}
    />
  );
}
