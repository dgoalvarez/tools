/**
 * La hora de otra ciudad.
 *
 * Es el widget que sustituye a la herramienta de husos en compacto: en
 * una pieza, husos ES un reloj mundial. La herramienta entera sirve para
 * CONVERTIR —«las 15:00 de aquí son las X de allí»— y eso necesita un
 * campo de hora, una fecha y una lista; aquí lo que se quiere es saber
 * qué hora es allí ahora mismo, sin preguntar nada.
 *
 * Se repite hasta seis veces, y por eso lleva ajustes: cada copia enseña
 * una ciudad distinta, que es justo lo que hace útil tener varias.
 *
 * La diferencia con la hora de aquí se enseña siempre. Sin ella hay que
 * restar mentalmente dos cifras, que es la operación que la herramienta
 * de husos existe para evitar.
 */
import { useAhora } from '../../../hooks/useAhora';
import { nombreDeZona, zonaDe } from '../../../lib/zonas-codigo';
import type { AjustesMundial } from '../../../lib/widgets';
import type { PropsWidget } from '../tipos';

export default function WidgetMundial({ lang, ajustes }: PropsWidget<AjustesMundial>) {
  const tic = useAhora(10_000);
  const ahora = new Date(tic || Date.now());

  const zona = zonaDe(ajustes.zona) ?? 'UTC';

  const hora = new Intl.DateTimeFormat(lang, {
    timeZone: zona,
    hour: '2-digit',
    minute: '2-digit',
    hour12: ajustes.doce === 1,
  }).format(ahora);

  /*
    La diferencia en horas, calculada con las dos horas escritas.

    Restar desplazamientos no vale: no todas las zonas van a horas
    enteras —Katmandú son +5:45— y el horario de verano cambia el
    desplazamiento sin avisar. Formateando la MISMA marca de tiempo en
    las dos zonas y restando, sale bien siempre, incluido el día en que
    una de las dos cambia la hora y la otra no.
  */
  const diferencia = diferenciaHoras(ahora, zona);

  return (
    <div className="reloj-widget">
      <p className="cifra-widget" suppressHydrationWarning>
        {hora}
      </p>
      <p className="pie-widget">
        {nombreDeZona(zona, lang).split(' · ')[0]}
        {diferencia !== null && (
          <span className="diferencia-widget" suppressHydrationWarning>
            {diferencia === 0 ? '=' : diferencia > 0 ? `+${diferencia}` : diferencia}
          </span>
        )}
      </p>
    </div>
  );
}

/**
 * Cuántas horas de diferencia hay con la zona de quien mira.
 *
 * Devuelve `null` si el navegador no sabe formatear esa zona, que pasa en
 * navegadores viejos con las zonas menos usadas. Mejor no decir nada que
 * decir una diferencia inventada.
 */
function diferenciaHoras(ahora: Date, zona: string): number | null {
  try {
    const enZona = (tz?: string) =>
      new Date(ahora.toLocaleString('en-US', tz ? { timeZone: tz } : undefined)).getTime();
    const delta = (enZona(zona) - enZona()) / 3_600_000;
    // Media hora y tres cuartos existen: se redondea a un decimal y se
    // quita el «.0» para que las enteras se lean limpias.
    return Math.round(delta * 10) / 10;
  } catch {
    return null;
  }
}
