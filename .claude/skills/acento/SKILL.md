---
name: acento
description: Deriva y mide el acento de una materia nueva en este proyecto - el tono, el valor para tema claro y oscuro, el relleno de los botones, y las comprobaciones que lo fijan. Úsalo antes de dar de alta una herramienta cuya materia no existe todavía.
---

# Un acento nuevo

Cada materia se pinta con su color, y dos herramientas comparten color
solo si comparten materia. Una materia nueva necesita un tono nuevo, y
**el tono no se elige a ojo**: se deriva en OKLCH y se mide con la propia
herramienta de contraste del sitio.

## Lo que tiene que cumplir

En **tema claro** el acento es dos cosas a la vez, y ahí está la trampa:

1. el rótulo de materia del encabezado, que es texto pequeño y necesita
   **4,5:1 sobre los tres fondos claros**;
2. el relleno de los botones principales, con **tinta blanca encima a
   4,5:1** — nunca tinta oscura, que no la aguanta ninguno;
3. y ese botón oscuro tiene que **separarse 3:1 de la página oscura**.

En **tema oscuro** solo es texto: 4,5:1 sobre los tres fondos oscuros.

## Elegir el hueco

Mira primero **qué tonos están ocupados**, y cuenta a `--danger` entre
ellos. Ese fue el error de la última vez: el plan pedía un frambuesa a
15° «porque el hueco entre el morado y el ámbar está libre», y ahí vive
el color de error, en el tono 30. Un acento a 15° y un error a 30° son el
mismo rojo, y el acento pinta el rótulo, la herramienta abierta en el
riel y los botones: la herramienta entera habría dicho «cuidado».

Ocupados ahora mismo: **30 peligro · 73 tiempo · 189 tipografía y marca ·
255 texto · 304 color**.

Y hay un techo: el tono tiene que distinguirse de los demás **a 19 px**,
que es el icono del riel plegado. Con seis o siete tonos el círculo se
llena; cuando ya no quepa, la respuesta honesta es compartir materia con
algo, no meter un tono pegado a otro.

## Cómo

**1 ·** Copia `design/acento-texto.ts` a `design/acento-<materia>.ts` y
cambia la lista de tonos que explora.

**2 ·** `node design/acento-<materia>.ts`. Enseña, para cada tono, el más
cromático que cumple, con todas sus medidas y a qué distancia queda de
los que ya hay.

**3 ·** Elige, escribe el elegido en `ELEGIDO` y vuelve a correrlo: la
salida marca cuál es y deja el porqué junto a los números.

**4 ·** Da de alta los valores en `src/styles/global.css`: `--l-<materia>`
y `--d-<materia>` con los demás, `--solido-<materia>: var(--l-<materia>)`,
y `--acento-<materia>` en **los tres bloques de tema** — el claro, el de
`prefers-color-scheme: dark` y el de `[data-theme='dark']`. Olvidar uno
deja la herramienta sin color en un tema y con él en el otro.

**5 ·** `src/i18n/labels.ts`: la materia, y sus entradas en
`ACENTO_POR_MATERIA` y `SOLIDO_POR_MATERIA`.

**6 ·** Clávalo en las comprobaciones: el acento en
`scripts/comprobar-encabezado.ts` (los dos temas) y el sólido en
`scripts/comprobar-contraste.ts` §10, **incluida la línea que demuestra
que con tinta oscura NO pasaba**. Eso es lo que impide que alguien
«simplifique» el sólido dentro de un año.

**7 ·** `node scripts/check-etiquetas.mjs` comprueba que el mapa apunte a
una variable que existe de verdad en el CSS.

**8 ·** Y míralo: `/mirar`, con la herramienta abierta y el riel plegado.
El número dice que pasa AA; la captura dice si se distingue del vecino.
