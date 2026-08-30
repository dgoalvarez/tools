/**
 * El paso a paso de cada herramienta.
 *
 * Sustituye al cajón de «¿Cómo funciona?» que había antes al final de la
 * página. El cajón tenía un problema que no se arregla escribiendo mejor:
 * estaba abajo, cerrado, y explicaba los controles lejos de los controles.
 * Se abría poco, y quien lo abría tenía que ir y volver.
 *
 * Esto señala el control de verdad mientras lo explica. Se abre con el
 * botón «?» del encabezado, nunca solo: nadie llega a una herramienta
 * queriendo que le expliquen algo antes de verlo.
 *
 * ---------------------------------------------------------------------
 * La regla de los selectores
 *
 * Un paso apunta a un `[data-tour="..."]`, nunca a una clase de Tailwind
 * ni a una etiqueta. Una utilidad cambia al reordenar la maqueta y el
 * tour se rompería sin que nadie se enterara: señalaría al vacío.
 *
 * `scripts/check-pages.mjs` comprueba en cada compilación que todos los
 * `data-tour` de aquí existen en el HTML publicado de esa herramienta. Un
 * paso que apunta a algo que ya no está tumba la compilación.
 *
 * `opcional: true` es para lo que solo aparece a veces —el aviso de que
 * la cita cae en otro día, el color que sí pasaría—. Esos no se
 * comprueban, y si no están, el paso se enseña centrado sin señalar nada.
 */
import type { T } from './config';
import type { ToolKey } from './routes';

export interface PasoTour {
  /** El valor de `data-tour` del elemento que señala. */
  ancla: string;
  titulo: T;
  cuerpo: T;
  /** Solo aparece en algunos estados: no se exige que exista. */
  opcional?: boolean;
}

export const TOUR: Record<ToolKey, PasoTour[]> = {
  // ------------------------------------------------------------ husos
  timezones: [
    {
      ancla: 'cita',
      titulo: { es: 'La hora que quieres decir', en: 'The time you want to say' },
      cuerpo: {
        es: 'Escribe el día y la hora de la cita tal y como la tienes tú en la cabeza. Todo lo demás sale de aquí.',
        en: 'Type the day and time of the meeting exactly as you have it in your head. Everything else follows from this.',
      },
    },
    {
      ancla: 'origen',
      titulo: { es: 'De dónde es esa hora', en: 'Where that time is from' },
      cuerpo: {
        es: 'Va plegado porque casi nunca cambia: quien agenda lo hace desde su propia zona un día tras otro. Ábrelo para cambiarla, o pulsa «Mi ubicación» y la coge del navegador.',
        en: 'It stays folded because it rarely changes: whoever schedules does it from their own zone day after day. Open it to change it, or press “My location” and it takes it from the browser.',
      },
    },
    {
      ancla: 'destinos',
      titulo: { es: 'A quién se la vas a decir', en: 'Who you are saying it to' },
      cuerpo: {
        es: 'Busca por ciudad —en español o en inglés— o por código postal de Estados Unidos. El código postal está porque siete estados están partidos entre dos husos: en Florida o en Tennessee, saber el estado no basta.',
        en: 'Search by city — in English or Spanish — or by US ZIP code. The ZIP code is there because seven states are split between two zones: in Florida or Tennessee, knowing the state is not enough.',
      },
    },
    {
      ancla: 'resultados',
      titulo: { es: 'La hora de cada uno', en: 'Everyone’s time' },
      cuerpo: {
        es: 'Cada ficha trae la hora allí, la diferencia con la tuya y la abreviatura del huso —EST, CDT—, que es lo que la gente escribe en los correos.',
        en: 'Each card carries the time there, the difference from yours, and the zone abbreviation — EST, CDT — which is what people write in emails.',
      },
    },
    {
      ancla: 'salto',
      titulo: { es: 'El aviso que importa', en: 'The warning that matters' },
      cuerpo: {
        es: 'Cuando allí ya es otro día, sale este aviso en rojo. Es el error que de verdad se comete al agendar: acertar la hora y equivocarse el día.',
        en: 'When it is already another day there, this warning appears in red. It is the mistake people actually make when scheduling: getting the time right and the day wrong.',
      },
      opcional: true,
    },
    {
      ancla: 'frase',
      titulo: { es: 'La frase, no la tabla', en: 'The sentence, not the table' },
      cuerpo: {
        es: 'Lo que de verdad entrega la herramienta es esto: una frase escrita en su hora, con el aviso dentro si hace falta, lista para pegar donde sea. La tabla es el camino; esto es el destino.',
        en: 'What the tool actually delivers is this: a sentence written in their time, with the warning inside it when needed, ready to paste anywhere. The table is the road; this is the destination.',
      },
      opcional: true,
    },
    {
      ancla: 'precision',
      titulo: { es: 'Hasta dónde llega', en: 'How far it goes' },
      cuerpo: {
        es: 'Los husos son exactos a nivel de condado, que es el nivel al que existen de verdad. Los datos son de GeoNames, con licencia CC BY 4.0, y la atribución está ahí por eso.',
        en: 'Zones are exact at county level, which is the level at which they really exist. The data is from GeoNames under a CC BY 4.0 licence, and the attribution is there for that reason.',
      },
    },
  ],

  // -------------------------------------------------------- contraste
  contrast: [
    {
      ancla: 'colores',
      titulo: { es: 'Los dos colores', en: 'The two colours' },
      cuerpo: {
        es: 'Arriba el texto, abajo el fondo. Puedes escribirlos en hex, rgb(), hsl(), oklch() o con un nombre como «teal». El botón del medio los intercambia.',
        en: 'Text on top, background below. Write them as hex, rgb(), hsl(), oklch() or a name like “teal”. The button between them swaps the two.',
      },
    },
    {
      ancla: 'espacio',
      titulo: { es: 'Cuatro formas de elegirlo', en: 'Four ways to pick it' },
      cuerpo: {
        es: 'El cuadro es el de siempre: saturación y brillo arriba, tono abajo. OKLCH, RGB y HSL son barras con nombre. OKLCH es la útil aquí: mover solo su luminosidad cambia el contraste sin cambiar el color.',
        en: 'The square is the familiar one: saturation and brightness on top, hue below. OKLCH, RGB and HSL are named sliders. OKLCH is the useful one here: moving only its lightness changes the contrast without changing the colour.',
      },
    },
    {
      ancla: 'cuentagotas',
      titulo: { es: 'Coger un color de la pantalla', en: 'Grab a colour off the screen' },
      cuerpo: {
        es: 'Toma el color de cualquier punto de la pantalla. Donde el navegador no trae cuentagotas, abre el selector del sistema, que trae el suyo.',
        en: 'Takes the colour from anywhere on screen. Where the browser has no eyedropper, it opens the system picker, which brings its own.',
      },
    },
    {
      ancla: 'forma',
      titulo: {
        es: 'El tamaño y el grosor cambian el veredicto',
        en: 'Size and weight change the verdict',
      },
      cuerpo: {
        es: 'No son decoración. WCAG baja su umbral de 4,5:1 a 3:1 en cuanto el texto cuenta como grande, y APCA calcula a partir de aquí el tamaño mínimo al que ese par de colores es legible.',
        en: 'They are not decoration. WCAG drops its threshold from 4.5:1 to 3:1 as soon as the text counts as large, and APCA uses these to work out the smallest size at which that colour pair is readable.',
      },
    },
    {
      ancla: 'muestra',
      titulo: { es: 'El color de verdad', en: 'The real colour' },
      cuerpo: {
        es: 'El color, al tamaño y al grosor puestos, sobre el fondo puesto. Mirarlo es parte de la comprobación: hay pares que aprueban y aun así se leen mal.',
        en: 'The colour, at the size and weight you set, over the background you set. Looking at it is part of the check: some pairs pass and still read badly.',
      },
    },
    {
      ancla: 'wcag',
      titulo: { es: 'WCAG 2.2 · la norma vigente', en: 'WCAG 2.2 · the standard in force' },
      cuerpo: {
        es: 'La razón entre las dos luminancias. AA es lo que exige la ley en casi todas partes; AAA es el listón alto. La tercera fila es el 3:1 que piden los iconos, los bordes de campo y los controles.',
        en: 'The ratio between the two luminances. AA is what the law requires almost everywhere; AAA is the high bar. The third row is the 3:1 required for icons, field borders and controls.',
      },
    },
    {
      ancla: 'apca',
      titulo: { es: 'APCA · lo que viene', en: 'APCA · what is coming' },
      cuerpo: {
        es: 'Mide la legibilidad en Lc y tiene en cuenta que el texto claro sobre oscuro y el oscuro sobre claro no se comportan igual. Es más fiel a la vista, pero todavía no se puede citar como cumplimiento en una auditoría.',
        en: 'It measures readability in Lc and accounts for the fact that light-on-dark and dark-on-light do not behave the same. It is truer to the eye, but it still cannot be cited as compliance in an audit.',
      },
    },
    {
      ancla: 'desacuerdo',
      titulo: { es: 'Cuando los dos no dicen lo mismo', en: 'When the two disagree' },
      cuerpo: {
        es: 'Pasa, y no es un fallo: miden cosas distintas. Este bloque aparece solo entonces y dice a cuál hacer caso según lo que estés haciendo.',
        en: 'It happens, and it is not a bug: they measure different things. This block only shows up then, and says which one to follow depending on what you are doing.',
      },
      opcional: true,
    },
    {
      ancla: 'sugerencia',
      titulo: { es: 'El color más cercano que sí pasa', en: 'The nearest colour that does pass' },
      cuerpo: {
        es: 'Cuando el par no llega a AA, se busca el color más próximo que sí llega moviendo únicamente la luminosidad en OKLCH. El tono y la saturación se quedan: sigue siendo tu color.',
        en: 'When the pair falls short of AA, it finds the nearest colour that reaches it by moving lightness alone in OKLCH. Hue and saturation stay put: it is still your colour.',
      },
      opcional: true,
    },
  ],

  // ---------------------------------------------------------- escala
  scale: [
    {
      ancla: 'base',
      titulo: { es: 'El tamaño base', en: 'The base size' },
      cuerpo: {
        es: 'Es el paso 0, del que sale todo lo demás. Hay dos porque la escala es fluida: uno para la ventana más estrecha y otro para la más ancha.',
        en: 'This is step 0, and everything else comes from it. There are two because the scale is fluid: one for the narrowest window and one for the widest.',
      },
    },
    {
      ancla: 'razon',
      titulo: { es: 'La proporción entre pasos', en: 'The ratio between steps' },
      cuerpo: {
        es: 'Cada paso es el anterior multiplicado por esto. También hay dos: una razón mayor en pantallas anchas abre más los titulares sin tocar el cuerpo.',
        en: 'Each step is the previous one multiplied by this. There are two here as well: a larger ratio on wide screens opens the headlines up without touching body text.',
      },
    },
    {
      ancla: 'pasos',
      titulo: { es: 'Cuántos', en: 'How many' },
      cuerpo: {
        es: 'Cuántos pasos por encima del base y cuántos por debajo. Los de debajo son los pies de foto y los rótulos pequeños.',
        en: 'How many steps above the base and how many below. The ones below are captions and small labels.',
      },
    },
    {
      ancla: 'ventana',
      titulo: { es: 'Entre qué anchuras se estira', en: 'Between which widths it stretches' },
      cuerpo: {
        es: 'Por debajo del mínimo el tamaño se queda quieto; por encima del máximo, también. Entre medias crece en línea recta, que es exactamente lo que hace clamp().',
        en: 'Below the minimum the size holds still; above the maximum it holds too. In between it grows in a straight line, which is exactly what clamp() does.',
      },
    },
    {
      ancla: 'nombres',
      titulo: { es: 'Cómo se van a llamar', en: 'What they will be called' },
      cuerpo: {
        es: 'De fábrica viene el esquema de Tailwind con el prefijo «text», así que salen --text-sm, --text-base, --text-lg… Cámbialo por el que use tu proyecto, o edita cada nombre a mano en la rampa.',
        en: 'It ships with the Tailwind scheme and the “text” prefix, so you get --text-sm, --text-base, --text-lg… Swap it for whatever your project uses, or edit each name by hand in the ramp.',
      },
    },
    {
      ancla: 'rampa',
      titulo: { es: 'La escala', en: 'The scale' },
      cuerpo: {
        es: 'Cada línea trae su nombre de variable y el par de tamaños que genera: el mínimo y el máximo del clamp(). El nombre se edita aquí mismo, pulsando encima.',
        en: 'Each line carries its variable name and the pair of sizes it generates: the clamp’s minimum and maximum. Names are edited right here, by clicking on them.',
      },
    },
    {
      ancla: 'saltar',
      titulo: { es: 'Saltarse un paso', en: 'Skipping a step' },
      cuerpo: {
        es: 'A veces un nivel queda demasiado cerca del siguiente. Apágalo y desaparece del CSS y de la tabla, pero se queda a la vista en gris para que puedas juzgar el hueco que acabas de abrir. Los nombres se recolocan solos entre los que quedan.',
        en: 'Sometimes a level sits too close to the next one. Switch it off and it leaves the CSS and the table, but stays visible in grey so you can judge the gap you just opened. The names shuffle themselves across whatever remains.',
      },
    },
    {
      ancla: 'tabla',
      titulo: { es: 'A cuántos píxeles queda de verdad', en: 'What it really measures' },
      cuerpo: {
        es: 'El motivo de la herramienta. Aquí se ve que un titular ya está a tope en un portátil mientras el cuerpo sigue en su mínimo, y salta el aviso cuando dos pasos se cruzan a alguna anchura.',
        en: 'The reason this tool exists. Here you can see a headline already maxed out on a laptop while body text is still at its minimum, and a warning fires when two steps cross over at some width.',
      },
    },
    {
      ancla: 'css',
      titulo: { es: 'Listo para pegar', en: 'Ready to paste' },
      cuerpo: {
        es: 'El bloque de variables, con los pasos apagados fuera. Va en :root, o donde tu proyecto guarde sus variables.',
        en: 'The block of variables, with any switched-off steps left out. It goes in :root, or wherever your project keeps its variables.',
      },
    },
  ],
};
