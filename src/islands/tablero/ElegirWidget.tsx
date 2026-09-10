/**
 * Elegir qué se añade al tablero, viéndolo antes.
 *
 * ---------------------------------------------------------------------
 * Por qué un panel y no el desplegable que había
 *
 * El menú flotante funcionaba con dos herramientas y un nombre cada una.
 * En cuanto hay que decidir entre siete, «La lista» y «La nota» dicen
 * poco: lo que resuelve la duda es VER cómo es cada una y cuánto sitio
 * ocupa. Eso no cabe en un desplegable de doscientos píxeles.
 *
 * ---------------------------------------------------------------------
 * La muestra es el widget DE VERDAD, y está inerte
 *
 * No es un dibujo ni una captura: es el mismo componente que se va a
 * añadir, montado con sus ajustes de fábrica. Una miniatura pintada a
 * mano sería más barata y no descargaría nada, pero es una promesa
 * aparte: el día que cambiara el widget, la miniatura mentiría sin que
 * saltara ninguna alarma. Aquí no puede mentir porque es la misma cosa.
 *
 * Y va con `inert`, que es lo que lo hace mirable sin ser tocable. Importa
 * más de lo que parece: la lista y la nota comparten cuaderno con
 * /es/notas, así que la muestra enseña lo que ya hay escrito —eso está
 * bien, es informativo— pero escribir DENTRO de una vista previa sería
 * editar la libreta de verdad desde un sitio que no parece la libreta.
 * `inert` lo quita del alcance del puntero, del teclado y del lector de
 * una vez, sin tener que ir apagando manejadores uno a uno.
 *
 * El precio, dicho: enfocar una herramienta descarga su trozo. Solo esa,
 * y solo porque alguien abrió el panel y la señaló, que es una intención
 * bastante clara.
 *
 * ---------------------------------------------------------------------
 * La talla se elige aquí
 *
 * Antes se añadía con la talla de fábrica y se cambiaba después, en la
 * barra de la pieza. Se puede seguir haciendo, pero elegirla mientras se
 * mira la muestra es cuando de verdad se sabe cuál se quiere: el alto de
 * la muestra es el alto que va a tener en el tablero.
 */
import { Suspense, lazy, useEffect, useState, type ComponentType } from 'react';
import {
  ArrowsHorizontalIcon,
  ArrowsVerticalIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from '@phosphor-icons/react';

import Icono from '../../components/IconoReact';
import { Sheet, SheetClose, SheetContent, SheetTitle } from '../../components/ui/sheet';
import { t, type Lang } from '../../i18n/config';
import { TABLERO_TEXTOS as TX } from '../../i18n/tablero';
import {
  TOPE_COLS,
  TOPE_FILAS,
  WIDGETS,
  ceñir,
  type Medida,
  type WidgetKey,
} from '../../lib/widgets';
import { COMPONENTE, DISPONIBLES } from './catalogo';
import type { PropsWidget } from './tipos';

/* eslint-disable @typescript-eslint/no-explicit-any */
const cache = new Map<WidgetKey, ComponentType<PropsWidget<any>>>();

function componenteDe(tipo: WidgetKey) {
  if (!cache.has(tipo)) cache.set(tipo, lazy(COMPONENTE[tipo]!));
  return cache.get(tipo)!;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface Props {
  lang: Lang;
  abierto: boolean;
  onAbierto: (v: boolean) => void;
  /** Cuántas copias hay ya de cada tipo, para saber cuál llegó a su tope. */
  puestos: Map<WidgetKey, number>;
  onAnadir: (tipo: WidgetKey, medida: Medida) => void;
}

export default function ElegirWidget({ lang, abierto, onAbierto, puestos, onAnadir }: Props) {
  const tr = (clave: keyof typeof TX) => t(TX[clave], lang);

  const [enfocado, setEnfocado] = useState<WidgetKey>(DISPONIBLES[0]!);
  const [medida, setMedida] = useState<Medida>(WIDGETS[DISPONIBLES[0]!].medidaInicial);

  /*
    Al abrir se enfoca la primera que se pueda añadir.

    Abrir siempre sobre la misma —aunque esté puesta y su botón salga
    apagado— dejaba el panel enseñando algo que no se podía elegir, y con
    el botón de añadir deshabilitado nada más entrar.
  */
  useEffect(() => {
    if (!abierto) return;
    const libre =
      DISPONIBLES.find((c) => (puestos.get(c) ?? 0) < WIDGETS[c].tope) ?? DISPONIBLES[0]!;
    setEnfocado(libre);
    setMedida(WIDGETS[libre].medidaInicial);
    // `puestos` cambia con cada pieza que se añade; lo que dispara esto es
    // ABRIR, no que cambie el tablero por detrás.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  const widget = WIDGETS[enfocado];
  const Muestra = componenteDe(enfocado);
  const { cols, filas } = medida;
  const yaEsta = (puestos.get(enfocado) ?? 0) >= widget.tope;

  const tope = {
    cols: Math.min(widget.max.cols, TOPE_COLS),
    filas: Math.min(widget.max.filas, TOPE_FILAS),
  };

  function elegir(clave: WidgetKey) {
    setEnfocado(clave);
    setMedida(WIDGETS[clave].medidaInicial);
  }

  const cambiarTamano = (eje: 'cols' | 'filas', paso: 1 | -1) =>
    setMedida((m) => ceñir({ ...m, [eje]: m[eje] + paso }, widget));

  return (
    <Sheet open={abierto} onOpenChange={onAbierto}>
      <SheetContent aria-describedby={undefined}>
        <div className="fila-hoja-lateral">
          <SheetTitle>{tr('anadir')}</SheetTitle>
          <SheetClose className="cerrar-hoja-lateral" aria-label={tr('cerrar')}>
            <XIcon aria-hidden="true" size={16} />
          </SheetClose>
        </div>

        <div className="elegir-cuerpo">
          <div className="elegir-lista" role="radiogroup" aria-label={tr('elegir')}>
            {DISPONIBLES.map((clave) => {
              const w = WIDGETS[clave];
              const lleno = (puestos.get(clave) ?? 0) >= w.tope;
              return (
                <button
                  key={clave}
                  type="button"
                  role="radio"
                  data-widget={clave}
                  aria-checked={clave === enfocado}
                  /* Las que ya están puestas NO se deshabilitan: se pueden
                     mirar igual, y su botón de añadir es el que lo dice.
                     Un botón apagado no explica por qué lo está. */
                  data-lleno={lleno || undefined}
                  onClick={() => elegir(clave)}
                >
                  <Icono nombre={w.icono} tamano={17} />
                  {t(w.nombre, lang)}
                </button>
              );
            })}
          </div>

          <div className="elegir-vista">
            {/*
              El alto sale de la MISMA variable que la rejilla del tablero:
              lo que se ve aquí es lo alto que va a ser allí. El ancho no
              puede coincidir —depende de cuántas columnas quepan en la
              ventana— y por eso la muestra no promete anchura.
            */}
            <div
              className="muestra-widget"
              style={{ '--filas': filas } as React.CSSProperties}
              aria-label={tr('vistaPrevia')}
              role="img"
              inert
            >
              <Suspense fallback={<div className="cargando-pieza" />}>
                <Muestra
                  lang={lang}
                  ajustes={{ ...widget.ajustesIniciales }}
                  onAjustes={() => {}}
                  medida={medida}
                />
              </Suspense>
            </div>

            <div className="elegir-pie">
              {/*
                El mismo mando que en la barra de la pieza, y a propósito:
                lo que se aprende aquí sirve allí. Enseña la cifra porque
                aquí hay sitio y porque es lo que dice de un vistazo cuánto
                va a ocupar.
              */}
              {(tope.cols > widget.min.cols || tope.filas > widget.min.filas) && (
                <div className="tamano-pieza" role="group" aria-label={tr('tamano')}>
                  <ArrowsHorizontalIcon aria-hidden="true" size={12} />
                  <button
                    type="button"
                    disabled={cols <= widget.min.cols}
                    aria-label={tr('menosAncho')}
                    onClick={() => cambiarTamano('cols', -1)}
                  >
                    <MinusIcon aria-hidden="true" size={11} weight="bold" />
                  </button>
                  <span className="cifra-tamano">{cols}</span>
                  <button
                    type="button"
                    disabled={cols >= tope.cols}
                    aria-label={tr('masAncho')}
                    onClick={() => cambiarTamano('cols', 1)}
                  >
                    <PlusIcon aria-hidden="true" size={11} weight="bold" />
                  </button>

                  <ArrowsVerticalIcon aria-hidden="true" size={12} />
                  <button
                    type="button"
                    disabled={filas <= widget.min.filas}
                    aria-label={tr('menosAlto')}
                    onClick={() => cambiarTamano('filas', -1)}
                  >
                    <MinusIcon aria-hidden="true" size={11} weight="bold" />
                  </button>
                  <span className="cifra-tamano">{filas}</span>
                  <button
                    type="button"
                    disabled={filas >= tope.filas}
                    aria-label={tr('masAlto')}
                    onClick={() => cambiarTamano('filas', 1)}
                  >
                    <PlusIcon aria-hidden="true" size={11} weight="bold" />
                  </button>
                </div>
              )}

              <button
                type="button"
                className="boton-anadir"
                data-anadir={enfocado}
                disabled={yaEsta}
                onClick={() => onAnadir(enfocado, medida)}
              >
                {yaEsta ? tr('yaPuesto') : tr('anadirAlTablero')}
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
