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
import { CheckIcon, ClockIcon, CopyIcon, MapPinIcon, XIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t, type Lang } from '@/i18n/config';
import { HUSOS as H } from '@/i18n/timezones';
import BuscadorLugar, { type TextosBuscador } from './BuscadorLugar';
import {
  componerFrase,
  convertir,
  nombreDeZona,
  obtenerTemporal,
  zonaDelNavegador,
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
 * La fecha y la hora de este momento.
 *
 * Antes esto redondeaba a la media hora siguiente, pensando en que las
 * citas se ponen en horas redondas. El resultado era que pulsar «Ahora» a
 * las 10:15 escribía 10:30, y nadie entendía qué había hecho el botón. Un
 * botón que se llama «Ahora» pone «ahora»; redondear, si alguien quiere,
 * lo hace escribiendo.
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

  function anadirDestino(etiqueta: string, zona: string) {
    setDestinos((previos) =>
      previos.some((d) => d.zona === zona && d.etiqueta === etiqueta)
        ? previos
        : [...previos, { id: `${zona}|${etiqueta}`, etiqueta, zona, fuente: 'ciudad' }]
    );
  }

  function quitar(id: string) {
    setDestinos((previos) => previos.filter((d) => d.id !== id));
  }

  function anadirMiUbicacion() {
    const zona = zonaDelNavegador();
    anadirDestino(nombreDeZona(zona), zona);
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

  function ponerAhora() {
    const ahora = ahoraMismo();
    setFecha(ahora.fecha);
    setHora(ahora.hora);
  }

  const diferenciaTexto = (horas: number) => {
    if (horas === 0) return tr('misma');
    const absoluto = Math.abs(horas);
    const cantidad = Number.isInteger(absoluto) ? absoluto : absoluto.toFixed(1);
    return `${cantidad} h ${horas > 0 ? tr('adelanto') : tr('retraso')}`;
  };

  // ---------- pintado ----------

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      {/* ---------------- Controles ---------------- */}
      <div className="grid gap-7">
        <section className="grid gap-3">
          <h2 className="text-[var(--fs-small)] font-semibold text-ink">{tr('origenTitulo')}</h2>

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
              <Input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-start">
            <Button variant="ghost" size="xs" onClick={ponerAhora}>
              <ClockIcon aria-hidden="true" />
              {tr('ahora')}
            </Button>
          </div>

          {/*
            De dónde es esa hora casi nunca se cambia: quien agenda lo hace
            desde su propia zona un día tras otro. Plegado, el resumen dice
            cuál es —que es el 99 % de las veces lo único que hace falta
            saber— y abrirlo cuesta una pulsación las pocas veces que no.
          */}
          <details className="rounded-lg border border-line">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-[var(--fs-small)] marker:content-none">
              <span className="text-ink-soft">
                {tr('zonaOrigen')} <span className="font-medium text-ink">{origen.etiqueta}</span>
              </span>
              <span className="text-ink-soft underline underline-offset-2">
                {tr('cambiar')}
              </span>
            </summary>

            <div className="border-t border-line p-3">
              <BuscadorLugar
                id="origen"
                textos={{ ...textosBuscador, etiqueta: tr('cambiarOrigen'), ayuda: '' }}
                pedirCiudades={pedirCiudades}
                pedirZips={pedirZips}
                onElegir={(c) => setOrigen({ zona: c.zona, etiqueta: c.etiqueta })}
              />
            </div>
          </details>
        </section>

        <section className="grid gap-3">
          <h2 className="text-[var(--fs-small)] font-semibold text-ink">
            {tr('destinosTitulo')}
          </h2>

          <BuscadorLugar
            id="destino"
            textos={textosBuscador}
            pedirCiudades={pedirCiudades}
            pedirZips={pedirZips}
            onElegir={(c) => anadirDestino(c.etiqueta, c.zona)}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={anadirMiUbicacion}
            className="justify-self-start"
          >
            <MapPinIcon aria-hidden="true" />
            {tr('miUbicacion')}
          </Button>
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
              {tr('noExisteCuerpo')}{' '}
              <strong className="text-ink">{resultado.horaCorregida}</strong>
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
            <p className="text-[var(--fs-small)] text-ink-soft">{origen.etiqueta}</p>
            <p className="mt-1 text-[length:var(--fs-h2)] font-semibold text-ink">
              {resultado.origen.hora}
            </p>
            <p className="text-[var(--fs-small)] text-ink-muted">{resultado.origen.fecha}</p>
          </div>
        )}

        <section>
          <h2 className="text-[length:var(--fs-h3)] font-semibold text-ink">{tr('resultados')}</h2>

          {destinos.length === 0 ? (
            <p className="mt-3 max-w-[var(--measure)] text-[var(--fs-small)] text-ink-soft">
              {tr('vacio')}
            </p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {resultado?.destinos.map((c) => {
                const frase = componerFrase(c, resultado.origen, lang);
                return (
                  <li key={c.destino.id} className="rounded-lg border border-line bg-surface p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{c.destino.etiqueta}</p>
                        <p className="font-mono text-[0.7rem] text-ink-soft">
                          {c.destino.zona} · {c.abreviatura}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => quitar(c.destino.id)}
                        aria-label={`${tr('quitar')} ${c.destino.etiqueta}`}
                        title={tr('quitar')}
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
                      <p className="mt-3 rounded-md border border-[var(--danger)] px-3 py-2 text-[var(--fs-small)] font-medium text-[var(--danger)]">
                        {c.saltoDeDia > 0 ? tr('diaSiguiente') : tr('diaAnterior')}
                      </p>
                    )}

                    <div className="mt-4 border-t border-line pt-3">
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

          {destinos.length > 0 && (
            <p className="mt-4 max-w-[var(--measure)] text-[var(--fs-small)] text-ink-soft">
              {tr('fraseAyuda')}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
