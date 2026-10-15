# Hoja de requerimientos y roadmap

> Escrita el 14 de octubre de 2026 después de revisar el código, las 60
> capturas del 9 de septiembre, el plan fundacional
> (`zazzy-hatching-owl.md`) y el mercado. Rehecha el 14 y el 15 con la
> investigación del primer alcance —diseño y productividad—, una
> auditoría de licencias de las 661 dependencias, los límites medidos de
> Vercel, **una ronda del council** (§13) y las decisiones de Diego que
> salieron de ella.
>
> **Es viva:** cada fase cerrada se marca aquí con su fecha y su commit, y
> una decisión que cambie se tacha, no se borra. El `MAPA.md` dice qué
> hay. Esta hoja dice **qué falta, en qué orden y con qué permiso**.

---

## 0. Las palabras de esta hoja

| Palabra        | Qué quiere decir                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| **Tanda**      | Un trozo de trabajo que se termina entero: se construye, se comprueba, se sube y se mira en producción       |
| **Pieza**      | Una herramienta en pequeño dentro del tablero                                                                |
| **Reparto**    | Qué piezas tiene el tablero, de qué tamaño y en qué orden                                                    |
| **Código**     | El reparto escrito como un texto corto que se copia y se pega en otro aparato                                |
| **Riel**       | La barra de iconos del lateral                                                                               |
| **Alarma**     | Una comprobación que corre sola al compilar y para la subida si algo está mal                                |
| **Sonda**      | Una comprobación que abre el sitio en un navegador de verdad y mira qué pasa                                 |
| **Lo ves tú**  | Lo que Diego comprueba con sus ojos en producción, en dos minutos, para dar un requisito por hecho           |
| **Peticiones** | Cuántos archivos pide el navegador al abrir una página. Vercel gratis da un millón al mes                    |
| **Permisiva**  | Una licencia que deja usar, cambiar y compartir sin más obligación que citar al autor: MIT, Apache, BSD, ISC |

---

## 1. Lo que Diego decidió

Son el punto de partida, no propuestas. Si alguna cambia, cambia el
roadmap entero.

| Pregunta                      | Respuesta                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿Para qué existe?             | Una caja de herramientas **de todo tipo, para cualquier persona**. Crece por recomendación, no por buscadores. Lo que manda: utilidad, usabilidad, la propuesta, versatilidad y variedad          |
| ¿Se mide el uso?              | **No. Nada viaja.**                                                                                                                                                                               |
| ¿Qué es el tablero?           | **El centro.** Un panel personalizable con las herramientas de cada día, para no tener _n_ pestañas abiertas                                                                                      |
| ¿Qué entra primero?           | **Diseño y productividad.** De «imagen y archivos» entra solo lo que usa quien diseña. El PDF y los modelos pesados esperan al segundo alcance                                                    |
| ¿Con qué se construye?        | **Solo licencias permisivas en lo que llega al navegador:** MIT, Apache-2.0, BSD o ISC para el código; OFL para las fuentes; CC0 o CC BY para los datos                                           |
| ¿Y lo que solo compila?       | **Una lista aparte, con su porqué** (15 oct): `lightningcss` (MPL-2.0) y `sharp` (LGPL-3.0) corren en la máquina que construye el sitio y no llegan a nadie. Sin ellas no hay Astro ni Tailwind 4 |
| ¿Quién paga?                  | **Nadie.** Vercel en plan **Hobby**, que no cobra nunca: si se pasa, pausa (§5)                                                                                                                   |
| ¿Excepciones?                 | **Una: APCA**, gratis para medir contraste web pero no libre (§4). ~~Switzer~~: se cambia por una fuente OFL (15 oct)                                                                             |
| ¿El código del sitio?         | **MIT, y todo público.** Los datos de GeoNames (CC BY 4.0) y `apca-w3` quedan fuera, cada uno con su licencia                                                                                     |
| ¿La historia de git?          | **Se limpia** de los archivos de Switzer en el mismo repositorio, con copia de seguridad completa antes (15 oct). Nadie lo había copiado: 0 forks                                                 |
| ¿Salida de Vercel?            | **Se ensaya en Cloudflare** en la tanda 6, sin tocar el dominio (15 oct). Mudarse del todo se decide después (D8)                                                                                 |
| D1 · ¿El tablero recuerda?    | **El reparto, siempre.** El contenido, con un interruptor «Recordar en este aparato» **apagado de entrada**                                                                                       |
| Lo que Diego pidió por nombre | Un **generador de retículas** por punto de corte, en código y en visual; algo **tipo Notion**; **diagramas de flujo** y **mapas mentales**                                                        |

### La propuesta, en una frase

> **La caja de herramientas que abres por la mañana y no cierras:** lo
> que usas a diario, en un tablero tuyo, sin cuentas, sin pagar y sin que
> nada salga de tu aparato.

Siete principios para todo lo que venga:

1. **Nada viaja.** Ni medición, ni archivos subidos, ni modelos que
   llamen a casa de nadie sin decirlo.
2. **Usabilidad antes que estética.**
3. **Cada herramienta hace una cosa** y explica por qué, en los dos
   idiomas, con su paso a paso y, si tiene sentido, con su pieza.
4. **Lo que ya se cargó funciona sin conexión.**
5. **Lo pesado se pide.** Lo que pese más de 100 KB se descarga al
   pulsar, no al abrir la página; si pasa de 5 MB, lo dice antes.
6. **Libre y gratis para siempre.** Nada que pueda empezar a cobrar o
   retirarse.
7. **Cabe en el plan gratuito**, con margen para el día que un enlace
   corra de mano en mano (§5).

---

## 2. Lo que hay

Siete herramientas y un tablero. La base es sólida: lo que falla está en
los remates y en lo que quedó a medias.

|                        | Lo mejor que tiene                                                                     | Lo que le falta                                  |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Notas**              | Lista, nota con formato y dibujo en una fila; saneador probado con nueve cargas        | Muere al cerrar la pestaña (lo resuelve T10)     |
| **Pomodoro**           | Cuenta contra el reloj del sistema y no se atrasa                                      | Nada urgente                                     |
| **Husos horarios**     | Temporal de verdad, ZIP por estado partido, aviso de otro día, frase lista para copiar | Un enlace compartido pierde los nombres (H2)     |
| **Reloj**              | Alarma, cronómetro y temporizador a la vez                                             | Nada urgente                                     |
| **Paleta**             | Escalera de luminosidad común, qué tinta aguanta cada paso                             | Comprobar pares entre sí, no solo contra B y N   |
| **Contraste**          | WCAG 2.2 y APCA, explica el desacuerdo, sugiere el más cercano                         | **Lleva código AGPL al navegador** (H12)         |
| **Escala tipográfica** | La tabla de píxeles a cuatro anchos y el aviso de cruces                               | Números con dos separadores (H3); no es fluida   |
| **Tablero**            | Once piezas, tamaño libre, códec v3 con cadena de oro                                  | **No guarda nada** y el código no tiene pantalla |

---

## 3. Lo que falla

Por orden de gravedad. Cada uno con su prueba.

**H12 · El sitio sirve código AGPL en cada visita a Contraste.**
`apca-w3` trae dentro `colorparsley@0.1.8`, con licencia **AGPL-3.0**,
justo la que la regla prohíbe por su nombre. Su código está en
`dist/_astro/contrast.*.js`: entra porque `src/lib/contrast.ts` llama a
`calcAPCA`, que lo usa para leer los colores. Lo encontró el escaneo de
las 661 dependencias, no las cinco opiniones del council: lo vieron las
cinco revisiones. **Arreglo:** `APCAcontrast(sRGBtoY(r,g,b))`, que no lo
necesita, con los canales sacados del hexadecimal que ya tenemos.

**H11 · Los archivos de Switzer están en un repositorio público, y su
licencia lo prohíbe.** La ITF Free Font License 2.0 (17 de agosto de 2026) dice, en su cláusula 02, que la fuente no puede ponerse al alcance
de nadie «a través de […] un repositorio, […] servidores de acceso
público». `public/fonts/*.woff2` está en GitHub desde el primer commit
(`c04d94e`). **Arreglo decidido:** cambiar a una fuente OFL y limpiar la
historia (§4.2).

**H1 · El tablero dice algo falso en producción.** Afirma «El reparto se
queda en este aparato», pero `Tablero.tsx:74` arranca con `useState([])`
y nada lo guarda. El códec v3 está hecho y probado, y ninguna pantalla lo
usa.

**H2 · Un enlace de husos pierde los sitios.** Un enlace en español
enseña «London» y «Sao Paulo» en vez de «Londres» y «São Paulo»; un ZIP
de Pensacola vuelve como «Chicago».

**H3 · Los números se escriben de dos maneras.** «1,2» y «1.2» en la
misma pantalla; «17.38:1» en Contraste y «17,40:1» en su pieza.

**H4 · Cada pieza lleva ocho mandos siempre a la vista.**

**H6 · El lanzador tiene icono de lupa pero no busca.**

**H7 · Una sola imagen social, y en inglés.**

**H8 · No funciona sin conexión ni se puede instalar.**

**H9 · `global.css` tiene 6.690 líneas** y se sirve entera en todas
las páginas.

**H10 · Dar de alta una herramienta toca catorce archivos.**

~~**H5 · El tablero no está en la portada.**~~ Es el mismo requisito que
T7; se sigue allí.

---

## 4. Licencias

### 4.1 · La regla y la auditoría

**La regla mira lo que llega al navegador.** Escaneadas el 14 de octubre
las **661 dependencias instaladas**, directas e indirectas, las que no
son permisivas son cuatro:

| Paquete                  | Licencia                         | Por qué está                        | Llega al navegador | Qué se hace                                       |
| ------------------------ | -------------------------------- | ----------------------------------- | ------------------ | ------------------------------------------------- |
| `colorparsley`           | **AGPL-3.0**                     | La trae `apca-w3`                   | **Sí, hoy**        | **Se deja de usar** (H12). La alarma L3 lo vigila |
| `apca-w3`                | «Limited W3 License»             | La segunda lectura de Contraste     | Sí                 | **La excepción**, escrita y vigilada              |
| `lightningcss`           | MPL-2.0                          | La usan Vite y Tailwind para el CSS | No                 | Lista de compilación                              |
| `sharp` (`@img/sharp-*`) | Apache-2.0 AND LGPL-3.0-or-later | La trae Astro para imágenes         | No                 | Lista de compilación                              |

**APCA, la única excepción.** Permite medir contraste de contenido web
sin pagar; exige no modificarla, usar siempre la última versión, no usar
su logo sin permiso y, si el sitio fuera comercial, un contrato. Se
sostiene así: **el veredicto lo da WCAG 2**, que es libre, y APCA es la
segunda lectura; si su licencia cambia, se quita sin que nada se rompa.
Su versión se mira en la revisión de V4.

### 4.2 · Cómo se sale de Switzer

1. **Geist (OFL-1.1)** sustituye a Switzer, en los mismos tres pesos,
   dentro del repositorio y con su `OFL.txt` al lado. Lo propuso Diego.
   Al ser OFL ya no hay que bajarla de nadie al compilar.
2. **La historia se limpia** de `public/fonts/switzer-*.woff2` en todos
   los commits, y se sube forzando. Antes, una copia completa del
   repositorio (`git bundle`) fuera de él. Los identificadores de los
   commits cambian; los mensajes que citan uno se quedan apuntando a un
   identificador viejo, y por eso esta hoja deja de citar
   identificadores anteriores al cambio.
3. Si GitHub siguiera sirviendo algún commit antiguo por su
   identificador, se le pide que lo purgue con su formulario de soporte.
4. `public/fonts/LEEME.md` se reescribe para Geist.
5. **El portafolio** (`dgoalvarez.com`) sigue con Switzer, y está bien:
   su repositorio es privado y la licencia permite servirla desde el
   propio dominio.

Las cláusulas que importan, literales, para quien lo lea dentro de un
año:

> **01** · «You may self-host the Font Software on your own servers or
> infrastructure for use on your own websites and applications,
> including through standard webfont technologies such as CSS
> @font-face.»
>
> **02** · «The Font Software may not […] be distributed, duplicated,
> […] or otherwise made available to any other person or entity […].
> This includes distributing the Font Software through another font
> website, font library, marketplace, repository, download service,
> application or platform, or by email, removable media, publicly
> accessible servers […]» — y — «You may not host, serve, embed or
> otherwise make the Font Software available for use by third parties
> through any website, application, online service […] design tool,
> template editor or similar service.»

Servirla desde el dominio estaba permitido (01); tenerla en un
repositorio público, no (02); y ofrecerla como fuente a elegir en una
herramienta, tampoco.

### 4.3 · Lo que la regla deja fuera

| Pieza                          | Licencia                               | En su lugar                                             |
| ------------------------------ | -------------------------------------- | ------------------------------------------------------- |
| `colorparsley`                 | AGPL-3.0                               | Los canales del hexadecimal, sin librería               |
| tldraw (pizarra)               | Propia, con clave                      | Excalidraw (MIT)                                        |
| BlockNote (editor tipo Notion) | MPL-2.0                                | Lexical (MIT)                                           |
| mediabunny (vídeo)             | MPL-2.0                                | La grabación nativa; `mp4-muxer` (MIT) si hiciera falta |
| MuPDF.js                       | AGPL                                   | `pdf-lib` (MIT), en el segundo alcance                  |
| @imgly/background-removal      | AGPL                                   | ORMBG (Apache-2.0), en el segundo alcance               |
| RMBG 1.4 / 2.0                 | CC BY-NC                               | ORMBG                                                   |
| Google Fonts por su CDN        | La licencia vale; **la privacidad no** | Fuentes OFL servidas desde el dominio                   |

**Una licencia con «O»** se acepta si una de las opciones es permisiva:
`dompurify`, que trae Mermaid, es «MPL-2.0 o Apache-2.0» y se toma como
Apache-2.0.

### 4.4 · Las candidatas, comprobadas

Licencia del registro de npm; peso comprimido de Bundlephobia (14 oct).
**El peso es el de la librería sola**; lo que carga aparte se mide al
construir. **Antes de instalar una, se miran también sus dependencias
indirectas**: así entró `colorparsley`.

| Librería                 | Licencia     | Peso (gzip)      | Para qué                                |
| ------------------------ | ------------ | ---------------- | --------------------------------------- |
| `utopia-core`            | ISC          | 2 KB             | Tipografía y espaciado fluidos          |
| `uqr`                    | MIT          | 4 KB             | QR en SVG                               |
| `turndown`               | MIT          | 4 KB             | Texto con formato → Markdown            |
| `@jsquash/webp`, `/avif` | Apache-2.0   | 7–8 KB + WASM    | Codificar imágenes                      |
| `diff`                   | BSD-3-Clause | 8 KB             | Comparar textos                         |
| `marked`                 | MIT          | 14 KB            | Markdown → HTML (sale por `sanearNota`) |
| `markmap-view` + `-lib`  | MIT          | 23 + 104 KB      | Mapas mentales                          |
| `lexical`                | MIT          | 62 KB            | Documento con atajos                    |
| `opentype.js`            | MIT          | 64 KB            | Leer una fuente: ejes, glifos           |
| `mermaid`                | MIT          | 169 KB +         | Diagramas desde texto                   |
| `svgo`                   | MIT          | 189 KB           | Optimizar SVG                           |
| `@excalidraw/excalidraw` | MIT          | 344 KB + fuentes | Pizarra                                 |

Ya en casa: `culori`, `Temporal`, `perfect-freehand`, `date-fns`.

**Daltonismo:** las matrices de Machado, Oliveira y Fernandes (2009) son
resultados publicados; se escriben en un módulo propio y se comprueban
contra el artículo. **Frases de contraseña:** la lista de la EFF en
inglés es CC BY 3.0; la de español está por encontrar.

---

## 5. Vercel: lo que puede frenar y cómo se controla

### 5.1 · Lo que da el plan Hobby

De la documentación de Vercel (14 de septiembre de 2026): **100 GB** de
transferencia, **1.000.000 de peticiones**, 10 GB de origen, 100
despliegues al día y 45 minutos por compilación, al mes.

**No cobra nunca. Si se pasa, pausa:** quien entra ve un error 503 y en
la mayoría de recursos hay que esperar 30 días. **No avisa** por
porcentaje en Hobby. **Solo uso no comercial:** ni anuncios ni un
«contrátame»; las donaciones no cuentan como comercial.

### 5.2 · Lo que cuesta hoy una visita

Medido en producción el 14 de octubre, en un navegador limpio:
**29 peticiones y ~250 KB** en `/es/tablero` y en `/es/horarios`. Lo que
tiene huella sale con caché de un año: en la segunda visita solo se pide
el HTML.

### 5.3 · Dónde aprieta

**El riesgo no es el mes, es el día.** 1.000.000 ÷ 29 ≈ 34.000 visitas en
frío al mes. Un solo enlace que corra por una red social o un boletín
puede traerlas en un día, y la pausa caería justo cuando llega la gente.
Las peticiones se acaban mucho antes que los gigas (100 GB ÷ 250 KB ≈
400.000 visitas).

### 5.4 · Los controles

**V2 · Menos trozos, primero.** Los 22 scripts del tablero son el gasto
más grande. Se agrupan y se mide antes y después.
_Lo ves tú:_ en las herramientas de desarrollo, pestaña Red, con la
caché desactivada, la cifra de peticiones baja de 29.

**V1 · Presupuesto por página, como alarma, justo después de V2.** Dos
cifras por página: **la primera carga** y **lo que se carga al pulsar**.
El tope se fija en lo que mida V2 más un margen escrito, no antes: con
un tope de 30 y 29 usadas, la primera pieza nueva lo rompería. Sale de
`scripts/pesar.mjs`, que ya sigue el grafo de trozos. Se prueba en los
dos sentidos.

**V3 · Solo archivos estáticos.** Nada de funciones, optimización de
imágenes ni analítica de Vercel.

**V4 · Mirar, dos veces al mes,** con un recordatorio en el calendario
de Diego el día 1 y el 15: Vercel → _Usage_, y `npm view apca-w3
version`. Por encima del 50 % de peticiones a mitad de mes, se aplaza lo
pesado; por encima del 70 %, se activa V5.

**V5 · La salida, ensayada.** Cloudflare sirve archivos estáticos gratis
y **sin límite de peticiones** (su documentación oficial), y admite uso
comercial. El ensayo publica una copia en `*.pages.dev` con las mismas
cabeceras (`_headers`) y redirecciones (`_redirects`) **sin tocar el
dominio**. Con la salida ensayada, una pausa se arregla cambiando el DNS
en minutos. **Antes del ensayo se comprueba quién gestiona el DNS de
`dgoalvarez.com`:** si fuera Vercel, la salida dependería de quien ha
pausado el sitio.
_Lo ves tú:_ la copia en `*.pages.dev` funciona igual que el sitio.

---

## 6. El mercado del primer alcance

Los precios cambian y varias fuentes son agregadores: **se comprueban en
la web del fabricante antes de citarlos en el sitio.** El volumen de
búsqueda solo está en servicios de pago; las señales que sí hay son
quién cobra, qué se repite en los catálogos de la competencia y qué
pidió Diego por su trabajo.

### Diseño

| Necesidad             | Quién cobra o limita                                                                               | Lo que podemos dar                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Retículas**         | Viven dentro de Figma; los generadores libres están abandonados (`autogrid`, 2019) o son de Sketch | Columnas, márgenes y medianil por punto de corte, viéndola y copiándola como CSS, Tailwind y valores para Figma |
| **Tokens**            | Tokens Studio Pro ≈ 16 €/usuario/mes. El formato DTCG 2025.10 es estable desde el 28 oct 2025      | Paleta, escala, retícula y sombras exportadas a DTCG, CSS y `@theme` de Tailwind 4                              |
| **Color**             | Coolors gratis: 5 colores y 10 paletas; Pro ≈ 3–6 $/mes. Stark Pro ≈ 10–15 $/mes                   | Conversor, daltonismo, matriz, degradados OKLCH, paleta desde una foto                                          |
| **Tipografía fluida** | Gratis pero suelto: Utopia, Typescale                                                              | La escala que ya hay, en fluido                                                                                 |
| **Imágenes y SVG**    | TinyPNG por cuotas; Squoosh de una en una                                                          | En lote, local, quitando la ubicación oculta; SVG optimizado; favicons                                          |
| **Probar una fuente** | Wakamai Fondue, gratis y en inglés                                                                 | Suelta tu archivo: ejes, glifos, texto de prueba, sin subirlo                                                   |

### Productividad

| Necesidad                 | Quién cobra o limita                                                                       | Lo que podemos dar                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| **Tablero de cada día**   | Momentum Plus ≈ 30 $/año; Bonjourr es libre pero es una extensión                          | Lo mismo sin extensión ni cuenta, con herramientas de verdad dentro  |
| **Grabar la pantalla**    | Loom gratis: 25 vídeos de **5 minutos**, 720p y con marca; Business ≈ 15–18 $/usuario/mes  | Sin límite, sin marca, sin subirlo, con lo que trae el navegador     |
| **Algo tipo Notion**      | Lo que vale de Notion —bases de datos, sincronizar, compartir— necesita cuentas y servidor | **Un documento, no un Notion**: atajos de Markdown, tareas, exportar |
| **Diagramas y mapas**     | Miro y Whimsical por tableros; Excalidraw cobra la colaboración                            | Mapa mental desde una lista, diagramas desde texto, pizarra          |
| **Reuniones entre husos** | World Time Buddy, CallAlign: freemium                                                      | El planificador, sobre los husos que ya hay                          |
| **Texto**                 | Contadores llenos de anuncios                                                              | Contar, transformar, comparar, de Word a Markdown                    |
| **QR**                    | Los «gratis» caducan al acabar la prueba                                                   | QR estático, que no caduca nunca                                     |

**La competencia directa** (OmniTools, MIT, 126 herramientas; IT-Tools,
GPL, más de 80) está en inglés, pensada para quien programa y sin
tablero. **El hueco es el nuestro.**

---

## 7. Lo que ya está y se reutiliza

| Ya existe                                  | Lo que alimenta                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| `scale.ts` + `TypeScale.tsx`               | Tipografía fluida, unidades CSS, la escala dentro de Tokens              |
| `rampa.ts` + `culori`                      | Conversor, degradados, daltonismo, paleta desde foto, el color en Tokens |
| `contrast.ts`                              | Matriz de contraste, aviso de pasos indistinguibles                      |
| `url-state.ts`                             | El estado de toda herramienta nueva en la dirección (solo la fuente: R1) |
| `tablero.ts` (códec v3) + `widgets.ts`     | Guardar el tablero, las plantillas, la pieza de cada herramienta nueva   |
| `timezones.ts` + `lugares.json` + Temporal | Planificador de reuniones, cuenta atrás, horas y fechas                  |
| `reloj.ts`, `pomodoro.ts`                  | Cuenta atrás, ruido                                                      |
| `notas.ts` (`sanearNota`)                  | Todo HTML que venga de Markdown o de lo pegado                           |
| `Dibujo.tsx` + `perfect-freehand`          | Anotar encima de un mapa o de una captura                                |
| `mover.ts`                                 | Mover tarjetas en la pieza de tareas                                     |
| `scripts/pesar.mjs`                        | Las alarmas V1 y L3: ya sigue el grafo de trozos de cada página          |

---

## 8. Requisitos

Cada uno con un identificador para citarlo en los commits, su **hecho
cuando** (lo que mide una máquina) y su **lo ves tú** (lo que comprueba
Diego).

### 8.1 · En regla

**L0 · Nada AGPL en el navegador** (H12). `contrast.ts` deja de llamar a
`calcAPCA`.
_Hecho cuando_ `colorparsley` no aparece en ningún archivo de `dist` y
`comprobar-contraste` da las mismas cifras que antes.
_Lo ves tú:_ tres pares de colores anotados antes del cambio dan en
producción el mismo Lc después.

**L1 · El código lleva licencia MIT.** `LICENSE` en la raíz, con una nota
que deja fuera `public/data/` (GeoNames, CC BY 4.0), las fuentes (OFL,
con su texto al lado) y `apca-w3`.
_Lo ves tú:_ GitHub enseña «MIT license» en la portada del repositorio.

**L2 · Una fuente libre y una historia limpia** (H11, §4.2).
_Hecho cuando_ ningún commit del repositorio contiene un archivo de
Switzer, y la copia de seguridad existe fuera de él.
_Lo ves tú:_ el sitio se ve en Geist, y en GitHub, en el primer commit,
`public/fonts` no tiene ningún archivo de Switzer.

**L3 · Alarma de licencias sobre lo que se publica.** En cada
compilación: de cada trozo de `dist` sus módulos, de cada módulo su
paquete, de cada paquete su licencia. Falla si algo no es permisivo,
salvo `apca-w3`, nombrada como excepción. Acepta una licencia con «O» si
una opción es permisiva. Lo que solo compila (`lightningcss`, `sharp`)
va en una lista aparte, con su porqué.
_Hecho cuando_ volver a llamar a `calcAPCA` a propósito la hace saltar.
**L4**, los avisos de terceros, sale de la misma lista: un archivo con
la licencia de cada paquete que llega al navegador, enlazado desde el
pie.

### 8.2 · Seguridad de lo que viaja

**R1 · Por una dirección o un código pegado solo viaja la fuente.**
Texto, listas, números; nunca HTML ni SVG, y con un tope de longitud.
Lo que se pinte a partir de ahí se genera en el aparato de quien lo abre:

- El SVG que generen markmap o Mermaid pasa por un `sanearSvg` con lista
  blanca de elementos **y** de atributos: fuera `on*`, `script`,
  `foreignObject` y cualquier `href` externo. Se prueba con cargas
  maliciosas, como `sanearNota`.
- Mermaid va en `securityLevel: 'strict'`.
- Lo que no necesita interacción se pinta dentro de un `<img>`, que no
  ejecuta nada.
- Lo que decodifica T2 se valida campo a campo: la suma de control
  detecta un error al copiar, no a alguien con malas intenciones.

R1 entra en `CLAUDE.md`, junto a la regla de `sanearNota`, con la
primera tanda que lo necesite (T2).

### 8.3 · El tablero, que es el centro

**T1 · Se guarda en el aparato.** El reparto, en `localStorage`, como el
mismo código corto del códec.
_Hecho cuando_ una sonda de `navegar` lo comprueba en los dos sentidos.
_Lo ves tú:_ recargas, cierras el navegador, vuelves, y el tablero sigue
ahí.

**T2 · El código tiene pantalla**: copiar, pegar, y un mensaje claro
cuando no vale. Validado según R1.
_Lo ves tú:_ un código copiado en Chrome reproduce el tablero en
Firefox; uno con un carácter cambiado se rechaza diciendo por qué.

**T3 · Modo editar** (resuelve H4). _Lo ves tú:_ el tablero en reposo no
enseña ningún mando de reparto.

**T4 · Abrir en grande.** _Lo ves tú:_ desde una pieza llegas a su
herramienta con lo mismo, y vuelves.

**T5 · Plantillas** («Para el día», «Para diseñar», «Para atender a
clientes»). _Lo ves tú:_ un tablero vacío te ofrece las tres.

**T6 · Copia en archivo**, con el contenido. _Lo ves tú:_ descargas el
archivo, lo cargas en otro navegador, y está todo.

**T7 · La portada lleva al tablero** (antes H5). _Lo ves tú:_ al entrar
en `/es` el tablero es lo primero.

**T8 · Toda herramienta nueva nace con su pieza** cuando tenga sentido.

**T10 · El interruptor de D1**, en tanda propia. Toca `Notas`, `Dibujo`
y `Pomodoro`, y **abre una tercera excepción de almacenamiento**: la
pantalla lo dice, y la promesa de `CLAUDE.md` y del pie se reescribe en
la misma tanda.
_Lo ves tú:_ con el interruptor encendido, la nota sigue ahí mañana;
apagado, desaparece al cerrar la pestaña.

### 8.4 · La plataforma

**P9 · Bajar el coste de dar de alta** (H10). **Su cifra sale de la
Retícula:** al darla de alta se cuentan los archivos que tocó, y P9 se
da por hecho cuando la siguiente toque **la mitad**.

**P1 · Instalable y sin conexión** (H8). Un service worker roto vive en
el navegador de quien visitó y un despliegue no lo arregla: **su
interruptor de apagado se escribe y se prueba antes que él.**

**P3** CSS por herramienta (H9) · **P4** el lanzador busca (H6) · **P5**
favoritos en el riel · **P6** imagen social por herramienta e idioma
(H7) · **P7** un solo formateador de números (H3) · **P8** un canal para
pedir cosas (D4) · **P10** compartir con la API nativa del móvil.

### 8.5 · Herramientas nuevas del primer alcance

**Uso:** con qué frecuencia la necesita alguien. **Dolor:** si hoy se
paga, se limita o se sube a un servidor. **Coste:** S una tanda, M dos o
tres, L una fase. **Peso:** lo que baja al usarla, aparte de la página.

#### Diseño

|                           | Qué hace                                                                                                                                                       | Uso     | Dolor    | Coste | Pieza  | Con qué                   | Peso        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------- | ----- | ------ | ------------------------- | ----------- |
| **Retícula**              | Columnas, medianil, márgenes y ancho máximo **por punto de corte**; dibujada sobre un lienzo de ese ancho; copiar como CSS Grid, Tailwind y valores para Figma | semanal | medio    | M     | sí     | código propio             | 0           |
| **Tipografía fluida**     | La escala en modo fluido, con el `clamp()` de cada paso; también el espaciado                                                                                  | semanal | bajo     | S–M   | ya hay | `utopia-core` (ISC)       | 2 KB        |
| **Unidades CSS**          | px, rem, em, pt, %, vw y el `clamp()` entre dos tamaños                                                                                                        | diario  | bajo     | S     | sí     | propio                    | 0           |
| **Conversor de color**    | Un color en cualquier formato: HEX, RGB, HSL, OKLCH, P3                                                                                                        | diario  | bajo     | S     | sí     | `culori`                  | 0           |
| **Daltonismo**            | La paleta con protanopía, deuteranopía y tritanopía, y aviso de pasos que se confunden                                                                         | mensual | medio    | S     | no     | Machado 2009, propio      | 0           |
| **Matriz de contraste**   | Todos los pares de una paleta, con WCAG y APCA                                                                                                                 | semanal | medio    | S–M   | no     | `contrast.ts`             | 0           |
| **Degradados**            | En OKLCH, sin la zona gris del medio                                                                                                                           | semanal | bajo     | S     | no     | `culori`                  | 0           |
| **Paleta desde una foto** | Suelta una imagen y salen sus colores; no se sube                                                                                                              | semanal | medio    | S–M   | no     | lienzo + propio           | 0           |
| **Tokens**                | Junta lo de las demás y exporta a DTCG 2025.10, CSS y `@theme` de Tailwind 4; importa un JSON DTCG                                                             | semanal | **alto** | M–L   | no     | propio                    | 0           |
| **Sombras y curvas**      | Sombras por capas; editor de `cubic-bezier()` y `linear()`                                                                                                     | semanal | bajo     | S + S | no     | propio                    | 0           |
| **Imágenes**              | Comprimir, convertir y redimensionar en lote; quita la ubicación oculta                                                                                        | semanal | **alto** | M     | no     | lienzo; jSquash para AVIF | 8 KB + WASM |
| **Optimizar SVG**         | Antes y después, con lo que se quitó                                                                                                                           | semanal | bajo     | S     | no     | `svgo` (MIT)              | 189 KB      |
| **Favicons**              | Todos los tamaños, el HTML y el manifiesto                                                                                                                     | puntual | medio    | S     | no     | lienzo                    | 0           |
| **Probar una fuente**     | Suelta un `.ttf`, `.otf` o `.woff2`: ejes, glifos, texto de prueba                                                                                             | semanal | bajo     | M     | no     | `opentype.js` (MIT)       | 64 KB       |

#### Productividad

|                               | Qué hace                                                                                               | Uso     | Dolor    | Coste | Pieza            | Con qué                             | Peso     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ | ------- | -------- | ----- | ---------------- | ----------------------------------- | -------- |
| **Mapa mental**               | De una lista con sangrías a un mapa; exportar SVG y PNG                                                | semanal | medio    | M     | no               | `markmap` (MIT), con R1             | 127 KB   |
| **Diagramas desde texto**     | Flujos, secuencias y Gantt con la sintaxis de Mermaid                                                  | semanal | medio    | M     | no               | `mermaid` (MIT), con R1             | 169 KB + |
| **Documento**                 | Títulos, listas, tareas y enlaces con atajos de Markdown; exportar `.md`. **No viaja en la dirección** | diario  | **alto** | L     | sí               | `lexical` (MIT)                     | 62 KB    |
| **Contador de texto**         | Palabras, caracteres, tiempo de lectura, y una barra por límite de cada red                            | diario  | bajo     | S     | sí               | propio                              | 0        |
| **Transformar texto**         | Mayúsculas, tipo frase, tipo título **con las reglas de cada idioma**, slug, quitar formato            | semanal | bajo     | S     | no               | propio                              | 0        |
| **Comparar textos**           | Las diferencias palabra a palabra                                                                      | semanal | bajo     | S     | no               | `diff` (BSD-3)                      | 8 KB     |
| **Word → Markdown**           | Pega desde Word o Docs y sale Markdown; y al revés                                                     | semanal | bajo     | S     | no               | `turndown` + `marked`, `sanearNota` | 18 KB    |
| **QR**                        | Enlace, texto, wifi y contacto; PNG y SVG; estático                                                    | semanal | **alto** | S     | sí               | `uqr` (MIT)                         | 4 KB     |
| **Contraseñas**               | Con `crypto.getRandomValues`; frases en inglés con la lista de la EFF                                  | semanal | medio    | S     | sí               | propio                              | 0        |
| **Cuenta atrás**              | A una fecha y hora, compartible, en la zona de quien la abre                                           | puntual | bajo     | S     | sí               | `reloj.ts` + Temporal               | 0        |
| **Planificador de reuniones** | Varias ciudades, su horario laboral, la franja que vale para todas                                     | semanal | medio    | M     | sí               | husos + Temporal                    | 0        |
| **Horas y fechas**            | Sumar duraciones, días entre fechas, días hábiles                                                      | semanal | bajo     | S     | sí               | Temporal                            | 0        |
| **Tareas**                    | Columnas «por hacer, haciendo, hecho» como pieza del tablero                                           | diario  | medio    | M     | **es una pieza** | `mover.ts`                          | 0        |
| **Ruido**                     | Blanco, rosa, marrón y lluvia con Web Audio; pieza y opción del pomodoro                               | diario  | medio    | S     | sí               | Web Audio                           | 0        |
| **Grabar la pantalla**        | Con micrófono si se quiere; WebM, y MP4 donde el navegador sepa. Cambia `Permissions-Policy`           | semanal | **alto** | M     | no               | APIs nativas                        | 0        |
| **Pizarra**                   | Formas, flechas y texto a mano alzada                                                                  | semanal | medio    | L     | no               | Excalidraw (MIT)                    | 344 KB + |

---

## 9. El roadmap

Tres reglas, de la ronda del council: **primero lo que incumple, luego
lo que miente, y lo que Diego pidió por nombre no espera detrás de los
cimientos.** Los remates (H2, H3) dejan de ir en la fase 0.

### Fase 0 · En regla y sin mentiras · tandas 1 a 3

1. **Sin AGPL:** L0 y L3 con L4.
2. **Fuente libre e historia limpia:** Geist, `LEEME.md`, L1 y L2.
3. **El tablero guarda:** T1 y T2, con la validación de R1, y R1 en
   `CLAUDE.md`.

_Hecho cuando_ el sitio no sirve nada que su regla prohíba, el
repositorio no distribuye nada que no pueda, y el tablero guarda lo que
dice.

### Fase 1 · La primera herramienta y el margen · tandas 4 a 6

4. **La Retícula**, con `/herramienta`, contando los archivos que toca
   (la cifra de P9).
5. **V2 y después V1.**
6. **Ensayo de V5** en Cloudflare, sin tocar el dominio.

### Fase 2 · Lo pedido por nombre y el tablero de verdad

P9 con su cifra → **mapa mental** (la primera librería cargada al
pulsar bajo V1, y la primera con `sanearSvg`) → **diagramas desde
texto** (midiendo cuántos trozos pide cada uso) → **T10** en tanda
propia → T3, T4, T5, T6, T7 → H2 → H3 con P7.

### Fase 3 · Diseño

Unidades CSS · tipografía fluida · conversor de color · daltonismo y
matriz dentro de Paleta · degradados · paleta desde una foto ·
**Tokens**, que junta todo lo anterior.

### Fase 4 · Productividad de cada día

**Documento** · contador · transformar · comparar · Word → Markdown · QR
· contraseñas · cuenta atrás · horas y fechas · ruido · **Tareas** ·
planificador de reuniones · **grabar la pantalla**.

### Fase 5 · Diseño con archivos, y la pizarra

Imágenes · optimizar SVG · favicons · probar una fuente · sombras y
curvas · **pizarra**, la última por peso, después de mirar V4.

### Por el camino, sin fase propia

P3, P4, P5, P6, P8 y P10 entran cuando la herramienta que los necesita
los pida: P4 cuando el lanzador pase de quince herramientas, P6 antes de
enseñarle el sitio a nadie. P1, con su interruptor, cuando el tablero
esté terminado.

### Segundo alcance (no empieza sin decidirlo)

PDF, quitar el fondo, texto de una imagen, transcribir, y la IA que trae
Chrome. Con D2 decidida.

---

## 10. Cómo se trabaja cada tanda

1. Se nombra el requisito (`L0`, `T1`…) y se dice el paso antes de darlo.
2. Lo que se construye desde cero se propone con opciones y una
   recomendación antes de escribirlo.
3. **Una librería nueva se mira con sus dependencias indirectas** antes
   de instalarla.
4. `npm run verificar` en verde, capturas de lo que cambió, y las
   alarmas nuevas probadas en los dos sentidos.
5. Commit que cite el requisito y explique por qué, con los números.
6. Push, verlo en producción, y la línea «lo ves tú» para Diego.
7. La fase se marca aquí con su fecha y su commit al cerrarla.

---

## 11. Decisiones

Son de Diego. Cada una con lo que recomiendo y por qué.

**~~D1 · ¿El contenido del tablero debe durar más que la pestaña?~~**
Decidido el 14 de octubre: interruptor, apagado de entrada (T10).

**D2 · ¿De dónde se descargan los modelos pesados?** Segundo alcance.
Desde Vercel Hobby no caben; la respuesta probablemente sea Cloudflare.

**D3 · Los acentos de las materias nuevas.** Con `/acento` cuando haga
falta la primera.

**D4 · El canal para pedir cosas.** _Recomendación:_ correo.

**D5 · ¿Varios tableros con nombre?** _Recomendación:_ esperar a que
alguien lo pida.

**~~D6 · ¿Se limpia Switzer de la historia de git?~~** Decidido el 15
de octubre: sí, en el mismo repositorio, con copia de seguridad antes;
y la fuente se cambia por una OFL.

**~~D7 · ¿Se ensaya la salida a Cloudflare?~~** Decidido el 15 de
octubre: sí, en la tanda 6. Diego abre una cuenta gratuita entonces.

**D8 · Después del ensayo, ¿se cambia el DNS a Cloudflare o se deja
como salida preparada?** Se decide con el ensayo delante.

**D9 · Solo si L0 no consigue sacar `colorparsley`: ¿se quita APCA?**

---

## 12. Lo que queda fuera, y por qué

- **Cuentas y sincronización en la nube.** Nunca.
- **Un Notion de verdad.** Bases de datos, sincronizar y compartir
  necesitan cuentas y servidor. Entra el documento.
- **Un documento que viaje en la dirección.** No se puede sanear lo que
  viaja, y una dirección tiene tope de longitud (R1).
- **Colaborar en tiempo real.** Por lo mismo.
- **Medición de uso.** Decidido el 14 de octubre.
- **La herramienta de lugares** del plan fundacional: necesita clave de
  API y servidor.
- **Lo que necesita datos en vivo**: tipos de cambio, el tiempo.
- **Convertir vídeo.** FFmpeg en WASM pesa decenas de MB y su núcleo es
  LGPL/GPL.
- **Un «contrátame»** mientras el sitio esté en Vercel Hobby: es uso
  comercial.

---

## 13. El council

**Ronda 1 · 14–15 de octubre de 2026.** Cinco asesores (el que busca el
fallo, el que vuelve al principio, el que busca lo que puede crecer, el
que no sabe nada y el que solo piensa en el lunes), cinco revisiones
anónimas cruzadas y un presidente.

**Lo que dijo:** se puede empezar hoy, pero no con el orden de la
primera versión. Lo que cambió en esta hoja por él:

- **H12, lo más grave,** no lo vio ningún asesor: salió del escaneo
  completo que pidió el asesor que busca el fallo, y lo señalaron las
  cinco revisiones. El sitio servía código AGPL.
- **La regla de licencias** pasa a mirar lo que llega al navegador, con
  la lista de compilación aparte (Diego, 15 oct).
- **Reescribir la historia** se discutió y se mantuvo, porque nadie
  había copiado el repositorio (0 forks): limpiar el mismo es completo y
  no obliga a Diego a mover nada. Con la fuente cambiada a una OFL
  (Diego, 15 oct), desaparece la descarga desde Fontshare.
- **El riesgo de Vercel es el día, no el mes:** la salida a Cloudflare
  se ensaya en la tanda 6, y la revisión pasa a dos veces al mes.
- **La Retícula** sube a la tanda 4; **P9** toma su cifra de ella.
- **El mapa mental y los diagramas** dejan de esperar a la última fase.
- **R1**, regla nueva: por una dirección solo viaja la fuente, y el SVG
  generado pasa por un saneador con lista blanca.
- **V1** espera a V2, y tiene dos presupuestos.
- **Cada requisito** lleva su «lo ves tú», y la hoja, un glosario.
- **Descartado:** un «Notion» comprimido en la dirección (no se puede
  sanear ni cabe), y un «contrátame» (uso comercial en Hobby).

**Ronda 2:** _pendiente, sobre esta versión._

---

## Fuentes

Consultadas el 14 y el 15 de octubre de 2026.

**Licencias**

- ITF Free Font License 2.0, `License/FFL.txt` del paquete oficial de Switzer en [Fontshare](https://www.fontshare.com/fonts/switzer)
- [Fontshare, preguntas frecuentes](https://www.fontshare.com/faq)
- `apca-w3/LICENSE.md` y `colorparsley/LICENSE.md` de los paquetes instalados
- El registro de npm (`npm view <paquete> license`) para cada librería de §4.4 y para Geist (`geist`, `@fontsource/geist-sans`: OFL-1.1)
- [Bundlephobia](https://bundlephobia.com) para los pesos
- [jSquash](https://github.com/jamsinclair/jSquash) · [SVGO](https://github.com/svg/svgo) · [opentype.js](https://opentype.js.org/)
- [Simulación de daltonismo, Machado 2009 · colour-science](https://colour.readthedocs.io/en/v0.4.4/_modules/colour/blindness/machado2009.html) · [color-blind (licencia HCIRN)](https://github.com/skratchdot/color-blind/)

**Vercel y alojamiento**

- [Plan Hobby · Vercel](https://vercel.com/docs/plans/hobby)
- [Límites · Vercel](https://vercel.com/docs/limits)
- [Uso justo y uso comercial · Vercel](https://vercel.com/docs/limits/fair-use-guidelines)
- [¿Por qué se ha pausado mi despliegue? · Vercel](https://vercel.com/kb/guide/why-is-my-account-deployment-blocked)
- [Archivos estáticos, facturación y límites · Cloudflare](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [Límites de Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits/)
- [Los planes gratuitos, lado a lado · flaviocopes](https://flaviocopes.com/hosting-free-tiers.md)

**Mercado**

- [Tokens de diseño: primera versión estable · W3C](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- [Design Tokens Format Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/)
- [Importar desde Figma · Terrazzo](https://terrazzo.app/docs/guides/import-from-figma)
- [Coolors, precios · Toolradar](https://toolradar.com/tools/coolors/pricing)
- [Stark · Toolradar](https://toolradar.com/tools/stark-accessibility) · [La nueva Stark Suite](https://www.getstark.co/blog/meet-the-new-stark-suite/)
- [Tokens Studio, precios](https://tokens.studio/pricing)
- [Loom, plan gratuito · Costbench](https://costbench.com/software/communication/loom/free-plan/) · [Precios de Loom · Trainn](https://trainn.co/blog/loom-pricing/)
- [Grabar la pantalla · web.dev](https://web.dev/articles/media/screen-record)
- [Alternativas a Momentum · AlternativeTo](https://www.alternativeto.net/software/momentum-personal-dashboard/) · [Bonjourr · Firefox](https://addons.mozilla.org/addon/2269040/)
- [Alternativas a World Time Buddy · AlternativeTo](https://alternativeto.net/software/world-time-buddy/?p=2)
- [Alternativas a Notion en 2026 · thefrontkit](https://thefrontkit.com/blogs/notion-alternatives-2026)
- [Generadores de CSS · tiny-helpers](https://tiny-helpers.dev/css/) · [Generadores de CSS · Smashing Magazine](https://smashingmagazine.com/2021/03/css-generators/)
- [css-gridish](https://github.com/adoyle-h/css-gridish) · [autogrid](https://github.com/jxnblk/autogrid/blob/master/README.md)
- [Excalidraw, instalación y fuentes propias](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/installation)
- [Informe de entrega de diseño · UX Tools](https://uxtools.co/resources/design-delivery-report)
- [Smallpdf, precios · Capterra](https://www.capterra.com/p/172606/Smallpdf/pricing/) · [¿Caducan los QR? · Uniqode](https://uniqode.com/blog/qr-code-basics/qr-codes-expiry)
- [OmniTools · virtualizationhowto](https://www.virtualizationhowto.com/2025/06/omnitools-a-swiss-army-knife-of-self-hosted-utilities/) · [IT-Tools · Zeabur](https://zeabur.com/templates/179DKU)
- [API de IA integradas · Chrome for Developers](https://developer.chrome.com/docs/ai/built-in-apis)
