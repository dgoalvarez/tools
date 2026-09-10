/**
 * Configurar una pieza, sin salir del tablero.
 *
 * ---------------------------------------------------------------------
 * El formulario no está escrito: se deriva
 *
 * Cada widget declara sus campos en `src/lib/widgets.ts` —tipo, rótulo y
 * lo que necesite cada tipo— y este panel los pinta. Nadie escribe un
 * formulario por widget, que es lo que garantiza que los cinco números
 * del pomodoro, el formato de los relojes y la ciudad del reloj mundial
 * se comporten igual: mismos topes, mismo teclado, mismo aspecto.
 *
 * El precio es que un ajuste raro no se puede pintar hasta que exista su
 * tipo de campo. Sale barato: la alternativa era ocho formularios que se
 * separan en silencio.
 *
 * ---------------------------------------------------------------------
 * Se aplica al momento, y no hay «Guardar»
 *
 * Un botón de guardar obligaría a llevar una copia del estado y a decidir
 * qué pasa si alguien cierra sin pulsarlo. Aquí cada cambio va derecho a
 * la pieza y se ve detrás del panel — cambiar la ciudad mueve la hora
 * mientras se mira. Y deshacer es volver a poner el valor, que es lo que
 * se acaba de hacer.
 */
import { useEffect, useMemo, useState } from 'react';
import { XIcon } from '@phosphor-icons/react';

import { Sheet, SheetClose, SheetContent, SheetTitle } from '../../components/ui/sheet';
import { t, type Lang } from '../../i18n/config';
import { TABLERO_TEXTOS as TX } from '../../i18n/tablero';
import {
  WIDGETS,
  type Campo,
  type CampoNumero,
  type CampoOpcion,
  type CampoZona,
} from '../../lib/widgets';
import { ZONAS, nombreDeZona } from '../../lib/zonas-codigo';
import type { Pieza } from '../../lib/tablero';

interface Props {
  lang: Lang;
  /** La pieza que se está configurando, o `null` si el panel está cerrado. */
  pieza: Pieza | null;
  onCerrar: () => void;
  onAjustes: (id: string, parcial: Record<string, number>) => void;
}

export default function PanelAjustes({ lang, pieza, onCerrar, onAjustes }: Props) {
  const tr = (clave: keyof typeof TX) => t(TX[clave], lang);

  const widget = pieza ? WIDGETS[pieza.tipo] : null;
  const campos = widget?.campos ?? [];

  return (
    <Sheet open={pieza !== null} onOpenChange={(v) => !v && onCerrar()}>
      <SheetContent aria-describedby={undefined} className="hoja-ajustes">
        <div className="fila-hoja-lateral">
          <SheetTitle>{widget ? t(widget.nombre, lang) : tr('ajustes')}</SheetTitle>
          <SheetClose className="cerrar-hoja-lateral" aria-label={tr('cerrar')}>
            <XIcon aria-hidden="true" size={16} />
          </SheetClose>
        </div>

        <div className="lista-ajustes">
          {pieza &&
            campos.map((campo) => (
              <CampoAjuste
                key={campo.clave}
                lang={lang}
                campo={campo}
                valor={pieza.ajustes[campo.clave] as number}
                onValor={(v) => onAjustes(pieza.id, { [campo.clave]: v })}
              />
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* El tipo del campo va como parámetro: así cada subcomponente recibe el
   suyo ya estrechado y TypeScript ve sus propiedades dentro de los
   manejadores, no solo en el cuerpo. */
interface PropsCampo<C extends Campo = Campo> {
  lang: Lang;
  campo: C;
  valor: number;
  onValor: (v: number) => void;
}

/** Reparte según el tipo. Cada uno se pinta en su propia función. */
function CampoAjuste({ campo, ...resto }: PropsCampo) {
  // Se desestructura y se vuelve a pasar: con «{...props}» el discriminante
  // no estrecha nada y TypeScript sigue viendo el tipo ancho.
  if (campo.tipo === 'opcion') return <CampoDeOpcion campo={campo} {...resto} />;
  if (campo.tipo === 'zona') return <CampoDeZona campo={campo} {...resto} />;
  return <CampoDeNumero campo={campo} {...resto} />;
}

/**
 * Un grupo de botones, no un desplegable.
 *
 * Son dos o tres opciones: se ven todas a la vez y se elige de un toque.
 * Un desplegable con dos entradas esconde una de las dos detrás de un
 * clic y no ahorra nada de sitio.
 */
function CampoDeOpcion({ lang, campo, valor, onValor }: PropsCampo<CampoOpcion>) {
  return (
    <div className="campo-ajuste">
      <span className="rotulo-ajuste">{t(campo.rotulo, lang)}</span>

      <div className="opciones-ajuste" role="group" aria-label={t(campo.rotulo, lang)}>
        {campo.opciones.map((op) => (
          <button
            key={op.valor}
            type="button"
            aria-pressed={op.valor === valor}
            onClick={() => onValor(op.valor)}
          >
            {t(op.nombre, lang)}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * La ciudad, en un desplegable nativo.
 *
 * Aquí sí, y por lo contrario que arriba: son noventa y tantas. Un
 * `<select>` del sistema trae gratis la búsqueda por teclado —se escribe
 * «mad» y salta a Madrid—, el desplegable a pantalla completa del móvil y
 * el desplazamiento con el dedo. Escribir un buscador propio sería
 * reimplementar todo eso peor.
 *
 * Las opciones se ordenan por su NOMBRE en el idioma de quien mira, no
 * por su posición en la lista congelada: esa está ordenada por franja
 * horaria, que sirve para el código y no para buscar una ciudad.
 */
function CampoDeZona({ lang, campo, valor, onValor }: PropsCampo<CampoZona>) {
  const id = `ajuste-${campo.clave}`;

  // Se calcula una vez por idioma: son noventa llamadas a `Intl` y
  // rehacerlas en cada pintado se nota al tocar otro campo.
  const opciones = useMemo(
    () =>
      ZONAS.map((zona, indice) => ({ indice, nombre: nombreDeZona(zona, lang) })).sort((a, b) =>
        a.nombre.localeCompare(b.nombre, lang)
      ),
    [lang]
  );

  return (
    <div className="campo-ajuste campo-ancho">
      <label htmlFor={id}>{t(campo.rotulo, lang)}</label>

      <select id={id} value={valor} onChange={(e) => onValor(Number(e.target.value))}>
        {opciones.map((op) => (
          <option key={op.indice} value={op.indice}>
            {op.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Un número, y el campo NO gobierna su valor mientras se escribe.
 *
 * Un `<input type="number">` atado a un estado ceñido a mínimo y máximo
 * es imposible de escribir: al teclear el «5» de «50» el valor se ciñe a
 * su mínimo y el cursor se va. Se guarda el texto en bruto mientras la
 * mano está encima y se ciñe al salir del campo, que es cuando ya se sabe
 * qué se quiso escribir. Es el mismo patrón que ya usa `Numero` en
 * `Pomodoro.tsx`.
 */
function CampoDeNumero({ lang, campo, valor, onValor }: PropsCampo<CampoNumero>) {
  const [bruto, setBruto] = useState(String(valor));

  // Si el valor cambia por fuera —al abrir otra pieza— el campo tiene que
  // enterarse. Mientras se escribe no pasa: `valor` solo se mueve cuando
  // el propio campo lo mueve.
  useEffect(() => {
    setBruto(String(valor));
  }, [valor]);

  const ceñir = (n: number) => Math.min(Math.max(n, campo.min), campo.max);

  function confirmar() {
    // La coma decimal es lo que se escribe en español, y `Number` no la
    // entiende: sin esto, «2,5» se convierte en NaN y el campo salta a su
    // mínimo delante de quien lo acaba de escribir.
    const n = Number(bruto.replace(',', '.'));
    const bueno = Number.isFinite(n) ? redondear(ceñir(n), campo.paso) : valor;
    setBruto(String(bueno));
    if (bueno !== valor) onValor(bueno);
  }

  const id = `ajuste-${campo.clave}`;

  return (
    <div className="campo-ajuste">
      <label htmlFor={id}>{t(campo.rotulo, lang)}</label>

      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={campo.min}
        max={campo.max}
        step={campo.paso}
        value={bruto}
        onChange={(e) => setBruto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      />
      <span className="unidad-ajuste">{t(campo.unidad, lang)}</span>
    </div>
  );
}

/**
 * Redondea al salto del campo.
 *
 * Sin esto, escribir «2,7» en un campo de medios minutos se acepta tal
 * cual y el código no lo puede guardar: se escriben medios, así que al
 * copiar el tablero y volver a abrirlo saldría 2,5 y nadie sabría por
 * qué. Se redondea aquí, delante de quien lo escribe.
 */
function redondear(valor: number, paso: number): number {
  const n = Math.round(valor / paso) * paso;
  // Un paso de 0,5 da 2.5000000000000004 más veces de las que parece.
  return Math.round(n * 1000) / 1000;
}
