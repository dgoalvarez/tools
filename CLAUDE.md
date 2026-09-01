# tools.dgoalvarez.com

Herramientas gratuitas que calculan en el navegador. Astro con islas de
React, Tailwind 4, shadcn sobre Radix. Español e inglés, cada página con
su ruta propia en cada idioma.

**La promesa, que es el producto:** sin cuentas, sin cookies, sin base de
datos. Todo se calcula aquí y el estado vive en la dirección. Hay dos
excepciones y las dos son del aparato de quien mira, no de un servidor: el
tema y el riel en `localStorage`, y el pomodoro y la libreta de notas en
`sessionStorage`, que muere al cerrar la pestaña. Nada de eso viaja a
ningún sitio. Si añades una tercera, tiene que decirlo en su propia
pantalla.

---

## Cómo se verifica

Cuatro comandos, y cada uno caza lo que los otros no ven. Un `build` en
verde no dice nada sobre si algo se sale de su caja.

| | Qué demuestra |
| --- | --- |
| `npm run build` | Rutas sincronizadas entre `routes.ts` y `astro.config.mjs`, etiquetas completas, tipos, todas las páginas publicadas, cada ancla del paso a paso presente en el HTML, y la CSP al día |
| `npm run comprobar` | La aritmética: contraste, escala, rampas, notas, husos, pomodoro, reloj, encabezados |
| `npm run romper` | Que nada desborda su contenedor, a 1440, 869 y 485 px, con contenido hostil |
| `npm run navegar` | Que la navegación no da tirones ni recarga, y que lo guardado sobrevive al cambio de página |
| `npm run ver` | 43 capturas. No es una alarma: una captura no sabe si está bien, solo la enseña |

`npm run verificar` encadena las cuatro primeras.

**Medir gana a mirar, y mirar gana a razonar.** En este proyecto hay
fallos que solo salieron en capturas —dos rieles pintados a la vez, un
disco negro detrás de la esfera, la siembra rota que dejaba la libreta
vacía—, otros solo en sondas —el hexadecimal que no se podía escribir, las
duraciones que no se aplicaban— y otros solo midiendo: los botones que
suspendían la propia herramienta de contraste del sitio.

**Una comprobación nueva se prueba en los dos sentidos.** Se rompe a
propósito lo que vigila y se mira que salte. Una alarma que nunca ha
sonado no es una alarma.

---

## Reglas de la casa

- **Al acabar una tanda, se sube.** Sin preguntar: comprobar, capturas,
  commit y push, y esperar a verlo en producción.
- **Antes de construir algo desde cero, proponer opciones.** Librerías,
  enfoques, y una recomendación con su porqué.
- **Los mensajes de commit explican por qué**, no qué. Con los números
  medidos cuando los haya.
- **Usabilidad antes que estética**, siempre que choquen.
- **Los comentarios del código dicen por qué**, y sobre todo qué se
  descartó y a costa de qué. Están en español, como el código.

---

## Trampas que ya mordieron

- **Nada de heredocs para scripts de parcheo.** Se comen `\n`, `\s`, las
  comillas invertidas y las barras invertidas dentro de plantillas. Ha
  pasado media docena de veces. Para un script de parcheo, la herramienta
  Write; para un cambio pequeño, Edit.
- **Las utilidades de Tailwind ganan a `@layer components`.** Tres veces:
  el color de un botón, el relleno de un campo y un `w-full` de shadcn.
  Si una regla de componente no se aplica, es esto.
- **La especificidad manda sobre el orden.** `:root:not([attr]) .a .b`
  (0,4,0) gana a `.hoja .a .b` (0,3,0). Así heredó la hoja de móvil el
  estado plegado del riel.
- **Un `<dialog>` cerrado lo esconde el navegador con `display: none`.**
  Declarar `display: flex` en la regla base lo anula y el diálogo se
  pinta siempre.
- **Un selector inválido dentro de una lista invalida la regla entera.**
  No hay perdón salvo con `:is()` o `:where()`.
- **`min-height` no reserva sitio, solo pone un suelo.** Restaurar doce
  líneas en la libreta empujaba 184 px hacia abajo. Lo que no puede
  moverse lleva alto FIJO y desplazamiento dentro.
- **`--virtual-time-budget` de Chrome acelera los temporizadores pero no
  la red.** Cualquier espera escrita con `setTimeout` se cumple antes de
  que llegue nada. Las sondas que navegan corren con el reloj de verdad y
  avisan por la red.

---

## El sistema visual, que ya está decidido

- **Los colores salen de `design/*.ts`**, derivados en OKLCH y medidos con
  la propia herramienta de contraste del sitio. Nada entra si no pasa AA.
- **Cada materia tiene su acento** y dos herramientas comparten color solo
  si comparten materia. Una materia nueva necesita un tono nuevo, y hay
  que comprobar que no choque con `--danger`, que vive en el tono 30.
- **El relleno de un botón es `--solido`, nunca el acento.** Un acento se
  derivó para leerse como TEXTO; rellenar con él y poner tinta oscura
  encima suspende. Los números están en `global.css` y clavados en
  `comprobar-contraste.ts` §10.
- **Iconos de Phosphor**: los SVG sueltos con `?raw` en la navegación
  —que tiene que funcionar sin JavaScript— y los componentes de React
  dentro de las islas.
- **Nada de botones fantasma.** Sin borde, sobre una tarjeta, no se leen
  como pulsables hasta que pasa el puntero; en una pantalla táctil no pasa
  nunca. Contorno compacto.

---

## Dónde vive cada cosa

```
src/lib/*.ts        la aritmética, sin React ni DOM, comprobable con node
src/islands/*.tsx   las islas, con client:load y pintadas por el servidor
src/views/*.astro   la página de cada herramienta
src/i18n/           rutas, etiquetas, fichas, paso a paso y textos
scripts/check-*     alarmas que corren en la compilación
scripts/comprobar-* comprobaciones que se corren a mano o con npm
design/*.ts         de dónde salen los colores, y se puede volver a correr
```

Añadir una herramienta toca catorce archivos de registro. Para eso está
`/herramienta`.

---

## Lo que no se toca

- **`C:\portfolio` es de solo lectura.** Se mira todo lo que haga falta;
  no se escribe nada. Hay un guardia que lo impide.
- **`scripts/build-data.mjs` no se ejecuta salvo que Diego lo pida.**
  Descarga 780 MB de GeoNames y regenera datos versionados. Hay un
  guardia que pregunta.
- **`public/data/*.json` no se edita a mano.** Sale de ahí.
