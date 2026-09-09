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
import {
  ArrowCounterClockwiseIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  DotsSixVerticalIcon,
  EraserIcon,
  XIcon,
} from '@phosphor-icons/react';

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
  moverA,
  notaAMarkdown,
  restaurar,
  retiradas,
  textoDeNota,
  type Cuaderno,
  type Retirada,
  type Tarea,
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

  /*
    Lo que se llevó el último borrado, para poder devolverlo.

    Es lo ÚNICO que se puede deshacer, y a propósito: añadir, marcar,
    mover y escribir se rehacen a mano en un segundo, así que un deshacer
    que los cubriera todos estaría casi siempre encendido y no diría nada.
    Sale solo cuando de verdad se ha perdido algo.
  */
  const [borradas, setBorradas] = useState<Retirada[]>([]);

  /*
    El navegador no deja guardar.

    Pasa en una ventana privada y con la cuota llena. La excepción se
    tragaba en silencio, y lo grave no es perder lo escrito: es que el
    encabezado sigue prometiendo que se queda mientras la pestaña siga
    abierta. Una promesa que se rompe sin avisar es peor que no haberla
    hecho.
  */
  const [sinGuardar, setSinGuardar] = useState(false);

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
      // pantalla, solo que no sobrevivirá a la recarga. Y eso hay que
      // decirlo, porque el encabezado promete lo contrario.
      setSinGuardar(true);
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

  /** Como `conTareas`, pero apuntando lo que se lleva por delante. */
  function borrando(siguientes: typeof tareas) {
    setBorradas(retiradas(tareas, siguientes));
    conTareas(siguientes);
  }

  function alDeshacer() {
    conTareas(restaurar(tareas, borradas));
    setBorradas([]);
    campoNuevo.current?.focus();
  }

  /*
    Arrastrar para reordenar, ADEMÁS de las flechas.

    Las flechas se quedan y no son un resto: arrastrar sin alternativa de
    teclado deja fuera a quien no usa ratón, y una lista de tareas es
    justo donde eso importa. Lo de aquí es la vía cómoda, no la única.

    Va a mano, con eventos de puntero, y no con una librería. `@dnd-kit`
    son unos 12 KB comprimidos y se pagan sobre todo por su sensor de
    teclado, que aquí ya está resuelto con las flechas; las filas son de
    alto uniforme, así que saber dónde caería la línea es una división.

    Se agarra por el asa y no por la fila entera: la fila lleva dentro un
    campo de texto, y arrastrar desde él sería imposible sin romper
    seleccionar palabras con el ratón.
  */
  /*
    Dónde va a caer se lleva en la REF y también en el estado, y no es
    duplicar por gusto.

    El estado es para pintar la raya del destino; la ref es la que manda
    al soltar. React confirma los cambios de estado cuando le viene bien,
    no en el mismo suspiro: leyendo el estado, un arrastre rápido suelta
    con el valor de ANTES del último movimiento y la línea se queda donde
    estaba. Se midió con una sonda —seis movimientos, «aDonde=0», la
    lista sin tocar— y es la misma trampa que ya está apuntada en el
    lienzo para el trazo en curso.
  */
  const arrastrando = useRef<{
    id: string;
    alto: number;
    y0: number;
    desde: number;
    hasta: number;
  } | null>(null);
  const [aDonde, setADonde] = useState<number | null>(null);

  function empezarArrastre(evento: React.PointerEvent, tarea: Tarea, indice: number) {
    const fila = (evento.currentTarget as HTMLElement).closest('li');
    if (!fila) return;
    evento.currentTarget.setPointerCapture?.(evento.pointerId);
    arrastrando.current = {
      id: tarea.id,
      // El alto de una fila incluye el hueco que la separa de la
      // siguiente: sin sumarlo, la cuenta se desvía una fila cada seis.
      alto: fila.getBoundingClientRect().height + 2,
      y0: evento.clientY,
      desde: indice,
      hasta: indice,
    };
    setADonde(indice);
  }

  function seguirArrastre(evento: React.PointerEvent) {
    const a = arrastrando.current;
    if (!a) return;
    const saltos = Math.round((evento.clientY - a.y0) / a.alto);
    a.hasta = Math.min(Math.max(a.desde + saltos, 0), tareas.length - 1);
    setADonde(a.hasta);
  }

  function soltarArrastre() {
    const a = arrastrando.current;
    arrastrando.current = null;
    setADonde(null);
    if (a && a.hasta !== a.desde) conTareas(moverA(tareas, a.id, a.hasta));
  }

  const cuantasVuelven =
    borradas.length === 1
      ? t(NOTAS.unaLinea, lang)
      : t(NOTAS.variasLineas, lang).replace('{n}', String(borradas.length));

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
      {/*
        Va arriba del todo y ocupa la fila entera, porque no es de la
        lista ni de la nota: es de las tres. Y `role="status"` para que
        quien no lo vea se entere, sin robar el foco a quien está
        escribiendo — que es exactamente cuando esto puede aparecer.
      */}
      {sinGuardar && (
        <p className="aviso-sin-guardar" role="status">
          {t(NOTAS.sinGuardar, lang)}
        </p>
      )}

      {/* ---------------------------------------------- la lista ---- */}
      <section className="tarjeta-control tarjeta-lista" aria-labelledby="titulo-lista">
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
                <li
                  key={tarea.id}
                  className="fila-tarea"
                  data-tour={i === 0 ? 'linea' : undefined}
                  data-arrastrada={arrastrando.current?.id === tarea.id || undefined}
                  data-hueco={(aDonde === i && arrastrando.current?.id !== tarea.id) || undefined}
                >
                  {/*
                    El asa, y no la fila entera.

                    La fila lleva dentro un campo de texto: arrastrando
                    desde ella no se podría seleccionar una palabra con el
                    ratón, que es lo que se hace todo el rato para
                    corregir. El asa es la única parte que no tiene otro
                    oficio.
                  */}
                  <span
                    className="asa-tarea"
                    aria-hidden="true"
                    onPointerDown={(e) => empezarArrastre(e, tarea, i)}
                    onPointerMove={seguirArrastre}
                    onPointerUp={soltarArrastre}
                    onPointerCancel={soltarArrastre}
                  >
                    <DotsSixVerticalIcon size={14} />
                  </span>

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
                      onClick={() => borrando(borrar(tareas, tarea.id))}
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
            {/*
              Deshacer va PRIMERO, y pegado al que acaba de borrar.

              Quien acaba de pulsar «Borrar las hechas» sin querer tiene el
              puntero justo ahí, y lo que busca está al lado. Ponerlo al
              final de la fila —detrás de «Copiar la lista»— habría sido
              ordenarlo por importancia general en vez de por lo que acaba
              de pasar.
            */}
            {borradas.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={alDeshacer}
                aria-label={t(NOTAS.deshacerBorradoDetalle, lang).replace('{n}', cuantasVuelven)}
              >
                <ArrowCounterClockwiseIcon aria-hidden="true" size={15} />
                {t(NOTAS.deshacerBorrado, lang)}
              </Button>
            )}

            {hechas > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => borrando(borrarHechas(tareas))}
              >
                {t(NOTAS.borrarHechas, lang)}
              </Button>
            )}

            {/*
              Vaciar la lista entera, de un clic y sin preguntar.

              Sin confirmación a propósito: pasa por el mismo camino que
              los otros dos borrados, así que «Deshacer» aparece al lado y
              devuelve las líneas a su sitio. Un diálogo de «¿seguro?» que
              hay que contestar cada vez protege peor que un botón que
              deshace, y encima entrena a darle a «sí» sin leer.

              Solo icono: con «Borrar las hechas» y «Copiar la lista»
              escritos, la fila no aguanta un tercer rótulo a 485 px.
            */}
            {tareas.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={t(NOTAS.limpiarLista, lang)}
                title={t(NOTAS.limpiarLista, lang)}
                onClick={() => borrando([])}
              >
                <EraserIcon aria-hidden="true" />
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
      <section
        className="tarjeta-control tarjeta-nota"
        aria-labelledby="titulo-nota"
        data-tour="nota"
      >
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
        lang={lang}
        textos={{
          etiqueta: t(NOTAS.elDibujo, lang),
          deshacer: t(NOTAS.deshacerTrazo, lang),
          borrar: t(NOTAS.borrarDibujo, lang),
          descargar: t(NOTAS.descargarDibujo, lang),
          vacio: t(NOTAS.dibujoVacio, lang),
          efimero: `${t(NOTAS.dibujoEfimero, lang)} ${t(NOTAS.dibujoPng, lang)}`,
          tinta: t(NOTAS.tinta, lang),
          tintaLibre: t(NOTAS.tintaLibre, lang),
          grosor: t(NOTAS.grosor, lang),
          rehacer: t(NOTAS.rehacerTrazo, lang),
          proporcion: t(NOTAS.proporcion, lang),
          cenido: t(NOTAS.cenido, lang),
          lapiz: t(NOTAS.lapiz, lang),
          bote: t(NOTAS.bote, lang),
        }}
      />
    </div>
  );
}
