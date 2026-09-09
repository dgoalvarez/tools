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
import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  DownloadSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import getStroke from 'perfect-freehand';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { aProporcion, cajaDeContornos } from '../lib/notas';

export interface TextosDibujo {
  etiqueta: string;
  deshacer: string;
  borrar: string;
  descargar: string;
  vacio: string;
  efimero: string;
  tinta: string;
  tintaLibre: string;
  grosor: string;
  rehacer: string;
  proporcion: string;
  cenido: string;
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

/**
 * El grosor, ahora continuo.
 *
 * Eran dos botones —fino y grueso— y con dos no se puede rodear algo con
 * un trazo discreto ni tachar con uno gordo: o te sobra o te falta. Los
 * topes salen de para qué sirve el lienzo: 2 px es lo más fino que se
 * sigue viendo en una pantalla normal y 32 es un rotulador de subrayar.
 */
const GROSOR_MIN = 2;
const GROSOR_MAX = 32;
const GROSOR_INICIAL = 5;

/**
 * El color con el que empieza la muestra libre.
 *
 * Un naranja que no es ninguna de las tres de arriba ni ninguno de los
 * acentos del sitio: así se nota que la cuarta muestra es OTRA cosa
 * antes de tocarla.
 */
const TINTA_LIBRE_INICIAL = '#ff8a3d';

/**
 * Cómo se encuadra lo que se descarga.
 *
 * El PNG se ciñe SIEMPRE a lo dibujado —el lienzo entero con un croquis
 * en una esquina no le sirve a nadie— y luego, si se pide una
 * proporción, se ENSANCHA hasta ella. Ensanchar y no recortar: recortar
 * a 1:1 un dibujo apaisado se comería los extremos, y el que descarga no
 * se enteraría hasta abrir el archivo.
 */
const PROPORCIONES = [
  { id: 'cenido', razon: 0 },
  { id: '1:1', razon: 1 },
  { id: '4:5', razon: 4 / 5 },
  { id: '16:9', razon: 16 / 9 },
] as const;

/** El margen que se deja alrededor del dibujo al ceñirlo, en px de CSS. */
const MARGEN = 16;

/**
 * La densidad del PNG, fija y no la de la pantalla.
 *
 * Con `devicePixelRatio` el mismo dibujo salía de 1200 px en un portátil
 * y de 600 en un monitor viejo, sin que nadie lo hubiera pedido. Dos es
 * la que hace que el trazo no se vea pixelado y que dos descargas del
 * mismo croquis midan lo mismo en cualquier aparato.
 */
const DENSIDAD_PNG = 2;

/** El contorno del trazo, en puntos. */
function puntosContorno(trazo: Trazo): number[][] {
  return getStroke(trazo.puntos, {
    size: trazo.grosor,
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.5,
    simulatePressure: true,
  });
}

/** El contorno del trazo, ya como camino para rellenar. */
function contorno(trazo: Trazo): Path2D {
  const puntos = puntosContorno(trazo);
  const camino = new Path2D();
  if (puntos.length === 0) return camino;

  camino.moveTo(puntos[0]![0], puntos[0]![1]);
  for (const [x, y] of puntos.slice(1)) camino.lineTo(x, y);
  camino.closePath();
  return camino;
}

/**
 * `var(--ink)` no lo entiende el lienzo: hay que resolverlo antes.
 *
 * Las tres muestras de fábrica son variables del sitio —así el dibujo
 * cambia con el tema— y la libre es un hexadecimal tal cual. Se
 * distinguen por el prefijo y no por una bandera aparte: lo que se
 * guarda en el trazo es lo que se va a pintar.
 */
function resolverTinta(estilo: CSSStyleDeclaration, tinta: string): string {
  if (!tinta.startsWith('var(')) return tinta;
  return estilo.getPropertyValue(tinta.slice(4, -1)).trim() || '#888';
}

export default function Dibujo({ textos }: Props) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [trazos, setTrazos] = useState<Trazo[]>([]);
  /* La tinta se guarda por su VALOR y no por su índice: desde que hay una
     muestra libre, «la tercera» ya no identifica a ninguna. */
  const [tinta, setTinta] = useState<string>(TINTAS[0]);
  const [tintaLibre, setTintaLibre] = useState(TINTA_LIBRE_INICIAL);
  const [grosor, setGrosor] = useState(GROSOR_INICIAL);
  const [proporcion, setProporcion] = useState<number>(0);

  /*
    El historial son ESTADOS enteros, no trazos sueltos.

    Con una pila de trazos, deshacer solo sabría quitar el último y
    «Borrar el dibujo» se quedaría fuera: es la acción que más duele
    perder y la única que no se rehace a mano. Guardando la lista entera
    en cada cambio, las tres acciones —trazar, deshacer, borrar— entran
    por la misma puerta.

    No cuesta lo que parece: los trazos no se copian, se copia el array
    que los apunta. Un croquis de cuarenta trazos son cuarenta
    referencias por paso.
  */
  const [pasado, setPasado] = useState<Trazo[][]>([]);
  const [futuro, setFuturo] = useState<Trazo[][]>([]);

  /** Cambia la lista dejando constancia, para poder volver. */
  function cambiar(siguientes: Trazo[]) {
    setPasado((p) => [...p, trazos]);
    // Dibujar algo nuevo después de deshacer corta la rama: lo rehecho ya
    // no encajaría con lo que hay ahora. Es lo que hace todo el mundo.
    setFuturo([]);
    setTrazos(siguientes);
  }

  function deshacer() {
    if (pasado.length === 0) return;
    setFuturo((f) => [...f, trazos]);
    setTrazos(pasado[pasado.length - 1]!);
    setPasado((p) => p.slice(0, -1));
  }

  function rehacer() {
    if (futuro.length === 0) return;
    setPasado((p) => [...p, trazos]);
    setTrazos(futuro[futuro.length - 1]!);
    setFuturo((f) => f.slice(0, -1));
  }

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

  /*
    Un repintado por FOTOGRAMA, no uno por evento.

    Un lápiz dispara `pointermove` más veces de las que la pantalla pinta,
    y cada uno pedía un repintado que redibujaba los cuarenta trazos
    enteros. Repintar dos veces entre dos fotogramas no se ve: es trabajo
    que se tira.

    `requestAnimationFrame` es el reloj de la pantalla, así que junta
    todos los eventos que caen entre dos pintados en un solo repintado.

    Los puntos NO se pierden por esto: se apuntan todos en la ref según
    llegan. Lo que se agrupa es el dibujar, no el escuchar.
  */
  const fotograma = useRef(0);
  const repintar = () => {
    if (fotograma.current) return;
    fotograma.current = requestAnimationFrame(() => {
      fotograma.current = 0;
      setTic((n) => n + 1);
    });
  };

  useEffect(() => () => cancelAnimationFrame(fotograma.current), []);

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
      ctx.fillStyle = resolverTinta(estilo, trazo.tinta);
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

  /**
   * La caja del lienzo, medida UNA vez al empezar el trazo.
   *
   * Se medía en cada punto, y medir obliga al navegador a recalcular la
   * maqueta ahí mismo. Con un lápiz que dispara doscientos eventos por
   * segundo, eso son doscientos recálculos mientras se dibuja — justo
   * cuando lo único que importa es que el trazo no se retrase.
   *
   * El lienzo no se mueve durante un trazo: lleva `touch-action: none`,
   * así que la página tampoco se desplaza debajo. Una sola medida vale
   * para todos los puntos.
   */
  const caja = useRef<DOMRect | null>(null);

  /**
   * Un punto, a partir de cualquier cosa que traiga coordenadas.
   *
   * Recibe el evento en crudo y no el de React porque los agrupados que
   * devuelve `getCoalescedEvents` son nativos: no pasan por el sistema de
   * eventos sintéticos y no tienen `currentTarget`.
   */
  const puntoEn = (e: { clientX: number; clientY: number; pressure?: number }): Punto => {
    const c = caja.current;
    if (!c) return [0, 0, 0.5];
    return [e.clientX - c.left, e.clientY - c.top, e.pressure || 0.5];
  };

  const hayAlgo = trazos.length > 0;

  /**
   * El PNG, ceñido a lo dibujado y en la proporción que se haya pedido.
   *
   * No se exporta el lienzo de pantalla: se pinta uno aparte del tamaño
   * de la caja y se dibujan los trazos desplazados a ella. Así el archivo
   * no arrastra el vacío de alrededor —que en una tarjeta de 530×300 con
   * una flecha en una esquina es casi todo— y no depende del tamaño que
   * tuviera la tarjeta en esa ventana.
   *
   * El fondo se queda TRANSPARENTE, como estaba. Vale para montarlo
   * encima de otra cosa, y a cambio hay que saberlo: un trazo claro
   * hecho en tema oscuro no se ve sobre un fondo blanco. Lo dice el aviso
   * de la tarjeta.
   */
  function descargar() {
    const el = lienzo.current;
    if (!el || trazos.length === 0) return;

    const cenida = cajaDeContornos(trazos.map(puntosContorno), MARGEN);
    if (!cenida) return;

    const caja = aProporcion(cenida, PROPORCIONES[proporcion]!.razon);

    const fuera = document.createElement('canvas');
    fuera.width = Math.max(1, Math.round(caja.ancho * DENSIDAD_PNG));
    fuera.height = Math.max(1, Math.round(caja.alto * DENSIDAD_PNG));

    const ctx = fuera.getContext('2d');
    if (!ctx) return;

    // Escalar y mover en la MISMA transformación: los trazos guardan sus
    // coordenadas en el lienzo de pantalla, y aquí el origen es otro.
    ctx.setTransform(
      DENSIDAD_PNG,
      0,
      0,
      DENSIDAD_PNG,
      -caja.x * DENSIDAD_PNG,
      -caja.y * DENSIDAD_PNG
    );

    // Los colores se resuelven contra el lienzo de VERDAD: el de aquí no
    // está en el documento y no hereda ninguna variable del sitio.
    const estilo = getComputedStyle(el);
    for (const trazo of trazos) {
      ctx.fillStyle = resolverTinta(estilo, trazo.tinta);
      ctx.fill(contorno(trazo));
    }

    const enlace = document.createElement('a');
    enlace.download = 'dibujo.png';
    enlace.href = fuera.toDataURL('image/png');
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
              aria-pressed={t === tinta}
              aria-label={`${textos.tinta} ${i + 1}`}
              title={`${textos.tinta} ${i + 1}`}
              onClick={() => setTinta(t)}
            />
          ))}

          {/*
            La cuarta muestra es el selector del sistema.

            Un `input type="color"` y no el selector del sitio: el de
            Paleta es una herramienta entera —plano, canales, tres
            espacios— y traerlo aquí metería 22 KB comprimidos de
            aritmética de color en una página que hoy no los carga, para
            elegir una tinta. El nativo cuesta cero, lo conoce todo el
            mundo, va con teclado y en escritorio trae cuentagotas.

            Pulsarla la elige ADEMÁS de abrir el selector: si no, volver a
            tu color después de usar el rojo obligaría a elegirlo otra vez.
          */}
          <input
            type="color"
            className="muestra-tinta libre"
            value={tintaLibre}
            aria-label={textos.tintaLibre}
            title={textos.tintaLibre}
            data-elegida={tinta === tintaLibre || undefined}
            onClick={() => setTinta(tintaLibre)}
            onChange={(e) => {
              setTintaLibre(e.target.value);
              setTinta(e.target.value);
            }}
          />

          {/*
            El grosor vive en un popover, como el color en Paleta.

            El deslizador puesto en la cabecera la ensanchaba, y una
            cabecera que cambia de tamaño según lo que lleve dentro
            arrastra a la tarjeta y a las otras dos, que van estiradas a
            la misma altura. Aquí el disparador mide siempre lo mismo —una
            caja del tamaño del punto más gordo— y el mando se despliega
            encima sin mover nada.

            El disparador ES la muestra: enseña el punto a tamaño real y
            en la tinta elegida, así que dice cuánto va a salir el trazo
            sin tener que abrirlo. Un deslizador solo dice «más» y
            «menos»; el punto responde la pregunta de verdad.
          */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="punto-grosor"
                aria-label={`${textos.grosor}: ${grosor}`}
                title={`${textos.grosor}: ${grosor}`}
              >
                <span
                  aria-hidden="true"
                  style={{ width: `${grosor}px`, height: `${grosor}px`, background: tinta }}
                />
              </button>
            </PopoverTrigger>

            <PopoverContent align="end" className="tarjeta-grosor">
              <label htmlFor="grosor-trazo">{textos.grosor}</label>
              <input
                id="grosor-trazo"
                type="range"
                min={GROSOR_MIN}
                max={GROSOR_MAX}
                step={1}
                value={grosor}
                onChange={(e) => setGrosor(Number(e.target.value))}
              />
              <span className="cifra-grosor">{grosor}</span>
            </PopoverContent>
          </Popover>

          {/*
            Deshacer, rehacer y borrar viven aquí y no en el pie.

            El reparto es por lo que hace cada cosa: la cabecera es lo que
            actúa SOBRE EL LIENZO —qué tinta, qué grosor, quitar, devolver,
            vaciar— y el pie es lo que lo saca de aquí —en qué proporción y
            descargar—. Antes estaban los cinco abajo y la fila no cabía en
            478 px: la papelera se caía sola a un tercer renglón, la
            tarjeta crecía y arrastraba a la lista y a la nota, que van
            estiradas a la misma altura.

            Sin rótulo los tres, que es lo que permite que quepan; el
            nombre está en el rótulo accesible y en el emergente. El icono
            de la flecha en círculo es el mismo que usa la lista de al
            lado para deshacer.

            Deshacer y rehacer SALEN SOLO cuando sirven, en vez de
            quedarse en gris: rehacer no existe hasta que se deshace algo,
            y anunciarlo antes sería ofrecer una función que aún no hay.
            Vaciar sí se queda siempre, deshabilitado, porque es el único
            que puede pulsarse sin querer y su hueco fijo evita que los
            otros dos bailen de sitio al aparecer.
          */}
          <span className="separa-mandos" aria-hidden="true" />

          {pasado.length > 0 && (
            <button
              type="button"
              className="mando-lienzo"
              aria-label={textos.deshacer}
              title={textos.deshacer}
              onClick={deshacer}
            >
              <ArrowCounterClockwiseIcon aria-hidden="true" size={15} />
            </button>
          )}

          {futuro.length > 0 && (
            <button
              type="button"
              className="mando-lienzo"
              aria-label={textos.rehacer}
              title={textos.rehacer}
              onClick={rehacer}
            >
              <ArrowClockwiseIcon aria-hidden="true" size={15} />
            </button>
          )}

          <button
            type="button"
            className="mando-lienzo"
            disabled={!hayAlgo}
            aria-label={textos.borrar}
            title={textos.borrar}
            onClick={() => cambiar([])}
          >
            <TrashIcon aria-hidden="true" size={15} />
          </button>
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
            caja.current = e.currentTarget.getBoundingClientRect();
            enCurso.current = { puntos: [puntoEn(e)], tinta, grosor };
            repintar();
          }}
          onPointerMove={(e) => {
            const trazo = enCurso.current;
            if (!trazo) return;

            /*
              Todos los puntos que el aparato midió, no solo el último.

              Entre dos `pointermove` que llegan a JavaScript puede haber
              media docena de posiciones que el navegador midió y guardó
              sin avisar. Quedarse con la última endereza las curvas
              rápidas: el trazo sale a trozos rectos en vez de curvo.
              `getCoalescedEvents` las devuelve todas.
            */
            const agrupados = e.nativeEvent.getCoalescedEvents?.() ?? [];
            for (const bruto of agrupados.length ? agrupados : [e.nativeEvent]) {
              trazo.puntos.push(puntoEn(bruto));
            }
            repintar();
          }}
          onPointerUp={() => {
            const trazo = enCurso.current;
            if (!trazo) return;
            enCurso.current = null;
            // Un toque sin arrastrar no es un trazo: sería un punto suelto
            // que no se ve y que ensucia el «deshacer».
            if (trazo.puntos.length > 1) cambiar([...trazos, trazo]);
            else repintar();
          }}
          onPointerLeave={() => {
            const trazo = enCurso.current;
            if (!trazo) return;
            enCurso.current = null;
            if (trazo.puntos.length > 1) cambiar([...trazos, trazo]);
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
          {/*
            La proporción, pegada al botón que descarga: es lo único a lo
            que afecta y no cambia nada de lo que se ve en pantalla.

            Y está SIEMPRE, también con el lienzo vacío. Enseñarla solo al
            haber trazos cambiaba el alto del pie, y con él el de la
            tarjeta y el de las otras dos, que van estiradas a la misma
            altura: el primer trazo empujaba media libreta hacia abajo. Es
            el mismo tirón que se quitó de la navegación y de la lista,
            entrando por la tercera puerta.
          */}
          <div className="proporciones" role="group" aria-label={textos.proporcion}>
            {PROPORCIONES.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={i === proporcion}
                title={textos.proporcion}
                onClick={() => setProporcion(i)}
              >
                {p.id === 'cenido' ? textos.cenido : p.id}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" disabled={!hayAlgo} onClick={descargar}>
            <DownloadSimpleIcon aria-hidden="true" />
            {textos.descargar}
          </Button>
        </div>
      </div>
    </section>
  );
}
