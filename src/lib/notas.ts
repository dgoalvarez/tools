/**
 * La aritmética de la libreta: la lista y la nota.
 *
 * Módulo puro, sin React ni DOM, comprobable desde `node`. Aquí no se
 * toca `sessionStorage`: se entra y se sale con cadenas, y quien las
 * guarda es la isla. Así todo esto se puede comprobar sin navegador.
 *
 * ---------------------------------------------------------------------
 * Por qué `leer` desconfía de lo que le llega
 *
 * Lo guardado no es un dato del programa: es una cadena que puede haber
 * escrito otra versión de esta herramienta, otra pestaña, una extensión,
 * o alguien a mano desde la consola. Si la isla se fía y hace
 * `tareas.map(...)` sobre lo que salga, un `sessionStorage` con basura no
 * enseña una lista vacía — tumba la página entera, y encima de una forma
 * que se arrastra en cada recarga hasta que alguien sepa vaciar el
 * almacenamiento.
 *
 * Así que se valida entero: lo que no cuadra por arriba abre la libreta
 * vacía, y lo que no cuadra en una línea suelta tira esa línea y deja las
 * demás.
 */

/** Una línea de la lista. */
export interface Tarea {
  id: string;
  texto: string;
  hecha: boolean;
}

/** Todo lo que la herramienta guarda. */
export interface Cuaderno {
  tareas: Tarea[];
  nota: string;
}

export const VACIO: Cuaderno = { tareas: [], nota: '' };

/**
 * La versión de lo guardado.
 *
 * Sube cuando cambie la forma. Lo de una versión que no es esta se
 * descarta en vez de intentar adivinarlo: una libreta de sesión no vale
 * lo que cuesta escribir una migración.
 */
export const VERSION = 1;

/** La clave del almacenamiento de la pestaña. */
export const CLAVE = 'dgo-tools-notas';

/**
 * Topes.
 *
 * No son manías: `sessionStorage` tiene una cuota de unos pocos megas y
 * la pasa entera en cada guardado. Una línea de mil caracteres no es una
 * tarea, y una nota sin techo acaba en un error de cuota justo cuando
 * alguien está escribiendo.
 */
export const LIMITE_TAREAS = 500;
export const LIMITE_LINEA = 500;
export const LIMITE_NOTA = 100_000;

/** Un identificador que no se repite, con salida por si no hay `crypto`. */
function nuevoId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Deja el texto de una línea en una sola línea.
 *
 * Pegar tres párrafos en el campo de añadir es un accidente frecuente, y
 * una tarea con saltos de línea rompe tanto la lista como el Markdown que
 * sale de ella. Los saltos y los espacios seguidos se juntan en uno.
 */
export function limpiarLinea(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim().slice(0, LIMITE_LINEA);
}

export function nuevaTarea(texto: string): Tarea {
  return { id: nuevoId(), texto: limpiarLinea(texto), hecha: false };
}

/** Añade al final. Un texto que se queda en nada no añade nada. */
export function anadir(tareas: Tarea[], texto: string): Tarea[] {
  const limpio = limpiarLinea(texto);
  if (!limpio) return tareas;
  if (tareas.length >= LIMITE_TAREAS) return tareas;
  return [...tareas, nuevaTarea(limpio)];
}

export function marcar(tareas: Tarea[], id: string, hecha: boolean): Tarea[] {
  return tareas.map((t) => (t.id === id ? { ...t, hecha } : t));
}

/**
 * Cambia el texto de una línea.
 *
 * Aquí NO se limpia con `limpiarLinea`: quien está escribiendo tiene
 * derecho a un espacio al final mientras escribe la siguiente palabra, y
 * recortárselo a cada tecla mueve el cursor. Solo se recorta el largo.
 */
export function escribir(tareas: Tarea[], id: string, texto: string): Tarea[] {
  return tareas.map((t) => (t.id === id ? { ...t, texto: texto.slice(0, LIMITE_LINEA) } : t));
}

/**
 * Mueve una línea un puesto arriba (−1) o abajo (+1).
 *
 * Si no hay sitio devuelve el MISMO array, no una copia: así quien lo use
 * puede comparar por identidad para saber que no pasó nada.
 */
export function mover(tareas: Tarea[], id: string, paso: -1 | 1): Tarea[] {
  const i = tareas.findIndex((t) => t.id === id);
  if (i === -1) return tareas;
  const j = i + paso;
  if (j < 0 || j >= tareas.length) return tareas;
  const copia = [...tareas];
  [copia[i], copia[j]] = [copia[j], copia[i]];
  return copia;
}

export function borrar(tareas: Tarea[], id: string): Tarea[] {
  return tareas.filter((t) => t.id !== id);
}

export function borrarHechas(tareas: Tarea[]): Tarea[] {
  return tareas.filter((t) => !t.hecha);
}

/** Una línea que se borró, con el sitio del que salió. */
export interface Retirada {
  posicion: number;
  tarea: Tarea;
}

/**
 * Lo que se llevó un borrado, para poder devolverlo.
 *
 * Se apunta la POSICIÓN además de la línea porque «Borrar las hechas»
 * puede llevarse la 2 y la 5 a la vez, y devolverlas al final sería
 * devolver otra lista.
 */
export function retiradas(antes: Tarea[], despues: Tarea[]): Retirada[] {
  const quedan = new Set(despues.map((t) => t.id));
  const fuera: Retirada[] = [];
  antes.forEach((tarea, posicion) => {
    if (!quedan.has(tarea.id)) fuera.push({ posicion, tarea });
  });
  return fuera;
}

/**
 * Devuelve a su sitio lo que se borró.
 *
 * **Restaura, no revierte**, y esa es la decisión. Un deshacer que
 * sustituye la lista entera por la de antes se lleva por delante lo que
 * se haya escrito después: se borra una línea sin querer, se apuntan dos
 * cosas más, se pulsa «Deshacer» y desaparecen las dos. Aquí solo vuelven
 * las que faltaban, y todo lo demás se queda.
 *
 * Se insertan de menor a mayor posición para que cada índice signifique
 * lo mismo que significaba: metiendo primero la 5 y luego la 2, la 5
 * acabaría en la 6. Con el otro orden, «a b c d e» borrando la b y la d
 * vuelve como «a c e b d», que es lo que dice la comprobación 12 cuando
 * se rompe esto a propósito.
 *
 * Y las que ya estén —dos pulsaciones seguidas del mismo botón— no se
 * duplican.
 */
export function restaurar(tareas: Tarea[], fuera: Retirada[]): Tarea[] {
  const hay = new Set(tareas.map((t) => t.id));
  const salida = [...tareas];

  for (const { posicion, tarea } of [...fuera].sort((a, b) => a.posicion - b.posicion)) {
    if (hay.has(tarea.id)) continue;
    salida.splice(Math.min(posicion, salida.length), 0, tarea);
  }

  return salida;
}

export function cuantasHechas(tareas: Tarea[]): number {
  return tareas.reduce((n, t) => n + (t.hecha ? 1 : 0), 0);
}

/* ============================================================
   El encuadre de la descarga del dibujo

   Está aquí y no en la isla porque es aritmética: dos funciones que
   reciben números y devuelven números. En la isla no se podría probar
   sin navegador, y un recorte mal calculado no se ve —sale un PNG con
   el dibujo cortado o descentrado, y solo lo nota quien lo abre.
   ============================================================ */

export interface Caja {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/**
 * La caja que ocupa lo que de verdad está pintado.
 *
 * Mira los PÍXELES y no la geometría de los trazos, y la razón es el
 * bote de pintura: un relleno se guarda como un punto y un color, y
 * hasta que no se pinta nadie sabe hasta dónde llega — puede quedarse
 * dentro de una forma o escaparse por un hueco del contorno y bañar el
 * lienzo entero. Con la geometría habría que adivinarlo; con los píxeles
 * se sabe.
 *
 * Y de paso arregla el caso de los trazos sin tener que tratarlos
 * aparte: lo pintado es lo pintado, venga de donde venga.
 *
 * `datos` es RGBA seguido, como lo devuelve `getImageData`. Se mira solo
 * la transparencia: el lienzo se sirve sin fondo, así que todo lo que
 * tenga alfa es dibujo.
 */
export function cajaDePixeles(
  datos: Uint8ClampedArray | number[],
  ancho: number,
  alto: number,
  margen: number
): Caja | null {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;

  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      if (datos[(y * ancho + x) * 4 + 3]! === 0) continue;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }

  if (!Number.isFinite(x0)) return null;

  // El píxel de la derecha ocupa sitio: de la columna 3 a la 5 hay tres
  // columnas pintadas, no dos.
  return {
    x: x0 - margen,
    y: y0 - margen,
    ancho: x1 - x0 + 1 + margen * 2,
    alto: y1 - y0 + 1 + margen * 2,
  };
}

/**
 * El bote de pintura: llena la mancha que toca el punto de partida.
 *
 * Recorrido por LÍNEAS y no píxel a píxel con una pila de vecinos. Con
 * la pila, un lienzo de 726×710 —que es lo que mide a densidad doble—
 * mete medio millón de puntos en memoria y se atraganta; por líneas se
 * apunta un tramo entero de golpe y la pila se queda en decenas.
 *
 * La tolerancia existe porque los trazos van suavizados: el borde de una
 * línea negra sobre nada no salta de opaco a transparente, pasa por una
 * franja de medias tintas. Sin margen, el relleno se cuela por esa
 * franja y deja un halo del color viejo pegado al contorno.
 *
 * Devuelve cuántos píxeles pintó, que es lo que permite comprobarlo.
 */
export function rellenar(
  datos: Uint8ClampedArray | number[],
  ancho: number,
  alto: number,
  inicioX: number,
  inicioY: number,
  color: [number, number, number, number],
  tolerancia = 32
): number {
  const x0 = Math.round(inicioX);
  const y0 = Math.round(inicioY);
  if (x0 < 0 || y0 < 0 || x0 >= ancho || y0 >= alto) return 0;

  const en = (x: number, y: number) => (y * ancho + x) * 4;
  const origen = en(x0, y0);
  const semilla = [datos[origen]!, datos[origen + 1]!, datos[origen + 2]!, datos[origen + 3]!];

  // Tocar donde ya está el color pedido no haría nada y daría vueltas
  // para siempre en el peor de los casos.
  if (
    Math.abs(semilla[0]! - color[0]) <= 1 &&
    Math.abs(semilla[1]! - color[1]) <= 1 &&
    Math.abs(semilla[2]! - color[2]) <= 1 &&
    Math.abs(semilla[3]! - color[3]) <= 1
  ) {
    return 0;
  }

  const igual = (i: number) =>
    Math.abs(datos[i]! - semilla[0]!) <= tolerancia &&
    Math.abs(datos[i + 1]! - semilla[1]!) <= tolerancia &&
    Math.abs(datos[i + 2]! - semilla[2]!) <= tolerancia &&
    Math.abs(datos[i + 3]! - semilla[3]!) <= tolerancia;

  const pintar = (i: number) => {
    datos[i] = color[0];
    datos[i + 1] = color[1];
    datos[i + 2] = color[2];
    datos[i + 3] = color[3];
  };

  let pintados = 0;
  const pila: [number, number][] = [[x0, y0]];

  while (pila.length) {
    const [px, py] = pila.pop()!;
    let x = px;
    while (x >= 0 && igual(en(x, py))) x--;
    x++;

    let arriba = false;
    let abajo = false;

    while (x < ancho && igual(en(x, py))) {
      pintar(en(x, py));
      pintados++;

      if (py > 0) {
        const vecino = igual(en(x, py - 1));
        if (vecino && !arriba) pila.push([x, py - 1]);
        arriba = vecino;
      }
      if (py < alto - 1) {
        const vecino = igual(en(x, py + 1));
        if (vecino && !abajo) pila.push([x, py + 1]);
        abajo = vecino;
      }
      x++;
    }
  }

  return pintados;
}

/**
 * Ensancha la caja hasta la proporción pedida, sin mover su centro.
 *
 * Siempre CRECE: se añade por el lado que se queda corto y nunca se
 * quita del que sobra. Un dibujo apaisado llevado a 1:1 gana margen
 * arriba y abajo; recortarlo por los lados habría perdido dibujo, y
 * quien descarga no se enteraría hasta abrir el archivo.
 *
 * Con razón 0 —«ceñido»— devuelve la caja tal cual.
 */
export function aProporcion(caja: Caja, razon: number): Caja {
  if (!(razon > 0) || caja.ancho <= 0 || caja.alto <= 0) return caja;

  const actual = caja.ancho / caja.alto;
  // Un pelo de tolerancia: sin él, una caja que ya está en 1:1 se
  // «ensancha» unas milésimas y el PNG sale con un píxel de más.
  if (Math.abs(actual - razon) < 0.0001) return caja;

  if (actual < razon) {
    const ancho = caja.alto * razon;
    return { ...caja, x: caja.x - (ancho - caja.ancho) / 2, ancho };
  }

  const alto = caja.ancho / razon;
  return { ...caja, y: caja.y - (alto - caja.alto) / 2, alto };
}

/**
 * La lista en Markdown, que es como sale de aquí.
 *
 * `- [x]` y `- [ ]` los entienden GitHub, Linear, Notion, Obsidian y
 * cualquier editor de texto — y en el peor de los casos se lee tal cual.
 * Es la salida de emergencia de una herramienta que se vacía al cerrar la
 * pestaña, así que no puede depender de que el destino sepa de formatos.
 *
 * El texto va tal cual, sin escapar: en Markdown, dentro de un elemento
 * de lista, ni los corchetes ni los guiones ni las almohadillas cambian
 * de significado. Escaparlos ensuciaría lo que se pega.
 */
export function aMarkdown(tareas: Tarea[]): string {
  return tareas.map((t) => `- [${t.hecha ? 'x' : ' '}] ${t.texto}`).join('\n');
}

/** Lo que se guarda, en texto. */
/* ============================================================
   La nota con formato
   ============================================================ */

/**
 * Las únicas etiquetas que pueden vivir dentro de la nota.
 *
 * La lista es cortísima a propósito: es exactamente lo que producen los
 * seis botones de la barra y nada más. Lo que no esté aquí se cae, y con
 * ello TODOS los atributos sin excepción — que es por donde entrarían un
 * `onerror`, un `style` o un enlace `javascript:`.
 */
const ETIQUETAS_NOTA = [
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'strike',
  'del',
  'ul',
  'ol',
  'li',
  'br',
  'p',
  'div',
];

/**
 * Deja de la nota solo lo que se puede pintar sin miedo.
 *
 * Lo que se restaura sale de `sessionStorage`, que es del mismo origen y
 * por tanto no lo escribe un desconocido: para envenenarlo habría que
 * tener ya ejecución en la página, y entonces esto sobra. Se sanea igual,
 * por dos motivos que no son paranoia:
 *
 *   · lo que se pega en un `contenteditable` viene de donde sea —de Word,
 *     de una página cualquiera— y trae `style`, `class`, `<script>` y
 *     `<img onerror>` de regalo;
 *   · esto acaba pintado con `dangerouslySetInnerHTML`, y esa palabra hay
 *     que ganársela.
 *
 * Va con cadenas y no con `DOMParser` porque en este proyecto la
 * aritmética vive sin DOM, para poder probarla con node. Y probarla es
 * justo lo que hay que hacer con un saneador: `comprobar-notas.ts` le
 * pasa las cargas de siempre y comprueba que no sobrevive ninguna.
 */
export function sanearNota(html: string): string {
  return (
    html
      // Primero los bloques enteros CON su contenido: quitar solo la
      // etiqueta de un <script> dejaría el código suelto como texto, y la
      // de un <style> dejaría reglas CSS a la vista.
      .replace(/<(script|style|iframe|object|embed|svg|math)\b[\s\S]*?<\/\1\s*>/gi, '')
      // Y por si vienen sin cerrar.
      .replace(/<\/?(script|style|iframe|object|embed|svg|math)\b[^>]*>/gi, '')
      // El resto: se conserva el NOMBRE de la etiqueta si está permitida y
      // se tira todo lo que venga detrás. Así no hay que decidir qué
      // atributo es peligroso, porque no sobrevive ninguno.
      .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (_, cierre: string, etiqueta: string) =>
        ETIQUETAS_NOTA.includes(etiqueta.toLowerCase())
          ? `<${cierre}${etiqueta.toLowerCase()}>`
          : ''
      )
      .slice(0, LIMITE_NOTA)
  );
}

/**
 * El texto pelado de la nota: para contar y para saber si está vacía.
 *
 * Un `<p><br></p>` es lo que deja un `contenteditable` recién vaciado, y
 * de texto no tiene nada. Sin esto, el botón de copiar aparecería sobre
 * una nota que a la vista está en blanco.
 */
export function textoDeNota(html: string): string {
  return html
    .replace(/<(br|\/p|\/div|\/li)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

/**
 * La nota, escrita en Markdown para pegarla fuera.
 *
 * El subrayado se pierde, y no hay nada que hacer: Markdown no lo tiene.
 * Se prefiere perderlo a inventar una marca que en el destino se vería
 * como dos guiones bajos sueltos. Lo demás viaja entero.
 */
export function notaAMarkdown(html: string): string {
  const marcado = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    // Las viñetas se marcan al final, cuando se sepa en qué lista están.
    .replace(/<li>/gi, ' LI ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<(b|strong)>/gi, '**')
    .replace(/<\/(b|strong)>/gi, '**')
    .replace(/<(i|em)>/gi, '*')
    .replace(/<\/(i|em)>/gi, '*')
    .replace(/<(s|strike|del)>/gi, '~~')
    .replace(/<\/(s|strike|del)>/gi, '~~')
    .replace(/<(br|\/p|\/div)>/gi, '\n');

  /*
    Numerar exige recorrer, no reemplazar: una expresión regular no lleva
    la cuenta de por cuál va ni sabe si la lista de alrededor es de puntos
    o de números.
  */
  const trozos = marcado.split(/(<\/?[uo]l>)/gi);
  let salida = '';
  let ordenada = false;
  let n = 0;

  for (const trozo of trozos) {
    const etiqueta = trozo.toLowerCase();
    if (etiqueta === '<ol>') {
      ordenada = true;
      n = 0;
      continue;
    }
    if (etiqueta === '<ul>' || etiqueta === '</ol>' || etiqueta === '</ul>') {
      ordenada = false;
      continue;
    }
    salida += trozo.replace(/ LI /g, () => (ordenada ? `${++n}. ` : '- '));
  }

  return salida
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function guardar(cuaderno: Cuaderno): string {
  return JSON.stringify({
    v: VERSION,
    tareas: cuaderno.tareas.slice(0, LIMITE_TAREAS),
    nota: cuaderno.nota.slice(0, LIMITE_NOTA),
  });
}

/** ¿Es un objeto de verdad, y no null ni un array? */
function esObjeto(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/**
 * Lee lo guardado, desconfiando de todo.
 *
 * Cualquier problema de arriba —no es JSON, no es un objeto, es de otra
 * versión— abre la libreta vacía. Un problema en una línea suelta tira
 * esa línea y deja las demás: perder una tarea rota es mejor que perder
 * las once buenas que iban al lado.
 */
export function leer(bruto: string | null | undefined): Cuaderno {
  if (!bruto) return VACIO;

  let crudo: unknown;
  try {
    crudo = JSON.parse(bruto);
  } catch {
    return VACIO;
  }

  if (!esObjeto(crudo)) return VACIO;
  if (crudo.v !== VERSION) return VACIO;

  const tareas: Tarea[] = [];
  if (Array.isArray(crudo.tareas)) {
    for (const linea of crudo.tareas) {
      if (tareas.length >= LIMITE_TAREAS) break;
      if (!esObjeto(linea)) continue;
      if (typeof linea.texto !== 'string') continue;
      const texto = limpiarLinea(linea.texto);
      if (!texto) continue;
      tareas.push({
        id: typeof linea.id === 'string' && linea.id ? linea.id : nuevoId(),
        texto,
        hecha: linea.hecha === true,
      });
    }
  }

  const nota = typeof crudo.nota === 'string' ? crudo.nota.slice(0, LIMITE_NOTA) : '';

  return { tareas, nota };
}
