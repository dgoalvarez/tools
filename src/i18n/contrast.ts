/**
 * Los textos de la herramienta de contraste, en los dos idiomas.
 *
 * Van aparte de `ui.ts` porque aquel es el andamiaje que comparten todas
 * las páginas y este es el contenido de una sola. Mezclarlos haría que
 * cada herramienta nueva engordara un archivo que ya no lee nadie.
 */
import type { T } from './config';

export const CONTRASTE = {
  // ---------- Los dos colores ----------
  colorTexto: { es: 'Color del texto', en: 'Text colour' },
  colorFondo: { es: 'Color del fondo', en: 'Background colour' },
  /**
   * Era «Intercambiar texto y fondo». Puesto entre las dos tarjetas ya
   * se ve qué intercambia, y la frase larga abría un hueco de 245 px
   * entre ellas que no servía para nada. El nombre completo se queda en
   * el `title`, para quien pase el ratón.
   */
  intercambiar: { es: 'Intercambiar', en: 'Swap' },
  intercambiarLargo: { es: 'Intercambiar texto y fondo', en: 'Swap text and background' },
  cuentagotas: { es: 'Tomar un color de la pantalla', en: 'Pick a colour from the screen' },
  /** Lo que hace la muestra: abrir el selector del sistema. */
  elegirAMano: { es: 'Elegir un color', en: 'Choose a colour' },
  formatoLibre: {
    es: 'Hex, rgb(), hsl(), oklch() o un nombre como «teal».',
    en: 'Hex, rgb(), hsl(), oklch() or a name like “teal”.',
  },
  noEsColor: { es: 'Eso no es un color', en: 'That is not a colour' },
  avisoAlfa: {
    es: 'Tiene transparencia. Se mide el color que resulta de mezclarlo con el fondo, porque es el que se ve.',
    en: 'It has transparency. What gets measured is the colour it blends into over the background, because that is the one you see.',
  },

  // ---------- El texto que se juzga ----------
  tamano: { es: 'Tamaño', en: 'Size' },
  grosor: { es: 'Grosor', en: 'Weight' },
  textoGrande: { es: 'Cuenta como texto grande', en: 'Counts as large text' },
  textoGrandePor: {
    es: 'Desde 24 px, o desde 18.66 px en negrita. WCAG le baja el listón de 4.5 a 3.',
    en: 'From 24 px, or from 18.66 px when bold. WCAG lowers the bar from 4.5 to 3.',
  },
  muestra: {
    es: 'El zorro veloz salta sobre el perro perezoso.',
    en: 'The quick brown fox jumps over the lazy dog.',
  },

  // ---------- WCAG 2.2 ----------
  wcagTitulo: { es: 'WCAG 2.2', en: 'WCAG 2.2' },
  wcagEtiqueta: { es: 'Norma vigente', en: 'Current standard' },
  wcagRazon: { es: 'Razón de contraste', en: 'Contrast ratio' },
  wcagComponentes: {
    es: 'Controles, iconos y bordes de campos (3:1)',
    en: 'Controls, icons and field borders (3:1)',
  },

  // ---------- APCA ----------
  apcaTitulo: { es: 'APCA', en: 'APCA' },
  apcaEtiqueta: { es: 'Borrador de WCAG 3.0', en: 'WCAG 3.0 draft' },
  apcaNoEsNorma: {
    es: 'Todavía no se puede citar como cumplimiento. Se enseña porque predice mejor lo que de verdad se lee.',
    en: 'It cannot be cited for compliance yet. It is shown because it predicts real legibility better.',
  },
  apcaLc: { es: 'Contraste de luminosidad (Lc)', en: 'Lightness contrast (Lc)' },
  apcaMinimo: { es: 'Tamaño mínimo con este grosor', en: 'Minimum size at this weight' },
  apcaPasa: { es: 'Vale para este texto', en: 'Fine for this text' },
  apcaInsuficiente: { es: 'Se queda corto', en: 'Falls short' },
  apcaSoloDecorativo: { es: 'Solo decorativo', en: 'Decorative only' },
  apcaSoloDecorativoPor: {
    es: 'Sirve para un elemento que nadie tiene que leer. Para texto, no.',
    en: 'Fine for something nobody has to read. Not for text.',
  },
  apcaProhibido: { es: 'No vale para texto', en: 'Not usable for text' },
  apcaProhibidoPor: {
    es: 'A ningún tamaño ni con ningún grosor.',
    en: 'At no size and at no weight.',
  },
  apcaPolaridadClara: {
    es: 'Texto claro sobre fondo oscuro',
    en: 'Light text on a dark background',
  },
  apcaPolaridadOscura: {
    es: 'Texto oscuro sobre fondo claro',
    en: 'Dark text on a light background',
  },

  // ---------- Cuando no coinciden ----------
  desacuerdoTitulo: { es: 'Los dos no dicen lo mismo', en: 'The two disagree' },
  desacuerdoWcagSi: {
    es: 'WCAG 2.2 lo aprueba y APCA no. WCAG solo compara la luminancia de los dos colores: no sabe de qué tamaño ni de qué grosor es la letra, ni si es clara sobre oscuro o al revés. APCA sí, y con este tamaño no le llega.',
    en: 'WCAG 2.2 passes it and APCA does not. WCAG only compares the luminance of the two colours: it knows nothing about the size or weight of the type, nor whether it is light on dark or the other way round. APCA does, and at this size it is not enough.',
  },
  desacuerdoApcaSi: {
    es: 'APCA lo aprueba y WCAG 2.2 no. La fórmula de WCAG 2.x castiga de más algunas combinaciones —sobre todo los oscuros medios— por cómo trata la luminancia. Aun así, WCAG 2.2 es lo que se audita: si tienes que cumplir, manda el veredicto de arriba.',
    en: 'APCA passes it and WCAG 2.2 does not. The WCAG 2.x formula over-penalises some combinations — mid-dark tones especially — because of how it handles luminance. Even so, WCAG 2.2 is what gets audited: if you have to comply, the verdict above is the one that counts.',
  },

  // ---------- La sugerencia ----------
  sugerenciaTitulo: {
    es: 'El color más cercano que sí pasa',
    en: 'The nearest colour that does pass',
  },
  sugerenciaComo: {
    es: 'Se mueve solo la luminosidad en OKLCH; el tono y el croma se conservan, así que sigue siendo el mismo color.',
    en: 'Only the lightness moves, in OKLCH; hue and chroma stay put, so it is still the same colour.',
  },
  sugerenciaOscurecer: { es: 'Oscureciéndolo', en: 'Darker' },
  sugerenciaAclarar: { es: 'Aclarándolo', en: 'Lighter' },
  sugerenciaCroma: {
    es: 'Hubo que bajarle el croma: a esa luminosidad, el color original no se puede representar en pantalla.',
    en: 'Its chroma had to come down: at that lightness the original colour cannot be shown on screen.',
  },
  sugerenciaUsar: { es: 'Usar este color', en: 'Use this colour' },
  sugerenciaNinguna: {
    es: 'Con este fondo no hay ninguna luminosidad de este mismo tono que llegue al mínimo. Habrá que cambiar el fondo, el tono o el tamaño.',
    en: 'Against this background, no lightness of this same hue reaches the minimum. The background, the hue or the size will have to change.',
  },

  // ---------- Compartir ----------
  copiar: { es: 'Copiar', en: 'Copy' },
  copiado: { es: 'Copiado', en: 'Copied' },
  copiarEnlace: { es: 'Copiar el enlace de este cálculo', en: 'Copy the link to this check' },

  // ---------- Veredictos ----------
  pasa: { es: 'Pasa', en: 'Pass' },
  noPasa: { es: 'No pasa', en: 'Fail' },
  // ---------- Lo que se pliega ----------
  dosFormasTitulo: { es: 'Por qué hay dos medidas', en: 'Why there are two measures' },
  dosFormasCuerpo: {
    es: 'WCAG 2.2 es la norma vigente y solo compara la luminancia de los dos colores: no sabe de qué tamaño ni de qué grosor es la letra. APCA sí, y además distingue si el texto es claro sobre oscuro o al revés, porque no se lee igual.',
    en: 'WCAG 2.2 is the current standard and only compares the luminance of the two colours: it knows nothing about the size or weight of the type. APCA does, and it also tells apart light-on-dark from dark-on-light, because they do not read the same.',
  },
  numerosTitulo: { es: 'De dónde salen los números', en: 'Where the numbers come from' },
  numerosCuerpo: {
    es: 'Ninguno de los dos algoritmos está reescrito aquí: WCAG 2.x se calcula con culori y APCA con apca-w3, que es su implementación oficial. Los resultados están comprobados contra la calculadora de WebAIM y contra los valores canónicos de APCA.',
    en: 'Neither algorithm is reimplemented here: WCAG 2.x is computed with culori and APCA with apca-w3, its official implementation. The results are checked against the WebAIM calculator and against APCA’s canonical values.',
  },

  // ---------- El selector ----------
  espacio: { es: 'Espacio de color', en: 'Colour space' },
  /** El cuarto modo: el cuadrado de saturación y brillo con el tono. */
  visual: { es: 'Visual', en: 'Visual' },
  planoEtiqueta: {
    es: 'Cuadro de saturación y brillo. Muévete con las flechas.',
    en: 'Saturation and brightness square. Move with the arrow keys.',
  },
  saturacion: { es: 'saturación', en: 'saturation' },
  brillo: { es: 'brillo', en: 'brightness' },
  tono: { es: 'Tono', en: 'Hue' },
  ajustarCon: { es: 'Ajustar con barras', en: 'Adjust with sliders' },
} satisfies Record<string, T>;

/**
 * El nombre de cada canal, por espacio.
 *
 * Van con palabras y no con las letras de siempre (L, C, H) porque «Tono»
 * lo entiende cualquiera y «H» solo quien ya sabía. La letra se queda al
 * lado, en pequeño, para quien la busca.
 */
export const CANALES: Record<string, T> = {
  'oklch.l': { es: 'Luminosidad', en: 'Lightness' },
  'oklch.c': { es: 'Croma', en: 'Chroma' },
  'oklch.h': { es: 'Tono', en: 'Hue' },
  'rgb.r': { es: 'Rojo', en: 'Red' },
  'rgb.g': { es: 'Verde', en: 'Green' },
  'rgb.b': { es: 'Azul', en: 'Blue' },
  'hsl.h': { es: 'Tono', en: 'Hue' },
  'hsl.s': { es: 'Saturación', en: 'Saturation' },
  'hsl.l': { es: 'Luminosidad', en: 'Lightness' },
};

/** Los grosores, con el nombre que usa la gente y no solo el número. */
export const GROSORES: { valor: number; nombre: T }[] = [
  { valor: 300, nombre: { es: 'Fina', en: 'Light' } },
  { valor: 400, nombre: { es: 'Normal', en: 'Regular' } },
  { valor: 500, nombre: { es: 'Media', en: 'Medium' } },
  { valor: 600, nombre: { es: 'Seminegrita', en: 'Semibold' } },
  { valor: 700, nombre: { es: 'Negrita', en: 'Bold' } },
  { valor: 900, nombre: { es: 'Negra', en: 'Black' } },
];
