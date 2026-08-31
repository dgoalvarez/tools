'use client';

/**
 * Un panel flotante anclado a lo que lo abre.
 *
 * Se añadió para el selector de color de la herramienta de paletas: con
 * seis tonalidades, desplegar los controles de una debajo de su fila
 * empujaba las otras cinco hacia abajo, y elegir un color acababa
 * moviendo de sitio lo que estabas mirando. Flotando, la cuadrícula se
 * queda donde está.
 *
 * Radix se encarga de lo que cuesta caro hacer bien: el foco vuelve al
 * botón al cerrar, Escape cierra, un clic fuera cierra, y el panel se
 * coloca solo cuando no cabe donde debería.
 */
import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = 'start',
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-4 shadow-lg outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
