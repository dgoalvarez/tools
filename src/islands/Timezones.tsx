/**
 * La herramienta de husos horarios.
 *
 * El problema real: tienes una cita a las tres de la tarde hora de Colombia
 * y necesitas decírsela en *su* hora a alguien que vive en Estados Unidos,
 * donde hay seis husos y donde varios estados están partidos por la mitad.
 *
 * Por eso lo que de verdad entrega la herramienta no es una tabla, es una
 * frase que se pega en WhatsApp. La tabla es el camino, no el destino.
 *
 * La aritmética vive en src/lib/timezones.ts. Los datos de ciudades y
 * códigos postales se descargan solo cuando alguien los usa.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, CopyIcon, MapPinIcon, TrashIcon, XIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t, type Lang } from '@/i18n/config';
import { HUSOS as H } from '@/i18n/timezones';
import BuscadorLugar, { type TextosBuscador } from './BuscadorLugar';
import {
  componerFrase,
  convertir,
  nombreDePais,
  nombreDeZona,
  obtenerTemporal,
  zonaDelNavegador,
  type Coincidencia,
  type DatosCiudades,
  type DatosZips,
  type Destino,
  type Resultado,
} from '@/lib/timezones';
import { escribirParams, leerParams } from '@/lib/url-state';

/**
 * El origen por defecto. Sale del problema que dio origen a la herramienta:
 * agendar desde Colombia para gente repartida por Estados Unidos.
 */
const ORIGEN_INICIAL = { zona: 'America/Bogota', etiqueta: 'Bogotá' };

interface Props {
  lang: Lang;
}

/**
 * La fecha y la hora de este momento: con lo que arranca la herramienta.
 *
 * Hubo un botón «Ahora» que volvía aquí. Se ha quitado: los campos ya
 * nacen con la hora actual, así que el botón solo hacía algo después de
 * haberla cambiado a mano, y entonces no se entendía qué hacía.
 */
function ahoraMismo() {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return {
    fecha: `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`,
    hora: `${dos(d.getHours())}:${dos(d.getMinutes())}`,
  };
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

export default function Timezones({ lang }: Props) {
  const tr = (clave: keyof typeof H) => t(H[clave], lang);

  const inicial = useRef(ahoraMismo());
  const [fecha, setFecha] = useState(inicial.current.fecha);
  const [hora, setHora] = useState(inicial.current.hora);
  const [origen, setOrigen] = useState(ORIGEN_INICIAL);
  const [destinos, setDestinos] = useState<Destino[]>([]);

  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [enlaceLeido, setEnlaceLeido] = useState(false);

  // Los datos se guardan en refs y no en el estado: una vez descargados no
  // vuelven a cambiar, y no tiene sentido que provoquen un repintado.
  const ciudades = useRef<DatosCiudades | null>(null);
  const zips = useRef<DatosZips | null>(null);

  const pedirCiudades = useCallback(async () => {
    if (!ciudades.current) {
      ciudades.current = (await (await fetch('/data/ciudades.json')).json()) as DatosCiudades;
    }
    return ciudades.current;
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

  // ---------- añadir y quitar ----------

  function anadirDestino(c: Coincidencia) {
    setDestinos((previos) =>
      previos.some((d) => d.zona === c.zona && d.etiqueta === c.etiqueta)
        ? previos
        : [
            ...previos,
            {
              id: `${c.zona}|${c.etiqueta}`,
              etiqueta: c.etiqueta,
              ciudad: c.ciudad,
              region: c.region,
              pais: c.pais,
              zona: c.zona,
              fuente: 'ciudad',
            },
          ]
    );
  }

  function quitar(id: string) {
    setDestinos((previos) => previos.filter((d) => d.id !== id));
  }

  /**
   * El origen sale del navegador.
   *
   * Estaba en «para quién» y añadía un destino, que es justo lo contrario
   * de lo que dice el botón: «mi ubicación» es de dónde escribo la hora,
   * no a quién se la digo. Ahora vive en «mi cita» y fija el origen.
   */
  function origenDeMiUbicacion() {
    const zona = zonaDelNavegador();
    setOrigen({ zona, etiqueta: nombreDeZona(zona) });
  }

  // ---------- la dirección ----------

  useEffect(() => {
    const params = leerParams();

    const enlaceFecha = params.get('d');
    if (enlaceFecha && /^\d{4}-\d{2}-\d{2}$/.test(enlaceFecha)) setFecha(enlaceFecha);

    const enlaceHora = params.get('h');
    if (enlaceHora && /^\d{2}:\d{2}$/.test(enlaceHora)) setHora(enlaceHora);

    const enlaceOrigen = params.get('o');
    if (enlaceOrigen && zonaValida(enlaceOrigen)) {
      setOrigen({ zona: enlaceOrigen, etiqueta: nombreDeZona(enlaceOrigen) });
    }

    // Los destinos llegan como una lista de zonas separadas por comas. El
    // nombre bonito («Miami, Florida») no cabe en un enlace legible, así que
    // se reconstruye a partir de la zona: se pierde el estado, no el dato.
    const enlaceZonas = params.get('z');
    if (enlaceZonas) {
      const validas = enlaceZonas
        .split(',')
        .slice(0, 12)
        .filter(zonaValida)
        .map((zona): Destino => ({
          id: `${zona}|url`,
          etiqueta: nombreDeZona(zona),
          ciudad: nombreDeZona(zona),
          region: '',
          pais: '',
          zona,
          fuente: 'zona',
        }));
      if (validas.length) setDestinos(validas);
    }

    setEnlaceLeido(true);
  }, []);

  useEffect(() => {
    if (!enlaceLeido) return;
    escribirParams({
      d: fecha === inicial.current.fecha ? null : fecha,
      h: hora === inicial.current.hora ? null : hora,
      o: origen.zona === ORIGEN_INICIAL.zona ? null : origen.zona,
      z: destinos.length ? destinos.map((d) => d.zona).join(',') : null,
    });
    setCopiado(null);
  }, [enlaceLeido, fecha, hora, origen, destinos]);

  // ---------- la conversión ----------

  const momento = useMemo(() => {
    const [año, mes, dia] = fecha.split('-').map(Number);
    const [h, m] = hora.split(':').map(Number);
    return { año: año ?? 2026, mes: mes ?? 1, dia: dia ?? 1, hora: h ?? 0, minuto: m ?? 0 };
  }, [fecha, hora]);

  useEffect(() => {
    let cancelado = false;
    obtenerTemporal().then((Temporal) => {
      if (cancelado) return;
      setResultado(convertir(Temporal, momento, origen.zona, origen.etiqueta, destinos, lang));
    });
    return () => {
      cancelado = true;
    };
  }, [momento, origen, destinos, lang]);

  // ---------- acciones ----------

  async function copiar(clave: string, texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
    } catch {
      // Sin portapapeles, la frase sigue a la vista para seleccionarla.
    }
  }

  const diferenciaTexto = (horas: number) => {
    if (horas === 0) return tr('misma');
    const absoluto = Math.abs(horas);
    const cantidad = Number.isInteger(absoluto) ? absoluto : absoluto.toFixed(1);
    return `${cantidad} h ${horas > 0 ? tr('adelanto') : tr('retraso')}`;
  };

  // ---------- pintado ----------

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start">
      {/* ---------------- Controles ---------------- */}
      <div className="grid gap-4">
        <section className="tarjeta-control" data-tour="cita">
          <h2 className="titulo">{tr('origenTitulo')}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="fecha">{tr('fecha')}</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="hora">{tr('hora')}</Label>
              <Input id="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
          </div>

          {/*
            De dónde es esa hora casi nunca se cambia: quien agenda lo hace
            desde su propia zona un día tras otro. Plegado, el resumen dice
            cuál es —que es el 99 % de las veces lo único que hace falta
            saber— y abrirlo cuesta una pulsación las pocas veces que no.

            «Mi ubicación» vive aquí dentro y no en «para quién». Ahí abajo
            añadía un destino, que es lo contrario de lo que dice el botón:
            mi ubicación es desde dónde escribo la hora, no a quién se la
            digo.
          */}
          <details className="rounded-lg border border-line" data-tour="origen">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-[var(--fs-small)] marker:content-none">
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
                pedirCiudades={pedirCiudades}
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
            pedirCiudades={pedirCiudades}
            pedirZips={pedirZips}
            onElegir={anadirDestino}
          />
        </section>
      </div>

      {/* ---------------- Resultados ---------------- */}
      <div className="grid gap-5">
        {/* Los dos domingos del año en que la hora pedida es rara. */}
        {resultado?.ambiguedad === 'no-existe' && (
          <section className="rounded-lg border border-[var(--danger)] bg-surface p-5">
            <h2 className="text-[length:var(--fs-h3)] font-semibold text-[var(--danger)]">
              {tr('noExisteTitulo')}
            </h2>
            <p className="mt-2 max-w-[var(--measure)] text-[var(--fs-small)] text-ink-muted">
              {tr('noExisteCuerpo')} <strong className="text-ink">{resultado.horaCorregida}</strong>
            </p>
          </section>
        )}

        {resultado?.ambiguedad === 'ocurre-dos-veces' && (
          <section className="rounded-lg border border-line bg-surface-2 p-5">
            <h2 className="text-[length:var(--fs-h3)] font-semibold text-ink">
              {tr('dosVecesTitulo')}
            </h2>
            <p className="mt-2 max-w-[var(--measure)] text-[var(--fs-small)] text-ink-muted">
              {tr('dosVecesCuerpo')}
            </p>
          </section>
        )}

        {/* El origen, siempre a la vista: es contra lo que se compara todo. */}
        {resultado && (
          <div className="rounded-lg border border-line bg-surface-2 p-5">
            <p className="truncate text-[var(--fs-small)] text-ink-soft">{origen.etiqueta}</p>
            <p className="mt-1 text-[length:var(--fs-h2)] font-semibold text-ink">
              {resultado.origen.hora}
            </p>
            <p className="text-[var(--fs-small)] text-ink-muted">{resultado.origen.fecha}</p>
          </div>
        )}

        <section data-tour="resultados">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[length:var(--fs-h3)] font-semibold text-ink">
              {tr('resultados')}
            </h2>

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

          {destinos.length === 0 ? (
            <p className="mt-3 max-w-[var(--measure)] text-[var(--fs-small)] text-ink-soft">
              {tr('vacio')}
            </p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {resultado?.destinos.map((c) => {
                const frase = componerFrase(c, resultado.origen, lang);
                const debajo = [c.destino.region, nombreDePais(c.destino.pais, lang)]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <li key={c.destino.id} className="rounded-lg border border-line bg-surface p-5">
                    <div className="flex items-start justify-between gap-3">
                      {/* La ciudad arriba y la región debajo, cada una
                          truncándose por su cuenta. En una sola línea, un
                          nombre como «Santo Domingo de los Colorados, Santo
                          Domingo» empujaba el botón de quitar fuera de la
                          ficha. */}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink" title={c.destino.ciudad}>
                          {c.destino.ciudad}
                        </p>
                        {debajo && (
                          <p
                            className="truncate text-[var(--fs-small)] text-ink-muted"
                            title={debajo}
                          >
                            {debajo}
                          </p>
                        )}
                        <p className="truncate font-mono text-[0.7rem] text-ink-soft">
                          {c.destino.zona} · {c.abreviatura}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => quitar(c.destino.id)}
                        aria-label={`${tr('quitar')} ${c.destino.ciudad}`}
                        title={tr('quitar')}
                        className="shrink-0"
                      >
                        <XIcon aria-hidden="true" />
                      </Button>
                    </div>

                    <p className="mt-3 text-[length:var(--fs-h2)] font-semibold text-ink">
                      {c.hora}
                    </p>
                    <p className="text-[var(--fs-small)] text-ink-muted">
                      {c.fecha} · {diferenciaTexto(c.diferencia)}
                    </p>

                    {/* El aviso que evita el error que de verdad se comete. */}
                    {c.saltoDeDia !== 0 && (
                      <p
                        data-tour="salto"
                        className="mt-3 rounded-md border border-[var(--danger)] px-3 py-2 text-[var(--fs-small)] font-medium text-[var(--danger)]"
                      >
                        {c.saltoDeDia > 0 ? tr('diaSiguiente') : tr('diaAnterior')}
                      </p>
                    )}

                    <div className="mt-4 border-t border-line pt-3" data-tour="frase">
                      <p className="text-[var(--fs-small)] text-ink-muted">{frase}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => copiar(c.destino.id, frase)}
                      >
                        {copiado === c.destino.id ? (
                          <CheckIcon aria-hidden="true" />
                        ) : (
                          <CopyIcon aria-hidden="true" />
                        )}
                        {copiado === c.destino.id ? tr('copiado') : tr('copiarFrase')}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
