# Graph Report - toolsdgo  (2026-09-10)

## Corpus Check
- 162 files · ~177,049 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1198 nodes · 2677 edges · 62 communities (55 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.85)
- Token cost: 214,863 input · 0 output

## Community Hubs (Navigation)
- Registro del sitio e i18n
- La libreta: lista, nota y dibujo
- El reloj y sus cuentas
- Husos horarios y lugares
- El mapa y las etiquetas
- La escala tipográfica
- La aritmética de las rampas
- Componentes de interfaz (shadcn)
- El pomodoro
- Widgets y sus ajustes
- La aritmética del contraste
- El tablero y su catálogo
- Los datos de GeoNames
- La herramienta de paleta
- Colores derivados y medidos
- El código comprimido del tablero
- Configuración de shadcn
- El paquete y sus guiones
- Las dependencias
- Cómo se verifica y se mira
- El reloj compartido y las zonas
- Campos de hora y fecha
- El mapa de las herramientas
- Alarmas de rutas y páginas
- Romper la maqueta, y el diseño
- La sonda de navegación
- Las capturas
- El calendario y sus props
- El plan fundacional y la promesa
- La derivación de acentos
- Los guiones de npm
- Los tonos ocupados y sus reglas
- El encabezado y sus colores
- Las piezas del tablero
- El paso a paso y sus anclas
- La comprobación del tablero
- Los iconos de Phosphor
- TypeScript
- Botones y calendario
- La CSP
- El veredicto de contraste
- El estado en la dirección
- Dependencias de desarrollo
- El favicon
- La tarjeta social
- Los códigos de los widgets
- La tipografía y sus licencias
- Dar de alta una herramienta
- La configuración de Astro
- La rampa viva de la portada
- La navegación sin JavaScript
- El cuentagotas del navegador
- El despliegue en Vercel
- Las trampas de maquetación
- Los ganchos de Claude Code
- Trampas de CSS
- El peso del paquete
- El techo de los 19 píxeles
- El formateador
- Los tipos de APCA
- El dominio y su seguridad

## God Nodes (most connected - your core abstractions)
1. `t` - 88 edges
2. `Lang` - 39 edges
3. `Reloj()` - 39 edges
4. `react` - 37 edges
5. `@phosphor-icons/react` - 25 edges
6. `cn()` - 25 edges
7. `Pomodoro()` - 24 edges
8. `Timezones()` - 23 edges
9. `Notas()` - 20 edges
10. `medirWcag()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `¿Es una skill, una regla o un guion?` --references--> `La promesa: sin cuentas, sin cookies, sin base de datos`  [AMBIGUOUS]
  .claude/skills/buscar-skills/SKILL.md → CLAUDE.md
- `Un elemento de rejilla nace con min-width: auto` --semantically_similar_to--> `height: 100% contra una fila de rejilla indefinida se resuelve como auto`  [INFERRED] [semantically similar]
  .claude/skills/diseno/SKILL.md → CLAUDE.md
- `Un mapa escrito a mano miente a la tercera herramienta` --semantically_similar_to--> `Medir gana a mirar, y mirar gana a razonar`  [INFERRED] [semantically similar]
  .claude/skills/mapa/SKILL.md → CLAUDE.md
- `git commit -F desde un archivo, no comillas en la línea de órdenes` --semantically_similar_to--> `Nada de heredocs para scripts de parcheo`  [INFERRED] [semantically similar]
  .claude/skills/tanda/SKILL.md → CLAUDE.md
- `Desplegar el sitio casi vacío antes de escribir herramientas` --semantically_similar_to--> `Esperar a verlo publicado antes de decir que está hecho`  [INFERRED] [semantically similar]
  zazzy-hatching-owl.md → .claude/skills/tanda/SKILL.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **El flujo completo de dar de alta una herramienta: acento, diseño, registro, capturas y tanda** — _claude_skills_herramienta_skill_herramienta, _claude_skills_acento_skill_acento, _claude_skills_diseno_skill_diseno, _claude_skills_mirar_skill_mirar, _claude_skills_tanda_skill_tanda, _claude_skills_mapa_skill_mapa [INFERRED 0.85]
- **Las alarmas que corren en la compilación** — scripts_check_csp, scripts_check_etiquetas, scripts_check_pages, scripts_check_routes, scripts_check_tour, scripts_check_widgets, scripts_mapa [EXTRACTED 1.00]
- **Las piezas que sostienen la promesa de no guardar datos de nadie** — claude_promesa_sin_datos, claude_estado_en_la_direccion, claude_excepciones_almacenamiento, zazzy_hatching_owl_sin_almacenamiento, zazzy_hatching_owl_ubicacion_sin_permiso, public_fonts_leeme_autoalojada [INFERRED 0.85]

## Communities (62 total, 6 thin omitted)

### Community 0 - "Registro del sitio e i18n"
Cohesion: 0.05
Nodes (47): other, other, year, ancho, grupos, Props, ThemeToggle(), DEFAULT_LANG (+39 more)

### Community 1 - "La libreta: lista, nota y dibujo"
Cohesion: 0.05
Nodes (74): conCaja(), lista(), poner(), asegurarLeido(), avisar(), cambiarCuaderno(), forzar(), oyentes (+66 more)

### Community 2 - "El reloj y sus cuentas"
Cohesion: 0.07
Nodes (59): RELOJ, probarSonido(), ATAJOS, Esfera(), LOCALES, Reloj(), conGesto(), cronoArrancar() (+51 more)

### Community 3 - "Husos horarios y lugares"
Cohesion: 0.07
Nodes (45): @js-temporal/polyfill, ciudades, raiz, zips, BuscadorLugar(), horaAhora(), Props, TextosBuscador (+37 more)

### Community 4 - "El mapa y las etiquetas"
Cohesion: 0.05
Nodes (38): ORDEN_AMBITOS: un ámbito nuevo sin entrada borra el grupo del riel, ACENTOS, AMBITOS, CLAVES, css, labels, leer(), limpio() (+30 more)

### Community 5 - "La escala tipográfica"
Cohesion: 0.10
Nodes (33): base, ESCALA, NOMBRES_ESQUEMA, NOMBRES_RAZON, CLAVES, INICIAL, nombresATexto(), Razon() (+25 more)

### Community 6 - "La aritmética de las rampas"
Cohesion: 0.11
Nodes (30): enGama, normal, WidgetPaleta(), ResultadoApca, ResultadoWcag, AccesibilidadDePaso, aCss(), aOklch (+22 more)

### Community 7 - "Componentes de interfaz (shadcn)"
Cohesion: 0.12
Nodes (24): @phosphor-icons/react, radix-ui, Input(), Label(), Select(), SelectContent(), SelectGroup(), SelectItem() (+16 more)

### Community 8 - "El pomodoro"
Cohesion: 0.14
Nodes (25): POMODORO, Pomodoro(), empezar(), saltar(), WidgetPomodoro(), empezar(), Ajustes, AJUSTES_INICIALES (+17 more)

### Community 9 - "Widgets y sus ajustes"
Cohesion: 0.07
Nodes (31): SheetClose(), CampoDeNumero(), confirmar(), CampoDeOpcion(), PanelAjustes(), redondear(), AjustesContraste, AjustesDibujo (+23 more)

### Community 10 - "La aritmética del contraste"
Cohesion: 0.10
Nodes (30): apca-w3, culori, aOklch, normal, SelectorColor(), moverPlano(), teclasPlano(), aHexEnGama() (+22 more)

### Community 11 - "El tablero y su catálogo"
Cohesion: 0.14
Nodes (23): Sheet(), TABLERO_TEXTOS, Cargador, COMPONENTE, DISPONIBLES, cache, componenteDe(), ElegirWidget() (+15 more)

### Community 12 - "Los datos de GeoNames"
Cohesion: 0.09
Nodes (22): agrupar(), cache, codigosPostales, construirCiudades(), construirDivisiones(), construirZips(), distancia2(), { divisiones, paises } (+14 more)

### Community 13 - "La herramienta de paleta"
Cohesion: 0.10
Nodes (16): AvisoFlotante(), Props, BotonCopiar(), PALETA, iniciales(), Paleta(), SEMILLAS, TEXTO (+8 more)

### Community 14 - "Colores derivados y medidos"
Cohesion: 0.09
Nodes (23): claros, oscuros, ACENTOS_OSCURO, aOklch, buscarGris(), buscarGrisClaro(), cFondos, chico (+15 more)

### Community 15 - "El código comprimido del tablero"
Cohesion: 0.17
Nodes (12): aBase64url(), deBase64url(), Escritor, Lector, sumaDeControl(), VERSION, codificar(), decodificar() (+4 more)

### Community 16 - "Configuración de shadcn"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 17 - "El paquete y sus guiones"
Cohesion: 0.09
Nodes (21): name, private, type, version, astro, @astrojs/check, class-variance-authority, clsx (+13 more)

### Community 18 - "Las dependencias"
Cohesion: 0.09
Nodes (22): dependencies, apca-w3, astro, @astrojs/react, @astrojs/sitemap, class-variance-authority, clsx, culori (+14 more)

### Community 19 - "Cómo se verifica y se mira"
Cohesion: 0.11
Nodes (21): Un mapa escrito a mano miente a la tercera herramienta, Comparar md5 de las capturas antes y después, Skill /mirar — abrir solo las capturas que cambiaron, Qué buscar en una captura, y no «si se ve bien», siembra, clics, guion y query para alcanzar un estado, git commit -F desde un archivo, no comillas en la línea de órdenes, Esperar a verlo publicado antes de decir que está hecho, El mensaje de commit explica por qué, con los números medidos (+13 more)

### Community 20 - "El reloj compartido y las zonas"
Cohesion: 0.15
Nodes (16): ajustar(), latir(), Oyente, oyentes, useAhora(), CampoDeZona(), WidgetHora(), diferenciaHoras() (+8 more)

### Community 21 - "Campos de hora y fecha"
Cohesion: 0.20
Nodes (15): Popover(), PopoverContent(), PopoverTrigger(), aFecha(), aTexto(), CampoFecha(), CampoHora(), comoTexto() (+7 more)

### Community 22 - "El mapa de las herramientas"
Cohesion: 0.15
Nodes (19): build-data.mjs no se ejecuta salvo que Diego lo pida, Nada llega a dangerouslySetInnerHTML sin pasar por sanearNota, scripts/build-data.mjs — datos de GeoNames, Herramienta Contraste, Herramienta Husos horarios (/es/horarios · /en/timezones), public/data/lugares.json, El mapa del proyecto (docs/MAPA.md), Herramienta Notas (/es/notas · /en/notes) (+11 more)

### Community 23 - "Alarmas de rutas y páginas"
Cohesion: 0.11
Nodes (15): Las rutas viven en routes.ts y en astro.config.mjs a la vez, sitemap-index.xml declarado en robots.txt, dist, faltan, malas, portadas, root, routesTs (+7 more)

### Community 24 - "Romper la maqueta, y el diseño"
Cohesion: 0.12
Nodes (16): frontend-design está mal para este proyecto, Skill /diseno — diseñar dentro del sistema, La forma de una herramienta: mandos a la izquierda, respuesta a la derecha, Las piezas que se reutilizan tal cual (.tarjeta-control, .segmento, BotonCopiar…), Usabilidad antes que estética, Nada de botones fantasma, Una comilla invertida dentro de una plantilla de JS la parte en dos, ANCHOS (+8 more)

### Community 25 - "La sonda de navegación"
Cohesion: 0.12
Nodes (14): --virtual-time-budget acelera los temporizadores pero no la red, CANDIDATOS, CASOS, chrome, COMUN, dist, filtro, GUION_LIBRETA (+6 more)

### Community 26 - "Las capturas"
Cohesion: 0.16
Nodes (15): abrirTour(), CANDIDATOS, chrome, dist, filtro, guionLibre(), perfil, preparar() (+7 more)

### Community 27 - "El calendario y sus props"
Cohesion: 0.13
Nodes (14): Lang, Props, CalendarioMes, Props, Props, Props, Props, Props (+6 more)

### Community 28 - "El plan fundacional y la promesa"
Cohesion: 0.15
Nodes (15): Skill /buscar-skills — enumerar las skills disponibles, El name del encabezado tiene que coincidir con la carpeta, ¿Es una skill, una regla o un guion?, Las skills viven en tres sitios que no se ven entre sí, El mapa dice dónde, los comentarios dicen por qué, El estado vive en la dirección, La promesa: sin cuentas, sin cookies, sin base de datos, Antes de construir algo desde cero, proponer opciones (+7 more)

### Community 29 - "La derivación de acentos"
Cohesion: 0.16
Nodes (13): aOklch, blanco, boton, buscar(), cabe, Candidato, chico, CLARO (+5 more)

### Community 30 - "Los guiones de npm"
Cohesion: 0.15
Nodes (13): scripts, astro, build, build-data, check, comprobar, dev, mapa (+5 more)

### Community 31 - "Los tonos ocupados y sus reglas"
Cohesion: 0.20
Nodes (12): Skill /acento — derivar un acento nuevo, ACENTO_POR_MATERIA y SOLIDO_POR_MATERIA, La colisión del frambuesa a 15° con --danger en el tono 30, El tono se deriva en OKLCH, no se elige a ojo, design/acento-<materia>.ts, Lo que tiene que cumplir un acento (4,5:1 y 3:1), Tonos ocupados: 30 peligro · 73 tiempo · 189 tipografía · 255 texto · 304 color, El acento se declara en los tres bloques de tema (+4 more)

### Community 32 - "El encabezado y sus colores"
Cohesion: 0.20
Nodes (10): Clavar el acento en las comprobaciones, con la línea que demuestra el fallo, CLARO, OSCURO, ROTULO, FilaPaleta(), FilaTonalidad(), cambiar(), usarCuentagotas() (+2 more)

### Community 33 - "Las piezas del tablero"
Cohesion: 0.21
Nodes (9): componenteDe(), Tablero(), anadir(), redimensionar(), seguirTamano(), soltarArrastre(), nuevoId(), validar() (+1 more)

### Community 34 - "El paso a paso y sus anclas"
Cohesion: 0.18
Nodes (8): El paso a paso es obligatorio y sus anclas tienen que existir, dist, faltan, pasos, root, routesTs, rutas, tourTs

### Community 35 - "La comprobación del tablero"
Cohesion: 0.20
Nodes (8): comoTexto(), forma(), columnasPara(), piezaCabe(), CLAVES, POMODORO_FABRICA, POMODORO_LIMITES, TALLAS_V1

### Community 36 - "Los iconos de Phosphor"
Cohesion: 0.25
Nodes (6): IconoReact(), Props, IconoKey, ICONOS, VIEWBOX, Widget

### Community 37 - "TypeScript"
Cohesion: 0.20
Nodes (9): astro/tsconfigs/strict, compilerOptions, baseUrl, jsx, jsxImportSource, paths, exclude, extends (+1 more)

### Community 38 - "Botones y calendario"
Cohesion: 0.36
Nodes (7): react, react-day-picker, Props, Button(), buttonVariants, Calendar(), CalendarDayButton()

### Community 39 - "La CSP"
Cohesion: 0.25
Nodes (6): dist, encontrados, faltan, pages, root, vercel

### Community 40 - "El veredicto de contraste"
Cohesion: 0.25
Nodes (6): Contrast(), FilaTintas(), esPolaridadClara(), hayDesacuerdo(), medirApca(), medirPaso()

### Community 41 - "El estado en la dirección"
Cohesion: 0.36
Nodes (4): CLAVES, Props, escribirParams(), leerParams()

### Community 42 - "Dependencias de desarrollo"
Cohesion: 0.29
Nodes (7): devDependencies, @astrojs/check, shadcn, @types/culori, @types/react, @types/react-dom, typescript

### Community 43 - "El favicon"
Cohesion: 0.38
Nodes (7): Logotipo DGO en pastilla redondeada, Favicon del sitio (SVG 88x88), Clase .mark (trazo unico del logotipo), Relleno que responde al tema del sistema, Tinta clara #101314, Tinta oscura #F2F4F3, Lienzo 88x88 con traslacion vertical de 20

### Community 44 - "La tarjeta social"
Cohesion: 0.48
Nodes (7): Open Graph Social Card (2400x1260), Dark ground with single teal accent, DGO Tools brand lockup, Headline: Small tools. Fewer tabs., Promise: No signup. No upsell., Subhead: Design, productivity, and the things you keep googling, Type-only left-aligned layout with hairline footer rule

### Community 45 - "Los códigos de los widgets"
Cohesion: 0.29
Nodes (5): ahora, cambiados, nuevos, porNumero, raiz

### Community 46 - "La tipografía y sus licencias"
Cohesion: 0.33
Nodes (6): Lo que NO se decide: color, tipografía, superficies, radio, C:\portfolio es de solo lectura, Indian Type Foundry (ITF), ITF Free Font License, Switzer, la tipografía del sitio, C:\portfolio: fuente de la que copiar, ni un archivo se toca

### Community 47 - "Dar de alta una herramienta"
Cohesion: 0.33
Nodes (6): La aritmética va en src/lib, pura y corrible con node, Los catorce sitios donde se registra una herramienta, Skill /herramienta — dar de alta una herramienta, Dónde vive cada cosa: lib, islands, views, i18n, scripts, design, Iconos de Phosphor: ?raw en la navegación, React en las islas, La aritmética de src/lib, sin React ni DOM

### Community 48 - "La configuración de Astro"
Cohesion: 0.33
Nodes (4): PAIRS, @astrojs/react, @astrojs/sitemap, @tailwindcss/vite

### Community 49 - "La rampa viva de la portada"
Cohesion: 0.47
Nodes (4): rampaDe(), RampaViva(), semillaDeTono(), AJUSTES_INICIALES

### Community 50 - "La navegación sin JavaScript"
Cohesion: 0.67
Nodes (5): iniciar(), montarHoja(), montarLanzador(), montarPlegado(), pulsoFuera()

### Community 51 - "El cuentagotas del navegador"
Cohesion: 0.33
Nodes (3): EyeDropper, EyeDropperResult, Window

### Community 52 - "El despliegue en Vercel"
Cohesion: 0.33
Nodes (5): cleanUrls, headers, redirects, $schema, trailingSlash

### Community 53 - "Las trampas de maquetación"
Cohesion: 0.50
Nodes (5): Un elemento de rejilla nace con min-width: auto, Cuatro trampas de maquetación que ya mordieron, height: 100% contra una fila de rejilla indefinida se resuelve como auto, min-height no reserva sitio, solo pone un suelo, Las utilidades de Tailwind ganan a @layer components

### Community 54 - "Los ganchos de Claude Code"
Cohesion: 0.40
Nodes (4): hooks, PostToolUse, PreToolUse, $schema

## Ambiguous Edges - Review These
- `¿Es una skill, una regla o un guion?` → `La promesa: sin cuentas, sin cookies, sin base de datos`  [AMBIGUOUS]
  .claude/skills/buscar-skills/SKILL.md · relation: references
- `Herramienta Paleta` → `Fuera de alcance: lugares con API, rampas, y cualquier dato de nadie`  [AMBIGUOUS]
  zazzy-hatching-owl.md · relation: conceptually_related_to
- `Promise: No signup. No upsell.` → `DGO Tools brand lockup`  [AMBIGUOUS]
  public/og.png · relation: semantically_similar_to

## Knowledge Gaps
- **339 isolated node(s):** `EXTENSIONES`, `$schema`, `PreToolUse`, `PostToolUse`, `PAIRS` (+334 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 487 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `¿Es una skill, una regla o un guion?` and `La promesa: sin cuentas, sin cookies, sin base de datos`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Herramienta Paleta` and `Fuera de alcance: lugares con API, rampas, y cualquier dato de nadie`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Promise: No signup. No upsell.` and `DGO Tools brand lockup`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `t` connect `Registro del sitio e i18n` to `La libreta: lista, nota y dibujo`, `El reloj y sus cuentas`, `Husos horarios y lugares`, `La escala tipográfica`, `La aritmética de las rampas`, `Componentes de interfaz (shadcn)`, `El pomodoro`, `Widgets y sus ajustes`, `La aritmética del contraste`, `El tablero y su catálogo`, `La herramienta de paleta`, `Colores derivados y medidos`, `El reloj compartido y las zonas`, `Campos de hora y fecha`, `El encabezado y sus colores`, `Las piezas del tablero`, `Los iconos de Phosphor`, `El veredicto de contraste`, `El estado en la dirección`?**
  _High betweenness centrality (0.182) - this node is a cross-community bridge._
- **Why does `Herramienta Paleta` connect `El mapa de las herramientas` to `El encabezado y sus colores`, `La aritmética del contraste`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `Skill /acento — derivar un acento nuevo` connect `Los tonos ocupados y sus reglas` to `Cómo se verifica y se mira`, `El mapa y las etiquetas`, `La tipografía y sus licencias`, `Dar de alta una herramienta`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **What connects `EXTENSIONES`, `$schema`, `PreToolUse` to the rest of the system?**
  _339 weakly-connected nodes found - possible documentation gaps or missing edges._