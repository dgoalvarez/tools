/**
 * El lienzo: un sitio para un croquis, una flecha o rodear algo.
 *
 * ---------------------------------------------------------------------
 * Esto NO sobrevive a una recarga, y hay que decirlo
 *
 * La lista y la nota viven en `sessionStorage` y aguantan un F5. El
 * dibujo no: se queda en memoria y muere con la recarga. Es una decisión
 * tomada, no un descuido, pero rompe lo que la pantalla promete un poco
 * más arriba —«se queda mientras esta pestaña siga abierta»— así que la
 * tarjeta lo dice y ofrece la salida: descargarlo.
 *
 * ---------------------------------------------------------------------
 * Se guardan los PUNTOS, no la imagen
 *
 * Un lienzo de 600×300 exportado a PNG son varios megas en base64. Los
 * puntos de un croquis son unos pocos kilobytes, se redibujan a cualquier
 * resolución y permiten deshacer un trazo, que con un mapa de bits
 * significaría guardar una copia entera por cada trazo.
 *
 * ---------------------------------------------------------------------
 * Por qué `perfect-freehand` y no `lineTo`
 *
 * Son 3 KB comprimidos y es la diferencia entre una línea de ancho
 * constante con esquinas duras y un trazo que se ve dibujado: la
 * biblioteca devuelve el CONTORNO del trazo —más ancho donde se va
 * despacio, más fino donde se corre— y eso se rellena como un polígono.
 * Con un lápiz que reporta presión, además, la usa.
 */
import { useEffect, useRef, useState } from 'react';
import { ArrowCounterClockwiseIcon, DownloadSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import getStroke from 'perfect-freehand';

import { Button } from '@/components/ui/button';

export interface TextosDibujo {
  etiqueta: string;
  deshacer: string;
  borrar: string;
  descargar: string;
  vacio: string;
  efimero: string;
  tinta: string;
  grosor: string;
}

interface Props {
  textos: TextosDibujo;
}

/** Un punto: dónde y con cuánta presión. */
type Punto = [number, number, number];

interface Trazo {
  puntos: Punto[];
  tinta: string;
  grosor: number;
}

/*
  Las tintas salen de las variables del sitio, no de códigos sueltos: así
  el dibujo cambia con el tema como todo lo demás y nadie tiene que
  acordarse de actualizar un hexadecimal aquí dentro.
*/
const TINTAS = ['var(--ink)', 'var(--acento)', 'var(--danger)'] as const;
const GROSORES = [4, 10] as const;

/** El contorno del trazo, ya como camino para rellenar. */
function contorno(trazo: Trazo): Path2D {
  const puntos = getStroke(trazo.puntos, {
    size: trazo.grosor,
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.5,
    simulatePressure: true,
  });

  const camino = new Path2D();
  if (puntos.length === 0) return camino;

  camino.moveTo(puntos[0]![0], puntos[0]![1]);
  for (const [x, y] of puntos.slice(1)) camino.lineTo(x, y);
  camino.closePath();
  return camino;
}

export default function Dibujo({ textos }: Props) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [trazos, setTrazos] = useState<Trazo[]>([]);
  const [tinta, setTinta] = useState(0);
  const [grosor, setGrosor] = useState(0);

  /*
    El trazo que se está haciendo vive en una REF, no en el estado.

    Un puntero dispara `pointermove` muchas veces entre dos pintados, y el
    estado de React no se ha actualizado todavía cuando llega el segundo:
    leyéndolo desde el cierre, cada movimiento veía el trazo tal y como
    estaba al empezar y se perdían todos los puntos menos el último. Con
    un lápiz rápido eso es una línea de dos puntos en vez de una curva.

    La ref se actualiza al instante; el `tic` es lo único que va al estado,
    y solo sirve para pedir un repintado.
  */
  const enCurso = useRef<Trazo | null>(null);
  const [, setTic] = useState(0);
  const repintar = () => setTic((n) => n + 1);

  /*
    El lienzo se redibuja entero en cada cambio, y a propósito.

    Pintar solo lo nuevo sería más rápido, pero obliga a llevar una copia
    del mapa de bits para poder deshacer. Un croquis son decenas de
    trazos, no miles: redibujar los cuarenta cuesta menos de un
    fotograma, y a cambio deshacer es quitar el último del array.
  */
  useEffect(() => {
    const el = lienzo.current;
    if (!el) return;

    const ctx = el.getContext('2d');
    if (!ctx) return;

    // El lienzo se dimensiona en píxeles REALES y se escala. Sin esto, en
    // una pantalla de densidad doble el trazo sale borroso.
    const densidad = window.devicePixelRatio || 1;
    const caja = el.getBoundingClientRect();
    // Se miran las DOS medidas. Mirando solo el ancho, un cambio de alto
    // —el tamaño de letra del sitio, girar el teléfono— dejaba el mapa de
    // bits con el alto viejo y el dibujo salía estirado.
    const ancho = Math.round(caja.width * densidad);
    const alto = Math.round(caja.height * densidad);
    if (el.width !== ancho || el.height !== alto) {
      el.width = ancho;
      el.height = alto;
    }

    ctx.setTransform(densidad, 0, 0, densidad, 0, 0);
    ctx.clearRect(0, 0, caja.width, caja.height);

    const estilo = getComputedStyle(el);
    for (const trazo of [...trazos, ...(enCurso.current ? [enCurso.current] : [])]) {
      // `var(--ink)` no lo entiende el lienzo: hay que resolverlo antes.
      ctx.fillStyle = estilo.getPropertyValue(trazo.tinta.slice(4, -1)).trim() || '#888';
      ctx.fill(contorno(trazo));
    }
  });

  /** Redibuja cuando cambia el tamaño de la tarjeta. */
  useEffect(() => {
    const el = lienzo.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(() => setTrazos((t) => [...t]));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  const puntoDe = (e: React.PointerEvent<HTMLCanvasElement>): Punto => {
    const caja = e.currentTarget.getBoundingClientRect();
    return [e.clientX - caja.left, e.clientY - caja.top, e.pressure || 0.5];
  };

  const hayAlgo = trazos.length > 0;

  function descargar() {
    const el = lienzo.current;
    if (!el) return;
    const enlace = document.createElement('a');
    enlace.download = 'dibujo.png';
    enlace.href = el.toDataURL('image/png');
    enlace.click();
  }

  return (
    <section
      className="tarjeta-control tarjeta-dibujo"
      aria-labelledby="titulo-dibujo"
      data-tour="dibujo"
    >
      <div className="cabecera-modo">
        <p className="titulo" id="titulo-dibujo">
          {textos.etiqueta}
        </p>

        <div className="mandos-dibujo">
          {TINTAS.map((t, i) => (
            <button
              key={t}
              type="button"
              className="muestra-tinta"
              style={{ background: t }}
              aria-pressed={i === tinta}
              aria-label={`${textos.tinta} ${i + 1}`}
              title={`${textos.tinta} ${i + 1}`}
              onClick={() => setTinta(i)}
            />
          ))}

          {GROSORES.map((g, i) => (
            <button
              key={g}
              type="button"
              className="muestra-grosor"
              aria-pressed={i === grosor}
              aria-label={`${textos.grosor} ${i + 1}`}
              title={`${textos.grosor} ${i + 1}`}
              onClick={() => setGrosor(i)}
            >
              <span style={{ height: `${g / 2}px` }} />
            </button>
          ))}
        </div>
      </div>

      {/* El lienzo va envuelto porque un `<canvas>` es un elemento
          reemplazado: no admite `::before`, así que la pista de «dibuja
          aquí» tiene que ser un hermano encima. */}
      <div className="caja-lienzo">
        {!hayAlgo && <p className="pista-lienzo">{textos.vacio}</p>}
        <canvas
          ref={lienzo}
          className="lienzo"
          aria-label={textos.etiqueta}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId);
            enCurso.current = {
              puntos: [puntoDe(e)],
              tinta: TINTAS[tinta]!,
              grosor: GROSORES[grosor]!,
            };
            repintar();
          }}
          onPointerMove={(e) => {
            const trazo = enCurso.current;
            if (!trazo) return;
            trazo.puntos.push(puntoDe(e));
            repintar();
          }}
          onPointerUp={() => {
            const trazo = enCurso.current;
            if (!trazo) return;
            enCurso.current = null;
            // Un toque sin arrastrar no es un trazo: sería un punto suelto
            // que no se ve y que ensucia el «deshacer».
            if (trazo.puntos.length > 1) setTrazos((t) => [...t, trazo]);
            else repintar();
          }}
          onPointerLeave={() => {
            const trazo = enCurso.current;
            if (!trazo) return;
            enCurso.current = null;
            if (trazo.puntos.length > 1) setTrazos((t) => [...t, trazo]);
            else repintar();
          }}
        />
      </div>

      <div className="pie-lista">
        {/* El aviso NO es letra pequeña de descargo: aquí arriba la lista y
            la nota sí aguantan una recarga, así que callarse esto sería
            dejar que se pierda un dibujo por creer lo que promete la
            tarjeta de al lado. */}
        <p className="contador">{textos.efimero}</p>

        <div className="acciones-dibujo">
          <Button
            variant="outline"
            size="sm"
            disabled={!hayAlgo}
            onClick={() => setTrazos((t) => t.slice(0, -1))}
          >
            <ArrowCounterClockwiseIcon aria-hidden="true" />
            {textos.deshacer}
          </Button>

          <Button variant="outline" size="sm" disabled={!hayAlgo} onClick={descargar}>
            <DownloadSimpleIcon aria-hidden="true" />
            {textos.descargar}
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!hayAlgo}
            onClick={() => setTrazos([])}
            aria-label={textos.borrar}
            title={textos.borrar}
          >
            <TrashIcon aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
