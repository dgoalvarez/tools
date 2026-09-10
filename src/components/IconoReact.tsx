/**
 * Los iconos de Phosphor dentro de una isla de React.
 *
 * `Icono.astro` no sirve aquí: un componente de Astro no se puede usar
 * desde React. Y traer el paquete de React de Phosphor solo para el menú
 * del tablero tampoco, porque los SVG sueltos que usa la navegación ya
 * están en el paquete: son cadenas, y en React una cadena de SVG se pinta
 * igual de bien.
 *
 * `dangerouslySetInnerHTML` con contenido que sale de `@phosphor-icons/core`
 * en la compilación. No hay nada de fuera aquí — a diferencia de la nota,
 * donde lo que se pinta puede venir de un pegado y por eso pasa por el
 * saneador.
 */
import { ICONOS, VIEWBOX, type IconoKey } from './iconos';

interface Props {
  nombre: IconoKey;
  tamano?: number;
  /** Se anuncia solo si lleva rótulo; si no, es decoración. */
  rotulo?: string;
}

export default function IconoReact({ nombre, tamano = 20, rotulo }: Props) {
  return (
    <svg
      viewBox={VIEWBOX}
      width={tamano}
      height={tamano}
      fill="currentColor"
      role={rotulo ? 'img' : undefined}
      aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONOS[nombre] }}
    />
  );
}
