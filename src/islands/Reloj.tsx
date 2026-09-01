/**
 * El reloj: la hora, una alarma, un cronómetro y un temporizador.
 *
 * La aritmética vive en src/lib/reloj.ts y los avisos en src/lib/aviso.ts;
 * aquí están el estado, las pestañas y la pantalla.
 *
 * Cuatro decisiones que no son de estilo:
 *
 *   · **Los tres corren a la vez.** Cambiar de pestaña no para nada. Sería
 *     absurdo que mirar la alarma matase el cronómetro, así que la pestaña
 *     solo decide qué se enseña; lo que corre, corre.
 *
 *   · **El reloj se queda arriba, fijo.** Es lo que se mira sin pensar, y
 *     es lo que da sentido a las otras tres: la alarma se pone mirando la
 *     hora que es.
 *
 *   · **Dos relojes distintos.** El cronómetro va contra
 *     `performance.now()` —monótono, no le afecta un ajuste del reloj del
 *     sistema— y la hora, la alarma y el temporizador contra `Date.now()`.
 *     El porqué largo está en la librería.
 *
 *   · **El repintado se paga solo si hace falta.** Si no hay nada
 *     corriendo y los segundos están apagados, el reloj repinta cada
 *     medio minuto en vez de cuatro veces por segundo.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowCounterClockwiseIcon,
  BellIcon,
  BellSlashIcon,
  FlagIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
  XIcon,
} from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t, type Lang } from '@/i18n/config';
import { RELOJ as R } from '@/i18n/reloj';
import {
  arrancarAudio,
  notificar,
  pedirPermiso as pedirPermisoAviso,
  permisoActual,
  sonar,
  type Permiso,
} from '@/lib/aviso';
import {
  ALARMA_INICIAL,
  CARA_INICIAL,
  CRONOMETRO_INICIAL,
  LIMITES_PUESTA,
  PUESTA_INICIAL,
  TEMPORIZADOR_INICIAL,
  agujas,
  avanceTemporizador,
  comoCronometro,
  comoCuenta,
  conMasTiempo,
  excedidoMs,
  extremos,
  faltaParaAlarma,
  fechaEscrita,
  horaEscrita,
  horaValida,
  limitarPuesta,
  proximaVez,
  puestaMs,
  restanteTemporizador,
  transcurrido,
  vueltasDe,
  type Alarma,
  type Cara,
  type Cronometro,
  type Puesta,
  type Temporizador,
} from '@/lib/reloj';
import { escribirParams, leerParams } from '@/lib/url-state';
import BuscadorLugar from './BuscadorLugar';
import {
  abreviaturaDeZona,
  desfaseDeZona,
  diaDeZona,
  nombreDeZona,
  zonaDelNavegador,
  type Coincidencia,
  type DatosLugares,
  type DatosZips,
} from '@/lib/timezones';

/** Un sitio del reloj mundial. */
interface Sitio {
  id: string;
  nombre: string;
  zona: string;
}

/** Hasta cuántos sitios caben. Con más, la tarjeta deja de leerse. */
const TOPE_SITIOS = 12;

/**
 * Atajos del temporizador, en minutos. Los ratos que se ponen de verdad.
 *
 * Siete y no ocho: con ocho, el último se quedaba solo en una segunda
 * fila dentro de la tarjeta. El que se fue es el de tres minutos, que es
 * el que menos se pone de los cortos.
 */
const ATAJOS = [1, 5, 10, 15, 25, 45, 60];

const LOCALES: Record<Lang, string> = { es: 'es-ES', en: 'en-US' };

/**
 * El botón principal.
 *
 * Los colores van en utilidades de Tailwind y no en una clase de
 * `global.css`: las utilidades viven en una capa que gana a la de
 * componentes, así que el `bg-primary` que trae el botón de shadcn pisa
 * cualquier regla escrita allí. Y el relleno es `--solido` y no
 * `--acento`, porque el acento con tinta oscura encima suspende la
 * propia herramienta de contraste de este sitio.
 */
const BOTON =
  'border border-[var(--solido)] bg-[var(--solido)] font-semibold text-[var(--solido-ink)] hover:bg-[color-mix(in_srgb,var(--solido)_86%,#000)]';

interface Props {
  lang: Lang;
}

export default function Reloj({ lang }: Props) {
  const tr = (clave: keyof typeof R) => t(R[clave], lang);
  const locale = LOCALES[lang];

  const [cara, setCara] = useState<Cara>(CARA_INICIAL);
  const [listo, setListo] = useState(false);

  const [alarma, setAlarma] = useState<Alarma>(ALARMA_INICIAL);
  const [alarmaSuena, setAlarmaSuena] = useState(false);

  const [crono, setCrono] = useState<Cronometro>(CRONOMETRO_INICIAL);
  const [puesta, setPuesta] = useState<Puesta>(PUESTA_INICIAL);
  const [temporizador, setTemporizador] = useState<Temporizador>(TEMPORIZADOR_INICIAL);

  /**
   * El reloj mundial.
   *
   * Vive aquí y no en husos horarios porque contesta otra pregunta. Husos
   * traduce una hora entre sitios; esto solo dice qué hora es allí, ahora,
   * al segundo y en grande. Es una pantalla para mirar, no una
   * calculadora — por eso está debajo del reloj y no en otra herramienta.
   */
  const [sitios, setSitios] = useState<Sitio[]>([]);

  const lugares = useRef<DatosLugares | null>(null);
  const zips = useRef<DatosZips | null>(null);

  /*
    Las dos van con `useCallback`, y aquí NO es una optimización: es lo que
    hace que el buscador funcione.

    Esta isla se repinta cada 250 ms —el reloj mundial enseña segundos, así
    que la pestaña late aunque no haya nada contando—. Sin memorizarlas,
    cada repintado creaba funciones nuevas; están en las dependencias del
    efecto del buscador, así que el efecto se desmontaba y se rearmaba
    cuatro veces por segundo. Tres consecuencias, y ninguna se ve leyendo
    el buscador:

      · «Cargando…» necesita 180 ms de respiro más 250 de margen seguidos,
        y nunca los tenía: en la única página donde de verdad hace falta
        —la primera búsqueda descarga 750 KB— no llegaba a salir.
      · Cada rearme volvía a llamar a `fetch`, porque la caché de abajo
        solo se rellena DESPUÉS del await. Una descarga de tres segundos
        se convertía en una docena de peticiones del mismo archivo.
      · El aviso de «sin resultados» se borraba en cada rearme y volvía
        180 ms después: parpadeaba cuatro veces por segundo.

    En la herramienta de husos ya iban memorizadas; aquí se quedaron sin.
  */
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

  function anadirSitio(c: Coincidencia) {
    setSitios((previos) =>
      previos.length >= TOPE_SITIOS ||
      previos.some((s) => s.zona === c.zona && s.nombre === c.etiqueta)
        ? previos
        : [...previos, { id: `${c.zona}|${c.etiqueta}`, nombre: c.etiqueta, zona: c.zona }]
    );
  }

  /** La zona de quien mira, para la diferencia del reloj mundial. */
  const zonaAqui = zonaDelNavegador();

  const [conSonido, setConSonido] = useState(true);
  const [permiso, setPermiso] = useState<Permiso>('default');

  /** El latido: dos relojes, porque cada cosa cuenta contra el suyo. */
  const [ahora, setAhora] = useState(() => Date.now());
  const [mono, setMono] = useState(() =>
    typeof performance !== 'undefined' ? performance.now() : 0
  );

  // ---------- al llegar ----------

  useEffect(() => {
    const p = leerParams();

    const tipo = p.get('c');
    const formato = p.get('h');
    setCara({
      tipo: tipo === 'analogica' ? 'analogica' : 'digital',
      formato: formato === '12' || formato === '24' ? formato : 'auto',
      fecha: p.get('d') !== '0',
      segundos: p.get('s') !== '0',
    });

    const hora = p.get('a');
    if (hora && horaValida(hora)) setAlarma({ hora, activa: false });

    const t = p.get('t');
    if (t) {
      const [h, m, s] = t.split(':').map(Number);
      setPuesta({
        horas: limitarPuesta(h, 'horas'),
        minutos: limitarPuesta(m, 'minutos'),
        segundos: limitarPuesta(s, 'segundos'),
      });
    }

    /*
      Los sitios viajan como `zona~nombre`, separados por punto y coma, lo
      mismo que en husos horarios y por lo mismo: sin el nombre, «Florida
      (hora central)» vuelve como «Chicago», que es otro sitio.
    */
    const w = p.get('w');
    if (w) {
      setSitios(
        w
          .split(';')
          .slice(0, TOPE_SITIOS)
          .map((trozo) => {
            const corte = trozo.indexOf('~');
            const zona = corte === -1 ? trozo : trozo.slice(0, corte);
            const nombre = corte === -1 ? nombreDeZona(zona) : trozo.slice(corte + 1);
            return { id: `${zona}|${nombre}`, nombre, zona };
          })
          .filter((s) => {
            try {
              new Intl.DateTimeFormat('en', { timeZone: s.zona }).format(new Date());
              return true;
            } catch {
              return false;
            }
          })
      );
    }

    setPermiso(permisoActual());
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    escribirParams({
      c: cara.tipo === 'analogica' ? 'analogica' : null,
      h: cara.formato === 'auto' ? null : cara.formato,
      d: cara.fecha ? null : '0',
      s: cara.segundos ? null : '0',
      a: alarma.hora === ALARMA_INICIAL.hora ? null : alarma.hora,
      t:
        puestaMs(puesta) === puestaMs(PUESTA_INICIAL)
          ? null
          : `${puesta.horas}:${puesta.minutos}:${puesta.segundos}`,
      w: sitios.length
        ? sitios
            .map((s) => (s.nombre === nombreDeZona(s.zona) ? s.zona : `${s.zona}~${s.nombre}`))
            .join(';')
        : null,
    });
  }, [listo, cara, alarma.hora, puesta, sitios]);

  // ---------- el latido ----------

  const corriendo =
    crono.estado === 'andando' ||
    temporizador.estado === 'andando' ||
    // Sonando también: ahí la cuenta va hacia arriba y tiene que verse
    // moverse, que es lo que dice cuánto lleva esperando.
    temporizador.estado === 'sonando' ||
    alarma.activa;

  useEffect(() => {
    /*
     * Cada cuánto repintar, según lo que haya que ver:
     *
     *   · Con el cronómetro andando hace falta ir fino, porque enseña
     *     centésimas. 50 ms se lee como continuo sin ser un derroche.
     *   · Con los segundos a la vista o algo contando, cuatro veces por
     *     segundo: el número solo cambia una, pero así nunca se ve un
     *     segundo congelado al volver de otra pestaña.
     *   · Sin nada de eso, el reloj solo enseña horas y minutos: medio
     *     minuto basta y la pestaña deja de despertar al procesador.
     */
    const cada =
      crono.estado === 'andando'
        ? 50
        : // El reloj mundial enseña segundos, así que mientras haya un
          // sitio puesto la pestaña tiene que latir aunque no haya nada
          // contando.
          cara.segundos || corriendo || alarmaSuena || sitios.length > 0
          ? 250
          : 30_000;

    const id = setInterval(() => {
      setAhora(Date.now());
      if (typeof performance !== 'undefined') setMono(performance.now());
    }, cada);

    return () => clearInterval(id);
  }, [crono.estado, cara.segundos, corriendo, alarmaSuena, sitios.length]);

  /** El día que es aquí, para saber si allí es otro. */
  const diaAqui = diaDeZona(new Date(ahora), zonaAqui);

  // ---------- la alarma ----------

  const faltaAlarma = faltaParaAlarma(alarma, new Date(ahora));

  useEffect(() => {
    if (!alarma.activa || alarmaSuena) return;
    if (faltaAlarma === null || faltaAlarma > 0) return;

    setAlarmaSuena(true);
    setAlarma((a) => ({ ...a, activa: false }));
    if (conSonido) sonar(true, 6);
    notificar(tr('avisoAlarmaTitulo'), tr('avisoAlarmaCuerpo'), 'dgo-reloj-alarma');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faltaAlarma, alarma.activa, alarmaSuena, conSonido]);

  // ---------- el temporizador ----------

  const quedaTemporizador = restanteTemporizador(temporizador, puesta, ahora);

  useEffect(() => {
    if (temporizador.estado !== 'andando' || quedaTemporizador > 0) return;

    setTemporizador({ estado: 'sonando', total: temporizador.total, desde: Date.now() });
    if (conSonido) sonar(false, 4);
    notificar(tr('avisoTemporizadorTitulo'), tr('avisoTemporizadorCuerpo'), 'dgo-reloj-temp');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quedaTemporizador, temporizador, conSonido]);

  // ---------- el título de la pestaña ----------

  const original = useRef<string | null>(null);

  useEffect(() => {
    if (!listo) return;
    if (original.current === null) original.current = document.title;

    /*
     * Qué se enseña en el título, por orden de urgencia. Solo cabe una
     * cosa, así que gana lo que está a punto de pasar sobre lo que
     * simplemente está corriendo.
     */
    const texto = alarmaSuena
      ? `${tr('alarmaSonando')}`
      : temporizador.estado === 'sonando'
        ? tr('temporizadorSonando')
        : temporizador.estado === 'andando'
          ? `${comoCuenta(quedaTemporizador)} · ${tr('temporizador')}`
          : crono.estado === 'andando'
            ? `${comoCronometro(transcurrido(crono, mono))} · ${tr('cronometro')}`
            : null;

    document.title = texto ?? original.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, alarmaSuena, temporizador.estado, crono.estado, comoCuenta(quedaTemporizador)]);

  useEffect(
    () => () => {
      if (original.current !== null) document.title = original.current;
    },
    []
  );

  // ---------- los mandos ----------

  function conGesto(hacer: () => void) {
    arrancarAudio();
    hacer();
  }

  function probarSonido() {
    arrancarAudio();
    setTimeout(() => sonar(true, 2), 0);
  }

  async function pedirPermiso() {
    setPermiso(await pedirPermisoAviso());
  }

  const cronoVa = crono.estado === 'andando';

  function cronoArrancar() {
    conGesto(() =>
      setCrono((c) =>
        c.estado === 'andando'
          ? c
          : {
              estado: 'andando',
              acumulado: c.acumulado,
              desde: performance.now(),
              vueltas: c.vueltas,
            }
      )
    );
  }

  function cronoParar() {
    setCrono((c) =>
      c.estado === 'andando'
        ? { estado: 'parado', acumulado: transcurrido(c, performance.now()), vueltas: c.vueltas }
        : c
    );
  }

  function cronoVuelta() {
    setCrono((c) => ({ ...c, vueltas: [...c.vueltas, transcurrido(c, performance.now())] }));
  }

  function cronoCero() {
    setCrono(CRONOMETRO_INICIAL);
  }

  function tempEmpezar() {
    conGesto(() =>
      setTemporizador((t) => {
        if (t.estado === 'pausa') {
          return { estado: 'andando', terminaEn: Date.now() + t.restanteMs, total: t.total };
        }
        const total = puestaMs(puesta);
        if (total <= 0) return t;
        return { estado: 'andando', terminaEn: Date.now() + total, total };
      })
    );
    setAhora(Date.now());
  }

  function tempPausar() {
    setTemporizador((t) =>
      t.estado === 'andando'
        ? { estado: 'pausa', restanteMs: Math.max(0, t.terminaEn - Date.now()), total: t.total }
        : t
    );
  }

  function tempReiniciar() {
    setTemporizador(TEMPORIZADOR_INICIAL);
  }

  /** Le añade minutos a uno que ya sonó y lo vuelve a poner en marcha. */
  function tempAnadir(minutos: number) {
    conGesto(() => setTemporizador(conMasTiempo(minutos, Date.now())));
    setAhora(Date.now());
  }

  // ---------- pintado ----------

  const fechaAhora = new Date(ahora);
  const cronoMs = transcurrido(crono, mono);
  const lista = vueltasDe(crono, mono);
  const marcas = extremos(lista);
  const proxima = alarma.activa ? proximaVez(alarma.hora, fechaAhora) : null;
  return (
    <div className="grid gap-6">
      {/*
        ================= El reloj, con sus ajustes al lado =================

        Los ajustes van a la DERECHA y no debajo. Debajo empujaban al
        resto de la herramienta hacia abajo y además partían la lectura en
        dos: la hora, una fila de controles, y otra vez contenido. A un
        lado, la hora se queda sola con todo el alto y los ajustes leen
        como lo que son: una columna de preferencias que se tocan una vez.
      */}
      <section className="cara-reloj">
        <div className="pantalla" data-tour="hora">
          {cara.tipo === 'analogica' ? (
            <Esfera fecha={fechaAhora} conSegundos={cara.segundos} locale={locale} />
          ) : (
            <p className="hora">{horaEscrita(fechaAhora, cara, locale)}</p>
          )}

          {cara.fecha && <p className="fecha">{fechaEscrita(fechaAhora, locale)}</p>}
        </div>

        <div className="ajustes-reloj" data-tour="cara">
          <p className="titulo">{tr('cara')}</p>

          <div className="segmento" role="group" aria-label={tr('cara')}>
            {(['digital', 'analogica'] as const).map((tipo) => (
              <label key={tipo}>
                <input
                  type="radio"
                  name="cara-tipo"
                  checked={cara.tipo === tipo}
                  onChange={() => setCara((c) => ({ ...c, tipo }))}
                />
                <span>{tipo === 'digital' ? tr('caraDigital') : tr('caraAnalogica')}</span>
              </label>
            ))}
          </div>

          {/* El formato de 12 o 24 horas solo existe si hay cifras que
              escribir. En una esfera no significa nada —las agujas no
              llevan «PM»— así que enseñarlo sería ofrecer un ajuste que no
              cambia lo que se está mirando. */}
          {cara.tipo === 'digital' && (
            <div className="segmento" role="group" aria-label={tr('formato')}>
              {(['auto', '12', '24'] as const).map((formato) => (
                <label key={formato}>
                  <input
                    type="radio"
                    name="cara-formato"
                    checked={cara.formato === formato}
                    onChange={() => setCara((c) => ({ ...c, formato }))}
                  />
                  <span>
                    {formato === 'auto'
                      ? tr('formatoAuto')
                      : formato === '12'
                        ? tr('formato12')
                        : tr('formato24')}
                  </span>
                </label>
              ))}
            </div>
          )}

          <label className="interruptor">
            <input
              type="checkbox"
              role="switch"
              checked={cara.fecha}
              onChange={(e) => setCara((c) => ({ ...c, fecha: e.target.checked }))}
            />
            <span className="texto">{tr('verFecha')}</span>
          </label>

          <label className="interruptor">
            <input
              type="checkbox"
              role="switch"
              checked={cara.segundos}
              onChange={(e) => setCara((c) => ({ ...c, segundos: e.target.checked }))}
            />
            <span className="texto">{tr('verSegundos')}</span>
          </label>

          {/*
            El aviso vive aquí, con la cara, y no en una tarjeta propia.

            Tenía una tarjeta entera para un interruptor y un botón, que es
            mucho sitio para lo que dice. Y sobre todo: es un ajuste de la
            HERRAMIENTA, igual que el formato de la hora —vale para la
            alarma, para el temporizador y para lo que venga—, no un cuarto
            modo. Al lado de la cara se lee como lo que es.
          */}
          <hr className="corte" />

          <p className="titulo">{tr('aviso')}</p>

          <div className="fila-aviso">
            <label className="interruptor">
              <input
                type="checkbox"
                role="switch"
                checked={conSonido}
                onChange={(e) => setConSonido(e.target.checked)}
              />
              <span className="texto">{tr('sonido')}</span>
            </label>

            {conSonido && (
              <Button variant="outline" size="sm" onClick={probarSonido}>
                {tr('probarSonido')}
              </Button>
            )}
          </div>

          <div data-tour="aviso">
            {permiso === 'granted' && <p className="nota">{tr('notificacion')} ✓</p>}
            {permiso === 'default' && (
              <Button
                variant="outline"
                size="sm"
                onClick={pedirPermiso}
                className="justify-self-start"
              >
                {tr('notificacionPedir')}
              </Button>
            )}
            {permiso === 'denied' && <p className="nota">{tr('notificacionDenegada')}</p>}
            {permiso === 'no-hay' && <p className="nota">{tr('notificacionNoHay')}</p>}
          </div>
        </div>
      </section>

      {/*
        ================= Los tres, a la vez =================

        Eran pestañas y ahora son tarjetas, y el motivo es que la
        herramienta promete que los tres corren a la vez: con pestañas eso
        había que creérselo, porque solo se veía uno. Hacía falta además un
        punto de color sobre la pestaña para avisar de que había algo
        andando donde no se estaba mirando — un parche para un problema que
        con tarjetas no existe.

        Cocinar mirando el temporizador mientras el cronómetro cuenta otra
        cosa es el caso normal de una herramienta así, y era justo el que
        las pestañas hacían incómodo.
      */}
      <div className="modos-reloj">
      {/* ---------------- Reloj mundial ----------------

        La primera del juego y en la primera columna, pegada al reloj
        grande: es lo mismo que él —una hora que se lee— y no algo que se
        pone en marcha, que es lo que son las otras tres.

        Estuvo a todo lo ancho, ella sola, porque en una columna de 19rem
        «Carolina del Norte (hora oriental)» se corta a la mitad. Se
        deshizo: una tarjeta ancha entre otras tres normales se leía como
        una sección aparte, y con las filas a lo ancho de la pantalla el
        nombre y su hora quedaban a un palmo de distancia. El nombre
        truncado se acepta a cambio, y lleva su `title` para quien pase el
        puntero. El suelo de 19rem por columna sigue puesto en la hoja.
      */}
      <section className="tarjeta-modo tarjeta-mundial" data-tour="mundial">
        {/* El título comparte renglón con «quitar todos», que aparece a
            partir del segundo sitio: de uno en uno está bien para dos,
            para nueve no. Es el mismo trato que en husos horarios. */}
        <div className="cabecera-modo">
          <p className="titulo">{tr('mundial')}</p>
          {sitios.length > 1 && (
            <Button variant="outline" size="xs" onClick={() => setSitios([])}>
              <TrashIcon aria-hidden="true" />
              {tr('quitarSitios')}
            </Button>
          )}
        </div>

        <div className="buscador-mundial">
          <BuscadorLugar
            id="mundial"
            lang={lang}
            textos={{
              etiqueta: tr('mundialBuscar'),
              ayuda: '',
              cargando: tr('cargandoSitios'),
              sinResultados: tr('sinSitios'),
              zipDesconocido: tr('zipSinSitio'),
              fallo: tr('falloDatos'),
            }}
            pedirLugares={pedirLugares}
            pedirZips={pedirZips}
            onElegir={anadirSitio}
          />
        </div>

        {sitios.length === 0 ? (
          <p className="pista-mundial">{tr('mundialVacio')}</p>
        ) : (
          /*
            La lista no estira la tarjeta.

            Es el mismo trato que las vueltas del cronómetro y con el mismo
            número —`--alto-lista-modo`, escrito una sola vez en la hoja—,
            porque son tarjetas del mismo nivel y tienen que empezar a
            desplazarse en el mismo sitio. Sin tope, la lista arrastraba a
            las tarjetas vecinas, que van a la misma altura.
          */
          <div className="caja-mundial">
            {/*
              Las clases son las de husos horarios a propósito. Es la misma
              información —un sitio y su hora— y antes se pintaba con un
              juego de clases propio que se parecía pero no era igual: la
              hora en otro cuerpo, la diferencia en otro sitio. Compartirlas
              hace que las dos herramientas se lean como el mismo sitio y
              que un arreglo en una llegue a la otra.
            */}
            <ul className="lista-horas">
              {sitios.map((s) => {
                const cuando = new Date(ahora);
                const diferencia =
                  (desfaseDeZona(cuando, s.zona) - desfaseDeZona(cuando, zonaAqui)) / 60;
                const diaAlla = diaDeZona(cuando, s.zona);
                const salto = diaAlla === diaAqui ? 0 : diaAlla > diaAqui ? 1 : -1;

                return (
                  <li key={s.id} className="fila-hora">
                    <span className="lugar truncate" title={s.nombre}>
                      {s.nombre}
                    </span>
                    <span className="meta truncate" title={s.zona}>
                      {abreviaturaDeZona(cuando, s.zona, lang)}
                    </span>

                    <span className="hora">
                      {new Intl.DateTimeFormat(locale, {
                        timeZone: s.zona,
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: cara.formato === 'auto' ? undefined : cara.formato === '12',
                      }).format(cuando)}
                    </span>

                    <span className="cuando">
                      {diferencia === 0
                        ? tr('mundialIgual')
                        : `${diferencia > 0 ? '+' : '−'}${Math.abs(diferencia).toLocaleString(
                            locale,
                            { maximumFractionDigits: 1 }
                          )} h`}
                      {salto !== 0 && (
                        <>
                          {' · '}
                          {/* En acento y no en rojo: aquí que allí sea otro
                              día es un dato, no el error que se intenta
                              evitar. En husos sí es lo segundo. */}
                          <span className="otro-dia">
                            {salto > 0 ? tr('mundialManana') : tr('mundialAyer')}
                          </span>
                        </>
                      )}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setSitios((p) => p.filter((x) => x.id !== s.id))}
                      aria-label={`${tr('quitarSitio')} ${s.nombre}`}
                      title={tr('quitarSitio')}
                      className="quitar size-4"
                    >
                      <XIcon aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

        {/* ---------------- Cronómetro ---------------- */}
        <section className="tarjeta-modo tarjeta-cronometro" data-tour="cronometro">
          <p className="titulo">{tr('cronometro')}</p>

          <p className="numero-grande">{comoCronometro(cronoMs)}</p>

          <div className="mandos-modo">
            {cronoVa ? (
              <Button onClick={cronoParar} className={BOTON}>
                <StopIcon aria-hidden="true" weight="fill" />
                {tr('parar')}
              </Button>
            ) : (
              <Button onClick={cronoArrancar} className={BOTON}>
                <PlayIcon aria-hidden="true" weight="fill" />
                {cronoMs > 0 ? tr('seguir') : tr('arrancar')}
              </Button>
            )}

            <Button variant="outline" onClick={cronoVuelta} disabled={!cronoVa}>
              <FlagIcon aria-hidden="true" />
              {tr('vuelta')}
            </Button>

            <Button variant="outline" onClick={cronoCero} disabled={cronoMs === 0}>
              <ArrowCounterClockwiseIcon aria-hidden="true" />
              {tr('aCero')}
            </Button>
          </div>

          {lista.length > 0 && (
            <div className="caja-vueltas">
              <table className="tabla-vueltas">
                <caption className="sr-only">{tr('vueltas')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{tr('vueltaNum')}</th>
                    <th scope="col">{tr('duracion')}</th>
                    <th scope="col">{tr('total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((v) => (
                    <tr
                      key={v.numero}
                      className={
                        v.numero === marcas.rapida
                          ? 'rapida'
                          : v.numero === marcas.lenta
                            ? 'lenta'
                            : undefined
                      }
                    >
                      <th scope="row">
                        {v.numero}
                        {v.numero === marcas.rapida && (
                          <span className="marca">{tr('masRapida')}</span>
                        )}
                        {v.numero === marcas.lenta && (
                          <span className="marca">{tr('masLenta')}</span>
                        )}
                      </th>
                      <td>{comoCronometro(v.duracion)}</td>
                      <td>{comoCronometro(v.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ---------------- Alarma ---------------- */}
        <section className="tarjeta-modo tarjeta-alarma" data-tour="alarma">
          <p className="titulo">{tr('alarma')}</p>

          {alarmaSuena ? (
            <div className="sonando">
              <p className="titular">{tr('alarmaSonando')}</p>
              <p className="cuando">{horaEscrita(fechaAhora, cara, locale)}</p>
              <Button onClick={() => setAlarmaSuena(false)} className={BOTON}>
                <BellSlashIcon aria-hidden="true" weight="fill" />
                {tr('callar')}
              </Button>
            </div>
          ) : (
            <>
              <div className="fila-alarma">
                <Label htmlFor="alarma-hora" className="sr-only">
                  {tr('aQueHora')}
                </Label>
                <Input
                  id="alarma-hora"
                  type="time"
                  value={alarma.hora}
                  onChange={(e) => setAlarma((a) => ({ ...a, hora: e.target.value }))}
                  className="hora-alarma"
                />
              </div>

              <Button
                onClick={() => conGesto(() => setAlarma((a) => ({ ...a, activa: !a.activa })))}
                variant={alarma.activa ? 'outline' : 'default'}
                className={alarma.activa ? undefined : BOTON}
                disabled={!horaValida(alarma.hora)}
              >
                {alarma.activa ? (
                  <>
                    <BellSlashIcon aria-hidden="true" />
                    {tr('quitarAlarma')}
                  </>
                ) : (
                  <>
                    <BellIcon aria-hidden="true" weight="fill" />
                    {tr('ponerAlarma')}
                  </>
                )}
              </Button>

              {proxima && faltaAlarma !== null ? (
                <p className="cuenta-alarma" aria-live="polite">
                  {tr('suenaEn')} <strong>{comoCuenta(faltaAlarma)}</strong>
                  <br />
                  {tr('sueneA')}{' '}
                  <strong>
                    {new Intl.DateTimeFormat(locale, {
                      weekday: 'long',
                      hour: 'numeric',
                      minute: '2-digit',
                      ...(cara.formato !== 'auto' ? { hour12: cara.formato === '12' } : {}),
                    }).format(proxima)}
                  </strong>
                </p>
              ) : (
                <p className="nota-limite">{tr('alarmaAviso')}</p>
              )}
            </>
          )}
        </section>

        {/*
          ---------------- Temporizador ----------------

            Tres pantallas, no una con todo puesto.

            Parado enseña SOLO cómo se pone: los campos y los atajos. La
            cuenta atrás y el anillo no dicen ahí nada que los campos no
            digan ya —«5:00» encima de un campo que pone 5— y se llevaban
            media tarjeta para repetirlo. En marcha desaparecen los campos y
            manda el anillo, que es lo que se mira.

            Y cuando se cumple no se apaga solo: sigue contando hacia
            arriba hasta que alguien lo para, y ofrece añadir tiempo sin
            volver a teclear la cuenta. Al arroz le faltan dos minutos más
            bastante a menudo.
          */}
        <section className="tarjeta-modo tarjeta-temporizador" data-tour="temporizador">
          <p className="titulo">{tr('temporizador')}</p>

          {temporizador.estado === 'sonando' ? (
            <div className="cumplido">
              <p className="titular">{tr('temporizadorSonando')}</p>

              <p className="excedido" aria-live="polite">
                {tr('llevaSonando')} <strong>{comoCuenta(excedidoMs(temporizador, ahora))}</strong>
              </p>

              <div className="anadir">
                <span className="etiqueta">{tr('masTiempo')}</span>
                {[1, 5, 10].map((min) => (
                  <Button key={min} variant="outline" size="sm" onClick={() => tempAnadir(min)}>
                    +{min}
                  </Button>
                ))}
                <span className="unidad-atajos">{tr('minutos')}</span>
              </div>

              <Button onClick={tempReiniciar} className={BOTON}>
                <StopIcon aria-hidden="true" weight="fill" />
                {tr('pararTemporizador')}
              </Button>
            </div>
          ) : temporizador.estado === 'parado' ? (
            <>
              <div className="campos-puesta">
                {(['horas', 'minutos', 'segundos'] as const).map((clave) => (
                  <div key={clave} className="campo-puesta">
                    <Input
                      id={`puesta-${clave}`}
                      type="number"
                      inputMode="numeric"
                      min={LIMITES_PUESTA[clave].min}
                      max={LIMITES_PUESTA[clave].max}
                      value={puesta[clave]}
                      onChange={(e) =>
                        setPuesta((p) => ({
                          ...p,
                          [clave]: limitarPuesta(Number(e.target.value), clave),
                        }))
                      }
                      className="w-[3.75rem] text-center"
                    />
                    <Label htmlFor={`puesta-${clave}`}>
                      {clave === 'horas'
                        ? tr('horas')
                        : clave === 'minutos'
                          ? tr('minutos')
                          : tr('segundos')}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Los ratos que se ponen de verdad, a un toque. Poner cinco
                    minutos no debería costar tres campos. */}
              <div className="atajos">
                <span className="unidad-atajos">
                  {tr('atajos')} · {tr('minutos')}
                </span>
                <div className="numeros">
                  {ATAJOS.map((min) => (
                    <Button
                      key={min}
                      variant="outline"
                      size="sm"
                      onClick={() => setPuesta({ horas: 0, minutos: min, segundos: 0 })}
                    >
                      {min}
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={tempEmpezar} className={BOTON} disabled={puestaMs(puesta) <= 0}>
                <PlayIcon aria-hidden="true" weight="fill" />
                {tr('empezar')}
              </Button>
            </>
          ) : (
            <>
              <div className="anillo-temporizador">
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <circle className="pista" cx="50" cy="50" r="45" />
                  <circle
                    className="hecho"
                    cx="50"
                    cy="50"
                    r="45"
                    style={{
                      strokeDashoffset: 283 - 283 * avanceTemporizador(temporizador, puesta, ahora),
                    }}
                  />
                </svg>
                <p className="numero-grande">{comoCuenta(quedaTemporizador)}</p>
              </div>

              <div className="mandos-modo">
                {temporizador.estado === 'andando' ? (
                  <Button onClick={tempPausar} className={BOTON}>
                    <PauseIcon aria-hidden="true" weight="fill" />
                    {tr('pausar')}
                  </Button>
                ) : (
                  <Button onClick={tempEmpezar} className={BOTON}>
                    <PlayIcon aria-hidden="true" weight="fill" />
                    {tr('seguir')}
                  </Button>
                )}

                <Button variant="outline" onClick={tempReiniciar}>
                  <ArrowCounterClockwiseIcon aria-hidden="true" />
                  {tr('reiniciar')}
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- auxiliares

/**
 * La esfera.
 *
 * Lleva los doce números, que es lo que la hace legible de un vistazo:
 * sin ellos hay que contar marcas desde arriba para saber si la aguja
 * está en el 4 o en el 5, y una esfera que hay que descifrar no sirve
 * para lo único que sirve una esfera, que es leer la hora de reojo.
 *
 * Los números se colocan por trigonometría pero NO se rotan: van rectos,
 * como en un reloj de pared. Rotarlos con su ángulo dejaría el 6 boca
 * abajo.
 *
 * Y nada más: ni aro exterior ni marcas de minuto. Los números ya dibujan
 * el círculo, y las marcas entre número y número no informaban de nada
 * teniéndolos. El porqué largo está en `global.css`.
 *
 * Las agujas se mueven de forma continua —el porqué está en la
 * librería— y el segundero solo aparece si se han pedido los segundos,
 * porque si no repintaría cuatro veces por segundo para nada.
 */
function Esfera({
  fecha,
  conSegundos,
  locale,
}: {
  fecha: Date;
  conSegundos: boolean;
  locale: string;
}) {
  const a = agujas(fecha);

  return (
    <div className="esfera" role="img" aria-label={fecha.toLocaleTimeString(locale)}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => {
          const hora = i === 0 ? 12 : i;
          // El cero de un reloj está ARRIBA y no a la derecha, así que el
          // ángulo se mide desde las doce: seno para la x, menos coseno
          // para la y.
          const angulo = (i * 30 * Math.PI) / 180;
          return (
            <text
              key={hora}
              className={hora === 12 ? 'numero cardinal' : 'numero'}
              x={50 + 38 * Math.sin(angulo)}
              y={50 - 38 * Math.cos(angulo)}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {hora}
            </text>
          );
        })}

        <line
          className="aguja horas"
          x1="50"
          y1="50"
          x2="50"
          y2="32"
          transform={`rotate(${a.horas} 50 50)`}
        />
        <line
          className="aguja minutos"
          x1="50"
          y1="50"
          x2="50"
          y2="24"
          transform={`rotate(${a.minutos} 50 50)`}
        />
        {conSegundos && (
          <line
            className="aguja segundos"
            x1="50"
            y1="58"
            x2="50"
            y2="22"
            transform={`rotate(${a.segundos} 50 50)`}
          />
        )}

        <circle className="eje" cx="50" cy="50" r="1.75" />
      </svg>
    </div>
  );
}
