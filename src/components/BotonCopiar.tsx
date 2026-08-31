/**
 * Copiar al portapapeles, con su palomita.
 *
 * Salió de las islas cuando hizo falta por tercera vez. Estaba copiado en
 * la escala tipográfica y en husos horarios, y dos copias son una
 * casualidad — tres son un componente que faltaba.
 *
 * Dos decisiones que llevaban repitiéndose sin estar escritas:
 *
 *   · **Si el portapapeles falla, no pasa nada.** No hay mensaje de
 *     error. El bloque de texto está a la vista y se puede seleccionar a
 *     mano, que es exactamente lo que hará quien no tenga permiso de
 *     portapapeles. Un aviso rojo ahí sería ruido sobre algo que se
 *     resuelve solo.
 *
 *   · **La palomita se va sola a los dos segundos.** Antes se quedaba
 *     hasta que cambiara algún ajuste, lo que dejaba un «Copiado» eterno
 *     en una página que nadie estaba tocando.
 */
import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';

interface Props {
  /** Lo que se copia. Se lee en el momento de pulsar, no antes. */
  texto: string | (() => string);
  etiqueta: string;
  etiquetaCopiado: string;
  /** Para los botones que van dentro de un `<summary>`. */
  onAntes?: (evento: React.MouseEvent) => void;
  className?: string;
}

export default function BotonCopiar({
  texto,
  etiqueta,
  etiquetaCopiado,
  onAntes,
  className,
}: Props) {
  const [copiado, setCopiado] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    []
  );

  async function copiar(evento: React.MouseEvent) {
    onAntes?.(evento);
    try {
      await navigator.clipboard.writeText(typeof texto === 'function' ? texto() : texto);
      setCopiado(true);
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin portapapeles el texto sigue a la vista para seleccionarlo.
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={copiar} className={className}>
      {copiado ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
      {copiado ? etiquetaCopiado : etiqueta}
    </Button>
  );
}
