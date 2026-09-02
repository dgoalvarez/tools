/**
 * Los textos de la herramienta de escala tipográfica, en los dos idiomas.
 */
import type { T } from './config';

export const ESCALA = {
  // ---------- Escala fluida ----------
  /**
   * El mando que gobierna la herramienta entera.
   *
   * Encendido, cada paso es un `clamp()` que crece con la ventana y hay
   * que decidir dos tamaños base, dos proporciones y entre qué anchuras.
   * Apagado, cada paso es un número y todo eso sobra. Va arriba del todo
   * porque es la primera decisión, no una más.
   */
  fluida: { es: 'Escala fluida', en: 'Fluid scale' },
  fluidaSi: { es: 'Cada paso crece con la ventana', en: 'Each step grows with the window' },
  fluidaNo: { es: 'Cada paso vale un solo tamaño', en: 'Each step is a single size' },
  /** Los mismos campos, cuando no hay dos extremos que distinguir. */
  baseUnica: { es: 'Tamaño base', en: 'Base size' },
  razonUnica: { es: 'Proporción', en: 'Ratio' },

  // ---------- Los controles ----------
  ajustes: { es: 'La escala', en: 'The scale' },
  baseMin: { es: 'Base en la ventana estrecha', en: 'Base at the narrow end' },
  baseMax: { es: 'Base en la ventana ancha', en: 'Base at the wide end' },
  razonMin: { es: 'Proporción estrecha', en: 'Narrow ratio' },
  razonMax: { es: 'Proporción ancha', en: 'Wide ratio' },
  personalizada: { es: 'A medida', en: 'Custom' },
  pasos: { es: 'Pasos', en: 'Steps' },
  arriba: { es: 'Arriba', en: 'Up' },
  abajo: { es: 'Abajo', en: 'Down' },
  ventana: { es: 'Ventana', en: 'Viewport' },
  anchoMin: { es: 'Ancho mínimo', en: 'Minimum width' },
  anchoMax: { es: 'Ancho máximo', en: 'Maximum width' },
  prefijo: { es: 'Prefijo', en: 'Prefix' },

  // ---------- La tabla ----------
  /**
   * Los títulos de los dos acordeones dicen QUÉ hay dentro, no para qué
   * sirve. Cerrado, el título es lo único que se ve: «A cuántos píxeles
   * queda de verdad» describía una idea; «La tabla de tamaños» dice que
   * dentro hay una tabla, que es lo que hay que decidir antes de abrir.
   */
  tablaTitulo: {
    es: 'La tabla de tamaños, anchura por anchura',
    en: 'The table of sizes, width by width',
  },
  tablaIntro: {
    es: 'Esta es la tabla que casi ninguna herramienta enseña, y es donde se ven los problemas: un titular que ya está al tope en un portátil mientras el cuerpo sigue pegado a su mínimo se lee «grande y apretado» a la vez.',
    en: 'This is the table almost no tool shows, and it is where the problems appear: a heading already maxed out on a laptop while the body is still stuck at its minimum reads as “big and cramped” at once.',
  },
  columnaPaso: { es: 'Paso', en: 'Step' },
  columnaLlenoCorto: { es: '95 %', en: '95%' },
  llenoAyuda: {
    es: 'La anchura de ventana a la que ese paso ya casi ha terminado de crecer. Si los titulares llegan mucho antes que el cuerpo, la jerarquía se descompensa en los tamaños intermedios.',
    en: 'The viewport width at which that step has almost finished growing. If headings get there long before the body does, the hierarchy falls out of balance at the in-between sizes.',
  },
  // ---------- Saltarse pasos ----------
  apagar: { es: 'Saltarse este paso', en: 'Skip this step' },
  encender: { es: 'Volver a usar este paso', en: 'Use this step again' },
  esLaBase: { es: '· base', en: '· base' },
  saltadosAyuda: {
    es: 'Los pasos apagados siguen a la vista para que se vea el hueco que dejan, pero no salen en el CSS ni en la tabla, y los nombres del esquema se recolocan entre los que quedan.',
    en: 'Switched-off steps stay visible so you can see the gap they leave, but they are left out of the CSS and the table, and the scheme’s names shuffle across whatever remains.',
  },

  nunca: { es: 'no crece', en: 'does not grow' },

  // ---------- La muestra ----------
  muestraTitulo: { es: 'La escala, a tu ventana', en: 'The scale, at your window' },
  /** El mismo título cuando la escala no crece con la ventana. */
  muestraTituloFijo: { es: 'La escala', en: 'The scale' },
  muestraTexto: { es: 'Tipografía que respira', en: 'Type that breathes' },

  // ---------- El CSS ----------
  cssTitulo: { es: 'El CSS, listo para copiar', en: 'The CSS, ready to copy' },
  cssRaiz: {
    es: 'Calculado sobre una raíz de 16 px, que es lo que traen todos los navegadores. El término en rem no es adorno: un font-size que fuera solo vw dejaría de responder al zoom.',
    en: 'Computed against a 16 px root, which is what every browser ships. The rem term is not decoration: a font-size made only of vw would stop responding to zoom.',
  },
  copiarCss: { es: 'Copiar el CSS', en: 'Copy the CSS' },
  copiado: { es: 'Copiado', en: 'Copied' },

  // ---------- Avisos ----------
  cruceTitulo: { es: 'Dos pasos se cruzan', en: 'Two steps cross over' },
  cruceCuerpo: {
    es: 'A esa anchura el paso pequeño alcanza o supera al grande, así que la jerarquía se invierte. Suele venir de una proporción menor que uno o de un base máximo por debajo del mínimo.',
    en: 'At that width the smaller step catches up with or overtakes the larger one, so the hierarchy inverts. It usually comes from a ratio below one or a maximum base below the minimum.',
  },
  cruceEn: { es: 'alcanza a', en: 'catches up with' },
  aA: { es: 'a', en: 'at' },
  // ---------- Nombres de los pasos ----------
  nombresTitulo: { es: 'Nombres', en: 'Names' },
  esquema: { es: 'Esquema', en: 'Scheme' },
  aMedida: { es: 'A medida', en: 'Custom' },
  nombreDe: { es: 'Nombre del paso', en: 'Name of step' },
  repetidoTitulo: { es: 'Hay nombres repetidos', en: 'Some names are repeated' },
  repetidoCuerpo: {
    es: 'Dos pasos con el mismo nombre declaran dos veces la misma variable CSS: la segunda pisa a la primera y uno de los dos tamaños desaparece sin avisar.',
    en: 'Two steps with the same name declare the same CSS variable twice: the second overrides the first and one of the two sizes silently disappears.',
  },
} satisfies Record<string, T>;

/** El nombre de cada esquema, para el selector. */
export const NOMBRES_ESQUEMA: Record<string, T> = {
  numerico: { es: 'Numérico · --step-1', en: 'Numeric · --step-1' },
  semantico: { es: 'Semántico · --body, --title', en: 'Semantic · --body, --title' },
  material: { es: 'Material · --body, --headline', en: 'Material · --body, --headline' },
  tailwind: { es: 'Tailwind · --base, --lg, --xl', en: 'Tailwind · --base, --lg, --xl' },
};

/** Los nombres de las proporciones clásicas, que vienen de la música. */
export const NOMBRES_RAZON = {
  segundaMenor: { es: 'Segunda menor', en: 'Minor second' },
  segundaMayor: { es: 'Segunda mayor', en: 'Major second' },
  terceraMenor: { es: 'Tercera menor', en: 'Minor third' },
  terceraMayor: { es: 'Tercera mayor', en: 'Major third' },
  cuarta: { es: 'Cuarta justa', en: 'Perfect fourth' },
  aumentada: { es: 'Cuarta aumentada', en: 'Augmented fourth' },
  quinta: { es: 'Quinta justa', en: 'Perfect fifth' },
  aurea: { es: 'Proporción áurea', en: 'Golden ratio' },
} satisfies Record<string, T>;
