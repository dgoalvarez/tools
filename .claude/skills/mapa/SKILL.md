---
name: mapa
description: Pone al día el mapa del proyecto y lo lee, para saber en un minuto qué herramientas hay, qué archivos son de cada una, qué exporta cada módulo y qué caza cada alarma. Úsalo al empezar a trabajar en algo que no tocaste hace poco.
---

# El mapa del proyecto

`docs/MAPA.md` contesta de una vez las preguntas que cada sesión vuelve a
hacerse: qué herramientas hay, qué ruta tiene cada una en cada idioma, de
qué materia es y por tanto de qué color, **qué archivos son suyos**, qué
exporta cada módulo de `src/lib`, qué caza cada alarma y qué hay en los
datos.

Buscar eso a mano cuesta media docena de lecturas. Leerlo cuesta una.

## Cómo

```
npm run mapa
```

Y luego léelo. Está generado del propio código —siguiendo las
importaciones, no adivinando por el nombre—, así que no puede haberse
inventado nada.

## Por qué se genera y no se escribe

Un mapa escrito a mano es exacto el día que se escribe. A la tercera
herramienta miente, y un mapa que miente es peor que no tenerlo: manda a
leer un archivo que ya no existe.

Este solo puede mentir si el código cambió y nadie lo volvió a generar, y
de eso se encarga `node scripts/mapa.mjs --comprobar`, que va en la
compilación con las demás alarmas. Si `npm run build` se queja de que el
mapa se quedó viejo, es literalmente eso: `npm run mapa` y sigue.

## Cuándo usarlo

- **Al empezar** con una herramienta que no tocaste hace poco.
- **Antes de mover un archivo**: la lista de cada herramienta dice quién
  lo usa.
- **Al añadir una materia**: la tabla de colores dice qué tonos están
  ocupados, `--danger` incluido.
- **Después de añadir o quitar algo**, para dejarlo al día antes del
  commit — aunque si se te olvida, la compilación te lo dirá.

## Lo que el mapa NO contesta

Por qué las cosas son como son. Eso está en `CLAUDE.md` y en los
comentarios del código, que es donde vive lo que se descartó y a costa de
qué. El mapa dice dónde está cada cosa; los comentarios dicen por qué.
