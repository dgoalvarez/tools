/**
 * Dos guardias antes de que una herramienta se ejecute.
 *
 * Se engancha en `PreToolUse`. No opina sobre el trabajo: solo pone
 * mecánicamente dos reglas que hasta ahora vivían escritas en prosa, y
 * una regla escrita en prosa se cumple hasta que alguien va con prisa.
 *
 * ---------------------------------------------------------------------
 * 1 · El portafolio no se toca
 *
 * `C:\portfolio` es de solo lectura. Se puede mirar todo lo que haga
 * falta —de ahí salieron la tipografía y los tokens— pero no se escribe
 * ni un archivo. Escribir con Edit o Write en esa carpeta se deniega sin
 * preguntar; una orden de consola que la mencione y además parezca que
 * escribe se pregunta, porque desde la consola no siempre se distingue
 * mirar de tocar.
 *
 * 2 · `build-data.mjs` no se ejecuta a la ligera
 *
 * Descarga 780 MB de nombres alternativos de GeoNames y regenera datos
 * que están versionados. No forma parte de la compilación a propósito.
 * Se pregunta antes, siempre.
 */

/** Cómo se llama la carpeta intocable, en las formas en que puede venir. */
const PORTAFOLIO = /(^|[\\/"'\s])([a-z]:[\\/]|\/[a-z]\/)portfolio([\\/"'\s]|$)/i;

/** Verbos de consola que escriben. Mirar no está entre ellos. */
const ESCRIBE =
  /(\brm\b|\bmv\b|\bcp\b|\bmkdir\b|\btouch\b|\bsed\s+-i\b|\btee\b|>>?|\bgit\s+(add|commit|checkout|restore|clean|reset)\b|Set-Content|Out-File|Remove-Item|New-Item)/i;

function responder(decision, motivo) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: decision,
        permissionDecisionReason: motivo,
      },
    })
  );
  process.exit(0);
}

let entrada = '';
process.stdin.setEncoding('utf8');
for await (const trozo of process.stdin) entrada += trozo;

try {
  const evento = JSON.parse(entrada);
  const herramienta = evento?.tool_name ?? '';
  const datos = evento?.tool_input ?? {};

  // ---------- el portafolio ----------
  if (herramienta === 'Edit' || herramienta === 'Write' || herramienta === 'NotebookEdit') {
    const destino = String(datos.file_path ?? '');
    if (PORTAFOLIO.test(destino)) {
      responder(
        'deny',
        'C:\\portfolio es de solo lectura: se mira, no se toca. Si hace falta algo de ahí, cópialo a este proyecto en vez de editarlo allí.'
      );
    }
  }

  if (herramienta === 'Bash' || herramienta === 'PowerShell') {
    const orden = String(datos.command ?? '');

    if (PORTAFOLIO.test(orden) && ESCRIBE.test(orden)) {
      responder(
        'ask',
        'Esta orden menciona C:\\portfolio y parece que escribe. El portafolio es de solo lectura.'
      );
    }

    // ---------- los datos de GeoNames ----------
    if (/build-data(\.mjs)?/.test(orden)) {
      responder(
        'ask',
        'build-data.mjs descarga 780 MB de GeoNames y regenera public/data/, que está versionado. No forma parte de la compilación a propósito. ¿Seguro?'
      );
    }
  }
} catch {
  // Un evento que no se entiende no es motivo para bloquear nada.
}

process.exit(0);
