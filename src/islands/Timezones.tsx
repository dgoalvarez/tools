/**
 * La herramienta de husos horarios.
 *
 * El problema real: son las tres de la tarde aquí y hace falta saber qué
 * hora es en otro sitio — para llamar, para no escribir a las cuatro de la
 * madrugada de alguien, para saber si una tienda está abierta. Y si ese
 * sitio es Estados Unidos, hay seis husos y varios estados partidos por la
 * mitad.
 *
 * Por eso lo que de verdad entrega la herramienta no es una tabla, es una
 * línea que se pega en WhatsApp. La tabla es el camino, no el destino.
 *
 * ---------------------------------------------------------------------
 * Tres papeles, y por eso tres tarjetas
 *
 * Un sitio no es un sitio: según para qué esté puesto se mira de una
 * manera distinta y a un ritmo distinto. Son tres papeles y antes los
 * tres compartían una sola lista, que es lo que se ha deshecho:
 *
 *   1. **El que se sigue en vivo.** Se pone una vez y se mira veinte
 *      veces al día, siempre la misma pregunta: ¿está despierto ahora?
 *      Tarjeta propia arriba, cifra grande, y el reloj no se para nunca.
 *   2. **La referencia.** De dónde es la hora que se escribe. Casi nunca
 *      cambia: es la de uno, un día tras otro.
 *   3. **Los demás sitios.** Van y vienen —hoy uno, mañana otro— y lo que
 *      se quiere de ellos es compararlos entre sí, así que van en una
 *      lista con todas las horas en la misma columna.
 *
 * ---------------------------------------------------------------------
 * Dos preguntas a la vez, y por eso no hay dos modos
 *
 * Quien usa esto tiene dos necesidades que conviven:
 *
 *   1. **Saber qué hora es allí ahora mismo.** La jefa está en Carolina
 *      del Norte: hay que saber si son las nueve o las dos antes de
 *      escribirle.
 *   2. **Traducir una hora concreta.** Si esto es a las cinco de la tarde
 *      hora de Colombia, ¿a qué hora le toca a quien está en Los Ángeles?
 *
 * Un interruptor entre «ahora» y «una hora» obligaría a elegir cuál de las
 * dos se quiere antes de saberlo. Así que no lo hay: la herramienta abre
 * **en vivo**, con el reloj corriendo, y se queda quieta en cuanto tocas
 * una hora — la de arriba o la de cualquier fila. Un botón devuelve a en
 * vivo, y mientras está quieta cada fila sigue enseñando en pequeño la
 * hora que es allí de verdad.
 *
 * La tarjeta de arriba es la excepción y es a propósito: esa NO se queda
 * quieta. Es el único sitio de la pantalla donde la pregunta «¿qué hora es
 * allí ahora?» sigue contestándose mientras se contesta la otra.
 *
 * ---------------------------------------------------------------------
 * Se puede tocar la hora de CUALQUIER fila
 *
 * Y no solo la de arriba. «Si a la jefa le encaja a las nueve de su
 * mañana, ¿qué hora es para mí?» es la misma pregunta al revés, y se
 * contesta escribiendo en la fila de la jefa.
 *
 * Por dentro se mueve el instante, no el reloj de nadie: se mira cuánto
 * cambia esa fila, se le suma esa diferencia al instante, y todo lo demás
 * —incluida la hora de arriba— se vuelve a calcular desde ahí. Así nunca
 * hay dos relojes discutiendo sobre cuál manda.
 *
 * La aritmética vive en src/lib/timezones.ts. Los datos de ciudades y
 * códigos postales se descargan solo cuando alguien los usa.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  CopyIcon,
  MapPinIcon,
  TrashIcon,
  XIcon,
} from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t, type Lang } from '@/i18n/config';
import { HUSOS as H } from '@/i18n/timezones';
import BuscadorLugar, { type TextosBuscador } from './BuscadorLugar';
import {
  componerLista,
  convertir,
  localeDe,
  nombreDePais,
  nombreDeZona,
  obtenerTemporal,
  relojEnVivo,
  zonaDelNavegador,
  camposEnZona,
  type Coincidencia,
  type Conversion,
  type DatosLugares,
  type DatosZips,
  type Destino,
  type Resultado,
} from '@/lib/timezones';
import { escribirParams, leerParams } from '@/lib/url-state';

/**
 * El origen por defecto. Sale del problema que dio origen a la herramienta:
 * mirar desde Colombia las horas de Estados Unidos.
 */
const ORIGEN_INICIAL = { zona: 'America/Bogota', etiqueta: 'Bogotá' };

interface Props {
  lang: Lang;
}

/** Una zona que el navegador reconozca. Filtra direcciones manipuladas. */
function zonaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: zona }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/**
 * Un sitio, tal y como viaja en la dirección: `zona~nombre`.
 *
 * El nombre viaja aparte y no se reconstruye desde la zona. Con ciudades
 * daba igual —quien abría el enlace veía «New York» en vez de «Miami,
 * Florida» y la hora era la misma—, pero con estados y países no: «Florida
 * (hora central)» volvía como «Chicago», que es otro sitio con la misma
 * hora. La hora seguía siendo correcta y la respuesta, engañosa.
 *
 * Devuelve `null` si la zona no existe: una dirección manipulada nunca
 * debe romper la página.
 */
function sitioDeEnlace(trozo: string): Destino | null {
  const corte = trozo.indexOf('~');
  const zona = corte === -1 ? trozo : trozo.slice(0, corte);
  if (!zonaValida(zona)) return null;

  const nombre = (corte === -1 ? '' : trozo.slice(corte + 1)) || nombreDeZona(zona);
  return {
    id: `${zona}|${nombre}`,
    etiqueta: nombre,
    ciudad: nombre,
    region: '',
    pais: '',
    zona,
    fuente: 'zona',
  };
}

/** Un sitio salido del buscador. Lo construyen los dos sitios que lo eligen. */
function sitioDeCoincidencia(c: Coincidencia): Destino {
  return {
    id: `${c.zona}|${c.etiqueta}`,
    etiqueta: c.etiqueta,
    ciudad: c.ciudad,
    region: c.region,
    pais: c.pais,
    zona: c.zona,
    fuente: 'ciudad',
  };
}

/** Y al revés. El nombre solo se escribe cuando aporta algo. */
function sitioAEnlace(sitio: Destino): string {
  return sitio.etiqueta === nombreDeZona(sitio.zona)
    ? sitio.zona
    : `${sitio.zona}~${sitio.etiqueta}`;
}

/**
 * La hora de una fila: se lee y se cambia.
 *
 * En vivo es un botón con la hora escrita como la escribe el idioma —«4:32
 * p. m.»—; tocarlo para el reloj. Con una hora puesta es un campo de hora
 * de verdad, que se puede escribir y que abre el selector del navegador.
 *
 * Son dos cosas y no una con `readOnly` porque un campo que cambia solo
 * cada cinco segundos, con el cursor dentro, es una trampa: se escribe
 * encima de lo que el reloj acaba de poner.
 */
function HoraDeFila({
  conversion,
  nombre,
  enVivo,
  enCampo,
  onCambio,
  onCongelar,
  etiqueta,
}: {
  conversion: Conversion;
  nombre: string;
  enVivo: boolean;
  enCampo: (minutos: number) => string;
  onCambio: (c: Conversion, valor: string) => void;
  onCongelar: () => void;
  etiqueta: string;
}) {
  if (enVivo) {
    return (
      <button
        type="button"
        className="hora"
        onClick={onCongelar}
        title={etiqueta}
        aria-label={`${etiqueta}: ${nombre}`}
      >
        {conversion.hora}
      </button>
    );
  }

  return (
    <input
      type="time"
      className="hora"
      value={enCampo(conversion.minutos)}
      onChange={(e) => onCambio(conversion, e.target.value)}
      aria-label={`${etiqueta}: ${nombre}`}
    />
  );
}

export default function Timezones({ lang }: Props) {
  const tr = (clave: keyof typeof H) => t(H[clave], lang);

  /**
   * La hora puesta a mano, o vacía.
   *
   * Vacía significa «en vivo», y de ahí sale todo lo demás. Se podría
   * llevar un interruptor aparte, pero entonces habría dos cosas que
   * mantener de acuerdo —el interruptor y los campos— y tarde o temprano
   * se desacuerdan. Aquí no hay estado que contradiga a otro: o hay hora
   * puesta o no la hay.
   */
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const enVivo = !fecha || !hora;

  const [origen, setOrigen] = useState(ORIGEN_INICIAL);
  const [destinos, setDestinos] = useState<Destino[]>([]);

  /**
   * El sitio que se sigue en vivo, o ninguno.
   *
   * Es un papel distinto de los de la lista y por eso vive aparte, en su
   * propia tarjeta y en su propio estado. Los sitios de abajo van y vienen
   * —hoy un cliente, mañana otro—; este se pone una vez y se mira todo el
   * día.
   *
   * Estuvo la opción de que fuera un destino más, marcado y anclado
   * arriba de la lista. Se descartó por lo que costaba: la lista se congela
   * cuando pones una hora, y este sitio es justo el que NO puede congelarse
   * —la pregunta que contesta es «¿está despierto ahora?»—. Tenerlo dentro
   * obligaba a que una fila de la lista se comportara al revés que las
   * demás, que es la clase de excepción que nadie recuerda al mes.
   */
  const [fijo, setFijo] = useState<Destino | null>(null);

  /**
   * El reloj de la herramienta.
   *
   * Empieza en `null` y no en `new Date()` a propósito: el HTML lo pinta
   * el servidor al compilar, así que una hora puesta ahí sería la del día
   * en que se publicó el sitio. Se queda en blanco hasta que hidrata, y
   * entonces aparece la de verdad.
   *
   * Corre siempre, también con una hora puesta: las filas siguen
   * enseñando en pequeño qué hora es allí de verdad, que es la mitad de
   * para lo que se usa esto.
   */
  const [ahora, setAhora] = useState<Date | null>(null);

  useEffect(() => {
    setAhora(new Date());
    // Cada cinco segundos, no cada segundo: en pantalla solo hay minutos.
    const id = setInterval(() => setAhora(new Date()), 5000);
    return () => clearInterval(id);
  }, []);

  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [enlaceLeido, setEnlaceLeido] = useState(false);

  // Los datos se guardan en refs y no en el estado: una vez descargados no
  // vuelven a cambiar, y no tiene sentido que provoquen un repintado.
  const lugares = useRef<DatosLugares | null>(null);
  const zips = useRef<DatosZips | null>(null);

  const pedirLugares = useCallback(async () => {
    if (!lugares.current) {
      lugares.current = (await (await fetch('/data/lugares.json')).json()) as DatosLugares;
    }
    return lugares.current;
  }, []);

  const pedirZips = useCallback(async () => {
    if (!zips.current) {
      zips.current = (await (await fetch('/data/zips.json')).json()) as DatosZips;
    }
    return zips.current;
  }, []);

  const textosBuscador: TextosBuscador = useMemo(
    () => ({
      etiqueta: tr('buscar'),
      ayuda: tr('buscarAyuda'),
      cargando: tr('cargando'),
      sinResultados: tr('sinResultados'),
      zipDesconocido: tr('zipDesconocido'),
    }),
    // Los textos solo dependen del idioma, que no cambia sin recargar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang]
  );

  /** La hora de este momento donde está el origen. */
  const vivos = ahora ? camposEnZona(ahora, origen.zona) : { fecha: '', hora: '' };
  const fechaMostrada = enVivo ? vivos.fecha : fecha;
  const horaMostrada = enVivo ? vivos.hora : hora;

  /** Deja de correr y se queda en la hora que hubiera. */
  function congelar() {
    if (enVivo && vivos.fecha) {
      setFecha(vivos.fecha);
      setHora(vivos.hora);
    }
  }

  function volverAAhora() {
    setFecha('');
    setHora('');
  }

  /**
   * Cambia la hora de UNA fila y recalcula todo lo demás desde ahí.
   *
   * Se mueve el instante, no el reloj de nadie: se mira cuánto cambia esa
   * fila y se le suma esa diferencia al instante. Lo demás sale solo.
   *
   * La diferencia se lleva al rango de ±12 horas porque escribir las 2:00
   * donde ponía las 23:00 quiere decir «tres horas más tarde», no
   * «veintiuna horas antes». Es la lectura que hace cualquiera.
   */
  function ponerHoraEn(c: Conversion, valor: string) {
    if (!resultado || !/^\d{2}:\d{2}$/.test(valor)) return;
    const [h, m] = valor.split(':').map(Number);

    let delta = (h ?? 0) * 60 + (m ?? 0) - c.minutos;
    if (delta > 720) delta -= 1440;
    if (delta <= -720) delta += 1440;

    const campos = camposEnZona(
      new Date(resultado.instante.getTime() + delta * 60_000),
      origen.zona
    );
    setFecha(campos.fecha);
    setHora(campos.hora);
  }

  /** «16:30», que es lo que entiende un <input type="time">. */
  const enCampo = (minutos: number) =>
    `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;

  /** La hora que es AHORA en una zona, para la línea pequeña de la fila. */
  const horaAhoraEn = (zona: string) =>
    ahora
      ? new Intl.DateTimeFormat(localeDe(lang), {
          timeZone: zona,
          hour: 'numeric',
          minute: '2-digit',
        }).format(ahora)
      : '';

  // ---------- añadir y quitar ----------

  function anadirDestino(c: Coincidencia) {
    setDestinos((previos) =>
      previos.some((d) => d.zona === c.zona && d.etiqueta === c.etiqueta)
        ? previos
        : [...previos, sitioDeCoincidencia(c)]
    );
  }

  /**
   * Pone el sitio de arriba, reemplazando al que hubiera.
   *
   * Es uno solo y no una lista, y eso es lo que le da sentido a la
   * tarjeta: una cifra grande contesta de un vistazo, seis cifras
   * medianas ya son una lista y para eso está la de abajo.
   */
  function fijarSitio(c: Coincidencia) {
    setFijo(sitioDeCoincidencia(c));
  }

  function quitar(id: string) {
    setDestinos((previos) => previos.filter((d) => d.id !== id));
  }

  /**
   * El origen sale del navegador.
   *
   * Estaba en «en qué sitios» y añadía un destino, que es justo lo
   * contrario de lo que dice el botón: «mi ubicación» es de dónde parte la
   * hora, no uno de los sitios que se consultan. Ahora vive arriba, en la
   * tarjeta de la hora, y fija el origen.
   */
  function origenDeMiUbicacion() {
    const zona = zonaDelNavegador();
    setOrigen({ zona, etiqueta: nombreDeZona(zona) });
  }

  // ---------- la dirección ----------

  useEffect(() => {
    const params = leerParams();

    // Una hora en el enlace saca a la herramienta de en vivo: quien
    // comparte un enlace comparte una hora concreta, no «ahora».
    const enlaceHora = params.get('h');
    if (enlaceHora && /^\d{2}:\d{2}$/.test(enlaceHora)) {
      setHora(enlaceHora);
      const enlaceFecha = params.get('d');
      setFecha(
        enlaceFecha && /^\d{4}-\d{2}-\d{2}$/.test(enlaceFecha)
          ? enlaceFecha
          : camposEnZona(new Date(), ORIGEN_INICIAL.zona).fecha
      );
    }

    const enlaceOrigen = params.get('o');
    if (enlaceOrigen && zonaValida(enlaceOrigen)) {
      setOrigen({ zona: enlaceOrigen, etiqueta: nombreDeZona(enlaceOrigen) });
    }

    /* El sitio de arriba, el que va en vivo. Uno solo, sin separador. */
    const enlaceFijo = params.get('v');
    if (enlaceFijo) {
      const sitio = sitioDeEnlace(enlaceFijo);
      if (sitio) setFijo(sitio);
    }

    /*
      Los sitios de la lista, separados por punto y coma.

      El separador es `;` y no `,` porque los nombres llevan comas dentro:
      «Miami, Florida». Y el nombre solo se escribe cuando aporta algo, así
      que un enlace con Tokio sigue siendo `z=Asia/Tokyo`.
    */
    const enlaceZonas = params.get('z');
    if (enlaceZonas) {
      const validas = enlaceZonas
        .split(enlaceZonas.includes(';') ? ';' : ',')
        .slice(0, 12)
        .map(sitioDeEnlace)
        .filter((sitio): sitio is Destino => sitio !== null);
      if (validas.length) setDestinos(validas);
    }

    setEnlaceLeido(true);
  }, []);

  useEffect(() => {
    if (!enlaceLeido) return;
    escribirParams({
      // En vivo no hay nada que compartir: la dirección se queda limpia y
      // quien la abra verá su propia hora, no la de quien la mandó.
      d: enVivo ? null : fecha,
      h: enVivo ? null : hora,
      o: origen.zona === ORIGEN_INICIAL.zona ? null : origen.zona,
      v: fijo ? sitioAEnlace(fijo) : null,
      z: destinos.length ? destinos.map(sitioAEnlace).join(';') : null,
    });
    setCopiado(null);
  }, [enlaceLeido, enVivo, fecha, hora, origen, fijo, destinos]);

  // ---------- la conversión ----------

  /*
    Se recalcula cuando cambia el MINUTO, no cada vez que corre el reloj.
    En vivo el reloj avanza cada cinco segundos, y sin esto la conversión
    entera se rehacía doce veces por minuto para dar el mismo resultado.
  */
  const momento = useMemo(() => {
    if (!fechaMostrada || !horaMostrada) return null;
    const [año, mes, dia] = fechaMostrada.split('-').map(Number);
    const [h, m] = horaMostrada.split(':').map(Number);
    return { año: año ?? 2026, mes: mes ?? 1, dia: dia ?? 1, hora: h ?? 0, minuto: m ?? 0 };
  }, [fechaMostrada, horaMostrada]);

  /**
   * Los sitios que hay que convertir: el fijo primero y luego la lista.
   *
   * Van juntos a `convertir` y se separan después. Podrían hacerse dos
   * llamadas, una por tarjeta, pero entonces habría dos instantes que
   * mantener de acuerdo. Con una sola, la tarjeta de arriba y la lista de
   * abajo salen literalmente del mismo cálculo y no pueden discrepar.
   *
   * Un sitio que esté arriba y abajo a la vez se queda solo arriba: dos
   * filas idénticas no dicen nada y comparten identificador, que es lo que
   * de verdad rompería el reparto de después.
   */
  const todos = useMemo(
    () => (fijo ? [fijo, ...destinos.filter((d) => d.id !== fijo.id)] : destinos),
    [fijo, destinos]
  );

  useEffect(() => {
    if (!momento) return;
    let cancelado = false;
    obtenerTemporal().then((Temporal) => {
      if (cancelado) return;
      setResultado(convertir(Temporal, momento, origen.zona, origen.etiqueta, todos, lang));
    });
    return () => {
      cancelado = true;
    };
  }, [momento, origen, todos, lang]);

  /** Lo que le toca a la tarjeta de arriba, y lo que le toca a la lista. */
  const conversionFija = fijo
    ? (resultado?.destinos.find((c) => c.destino.id === fijo.id) ?? null)
    : null;
  const conversiones = resultado?.destinos.filter((c) => c.destino.id !== fijo?.id) ?? [];

  /**
   * El reloj del sitio fijo, siempre en hora de verdad.
   *
   * No sale de `resultado` a propósito: `resultado` se queda quieto en la
   * hora que hayas puesto, y esta cifra no puede quedarse quieta nunca.
   */
  const reloj = ahora && fijo ? relojEnVivo(ahora, fijo.zona, origen.zona, lang) : null;

  // ---------- acciones ----------

  async function copiar(clave: string, texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
    } catch {
      // Sin portapapeles, la frase sigue a la vista para seleccionarla.
    }
  }

  /**
   * La diferencia, en corto: «+1 h», «−5,5 h», «misma hora».
   *
   * Era «1 h por delante», que se lee mejor suelto pero en la lista
   * comparte renglón con la fecha corta y no cabía. El signo dice lo
   * mismo con dos caracteres, y la frase larga sigue estando: va en el
   * `title` de la fila, para quien pase el ratón.
   */
  const diferenciaTexto = (horas: number) => {
    if (horas === 0) return tr('misma');
    // Las medias horas —India, Nepal— se escriben con coma en español y
    // con punto en inglés. Lo decide el idioma, no el `toFixed`.
    const cantidad = Math.abs(horas).toLocaleString(localeDe(lang), {
      maximumFractionDigits: 1,
    });
    // El menos de verdad, no el guion: en cifras se lee mejor.
    return `${horas > 0 ? '+' : '−'}${cantidad} h`;
  };

  /** La misma diferencia dicha entera, para el `title`. */
  const diferenciaLarga = (horas: number) => {
    if (horas === 0) return tr('misma');
    const cantidad = Math.abs(horas).toLocaleString(localeDe(lang), {
      maximumFractionDigits: 1,
    });
    return `${cantidad} h ${horas > 0 ? tr('adelanto') : tr('retraso')}`;
  };

  // ---------- pintado ----------

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,var(--col-controles))_minmax(0,1fr)] lg:items-start">
      {/* ---------------- Controles ---------------- */}
      <div className="columna-herramienta gap-4">
        {/*
          El sitio que se sigue en vivo.

          Va el primero y con la cifra más grande de la pantalla porque es
          la pregunta que se hace más veces al día y la que menos tarda en
          contestarse: ¿está despierto ahora?

          Y sigue corriendo con una hora puesta abajo. Es lo que lo separa
          de la lista: cuando estás decidiendo a qué hora poner algo, saber
          qué hora es allí AHORA es justo el dato que hace falta, no el que
          estorba.
        */}
        <section className="tarjeta-control" data-tour="vivo">
          <h2 className="titulo">{tr('vivoTitulo')}</h2>

          {!fijo ? (
            <>
              <BuscadorLugar
                id="vivo"
                lang={lang}
                textos={{ ...textosBuscador, etiqueta: tr('vivoBuscar'), ayuda: '' }}
                pedirLugares={pedirLugares}
                pedirZips={pedirZips}
                onElegir={fijarSitio}
              />
              <p className="text-[length:var(--fs-small)] text-ink-soft">{tr('vivoVacio')}</p>
            </>
          ) : (
            <div className="reloj-vivo">
              <div className="encabezado">
                <span className="lugar truncate" title={fijo.etiqueta}>
                  {fijo.ciudad}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setFijo(null)}
                  aria-label={tr('vivoQuitar')}
                  title={tr('vivoQuitar')}
                >
                  <XIcon aria-hidden="true" />
                </Button>
              </div>

              <p className="meta truncate" title={fijo.zona}>
                {[fijo.region, nombreDePais(fijo.pais, lang), reloj?.abreviatura]
                  .filter(Boolean)
                  .join(' · ')}
              </p>

              {/* El espacio duro mantiene el alto mientras el reloj aún no
                  ha hidratado. Sin él la tarjeta pega un salto al entrar. */}
              <p className="cifra">{reloj?.hora || ' '}</p>

              <p className="pie">
                <span className="truncate">
                  {reloj?.fechaCorta}
                  {reloj && reloj.saltoDeDia !== 0 && (
                    <>
                      {' · '}
                      <span className="aviso-dia">
                        {reloj.saltoDeDia > 0 ? tr('diaSiguienteCorto') : tr('diaAnteriorCorto')}
                      </span>
                    </>
                  )}
                </span>
                <span className="marca-vivo">
                  <span className="punto" aria-hidden="true" />
                  {tr('enVivo')}
                </span>
              </p>

              {/*
                El renglón de abajo tiene alto FIJO y cambia de contenido,
                no de tamaño. En vivo dice la diferencia con la referencia;
                con una hora puesta, a qué hora le cae allí — y esa sí se
                puede escribir, como cualquier otra de la pantalla.

                Si apareciera y desapareciera, poner una hora empujaría
                hacia abajo las dos tarjetas siguientes. `min-height` no
                sirve aquí: pone un suelo, no reserva el sitio.
              */}
              <div className="convertida">
                {enVivo || !conversionFija ? (
                  <span className="truncate">
                    {reloj && reloj.diferencia === 0
                      ? `${tr('mismaQue')} ${origen.etiqueta}`
                      : `${diferenciaTexto(reloj?.diferencia ?? 0)} ${tr('respectoA')} ${origen.etiqueta}`}
                  </span>
                ) : (
                  <>
                    <span className="truncate">{tr('aEsaHora')}</span>
                    <input
                      type="time"
                      className="hora"
                      value={enCampo(conversionFija.minutos)}
                      onChange={(e) => ponerHoraEn(conversionFija, e.target.value)}
                      aria-label={`${tr('cambiarEstaHora')}: ${fijo.ciudad}`}
                    />
                    {/* El aviso va aquí y no arriba a propósito. Arriba, la
                        fecha es la de AHORA; el salto de día que importa es
                        el de la hora puesta, y es el error que de verdad se
                        comete: acertar la hora y errar el día. */}
                    {conversionFija.saltoDeDia !== 0 && (
                      <span className="aviso-dia">
                        {conversionFija.saltoDeDia > 0
                          ? tr('diaSiguienteCorto')
                          : tr('diaAnteriorCorto')}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="tarjeta-control" data-tour="hora">
          <h2 className="titulo">{tr('origenTitulo')}</h2>

          {/*
            Los dos campos enseñan la hora que es AHORA donde está el
            origen, y avanzan solos, hasta que alguien los toca. Basta con
            poner el foco: en cuanto el cursor entra, el reloj se para en
            la hora que hubiera. Si no, el valor cambiaría bajo el cursor
            mientras se escribe.
          */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="fecha">{tr('fecha')}</Label>
              <Input
                id="fecha"
                type="date"
                value={fechaMostrada}
                onFocus={congelar}
                onChange={(e) => {
                  setFecha(e.target.value);
                  if (enVivo) setHora(vivos.hora);
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="hora">{tr('hora')}</Label>
              <Input
                id="hora"
                type="time"
                value={horaMostrada}
                onFocus={congelar}
                onChange={(e) => {
                  setHora(e.target.value);
                  if (enVivo) setFecha(vivos.fecha);
                }}
              />
            </div>
          </div>

          {/* El estado, dicho en una línea: o corre o está parada. */}
          <div className="fila-vivo">
            {enVivo ? (
              <span className="marca-vivo">
                <span className="punto" aria-hidden="true" />
                {tr('enVivo')}
              </span>
            ) : (
              <Button variant="outline" size="sm" onClick={volverAAhora}>
                <ArrowCounterClockwiseIcon aria-hidden="true" />
                {tr('volverAAhora')}
              </Button>
            )}
          </div>

          {/*
            De dónde es esa hora casi nunca se cambia: casi siempre es la
            de uno, un día tras otro. Plegado, el resumen dice cuál es —que
            es el 99 % de las veces lo único que hace falta saber— y abrirlo
            cuesta una pulsación las pocas veces que no.

            «Mi ubicación» vive aquí dentro y no abajo, entre los sitios.
            Ahí abajo añadía un destino, que es lo contrario de lo que dice
            el botón: mi ubicación es de dónde parte la hora, no uno de los
            sitios que se consultan.
          */}
          <details className="rounded-lg border border-line" data-tour="origen">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-[length:var(--fs-small)] marker:content-none">
              <span className="min-w-0 truncate text-ink-soft">
                {tr('zonaOrigen')} <span className="font-medium text-ink">{origen.etiqueta}</span>
              </span>
              <span className="shrink-0 text-ink-soft underline underline-offset-2">
                {tr('cambiar')}
              </span>
            </summary>

            <div className="grid gap-3 border-t border-line p-3">
              <BuscadorLugar
                id="origen"
                lang={lang}
                textos={{ ...textosBuscador, etiqueta: tr('cambiarOrigen'), ayuda: '' }}
                pedirLugares={pedirLugares}
                pedirZips={pedirZips}
                onElegir={(c) => setOrigen({ zona: c.zona, etiqueta: c.etiqueta })}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={origenDeMiUbicacion}
                className="justify-self-start"
              >
                <MapPinIcon aria-hidden="true" />
                {tr('miUbicacion')}
              </Button>
            </div>
          </details>
        </section>

        <section className="tarjeta-control" data-tour="destinos">
          <h2 className="titulo">{tr('destinosTitulo')}</h2>

          <BuscadorLugar
            id="destino"
            lang={lang}
            textos={textosBuscador}
            pedirLugares={pedirLugares}
            pedirZips={pedirZips}
            onElegir={anadirDestino}
          />
        </section>
      </div>

      {/* ---------------- Resultados ---------------- */}
      <div className="columna-herramienta gap-5">
        {/* Los dos domingos del año en que la hora pedida es rara. */}
        {resultado?.ambiguedad === 'no-existe' && (
          <section className="rounded-lg border border-[var(--danger)] bg-surface p-5">
            <h2 className="text-[length:var(--fs-h3)] font-semibold text-[var(--danger)]">
              {tr('noExisteTitulo')}
            </h2>
            <p className="mt-2 text-[length:var(--fs-small)] text-ink-muted">
              {tr('noExisteCuerpo')} <strong className="text-ink">{resultado.horaCorregida}</strong>
            </p>
          </section>
        )}

        {resultado?.ambiguedad === 'ocurre-dos-veces' && (
          <section className="rounded-lg border border-line bg-surface-2 p-5">
            <h2 className="text-[length:var(--fs-h3)] font-semibold text-ink">
              {tr('dosVecesTitulo')}
            </h2>
            <p className="mt-2 text-[length:var(--fs-small)] text-ink-muted">
              {tr('dosVecesCuerpo')}
            </p>
          </section>
        )}

        <section data-tour="resultados">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[length:var(--fs-h3)] font-semibold text-ink">
              {enVivo ? tr('resultadosAhora') : tr('resultados')}
            </h2>

            <div className="flex items-center gap-2">
              {/* Un mensaje con todas, no una línea por ciudad. Si son
                  cinco sitios se manda un mensaje con los cinco, no cinco
                  frases iguales seguidas. */}
              {todos.length > 0 && resultado && (
                <Button
                  variant="outline"
                  size="sm"
                  data-tour="frase"
                  onClick={() =>
                    copiar('todas', componerLista(resultado.destinos, resultado.origen, lang))
                  }
                >
                  {copiado === 'todas' ? (
                    <CheckIcon aria-hidden="true" />
                  ) : (
                    <CopyIcon aria-hidden="true" />
                  )}
                  {copiado === 'todas' ? tr('copiado') : tr('copiarTodas')}
                </Button>
              )}

              {/* Quitar de una en una está bien para dos; para nueve no.
                  Aparece a partir de la segunda, que es cuando empieza a
                  hacer falta. */}
              {destinos.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setDestinos([])}>
                  <TrashIcon aria-hidden="true" />
                  {tr('quitarTodas')}
                </Button>
              )}
            </div>
          </div>

          {/*
            Una sola caja con una fila por ciudad, y la tuya la primera.

            Antes cada destino era una tarjeta de 260 px y el origen otra
            aparte, encima. Con seis ciudades había que hacer scroll para
            ver la cuarta, y comparar dos horas era recordar una mientras
            se buscaba la otra. Aquí todas las horas caen en la misma
            columna, la tuya incluida, y comparar es mirar hacia abajo.
          */}
          <div className="lista-horas mt-4">
            {resultado && (
              <div className="fila-hora origen">
                <span className="lugar truncate" title={origen.etiqueta}>
                  {origen.etiqueta}
                </span>
                <span className="meta truncate">{tr('tuHora')}</span>
                <HoraDeFila
                  conversion={resultado.origen}
                  nombre={origen.etiqueta}
                  enVivo={enVivo}
                  enCampo={enCampo}
                  onCambio={ponerHoraEn}
                  onCongelar={congelar}
                  etiqueta={tr('cambiarEstaHora')}
                />
                <span className="cuando">
                  {resultado.origen.fechaCorta}
                  {!enVivo && (
                    <>
                      {' · '}
                      <span className="ahora-fila">
                        {tr('ahoraCorto')} {horaAhoraEn(origen.zona)}
                      </span>
                    </>
                  )}
                </span>
              </div>
            )}

            {conversiones.map((c) => {
              const debajo = [c.destino.region, nombreDePais(c.destino.pais, lang), c.abreviatura]
                .filter(Boolean)
                .join(' · ');

              return (
                <div
                  key={c.destino.id}
                  className={`fila-hora${c.saltoDeDia !== 0 ? ' salta' : ''}`}
                >
                  <span className="lugar truncate" title={c.destino.ciudad}>
                    {c.destino.ciudad}
                  </span>
                  <span className="meta truncate" title={`${c.destino.zona} · ${debajo}`}>
                    {debajo}
                  </span>

                  <HoraDeFila
                    conversion={c}
                    nombre={c.destino.ciudad}
                    enVivo={enVivo}
                    enCampo={enCampo}
                    onCambio={ponerHoraEn}
                    onCongelar={congelar}
                    etiqueta={tr('cambiarEstaHora')}
                  />
                  <span className="cuando" title={`${c.fecha} · ${diferenciaLarga(c.diferencia)}`}>
                    {c.fechaCorta} · {diferenciaTexto(c.diferencia)}
                    {/* El error que la herramienta existe para evitar. Va
                        aquí y no en una caja aparte: en una caja costaba
                        50 px por ciudad, y la franja roja del borde se ve
                        igual de lejos sin costar ninguno. */}
                    {c.saltoDeDia !== 0 && (
                      <>
                        {' · '}
                        <span className="aviso-dia" data-tour="salto">
                          {c.saltoDeDia > 0 ? tr('diaSiguienteCorto') : tr('diaAnteriorCorto')}
                        </span>
                      </>
                    )}
                    {/* Con una hora puesta, la de verdad no desaparece:
                        sigue aquí en pequeño. Es la mitad de para lo que
                        se usa esto — saber si allí son las nueve o las
                        dos antes de escribir. */}
                    {!enVivo && (
                      <>
                        {' · '}
                        <span className="ahora-fila">
                          {tr('ahoraCorto')} {horaAhoraEn(c.destino.zona)}
                        </span>
                      </>
                    )}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => quitar(c.destino.id)}
                    aria-label={`${tr('quitar')} ${c.destino.ciudad}`}
                    title={tr('quitar')}
                    className="quitar"
                  >
                    <XIcon aria-hidden="true" />
                  </Button>
                </div>
              );
            })}
          </div>

          {destinos.length === 0 && (
            <p className="mt-3 text-[length:var(--fs-small)] text-ink-soft">{tr('vacio')}</p>
          )}
        </section>
      </div>
    </div>
  );
}
