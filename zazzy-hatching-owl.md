# tools.dgoalvarez.com · Caja de herramientas

> **Este plan es autosuficiente.** Está escrito para una sesión nueva que no
> ha visto la conversación donde se decidió. Todo lo necesario —valores
> exactos, archivos a copiar y el porqué de cada decisión— está aquí dentro.
>
> **Diego es diseñador, no programador.** Explica el porqué de cada
> herramienta y de cada comando, no solo el comando.

---

## Contexto

Diego Alvarez tiene un portafolio publicado en `dgoalvarez.com`: sitio
estático en Astro 7, cinco páginas, bilingüe, desplegado en Vercel desde
`C:\portfolio`. **Ese proyecto no se toca en absoluto.** Aparece en este plan
solo como fuente de la que copiar tipografía, colores y patrones que ya están
probados.

Lo nuevo es otra cosa: **un producto propio** en `tools.dgoalvarez.com`.
Herramientas públicas y gratuitas que resuelven problemas concretos y **no
guardan ningún dato de nadie**: sin base de datos, sin cuentas, sin cookies.

La primera sale de un problema real de trabajo —agendar citas en hora
colombiana para personas latinas que viven repartidas por los husos horarios
de Estados Unidos, y tener que decirle a cada una la hora *suya*—. Las otras
dos salen del oficio del diseño.

El subdominio **todavía no existe**. Crearlo es parte del trabajo y está
explicado paso a paso más abajo.

---

## Decisiones ya cerradas con Diego

| Tema | Decisión |
| --- | --- |
| Base técnica | Astro + islas de React |
| Componentes | shadcn/ui + Tailwind |
| Repositorio | **Separado del portafolio**, carpeta y repo propios |
| Idiomas | Español e inglés, como el portafolio |
| Alcance de la v1 | Husos horarios · Contraste · Escala tipográfica |
| Identidad visual | **Propia y más funcional.** Comparte la tipografía Switzer y el verde de acento para que se note la familia, pero con controles, tablas y densidad de producto — no de portafolio |
| Entrada de zona horaria | Ciudades del mundo + código ZIP de Estados Unidos |
| Almacenamiento | Ninguno. Nunca |

### Decisiones tomadas por Claude, con su razón

Si alguna no convence, se cambia — pero conviene leer el porqué antes.

| Tema | Decisión | Por qué |
| --- | --- | --- |
| Primitivas de shadcn | **Radix**, el que trae por defecto | Diego mencionó «shadcn/ui o React Aria». shadcn/ui *está construido sobre* Radix: su CLI, su documentación y sus actualizaciones lo asumen. React Aria (de Adobe) es una capa **rival**, no complementaria — mezclarlas significa reimplementar shadcn a mano. Radix ya resuelve foco, teclado y ARIA correctamente. Si algún control exótico lo pide, se puede añadir un componente suelto de React Aria más adelante sin conflicto |
| Aritmética de husos | **`Temporal`**: nativo si el navegador lo trae, polyfill si no | Es la única API que sabe representar «las 3 de la tarde en Bogotá» como lo que es: una hora de pared con una zona. El `Date` de siempre no puede, y obliga a adivinar el desfase iterando — que falla justo en los saltos de horario de verano. **Colombia no cambia la hora y Estados Unidos sí**, así que ese fallo no sería un caso raro en esta herramienta: sería *el* caso |
| Barrio o ubicación exacta | **No se construye** | Diego lo pidió y luego aceptó descartarlo. La razón: las zonas horarias siguen fronteras políticas —países, estados, condados—, nunca barrios. Bogotá entera es `America/Bogota`; Manhattan y el Bronx comparten huso. Bajar a barrio añade una precisión que **no cambia la respuesta ni una sola vez**. El ZIP sí aporta, pero a nivel de estado: sirve para distinguir los estados partidos en dos husos, no calles dentro de una ciudad |
| Ubicación automática | Sin pedir permiso | `Intl.DateTimeFormat().resolvedOptions().timeZone` devuelve la zona del navegador al instante, sin diálogo de geolocalización y sin que la web sepa dónde está nadie |
| Estado de cada herramienta | **En la URL**, en parámetros de consulta | Compartir un cálculo es pegar un enlace. Cero almacenamiento, cero cookies, y de paso el botón «atrás» del navegador funciona solo |
| Despliegue inicial | Publicar el sitio casi vacío antes de escribir ninguna herramienta | Separa los problemas de DNS y certificado de los problemas de código. Si algo falla ahí, falla solo y se ve enseguida |

---

## Punto de partida

**Carpeta nueva**, fuera de `C:\portfolio`. Sugerencia: `C:\tools`. Repositorio
de git propio, proyecto de Vercel propio.

### Lo que hay que copiar del portafolio

Rutas absolutas, para que no haya que buscarlas:

| Origen | Destino | Qué es |
| --- | --- | --- |
| `C:\portfolio\public\fonts\switzer-400.woff2` | `public/fonts/` | Peso normal |
| `C:\portfolio\public\fonts\switzer-500.woff2` | `public/fonts/` | Peso medio |
| `C:\portfolio\public\fonts\switzer-600.woff2` | `public/fonts/` | Peso semi-negrita |
| `C:\portfolio\public\fonts\LEEME.md` | `public/fonts/` | La licencia de la fuente |
| `C:\portfolio\src\i18n\config.ts` | `src/i18n/` | Es genérico: se copia tal cual |

Y como **referencia a leer, no a copiar** (el nuevo proyecto los reescribe
adaptados, pero conviene ver cómo están hechos):

- `C:\portfolio\src\i18n\routes.ts` — el patrón de fuente única de URLs
- `C:\portfolio\scripts\check-routes.mjs` — alarma de rutas divergentes
- `C:\portfolio\scripts\check-pages.mjs` — alarma de páginas no publicadas
- `C:\portfolio\scripts\check-csp.mjs` — alarma de la política de seguridad
- `C:\portfolio\vercel.json` — cabeceras de seguridad ya afinadas

Los valores exactos de color y tipografía están en el **apéndice** al final
de este documento, por si el portafolio no estuviera a mano.

---

## Arquitectura

```
C:\tools\                       (repo propio, proyecto de Vercel propio)
├── package.json
├── astro.config.mjs            i18n en/es · output static · format file
├── vercel.json                 CSP y cabeceras propias
├── components.json             configuración de shadcn
├── tsconfig.json
├── scripts\
│   ├── build-data.mjs          genera ciudades y ZIP desde GeoNames
│   ├── check-routes.mjs        rutas de routes.ts vs astro.config.mjs
│   ├── check-pages.mjs         cada ruta declarada tiene HTML publicado
│   └── check-csp.mjs           ningún script en línea sin su hash
├── public\
│   ├── fonts\                  Switzer, copiada del portafolio
│   ├── data\                   ciudades.json y zips.json (generados)
│   └── robots.txt
└── src\
    ├── i18n\
    │   ├── config.ts           copiado tal cual del portafolio
    │   ├── routes.ts           fuente única de URLs
    │   └── ui.ts               textos compartidos, en los dos idiomas
    ├── styles\global.css       tokens, temas, Switzer, Tailwind
    ├── layouts\
    │   ├── Base.astro          html, head, tema, cabecera, pie
    │   └── Tool.astro          envoltorio común de una herramienta
    ├── components\
    │   ├── ui\                 shadcn (lo genera su CLI)
    │   └── ...                 cabecera, pie, selector de idioma y tema
    ├── islands\                las tres herramientas, React
    │   ├── Timezones.tsx
    │   ├── Contrast.tsx
    │   └── TypeScale.tsx
    ├── lib\
    │   ├── url-state.ts        leer y escribir estado en la URL
    │   ├── timezones.ts        aritmética con Temporal
    │   ├── contrast.ts         WCAG 2.2 y APCA
    │   └── scale.ts            escala y clamp()
    └── pages\
        ├── en\  index · timezones · contrast · type-scale
        └── es\  index · horarios · contraste · escala
```

### Configuración de Astro

Mismo esquema que el portafolio, porque ya está resuelto:

- `output: 'static'` — HTML plano, sin servidor.
- `build.format: 'file'` — genera `contraste.html` en vez de
  `contraste/index.html`. **Requiere `"cleanUrls": true` en `vercel.json`**;
  sin eso todas las rutas dan 404. Es la trampa clásica de esta combinación.
- `i18n` con `locales: ['en','es']`, `defaultLocale: 'en'` y
  `prefixDefaultLocale: true`, para que ningún idioma viva en la raíz.
- `site: 'https://tools.dgoalvarez.com'`.
- Integraciones: `@astrojs/react`, `@astrojs/sitemap` y Tailwind vía
  `@tailwindcss/vite`.

### Política de seguridad de contenido

`vercel.json` propio. Dos diferencias con el portafolio, ambas inevitables:

- **`style-src` necesita `'unsafe-inline'`.** Radix inyecta estilos en línea
  para posicionar menús y diálogos. Es la misma concesión que el portafolio
  ya documenta; no hay forma de evitarla usando shadcn.
- **`script-src 'self'` debería bastar.** Astro emite las islas de React como
  archivos `.js` propios, no en línea. Si alguna versión inyecta un script en
  línea, `check-csp.mjs` lo detecta al compilar y hay que añadir su hash.

`connect-src 'self'`: en la versión 1 no hay ni una sola llamada externa.
Todas las herramientas calculan en el navegador.

El resto de cabeceras se copian del portafolio: `Strict-Transport-Security`,
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, y caché
inmutable de un año para `/fonts/`.

---

## Las tres herramientas

### 1 · Husos horarios — `/es/horarios` · `/en/timezones`

**El problema real.** Tienes una cita a las 3:00 p. m. hora de Colombia y
necesitas decírsela en su hora a alguien que vive en Estados Unidos, donde
hay seis husos y donde varios estados están partidos por la mitad.

**Entrada** — fecha y hora, más la zona de origen. Por defecto
`America/Bogota`.

**Destinos** — se añaden uno a uno. Cada destino acepta tres formas:

| Forma | Cómo se resuelve |
| --- | --- |
| Ciudad | Buscador sobre ~4.500 ciudades del mundo |
| ZIP de Estados Unidos | Tabla propia, descargada solo si alguien escribe un ZIP |
| «Mi ubicación» | La zona del navegador, sin permiso ni diálogo |

**Salida** — por cada destino: la hora local, la fecha, el desfase respecto
al origen, y **un aviso bien visible cuando cae en otro día**. Ese es el
error que de verdad se comete al agendar.

**Y lo que hace que la herramienta sirva de algo**: un botón que copia la
frase ya redactada, en el idioma que se elija, lista para pegar en WhatsApp o
en un correo:

> «Tu cita es el jueves 4 de septiembre a las 3:00 p. m., hora de Miami
> (4:00 p. m. en Bogotá).»

Eso es el trabajo. Lo demás es la aritmética que hay debajo.

**Implementación.** `Temporal.ZonedDateTime` para la hora de origen y
`withTimeZone()` para cada destino. Temporal es la única API que expone
`disambiguation`, que es lo que decide qué hacer con las horas que **no
existen** (el salto de primavera) o que **ocurren dos veces** (el de otoño).
Cargar el polyfill `@js-temporal/polyfill` solo si `globalThis.Temporal` no
existe, y solo en esta isla — así no pesa en las otras páginas.

### 2 · Contraste — `/es/contraste` · `/en/contrast`

Dos colores, texto y fondo, en cualquier formato: hex, `rgb`, `hsl`, `oklch`.

- **WCAG 2.2** — la razón de contraste y el veredicto AA (4,5:1 en texto
  normal, 3:1 en texto grande y en controles de interfaz) y AAA (7:1). Es el
  estándar vigente y el único que se puede citar como cumplimiento.
- **APCA** — el valor Lc con su tabla de tamaño y peso de fuente. Va
  **etiquetado como borrador de WCAG 3.0**, porque eso es lo que es.

  > **Nota terminológica importante.** Diego lo llamó «WCAG 2.3». Ese
  > estándar no existe. Lo vigente es **WCAG 2.2**; APCA es el algoritmo de
  > contraste perceptual que propone el borrador de **WCAG 3.0**. La interfaz
  > debe decirlo así, o la herramienta enseñaría algo falso.

- **Cuando los dos veredictos no coinciden, explicarlo.** Hay pares de
  colores que aprueban WCAG 2.2 y suspenden APCA, y al revés. Decir por qué
  —APCA pesa la polaridad claro-sobre-oscuro y el tamaño de letra; WCAG 2.2
  solo mira la luminancia— es lo que convierte esto en una herramienta y no
  en la enésima calculadora de contraste.
- **Sugerir el color más cercano que sí aprueba**, moviendo solo la
  luminosidad en OKLCH y conservando tono y croma. Es el paso que casi nadie
  da y el que ahorra el trabajo de verdad.
- **Cuentagotas del sistema** con la API `EyeDropper`, donde el navegador la
  tenga (Chrome y Edge). Campo de texto como alternativa siempre.

Bibliotecas: `apca-w3` (la implementación oficial) y `culori` para leer y
convertir color. La razón de WCAG 2.x son unas quince líneas propias, sin
dependencia.

### 3 · Escala tipográfica — `/es/escala` · `/en/type-scale`

Entrada: tamaño base, proporción, cuántos pasos arriba y abajo, y los anchos
mínimo y máximo de ventana. Salida: un bloque de variables CSS con `clamp()`,
listo para copiar.

**El diferencial**, y sale de un problema real que Diego ya vivió en su
propio portafolio: **una tabla que muestra a cuántos píxeles queda cada paso
en 390, 768, 1360 y 1920.**

En su sitio, los titulares llegaban al 96 % de su tamaño máximo ya en una
pantalla de 1360 px mientras el cuerpo seguía pegado a su mínimo — de ahí la
sensación de «grande y apretado» a la vez. Ninguna herramienta de escalas
tipográficas enseña eso, y es exactamente donde se rompen.

Además, **un aviso automático cuando dos pasos se cruzan** a algún ancho. Es
el fallo de jerarquía que no se ve hasta que ya está publicado.

---

## Los datos: ciudades y códigos ZIP

Todo se genera **en tiempo de compilación** con `scripts/build-data.mjs`, a
partir de los volcados públicos de GeoNames. En tiempo de ejecución no se
consulta nada: son archivos JSON estáticos.

**Ciudades** — de `cities15000.txt`, filtradas a más de 50.000 habitantes:
unas 4.500 filas con nombre, país, región y zona IANA. Alrededor de 60 KB
comprimido, cargado solo en la página de husos horarios.

**Códigos ZIP** — de `US.zip`, agrupados **por prefijo de tres dígitos** con
excepciones explícitas solo donde ese prefijo abarca dos husos. Eso baja de
41.000 filas a menos de 20 KB. Se descarga únicamente si alguien escribe un
ZIP; quien busque por ciudad nunca lo pide.

> ⚠️ **GeoNames es CC BY 4.0.** La atribución en el pie del sitio es
> **obligatoria**, no opcional.

---

## Cómo activar el subdominio

Esta parte no es código. Son cuatro pasos y un aviso.

**1 · Subir el repositorio.** La carpeta nueva necesita su propio repositorio
en GitHub, separado del portafolio.

**2 · Crear el proyecto en Vercel.** New Project → importar ese repositorio.
Vercel detecta Astro solo. Al ser un repo independiente **no hay que tocar
«Root Directory»**. Nómbralo distinto del portafolio —`dgoalvarez-tools`—
para no confundirlos en el panel.

**3 · Añadir el dominio.** En ese proyecto: Settings → Domains → añadir
`tools.dgoalvarez.com`. Vercel muestra entonces el registro DNS exacto que
hace falta.

**4 · Crear el registro DNS** donde estén hoy los DNS de `dgoalvarez.com`
—el registrador, Cloudflare, o el propio Vercel—:

```
Tipo     Nombre    Valor
CNAME    tools     cname.vercel-dns.com
```

- Si el dominio ya lo gestiona Vercel, el paso 3 crea el registro solo y este
  paso no existe.
- **Si está en Cloudflare, el registro debe quedar en gris («DNS only»), no
  en naranja.** El proxy de Cloudflare por delante de Vercel provoca bucles
  de redirección y certificados duplicados.

Después hay que esperar: la propagación tarda de minutos a un par de horas, y
Vercel emite el certificado solo cuando el DNS ya apunta bien.

### ⚠️ Un aviso que importa

El portafolio sirve hoy esta cabecera en `dgoalvarez.com`:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

`includeSubDomains` significa que **cualquier navegador que haya visitado
alguna vez dgoalvarez.com se negará a abrir `tools.dgoalvarez.com` por HTTP**.
No mostrará un aviso que se pueda saltar: sencillamente no cargará.

En la práctica no hay problema, porque Vercel emite el certificado
automáticamente. Pero conviene saberlo por dos razones: no se puede probar
por HTTP plano mientras el certificado se emite, y si algún día el subdominio
se apunta a otro servicio sin HTTPS, quedará inaccesible sin explicación
aparente.

---

## Orden de ejecución

| # | Paso | Riesgo |
| --- | --- | --- |
| 1 | Andamiaje: Astro, React, Tailwind, shadcn, i18n, layouts, tokens | bajo |
| 2 | Portada de la caja + `vercel.json` + las tres alarmas | bajo |
| 3 | **Desplegar el sitio casi vacío** y activar el subdominio | bajo |
| 4 | Contraste — la más autocontenida, valida todo el andamiaje | bajo |
| 5 | Escala tipográfica | bajo |
| 6 | `build-data.mjs`: ciudades y ZIP | medio |
| 7 | Husos horarios | **alto** |

Desplegar en el paso 3, con el sitio prácticamente vacío, es deliberado:
separa los problemas de DNS y certificado de los problemas de código. Si algo
falla ahí, falla solo y se identifica en un minuto.

Los husos horarios van al final porque son la única pieza con aritmética que
**puede estar mal sin parecerlo**.

---

## Verificación

En cada paso: `npm run build`, que debe encadenar las mismas alarmas que el
portafolio —rutas, `astro check`, páginas publicadas y CSP—. La filosofía de
esas alarmas es convertir fallos silenciosos en fallos ruidosos de
compilación, y merece la pena conservarla.

Y al terminar, comprobaciones manuales que ninguna alarma puede hacer:

### Husos horarios — las que de verdad importan

1. **Una cita el primer domingo de noviembre y otra el segundo domingo de
   marzo.** Son los días en que Estados Unidos cambia la hora y Colombia no.
   Si la aritmética está mal, está mal ahí.
2. **Phoenix contra Denver, en julio.** Los dos son «Mountain», pero Arizona
   no cambia la hora: en verano **no coinciden**. Si la herramienta da lo
   mismo para los dos, está usando un desfase fijo en vez del huso real.
3. **Un ZIP de Florida occidental (`324xx`) contra uno de Miami.** Mismo
   estado, dos husos distintos. Es la prueba de que el ZIP aporta algo.
4. **Una cita a las 11 p. m. hora de Colombia, vista desde California.** Debe
   avisar de que allí **es el día anterior**.

### Contraste

Contrastar los números contra la calculadora oficial de WebAIM (para WCAG
2.2) y contra la demo de referencia de APCA. Deben **coincidir**, no
parecerse.

### Escala tipográfica

Generar la escala actual del portafolio de Diego y comprobar que la tabla
devuelve los mismos píxeles a 1360 y 1920 que los valores reales del sitio.

### Lo que tiene que mirar Diego

Claude no tiene navegador: calcula píxeles, no ve resultados. Hace falta que
Diego compruebe que las tres herramientas se manejan **solo con el teclado**,
que se leen bien en móvil, y que en modo oscuro no queda nada ilegible.

---

## Fuera de alcance

- **La herramienta de lugares** (buscar restaurantes, bares y cafés por ZIP o
  ciudad, con reseñas y filtros). Va a la segunda tanda porque es la única
  que necesita clave de API, una función de servidor que la esconda, límite
  de peticiones y caché. Cuando llegue: **un solo proveedor de datos**,
  Foursquare, con Google **únicamente como enlace de salida** — sus términos
  prohíben expresamente mostrar datos de Google mezclados con los de otro
  proveedor. Los límites de la capa gratuita de Foursquare hay que verificar-
  los en ese momento, no ahora: cambian.
- **Rampas de color y constructor de tokens.** Tercera tanda.
- **Base de datos, cuentas, cookies o cualquier dato de quien use esto.**
  Nunca. Es el principio del producto, no una limitación temporal.
- **El portafolio en `C:\portfolio`.** Ni un archivo.

---

## Apéndice · Valores exactos

Para no tener que abrir el portafolio.

### Tipografía

```css
@font-face {
  font-family: 'Switzer';
  src: url('/fonts/switzer-400.woff2') format('woff2');
  font-weight: 400; font-style: normal; font-display: swap;
}
/* Ídem para 500 y 600 */
```

Pila completa: `Switzer, system-ui, sans-serif`.

### Colores del portafolio

La caja de herramientas **conserva el verde de acento** y define el resto a
su gusto: necesita más niveles de gris y estados de control que un
portafolio.

```css
[data-theme='light'] {
  --bg: #f6f7f6;  --ink: #101314;  --muted: #3d4548;
  --soft: #656e71; --line: #e0e3e2; --accent: #0a5f5a;
}

[data-theme='dark'] {
  --bg: #101314;  --ink: #f2f4f3;  --muted: #b5bbbb;
  --soft: #7c8589; --line: #262c2d; --accent: #0e8c84;
}
```

### Rutas previstas

```ts
export const ROUTES = {
  home:     { en: '/en',            es: '/es' },
  timezone: { en: '/en/timezones',  es: '/es/horarios' },
  contrast: { en: '/en/contrast',   es: '/es/contraste' },
  scale:    { en: '/en/type-scale', es: '/es/escala' },
};
```

Igual que en el portafolio, este archivo es la **fuente única de verdad** de
las URLs: de aquí salen el menú, el selector de idioma, las etiquetas
`canonical` y `hreflang` y el sitemap. Y como `astro.config.mjs` no puede
importar TypeScript, las rutas quedan escritas dos veces — por eso existe la
alarma `check-routes.mjs`, que falla la compilación si divergen.

### Qué hace cada alarma

| Alarma | Cuándo corre | Qué evita |
| --- | --- | --- |
| `check-routes.mjs` | antes de compilar | Que `routes.ts` y `astro.config.mjs` se separen y el sitemap salga incompleto en silencio |
| `astro check` | antes de compilar | Errores de tipos. En el portafolio destapó un `alt="[object Object]"` publicado en cuatro páginas |
| `check-pages.mjs` | después de compilar | Que una ruta declarada no tenga HTML publicado: el menú enlazaría a un 404 |
| `check-csp.mjs` | después de compilar | Que un script en línea sin su hash rompa la página en producción y no en local |
