'use client';

/**
 * Un panel que entra por un borde de la pantalla.
 *
 * Nace para elegir qué se añade al tablero. El menú flotante que había
 * antes servía cuando eran dos herramientas y solo había que leer dos
 * nombres; en cuanto hay que ENSEÑAR cada una antes de ponerla, un
 * desplegable de doscientos píxeles se queda corto.
 *
 * Radix Dialog y no un `<dialog>` a mano: atrapa el foco dentro, lo
 * devuelve al botón al cerrar, cierra con Escape y con un clic fuera, y
 * marca el resto de la página como inerte para los lectores. Todo eso ya
 * estaba escrito y probado en el mismo paquete que ya usa el popover, así
 * que no hay dependencia nueva.
 *
 * Entra por la DERECHA en pantalla ancha y por ABAJO en estrecha, y sale
 * por donde entró. Lo segundo no es un capricho de tamaño: en un teléfono
 * el borde de abajo es el que alcanza el pulgar, y un panel que se cierra
 * hacia un lado distinto del que vino se lee como otro panel.
 */
import * as React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function Sheet({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn('titulo-hoja-lateral', className)}
      {...props}
    />
  );
}

/**
 * `SheetDescription` existe aunque casi nunca se pinte a la vista.
 *
 * Radix avisa por consola si un diálogo no tiene descripción, y la salida
 * limpia es decir `aria-describedby={undefined}` cuando de verdad no hace
 * falta. Se deja aquí para cuando sí.
 */
function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn('texto-hoja-lateral', className)}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay data-slot="sheet-overlay" className="velo-hoja-lateral" />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn('hoja-lateral', className)}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription };
