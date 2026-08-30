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
import { Plus } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  buscarCiudades,
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
  textos: TextosBuscador;
  pedirCiudades: () => Promise<DatosCiudades>;
  pedirZips: () => Promise<DatosZips>;
  onElegir: (coincidencia: Coincidencia) => void;
}

export default function BuscadorLugar({
  id,
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
            zona ? [{ etiqueta: `${texto} · ${nombreDeZona(zona)}`, zona, pais: 'US' }] : []
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
          const encontradas = buscarCiudades(datos, texto);
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
  }, [consulta, pedirCiudades, pedirZips, textos.sinResultados, textos.zipDesconocido]);

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
      <p className="text-[var(--fs-small)] text-ink-soft">
        {buscando ? textos.cargando : (aviso ?? textos.ayuda)}
      </p>

      {sugerencias.length > 0 && (
        <ul className="grid gap-1 rounded-lg border border-line bg-surface p-1.5">
          {sugerencias.map((s) => (
            <li key={`${s.etiqueta}-${s.zona}`}>
              <button
                type="button"
                onClick={() => elegir(s)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[var(--fs-small)] hover:bg-surface-2"
              >
                <Plus aria-hidden="true" className="size-3.5 shrink-0 text-ink-soft" />
                <span className="min-w-0 flex-1 truncate text-ink">{s.etiqueta}</span>
                <span className="shrink-0 font-mono text-[0.7rem] text-ink-soft">
                  {nombreDeZona(s.zona)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
