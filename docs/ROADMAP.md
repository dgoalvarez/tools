# Hoja de requerimientos y roadmap

> Escrita el 14 de octubre de 2026, después de revisar el código, las 60
> capturas del 9 de septiembre, el plan fundacional
> (`zazzy-hatching-owl.md`) y el mercado. **Es viva:** cada fase cerrada
> se marca aquí con su fecha y su commit, y una decisión que cambie se
> tacha, no se borra.
>
> El `MAPA.md` dice qué hay. Esta hoja dice **qué falta y en qué orden**.

---

## 1. Lo que Diego decidió

Son el punto de partida, no propuestas. Si alguna cambia, cambia el
roadmap entero.

| Pregunta                  | Respuesta                                                                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿Para qué existe?         | Una caja de herramientas **de todo tipo, para cualquier persona**. Crece por recomendación, no por buscadores. Lo que manda: utilidad, usabilidad, la propuesta, versatilidad y variedad |
| ¿Se mide el uso?          | **No. Nada viaja.** La promesa se queda como está                                                                                                                                        |
| ¿Qué es el tablero?       | **El centro.** Un panel personalizable con las herramientas de cada día, para no tener _n_ pestañas abiertas                                                                             |
| ¿Qué herramientas nuevas? | Las cuatro familias —**diseño, agenda y tiempo, texto, imagen y archivos**— con prioridad para lo que la gente paga hoy y podría tener gratis. Foco en diseño, sin cerrarse a lo general |

### La propuesta, en una frase

> **La caja de herramientas que abres por la mañana y no cierras:** lo
> que usas a diario, en un tablero tuyo, sin cuentas y sin que nada salga
> de tu aparato.

Cinco principios que valen para todo lo que venga:

1. **Nada viaja.** Ni medición, ni archivos subidos, ni modelos que
   llamen a casa de nadie sin decirlo.
2. **Usabilidad antes que estética**, como siempre.
3. **Cada herramienta hace una cosa** y explica por qué, en los dos
   idiomas, con su paso a paso y, si tiene sentido, con su pieza de
   tablero.
4. **Lo que ya se cargó funciona sin conexión.**
5. **Lo pesado se pide.** Si una herramienta tiene que descargar 40 MB,
   lo dice antes, con la cifra, y no lo vuelve a pedir.

---

## 2. Lo que hay

Siete herramientas y un tablero. La base es sólida: lo que falla está en
los remates y en lo que quedó a medias.

|                        | Lo mejor que tiene                                                                     | Lo que le falta                                                     |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Notas**              | Lista, nota con formato y dibujo en una fila; saneador probado con nueve cargas        | Muere al cerrar la pestaña: para uso diario se queda corta (ver D1) |
| **Pomodoro**           | Cuenta contra el reloj del sistema y no se atrasa                                      | Nada urgente                                                        |
| **Husos horarios**     | Temporal de verdad, ZIP por estado partido, aviso de otro día, frase lista para copiar | Un enlace compartido pierde los nombres (H2)                        |
| **Reloj**              | Alarma, cronómetro y temporizador a la vez                                             | Nada urgente                                                        |
| **Paleta**             | Escalera de luminosidad común, qué tinta aguanta cada paso                             | Comprobar pares entre sí, no solo contra blanco y negro             |
| **Contraste**          | WCAG 2.2 y APCA, explica el desacuerdo, sugiere el más cercano                         | Nada urgente                                                        |
| **Escala tipográfica** | La tabla de píxeles a cuatro anchos y el aviso de cruces                               | Números con dos separadores (H3)                                    |
| **Tablero**            | Once piezas, tamaño libre, códec v3 con cadena de oro                                  | **No guarda nada** y el código no tiene pantalla (H1)               |

Y lo que sostiene todo: cuatro alarmas que cazan cosas distintas, colores
medidos y no elegidos, y rutas propias por idioma. Eso no se toca.

---

## 3. Lo que falla

Por orden de gravedad. Cada uno con su prueba.

**H1 · El tablero dice algo falso en producción.** La pantalla afirma
«El reparto se queda en este aparato», pero
`src/islands/tablero/Tablero.tsx:74` arranca con `useState([])` y nada lo
guarda: al recargar, vacío. El códec para llevárselo a otro aparato
(`src/lib/tablero.ts`, v3, con suma de control) está hecho y probado,
pero ninguna pantalla lo importa; «Copiar el código» y «Pegar un código»
existen en `src/i18n/tablero.ts` y no se pintan en ningún sitio.

**H2 · Un enlace de husos pierde los sitios.** El enlace solo lleva la
zona, y el nombre se deduce de ella (`nombreDeZona`,
`src/lib/timezones.ts:62`). Quien abre un enlace en español ve «London»,
«Tokyo» y «Sao Paulo» sin tilde, aunque `lugares.json` trae «Londres»,
«Tokio» y «São Paulo». Un ZIP de Pensacola reaparece como «Chicago», y la
frase que se copia pierde la ciudad. Choca de frente con lo que promete
la portada: «compartir un cálculo es pegar un enlace».

**H3 · Los números se escriben de dos maneras.** En la escala, «1,2» en
el campo y «1.2 · Tercera menor» en el desplegable de al lado. Contraste
escribe «17.38:1» en su página y «17,40:1» en su pieza de tablero.

**H4 · Cada pieza del tablero lleva ocho mandos siempre a la vista**
(− + − + ⚙ ← → ×). Con diez piezas son ochenta botones compitiendo con
lo que importa, que es el contenido.

**H5 · El tablero no está en la portada.** Solo se llega por el icono de
rejilla del riel. Si es el centro, tiene que verse el primero.

**H6 · El lanzador tiene icono de lupa pero no busca.** `⌘K` abre una
lista de las siete herramientas, sin campo de texto. Con siete basta; con
treinta no.

**H7 · Una sola imagen social, y en inglés.** `Base.astro:72` usa
`/og.png` en todas las páginas. Un enlace a `/es/paleta` compartido por
WhatsApp enseña «Small tools. Fewer tabs.», igual que la portada. Para un
sitio que crece por recomendación, la tarjeta del enlace es el
escaparate.

**H8 · No funciona sin conexión ni se puede instalar.** No hay manifiesto
ni service worker. Para un sitio cuya promesa es «todo se calcula aquí»
es lo que más se echa en falta, y además el pomodoro y la alarma avisan
mejor desde una app instalada.

**H9 · `global.css` tiene 6.690 líneas** y 116 KB sin comprimir, más que
las cinco islas grandes juntas, y se sirve entera en todas las páginas.
No le duele a quien usa el sitio, pero cada herramienta nueva la engorda
y cada cambio de maqueta cuesta más. Con treinta herramientas sería
inmanejable.

**H10 · Dar de alta una herramienta toca catorce archivos.** La skill
`/herramienta` lo hace llevadero, pero con veinte herramientas nuevas son
280 sitios donde equivocarse.

---

## 4. El mercado: qué se paga y qué se puede dar gratis

Lo que sale de buscar quién cobra por qué. Los precios cambian y varias
fuentes son agregadores: **se comprueban en la web del fabricante antes
de citarlos en el sitio.**

| Necesidad                                         | Quién cobra, y qué limita                                                                                                                              | Lo que podemos dar                                                           | Con qué, y su licencia                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PDF**: unir, separar, ordenar, firmar           | Smallpdf Pro ≈ 15 $/mes; iLovePDF Premium ≈ 5–9 €/mes. Los dos con tope diario en la versión gratuita, y los dos **suben el archivo a sus servidores** | Lo mismo sin subir nada y sin tope                                           | `pdf-lib` (MIT) para las páginas, `pdf.js` (Apache-2.0) para las miniaturas. **No** `MuPDF.js`, que es AGPL                                         |
| **Imágenes**: comprimir, convertir, redimensionar | TinyPNG y similares, con topes por archivo y por lote; Squoosh es gratis y local, pero de una en una                                                   | En lote, local, y enseñando antes qué datos ocultos lleva cada foto (el GPS) | Códecs de Squoosh compilados a WASM (`jSquash`, Apache-2.0 según un agregador: **comprobar**)                                                       |
| **Quitar el fondo**                               | remove.bg y similares, por créditos                                                                                                                    | Local, con un modelo que se descarga una vez                                 | **ORMBG (Apache-2.0)**. No `@imgly/background-removal` (AGPL) ni RMBG 1.4/2.0 (CC BY-NC: no comercial)                                              |
| **QR**                                            | Los «gratis» hacen códigos dinámicos que **caducan** al acabar la prueba (QRStuff: 30 días o 50 lecturas, según un blog de terceros)                   | QR estático: no depende de nadie y no caduca nunca. Es el honrado            | Una librería pequeña de QR (MIT; **elegir al construir**)                                                                                           |
| **Tablero de cada día**                           | Momentum Plus ≈ 30 $/año, y pone tras el pago las notas, las varias listas, el modo concentración y los sonidos                                        | Todo eso gratis y sin extensión                                              | Lo que ya hay, más ruido generado con Web Audio, sin archivos                                                                                       |
| **Reuniones entre husos**                         | World Time Buddy y CallAlign, con versión de pago                                                                                                      | El planificador sobre los datos y el buscador que husos ya tiene             | `Temporal` y `lugares.json`, ya en casa                                                                                                             |
| **Tokens de diseño**                              | Tokens Studio Pro ≈ 16 €/usuario/mes                                                                                                                   | Paleta + escala exportadas juntas a un formato estándar                      | Lo que ya calculan `rampa.ts` y `scale.ts`                                                                                                          |
| **Paletas**                                       | Coolors gratis: 5 colores por paleta y 10 guardadas; Pro ≈ 3–6 $/mes                                                                                   | La nuestra ya no tiene tope: **decirlo en la página**                        | —                                                                                                                                                   |
| **Transcribir voz**                               | Servicios de pago por minuto                                                                                                                           | Whisper dentro del navegador: el audio no sale del aparato                   | `transformers.js` con WebGPU y caída a WASM; `whisper-base` ≈ 200 MB                                                                                |
| **Traducir y resumir**                            | Servicios en la nube                                                                                                                                   | La IA que Chrome trae dentro del aparato                                     | Translator, Summarizer y Language Detector, **estables desde Chrome 138**. Writer y Rewriter siguen en pruebas. Solo Chrome: se ofrece donde exista |

**La competencia directa** demuestra que esto se busca, y deja el hueco
a la vista. OmniTools (MIT) reúne 126 herramientas en doce categorías
con FFmpeg, Tesseract, pdf.js y ONNX compilados a WASM; IT-Tools, más de
80 utilidades para programadores. Las dos están en inglés, con una
interfaz genérica, pensadas para quien programa, y sin tablero. **El
hueco es el nuestro:** el español de primera, las herramientas diseñadas
y explicadas, y el tablero.

Un dato técnico que confirma una decisión ya tomada: `Temporal` ya va de
serie en Firefox (139, mayo de 2025) y Chrome (144, enero de 2026), pero
Safari todavía no lo trae. El polyfill que solo se descarga si falta
(`obtenerTemporal`) sigue siendo lo correcto.

---

## 5. Requisitos

Cada uno con un identificador para citarlo en los commits, y con su
**hecho cuando**: lo que se mide para darlo por cumplido.

### 5.1 · El tablero, que es el centro

**T1 · Se guarda en el aparato.** El reparto se escribe en
`localStorage` como **el mismo código corto** que ya produce el códec:
no hace falta un segundo formato.
_Hecho cuando_ recargar, cerrar el navegador y volver devuelve el mismo
tablero, y una sonda de `navegar` lo comprueba en los dos sentidos.

**T2 · El código tiene pantalla.** Copiar el código, pegar uno, y un
mensaje claro cuando el pegado no vale (los textos ya existen).
_Hecho cuando_ un código copiado en Chrome reproduce el tablero en
Firefox, y uno con un carácter cambiado se rechaza diciendo por qué.

**T3 · Modo editar.** Fuera de él, cada pieza solo enseña su contenido y
su nombre; dentro, aparecen los mandos de tamaño, posición, ajustes y
quitar. Arrastrar sigue funcionando con el ratón y con el teclado.
_Hecho cuando_ el tablero en reposo no enseña ningún mando de
reparto, y todo se sigue pudiendo hacer sin ratón.

**T4 · Abrir en grande.** Cada pieza lleva a su herramienta completa con
su estado, y la herramienta tiene el camino de vuelta al tablero.

**T5 · Plantillas para no empezar en blanco.** Tres o cuatro tableros de
partida —«Para el día», «Para diseñar», «Para atender a clientes»— que
son, literalmente, códigos. Cuestan una línea cada uno.

**T6 · Copia de seguridad en archivo.** Descargar el tablero **con su
contenido** en un archivo y cargarlo en otro aparato. Es la
sincronización sin servidor.

**T7 · La portada lleva al tablero.** Si hay uno guardado, la portada lo
ofrece lo primero; si no, ofrece las plantillas.

**T8 · Toda herramienta nueva nace con su pieza** cuando tenga sentido
en tamaño pequeño. Entra en la lista de `/herramienta`.

**T9 · Para más adelante:** varios tableros con nombre, y una extensión
mínima que ponga el tablero en cada pestaña nueva (no se puede sin
extensión).

### 5.2 · La plataforma, para pasar de siete a treinta

**P1 · Instalable y sin conexión.** Manifiesto y service worker: lo
visitado funciona sin red, y el sitio se instala como app. Antes de
construirlo, dos opciones a decidir: `@vite-pwa/astro` (Workbox, más
probado, más peso) o un worker escrito a mano de unas sesenta líneas
(menos peso, más trampas de caché). Recomendación: la librería, por la
regla de no construir lo que ya está resuelto.
_Hecho cuando_ con la red cortada se abren las páginas ya visitadas,
el tablero incluido, y Lighthouse da la app por instalable.

**P2 · Lo pesado se pide.** Cualquier herramienta que descargue más de
5 MB lo dice antes, con la cifra, lo guarda en la caché del navegador y
no lo vuelve a pedir. De dónde se descarga es la decisión D2.

**P3 · Cada herramienta trae su CSS.** `global.css` se queda con los
tokens, los temas y las piezas comunes; lo de cada herramienta va con su
vista.
_Hecho cuando_ el CSS que baja la portada pesa menos de la mitad que
hoy, y `romper` sigue en verde a los cinco anchos.

**P4 · El lanzador busca.** Campo de texto que filtra por nombre, por
tarea y por sinónimos en los dos idiomas («pdf», «juntar», «merge»).
_Hecho cuando_ escribir tres letras y pulsar Intro abre la herramienta,
sin tocar el ratón.

**P5 · Favoritos en el riel.** Con treinta iconos el riel no se lee: se
queda con las herramientas que cada cual fije (en `localStorage`, dicho
en pantalla), y el resto vive en el lanzador.

**P6 · Una imagen social por herramienta y por idioma**, generada al
compilar. Opciones a decidir al construir: `satori` + `resvg` en un
guion de compilación, o plantillas SVG propias rasterizadas.

**P7 · Un solo formateador de números**, que use el idioma de la página.
_Hecho cuando_ una comprobación falla si en una página en español
aparece un decimal con punto, y se ha visto fallar a propósito.

**P8 · Un canal para pedir cosas.** Sin medición, la única forma de
saber qué falta es que alguien lo diga. Un enlace en el pie, «¿Echas algo
en falta?», que abre un correo o una incidencia (decisión D4). No envía
nada solo.

**P9 · Bajar el coste de dar de alta.** Medir cuáles de los catorce
registros podrían salir de uno solo y, si compensa, juntarlos. Va antes
de la tanda de herramientas nuevas, no después.

**P10 · Compartir de verdad en el móvil.** Un botón «Compartir» con la
API nativa del sistema donde exista, y copiar el enlace donde no.

### 5.3 · Herramientas nuevas

Ordenadas por fase. **Uso**: con qué frecuencia la necesita alguien.
**Dolor**: si hoy se paga, se limita o se sube a un servidor. **Coste**:
S una tanda, M dos o tres, L una fase entera.

#### Lo de cada día

|                               | Qué hace                                                                                                                                                                                  | Uso                      | Dolor                                      | Coste | Pieza |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------ | ----- | ----- |
| **Contador de texto**         | Palabras, caracteres, frases, tiempo de lectura, y una barra por límite: X, Instagram, LinkedIn, SMS, meta descripción (los límites se comprueban al construir)                           | diario                   | bajo: los gratuitos van llenos de anuncios | S     | sí    |
| **Transformar texto**         | Mayúsculas, minúsculas, tipo frase, tipo título **con las reglas de cada idioma** (en español solo la primera), slug, quitar formato y espacios dobles, ordenar y quitar líneas repetidas | semanal                  | bajo                                       | S     | no    |
| **QR**                        | Enlace, texto, wifi y contacto; PNG y SVG; estático                                                                                                                                       | semanal                  | **alto**: la trampa de los que caducan     | S     | sí    |
| **Contraseñas**               | Generadas con `crypto.getRandomValues`, con longitud y tipos a elegir; frases de contraseña en una segunda vuelta (necesita una lista de palabras con licencia libre)                     | semanal                  | medio                                      | S     | sí    |
| **Planificador de reuniones** | Varias ciudades, el horario laboral de cada una, la franja que vale para todas, y la propuesta copiada en el idioma de cada cual                                                          | semanal                  | medio                                      | M     | sí    |
| **Cuenta atrás**              | A una fecha y hora, compartible por enlace, en la zona de quien la abre                                                                                                                   | puntual                  | bajo                                       | S     | sí    |
| **Ruido para concentrarse**   | Blanco, rosa, marrón y lluvia, generados con Web Audio y sin archivos, con apagado automático. Empieza como pieza de tablero y como opción del pomodoro, sin página propia                | diario                   | medio: Momentum lo cobra                   | S     | sí    |
| **Unidades CSS**              | px, rem, em, pt y %, y el `clamp()` entre dos tamaños                                                                                                                                     | diario para quien diseña | bajo                                       | S     | sí    |

#### Archivos sin subirlos

|                   | Qué hace                                                                                                                                                                                 | Uso     | Dolor                                     | Coste | Pieza |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------- | ----- | ----- |
| **Imágenes**      | Comprimir, convertir (JPG, PNG, WebP, AVIF) y redimensionar en lote, antes y después lado a lado, y descarga en un ZIP. Avisa de los datos ocultos (ubicación) y los quita al reescribir | semanal | **alto**                                  | M     | no    |
| **PDF**           | Unir, separar, reordenar, girar y borrar páginas, e imágenes a PDF, con miniaturas. Comprimir queda por investigar: `pdf-lib` no lo hace                                                 | semanal | **alto**                                  | M–L   | no    |
| **Firmar un PDF** | Dibujar o escribir la firma —el lienzo de Notas ya existe— y colocarla en la página                                                                                                      | puntual | **alto**: es de pago casi en todas partes | M     | no    |

Dos materias nuevas, **imagen** y **documento**, que necesitan su acento
con `/acento`. Los tonos ocupados son 30 (peligro), 73, 189, 255 y 304.

#### Diseño a fondo

|                                   | Qué hace                                                                                                                                                                       | Coste | Dónde vive                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ------------------------------------------------- |
| **Matriz de contraste**           | Todos los pares de una paleta, con su veredicto WCAG y APCA                                                                                                                    | S–M   | Una pestaña de Paleta, reutilizando `contrast.ts` |
| **Daltonismo**                    | Cómo se ve la paleta con protanopía, deuteranopía y tritanopía, y aviso cuando dos pasos se vuelven indistinguibles. `culori` debería traer los filtros: comprobar             | S     | Paleta y Contraste                                |
| **Sistema (tokens)**              | Paleta y escala juntas, exportadas al formato estándar de tokens (W3C), a `@theme` de Tailwind 4 y a CSS. Es el constructor que el plan fundacional dejó para la tercera tanda | M–L   | Página propia                                     |
| **Sombras y degradados en OKLCH** | El degradado sin la zona gris del medio, y sombras por capas                                                                                                                   | M     | Página propia                                     |

#### Lo pesado, con permiso

Todo depende de la decisión D2 y del requisito P2.

|                         | Qué hace                                          | Con qué                                | Descarga                    |
| ----------------------- | ------------------------------------------------- | -------------------------------------- | --------------------------- |
| **Quitar el fondo**     | De una foto, con el resultado en PNG transparente | ORMBG (Apache-2.0)                     | por medir                   |
| **Texto de una imagen** | Reconocimiento de texto en español e inglés       | `tesseract.js` (Apache-2.0: comprobar) | por medir                   |
| **Transcribir**         | Audio a texto, y subtítulos WebVTT                | Whisper con `transformers.js`          | ≈ 200 MB con `whisper-base` |
| **Traducir y resumir**  | Con la IA que trae el navegador                   | API integradas de Chrome               | ninguna propia; solo Chrome |

#### Para cualquiera, sin prisa

Conversor de unidades cotidianas (longitud, peso, temperatura, volumen) y
calculadora de porcentajes e IVA. Son útiles para todo el mundo y cuestan
una tanda cada una, pero no tienen dolor detrás: van cuando haya hueco.
Calculadora de fechas y días hábiles, igual; con festivos por país pasa a
coste M porque necesita datos.

---

## 6. El roadmap

El orden sale de una regla: **primero que nada mienta, luego que el
centro funcione, luego los cimientos, y solo entonces crecer.** Meter
veinte herramientas sobre un tablero que no guarda y un CSS de 6.690
líneas multiplicaría los dos problemas.

### Fase 0 · Que nada mienta

_Una o dos tandas._

- H1 entero, que es T1 y T2: el tablero se guarda y el código tiene
  pantalla.
- H2: el enlace de husos lleva lo necesario para reconstruir el nombre,
  la región y el ZIP.
  _Hecho cuando_ un enlace con Londres, Pensacola y Tokio, abierto en
  limpio, enseña exactamente eso y la frase copiada es la misma.
- H3 con P7: un solo formateador y su comprobación.
- H5: el tablero, en la portada.

### Fase 1 · El tablero de verdad

_Tres o cuatro tandas._

T3 modo editar, T4 abrir en grande, T5 plantillas, T6 copia en archivo,
T7 portada, la decisión D1 aplicada y P1 instalable sin conexión.
_Hecho cuando_ Diego lo usa una semana como página de inicio sin abrir
otra pestaña para nada de lo que el tablero ya tiene.

### Fase 2 · Cimientos para treinta herramientas

_Tres tandas._

P3 el CSS por herramienta, P4 el lanzador que busca, P5 los favoritos,
P6 las imágenes sociales, P8 el canal para pedir y P9 el coste de alta.

### Fase 3 · Lo de cada día

_Una tanda por herramienta, casi todas S._

Contador, transformar texto, QR, contraseñas, unidades CSS, cuenta
atrás, ruido y planificador de reuniones, cada una con su pieza de
tablero. Al final de esta fase el sitio pasa de siete a quince
herramientas, y las plantillas de T5 se rehacen con ellas.

### Fase 4 · Archivos sin subirlos

_La fase más larga._

Imágenes, PDF y firmar un PDF, con las dos materias nuevas. Es donde
está el dolor más grande del mercado y el argumento más fácil de
recomendar: «hace lo de iLovePDF y no sube tu archivo».

### Fase 5 · Diseño a fondo

Matriz y daltonismo dentro de Paleta y Contraste, el Sistema de tokens y
sombras y degradados.

### Fase 6 · Lo pesado, con permiso

Quitar el fondo, texto de una imagen, transcribir, traducir y resumir.
Solo después de D2 y con P2 en marcha.

---

## 7. Decisiones pendientes

Son de Diego. Cada una con lo que recomiendo y por qué.

**D1 · ¿El contenido del tablero debe durar más que la pestaña?** Hoy la
lista y la nota viven en `sessionStorage` y mueren al cerrarla. Para un
tablero de cada día eso es una sorpresa desagradable a la mañana
siguiente. _Recomendación:_ un interruptor por tablero, «Recordar en
este aparato», apagado por defecto y dicho en pantalla. Sigue sin viajar
nada; solo cambia cuánto dura.

**D2 · ¿De dónde se descargan los modelos pesados?** Bajarlos de un CDN
ajeno (Hugging Face) no envía nada de quien los usa, pero le dice a ese
tercero que alguien entró. Servirlos desde el propio dominio lo evita,
pero son cientos de MB por persona. _Recomendación:_ servirlos desde el
dominio propio, después de comprobar qué plan de Vercel tiene el
proyecto y su límite de transferencia.

**D3 · Los acentos de las materias nuevas.** Imagen y documento
necesitan tono. Se derivan con `/acento`; Diego decide si le convencen.

**D4 · El canal para pedir cosas.** ¿Correo o incidencias públicas en
GitHub? El correo es más fácil para cualquiera; GitHub deja ver qué ya
se pidió. _Recomendación:_ correo, que es lo que sabe usar todo el mundo.

**D5 · ¿Varios tableros con nombre?** Trabajo y casa, por ejemplo.
_Recomendación:_ esperar a que alguien lo pida por el canal de D4.

---

## 8. Lo que queda fuera, y por qué

- **Cuentas y sincronización en la nube.** Nunca. Entre aparatos se pasa
  con el código (T2) o con el archivo (T6).
- **Medición de uso.** Decidido el 14 de octubre de 2026.
- **La herramienta de lugares** del plan fundacional. Sigue necesitando
  clave de API y una función de servidor.
- **Lo que necesita datos en vivo**: tipos de cambio de moneda, el
  tiempo. Rompen «nada viaja».
- **Convertir vídeo.** FFmpeg compilado a WASM pesa decenas de MB y es
  lento en un móvil; solo si se pide mucho por D4.

---

## Fuentes

Consultadas el 14 de octubre de 2026.

- [Smallpdf, precios · Capterra](https://www.capterra.com/p/172606/Smallpdf/pricing/)
- [Alternativas a iLovePDF · pdf.net](https://pdf.net/blog/ilovepdf-alternatives.md)
- [Smallpdf frente a iLovePDF](https://europeanpurpose.com/compare/smallpdf-vs-ilovepdf)
- [¿Caducan los QR? · Uniqode](https://uniqode.com/blog/qr-code-basics/qr-codes-expiry)
- [¿Caducan los QR? Estáticos y dinámicos · Rocketlink](https://rocketlink.io/blog/do-qr-codes-expire)
- [Momentum · Toolradar](https://toolradar.com/tools/momentum)
- [Momentum · schieb.de](https://www.schieb.de/momentum-neuer-tab-seite-von-google-chrome-anpassen)
- [Tokens Studio, precios](https://tokens.studio/pricing)
- [Coolors, precios · Toolradar](https://toolradar.com/tools/coolors/pricing)
- [Alternativas a World Time Buddy · AlternativeTo](https://alternativeto.net/software/world-time-buddy)
- [OmniTools · virtualizationhowto](https://www.virtualizationhowto.com/2025/06/omnitools-a-swiss-army-knife-of-self-hosted-utilities/)
- [OmniTools · Railway](https://railway.com/deploy/omnitools)
- [IT-Tools · Zeabur](https://zeabur.com/templates/179DKU)
- [API de IA integradas · Chrome for Developers](https://developer.chrome.com/docs/ai/built-in-apis)
- [Reconocimiento de voz en el navegador en 2026](https://offlinetts.com/blog/browser-speech-recognition-whisper-comparison/)
- [Whisper con WebGPU · HackerNoon](https://hackernoon.com/turn-audio-to-text-on-your-device-free-whisper-webgpu-guide)
- [Subtítulos con IA en el navegador · OpenReplay](https://blog.openreplay.com/add-video-captions-ai-browser/)
- [@imgly/background-removal, README](https://unpkg.com/@imgly/background-removal@1.5.8/README.md)
- [ORMBG en ONNX · Hugging Face](https://huggingface.co/onnx-community/ormbg-ONNX/blob/d9e304300d62e56f4b659232ce47e5ba2b040027/README.md)
- [RMBG-1.4, licencia · Hugging Face](https://huggingface.co/briaai/RMBG-1.4/blob/536d2bae33efab317f541e91cce529dae9d52ac8/License.pdf)
- [pdf-lib, licencia · licenses.dev](https://licenses.dev/npm/pdf-lib/1.17.1)
- [MuPDF.js](https://mupdf.com/llms.txt)
- [jSquash](https://github.com/jamsinclair/jSquash)
- [La API Temporal · flaviocopes](https://flaviocopes.com/temporal-api.md)
- [Guía de migración a Temporal · Refonte Learning](https://www.refontelearning.com/blog/javascript-temporal-migration-playbook)
