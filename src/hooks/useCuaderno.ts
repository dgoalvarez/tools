/**
 * La libreta, compartida por quien la pida.
 *
 * ---------------------------------------------------------------------
 * Por qué un almacén y no otro `useState`
 *
 * Hasta ahora solo había un sitio que leía y escribía el cuaderno: la
 * isla de notas. Con el tablero hay dos, y podrían estar en la misma
 * página — la nota del tablero y la de su herramienta son la MISMA nota,
 * que es justo lo que se quiere.
 *
 * Copiando la receta de `Notas.tsx` en el widget habría dos fuentes de
 * verdad en el mismo documento: dos lecturas al montar, dos esperas de
 * 250 ms y dos volcados a la misma clave. La última en escribir gana, y
 * lo escrito en la otra se pierde sin ruido.
 *
 * Con un valor único a nivel de módulo y `useSyncExternalStore`, los dos
 * reciben literalmente el mismo objeto y se enteran a la vez. Y la espera
 * y el `pagehide` se escriben una vez en vez de dos.
 *
 * ---------------------------------------------------------------------
 * La aritmética no se mueve
 *
 * `src/lib/notas.ts` sigue siendo puro y comprobable desde node — que es
 * lo que exige la casa para todo lo que calcula. Esto es solo la capa que
 * lo guarda y avisa a quien mira.
 */
import { useSyncExternalStore } from 'react';

import { CLAVE, VACIO, guardar, leer, type Cuaderno } from '../lib/notas';

/** Lo que se espera antes de guardar, en milisegundos. */
const ESPERA = 250;

let valor: Cuaderno = VACIO;
let leido = false;
/** Cierto si el navegador no deja guardar: ventana privada, cuota llena. */
let bloqueado = false;

const oyentes = new Set<() => void>();
let espera: ReturnType<typeof setTimeout> | null = null;

function avisar() {
  for (const oyente of oyentes) oyente();
}

function volcar() {
  espera = null;
  try {
    sessionStorage.setItem(CLAVE, guardar(valor));
  } catch {
    // Lo escrito sigue en pantalla; lo que se pierde es sobrevivir a una
    // recarga. Y eso hay que decirlo, porque la pantalla promete lo
    // contrario.
    bloqueado = true;
    avisar();
  }
}

/**
 * Lee lo guardado UNA vez, la primera que alguien se suscribe.
 *
 * No en el momento de importar el módulo: en el servidor no hay
 * `sessionStorage`, y leerlo durante el primer render dejaría el HTML del
 * servidor distinto del primer pintado del cliente.
 */
function asegurarLeido() {
  if (leido) return;
  leido = true;
  try {
    valor = leer(sessionStorage.getItem(CLAVE));
  } catch {
    // Almacenamiento bloqueado: se empieza en blanco y se sigue
    // trabajando.
  }
}

function suscribir(oyente: () => void): () => void {
  const primero = oyentes.size === 0;
  oyentes.add(oyente);

  if (primero) {
    asegurarLeido();
    // El volcado pendiente se fuerza antes de que la pestaña se vaya: sin
    // esto, la última frase escrita no llegaría a una recarga inmediata.
    window.addEventListener('pagehide', forzar);
    avisar();
  }

  return () => {
    oyentes.delete(oyente);
    if (oyentes.size === 0) window.removeEventListener('pagehide', forzar);
  };
}

function forzar() {
  if (espera === null) return;
  clearTimeout(espera);
  volcar();
}

/** Cambia el cuaderno y programa el guardado. */
export function cambiarCuaderno(siguiente: Cuaderno) {
  valor = siguiente;
  avisar();
  if (espera !== null) clearTimeout(espera);
  espera = setTimeout(volcar, ESPERA);
}

/**
 * El cuaderno de esta pestaña, y si el navegador deja guardarlo.
 *
 * La instantánea del servidor es el cuaderno vacío, igual que hace el
 * reloj compartido con su cero: es lo que permite que el HTML del
 * servidor y el primer pintado del cliente coincidan.
 */
export function useCuaderno(): { cuaderno: Cuaderno; bloqueado: boolean } {
  const cuaderno = useSyncExternalStore(
    suscribir,
    () => valor,
    () => VACIO
  );
  const sinGuardar = useSyncExternalStore(
    suscribir,
    () => bloqueado,
    () => false
  );
  return { cuaderno, bloqueado: sinGuardar };
}
