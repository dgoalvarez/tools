/**
 * El botón «?» y el paso a paso que abre.
 *
 * Va sobre la herramienta de verdad: señala el control mientras lo
 * explica, en vez de describirlo en otro sitio y dejar que lo busques.
 *
 * Tres decisiones que no son de estilo:
 *
 *   · **Nunca arranca solo.** Nadie llega a una herramienta queriendo un
 *     tutorial antes de ver la herramienta. Arrancarlo solo también
 *     obligaría a recordar quién ya lo vio, y aquí no se guarda nada.
 *
 *   · **driver.js entra con `import()`.** Son unos 8 KB que solo paga
 *     quien pulsa el botón. Es el mismo trato que se le da al polyfill de
 *     Temporal en la herramienta de husos.
 *
 *   · **Los pasos que no encuentran su elemento no se caen.** Los que
 *     dependen del estado —el aviso de otro día, el color que sí pasa— se
 *     marcan `opcional` y se saltan si no están en pantalla. Enseñar un
 *     paso señalando al vacío sería peor que no enseñarlo.
 */
import { useState } from 'react';
import { QuestionMarkIcon } from '@phosphor-icons/react';

import { t, type Lang } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { TOUR } from '@/i18n/tour';
import type { ToolKey } from '@/i18n/routes';

interface Props {
  lang: Lang;
  tool: ToolKey;
}

export default function Tour({ lang, tool }: Props) {
  const [cargando, setCargando] = useState(false);

  async function abrir() {
    setCargando(true);
    try {
      const [{ driver }] = await Promise.all([
        import('driver.js'),
        // El CSS viaja aparte y lo empaqueta Vite, así que sale del propio
        // dominio y la política de seguridad no tiene nada que objetar.
        import('driver.js/dist/driver.css'),
      ]);

      const crudos = TOUR[tool].filter(
        (paso) => !paso.opcional || document.querySelector(`[data-tour="${paso.ancla}"]`)
      );

      const pasos = crudos.map((paso) => ({
        element: `[data-tour="${paso.ancla}"]`,
        popover: {
          title: t(paso.titulo, lang),
          description: t(paso.cuerpo, lang),
        },
      }));

      const saltar = t(UI.tourSaltar, lang);

      /*
       * Un paso puede vivir detrás de una pestaña —el cronómetro y el
       * temporizador del reloj— y entonces su control no existe todavía.
       *
       * Se pulsa la pestaña ANTES de avanzar y se le dan dos cuadros a
       * React para que pinte el panel. Hacerlo en el gancho del propio
       * paso llegaría tarde: driver.js resuelve el elemento antes de
       * llamarlo, así que señalaría al vacío.
       */
      const irA = (indice: number, mover: () => void) => {
        const selector = crudos[indice]?.abre;
        if (!selector) {
          mover();
          return;
        }
        document.querySelector<HTMLElement>(selector)?.click();
        requestAnimationFrame(() => requestAnimationFrame(mover));
      };

      const guia = driver({
        steps: pasos,
        showProgress: true,
        allowClose: true,
        // El paso a paso se anda con el teclado igual que con el ratón.
        showButtons: ['next', 'previous', 'close'],
        nextBtnText: t(UI.tourSiguiente, lang),
        prevBtnText: t(UI.tourAtras, lang),
        doneBtnText: t(UI.tourFin, lang),
        progressText: t(UI.tourProgreso, lang),
        // Lo que se señala tiene que caber en pantalla antes de señalarlo.
        smoothScroll: true,
        // La clase con la que el sitio se lo lleva a sus propios colores:
        // driver.js viene con un blanco fijo y una tipografía propia que
        // en modo oscuro cantarían muchísimo.
        popoverClass: 'tour-dgo',
        /*
          Dos cosas que driver.js no deja configurar y hay que hacer aquí.

          Una: el botón de cerrar solo admite una «×». Una aspa en la
          esquina no dice «puedes salirte de aquí» con la misma claridad
          que la palabra, y salirse tiene que ser evidente.

          Y dos: ese botón lo pinta como una caja ABSOLUTA de 32 px en la
          esquina del título, pensada para el aspa. Una palabra dentro de
          32 px se desborda por los dos lados, que es exactamente lo que
          pasaba: «Saltar» quedaba a caballo del borde de la tarjeta. Se
          mueve al pie, con «Atrás» y «Siguiente», que además es donde le
          toca: saltar es navegar, no cerrar una ventana.
        */
        onPopoverRender: (popover, opts) => {
          popover.closeButton.textContent = saltar;
          popover.closeButton.setAttribute('aria-label', saltar);

          // En el último paso, «Saltar» y «Listo» hacen exactamente lo
          // mismo. Dos botones para una sola acción es una duda que no
          // hacía falta plantear, así que ahí se queda solo «Listo».
          popover.closeButton.hidden = opts.state.activeIndex === pasos.length - 1;
          // Va al FINAL del pie, no al principio, aunque se vea el
          // primero de los tres botones: driver.js pone el foco en el
          // primer botón que encuentra, y con «Saltar» ahí, pulsar Enter
          // sin mirar se salía del paso a paso. Último en el DOM y
          // primero a la vista lo arregla el `order` del CSS, que cambia
          // lo que se ve sin tocar el orden de tabulación.
          popover.footer.append(popover.closeButton);
        },

        onNextClick: (_el, _paso, opts) => {
          irA(opts.state.activeIndex! + 1, () => guia.moveNext());
        },
        onPrevClick: (_el, _paso, opts) => {
          irA(opts.state.activeIndex! - 1, () => guia.movePrevious());
        },
      });

      guia.drive();
    } finally {
      setCargando(false);
    }
  }

  return (
    // Es la misma pastilla que la barra de navegación: así se lee como
    // parte del mismo sistema y no como un botón inventado en esta página.
    // En pantallas estrechas se queda solo el icono, pero el nombre
    // accesible no se pierde: sigue en el `aria-label`.
    <button
      type="button"
      onClick={abrir}
      disabled={cargando}
      title={t(UI.comoFunciona, lang)}
      aria-label={t(UI.comoFunciona, lang)}
      className="pastilla ayuda shrink-0 cursor-pointer disabled:opacity-50"
    >
      <QuestionMarkIcon aria-hidden="true" size={15} weight="bold" />
      <span className="solo-escritorio">{t(UI.tourAbrir, lang)}</span>
    </button>
  );
}
