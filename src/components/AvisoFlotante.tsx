/**
 * Un aviso que aparece abajo, dice algo y se va solo.
 *
 * Existe por la cuadrícula de la paleta: pulsar un color lo copia, y sin
 * nada que lo confirme la acción es invisible — el color sigue igual, el
 * cursor sigue igual, y quien lo pulsa no sabe si funcionó. La palomita
 * dentro de la casilla ayuda, pero es de doce píxeles y está debajo del
 * dedo justo cuando hay que verla.
 *
 * Se escribió a mano en vez de traer una librería de avisos: son treinta
 * líneas, y una librería habría traído además su tema, sus animaciones y
 * su forma de posicionarse, que luego hay que pelear para que se parezcan
 * a este sitio.
 *
 * Lo que sí hace falta hacer bien:
 *
 *   · `role="status"` con `aria-live="polite"` — quien no ve la pantalla
 *     también tiene que enterarse de que se copió, y «polite» para que no
 *     interrumpa lo que se estuviera leyendo.
 *   · `pointer-events: none` — flota sobre la página y no puede tapar
 *     nada que se quiera pulsar.
 *   · Sale de la nada y se va solo; no hay botón de cerrar. Un aviso que
 *     hay que cerrar es una tarea más, no una confirmación.
 */
import { useEffect, useState } from 'react';

interface Props {
  /**
   * Lo que se anuncia. Cambiar este valor reinicia la cuenta, así que
   * copiar dos colores seguidos enseña el segundo y no deja el primero
   * colgado.
   */
  mensaje: string | null;
  /** Milisegundos que se queda. */
  duracion?: number;
}

export default function AvisoFlotante({ mensaje, duracion = 1800 }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!mensaje) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), duracion);
    return () => clearTimeout(t);
  }, [mensaje, duracion]);

  return (
    <div className="aviso-flotante" role="status" aria-live="polite">
      {visible && mensaje ? <span className="cuerpo">{mensaje}</span> : null}
    </div>
  );
}
