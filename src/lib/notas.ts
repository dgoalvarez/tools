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

export function cuantasHechas(tareas: Tarea[]): number {
  return tareas.reduce((n, t) => n + (t.hecha ? 1 : 0), 0);
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
