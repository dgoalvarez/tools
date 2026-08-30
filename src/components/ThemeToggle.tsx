/**
 * El conmutador de tema: la única isla de React del sitio por ahora.
 *
 * No es una demostración. Es el control real, y de paso es lo que prueba
 * en producción que React hidrata, que shadcn hereda los tokens del sitio
 * y que la política de seguridad no bloquea nada.
 *
 * El icono y la etiqueta NO se deciden en JavaScript, sino con la variante
 * `dark:` del CSS. Así el botón sale correcto en el primer pintado —
 * incluso antes de hidratarse, y también cuando el tema lo decide el
 * sistema y no hay ningún `data-theme` que leer.
 */
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

const KEY = 'dgo-tools-theme';

interface Props {
  /** «Cambiar a modo oscuro», en el idioma de la página. */
  toDark: string;
  /** «Cambiar a modo claro», en el idioma de la página. */
  toLight: string;
}

export default function ThemeToggle({ toDark, toLight }: Props) {
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
    } catch (e) {
      // Navegación privada o almacenamiento bloqueado: el tema cambia
      // igual, solo que no se recuerda al recargar.
    }
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={toggle} className="text-ink-muted">
      <Moon aria-hidden="true" className="dark:hidden" />
      <Sun aria-hidden="true" className="hidden dark:block" />
      <span className="sr-only dark:hidden">
        {toDark}
      </span>
      <span className="sr-only hidden dark:inline">{toLight}</span>
    </Button>
  );
}
