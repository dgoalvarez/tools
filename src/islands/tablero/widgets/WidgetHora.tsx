/**
 * La hora de aquí, en una pieza.
 *
 * Es el widget más pequeño que existe y el que justifica el 1×1: una
 * cifra grande y nada más. La herramienta entera tiene esfera, fecha,
 * alarma, cronómetro y temporizador; aquí queda la hora, que es lo que
 * alguien quiere de reojo mientras hace otra cosa.
 *
 * Los segundos son un ajuste y no una decisión nuestra. Sin ellos la
 * cifra no cambia en un minuto entero y la pieza parece congelada; con
 * ellos, algo se mueve todo el rato en una esquina de la pantalla, y eso
 * molesta a mucha gente. No hay una respuesta buena para los dos, así que
 * se elige.
 */
import { useAhora } from '../../../hooks/useAhora';
import type { AjustesHora } from '../../../lib/widgets';
import type { PropsWidget } from '../tipos';

export default function WidgetHora({ lang, ajustes }: PropsWidget<AjustesHora>) {
  /*
    El periodo depende de lo que se enseña.

    Con segundos hace falta latir cada medio segundo para no llegar tarde
    a ninguno; sin ellos, cada diez segundos sobra para que el minuto
    cambie a tiempo. `useAhora` mantiene UN temporizador por documento al
    periodo más fino que alguien pida, así que pedir menos aquí es menos
    trabajo para toda la página.
  */
  const tic = useAhora(ajustes.segundos ? 500 : 10_000);
  const ahora = new Date(tic || Date.now());

  const hora = new Intl.DateTimeFormat(lang, {
    hour: '2-digit',
    minute: '2-digit',
    ...(ajustes.segundos ? { second: '2-digit' } : {}),
    hour12: ajustes.doce === 1,
  }).format(ahora);

  const fecha = new Intl.DateTimeFormat(lang, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(ahora);

  return (
    <div className="reloj-widget">
      {/*
        `suppressHydrationWarning` porque el servidor pinta la hora del
        servidor: `useAhora` devuelve 0 en el primer render a propósito
        —para eso está— y aquí se cae en `Date.now()`, que en el navegador
        es otra. Sin esto React avisa de un desajuste que es el que se
        quiere.
      */}
      <p className="cifra-widget" suppressHydrationWarning>
        {hora}
      </p>
      <p className="pie-widget" suppressHydrationWarning>
        {fecha}
      </p>
    </div>
  );
}
