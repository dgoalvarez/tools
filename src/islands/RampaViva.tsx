/**
 * La franja de la portada: once colores derivados de verdad.
 *
 * ---------------------------------------------------------------------
 * Qué hace aquí
 *
 * La portada afirma una cosa —«todo se calcula en tu navegador»— y hasta
 * ahora solo la decía. Esto la demuestra: cada casilla es un paso real de
 * una rampa OKLCH derivada por `construirRampa`, la misma aritmética que
 * mueve la herramienta de paletas. Ningún color está escrito a mano, ni
 * aquí ni en la hoja de estilos.
 *
 * Y son once casillas sueltas, no un degradado. Un degradado es
 * decoración y podría ser cualquier cosa; once pasos discretos con su
 * número son un instrumento, y además son EXACTAMENTE la forma que tiene
 * la cuadrícula de Paleta —mismo hueco de 3 px, mismo radio— tres filas
 * más abajo en el índice. La portada y la herramienta hablan igual.
 *
 * ---------------------------------------------------------------------
 * El reparto: la entrada es de CSS, lo vivo es de aquí
 *
 * De fábrica la rampa sale del tono de la marca, y la SIRVE EL SERVIDOR
 * ya derivada. Las once entran escalonadas con una animación de CSS que
 * no necesita a nadie: se posan en algo más de un segundo y se quedan
 * quietas. Eso pasa con las islas apagadas, con la red a medias y en las
 * capturas.
 *
 * Lo único que aporta esta isla es lo vivo: recorrer la franja vuelve a
 * sembrar el tono y las once se recalculan en el acto. Por eso monta con
 * `client:idle` y no con `client:load` — el primer fotograma ya está
 * completo, así que los 23 KB comprimidos de aritmética de color no
 * tienen por qué competir con él.
 *
 * ---------------------------------------------------------------------
 * Lo que se descartó, y por qué
 *
 * Estuvo un rato barriendo el tono al cargar: salía del azul de `texto`
 * (255°) y se posaba en el teal de la marca (189°). Se cayó por dos
 * medidas, y en este orden.
 *
 * La primera fue el aviso de roturas: la casilla bajaba 14 px para
 * subir, y mientras duraba la entrada asomaba por debajo de la franja.
 * Eso se arregló escalando desde la base.
 *
 * La segunda no tenía arreglo. Una sonda con reloj de verdad confirmó que
 * el barrido llega al teal a los 2,5 s en un navegador normal —de
 * `rgb(12,132,250)` a `rgb(0,154,147)`— y que bajo el reloj virtual de
 * las capturas NO SE MUEVE: `--virtual-time-budget` acelera los
 * temporizadores pero no la red, y el presupuesto se agota antes de que
 * llegue el trozo de color. Las capturas, que son el registro visual del
 * sitio, habrían enseñado para siempre una portada azul que nadie ve más
 * de un segundo. Y el mismo fallo lo sufre cualquiera con la red lenta.
 *
 * Con la rampa de fábrica ya en el HTML no hay nada que perder esa
 * carrera: sin JavaScript, con JavaScript o en una captura, se ve lo
 * mismo.
 */
import { useMemo, useRef, useState } from 'react';

import { AJUSTES_INICIALES, construirRampa } from '../lib/rampa';
import { aHexEnGama } from '../lib/contrast';

/** El teal de la marca, medido: `#007872` es OKLCH 188,7°. */
const TONO_DE_FABRICA = 189;

/**
 * De dónde sale la semilla: claridad y croma fijos, y solo gira el tono.
 *
 * 0,62 de claridad es donde una rampa de once pasos tiene sitio para
 * estirarse hacia los dos lados. El croma va pedido por encima de lo que
 * aguanta sRGB a propósito: `aHexEnGama` lo recorta al techo de cada
 * tono, así que la franja sale tan viva como la pantalla permita, sea
 * cual sea el tono que se siembre. Y lo recorta la MISMA función que usa
 * la herramienta de paletas, que es una política del sitio —«qué hacemos
 * cuando un color no cabe»— y no un cálculo suelto que copiar.
 */
function semillaDeTono(tono: number): string {
  return aHexEnGama({ mode: 'oklch', l: 0.62, c: 0.2, h: ((tono % 360) + 360) % 360 });
}

function rampaDe(tono: number) {
  return construirRampa(
    {
      id: 'portada',
      nombre: 'color',
      semilla: semillaDeTono(tono),
      anclaForzada: null,
      retoques: {},
    },
    AJUSTES_INICIALES
  ).pasos;
}

export default function RampaViva() {
  const [tono, setTono] = useState(TONO_DE_FABRICA);
  const caja = useRef<HTMLDivElement>(null);

  /* Se deriva entera en cada movimiento, y se puede: once pasos cuestan
     0,108 ms medidos, el 0,6 % del presupuesto de un fotograma a 60 Hz.
     Interpolar entre dos colores habría sido más barato y habría sido
     mentira — el pie dice que esto lo acaba de calcular tu navegador. */
  const pasos = useMemo(() => rampaDe(tono), [tono]);

  /** El tono sale de dónde está el puntero a lo ancho de la franja. */
  function sembrarDesde(x: number) {
    const c = caja.current?.getBoundingClientRect();
    if (!c || c.width === 0) return;
    setTono(((x - c.left) / c.width) * 360);
  }

  return (
    /*
      Decorativa a propósito: once códigos de color leídos en voz alta no
      son información, son ruido. Lo que hay que saber lo dice el pie, que
      va fuera de la isla y lo pinta el servidor.
    */
    <div
      ref={caja}
      className="tira-rampa"
      aria-hidden="true"
      /* En una pantalla táctil, `pointermove` llega mientras se arrastra
         para DESPLAZAR la página: sembrar ahí cambiaría los colores solos
         al pasar de largo. Con el dedo se siembra al tocar, y ya. */
      onPointerMove={(e) => e.pointerType !== 'touch' && sembrarDesde(e.clientX)}
      onPointerDown={(e) => sembrarDesde(e.clientX)}
    >
      {pasos.map((p, i) => (
        /* El retardo va en el HTML del servidor, así que las once entran
           escalonadas en el PRIMER pintado, sin esperar a esta isla. */
        <span
          key={p.nombre}
          className="casilla-rampa"
          style={{ background: p.hex, animationDelay: `${i * 34}ms` }}
        >
          {/* La misma frontera que usa Paleta para poner marcas encima de
              una casilla: por debajo de 0,55 de claridad se escribe en
              blanco. Un gris fijo sería invisible justo en los extremos.

              El retardo del número es el de su casilla más lo que tarda
              en posarse: se lee cuando ya no la aplasta. */}
          <span
            className="cifra"
            style={{
              color: p.l < 0.55 ? '#ffffff' : '#000000',
              animationDelay: `${i * 34 + 520}ms`,
            }}
          >
            {p.nombre}
          </span>
        </span>
      ))}
    </div>
  );
}
