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
  grados: { es: '°', en: '°' },
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
    es: 'Cada tonalidad usa su propio nombre. El prefijo va delante de todas: con «color» sale --color-azul-500.',
    en: 'Each hue uses its own name. The prefix goes before all of them: with “color” you get --color-blue-500.',
  },

  // ---------- La cuadrícula ----------
  laPaleta: { es: 'La paleta', en: 'The palette' },
  /** Lo que se lee al pulsar una casilla, para el lector de pantalla. */
  verDetalle: { es: 'Ver el detalle de', en: 'See the detail of' },
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
  /** El aviso de los pasos que no aguantan texto de ninguna de las dos tintas. */
  sinTinta: { es: 'sin tinta', en: 'no ink' },
  sinTintaExplicado: {
    es: 'Ni el blanco ni el negro llegan a 4,5:1 sobre este paso, así que no vale para texto de cuerpo. Sí para fondos, bordes e iconos grandes.',
    en: 'Neither white nor black reaches 4.5:1 on this step, so it is no good for body text. It is fine for backgrounds, borders and large icons.',
  },

  // ---------- El detalle ----------
  conBlanco: { es: 'Texto blanco', en: 'White text' },
  conNegro: { es: 'Texto negro', en: 'Black text' },
  razon: { es: 'Razón', en: 'Ratio' },
  copiarHex: { es: 'Copiar el hex', en: 'Copy the hex' },
  retocar: { es: 'Retocar este paso', en: 'Tune this step' },
  devolver: { es: 'Volver a lo calculado', en: 'Back to calculated' },
  cerrar: { es: 'Cerrar el detalle', en: 'Close the detail' },
  anclarAqui: { es: 'Anclar mi color aquí', en: 'Anchor my colour here' },
  anclarAyuda: {
    es: 'Mueve tu color a este paso. Sirve para los amarillos y los cianes, que por su luminosidad caen en un paso claro aunque sean el color principal de una marca.',
    en: 'Moves your colour to this step. Useful for yellows and cyans, which by their lightness land on a light step even when they are a brand’s main colour.',
  },
  soltarAncla: { es: 'Dejar que caiga solo', en: 'Let it fall where it lands' },

  // ---------- Avisos ----------
  avisos: { es: 'Lo que conviene saber', en: 'Worth knowing' },
  escaleraDeformada: {
    es: 'Al forzar el anclaje, esta rampa deja de compartir la escalera con las demás: sus pasos ya no pesan lo mismo que los del resto.',
    en: 'Forcing the anchor makes this ramp stop sharing the ladder with the others: its steps no longer weigh the same as the rest.',
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
  formatoOklch: { es: 'oklch()', en: 'oklch()' },
  formatoHex: { es: 'Hexadecimal', en: 'Hex' },
  copiarCss: { es: 'Copiar', en: 'Copy' },
  copiado: { es: 'Copiado', en: 'Copied' },
} satisfies Record<string, T>;
