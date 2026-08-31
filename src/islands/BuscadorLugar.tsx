/**
 * El buscador de lugares que usa la herramienta de husos horarios, tanto
 * para el origen de la cita como para cada destino.
 *
 * Decide solo qué archivo de datos necesita: cinco dígitos son un código
 * postal de Estados Unidos y cualquier otra cosa es el nombre de una
 * ciudad. Quien busque por ciudad no descarga nunca la tabla de códigos
 * postales, y al revés.
 */
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Lang } from '@/i18n/config';
import {
  buscarCiudades,
  nombreDePais,
  nombreDeZona,
  zonaDeZip,
  type Coincidencia,
  type DatosCiudades,
  type DatosZips,
} from '@/lib/timezones';

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
  pedirCiudades: () => Promise<DatosCiudades>;
  pedirZips: () => Promise<DatosZips>;
  onElegir: (coincidencia: Coincidencia) => void;
}

export default function BuscadorLugar({
  id,
  lang,
  textos,
  pedirCiudades,
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
          setSugerencias(
            zona
              ? [
                  {
                    ciudad: texto,
                    region: nombreDeZona(zona),
                    pais: 'US',
                    zona,
                    etiqueta: `${texto} · ${nombreDeZona(zona)}`,
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
          const datos = await pedirCiudades();
          if (cancelado) return;
          const encontradas = buscarCiudades(datos, texto, lang);
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
  }, [consulta, lang, pedirCiudades, pedirZips, textos.sinResultados, textos.zipDesconocido]);

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
                  <span className="shrink-0 font-mono text-[0.7rem] text-ink-soft">
                    {nombreDeZona(s.zona)}
                  </span>
                </span>
                <span className="truncate text-[0.72rem] text-ink-soft">
                  {[s.region, nombreDePais(s.pais, lang)].filter(Boolean).join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
