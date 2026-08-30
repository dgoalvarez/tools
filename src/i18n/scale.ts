/**
 * Los textos de la herramienta de escala tipográfica, en los dos idiomas.
 */
import type { T } from './config';

export const ESCALA = {
  // ---------- Los controles ----------
  ajustes: { es: 'La escala', en: 'The scale' },
  baseMin: { es: 'Base en la ventana estrecha', en: 'Base at the narrow end' },
  baseMax: { es: 'Base en la ventana ancha', en: 'Base at the wide end' },
  baseAyuda: {
    es: 'El paso 0, que suele ser el texto del cuerpo.',
    en: 'Step 0, usually your body text.',
  },
  razonMin: { es: 'Proporción estrecha', en: 'Narrow ratio' },
  razonMax: { es: 'Proporción ancha', en: 'Wide ratio' },
  razonAyuda: {
    es: 'Cuánto crece cada paso respecto al anterior. Dos proporciones distintas hacen que en pantallas grandes la jerarquía se abra más.',
    en: 'How much each step grows over the previous one. Two different ratios let the hierarchy open up more on large screens.',
  },
  personalizada: { es: 'A medida', en: 'Custom' },
  pasos: { es: 'Pasos', en: 'Steps' },
  arriba: { es: 'Arriba', en: 'Up' },
  abajo: { es: 'Abajo', en: 'Down' },
  ventana: { es: 'Ventana', en: 'Viewport' },
  anchoMin: { es: 'Ancho mínimo', en: 'Minimum width' },
  anchoMax: { es: 'Ancho máximo', en: 'Maximum width' },
  anchoAyuda: {
    es: 'Entre estos dos anchos el tamaño crece; fuera, se queda fijo.',
    en: 'Between these two widths the size grows; outside them it stays put.',
  },
  prefijo: { es: 'Prefijo', en: 'Prefix' },

  // ---------- La tabla ----------
  tablaTitulo: { es: 'A cuántos píxeles queda de verdad', en: 'What it really measures' },
  tablaIntro: {
    es: 'Esta es la tabla que casi ninguna herramienta enseña, y es donde se ven los problemas: un titular que ya está al tope en un portátil mientras el cuerpo sigue pegado a su mínimo se lee «grande y apretado» a la vez.',
    en: 'This is the table almost no tool shows, and it is where the problems appear: a heading already maxed out on a laptop while the body is still stuck at its minimum reads as “big and cramped” at once.',
  },
  columnaPaso: { es: 'Paso', en: 'Step' },
  columnaLleno: { es: 'Al 95 % de su máximo', en: 'At 95% of its max' },
  columnaLlenoCorto: { es: '95 %', en: '95%' },
  llenoAyuda: {
    es: 'La anchura de ventana a la que ese paso ya casi ha terminado de crecer. Si los titulares llegan mucho antes que el cuerpo, la jerarquía se descompensa en los tamaños intermedios.',
    en: 'The viewport width at which that step has almost finished growing. If headings get there long before the body does, the hierarchy falls out of balance at the in-between sizes.',
  },
  nunca: { es: 'no crece', en: 'does not grow' },

  // ---------- La muestra ----------
  muestraTitulo: { es: 'A tu ventana, ahora mismo', en: 'At your window, right now' },
  muestraIntro: {
    es: 'Cada línea usa su clamp() de verdad. Estrecha o ensancha la ventana y verás la escala moverse.',
    en: 'Each line uses its real clamp(). Narrow or widen the window and you will see the scale move.',
  },
  muestraTexto: { es: 'Tipografía que respira', en: 'Type that breathes' },

  // ---------- El CSS ----------
  cssTitulo: { es: 'Para pegar en tu hoja de estilos', en: 'To paste into your stylesheet' },
  cssRaiz: {
    es: 'Calculado sobre una raíz de 16 px, que es lo que traen todos los navegadores. El término en rem no es adorno: un font-size que fuera solo vw dejaría de responder al zoom.',
    en: 'Computed against a 16 px root, which is what every browser ships. The rem term is not decoration: a font-size made only of vw would stop responding to zoom.',
  },
  copiarCss: { es: 'Copiar el CSS', en: 'Copy the CSS' },
  copiado: { es: 'Copiado', en: 'Copied' },
  copiarEnlace: { es: 'Copiar el enlace de esta escala', en: 'Copy the link to this scale' },

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
  nombresAyuda: {
    es: 'Cada paso se puede renombrar en la tabla. Un nombre vacío lo devuelve a su número.',
    en: 'Each step can be renamed in the table. An empty name sends it back to its number.',
  },
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
