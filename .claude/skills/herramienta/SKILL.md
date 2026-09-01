---
name: herramienta
description: Da de alta una herramienta nueva en tools.dgoalvarez.com - las catorce cosas que hay que registrar para que aparezca en el riel, tenga su color, su paso a paso y sus dos idiomas. Úsalo al empezar una herramienta nueva.
---

# Dar de alta una herramienta

Añadir una herramienta no es escribir una isla: es registrarla en catorce
sitios. Ninguno es difícil y todos son fáciles de olvidar, y cuando se
olvida uno el fallo es silencioso — la herramienta desaparece del riel,
o sale sin color, o su paso a paso señala al vacío.

**Pregunta primero lo que falte**: cómo se llama en los dos idiomas, qué
hace en una línea, de qué materia es y qué tarea hace.

## El orden, que importa

**1 · Las rutas, en los dos archivos.** `src/i18n/routes.ts` (`PageKey`,
`ROUTES`, `TOOL_KEYS`) y `astro.config.mjs` (`PAIRS`). Si divergen,
`check-routes.mjs` tumba la compilación. En `TOOL_KEYS` el orden es el
del riel dentro de su grupo.

**2 · Las etiquetas.** `src/i18n/labels.ts`: ámbito, materia y tarea. Si
la materia es nueva, necesita acento propio — usa `/acento` antes de
seguir. Si el ámbito es nuevo, tiene que entrar además en
`ORDEN_AMBITOS` o su grupo no se pinta y la herramienta desaparece del
riel sin que nadie borre nada. Lo vigila `check-etiquetas.mjs`.

**3 · El icono.** `src/components/iconos.ts`, desde
`@phosphor-icons/core` con `?raw`. Tiene que distinguirse de los demás
**a 19 px**, que es como se ve en el riel plegado: ahí no hay nombre.

**4 · La ficha.** `src/i18n/tools.ts`: nombre, `summary` de una línea,
`description` de dos o tres, `listo`, etiquetas e icono. El `summary`
describe el error que evita o el momento en que se usa, no la mecánica.

**5 · Los textos.** `src/i18n/<nombre>.ts`, como `paleta.ts` o
`notas.ts`.

**6 · La aritmética.** `src/lib/<nombre>.ts`: puro, sin React ni DOM, que
se pueda correr con `node`. Aquí va todo lo que se puede equivocar.

**7 · La isla.** `src/islands/<Nombre>.tsx`, con `client:load`.

**8 · La vista y las páginas.** `src/views/<Nombre>.astro` —copiada de
`views/Paleta.astro`, con su `<noscript>`— y `src/pages/es/…` y
`src/pages/en/…`, que son cinco líneas cada una.

**9 · El paso a paso.** `src/i18n/tour.ts`. **Es obligatorio**: el tipo es
`Record<ToolKey, PasoTour[]>` y sin sus pasos no compila. Cada paso
apunta a un `data-tour` que tiene que existir en el HTML publicado, o
`check-tour.mjs` tumba la compilación. Lo que solo aparece en algunos
estados va con `opcional: true`.

**10 · El CSS.** En `src/styles/global.css`, dentro de `@layer
components`. Recuerda que las utilidades de Tailwind ganan a esa capa.

**11 · La comprobación.** `scripts/comprobar-<nombre>.ts`, encadenada en
el script `comprobar` de `package.json`. Demuestra lo que a mano nadie
prueba, y lo que venga de fuera —una dirección manipulada, un
almacenamiento con basura— se valida en vez de creerse.

**12 · Las capturas.** Una vista en `scripts/ver.mjs`: vacía, llena, en
claro y estrecha.

**13 · Los casos hostiles.** En `scripts/comprobar-roturas.mjs`: nombres
larguísimos, muchas filas, una línea sin espacios.

**14 · El tirón.** Si la herramienta se rellena al hidratarse —porque lee
el almacenamiento de la pestaña o el reloj—, un caso en
`scripts/comprobar-navegacion.mjs` que lo siembre y mida.

## Al terminar

`npm run verificar` y después `/tanda`.
