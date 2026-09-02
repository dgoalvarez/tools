/**
 * La libreta de la sesión: una lista con casillas y una nota.
 *
 * ---------------------------------------------------------------------
 * Dónde vive lo que se escribe
 *
 * En `sessionStorage`, que es la memoria que el navegador le reserva a
 * ESTA pestaña. No es un capricho técnico, es la herramienta entera:
 *
 *   · sobrevive a una recarga y a un despiste;
 *   · sobrevive a irse al pomodoro y volver, porque el enrutador del
 *     cliente no recarga la pestaña;
 *   · muere al cerrarla;
 *   · no sale del aparato: sin servidor, sin cookie, sin petición.
 *
 * En la dirección no cabía —cada casilla marcada sería una entrada del
 * historial— y no guardar nada tampoco servía: perder la lista por un F5
 * escuece de una forma que perder una paleta no.
 *
 * ---------------------------------------------------------------------
 * Dos detalles que no son adorno
 *
 * **No se guarda hasta haber leído.** El primer pintado es la libreta
 * vacía, y sin el cerrojo de `listo` ese vacío se escribiría encima de lo
 * que había guardado antes de llegar a leerlo. Es la forma más tonta de
 * perderlo todo, y solo pasa la primera vez, que es cuando no se ve.
 *
 * **Las tarjetas tienen alto mínimo.** El HTML sale del servidor vacío y
 * esto lo rellena al hidratarse: sin un alto reservado, restaurar doce
 * líneas empujaría la página hacia abajo en cada carga — el mismo tirón
 * que se quitó de la navegación. Lo comprueba `npm run navegar`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, XIcon } from '@phosphor-icons/react';

import BotonCopiar from '../components/BotonCopiar';
import Dibujo from './Dibujo';
import NotaConFormato from './NotaConFormato';
import { Button } from '@/components/ui/button';
import { NOTAS } from '../i18n/notas';
import { t, type Lang } from '../i18n/config';
import {
  CLAVE,
  VACIO,
  aMarkdown,
  anadir,
  borrar,
  borrarHechas,
  cuantasHechas,
  escribir,
  guardar,
  leer,
  marcar,
  mover,
  notaAMarkdown,
  textoDeNota,
  type Cuaderno,
} from '../lib/notas';

interface Props {
  lang: Lang;
}

/** Lo que se espera antes de guardar, en milisegundos. */
const ESPERA = 250;

export default function Notas({ lang }: Props) {
  const [cuaderno, setCuaderno] = useState<Cuaderno>(VACIO);
  const [listo, setListo] = useState(false);
  const [borrador, setBorrador] = useState('');

  const campoNuevo = useRef<HTMLInputElement>(null);

  // ---------- Leer lo que hubiera ----------
  useEffect(() => {
    try {
      setCuaderno(leer(sessionStorage.getItem(CLAVE)));
    } catch {
      // Almacenamiento bloqueado: se empieza en blanco y se sigue
      // trabajando. Lo único que se pierde es sobrevivir a la recarga.
    }
    setListo(true);
  }, []);

  // ---------- Guardarlo ----------
  /*
    Con una espera corta: cada tecla de la nota es un `JSON.stringify` y
    un `setItem` de todo lo escrito, y en una nota larga eso se nota al
    escribir. Se apunta lo último y se guarda cuando la mano para.

    `pagehide` lo fuerza antes de que la pestaña se vaya: si no, la última
    frase escrita no llegaría a una recarga inmediata.
  */
  const pendiente = useRef<Cuaderno | null>(null);

  const volcar = useCallback(() => {
    const c = pendiente.current;
    if (!c) return;
    pendiente.current = null;
    try {
      sessionStorage.setItem(CLAVE, guardar(c));
    } catch {
      // Cuota llena o almacenamiento bloqueado: lo escrito sigue en
      // pantalla, solo que no sobrevivirá a la recarga.
    }
  }, []);

  useEffect(() => {
    if (!listo) return;
    pendiente.current = cuaderno;
    const t = setTimeout(volcar, ESPERA);
    return () => clearTimeout(t);
  }, [cuaderno, listo, volcar]);

  useEffect(() => {
    window.addEventListener('pagehide', volcar);
    return () => window.removeEventListener('pagehide', volcar);
  }, [volcar]);

  // ---------- Lo que hace cada control ----------
  const tareas = cuaderno.tareas;
  const hechas = cuantasHechas(tareas);

  function conTareas(siguientes: typeof tareas) {
    setCuaderno((c) => ({ ...c, tareas: siguientes }));
  }

  function alAnadir(evento: React.FormEvent) {
    evento.preventDefault();
    conTareas(anadir(tareas, borrador));
    setBorrador('');
    // El foco no se mueve: se escriben cinco cosas seguidas sin tocar el
    // ratón, que es como se usa esto de verdad.
    campoNuevo.current?.focus();
  }

  const contador = t(NOTAS.contador, lang)
    .replace('{a}', String(hechas))
    .replace('{b}', String(tareas.length));

  // Palabras y no caracteres: es la unidad en la que la gente piensa
  // cuando escribe. Y llena el hueco que el pie tiene reservado.
  // Se cuenta el texto pelado, no el HTML: con etiquetas dentro, «<b>hola</b>»
  // habrían sido tres palabras.
  const textoNota = textoDeNota(cuaderno.nota);
  const palabras = textoNota ? textoNota.split(/\s+/).length : 0;
  const recuento =
    palabras === 1
      ? t(NOTAS.unaPalabra, lang)
      : t(NOTAS.palabras, lang).replace('{n}', String(palabras));

  return (
    <div className="libreta">
      {/* ---------------------------------------------- la lista ---- */}
      <section className="tarjeta-control" aria-labelledby="titulo-lista">
        <p className="titulo" id="titulo-lista">
          {t(NOTAS.laLista, lang)}
        </p>

        <form className="fila-nueva" onSubmit={alAnadir} data-tour="anadir">
          <input
            ref={campoNuevo}
            type="text"
            className="campo-nuevo"
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            placeholder={t(NOTAS.anadir, lang)}
            aria-label={t(NOTAS.anadir, lang)}
            autoComplete="off"
          />
          <Button type="submit" size="sm" variant="outline">
            {t(NOTAS.anadirBoton, lang)}
          </Button>
        </form>

        <div className="lista-cuerpo">
          {tareas.length === 0 ? (
            <p className="lista-vacia">{t(NOTAS.listaVacia, lang)}</p>
          ) : (
            <ul className="lista-tareas">
              {tareas.map((tarea, i) => (
                <li key={tarea.id} className="fila-tarea" data-tour={i === 0 ? 'linea' : undefined}>
                  <input
                    type="checkbox"
                    className="casilla"
                    checked={tarea.hecha}
                    onChange={(e) => conTareas(marcar(tareas, tarea.id, e.target.checked))}
                    aria-label={tarea.texto || t(NOTAS.tarea, lang)}
                  />

                  {/*
                    Editable en su sitio y no con un botón de editar: una
                    tarea se corrige mucho más de lo que se crea, y meter
                    un paso entre «lo veo mal» y «lo arreglo» hace que se
                    quede mal.
                  */}
                  <input
                    type="text"
                    className={`texto-tarea${tarea.hecha ? ' hecha' : ''}`}
                    value={tarea.texto}
                    onChange={(e) => conTareas(escribir(tareas, tarea.id, e.target.value))}
                    aria-label={t(NOTAS.tarea, lang)}
                  />

                  {/*
                    Se reordena con dos botones y no arrastrando.
                    Arrastrar sin alternativa de teclado deja fuera a quien
                    no usa ratón, y una lista de tareas es justo donde eso
                    importa. Los extremos se deshabilitan en vez de
                    esconderse, para que las filas no cambien de forma.
                  */}
                  <div className="acciones-tarea">
                    <button
                      type="button"
                      onClick={() => conTareas(mover(tareas, tarea.id, -1))}
                      disabled={i === 0}
                      aria-label={`${t(NOTAS.subir, lang)}: ${tarea.texto}`}
                    >
                      <ArrowUpIcon aria-hidden="true" size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => conTareas(mover(tareas, tarea.id, 1))}
                      disabled={i === tareas.length - 1}
                      aria-label={`${t(NOTAS.bajar, lang)}: ${tarea.texto}`}
                    >
                      <ArrowDownIcon aria-hidden="true" size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => conTareas(borrar(tareas, tarea.id))}
                      aria-label={`${t(NOTAS.borrar, lang)}: ${tarea.texto}`}
                    >
                      <XIcon aria-hidden="true" size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="pie-lista" data-tour="salida">
          <p className="contador">{contador}</p>

          <div className="mandos-pie">
            {hechas > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => conTareas(borrarHechas(tareas))}
              >
                {t(NOTAS.borrarHechas, lang)}
              </Button>
            )}

            {tareas.length > 0 && (
              <BotonCopiar
                texto={() => aMarkdown(tareas)}
                etiqueta={t(NOTAS.copiarLista, lang)}
                etiquetaCopiado={t(NOTAS.copiado, lang)}
              />
            )}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- la nota ---- */}
      <section className="tarjeta-control" aria-labelledby="titulo-nota" data-tour="nota">
        <p className="titulo" id="titulo-nota">
          {t(NOTAS.laNota, lang)}
        </p>

        <NotaConFormato
          valor={cuaderno.nota}
          textos={{
            negrita: t(NOTAS.negrita, lang),
            cursiva: t(NOTAS.cursiva, lang),
            subrayado: t(NOTAS.subrayado, lang),
            tachado: t(NOTAS.tachado, lang),
            vinetas: t(NOTAS.vinetas, lang),
            numeros: t(NOTAS.numeros, lang),
            vacia: t(NOTAS.notaVacia, lang),
            etiqueta: t(NOTAS.laNota, lang),
          }}
          onCambio={(html) => setCuaderno((c) => ({ ...c, nota: html }))}
        />

        <div className="pie-lista">
          <p className="contador">{recuento}</p>

          {/* Se copia en Markdown y no el HTML crudo: lo que se pega fuera
              tiene que leerse, no traer etiquetas. El subrayado se pierde
              por el camino porque Markdown no lo tiene — ver
              `notaAMarkdown`. */}
          {textoDeNota(cuaderno.nota).length > 0 && (
            <BotonCopiar
              texto={() => notaAMarkdown(cuaderno.nota)}
              etiqueta={t(NOTAS.copiarNota, lang)}
              etiquetaCopiado={t(NOTAS.copiado, lang)}
            />
          )}
        </div>
      </section>

      {/* ---------------------------------------------- el dibujo ---- */}
      <Dibujo
        textos={{
          etiqueta: t(NOTAS.elDibujo, lang),
          deshacer: t(NOTAS.deshacerTrazo, lang),
          borrar: t(NOTAS.borrarDibujo, lang),
          descargar: t(NOTAS.descargarDibujo, lang),
          vacio: t(NOTAS.dibujoVacio, lang),
          efimero: t(NOTAS.dibujoEfimero, lang),
          tinta: t(NOTAS.tinta, lang),
          grosor: t(NOTAS.grosor, lang),
        }}
      />
    </div>
  );
}
