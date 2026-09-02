# El mapa

> **Generado.** No lo edites a mano: sale de `scripts/mapa.mjs`, que lo
> deriva del propio código siguiendo las importaciones. Si algo aquí no
> cuadra, es que hay que volver a generarlo — y la compilación lo dice.
>
> `npm run mapa`

Existe para no volver a averiguar lo mismo cada sesión.

## Las herramientas

| | Ruta · es | Ruta · en | Materia | Tarea | Ámbito | Pasos |
| --- | --- | --- | --- | --- | --- | --- |
| **Husos horarios** | `/es/horarios` | `/en/timezones` | tiempo | convertir | productividad | 8 |
| **Reloj** | `/es/reloj` | `/en/clock` | tiempo | cronometrar | productividad | 7 |
| **Pomodoro** | `/es/pomodoro` | `/en/pomodoro` | tiempo | cronometrar | productividad | 4 |
| **Notas** | `/es/notas` | `/en/notes` | texto | anotar | productividad | 6 |
| **Contraste** | `/es/contraste` | `/en/contrast` | color | comprobar | diseno | 9 |
| **Paleta** | `/es/paleta` | `/en/palette` | color | generar | diseno | 6 |
| **Escala tipográfica** | `/es/escala` | `/en/type-scale` | tipografia | generar | diseno | 10 |

### Los archivos de cada una

**Husos horarios** · `timezones`

- `scripts/comprobar-husos.ts`
- `src/i18n/timezones.ts`
- `src/islands/Timezones.tsx`
- `src/lib/timezones.ts`
- `src/views/Timezones.astro`

**Reloj** · `clock`

- `scripts/comprobar-reloj.ts`
- `src/i18n/reloj.ts`
- `src/islands/Reloj.tsx`
- `src/lib/aviso.ts`
- `src/lib/reloj.ts`
- `src/lib/timezones.ts`
- `src/views/Reloj.astro`

**Pomodoro** · `pomodoro`

- `scripts/comprobar-pomodoro.ts`
- `src/i18n/pomodoro.ts`
- `src/islands/Pomodoro.tsx`
- `src/lib/aviso.ts`
- `src/lib/pomodoro.ts`
- `src/views/Pomodoro.astro`

**Notas** · `notes`

- `scripts/comprobar-notas.ts`
- `src/i18n/notas.ts`
- `src/islands/Notas.tsx`
- `src/lib/notas.ts`
- `src/views/Notas.astro`

**Contraste** · `contrast`

- `scripts/comprobar-contraste.ts`
- `scripts/comprobar-encabezado.ts`
- `src/i18n/contrast.ts`
- `src/islands/Contrast.tsx`
- `src/lib/contrast.ts`
- `src/views/Contrast.astro`

**Paleta** · `palette`

- `scripts/comprobar-rampas.ts`
- `src/i18n/contrast.ts`
- `src/i18n/paleta.ts`
- `src/islands/Paleta.tsx`
- `src/islands/SelectorColor.tsx`
- `src/lib/contrast.ts`
- `src/lib/rampa.ts`
- `src/views/Paleta.astro`

**Escala tipográfica** · `scale`

- `scripts/comprobar-escala.ts`
- `src/i18n/scale.ts`
- `src/islands/TypeScale.tsx`
- `src/lib/scale.ts`
- `src/views/TypeScale.astro`

## Materias y colores

Dos herramientas comparten color solo si comparten materia. Los valores
salen de `design/*.ts`, derivados en OKLCH y medidos: nada entra si no
pasa AA sobre los tres fondos de su tema.

| Materia | Tema claro | Tema oscuro | Herramientas |
| --- | --- | --- | --- |
| tiempo | `#946000` | `#e8a33d` | 3 |
| color | `#884fc4` | `#b47cf5` | 2 |
| tipografia | `#007872` | `#31c5bc` | 1 |
| texto | `#0169cd` | `#2c8efe` | 1 |
| *(peligro)* | `#a4271c` | `#ff8a7a` | — |

El relleno de los botones es `--solido-<materia>`: el valor claro en los
dos temas, con tinta blanca encima. **Nunca el acento** — con tinta
oscura ninguno pasa, y está medido en `comprobar-contraste.ts` §10.

## La aritmética · `src/lib`

Sin React ni DOM: se corre con `node`, y por eso se puede comprobar.

**`aviso.ts`**
- funciones · `arrancarAudio`, `sonar`, `notificar`, `permisoActual`, `pedirPermiso`
- tipos · `Permiso`

**`contrast.ts`**
- funciones · `leerColor`, `componerSobre`, `esTextoGrande`, `medirWcag`, `medirApca`, `sugerirColor`, `hayDesacuerdo`, `esPolaridadClara`, `aHexEnGama`, `canalesDe`, `conCanal`, `visualDe`, `desdeVisual`
- constantes · `ESPACIOS`
- tipos · `Color`, `Texto`, `ResultadoWcag`, `EstadoApca`, `ResultadoApca`, `Sugerencia`, `Espacio`, `Canal`, `Visual`

**`notas.ts`**
- funciones · `limpiarLinea`, `nuevaTarea`, `anadir`, `marcar`, `escribir`, `mover`, `borrar`, `borrarHechas`, `cuantasHechas`, `aMarkdown`, `sanearNota`, `textoDeNota`, `notaAMarkdown`, `guardar`, `leer`
- constantes · `VACIO`, `VERSION`, `CLAVE`, `LIMITE_TAREAS`, `LIMITE_LINEA`, `LIMITE_NOTA`
- tipos · `Tarea`, `Cuaderno`

**`pomodoro.ts`**
- funciones · `limitar`, `descansoTras`, `siguiente`, `minutosDe`, `duracionMs`, `restanteMs`, `margenRestanteMs`, `comoReloj`, `avance`, `guardarCuenta`, `leerCuenta`
- constantes · `FASES`, `AJUSTES_INICIALES`, `LIMITES`
- tipos · `Fase`, `Ajustes`, `Cuenta`

**`rampa.ts`**
- funciones · `curvaClaridad`, `curvaClaridadInversa`, `escaleraNominal`, `cromaMaximo`, `nombresPaso`, `limpiarNombre`, `nombreDePaso`, `construirRampa`, `construirPaleta`, `aplicarRetoque`, `soltarRetoque`, `soltarTodos`, `retoquesDormidos`, `medirPaso`, `limiteDePolaridad`, `buscarVallesDeCroma`, `pasosIndistinguibles`, `retoquesQueRompen`, `buscarNombresRepetidos`, `aOklchCss`, `aCss`
- constantes · `AJUSTES_INICIALES`, `LIMITES`, `NOMBRES_POR_PASOS`, `SALTO_MINIMO`
- tipos · `Ajustes`, `Tonalidad`, `Paso`, `Rampa`, `Paleta`, `AccesibilidadDePaso`

**`reloj.ts`**
- funciones · `horaEscrita`, `fechaEscrita`, `agujas`, `horaValida`, `proximaVez`, `faltaParaAlarma`, `transcurrido`, `vueltasDe`, `extremos`, `limitarPuesta`, `puestaMs`, `restanteTemporizador`, `excedidoMs`, `conMasTiempo`, `avanceTemporizador`, `comoCuenta`, `comoCronometro`
- constantes · `CARA_INICIAL`, `ALARMA_INICIAL`, `CRONOMETRO_INICIAL`, `PUESTA_INICIAL`, `LIMITES_PUESTA`, `TEMPORIZADOR_INICIAL`
- tipos · `Cara`, `Alarma`, `Cronometro`, `Vuelta`, `Puesta`, `Temporizador`

**`scale.ts`**
- funciones · `limpiarNombre`, `aplicarEsquema`, `alturaDeLinea`, `nombreDePaso`, `tamanoEn`, `construirEscala`, `buscarCruces`, `anchoParaFraccion`, `buscarNombresRepetidos`, `aCss`
- constantes · `RAIZ_PX`, `ANCHOS_TABLA`, `ESQUEMAS`, `RAZONES`
- tipos · `Ajustes`, `Esquema`, `Paso`, `Cruce`

**`timezones.ts`**
- funciones · `obtenerTemporal`, `zonaDelNavegador`, `nombreDeZona`, `localeDe`, `camposEnZona`, `desfaseDeZona`, `diaDeZona`, `minutosEnZona`, `convertir`, `abreviaturaDeZona`, `relojEnVivo`, `componerLista`, `normalizar`, `nombreGenericoDeZona`, `nombreDePais`, `buscarLugares`, `zonaDeZip`
- tipos · `FuenteDestino`, `Destino`, `Conversion`, `Momento`, `Ambiguedad`, `Resultado`, `RelojVivo`, `DatosLugares`, `DatosZips`, `TipoLugar`, `Coincidencia`

**`url-state.ts`**
- funciones · `leerParams`, `escribirParams`

**`utils.ts`**
- funciones · `cn`

## Las alarmas

| Guion | Cuándo | Qué caza |
| --- | --- | --- |
| `check-csp.mjs` | compilación | un script en línea sin su hash en la CSP |
| `check-etiquetas.mjs` | compilación | una etiqueta o un color que no existe |
| `check-pages.mjs` | compilación | una ruta declarada sin HTML publicado |
| `check-routes.mjs` | compilación | que `routes.ts` y `astro.config.mjs` se separen |
| `check-tour.mjs` | compilación | un paso que señala a algo que ya no está |
| `mapa.mjs` | compilación | que este mapa se quede viejo |
| `comprobar-*.ts` | `npm run comprobar` | la aritmética de cada herramienta |
| `comprobar-roturas.mjs` | `npm run romper` | que algo se salga de su caja |
| `comprobar-navegacion.mjs` | `npm run navegar` | tirones al cargar y recargas al navegar |
| `ver.mjs` | `npm run ver` | nada: hace capturas para mirarlas |

## Los datos

Salen de `scripts/build-data.mjs`, que **no** se ejecuta salvo que se
pida: descarga 780 MB de GeoNames y regenera esto, que va versionado.

| Archivo | Tamaño | Contiene |
| --- | --- | --- |
| `lugares.json` | 747 KB | 367 zonas, 2103 regiones, 12.375 ciudades, 3822 divisiones, 303 paises |
| `zips.json` | 33 KB | 926 prefijos, 373 excepciones |

## Los comandos

- **`npm run dev`** — `astro dev`
- **`npm run build`** — `node scripts/check-routes.mjs && node scripts/check-etiquetas.mjs && node scripts/map…`
- **`npm run verificar`** — `npm run build && npm run comprobar && npm run romper && npm run navegar`
- **`npm run check`** — `astro check`
- **`npm run preview`** — `astro preview`
- **`npm run astro`** — `astro`
- **`npm run comprobar`** — `node scripts/comprobar-contraste.ts && node scripts/comprobar-escala.ts && node scrip…`
- **`npm run romper`** — `node scripts/comprobar-roturas.mjs`
- **`npm run navegar`** — `node scripts/comprobar-navegacion.mjs`
- **`npm run ver`** — `node scripts/ver.mjs`
- **`npm run mapa`** — `node scripts/mapa.mjs`
- **`npm run build-data`** — `node scripts/build-data.mjs`

