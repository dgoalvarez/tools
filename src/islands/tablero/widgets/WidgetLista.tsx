/**
 * La lista, dentro del tablero.
 *
 * ---------------------------------------------------------------------
 * Es la MISMA lista que la de /es/notas
 *
 * Las dos leen y escriben el mismo cuaderno por `useCuaderno`, así que lo
 * que se apunte aquí está allí al momento. No es un efecto secundario: un
 * tablero con «otra» lista sería una segunda libreta que nadie pidió, y
 * quien apuntara algo en el tablero no lo encontraría al abrir la
 * herramienta.
 *
 * ---------------------------------------------------------------------
 * Por qué no se extrae un panel común con `Notas.tsx`
 *
 * Era el plan, y se descartó al mirarlo de cerca. La lista de su página
 * lleva ocho cosas que aquí no caben ni hacen falta: deshacer un borrado,
 * las flechas de subir y bajar, arrastrar, el contador, copiar a
 * Markdown, borrar solo las hechas, vaciar entera y el aviso de que el
 * navegador no deja guardar. Un panel que sirviera a los dos sería una
 * lista de parámetros más larga que cualquiera de las dos versiones, y
 * `Notas.tsx` funciona y está comprobado.
 *
 * Lo que NO se duplica es lo que importa: toda la aritmética sigue en
 * `src/lib/notas.ts` —añadir, marcar, borrar, los límites— y esa está
 * probada sin navegador. Aquí solo hay JSX y tres manejadores.
 *
 * Lo que se recorta, dicho de una vez: se puede añadir, marcar y borrar.
 * Reordenar, deshacer y exportar viven en la herramienta entera, que
 * está a un clic en el riel.
 */
import { useRef, type FormEvent } from 'react';
import { CheckIcon, TrashIcon } from '@phosphor-icons/react';

import { cambiarCuaderno, useCuaderno } from '../../../hooks/useCuaderno';
import { t } from '../../../i18n/config';
import { NOTAS } from '../../../i18n/notas';
import { anadir, borrar, limpiarLinea, marcar } from '../../../lib/notas';
import type { SinAjustes } from '../../../lib/widgets';
import type { PropsWidget } from '../tipos';

export default function WidgetLista({ lang }: PropsWidget<SinAjustes>) {
  const { cuaderno } = useCuaderno();
  const campo = useRef<HTMLInputElement>(null);

  const tr = (clave: keyof typeof NOTAS) => t(NOTAS[clave], lang);
  const tareas = cuaderno.tareas;

  const conTareas = (siguientes: typeof tareas) =>
    cambiarCuaderno({ ...cuaderno, tareas: siguientes });

  function alAnadir(evento: FormEvent) {
    evento.preventDefault();
    const texto = limpiarLinea(campo.current?.value ?? '');
    if (!texto) return;
    conTareas(anadir(tareas, texto));
    // Se vacía a mano en vez de con estado: el campo no lo gobierna React
    // —no hace falta— y así escribir no vuelve a pintar la lista entera
    // en cada tecla.
    if (campo.current) campo.current.value = '';
  }

  return (
    <div className="lista-widget">
      <form className="fila-nueva" onSubmit={alAnadir}>
        <input
          ref={campo}
          type="text"
          className="campo-nuevo"
          placeholder={tr('anadir')}
          aria-label={tr('anadir')}
          maxLength={500}
        />
      </form>

      {tareas.length === 0 ? (
        <p className="lista-widget-vacia">{tr('listaVacia')}</p>
      ) : (
        <ul className="lista-widget-cuerpo">
          {tareas.map((tarea) => (
            <li key={tarea.id} data-hecha={tarea.hecha || undefined}>
              {/*
                La casilla es un botón y no un <input type="checkbox">
                porque tiene que verse igual en los dos temas y el nativo
                no se deja pintar del todo. `aria-pressed` es lo que dice
                a un lector si está marcada.
              */}
              <button
                type="button"
                className="marca-widget"
                aria-pressed={tarea.hecha}
                aria-label={`${tr('hecha')}: ${tarea.texto}`}
                onClick={() => conTareas(marcar(tareas, tarea.id, !tarea.hecha))}
              >
                {tarea.hecha && <CheckIcon aria-hidden="true" size={12} weight="bold" />}
              </button>

              <span className="texto-widget">{tarea.texto}</span>

              <button
                type="button"
                className="mando-pieza"
                aria-label={`${tr('borrar')}: ${tarea.texto}`}
                onClick={() => conTareas(borrar(tareas, tarea.id))}
              >
                <TrashIcon aria-hidden="true" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
