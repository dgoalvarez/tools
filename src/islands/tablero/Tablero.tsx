/**
 * El tablero: la rejilla de piezas y sus mandos.
 *
 * ---------------------------------------------------------------------
 * La rejilla no se ve
 *
 * No hay líneas ni celdas pintadas. Las piezas son las tarjetas y el
 * hueco entre ellas es todo lo que se percibe; solo al arrastrar aparece
 * un contorno donde va a caer. Un tablero con la cuadrícula dibujada
 * parece una hoja de cálculo, y esta vista tiene que parecer un sitio de
 * trabajo vacío.
 *
 * Por eso también hay tan poco texto: lo que se explica se explica en el
 * paso a paso, no en la pantalla. Lo único escrito que se queda es la
 * línea de dónde se guarda, y esa no es opcional — es la regla de la
 * casa: si el sitio guarda algo, la pantalla lo dice.
 *
 * ---------------------------------------------------------------------
 * El alto de fila es FIJO
 *
 * `grid-auto-rows` con una medida escrita, no `auto` ni `minmax`. Es la
 * trampa que ya está apuntada: contra una fila de alto indefinido, el
 * `height: 100%` de dentro se resuelve como `auto`, la caja crece con su
 * contenido y el desplazamiento interior no aparece nunca. Una lista de
 * cuarenta líneas dentro de una pieza tiene que ceñirse a su hueco, no
 * estirar la fila.
 */
import { Suspense, lazy, useMemo, useRef, useState, type ComponentType } from 'react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DotsSixVerticalIcon,
  PlusIcon,
  XIcon,
} from '@phosphor-icons/react';

import { t, type Lang } from '../../i18n/config';
import { TABLERO_TEXTOS as TX } from '../../i18n/tablero';
import { moverA } from '../../lib/mover';
import { TOPE_PIEZAS, nuevoId, type Pieza, type Tablero as Piezas } from '../../lib/tablero';
import { WIDGETS, medidasDe, type Talla, type WidgetKey } from '../../lib/widgets';
import { COMPONENTE } from './catalogo';
import ElegirWidget from './ElegirWidget';
import type { PropsWidget } from './tipos';

interface Props {
  lang: Lang;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const cache = new Map<WidgetKey, ComponentType<PropsWidget<any>>>();

function componenteDe(tipo: WidgetKey) {
  if (!cache.has(tipo)) cache.set(tipo, lazy(COMPONENTE[tipo]!));
  return cache.get(tipo)!;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function Tablero({ lang }: Props) {
  const tr = (clave: keyof typeof TX) => t(TX[clave], lang);

  const [piezas, setPiezas] = useState<Piezas>([]);
  const [eligiendo, setEligiendo] = useState(false);

  /** Cuántas copias hay ya de cada tipo, para respetar su tope. */
  const puestos = useMemo(() => {
    const cuenta = new Map<WidgetKey, number>();
    for (const p of piezas) cuenta.set(p.tipo, (cuenta.get(p.tipo) ?? 0) + 1);
    return cuenta;
  }, [piezas]);

  /*
    La talla llega desde el panel, no de fábrica.

    Se elige mirando la muestra, que es cuando se sabe cuál se quiere: el
    alto de la muestra es el alto que va a tener la pieza. Se puede
    cambiar después en su barra, como siempre.
  */
  function anadir(tipo: WidgetKey, talla: Talla) {
    const widget = WIDGETS[tipo];
    setPiezas((antes) => [
      ...antes,
      { id: nuevoId(), tipo, talla, ajustes: { ...widget.ajustesIniciales } },
    ]);
    setEligiendo(false);
  }

  const cambiar = (id: string, parcial: Partial<Pieza>) =>
    setPiezas((antes) => antes.map((p) => (p.id === id ? { ...p, ...parcial } : p)));

  const quitar = (id: string) => setPiezas((antes) => antes.filter((p) => p.id !== id));

  /*
    Arrastrar, con el patrón ya probado en la libreta: el asa y no la
    pieza entera —dentro hay campos y un lienzo—, y el destino en una REF
    y no en el estado, porque React confirma los cambios cuando le viene
    bien y un arrastre rápido soltaría con el valor de antes del último
    movimiento. Eso ya costó un fallo medido una vez.

    Lo que cambia aquí: la rejilla es de DOS dimensiones, así que el
    destino no es una división por el alto de fila. Se leen los
    rectángulos de todas las piezas UNA vez al empezar —cero recálculos
    de maqueta mientras se mueve— y luego se busca aquella cuyo centro
    está más cerca del puntero.
  */
  const arrastrando = useRef<{
    id: string;
    desde: number;
    hasta: number;
    centros: { id: string; x: number; y: number }[];
  } | null>(null);
  const [aDonde, setADonde] = useState<number | null>(null);

  function empezarArrastre(evento: React.PointerEvent, id: string, indice: number) {
    const rejilla = (evento.currentTarget as HTMLElement).closest('.rejilla-tablero');
    if (!rejilla) return;
    evento.currentTarget.setPointerCapture?.(evento.pointerId);

    const centros = [...rejilla.querySelectorAll<HTMLElement>('.pieza-tablero')].map((el) => {
      const c = el.getBoundingClientRect();
      return { id: el.dataset.pieza!, x: c.left + c.width / 2, y: c.top + c.height / 2 };
    });

    arrastrando.current = { id, desde: indice, hasta: indice, centros };
    setADonde(indice);
  }

  function seguirArrastre(evento: React.PointerEvent) {
    const a = arrastrando.current;
    if (!a) return;

    let mejor = a.desde;
    let menor = Infinity;
    a.centros.forEach((c, i) => {
      const dx = evento.clientX - c.x;
      const dy = evento.clientY - c.y;
      const d = dx * dx + dy * dy;
      if (d < menor) {
        menor = d;
        mejor = i;
      }
    });

    a.hasta = mejor;
    setADonde(mejor);
  }

  function soltarArrastre() {
    const a = arrastrando.current;
    arrastrando.current = null;
    setADonde(null);
    if (a && a.hasta !== a.desde) setPiezas((antes) => moverA(antes, a.id, a.hasta));
  }

  const hayPiezas = piezas.length > 0;
  const lleno = piezas.length >= TOPE_PIEZAS;

  return (
    <div className="tablero">
      <div className="barra-tablero">
        <button
          type="button"
          className="boton-tablero"
          data-tour="tablero-anadir"
          disabled={lleno}
          onClick={() => setEligiendo(true)}
          aria-haspopup="dialog"
          aria-expanded={eligiendo}
        >
          <PlusIcon aria-hidden="true" size={15} />
          {tr('anadir')}
        </button>
      </div>

      <ElegirWidget
        lang={lang}
        abierto={eligiendo}
        onAbierto={setEligiendo}
        puestos={puestos}
        onAnadir={anadir}
      />

      {hayPiezas ? (
        <div className="rejilla-tablero">
          {piezas.map((pieza, i) => {
            const Widget = componenteDe(pieza.tipo);
            const widget = WIDGETS[pieza.tipo];
            const { cols, filas } = medidasDe(pieza.talla);

            return (
              <section
                key={pieza.id}
                className="pieza-tablero"
                data-pieza={pieza.id}
                data-arrastrada={arrastrando.current?.id === pieza.id || undefined}
                data-hueco={(aDonde === i && arrastrando.current?.id !== pieza.id) || undefined}
                style={{ '--cols': cols, '--filas': filas } as React.CSSProperties}
                aria-label={t(widget.nombre, lang)}
              >
                <div className="barra-pieza" data-tour={i === 0 ? 'tablero-pieza' : undefined}>
                  <span
                    className="asa-pieza"
                    aria-hidden="true"
                    onPointerDown={(e) => empezarArrastre(e, pieza.id, i)}
                    onPointerMove={seguirArrastre}
                    onPointerUp={soltarArrastre}
                    onPointerCancel={soltarArrastre}
                  >
                    <DotsSixVerticalIcon size={14} />
                  </span>

                  <span className="nombre-pieza">{t(widget.nombre, lang)}</span>

                  {/* Las tallas solo salen si el widget declara más de una:
                      un grupo de un solo botón no es una elección. */}
                  {widget.tallas.length > 1 && (
                    <div
                      className="tallas"
                      role="group"
                      aria-label={tr('talla')}
                      data-tour={i === 0 ? 'tablero-talla' : undefined}
                    >
                      {widget.tallas.map((talla: Talla) => (
                        <button
                          key={talla}
                          type="button"
                          aria-pressed={pieza.talla === talla}
                          onClick={() => cambiar(pieza.id, { talla })}
                        >
                          {talla.replace('x', '×')}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Las flechas hacen con el teclado lo que el asa con el
                      puntero. No son un extra: sin ellas, reordenar sería
                      imposible sin ratón. */}
                  <button
                    type="button"
                    className="mando-pieza"
                    disabled={i === 0}
                    aria-label={tr('moverAntes')}
                    title={tr('moverAntes')}
                    onClick={() => setPiezas((antes) => moverA(antes, pieza.id, i - 1))}
                  >
                    <ArrowLeftIcon aria-hidden="true" size={14} />
                  </button>
                  <button
                    type="button"
                    className="mando-pieza"
                    disabled={i === piezas.length - 1}
                    aria-label={tr('moverDespues')}
                    title={tr('moverDespues')}
                    onClick={() => setPiezas((antes) => moverA(antes, pieza.id, i + 1))}
                  >
                    <ArrowRightIcon aria-hidden="true" size={14} />
                  </button>
                  <button
                    type="button"
                    className="mando-pieza"
                    aria-label={tr('quitar')}
                    title={tr('quitar')}
                    onClick={() => quitar(pieza.id)}
                  >
                    <XIcon aria-hidden="true" size={14} />
                  </button>
                </div>

                {/*
                  El hueco de carga mide lo que la celda, no cero: si no,
                  montar un widget empujaría la rejilla y `npm run navegar`
                  lo cazaría como tirón — con razón.
                */}
                <div className="cuerpo-pieza">
                  <Suspense fallback={<div className="cargando-pieza" />}>
                    <Widget
                      lang={lang}
                      talla={pieza.talla}
                      ajustes={pieza.ajustes}
                      onAjustes={(parcial) =>
                        cambiar(pieza.id, { ajustes: { ...pieza.ajustes, ...parcial } })
                      }
                    />
                  </Suspense>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* El hueco vacío es él mismo el botón: en una vista sin texto, un
           rectángulo con un «+» dice lo que hay que hacer sin decirlo. */
        <button
          type="button"
          className="tablero-vacio"
          data-tour="tablero-vacio"
          onClick={() => setEligiendo(true)}
          aria-label={tr('anadir')}
        >
          <PlusIcon aria-hidden="true" size={28} />
        </button>
      )}
    </div>
  );
}
