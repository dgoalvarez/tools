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
 * allí ya es otro día, el color que sí pasaría—. Esos no se
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
  // ------------------------------------------------------------ notas
  notes: [
    {
      ancla: 'aviso',
      titulo: { es: 'Dura lo que dura la pestaña', en: 'It lasts as long as the tab' },
      cuerpo: {
        es: 'Lo que escribas aquí aguanta una recarga, un despiste y saltar a otra herramienta y volver. Al cerrar la pestaña se va, y esa es la razón por la que no hay cuenta ni servidor: no hay nada que guardar en ninguna parte.',
        en: 'What you write here survives a reload, a slip, and a trip to another tool and back. Close the tab and it is gone — and that is exactly why there is no account and no server: there is nothing to keep anywhere.',
      },
    },
    {
      ancla: 'anadir',
      titulo: { es: 'Escribe y pulsa Intro', en: 'Type and press Enter' },
      cuerpo: {
        es: 'El campo no pierde el foco al añadir, así que se escriben cinco cosas seguidas sin tocar el ratón. Que es como se usa esto de verdad: de un tirón, al empezar.',
        en: 'The field keeps the focus after adding, so you can type five things in a row without touching the mouse. Which is how this actually gets used: in one go, at the start.',
      },
    },
    {
      ancla: 'linea',
      titulo: { es: 'Se corrige en su sitio', en: 'Fix it where it is' },
      cuerpo: {
        es: 'El texto se edita directamente, sin botón de editar: una tarea se corrige mucho más de lo que se crea. Y se reordena con las flechas, que funcionan con el teclado — arrastrar dejaría fuera a quien no usa ratón.',
        en: 'The text edits in place, with no edit button: a task gets corrected far more often than it gets created. Reorder with the arrows, which work from the keyboard — dragging would leave out anyone without a mouse.',
      },
      opcional: true,
    },
    {
      ancla: 'salida',
      titulo: { es: 'La salida', en: 'The way out' },
      cuerpo: {
        es: 'La lista se copia en Markdown, con sus casillas: «- [x] revisar el contraste». Lo entienden GitHub, Linear, Notion y cualquier editor de texto. Es la forma de que algo de aquí dure más que la pestaña.',
        en: 'The list copies out as Markdown, checkboxes and all: “- [x] check the contrast”. GitHub, Linear, Notion and any text editor understand it. It is how something here outlives the tab.',
      },
    },
    {
      ancla: 'nota',
      titulo: { es: 'Lo que no es una tarea', en: 'What is not a task' },
      cuerpo: {
        es: 'Un enlace, un número de pedido, el nombre de la rama, tres frases que no quieres volver a pensar. No tiene formato ni barra de herramientas a propósito: es un papel, no un editor.',
        en: 'A link, an order number, the branch name, three sentences you would rather not think through twice. It has no formatting and no toolbar on purpose: it is a scrap of paper, not an editor.',
      },
    },
  ],

  // ------------------------------------------------------------ husos
  timezones: [
    {
      ancla: 'hora',
      titulo: { es: 'La hora de la que partes', en: 'The time you start from' },
      cuerpo: {
        es: 'Escribe el día y la hora tal y como los tienes tú en la cabeza. Todo lo demás sale de aquí.',
        en: 'Type the day and the time exactly as you have them in your head. Everything else follows from this.',
      },
    },
    {
      ancla: 'origen',
      titulo: { es: 'De dónde es esa hora', en: 'Where that time is from' },
      cuerpo: {
        es: 'Va plegado porque casi nunca cambia: casi siempre es la tuya, un día tras otro. Ábrelo para cambiarla, o pulsa «Mi ubicación» y la coge del navegador.',
        en: 'It stays folded because it rarely changes: it is almost always your own, day after day. Open it to change it, or press “My location” and it takes it from the browser.',
      },
    },
    {
      ancla: 'destinos',
      titulo: { es: 'En qué sitios la quieres saber', en: 'Where you want to know it' },
      cuerpo: {
        es: 'Busca por ciudad —en español o en inglés— o por código postal de Estados Unidos. El código postal está porque siete estados están partidos entre dos husos: en Florida o en Tennessee, saber el estado no basta.',
        en: 'Search by city — in English or Spanish — or by US ZIP code. The ZIP code is there because seven states are split between two zones: in Florida or Tennessee, knowing the state is not enough.',
      },
    },
    {
      ancla: 'resultados',
      titulo: { es: 'Todas las horas en columna', en: 'Every time in one column' },
      cuerpo: {
        es: 'La tuya la primera, en color, y debajo una por ciudad. Están alineadas a propósito: comparar dos horas es mirar hacia abajo, no recordar una mientras buscas la otra. Cada fila trae además la diferencia y la abreviatura del huso —EST, CDT—, que es lo que la gente escribe en los correos.',
        en: 'Yours first, in colour, and one row per city below. They line up on purpose: comparing two times is looking down the column, not remembering one while you hunt for the other. Each row also carries the difference and the zone abbreviation — EST, CDT — which is what people write in emails.',
      },
    },
    {
      ancla: 'salto',
      titulo: { es: 'El aviso que importa', en: 'The warning that matters' },
      cuerpo: {
        es: 'Cuando allí ya es otro día, la fila se marca en rojo por el lado y lo dice al final. Es el error que de verdad se comete: acertar la hora y equivocarse el día.',
        en: 'When it is already another day there, the row is marked red down its edge and says so at the end. It is the mistake people actually make: getting the time right and the day wrong.',
      },
      opcional: true,
    },
    {
      ancla: 'frase',
      titulo: { es: 'Un mensaje con todas', en: 'One message with all of them' },
      cuerpo: {
        es: 'Copia todas las horas en un solo mensaje, con el aviso de otro día dentro de la línea que le toca. Uno y no cinco: si son varios sitios, lo que se manda es un mensaje con todos.',
        en: 'Copies every time as a single message, with the other-day warning inside the line it belongs to. One and not five: if there are several places, what you send is one message with all of them.',
      },
      opcional: true,
    },
    {
      ancla: 'precision',
      titulo: { es: 'Hasta dónde llega', en: 'How far it goes' },
      cuerpo: {
        es: 'Los husos son exactos a nivel de condado, que es el nivel al que existen de verdad. Los datos son de GeoNames y la línea está ahí porque su licencia lo pide; ábrela si quieres el detalle de hasta dónde llega la precisión.',
        en: 'Zones are exact at county level, which is the level at which they really exist. The data is from GeoNames and that line is there because its licence asks for it; open it if you want the detail on how far the precision goes.',
      },
    },
  ],

  // ------------------------------------------------------------ reloj
  clock: [
    {
      ancla: 'hora',
      titulo: { es: 'La hora, a lo grande', en: 'The time, big' },
      cuerpo: {
        es: 'Se queda arriba en las tres pestañas, porque es lo que se mira sin pensar y lo que da sentido a lo demás: una alarma se pone mirando la hora que es. En un portátil apoyado en la mesa se lee desde el otro lado de la habitación.',
        en: 'It stays up here across all three tabs, because it is what you glance at without thinking and what gives the rest its meaning: you set an alarm by looking at what time it is. On a laptop propped on the desk you can read it from across the room.',
      },
    },
    {
      ancla: 'cara',
      titulo: { es: 'Digital o de agujas', en: 'Digits or hands' },
      cuerpo: {
        es: 'Cambia la cara, el formato de 12 o 24 horas, y si quieres ver la fecha y los segundos. «Del idioma» usa el que corresponda: 24 h en español, 12 h en inglés. Todo viaja en la dirección, así que el reloj que te guste se guarda en marcadores.',
        en: 'Switch the face, the 12 or 24 hour format, and whether the date and seconds show. «Match language» uses whichever fits: 24 h in Spanish, 12 h in English. It all travels in the address, so the clock you like can be bookmarked.',
      },
    },
    {
      ancla: 'alarma',
      titulo: { es: 'La alarma, y su límite', en: 'The alarm, and its limit' },
      cuerpo: {
        es: 'Pon una hora y te dice cuánto falta y qué día será, para no tener que hacer la cuenta. Lo que hay que saber antes de fiarse: solo suena con esta pestaña abierta. No hay servidor detrás, y el navegador no sabe despertar una página cerrada.',
        en: 'Set a time and it tells you how long is left and which day it lands on, so you do not have to work it out. What to know before trusting it: it only rings while this tab is open. There is no server behind it, and the browser cannot wake a closed page.',
      },
    },
    {
      ancla: 'cronometro',
      titulo: { es: 'Vueltas, con la más rápida marcada', en: 'Laps, with the fastest marked' },
      cuerpo: {
        es: 'Cada vuelta guarda su duración y el total, y se marcan la más rápida y la más lenta — solo entre las terminadas, porque la que está corriendo todavía va a crecer. Este cuenta con un reloj monótono, así que un ajuste de hora del sistema no le da un salto.',
        en: 'Each lap keeps its own time and the running total, and the fastest and slowest are marked — only among finished laps, since the one still running is going to grow. This one counts on a monotonic clock, so a system time adjustment cannot make it jump.',
      },
    },
    {
      ancla: 'temporizador',
      titulo: { es: 'De un toque', en: 'One tap' },
      cuerpo: {
        es: 'Horas, minutos y segundos, o los botones de abajo para los ratos que se ponen de verdad. Cuenta contra el reloj del sistema, así que no se atrasa aunque cambies de pestaña o el ordenador se suspenda.',
        en: 'Hours, minutes and seconds, or the buttons below for the stretches people actually set. It counts against the system clock, so it does not fall behind if you switch tabs or the computer sleeps.',
      },
    },
    {
      ancla: 'aviso',
      titulo: { es: 'Cómo te avisa', en: 'How it tells you' },
      cuerpo: {
        es: 'Un tono generado en el momento —sin archivo que descargar— y, si le das permiso, una notificación del sistema. El botón «Probar» te deja oírlo antes de necesitarlo, que es mejor que descubrir el volumen cuando ya suena. La cuenta más urgente va además en el título de la pestaña del navegador, para verla desde otra.',
        en: 'A tone generated on the spot — no file to download — and, if you allow it, a system notification. The «Play it» button lets you hear it before you need it, which beats discovering the volume when it is already ringing. The most urgent count also goes in the browser tab title, so you can see it from another tab.',
      },
    },
  ],

  // --------------------------------------------------------- pomodoro
  pomodoro: [
    {
      ancla: 'cuenta',
      titulo: { es: 'La cuenta atrás', en: 'The countdown' },
      cuerpo: {
        es: 'El anillo se llena según pasa el tiempo, y no al revés: un pomodoro es algo que se completa, no algo que se agota. Al acabar una fase, la siguiente arranca sola — parar aquí obligaría a estar delante de la pantalla, que es justo lo que un temporizador viene a evitar.',
        en: 'The ring fills as time passes, not the other way round: a pomodoro is something you complete, not something that runs out. When a phase ends the next one starts on its own — stopping here would mean having to sit and watch the screen, which is exactly what a timer is meant to avoid.',
      },
    },
    {
      ancla: 'duraciones',
      titulo: { es: 'Todo se puede cambiar', en: 'Everything is yours to set' },
      cuerpo: {
        es: 'Los minutos de trabajo, los de cada descanso y cada cuántos pomodoros toca el largo. Veinticinco y cinco es lo que dice el método original, pero son números y no leyes. Lo que cambies con algo en marcha se aplica a la fase siguiente: cortar la que está corriendo sería castigarte por mirar los ajustes.',
        en: 'Minutes of work, minutes of each break, and how many pomodoros before the long one. Twenty-five and five is what the original method says, but those are numbers, not laws. What you change while something is running applies to the next phase: cutting the current one short would punish you for looking at the settings.',
      },
    },
    {
      ancla: 'aviso',
      titulo: { es: 'Cómo te avisa', en: 'How it tells you' },
      cuerpo: {
        es: 'Un tono corto al acabar —sube cuando termina el trabajo y baja cuando termina el descanso, así sabes cuál sin mirar— y, si le das permiso, una notificación del sistema. La cuenta va además en el título de la pestaña, para que se vea desde otra.',
        en: 'A short tone when time is up — it goes up when work ends and down when the break ends, so you know which without looking — and, if you allow it, a system notification. The countdown also sits in the tab title, so you can see it from another tab.',
      },
    },
    {
      ancla: 'ciclo',
      titulo: { es: 'Cuántos faltan para el largo', en: 'How many until the long one' },
      cuerpo: {
        es: 'Un punto por pomodoro del ciclo. Es la única cuenta que este método pide llevar en la cabeza, así que se ve de un vistazo en vez de contarla.',
        en: 'One dot per pomodoro in the cycle. It is the only count this method asks you to keep in your head, so you can see it at a glance instead of counting.',
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
      titulo: { es: 'Escribirlo, elegirlo o cogerlo', en: 'Type it, choose it or grab it' },
      cuerpo: {
        es: 'El campo acepta cualquier notación. El cuadrado de la izquierda abre el selector de tu sistema, para elegir a mano. Y el cuentagotas de la derecha coge el color de donde pongas el puntero, en cualquier parte de la pantalla; solo aparece en los navegadores que saben hacerlo, que hoy son Chrome y Edge.',
        en: 'The field takes any notation. The square on the left opens your system picker, to choose by hand. And the eyedropper on the right takes the colour from wherever you point, anywhere on screen; it only shows up in browsers that can do it, which today are Chrome and Edge.',
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

  // ----------------------------------------------------------- paleta
  palette: [
    {
      ancla: 'tonalidades',
      titulo: { es: 'Los colores de partida', en: 'The colours you start from' },
      cuerpo: {
        es: 'Cada tonalidad es un color tuyo y su rampa. El nombre es el de la variable: «azul» produce --azul-50 hasta --azul-950. Se pegan en hexadecimal, en rgb() o en oklch(), y se pueden añadir las que hagan falta.',
        en: 'Each hue is a colour of yours plus its ramp. The name is the variable’s: “blue” gives you --blue-50 through --blue-950. Paste them as hex, rgb() or oklch(), and add as many as you need.',
      },
    },
    {
      ancla: 'cuadricula',
      titulo: { es: 'Tu color sigue ahí', en: 'Your colour is still there' },
      cuerpo: {
        es: 'El paso con el punto es el color que pegaste, intacto: la rampa se construye alrededor de él, no lo sustituye. Los demás salen de una escalera de luminosidad que comparten TODAS las tonalidades, y eso es lo que hace que el 500 de un azul pese lo mismo que el de un rojo.',
        en: 'The step with the dot is the colour you pasted, untouched: the ramp is built around it, it does not replace it. The rest come from a lightness ladder shared by ALL the hues, and that is what makes a blue’s 500 weigh the same as a red’s.',
      },
    },
    {
      ancla: 'detalle',
      titulo: { es: 'Qué tinta aguanta cada paso', en: 'What ink each step can carry' },
      cuerpo: {
        es: 'Pulsa una casilla y te dice si el blanco o el negro pasan AA encima, con WCAG 2.2 y con APCA. Los pasos del centro casi nunca aguantan ninguno de los dos —es la trampa clásica: sirven de fondo y de borde, no de texto— y esos van marcados en la cuadrícula.',
        en: 'Click a swatch and it tells you whether white or black passes AA on top, with WCAG 2.2 and APCA. The middle steps almost never take either — the classic trap: they work as background and border, not as text — and those are flagged in the grid.',
      },
      opcional: true,
    },
    {
      ancla: 'rampa',
      titulo: { es: 'La forma de la rampa', en: 'The shape of the ramp' },
      cuerpo: {
        es: 'Hasta dónde llega de clara y de oscura, cuánto sube el croma en el centro, y cuántos grados gira el tono entre los extremos. La deriva de tono es la que menos se reconoce y la que más se nota: hace que los oscuros tiren a un lado y los claros al otro, que es como lo ve el ojo.',
        en: 'How light and how dark it goes, how much the chroma rises in the middle, and how many degrees the hue turns between the ends. Hue drift is the least familiar and the most noticeable: it makes the darks lean one way and the lights the other, which is how the eye sees it.',
      },
    },
    {
      ancla: 'avisos',
      titulo: { es: 'Lo que no se arregla solo', en: 'What is not quietly fixed' },
      cuerpo: {
        es: 'Cuando un paso pide más croma del que una pantalla puede pintar, se recorta y se dice — no se apaga la paleta entera para que case. Y todo se calcula en sRGB: las paletas de Tailwind o Radix apuntan a P3, así que sus pasos intermedios se ven algo más vivos que estos.',
        en: 'When a step asks for more chroma than a screen can paint, it gets clipped and says so — the whole palette is not dimmed to make it match. And everything is computed in sRGB: Tailwind’s and Radix’s palettes target P3, so their middle steps look a little more vivid than these.',
      },
    },
    {
      ancla: 'css',
      titulo: { es: 'Listo para pegar', en: 'Ready to paste' },
      cuerpo: {
        es: 'Sale en oklch() a propósito y no en hexadecimal: el hexadecimal es de ocho bits y redondearlo mueve la luminosidad lo bastante como para romper la escalera. Los hexadecimales están ahí también, para cuando hagan falta.',
        en: 'It comes out as oklch() on purpose and not hex: hex is eight bits and rounding it moves the lightness enough to break the ladder. The hex values are there too, for when you need them.',
      },
    },
  ],

  // ---------------------------------------------------------- escala
  scale: [
    {
      ancla: 'fluida',
      titulo: { es: 'Lo primero: ¿crece o no?', en: 'First: does it grow?' },
      cuerpo: {
        es: 'Encendido, cada paso es un clamp() que crece con la ventana, y hay que decidir dos tamaños base, dos proporciones y entre qué anchuras. Apagado, cada paso vale un número y todo eso desaparece de la pantalla. Es la decisión que cambia todas las demás, por eso está arriba.',
        en: 'Switched on, each step is a clamp() that grows with the window, and you decide two base sizes, two ratios and between which widths. Switched off, each step is a single number and all of that disappears from the screen. It is the decision that changes every other one, which is why it sits at the top.',
      },
    },
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
      opcional: true,
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
        es: 'Cada línea trae su nombre de variable, el par de tamaños que genera —el mínimo y el máximo del clamp()— en píxeles y en rem, y el alto de línea que le va. El alto de línea baja según sube el tamaño: un renglón grande necesita menos aire que uno pequeño. Es una sugerencia, y sale como variable aparte para que puedas cambiarla. El nombre se edita aquí mismo, pulsando encima.',
        en: 'Each line carries its variable name, the pair of sizes it generates — the clamp’s minimum and maximum — in pixels and in rem, and the line height that suits it. Line height goes down as size goes up: a big line needs less air than a small one. It is a suggestion, and it comes out as a separate variable so you can change it. Names are edited right here, by clicking on them.',
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
      opcional: true,
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
        es: 'El bloque de variables, con los pasos apagados fuera. Cada paso trae dos: su tamaño y su alto de línea, uno debajo del otro. Va en :root, o donde tu proyecto guarde sus variables.',
        en: 'The block of variables, with any switched-off steps left out. Each step brings two: its size and its line height, one under the other. It goes in :root, or wherever your project keeps its variables.',
      },
    },
  ],
};
