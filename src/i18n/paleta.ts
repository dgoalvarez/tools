/**
 * Los textos de la herramienta de paletas, en los dos idiomas.
 */
import type { T } from './config';

export const PALETA = {
  // ---------- Las tonalidades ----------
  tonalidades: { es: 'Tonalidades', en: 'Hues' },
  anadir: { es: 'Añadir una tonalidad', en: 'Add a hue' },
  quitar: { es: 'Quitar', en: 'Remove' },
  nombreTonalidad: { es: 'Nombre', en: 'Name' },
  colorSemilla: { es: 'Color', en: 'Colour' },
  /** Aparece cuando dos tonalidades se llaman igual. */
  nombreRepetido: {
    es: 'Hay dos tonalidades con este nombre: sus variables chocarían y la segunda pisaría a la primera.',
    en: 'Two hues share this name: their variables would collide and the second would overwrite the first.',
  },

  // ---------- La rampa ----------
  laRampa: { es: 'La rampa', en: 'The ramp' },
  pasos: { es: 'Pasos', en: 'Steps' },
  claridadMax: { es: 'El más claro', en: 'Lightest' },
  claridadMin: { es: 'El más oscuro', en: 'Darkest' },
  cromaCentro: { es: 'Croma en el centro', en: 'Chroma in the middle' },
  derivaTono: { es: 'Deriva de tono', en: 'Hue drift' },
  /**
   * Lo que hace la deriva, dicho corto. Es el mando que nadie reconoce a
   * la primera y el que más cambia el resultado.
   */
  derivaAyuda: {
    es: 'Gira el tono entre los extremos: los pasos oscuros hacia un lado y los claros hacia el otro. Es lo que hace que un azul oscuro tire a violeta y uno claro a cian, que es como lo ve el ojo. El paso anclado no gira nunca.',
    en: 'Turns the hue between the ends: dark steps one way, light steps the other. It is what makes a dark blue lean violet and a light one lean cyan, which is how the eye sees it. The anchored step never turns.',
  },

  // ---------- Los nombres de las variables ----------
  nombres: { es: 'Los nombres', en: 'The names' },
  prefijo: { es: 'Prefijo', en: 'Prefix' },
  prefijoAyuda: {
    es: 'Cada tonalidad usa su propio nombre. El prefijo va delante de todas: con «tema» sale --tema-color1-500. Vacío, salen sin prefijo.',
    en: 'Each hue uses its own name. The prefix goes before all of them: with “theme” you get --theme-color1-500. Leave it empty and they come out bare.',
  },

  // ---------- La cuadrícula ----------
  laPaleta: { es: 'La paleta', en: 'The palette' },
  /** Lo que hace pulsar una casilla, dicho una vez encima de la rejilla. */
  pulsaParaCopiar: {
    es: 'Pulsa un color para copiarlo.',
    en: 'Click a colour to copy it.',
  },
  copiarColor: { es: 'Copiar', en: 'Copy' },
  /** Lo que dice el aviso flotante al copiar. */
  copiadoAviso: { es: 'Copiado:', en: 'Copied:' },
  ajustar: { es: 'Ajustar este paso', en: 'Tune this step' },
  ancla: { es: 'tu color', en: 'your colour' },
  anclaExplicado: {
    es: 'Este es el color que pegaste, intacto. La rampa se ha construido alrededor de él.',
    en: 'This is the colour you pasted, untouched. The ramp was built around it.',
  },
  tocado: { es: 'tocado a mano', en: 'hand-tuned' },
  recortado: { es: 'al tope de la pantalla', en: 'at the screen’s limit' },
  recortadoExplicado: {
    es: 'La curva pedía más croma del que sRGB puede pintar a esta luminosidad y este tono. Es el techo de la pantalla, no un fallo de la rampa.',
    en: 'The curve asked for more chroma than sRGB can paint at this lightness and hue. That is the screen’s ceiling, not a flaw in the ramp.',
  },

  // ---------- El detalle ----------
  conBlanco: { es: 'Texto blanco', en: 'White text' },
  conNegro: { es: 'Texto negro', en: 'Black text' },
  razon: { es: 'Razón', en: 'Ratio' },
  retocar: { es: 'Retocar este paso', en: 'Tune this step' },
  devolver: { es: 'Volver a lo calculado', en: 'Back to calculated' },
  cerrar: { es: 'Cerrar el detalle', en: 'Close the detail' },
  anclarEn: { es: 'Anclar mi color en', en: 'Anchor my colour at' },
  anclaAuto: { es: 'Donde caiga', en: 'Where it lands' },

  // ---------- Las tintas ----------
  tintas: { es: 'Qué tinta aguanta cada paso', en: 'What ink each step can carry' },
  tintasIntro: {
    es: 'Con qué color de texto se puede escribir encima de cada paso, a 4,5:1 —el AA de WCAG 2.2 para texto de cuerpo—. Los pasos del centro casi nunca aguantan ninguno de los dos: sirven de fondo, de borde y de icono grande, no de texto.',
    en: 'Which text colour you can write on each step at 4.5:1 — WCAG 2.2 AA for body text. The middle steps almost never take either: they work as background, border and large icon, not as text.',
  },
  leyendaBlanco: { es: 'aguanta blanco', en: 'takes white' },
  leyendaNegro: { es: 'aguanta negro', en: 'takes black' },
  leyendaNinguno: { es: 'ninguno de los dos', en: 'neither one' },

  // ---------- Volver a lo de fábrica ----------
  deFabrica: { es: 'Volver a lo de fábrica', en: 'Back to defaults' },
  cromaAyuda: {
    es: 'Al 0 % el croma es el mismo en toda la rampa; al 100 % sube en el centro como en una paleta al uso; al 200 % se exagera. Lo que la pantalla no pueda pintar se recorta y se avisa.',
    en: 'At 0 % the chroma is the same across the ramp; at 100 % it rises in the middle like a usual palette; at 200 % it is exaggerated. Whatever the screen cannot paint is clipped and flagged.',
  },

  // ---------- Avisos ----------
  escaleraDeformada: {
    es: 'Al forzar el anclaje, esta rampa deja de compartir la escalera con las demás: sus pasos ya no pesan lo mismo que los del resto.',
    en: 'Forcing the anchor makes this ramp stop sharing the ladder with the others: its steps no longer weigh the same as the rest.',
  },
  retoqueRompe: {
    es: 'Hay un paso retocado que se sale del orden: es más claro que el de arriba o más oscuro que el de abajo, así que la rampa deja de ir de claro a oscuro. Se respeta —el retoque es tuyo— pero conviene saberlo.',
    en: 'A tuned step is out of order: it is lighter than the one above or darker than the one below, so the ramp stops going light to dark. It is respected — the tweak is yours — but worth knowing.',
  },
  pasosJuntos: {
    es: 'Con este rango y este número de pasos, algunos quedan tan juntos que no se distinguen: son dos variables para el mismo color. Sube el rango de claridad o baja el número de pasos.',
    en: 'With this range and this step count, some steps land so close together that you cannot tell them apart: two variables for the same colour. Widen the lightness range or lower the step count.',
  },
  retoquesDormidos: {
    es: 'Hay retoques guardados en pasos que ahora no existen. No se han perdido: vuelven al subir el número de pasos.',
    en: 'There are saved tweaks on steps that do not exist right now. They are not lost: they come back when you raise the step count.',
  },
  /**
   * El aviso que hay que dar una vez, porque es lo primero que alguien
   * va a reportar como fallo.
   */
  soloSrgb: {
    es: 'Todo se calcula en sRGB, que es lo que cualquier pantalla puede pintar. Las paletas de Tailwind y de Radix apuntan a P3, así que sus pasos intermedios se ven algo más vivos que estos en una pantalla que lo soporte.',
    en: 'Everything is computed in sRGB, which is what any screen can paint. Tailwind’s and Radix’s palettes target P3, so their middle steps look a little more vivid than these on a screen that supports it.',
  },

  // ---------- El CSS ----------
  cssTitulo: { es: 'El CSS, listo para copiar', en: 'The CSS, ready to copy' },
  cssIntro: {
    es: 'Sale en oklch() y no en hexadecimal a propósito: el hexadecimal es de ocho bits y redondearlo mueve la luminosidad lo bastante como para romper la escalera. Debajo tienes los hexadecimales por si los necesitas.',
    en: 'It comes out as oklch() and not hex on purpose: hex is eight bits and rounding it moves the lightness enough to break the ladder. Hex values are below if you need them.',
  },
  formatoTitulo: { es: 'Formato', en: 'Format' },
  queHaceCada: { es: '¿Qué hace cada mando?', en: 'What does each control do?' },
  formatoOklch: { es: 'oklch()', en: 'oklch()' },
  formatoHex: { es: 'Hexadecimal', en: 'Hex' },
  copiarCss: { es: 'Copiar', en: 'Copy' },
  copiado: { es: 'Copiado', en: 'Copied' },
} satisfies Record<string, T>;
