/**
 * El conmutador de tema.
 *
 * El icono y la etiqueta NO se deciden en JavaScript, sino con la variante
 * `dark:` del CSS. Así el botón sale correcto en el primer pintado —
 * incluso antes de hidratarse, y también cuando el tema lo decide el
 * sistema y no hay ningún `data-theme` que leer.
 *
 * Vive dentro del riel, así que se pinta con sus mismas clases: un botón
 * de shadcn ahí dentro se vería como un injerto.
 */
import { MoonIcon, SunIcon } from '@phosphor-icons/react';

const KEY = 'dgo-tools-theme';

interface Props {
  /** «Cambiar a modo oscuro», en el idioma de la página. */
  toDark: string;
  /** «Cambiar a modo claro», en el idioma de la página. */
  toLight: string;
  /**
   * Con el nombre al lado del icono, como el resto del riel.
   *
   * En el riel es una fila más y necesita su etiqueta cuando está
   * desplegado; en la barra de la portada es una pastilla redonda y solo
   * lleva icono.
   */
  conNombre?: boolean;
}

export default function ThemeToggle({ toDark, toLight, conNombre = false }: Props) {
  function toggle() {
    const el = document.documentElement;
    const chosen = el.dataset.theme;
    // Si nadie ha elegido todavía, lo que hay en pantalla es lo que dice
    // el sistema: hay que preguntárselo para saber hacia dónde cambiar.
    const isDark = chosen
      ? chosen === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;

    const next = isDark ? 'light' : 'dark';
    el.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Navegación privada o almacenamiento bloqueado: el tema cambia
      // igual, solo que no se recuerda al recargar.
    }
  }

  if (conNombre) {
    return (
      <button type="button" onClick={toggle} className="riel-item cursor-pointer">
        <span className="icono">
          <MoonIcon aria-hidden="true" size={18} className="dark:hidden" />
          <SunIcon aria-hidden="true" size={18} className="hidden dark:block" />
        </span>
        {/* El nombre se ve con el riel desplegado y lo lee siempre un
            lector de pantalla, plegado o no. */}
        <span className="nombre dark:hidden">{toDark}</span>
        <span className="nombre hidden dark:inline">{toLight}</span>
      </button>
    );
  }

  return (
    <button type="button" onClick={toggle} className="pastilla cursor-pointer">
      <MoonIcon aria-hidden="true" size={17} className="dark:hidden" />
      <SunIcon aria-hidden="true" size={17} className="hidden dark:block" />

      {/* Dos etiquetas, y el CSS elige. En modo claro el botón lleva a
          oscuro, y al revés: decirlo bien importa porque es lo único que
          oye quien no ve el icono. */}
      <span className="sr-only dark:hidden">{toDark}</span>
      <span className="sr-only hidden dark:inline">{toLight}</span>
    </button>
  );
}
