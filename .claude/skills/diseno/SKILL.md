---
name: diseno
description: Cómo se diseña una pantalla en tools.dgoalvarez.com - el sistema que ya existe, lo que se reutiliza, qué se decide y qué no, y las trampas de maquetación que ya mordieron. Úsalo al montar una herramienta nueva o al rehacer una pantalla.
---

# Diseñar dentro del sistema

**Aviso, porque importa:** hay una skill de usuario, `frontend-design`,
que sirve para inventar una identidad visual desde cero y pide «tomar un
riesgo estético». Para este proyecto eso está **mal**. Aquí la identidad
ya está decidida, medida y comprobada; una herramienta que se salga del
sistema no se lee como una decisión, se lee como un fallo.

Lo que se diseña aquí no es un aspecto. Es **cómo se reparte la
información** para que la respuesta se lea de un vistazo.

## La regla que gana a las demás

**Usabilidad antes que estética.** Cuando choquen, gana la usabilidad, y
la decisión se explica en un comentario con lo que se descartó.

Ejemplos que ya pasaron: los botones fantasma se cambiaron por contorno
compacto porque sin borde no se leen como pulsables hasta que pasa el
puntero, y en una pantalla táctil no pasa nunca. La lista de horas dejó
de ser una tarjeta por ciudad y pasó a ser una fila por ciudad, porque
comparar dos horas es mirar hacia abajo por la misma columna, no recordar
una mientras se busca la otra.

## Lo que NO se decide

- **El color.** Sale de `--acento` y `--solido` de la materia. Se
  declaran una vez en el elemento raíz de la página y todo lo hereda. Una
  materia nueva se deriva con `/acento`; nunca se elige un color a ojo.
- **La tipografía.** Switzer, con la escala de `--fs-*`. El titular más
  grande del sitio son 2,75 rem: debajo hay tablas que leer, no una
  portada que impresionar.
- **Las superficies.** `--bg`, `--surface`, `--surface-2`, `--line`,
  `--ink`, `--ink-muted`, `--ink-soft`. Tres fondos y tres tintas, y
  todas las combinaciones que se usan pasan AA.
- **El radio.** `--radius` y sus variantes. Más corto que el de fábrica a
  propósito: son controles de herramienta.

## Lo que se reutiliza tal cual

`.tarjeta-control` para un grupo de mandos · `.tarjeta-modo` para una
tarjeta de la fila del reloj · `.acordeon` para lo que no todo el mundo
necesita leer · `.segmento` para elegir entre dos o tres · `.mandos` para
una fila de botones · `.filas-ajuste` para etiqueta y control · el
`Button` de shadcn con `variant="outline"` y `size="sm"` para lo
secundario · `BotonCopiar` para copiar · `AvisoFlotante` cuando la acción
no se ve.

**CSS nuevo, el mínimo**, y siempre dentro de `@layer components`.

## La forma de una herramienta

Casi todas son lo mismo: **mandos a la izquierda, respuesta a la
derecha**, en `lg:grid-cols-[minmax(0,var(--col-controles))_minmax(0,1fr)]`
con `lg:items-start`. En estrecho se apilan y los mandos van primero.

Cuando las dos mitades pesan igual —la libreta, el reloj mundial— van dos
columnas iguales, y en estrecho manda la que se usa.

## Cuatro trampas que ya mordieron

- **Las utilidades de Tailwind ganan a `@layer components`.** Si una
  regla de componente no se aplica, es esto. Pasó con el color de un
  botón, el relleno de un campo y un `w-full` de shadcn.
- **Un elemento de rejilla nace con `min-width: auto`** y no encoge por
  debajo de su contenido. Un nombre largo revienta la tarjeta entera. La
  cura es `min-width: 0`, que ya está puesto en `.tarjeta-control > *`.
  Y una pista sin mínimo nunca desborda, así que su `overflow-x: auto` no
  se dispara jamás.
- **`min-height` no reserva sitio, solo pone un suelo.** Lo que se
  rellena al hidratarse —porque lee el almacenamiento de la pestaña o el
  reloj— necesita alto FIJO y desplazamiento dentro, o empuja hacia abajo
  todo lo que tenga debajo en cada carga.
- **Lo que crece sin límite se desplaza dentro de su caja.** Cuarenta
  vueltas de cronómetro o cuarenta líneas de lista no pueden convertir la
  página en un rollo de tres pantallas.

## Antes de darlo por bueno

`npm run romper` a 1440, 869 y 485 px con contenido hostil —nombres
larguísimos, muchas filas, una línea sin espacios— y `/mirar` en claro y
en oscuro. Un diseño que no se ha visto en los dos temas no se ha visto.
