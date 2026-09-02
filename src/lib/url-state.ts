/**
 * El estado de cada herramienta vive en la dirección, no en el navegador.
 *
 * Compartir un cálculo es pegar un enlace. Cero almacenamiento, cero
 * cookies, y de paso el botón «atrás» funciona solo, sin escribir nada.
 *
 * Se usa `replaceState` y no `pushState`: mientras alguien arrastra un
 * selector de color se disparan decenas de cambios, y cada uno sería una
 * entrada en el historial. Con `replaceState` la dirección sigue siendo
 * copiable en todo momento, pero «atrás» devuelve a la página anterior, que
 * es lo que la gente espera.
 */

/** Los parámetros de la dirección actual. Vacío si aún no hay ventana. */
export function leerParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

/**
 * Escribe los parámetros en la dirección. Un valor null o vacío borra el
 * suyo, para que la URL no acumule basura ni repita lo que ya es el valor
 * por defecto.
 */
export function escribirParams(valores: Record<string, string | null | undefined>): void {
  if (typeof window === 'undefined') return;

  const params = leerParams();
  for (const [clave, valor] of Object.entries(valores)) {
    if (valor === null || valor === undefined || valor === '') params.delete(clave);
    else params.set(clave, valor);
  }

  const consulta = params.toString();
  const destino = consulta ? `${window.location.pathname}?${consulta}` : window.location.pathname;

  window.history.replaceState(null, '', destino);
}
