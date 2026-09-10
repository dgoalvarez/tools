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
  ArrowsHorizontalIcon,
  ArrowsVerticalIcon,
  DotsSixVerticalIcon,
  GearSixIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from '@phosphor-icons/react';

import { t, type Lang } from '../../i18n/config';
import { TABLERO_TEXTOS as TX } from '../../i18n/tablero';
import { moverA } from '../../lib/mover';
import { TOPE_PIEZAS, nuevoId, type Pieza, type Tablero as Piezas } from '../../lib/tablero';
import {
  TOPE_COLS,
  TOPE_FILAS,
  WIDGETS,
  ceñir,
  type Medida,
  type WidgetKey,
} from '../../lib/widgets';
import { COMPONENTE } from './catalogo';
import ElegirWidget from './ElegirWidget';
import PanelAjustes from './PanelAjustes';
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

  /*
    Qué pieza se está configurando, por ID y no por objeto.

    Guardando el objeto, el panel seguiría enseñando la copia de cuando se
    abrió: cada cambio hace una pieza nueva, así que los campos se verían
    congelados en el valor de entrada mientras el tablero de detrás sí
    cambia. Con el id se busca la pieza viva en cada pintado.
  */
  const [configurando, setConfigurando] = useState<string | null>(null);

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
  function anadir(tipo: WidgetKey, medida: Medida) {
    const widget = WIDGETS[tipo];
    setPiezas((antes) => [
      ...antes,
      { id: nuevoId(), tipo, medida: ceñir(medida, widget), ajustes: { ...widget.ajustesIniciales } },
    ]);
    setEligiendo(false);
  }

  /*
    Crecer y encoger, un paso cada vez.

    El tamaño se ciñe SIEMPRE al pasar por «ceñir», así que un botón no
    puede sacar la pieza de lo que su widget admite ni de la rejilla. Eso
    permite tenerlos siempre pintados y apagados en su tope, en vez de
    hacerlos aparecer y desaparecer: un botón que desaparece mueve los de
    al lado justo cuando se está pulsando.
  */
  function redimensionar(id: string, eje: 'cols' | 'filas', paso: 1 | -1) {
    setPiezas((antes) =>
      antes.map((p) => {
        if (p.id !== id) return p;
        const pedido = { ...p.medida, [eje]: p.medida[eje] + paso };
        return { ...p, medida: ceñir(pedido, WIDGETS[p.tipo]) };
      })
    );
  }

  const ajustar = (id: string, parcial: Record<string, unknown>) =>
    setPiezas((antes) =>
      antes.map((p) => (p.id === id ? { ...p, ajustes: { ...p.ajustes, ...parcial } } : p))
    );

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

  /*
    Redimensionar arrastrando la esquina.

    El tamaño se calcula contra la CELDA, no contra el puntero: se mide
    una vez el ancho de una columna y el alto de una fila al empezar, y
    a partir de ahí cuántas celdas se ha movido el dedo. Siguiendo al
    puntero en píxeles la pieza cambiaría de tamaño a mitad de celda y
    volvería atrás, que es el temblor que tienen los redimensionados
    mal hechos.

    Y el estado va en una REF, no en `useState`: React confirma cuando
    le viene bien y un arrastre rápido soltaría con el valor de antes
    del último movimiento. Ya costó un fallo medido en la libreta.
  */
  const midiendo = useRef<{
    id: string;
    x: number;
    y: number;
    cols: number;
    filas: number;
    anchoCelda: number;
    altoCelda: number;
  } | null>(null);

  function empezarTamano(evento: React.PointerEvent, pieza: Pieza) {
    const caja = (evento.currentTarget as HTMLElement).closest('.pieza-tablero');
    const rejilla = caja?.closest('.rejilla-tablero');
    if (!caja || !rejilla) return;

    evento.preventDefault();
    evento.currentTarget.setPointerCapture?.(evento.pointerId);

    const r = caja.getBoundingClientRect();
    const estilo = getComputedStyle(rejilla);
    const hueco = parseFloat(estilo.columnGap) || 0;

    midiendo.current = {
      id: pieza.id,
      x: evento.clientX,
      y: evento.clientY,
      cols: pieza.medida.cols,
      filas: pieza.medida.filas,
      // El ancho de UNA columna sale de la pieza y no de la rejilla:
      // así no hay que saber cuántas columnas hay ni cuánto suman los
      // huecos, que es justo lo que cambia con la ventana.
      anchoCelda: (r.width + hueco) / pieza.medida.cols,
      altoCelda: (r.height + hueco) / pieza.medida.filas,
    };
  }

  function seguirTamano(evento: React.PointerEvent) {
    const m = midiendo.current;
    if (!m) return;

    const pedido = {
      cols: m.cols + Math.round((evento.clientX - m.x) / m.anchoCelda),
      filas: m.filas + Math.round((evento.clientY - m.y) / m.altoCelda),
    };

    setPiezas((antes) =>
      antes.map((p) => {
        if (p.id !== m.id) return p;
        const ceñida = ceñir(pedido, WIDGETS[p.tipo]);
        // Se devuelve el MISMO objeto si no cambia nada: sin esto, cada
        // píxel del arrastre vuelve a pintar la rejilla entera.
        if (ceñida.cols === p.medida.cols && ceñida.filas === p.medida.filas) return p;
        return { ...p, medida: ceñida };
      })
    );
  }

  const soltarTamano = () => {
    midiendo.current = null;
  };

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

      <PanelAjustes
        lang={lang}
        pieza={piezas.find((p) => p.id === configurando) ?? null}
        onCerrar={() => setConfigurando(null)}
        onAjustes={ajustar}
      />

      {hayPiezas ? (
        <div className="rejilla-tablero">
          {piezas.map((pieza, i) => {
            const Widget = componenteDe(pieza.tipo);
            const widget = WIDGETS[pieza.tipo];
            const { cols, filas } = pieza.medida;
            const tope = {
              cols: Math.min(widget.max.cols, TOPE_COLS),
              filas: Math.min(widget.max.filas, TOPE_FILAS),
            };

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

                  {/*
                    Ancho y alto, un paso cada vez.

                    Son lo que hace el asa de la esquina, pero con el
                    teclado. No es un extra: el proyecto ya se comprometió
                    en el paso a paso de notas con que arrastrar no puede
                    ser la única forma de hacer algo.

                    Un eje solo sale si de verdad se puede mover: un widget
                    cuyo mínimo y máximo coinciden en anchura no tiene nada
                    que elegir ahí, y dos botones muertos ocupan el sitio
                    que en una pieza pequeña hace falta.
                  */}
                  {(tope.cols > widget.min.cols || tope.filas > widget.min.filas) && (
                    <div
                      className="tamano-pieza"
                      role="group"
                      aria-label={tr('tamano')}
                      data-tour={i === 0 ? 'tablero-talla' : undefined}
                    >
                      {tope.cols > widget.min.cols && (
                        <>
                          <ArrowsHorizontalIcon aria-hidden="true" size={11} />
                          <button
                            type="button"
                            disabled={cols <= widget.min.cols}
                            aria-label={tr('menosAncho')}
                            title={tr('menosAncho')}
                            onClick={() => redimensionar(pieza.id, 'cols', -1)}
                          >
                            <MinusIcon aria-hidden="true" size={10} weight="bold" />
                          </button>
                          <button
                            type="button"
                            disabled={cols >= tope.cols}
                            aria-label={tr('masAncho')}
                            title={tr('masAncho')}
                            onClick={() => redimensionar(pieza.id, 'cols', 1)}
                          >
                            <PlusIcon aria-hidden="true" size={10} weight="bold" />
                          </button>
                        </>
                      )}

                      {tope.filas > widget.min.filas && (
                        <>
                          <ArrowsVerticalIcon aria-hidden="true" size={11} />
                          <button
                            type="button"
                            disabled={filas <= widget.min.filas}
                            aria-label={tr('menosAlto')}
                            title={tr('menosAlto')}
                            onClick={() => redimensionar(pieza.id, 'filas', -1)}
                          >
                            <MinusIcon aria-hidden="true" size={10} weight="bold" />
                          </button>
                          <button
                            type="button"
                            disabled={filas >= tope.filas}
                            aria-label={tr('masAlto')}
                            title={tr('masAlto')}
                            onClick={() => redimensionar(pieza.id, 'filas', 1)}
                          >
                            <PlusIcon aria-hidden="true" size={10} weight="bold" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* La rueda solo sale si el widget declara algo que
                      configurar. Un botón que abre un panel vacío es peor
                      que no tenerlo. */}
                  {widget.campos && widget.campos.length > 0 && (
                    <button
                      type="button"
                      className="mando-pieza"
                      aria-label={tr('configurar')}
                      title={tr('configurar')}
                      onClick={() => setConfigurando(pieza.id)}
                    >
                      <GearSixIcon aria-hidden="true" size={14} />
                    </button>
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
                      medida={pieza.medida}
                      ajustes={pieza.ajustes}
                      onAjustes={(parcial) =>
                        cambiar(pieza.id, { ajustes: { ...pieza.ajustes, ...parcial } })
                      }
                    />
                  </Suspense>
                </div>

                {/*
                  El asa de la esquina.

                  Es lo que hace que esto se sienta un bento y no un
                  formulario de tamaños. Va con `touch-action: none` en
                  el CSS porque sin eso el navegador se queda el gesto en
                  cuanto se mueve un pelo en vertical, que es justo una
                  de las dos direcciones en las que sirve.

                  `aria-hidden`: lo que hace ya lo hacen los botones de
                  la barra, con nombre y accesibles con teclado. Un asa
                  anunciada sin poder usarse sería ruido.
                */}
                {(tope.cols > widget.min.cols || tope.filas > widget.min.filas) && (
                  <span
                    className="asa-tamano"
                    aria-hidden="true"
                    onPointerDown={(e) => empezarTamano(e, pieza)}
                    onPointerMove={seguirTamano}
                    onPointerUp={soltarTamano}
                    onPointerCancel={soltarTamano}
                  />
                )}
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
