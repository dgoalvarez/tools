/**
 * La nota, con formato: negrita, cursiva, subrayado, tachado y dos listas.
 *
 * ---------------------------------------------------------------------
 * Por qué `execCommand`, que está obsoleto
 *
 * Porque para estas seis órdenes no hay sustituto. El estándar que iba a
 * reemplazarlo se abandonó, ningún navegador lo ha quitado, y hacerlo a
 * mano con `Selection` y `Range` es reescribir un editor entero para
 * acabar con más esquinas rotas que las que trae él.
 *
 * La alternativa honesta era un editor de verdad —Tiptap, Lexical—, pero
 * son entre 40 y 100 KB comprimidos sobre una isla que pesa 3. Para un
 * cuaderno que muere al cerrar la pestaña es mucho motor para poco coche.
 *
 * Lo que sí hay que pagar de este atajo está pagado: el HTML que genera
 * `execCommand` es sucio y llega de donde sea al pegar, así que TODO lo
 * que entra pasa por `sanearNota`, que solo deja catorce etiquetas y
 * ningún atributo. Está probado con las cargas de siempre en
 * `comprobar-notas.ts` §10.
 *
 * ---------------------------------------------------------------------
 * Por qué el campo no está «controlado»
 *
 * Un `contenteditable` al que React le reescribe el HTML en cada pulsación
 * pierde el cursor: se va al principio en cada letra. Así que el HTML se
 * escribe UNA vez —al montar y al restaurar— y a partir de ahí manda el
 * navegador; lo que se lee de vuelta va al estado, pero no vuelve a
 * bajar salvo que cambie por fuera.
 */
import { useEffect, useRef, useState } from 'react';
import {
  ListBulletsIcon,
  ListNumbersIcon,
  TextBIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  TextUnderlineIcon,
} from '@phosphor-icons/react';

import { sanearNota } from '@/lib/notas';

export interface TextosNota {
  negrita: string;
  cursiva: string;
  subrayado: string;
  tachado: string;
  vinetas: string;
  numeros: string;
  vacia: string;
  etiqueta: string;
}

interface Props {
  valor: string;
  textos: TextosNota;
  onCambio: (html: string) => void;
}

/** Las seis órdenes, con su icono y su rótulo. */
const ORDENES = [
  { orden: 'bold', Icono: TextBIcon, clave: 'negrita' },
  { orden: 'italic', Icono: TextItalicIcon, clave: 'cursiva' },
  { orden: 'underline', Icono: TextUnderlineIcon, clave: 'subrayado' },
  { orden: 'strikeThrough', Icono: TextStrikethroughIcon, clave: 'tachado' },
  { orden: 'insertUnorderedList', Icono: ListBulletsIcon, clave: 'vinetas' },
  { orden: 'insertOrderedList', Icono: ListNumbersIcon, clave: 'numeros' },
] as const;

export default function NotaConFormato({ valor, textos, onCambio }: Props) {
  const campo = useRef<HTMLDivElement>(null);
  const [activos, setActivos] = useState<Record<string, boolean>>({});

  /*
    El HTML solo baja al DOM cuando difiere de lo que ya hay.

    Sin esta comparación, cada pulsación devolvería el mismo HTML por otro
    camino y el cursor saltaría al principio. Con ella, escribir no toca
    el DOM desde React y restaurar lo guardado sí.
  */
  useEffect(() => {
    const el = campo.current;
    if (el && el.innerHTML !== valor) el.innerHTML = valor;
  }, [valor]);

  /** Qué formatos están puestos donde está el cursor, para encender la barra. */
  const mirarActivos = () => {
    const estado: Record<string, boolean> = {};
    for (const { orden, clave } of ORDENES) {
      try {
        estado[clave] = document.queryCommandState(orden);
      } catch {
        estado[clave] = false;
      }
    }
    setActivos(estado);
  };

  const aplicar = (orden: string) => {
    document.execCommand(orden);
    // Lo que acaba de cambiar hay que leerlo y guardarlo: `execCommand` no
    // dispara `input` en todos los navegadores.
    const el = campo.current;
    if (el) onCambio(sanearNota(el.innerHTML));
    mirarActivos();
  };

  return (
    <div className="nota-formato">
      {/*
        `onMouseDown` con `preventDefault` y no `onClick`: al pulsar un
        botón el navegador quita el foco del campo, y con el foco se va la
        selección — que es justo sobre lo que hay que aplicar el formato.
      */}
      <div className="barra-formato" role="toolbar" aria-label={textos.etiqueta}>
        {ORDENES.map(({ orden, Icono, clave }) => (
          <button
            key={orden}
            type="button"
            className="boton-formato"
            aria-pressed={activos[clave] ?? false}
            title={textos[clave]}
            aria-label={textos[clave]}
            onMouseDown={(e) => {
              e.preventDefault();
              aplicar(orden);
            }}
          >
            <Icono aria-hidden="true" />
          </button>
        ))}
      </div>

      <div
        ref={campo}
        className="campo-nota"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={textos.etiqueta}
        data-vacia={textos.vacia}
        spellCheck
        onInput={(e) => onCambio(sanearNota(e.currentTarget.innerHTML))}
        onKeyUp={mirarActivos}
        onMouseUp={mirarActivos}
        onFocus={mirarActivos}
        onPaste={(e) => {
          /*
            Lo pegado se sanea ANTES de entrar, no después.

            Dejarlo entrar y limpiarlo en el `input` siguiente funcionaría,
            pero durante un instante el documento tendría dentro lo que
            venga de fuera. Aquí no llega a entrar: se lee del portapapeles,
            se pasa por el mismo filtro y se inserta ya limpio. El formato
            que sobreviva —negritas, listas— se conserva; lo demás no.
          */
          e.preventDefault();
          const html = e.clipboardData.getData('text/html');
          const texto = e.clipboardData.getData('text/plain');
          if (html) document.execCommand('insertHTML', false, sanearNota(html));
          else document.execCommand('insertText', false, texto);
          const el = campo.current;
          if (el) onCambio(sanearNota(el.innerHTML));
        }}
      />
    </div>
  );
}
