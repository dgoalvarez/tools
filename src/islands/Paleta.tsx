/**
 * La herramienta de paletas.
 *
 * Genera la rampa, sí — eso lo hace cualquiera. Lo que aquí importa es lo
 * que dice de cada paso: si aguanta texto encima y con qué tinta, si el
 * gamut se comió parte de su croma, y cuál de los once es exactamente el
 * color que pegaste. Una paleta que no contesta a eso obliga a llevarse
 * cada shade a otra herramienta para comprobarlo.
 *
 * La aritmética vive en `src/lib/rampa.ts`. Aquí solo están el estado, la
 * cuadrícula y el panel de detalle.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusIcon, TrashIcon, WarningIcon } from '@phosphor-icons/react';

import BotonCopiar from '@/components/BotonCopiar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t, type Lang } from '@/i18n/config';
import { PALETA as P } from '@/i18n/paleta';
import { leerColor } from '@/lib/contrast';
import {
  AJUSTES_INICIALES,
  LIMITES,
  aCss,
  aOklchCss,
  aplicarRetoque,
  buscarNombresRepetidos,
  construirPaleta,
  limpiarNombre,
  medirPaso,
  retoquesDormidos,
  soltarRetoque,
  type Ajustes,
  type Paso,
  type Tonalidad,
} from '@/lib/rampa';
import { escribirParams, leerParams } from '@/lib/url-state';

/** El texto con el que se juzga cada paso: cuerpo normal. */
const TEXTO = { px: 16, peso: 400 };

/**
 * Con lo que se abre la herramienta.
 *
 * Tres tonalidades y no una: lo que distingue a esta herramienta es que
 * las rampas de varias tonalidades comparten escalera, y con una sola no
 * se ve. Los tres colores son los de una interfaz cualquiera —principal,
 * bien y mal— para que la primera pantalla ya se parezca a algo útil.
 */
const INICIALES: Tonalidad[] = [
  { id: 'a', nombre: 'azul', semilla: '#3b82f6', anclaForzada: null, retoques: {} },
  { id: 'b', nombre: 'verde', semilla: '#16a34a', anclaForzada: null, retoques: {} },
  { id: 'c', nombre: 'rojo', semilla: '#dc2626', anclaForzada: null, retoques: {} },
];

/** Las claves de la dirección, cortas para que el enlace no sea un muro. */
const CLAVES: Record<keyof Ajustes, string> = {
  pasos: 'n',
  claridadMax: 'lx',
  claridadMin: 'ln',
  cromaCentro: 'cc',
  derivaTono: 'dt',
};

const BOTON =
  'border border-[var(--solido)] bg-[var(--solido)] font-semibold text-[var(--solido-ink)] hover:bg-[color-mix(in_srgb,var(--solido)_86%,#000)]';

interface Props {
  lang: Lang;
}

export default function Paleta({ lang }: Props) {
  const tr = (clave: keyof typeof P) => t(P[clave], lang);

  const [tonalidades, setTonalidades] = useState<Tonalidad[]>(INICIALES);
  const [ajustes, setAjustes] = useState<Ajustes>(AJUSTES_INICIALES);
  const [prefijo, setPrefijo] = useState('');
  const [enlaceLeido, setEnlaceLeido] = useState(false);

  /** Qué casilla está abierta: «idDeTonalidad/nombreDePaso». */
  const [abierta, setAbierta] = useState<string | null>(null);
  const [formato, setFormato] = useState<'oklch' | 'hex'>('oklch');

  // ---------- al llegar ----------

  useEffect(() => {
    const p = leerParams();
    const leidos: Partial<Ajustes> = {};

    for (const [campo, clave] of Object.entries(CLAVES) as [keyof Ajustes, string][]) {
      const crudo = p.get(clave);
      if (crudo === null) continue;
      const n = Number(crudo);
      if (!Number.isFinite(n)) continue;
      const { min, max } = LIMITES[campo];
      leidos[campo] = Math.min(max, Math.max(min, n));
    }
    if (Object.keys(leidos).length) setAjustes((previo) => ({ ...previo, ...leidos }));

    const pre = p.get('p');
    if (pre !== null) setPrefijo(limpiarNombre(pre));

    /*
     * Las tonalidades viajan como «nombre:hex» separadas por comas, y la
     * lectura se sanea entera: el nombre pasa por `limpiarNombre` y el
     * color por `leerColor`. Lo que llega por una dirección acaba dentro
     * de un bloque de CSS que alguien va a pegar en su proyecto.
     */
    const crudas = p.get('t');
    if (crudas) {
      const leidas = crudas
        .split(',')
        .slice(0, 12)
        .map((trozo, i) => {
          const [nombre, hex] = trozo.split(':');
          const color = leerColor(hex ?? '');
          if (!color) return null;
          const leida: Tonalidad = {
            id: `u${i}`,
            nombre: limpiarNombre(nombre ?? '') || `color${i + 1}`,
            semilla: color.hex,
            anclaForzada: null,
            retoques: {},
          };
          return leida;
        })
        .filter((x): x is Tonalidad => x !== null);

      if (leidas.length) setTonalidades(leidas);
    }

    setEnlaceLeido(true);
  }, []);

  useEffect(() => {
    if (!enlaceLeido) return;

    const salida: Record<string, string | null> = {};
    for (const [campo, clave] of Object.entries(CLAVES) as [keyof Ajustes, string][]) {
      salida[clave] = ajustes[campo] === AJUSTES_INICIALES[campo] ? null : String(ajustes[campo]);
    }
    salida.p = prefijo || null;

    const iguales =
      tonalidades.length === INICIALES.length &&
      tonalidades.every((t, i) => t.nombre === INICIALES[i].nombre && t.semilla === INICIALES[i].semilla);
    salida.t = iguales ? null : tonalidades.map((t) => `${t.nombre}:${t.semilla.slice(1)}`).join(',');

    escribirParams(salida);
  }, [enlaceLeido, ajustes, tonalidades, prefijo]);

  // ---------- lo calculado ----------

  const paleta = useMemo(() => {
    const conPrefijo = prefijo
      ? tonalidades.map((t) => ({ ...t, nombre: `${limpiarNombre(prefijo)}-${t.nombre}` }))
      : tonalidades;
    return construirPaleta(conPrefijo, ajustes);
  }, [tonalidades, ajustes, prefijo]);

  const repetidos = useMemo(() => buscarNombresRepetidos(paleta), [paleta]);
  const css = useMemo(() => aCss(paleta, formato), [paleta, formato]);
  const dormidos = useMemo(
    () => tonalidades.flatMap((t) => retoquesDormidos(t, ajustes)),
    [tonalidades, ajustes]
  );

  // ---------- los mandos ----------

  const cambiar = useCallback(<K extends keyof Ajustes>(clave: K, valor: Ajustes[K]) => {
    setAjustes((previo) => ({ ...previo, [clave]: valor }));
  }, []);

  function editar(id: string, cambio: Partial<Tonalidad>) {
    setTonalidades((previas) => previas.map((t) => (t.id === id ? { ...t, ...cambio } : t)));
  }

  /** Sustituye una tonalidad entera por lo que devuelva la función. */
  function conTonalidad(id: string, hacer: (t: Tonalidad) => Tonalidad) {
    setTonalidades((previas) => previas.map((t) => (t.id === id ? hacer(t) : t)));
  }

  function anadir() {
    const n = tonalidades.length + 1;
    setTonalidades((previas) => [
      ...previas,
      {
        id: `n${Date.now()}`,
        nombre: `color${n}`,
        semilla: '#8b5cf6',
        anclaForzada: null,
        retoques: {},
      },
    ]);
  }

  function quitar(id: string) {
    setTonalidades((previas) => previas.filter((t) => t.id !== id));
    setAbierta(null);
  }

  // ---------- el detalle ----------

  const detalle = useMemo(() => {
    if (!abierta) return null;
    const [id, nombre] = abierta.split('/');
    const rampa = paleta.rampas.find((r) => r.tonalidad.id === id);
    const paso = rampa?.pasos.find((p) => p.nombre === nombre);
    return rampa && paso ? { rampa, paso } : null;
  }, [abierta, paleta]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,var(--col-controles))_minmax(0,1fr)] lg:items-start">
      {/* ================= Los mandos ================= */}
      <div className="columna-herramienta gap-4">
        {/* ---------- Las tonalidades ---------- */}
        <fieldset className="tarjeta-control" data-tour="tonalidades">
          <legend className="sr-only">{tr('tonalidades')}</legend>
          <p className="titulo" aria-hidden="true">
            {tr('tonalidades')}
          </p>

          <div className="lista-tonalidades">
            {tonalidades.map((tono) => (
              <div key={tono.id} className="fila-tonalidad">
                <span className="relative size-8 shrink-0">
                  <input
                    type="color"
                    className="muestra-color"
                    value={tono.semilla}
                    aria-label={`${tr('colorSemilla')} ${tono.nombre}`}
                    onChange={(e) => editar(tono.id, { semilla: e.target.value })}
                  />
                </span>

                <Input
                  value={tono.nombre}
                  aria-label={`${tr('nombreTonalidad')} ${tono.nombre}`}
                  onChange={(e) => editar(tono.id, { nombre: limpiarNombre(e.target.value) })}
                  className="min-w-0 font-mono text-[0.8rem]"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => quitar(tono.id)}
                  title={tr('quitar')}
                  aria-label={`${tr('quitar')} ${tono.nombre}`}
                  disabled={tonalidades.length <= 1}
                >
                  <TrashIcon aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>

          <Button size="sm" onClick={anadir} className={`justify-self-start ${BOTON}`}>
            <PlusIcon aria-hidden="true" />
            {tr('anadir')}
          </Button>

          {repetidos.length > 0 && (
            <p className="aviso-paleta">
              <WarningIcon aria-hidden="true" />
              {tr('nombreRepetido')}
            </p>
          )}
        </fieldset>

        {/* ---------- La rampa ---------- */}
        <fieldset className="tarjeta-control" data-tour="rampa">
          <legend className="sr-only">{tr('laRampa')}</legend>
          <p className="titulo" aria-hidden="true">
            {tr('laRampa')}
          </p>

          <div className="filas-ajuste">
            <div className="fila-ajuste">
              <Label htmlFor="pasos">{tr('pasos')}</Label>
              <div className="campo">
                {/* Solo impares: con un número par no hay paso central y
                    la rampa se queda sin «500», que es el nombre que todo
                    el mundo escribe primero. */}
                <select
                  id="pasos"
                  className="select-paleta"
                  value={ajustes.pasos}
                  onChange={(e) => cambiar('pasos', Number(e.target.value))}
                >
                  {[5, 7, 9, 11, 13, 15].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Deslizador
              id="lx"
              etiqueta={tr('claridadMax')}
              valor={Math.round(ajustes.claridadMax * 100)}
              min={LIMITES.claridadMax.min * 100}
              max={LIMITES.claridadMax.max * 100}
              paso={1}
              unidad="%"
              onCambio={(v) => cambiar('claridadMax', v / 100)}
            />
            <Deslizador
              id="ln"
              etiqueta={tr('claridadMin')}
              valor={Math.round(ajustes.claridadMin * 100)}
              min={LIMITES.claridadMin.min * 100}
              max={LIMITES.claridadMin.max * 100}
              paso={1}
              unidad="%"
              onCambio={(v) => cambiar('claridadMin', v / 100)}
            />
            <Deslizador
              id="cc"
              etiqueta={tr('cromaCentro')}
              valor={Math.round(ajustes.cromaCentro * 100)}
              min={0}
              max={200}
              paso={5}
              unidad="%"
              onCambio={(v) => cambiar('cromaCentro', v / 100)}
            />
            <Deslizador
              id="dt"
              etiqueta={tr('derivaTono')}
              valor={ajustes.derivaTono}
              min={LIMITES.derivaTono.min}
              max={LIMITES.derivaTono.max}
              paso={1}
              unidad="°"
              onCambio={(v) => cambiar('derivaTono', v)}
            />
          </div>

          <p className="ayuda-paleta">{tr('derivaAyuda')}</p>
        </fieldset>

        {/* ---------- Los nombres ---------- */}
        <fieldset className="tarjeta-control" data-tour="nombres">
          <legend className="sr-only">{tr('nombres')}</legend>
          <p className="titulo" aria-hidden="true">
            {tr('nombres')}
          </p>

          <div className="filas-ajuste">
            <div className="fila-ajuste">
              <Label htmlFor="prefijo">{tr('prefijo')}</Label>
              <Input
                id="prefijo"
                value={prefijo}
                placeholder="color"
                onChange={(e) => setPrefijo(limpiarNombre(e.target.value))}
                className="font-mono text-[0.8rem]"
              />
            </div>
          </div>

          <p className="ayuda-paleta">{tr('prefijoAyuda')}</p>
        </fieldset>
      </div>

      {/* ================= La paleta ================= */}
      <div className="columna-herramienta gap-5">
        <section className="tarjeta-control" data-tour="cuadricula">
          <p className="titulo" aria-hidden="true">
            {tr('laPaleta')}
          </p>

          <div className="rejilla-paleta" style={{ '--pasos': ajustes.pasos } as React.CSSProperties}>
            {/* La cabecera con los nombres de los pasos. */}
            <span className="esquina" aria-hidden="true" />
            {paleta.rampas[0]?.pasos.map((p) => (
              <span key={p.nombre} className="cabeza-paso" aria-hidden="true">
                {p.nombre}
              </span>
            ))}

            {paleta.rampas.map((rampa) => (
              <Fila
                key={rampa.tonalidad.id}
                nombre={rampa.tonalidad.nombre}
                pasos={rampa.pasos}
                abierta={abierta}
                idTonalidad={rampa.tonalidad.id}
                etiquetaVer={tr('verDetalle')}
                onAbrir={setAbierta}
              />
            ))}
          </div>
        </section>

        {detalle && (
          <Detalle
            paso={detalle.paso}
            esDeformada={detalle.rampa.escaleraDeformada}
            lang={lang}
            onCerrar={() => setAbierta(null)}
            onRetocar={(hex) => conTonalidad(detalle.rampa.tonalidad.id, (t) => aplicarRetoque(t, detalle.paso.nombre, hex))}
            onDevolver={() => conTonalidad(detalle.rampa.tonalidad.id, (t) => soltarRetoque(t, detalle.paso.nombre))}
            onAnclar={() =>
              editar(detalle.rampa.tonalidad.id, { anclaForzada: detalle.paso.indice })
            }
            onSoltarAncla={() => editar(detalle.rampa.tonalidad.id, { anclaForzada: null })}
            forzada={
              tonalidades.find((t) => t.id === detalle.rampa.tonalidad.id)?.anclaForzada !== null
            }
          />
        )}

        {/* ---------- Lo que conviene saber ---------- */}
        <section className="tarjeta-control" data-tour="avisos">
          <p className="titulo" aria-hidden="true">
            {tr('avisos')}
          </p>

          {paleta.rampas.some((r) => r.escaleraDeformada) && (
            <p className="aviso-paleta">
              <WarningIcon aria-hidden="true" />
              {tr('escaleraDeformada')}
            </p>
          )}
          {dormidos.length > 0 && (
            <p className="aviso-paleta">
              <WarningIcon aria-hidden="true" />
              {tr('retoquesDormidos')}
            </p>
          )}
          <p className="ayuda-paleta">{tr('soloSrgb')}</p>
        </section>

        {/* ---------- El CSS ---------- */}
        <details className="acordeon" data-tour="css">
          <summary>
            <span className="flex-1">{tr('cssTitulo')}</span>
            <BotonCopiar
              texto={() => css}
              etiqueta={tr('copiarCss')}
              etiquetaCopiado={tr('copiado')}
              onAntes={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          </summary>
          <div className="cuerpo">
            <p className="intro">{tr('cssIntro')}</p>

            <div className="segmento" role="group" aria-label={tr('cssTitulo')}>
              {(['oklch', 'hex'] as const).map((f) => (
                <label key={f}>
                  <input
                    type="radio"
                    name="formato-css"
                    checked={formato === f}
                    onChange={() => setFormato(f)}
                  />
                  <span>{f === 'oklch' ? tr('formatoOklch') : tr('formatoHex')}</span>
                </label>
              ))}
            </div>

            <pre className="overflow-x-auto rounded-lg border border-line bg-surface-2 p-4 font-mono text-[0.78rem] leading-relaxed text-ink">
              <code>{css}</code>
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- auxiliares

/** Una fila de la cuadrícula: el nombre de la tonalidad y sus casillas. */
function Fila({
  nombre,
  pasos,
  abierta,
  idTonalidad,
  etiquetaVer,
  onAbrir,
}: {
  nombre: string;
  pasos: Paso[];
  abierta: string | null;
  idTonalidad: string;
  etiquetaVer: string;
  onAbrir: (clave: string | null) => void;
}) {
  return (
    <>
      <span className="nombre-fila">{nombre}</span>
      {pasos.map((paso) => {
        const clave = `${idTonalidad}/${paso.nombre}`;
        const m = medirPaso(paso.hex, TEXTO);
        const sinTinta = !m.conBlanco.wcag.pasaAA && !m.conNegro.wcag.pasaAA;

        return (
          <button
            key={paso.nombre}
            type="button"
            className={`casilla-paleta${abierta === clave ? ' abierta' : ''}`}
            style={{ background: paso.hex }}
            aria-pressed={abierta === clave}
            aria-label={`${etiquetaVer} ${nombre} ${paso.nombre}, ${paso.hex}`}
            onClick={() => onAbrir(abierta === clave ? null : clave)}
          >
            {/* Las marcas van en el color que sí se lee sobre la casilla,
                que es justo el dato que la casilla está enseñando. */}
            <span
              className="marcas"
              style={{ color: m.conBlanco.wcag.pasaAA ? '#ffffff' : '#000000' }}
            >
              {paso.ancla && <span className="punto-ancla" />}
              {paso.tocado && <span className="punto-tocado" />}
              {sinTinta && <span className="punto-sin-tinta" />}
            </span>
          </button>
        );
      })}
    </>
  );
}

/** El panel de detalle de un paso. */
function Detalle({
  paso,
  esDeformada,
  lang,
  onCerrar,
  onRetocar,
  onDevolver,
  onAnclar,
  onSoltarAncla,
  forzada,
}: {
  paso: Paso;
  esDeformada: boolean;
  lang: Lang;
  onCerrar: () => void;
  onRetocar: (hex: string) => void;
  onDevolver: () => void;
  onAnclar: () => void;
  onSoltarAncla: () => void;
  forzada: boolean;
}) {
  const tr = (clave: keyof typeof P) => t(P[clave], lang);
  const m = medirPaso(paso.hex, TEXTO);

  const veredicto = (r: { razon: number; pasaAA: boolean; pasaAAA: boolean }, lc: number) =>
    `${r.razon.toFixed(2)}:1 · AA ${r.pasaAA ? '✓' : '✗'} · AAA ${r.pasaAAA ? '✓' : '✗'} · Lc ${Math.round(lc)}`;

  return (
    <section className="detalle-paso" data-tour="detalle">
      <header>
        <span className="muestra-detalle" style={{ background: paso.hex }} aria-hidden="true" />
        <div className="min-w-0">
          <p className="variable">{paso.variable}</p>
          <p className="valores">
            {paso.hex} · {aOklchCss(paso)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCerrar} className="ml-auto">
          {tr('cerrar')}
        </Button>
      </header>

      <dl className="veredictos">
        <dt>{tr('conBlanco')}</dt>
        <dd>{veredicto(m.conBlanco.wcag, m.conBlanco.apca.lc)}</dd>
        <dt>{tr('conNegro')}</dt>
        <dd>{veredicto(m.conNegro.wcag, m.conNegro.apca.lc)}</dd>
      </dl>

      {paso.ancla && <p className="ayuda-paleta">{tr('anclaExplicado')}</p>}
      {paso.recortado && <p className="ayuda-paleta">{tr('recortadoExplicado')}</p>}
      {!m.conBlanco.wcag.pasaAA && !m.conNegro.wcag.pasaAA && (
        <p className="ayuda-paleta">{tr('sinTintaExplicado')}</p>
      )}
      {esDeformada && (
        <p className="aviso-paleta">
          <WarningIcon aria-hidden="true" />
          {tr('escaleraDeformada')}
        </p>
      )}

      <div className="acciones-detalle">
        {/* Un cuadrado de color suelto no dice qué hace. La etiqueta va
            al lado y el `aria-label` sigue en el campo. */}
        <span className="etiqueta-retoque">{tr('retocar')}</span>
        <span className="relative size-8 shrink-0">
          <input
            type="color"
            className="muestra-color"
            value={paso.hex}
            aria-label={tr('retocar')}
            onChange={(e) => onRetocar(e.target.value)}
          />
        </span>

        {paso.tocado && (
          <Button variant="outline" size="sm" onClick={onDevolver}>
            {tr('devolver')}
          </Button>
        )}

        {!paso.ancla && (
          <Button variant="outline" size="sm" onClick={onAnclar}>
            {tr('anclarAqui')}
          </Button>
        )}
        {paso.ancla && forzada && (
          <Button variant="outline" size="sm" onClick={onSoltarAncla}>
            {tr('soltarAncla')}
          </Button>
        )}

        <BotonCopiar texto={paso.hex} etiqueta={tr('copiarHex')} etiquetaCopiado={tr('copiado')} />
      </div>
    </section>
  );
}

/** Una barra con su número al lado. */
function Deslizador({
  id,
  etiqueta,
  valor,
  min,
  max,
  paso,
  unidad,
  onCambio,
}: {
  id: string;
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  paso: number;
  unidad: string;
  onCambio: (valor: number) => void;
}) {
  return (
    <div className="fila-deslizador">
      <Label htmlFor={id}>{etiqueta}</Label>
      <span className="valor" aria-hidden="true">
        {valor}
        {unidad}
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={(e) => onCambio(Number(e.target.value))}
      />
    </div>
  );
}
