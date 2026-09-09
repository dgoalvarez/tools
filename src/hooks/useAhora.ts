/**
 * Un solo latido para toda la página.
 *
 * ---------------------------------------------------------------------
 * Por qué hace falta
 *
 * Hoy cada herramienta de tiempo trae su propio `setInterval`: el reloj
 * uno adaptativo de 50/250/30000 ms, los husos uno de 5 s que no se apaga
 * nunca, el pomodoro uno de 250 ms. Cada una en su página, así que nunca
 * se han pisado.
 *
 * En el tablero sí conviven. Un panel con el pomodoro, dos relojes de dos
 * ciudades y un cronómetro serían cuatro temporizadores latiendo a
 * destiempo y cuatro repintados distintos, cuando lo que hace falta es
 * uno. Esto lo convierte en uno.
 *
 * ---------------------------------------------------------------------
 * La instantánea del servidor es CERO, y no es un detalle
 *
 * Si el primer valor fuera `Date.now()`, el HTML que pinta el servidor y
 * el primer pintado del cliente traerían horas distintas y React
 * protestaría por la hidratación — que es exactamente lo que
 * `Timezones.tsx` evita hoy a mano arrancando su `ahora` en `null`.
 *
 * Con cero, quien lo use pinta «--:--» hasta el primer tic, que llega en
 * el mismo fotograma en que la isla se monta.
 *
 * ---------------------------------------------------------------------
 * Y para en cuanto la pestaña se va al fondo
 *
 * Arregla de paso el intervalo de los husos, que hoy sigue despertando al
 * navegador cada cinco segundos con la pestaña escondida.
 */
import { useSyncExternalStore } from 'react';

interface Oyente {
  cada: number;
  ultimo: number;
  avisar: () => void;
}

const oyentes = new Set<Oyente>();

let temporizador: ReturnType<typeof setInterval> | null = null;
/** El periodo al que late ahora mismo. Es el más fino que alguien pidió. */
let periodo = Infinity;
let ahora = 0;

function latir() {
  ahora = Date.now();
  for (const oyente of oyentes) {
    if (ahora - oyente.ultimo < oyente.cada) continue;
    oyente.ultimo = ahora;
    oyente.avisar();
  }
}

/**
 * Enciende, apaga o reajusta el único temporizador.
 *
 * Se reinicia SOLO si el periodo cambia: sin esa comprobación, montar el
 * cuarto widget reiniciaría el latido de los otros tres y todos
 * perderían el tic que tenían a medias.
 */
function ajustar() {
  const escondida = typeof document !== 'undefined' && document.hidden;
  const pedido = escondida ? Infinity : Math.min(Infinity, ...[...oyentes].map((o) => o.cada));

  if (pedido === periodo) return;

  const estaba = temporizador !== null;
  periodo = pedido;

  if (temporizador !== null) {
    clearInterval(temporizador);
    temporizador = null;
  }
  if (!Number.isFinite(periodo)) return;

  temporizador = setInterval(latir, periodo);

  /*
    Al encenderse de cero, un tic inmediato.

    Mientras nadie pide latido, `ahora` se queda con la hora del último
    que hubo — que puede ser de hace diez minutos. Sin este tic, el
    primer pintado de quien acaba de suscribirse usaría esa hora rancia:
    en el pomodoro son unos milisegundos de cuenta atrás disparatada
    justo al pulsar «Empezar».
  */
  if (!estaba) latir();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    // Al volver, un tic inmediato: si no, la primera cifra que se ve es
    // la de cuando se fue, y con el pomodoro eso son minutos de mentira.
    if (!document.hidden) latir();
    ajustar();
  });
}

/**
 * El instante actual, refrescado cada `cada` milisegundos.
 *
 * Con `null` no se suscribe a nada: es lo que permite que un widget
 * parado —un pomodoro en pausa— deje de pedir latidos sin dejar de usar
 * el hook, que sería lo que rompería las reglas de los hooks.
 */
export function useAhora(cada: number | null): number {
  return useSyncExternalStore(
    (avisar) => {
      if (cada === null) return () => {};

      const oyente: Oyente = { cada, ultimo: 0, avisar };
      oyentes.add(oyente);
      ajustar();

      return () => {
        oyentes.delete(oyente);
        ajustar();
      };
    },
    () => ahora,
    () => 0
  );
}

/** Cuántos oyentes hay ahora mismo. Solo para comprobar desde una sonda. */
export function cuantosLatidos(): { oyentes: number; periodo: number } {
  return { oyentes: oyentes.size, periodo };
}
