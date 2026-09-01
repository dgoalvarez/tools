---
name: tanda
description: Cierra una tanda de trabajo en este proyecto - comprueba, mira las capturas, hace commit con el estilo de la casa, sube y espera a verlo en producción. Úsalo cuando se acabe un trozo de trabajo o cuando Diego diga que se suba.
---

# Cerrar una tanda

El ritual completo. Se hace entero o no se hace: subir sin haber mirado
las capturas ha dejado pasar cosas que ninguna comprobación caza.

## 1 · Comprobar

```
npm run verificar
```

Encadena `build`, `comprobar`, `romper` y `navegar`. Tarda unos minutos:
lánzalo en segundo plano y sigue con otra cosa mientras.

Si algo sale en rojo, **para aquí**. Arreglarlo es parte de la tanda, y
un fallo que aparece al final casi siempre es un fallo de verdad, no un
falso positivo — aunque conviene comprobarlo antes de tocar nada.

## 2 · Mirar

```
npm run ver
```

Y **abre de verdad** las capturas de lo que se ha tocado, en claro y en
oscuro, y la estrecha. No vale con que el comando termine: la mitad de
los fallos de esta sesión salieron viendo la imagen.

Si has añadido un estado al que no se llega recargando —una lista con
cosas dentro, una cuenta a medias— añade su vista a `scripts/ver.mjs`
con `siembra`, `clics` o `guion`. Un estado que no se puede mirar es un
estado que nadie ha mirado nunca.

## 3 · Escribir el mensaje

El estilo de la casa: **explica por qué, no qué**. El «qué» está en el
diff.

- Un título que diga el cambio en una línea, sin prefijos de tipo.
- Las decisiones de fondo con su alternativa descartada y a costa de qué.
- Los fallos que aparecieron por el camino, con su causa y con los
  números medidos: «empujaba 184 px», «Lc −81», «una de cada tres veces».
- Al final, qué se comprobó y cuánto.

Escribe el mensaje en un archivo del bloc de notas y usa `git commit -F`:
un mensaje largo con comillas dentro se rompe en la línea de órdenes.

## 4 · Subir y comprobar en producción

```
git add -A && git commit -F <archivo> && git push
```

Y **espera a verlo publicado** antes de decir que está hecho: pide la
página con `curl` en un bucle hasta que aparezca algo nuevo de esta
tanda. Vercel tarda un par de minutos.

## 5 · Contarlo

Un resumen corto en el chat: qué cambió, qué decisión se tomó y por qué,
y qué fallos aparecieron. Sin repetir el mensaje del commit entero.
