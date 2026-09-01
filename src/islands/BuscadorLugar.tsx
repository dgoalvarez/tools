/**
 * El buscador de lugares: ciudades, estados y departamentos, países y
 * códigos postales de Estados Unidos.
 *
 * Decide solo qué archivo de datos necesita: cinco dígitos son un código
 * postal y cualquier otra cosa es un nombre. Quien busque por nombre no
 * descarga nunca la tabla de códigos postales, y al revés.
 *
 * ---------------------------------------------------------------------
 * Por qué cada sugerencia enseña la hora que es allí
 *
 * Antes enseñaba el identificador de la zona —«New York», «Chicago»—, que
 * es dato interno y no contesta a nada. La hora sí contesta, y contesta a
 * dos cosas a la vez:
 *
 *   · a lo que muchas veces se venía a preguntar, que es qué hora es allí
 *     ahora mismo, sin llegar a añadir el sitio;
 *   · a cuál de los dos elegir cuando un sitio está partido. Arizona sale
 *     dos veces con dos nombres casi iguales —«hora estándar de las
 *     Montañas Rocosas» y «hora de las Montañas Rocosas»—, y en verano una
 *     marca las 15:00 y la otra las 16:00. Leer la hora resuelve en un
 *     segundo lo que leer el nombre no resuelve.
 */
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Lang } from '@/i18n/config';
import {
  buscarLugares,
  nombreDePais,
  nombreGenericoDeZona,
  zonaDeZip,
  type Coincidencia,
  type DatosLugares,
  type DatosZips,
} from '@/lib/timezones';

/** La hora que es ahora mismo en una zona, al minuto. */
function horaAhora(zona: string, lang: string): string {
  try {
    return new Intl.DateTimeFormat(lang, {
      timeZone: zona,
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date());
  } catch {
    return '';
  }
}

export interface TextosBuscador {
  etiqueta: string;
  ayuda: string;
  cargando: string;
  sinResultados: string;
  zipDesconocido: string;
}

interface Props {
  id: string;
  lang: Lang;
  textos: TextosBuscador;
  pedirLugares: () => Promise<DatosLugares>;
  pedirZips: () => Promise<DatosZips>;
  onElegir: (coincidencia: Coincidencia) => void;
}

export default function BuscadorLugar({
  id,
  lang,
  textos,
  pedirLugares,
  pedirZips,
  onElegir,
}: Props) {
  const [consulta, setConsulta] = useState('');
  const [sugerencias, setSugerencias] = useState<Coincidencia[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const texto = consulta.trim();
    setAviso(null);

    if (texto.length < 2) {
      setSugerencias([]);
      setBuscando(false);
      return;
    }

    let cancelado = false;
    setBuscando(true);

    // Un respiro antes de buscar: mientras se teclea «medellín» no hace
    // falta rehacer la búsqueda ocho veces.
    const temporizador = setTimeout(async () => {
      try {
        if (/^\d{5}$/.test(texto)) {
          const datos = await pedirZips();
          if (cancelado) return;
          const zona = zonaDeZip(datos, texto);
          // El código postal no tiene nombre, así que se enseña con el
          // del huso al que pertenece: «33101 · hora oriental». Antes iba
          // con el identificador de la zona, que no dice nada a nadie.
          const matiz = zona ? nombreGenericoDeZona(zona, lang) : '';
          setSugerencias(
            zona
              ? [
                  {
                    ciudad: texto,
                    region: '',
                    pais: 'US',
                    zona,
                    tipo: 'ciudad',
                    matiz,
                    etiqueta: matiz ? `${texto} (${matiz})` : texto,
                  },
                ]
              : []
          );
          if (!zona) setAviso(textos.zipDesconocido);
        } else if (/^\d+$/.test(texto)) {
          // Dígitos sueltos que aún no son un código postal completo: se
          // espera a que termine de escribirlos en vez de decirle que no
          // existe nada.
          setSugerencias([]);
        } else {
          const datos = await pedirLugares();
          if (cancelado) return;
          const encontradas = buscarLugares(datos, texto, lang);
          setSugerencias(encontradas);
          if (encontradas.length === 0) setAviso(textos.sinResultados);
        }
      } finally {
        if (!cancelado) setBuscando(false);
      }
    }, 180);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [consulta, lang, pedirLugares, pedirZips, textos.sinResultados, textos.zipDesconocido]);

  function elegir(coincidencia: Coincidencia) {
    onElegir(coincidencia);
    setConsulta('');
    setSugerencias([]);
    setAviso(null);
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{textos.etiqueta}</Label>
      <Input
        id={id}
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        placeholder="Miami · 33101"
      />
      {/* La línea de ayuda solo aparece si hay algo que decir. El origen
          va dentro de un acordeón y repetir ahí la misma indicación que en
          el buscador de destinos sería decir dos veces lo mismo. */}
      {(buscando || aviso || textos.ayuda) && (
        <p
          className={
            aviso
              ? 'text-[length:var(--fs-small)] text-[var(--danger)]'
              : 'text-[length:var(--fs-small)] text-ink-soft'
          }
        >
          {buscando ? textos.cargando : (aviso ?? textos.ayuda)}
        </p>
      )}

      {sugerencias.length > 0 && (
        <ul className="grid gap-1 rounded-lg border border-line bg-surface p-1.5">
          {sugerencias.map((s) => (
            <li key={`${s.etiqueta}-${s.zona}`}>
              {/* Dos renglones y no uno: «Santo Domingo de los Colorados,
                  Santo Domingo» en una sola línea desbordaba la lista, y
                  truncarlo escondía justo la región, que es lo que
                  distingue una ciudad de su homónima. */}
              <button
                type="button"
                onClick={() => elegir(s)}
                className="grid w-full gap-0.5 rounded-md px-2.5 py-2 text-left text-[length:var(--fs-small)] hover:bg-surface-2"
              >
                <span className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{s.ciudad}</span>
                  <span className="shrink-0 font-mono text-[0.75rem] text-ink-muted tabular-nums">
                    {horaAhora(s.zona, lang)}
                  </span>
                </span>
                <span className="truncate text-[0.72rem] text-ink-soft">
                  {[s.matiz, s.region, s.tipo === 'pais' ? '' : nombreDePais(s.pais, lang)]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
