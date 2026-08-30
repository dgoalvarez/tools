/* ============================================================
   Estilos globales · tools.dgoalvarez.com

   Orden del archivo:
     1. Importaciones de Tailwind y shadcn
     2. Switzer, autoalojada
     3. El puente entre los tokens de Diego y los que espera shadcn
     4. Los valores de cada tema
     5. Base

   La identidad viene del portafolio (misma Switzer, mismo verde),
   pero la densidad no: esto son herramientas de trabajo, con tablas y
   controles, no un portafolio con titulares de 8rem.
   ============================================================ */

@import 'tailwindcss';
@import 'tw-animate-css';
@import 'shadcn/tailwind.css';

/* ---------- Tipografía ----------
   Switzer autoalojada (ver public/fonts/LEEME.md). Solo los tres pesos
   que el sitio usa. `swap` muestra el texto con la fuente del sistema
   mientras llega la real, en vez de dejar un hueco en blanco. */

@font-face {
  font-family: 'Switzer';
  src: url('/fonts/switzer-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Switzer';
  src: url('/fonts/switzer-500.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Switzer';
  src: url('/fonts/switzer-600.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

/* ---------- El tema oscuro ----------
   Dos formas de estar en oscuro, y las dos tienen que valer:

     · `data-theme="dark"` en <html>  — alguien lo eligió a mano
     · el sistema lo pide y nadie eligió lo contrario

   La segunda es la que hace que el sitio se vea bien sin JavaScript.
   Casi todo el color sale de variables, así que la variante `dark:` se
   usa poco; pero cuando se use, tiene que cubrir los dos casos. */

@custom-variant dark {
  &:where([data-theme='dark'], [data-theme='dark'] *) {
    @slot;
  }
  @media (prefers-color-scheme: dark) {
    &:where(:root:not([data-theme='light']), :root:not([data-theme='light']) *) {
      @slot;
    }
  }
}

/* ---------- Puente hacia shadcn ----------
   Los componentes de shadcn leen --background, --primary, --border…
   Aquí se declaran en función de los tokens de Diego, para que hereden
   la identidad del sitio en vez de traer la gris de fábrica.

   Ojo con dos nombres que chocan: en el portafolio `--accent` es el
   verde de marca y `--muted` es un color de texto; en shadcn los dos
   son fondos. Por eso aquí el verde se llama `--brand` y el texto
   secundario `--ink-muted`. */

@theme inline {
  --font-sans: Switzer, system-ui, sans-serif;
  --font-heading: var(--font-sans);
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  --color-background: var(--bg);
  --color-foreground: var(--ink);
  --color-card: var(--surface);
  --color-card-foreground: var(--ink);
  --color-popover: var(--surface);
  --color-popover-foreground: var(--ink);
  --color-primary: var(--brand);
  --color-primary-foreground: var(--brand-ink);
  --color-secondary: var(--surface-2);
  --color-secondary-foreground: var(--ink);
  --color-muted: var(--surface-2);
  --color-muted-foreground: var(--ink-soft);
  --color-accent: var(--surface-2);
  --color-accent-foreground: var(--ink);
  --color-destructive: var(--danger);
  --color-border: var(--line);
  --color-input: var(--line);
  --color-ring: var(--brand);

  /* Los propios, para el CSS escrito a mano. */
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-ink-soft: var(--ink-soft);
  --color-brand: var(--brand);
  --color-line: var(--line);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);

  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

/* ---------- Los valores ----------
   Los colores se escriben una sola vez, con prefijo `--l-` (claro) y
   `--d-` (oscuro). Debajo hay dos bloques que solo eligen cuál de los
   dos juegos está activo. Así no hay dos listas que se puedan
   desincronizar.

   El anclaje no es una elección estética: tres de estos valores están
   MEDIDOS del `public/og.png` que hizo Diego —el fondo #10191b, la línea
   #262c2d y el teal #31c5bc— para que la imagen que se comparte y el
   sitio al que lleva sean el mismo color. Todo lo demás se deriva de ahí
   en OKLCH y pasa AA sobre las tres superficies; la derivación está en
   `design/paleta-final.ts` y se puede volver a correr.

   Los tres acentos por materia son de la dirección elegida: cada
   herramienta se pinta con el suyo. El de tipografía es el teal de la
   marca, así que también hace de acento del sitio. */

:root {
  --l-bg: #f3f6f7;
  --l-surface: #ffffff;
  --l-surface-2: #e9edee;
  --l-ink: #101819;
  --l-ink-muted: #494f51;
  --l-ink-soft: #666c6e;
  --l-line: #dadfe0;
  --l-brand: #007872;
  --l-brand-ink: #ffffff;
  --l-danger: #a4271c;
  --l-tiempo: #946000;
  --l-color: #884fc4;
  --l-tipografia: #007872;

  --d-bg: #10191b;
  --d-surface: #182123;
  --d-surface-2: #1e282a;
  --d-ink: #eef2f2;
  --d-ink-muted: #b3b9b9;
  --d-ink-soft: #8e9393;
  --d-line: #262c2d;
  --d-brand: #31c5bc;
  --d-brand-ink: #10191b;
  --d-danger: #ff8a7a;
  --d-tiempo: #e8a33d;
  --d-color: #b47cf5;
  --d-tipografia: #31c5bc;

  /* Radio más corto que el de fábrica (0.625rem): controles de
     herramienta, no tarjetas de portafolio. */
  --radius: 0.5rem;

  /* Escala tipográfica propia. La del portafolio llega a 8.2rem en el
     titular; aquí el titular más grande es 2.75rem, porque debajo hay
     tablas que leer y no una portada que impresionar. */
  --fs-title: clamp(1.85rem, 3.2vw, 2.75rem);
  --fs-h2: clamp(1.2rem, 1.6vw, 1.5rem);
  --fs-h3: clamp(1.02rem, 1.2vw, 1.15rem);
  --fs-body: clamp(0.95rem, 0.9vw, 1rem);
  --fs-small: 0.8125rem;

  --pad-x: clamp(20px, 4vw, 56px);
  --pad-y: clamp(28px, 3.5vw, 56px);
  --measure: 68ch;

  /* Tema claro por defecto. `color-scheme` va con cada tema, no fijo en
     <html>: es lo que decide de qué color pinta el navegador las barras
     de desplazamiento y los campos nativos. */
  color-scheme: light;
  --bg: var(--l-bg);
  --surface: var(--l-surface);
  --surface-2: var(--l-surface-2);
  --ink: var(--l-ink);
  --ink-muted: var(--l-ink-muted);
  --ink-soft: var(--l-ink-soft);
  --line: var(--l-line);
  --brand: var(--l-brand);
  --brand-ink: var(--l-brand-ink);
  --danger: var(--l-danger);
  --acento-tiempo: var(--l-tiempo);
  --acento-color: var(--l-color);
  --acento-tipografia: var(--l-tipografia);
}

/* Sin elección explícita, manda el sistema. Esto es lo que hace que el
   sitio se vea bien aunque el JavaScript no llegue a ejecutarse. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    color-scheme: dark;
    --bg: var(--d-bg);
    --surface: var(--d-surface);
    --surface-2: var(--d-surface-2);
    --ink: var(--d-ink);
    --ink-muted: var(--d-ink-muted);
    --ink-soft: var(--d-ink-soft);
    --line: var(--d-line);
    --brand: var(--d-brand);
    --brand-ink: var(--d-brand-ink);
    --danger: var(--d-danger);
    --acento-tiempo: var(--d-tiempo);
    --acento-color: var(--d-color);
    --acento-tipografia: var(--d-tipografia);
  }
}

/* Y si alguien eligió, manda su elección. */
[data-theme='dark'] {
  color-scheme: dark;
  --bg: var(--d-bg);
  --surface: var(--d-surface);
  --surface-2: var(--d-surface-2);
  --ink: var(--d-ink);
  --ink-muted: var(--d-ink-muted);
  --ink-soft: var(--d-ink-soft);
  --line: var(--d-line);
  --brand: var(--d-brand);
  --brand-ink: var(--d-brand-ink);
  --danger: var(--d-danger);
  --acento-tiempo: var(--d-tiempo);
  --acento-color: var(--d-color);
  --acento-tipografia: var(--d-tipografia);
}

/* ---------- Base ---------- */

@layer base {
  * {
    @apply border-border;
  }

  html {
    @apply font-sans;
    -webkit-text-size-adjust: 100%;
    /* El fondo también en <html>: evita franjas del color equivocado
       al hacer overscroll en móvil. */
    background: var(--bg);
  }

  body {
    @apply bg-background text-foreground;
    font-size: var(--fs-body);
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }

  /* El foco tiene que verse siempre: estas herramientas se manejan con
     teclado tanto como con ratón. */
  :focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
    border-radius: 2px;
  }

  ::selection {
    background: var(--brand);
    color: var(--brand-ink);
  }
}

/* ============================================================
   El riel de navegación

   Es una franja de iconos pegada a la izquierda que se ensancha al pasar
   por encima, al recibir el foco con el teclado, o cuando alguien la deja
   fijada. Tres reglas de fondo:

   1. Al ensancharse se pone POR ENCIMA del contenido, no lo empuja. Si
      empujara, toda la página bailaría cada vez que el ratón pasa cerca.
   2. Los nombres de las herramientas están siempre en el HTML; plegado
      solo los recorta el `overflow`. Quien usa un lector de pantalla no
      puede «pasar por encima» de nada, así que los nombres tienen que
      estar ahí siempre.
   3. `:focus-within` lo abre. Sin eso, navegar con el tabulador sería ir a
      ciegas por una columna de iconos.
   ============================================================ */

:root {
  --riel-plegado: 3.5rem;
  --riel-abierto: 14.5rem;
  --riel-movil: 4rem;
}

@layer components {
  .riel {
    position: fixed;
    inset-block: 0;
    inset-inline-start: 0;
    z-index: 40;

    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    width: var(--riel-plegado);
    padding: 0.75rem 0.5rem;
    overflow: hidden;

    background: var(--surface);
    border-inline-end: 1px solid var(--line);

    transition: width 160ms ease;
  }

  .riel:hover,
  .riel:focus-within,
  html[data-riel='fijo'] .riel {
    width: var(--riel-abierto);
    box-shadow: 0 0 0 1px var(--line);
  }

  /* Quien prefiere que nada se mueva, que no se mueva. */
  @media (prefers-reduced-motion: reduce) {
    .riel {
      transition: none;
    }
  }

  /* El texto que solo se ve con el riel abierto. No se oculta con
     `display` ni con `visibility`: se recorta, y así sigue existiendo
     para los lectores de pantalla y para el buscador del navegador. */
  .riel-texto {
    white-space: nowrap;
    overflow: hidden;
  }

  .riel-fila {
    display: flex;
    align-items: center;
    gap: 0.625rem;

    /* El alto de un objetivo táctil cómodo, también en escritorio. */
    min-height: 2.5rem;
    padding-inline: 0.625rem;
    border-radius: var(--radius);

    color: var(--ink-muted);
    font-size: var(--fs-small);
    text-decoration: none;
    white-space: nowrap;
  }

  .riel-fila > svg {
    flex: none;
  }

  .riel-fila:hover {
    background: var(--surface-2);
    color: var(--ink);
  }

  .riel-fila[aria-current='page'] {
    background: color-mix(in srgb, var(--brand) 12%, transparent);
    color: var(--brand);
    font-weight: 500;
  }

  .riel-marca {
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
    letter-spacing: -0.01em;
  }

  .riel-grupo {
    margin-block-start: 0.75rem;
    padding-inline: 0.625rem;

    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .riel-pie {
    margin-block-start: auto;
    padding-block-start: 0.5rem;
    border-block-start: 1px solid var(--line);
  }

  /* El contenido deja sitio al riel plegado; cuando está fijado, al
     abierto. Es la única vez que el riel mueve la página, y solo porque
     alguien lo ha pedido a propósito. */
  .contenido {
    padding-inline-start: var(--riel-plegado);
    transition: padding-inline-start 160ms ease;
  }

  html[data-riel='fijo'] .contenido {
    padding-inline-start: var(--riel-abierto);
  }

  /* ---------- En móvil, una barra abajo ----------
     Donde no hay ratón, «pasar por encima» no existe. Y el pulgar llega
     antes abajo que arriba. */
  @media (width < 48rem) {
    .riel {
      inset-block: auto 0;
      inset-inline: 0;
      width: auto;
      height: var(--riel-movil);

      flex-direction: row;
      justify-content: space-around;
      gap: 0;
      padding: 0.25rem 0.5rem;

      border-inline-end: 0;
      border-block-start: 1px solid var(--line);
    }

    .riel:hover,
    .riel:focus-within,
    html[data-riel='fijo'] .riel {
      width: auto;
      box-shadow: none;
    }

    .riel-fila {
      flex-direction: column;
      gap: 0.125rem;
      min-height: 0;
      padding-inline: 0.5rem;
      font-size: 0.65rem;
    }

    /* La marca, los grupos y el botón de fijar no pintan nada en una
       barra de cinco iconos. */
    .riel-marca,
    .riel-grupo,
    .riel-solo-escritorio {
      display: none;
    }

    .contenido,
    html[data-riel='fijo'] .contenido {
      padding-inline-start: 0;
      padding-block-end: calc(var(--riel-movil) + 0.5rem);
    }
  }

  /* ---------- El lanzador ---------- */
  .bento::backdrop {
    background: color-mix(in srgb, var(--bg) 70%, transparent);
    backdrop-filter: blur(3px);
  }

  .bento {
    margin: auto;
    width: min(56rem, calc(100vw - 2rem));
    padding: 0;
    border: 1px solid var(--line);
    border-radius: var(--radius-xl);
    background: var(--surface);
    color: var(--ink);
  }

  .bento[open] {
    animation: bento-entra 160ms ease;
  }

  @keyframes bento-entra {
    from {
      opacity: 0;
      transform: translateY(0.5rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bento[open] {
      animation: none;
    }
  }
}

/* ============================================================
   Las barras del selector de color

   Son `<input type="range">` de verdad, no un componente. Un range nativo
   ya se mueve con las flechas del teclado, ya se anuncia con su valor y su
   rango, y ya funciona con lectores de pantalla sin escribir una línea de
   ARIA. Reimplementarlo con divs habría costado más y funcionado peor.

   El degradado no va en el CSS: se calcula en vivo y llega como estilo en
   línea, porque depende del color que haya en ese momento. Aquí solo está
   la forma.
   ============================================================ */

@layer components {
  .barra-color {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    height: 1.5rem;
    background: transparent;
    cursor: pointer;
  }

  /* El carril hereda el degradado que el componente pone en el propio
     input; así el color vive en un solo sitio. */
  .barra-color::-webkit-slider-runnable-track {
    height: 1.25rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: inherit;
  }

  .barra-color::-moz-range-track {
    height: 1.25rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: inherit;
  }

  /* El tirador lleva un borde oscuro y un halo del color de fondo para que
     se vea igual sobre la parte clara y sobre la oscura del degradado. */
  .barra-color::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 1rem;
    height: 1rem;
    margin-top: 0.125rem;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--bg);
    box-shadow: 0 0 0 1px var(--bg);
  }

  .barra-color::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--bg);
    box-shadow: 0 0 0 1px var(--bg);
  }

  .barra-color:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 3px;
    border-radius: 999px;
  }

  /* ---------- El conmutador de espacio ----------
     Son radios de verdad. Las flechas del teclado ya recorren un grupo de
     radios sin ayuda, que es justo el comportamiento que pide la norma
     para un conmutador de pestañas. */
  .segmento {
    display: inline-flex;
    padding: 0.1875rem;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface-2);
  }

  .segmento label {
    padding: 0.25rem 0.625rem;
    border-radius: calc(var(--radius) * 0.7);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--ink-soft);
    cursor: pointer;
    white-space: nowrap;
  }

  .segmento label:hover {
    color: var(--ink);
  }

  .segmento input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .segmento input:checked + span {
    color: var(--ink);
  }

  .segmento label:has(input:checked) {
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
  }

  .segmento label:has(input:focus-visible) {
    outline: 2px solid var(--brand);
    outline-offset: 1px;
  }
}
