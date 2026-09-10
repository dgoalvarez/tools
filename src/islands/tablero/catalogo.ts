/**
 * Qué componente pinta cada widget, cargado bajo demanda.
 *
 * Va aparte de `src/lib/widgets.ts` —donde están los nombres, los iconos
 * y las tallas— por dos razones, y las dos importan:
 *
 *   · **El selector no puede cargar los doce para enseñar un menú.**
 *     Necesita el nombre y el icono de cada uno, y esos viven en el
 *     módulo puro. Si los sacara de aquí, abrir la lista descargaría
 *     todas las herramientas del sitio.
 *
 *   · **Un tablero solo se descarga lo que tiene puesto.** Cada
 *     `import()` es un trozo propio de Vite: sin el dibujo no viaja
 *     `perfect-freehand` ni el selector de color; cuando llegue el
 *     contraste no viajará culori. La página más pesada del sitio son
 *     hoy 56 KB de React, y un tablero que arrastrara las doce
 *     herramientas sería varias veces eso para enseñar dos.
 *
 * Ya están las cuatro de productividad. Las de diseño —contraste, paleta
 * y escala— piden una versión compacta de cada una y llegan después.
 */
import type { ComponentType } from 'react';

import type { WidgetKey } from '../../lib/widgets';
import type { PropsWidget } from './tipos';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Cargador = () => Promise<{ default: ComponentType<PropsWidget<any>> }>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const COMPONENTE: Partial<Record<WidgetKey, Cargador>> = {
  // El orden es el que se ve en el panel de añadir: las dos de escribir
  // primero, porque son las que comparten cuaderno y se usan juntas.
  lista: () => import('./widgets/WidgetLista'),
  nota: () => import('./widgets/WidgetNota'),
  pomodoro: () => import('./widgets/WidgetPomodoro'),
  dibujo: () => import('./widgets/WidgetDibujo'),
  // Y las cuatro que salen del reloj. Van juntas al final porque son las
  // que se miran de reojo: la hora, la de otra ciudad y los dos que
  // cuentan.
  hora: () => import('./widgets/WidgetHora'),
  mundial: () => import('./widgets/WidgetMundial'),
  cronometro: () => import('./widgets/WidgetCronometro'),
  temporizador: () => import('./widgets/WidgetTemporizador'),
  // Y las tres de diseño, que son de mirar: el veredicto, la rampa y los
  // tamaños. La mesa de trabajo de cada una se queda en su página.
  contraste: () => import('./widgets/WidgetContraste'),
  paleta: () => import('./widgets/WidgetPaleta'),
  escala: () => import('./widgets/WidgetEscala'),
};

/** Los que ya se pueden poner. El selector solo ofrece estos. */
export const DISPONIBLES = Object.keys(COMPONENTE) as WidgetKey[];
