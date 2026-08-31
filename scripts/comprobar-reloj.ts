/**
 * Comprobación de la aritmética del reloj. Se ejecuta a mano.
 *
 * Lo que hay que demostrar aquí son tres cosas que a mano no se prueban:
 * que una alarma puesta a una hora que ya pasó suena MAÑANA y no dentro
 * de un rato; que las vueltas del cronómetro se derivan de sus marcas y
 * no se acumulan; y que los dos formatos de tiempo redondean en sentidos
 * contrarios, que es a propósito.
 */
import {
  ALARMA_INICIAL,
  CARA_INICIAL,
  CRONOMETRO_INICIAL,
  LIMITES_PUESTA,
  PUESTA_INICIAL,
  agujas,
  avanceTemporizador,
  comoCronometro,
  comoCuenta,
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
  type Cara,
  type Cronometro,
  type Temporizador,
} from '../src/lib/reloj.ts';

let fallos = 0;

function afirmar(condicion: boolean, mensaje: string) {
  console.log((condicion ? '  ok    ' : '  FALLO ') + mensaje);
  if (!condicion) fallos++;
}

console.log('\n1. La hora, escrita en cada idioma y formato');
{
  // Un instante fijo, en hora local, para que el resultado no dependa de
  // cuándo se ejecute la comprobación.
  const t = new Date(2026, 7, 31, 14, 4, 38);

  const de24: Cara = { ...CARA_INICIAL, formato: '24' };
  const de12: Cara = { ...CARA_INICIAL, formato: '12' };

  afirmar(horaEscrita(t, de24, 'es-ES') === '14:04:38', `24 h: ${horaEscrita(t, de24, 'es-ES')}`);

  const doce = horaEscrita(t, de12, 'en-US');
  afirmar(doce.startsWith('2:04:38'), `12 h empieza en las dos: ${doce}`);
  afirmar(/[ap]\.?\s?m\.?/i.test(doce), `y lleva su am/pm: ${doce}`);

  // Sin segundos, el reloj no tiene por qué repintar cada segundo.
  const sinSeg = horaEscrita(t, { ...de24, segundos: false }, 'es-ES');
  afirmar(sinSeg === '14:04', `sin segundos: ${sinSeg}`);

  // En «auto» manda el idioma: el español usa 24 h y el inglés de EE. UU.
  // usa 12. Es justo lo que se delega en Intl para no mantener una tabla.
  const autoEs = horaEscrita(t, CARA_INICIAL, 'es-ES');
  const autoEn = horaEscrita(t, CARA_INICIAL, 'en-US');
  afirmar(autoEs.startsWith('14'), `auto en español da 24 h: ${autoEs}`);
  afirmar(autoEn.startsWith('2'), `auto en inglés da 12 h: ${autoEn}`);

  const fecha = fechaEscrita(t, 'es-ES');
  afirmar(fecha.includes('agosto') && fecha.includes('31'), `la fecha larga: ${fecha}`);
}

console.log('\n2. Las agujas se mueven seguidas, no a saltos');
{
  // A y media, la aguja de la hora tiene que estar a MEDIO camino entre
  // las dos y las tres. Si saltara de hora en hora, marcaría las dos en
  // punto durante sesenta minutos y el reloj se leería mal.
  const dosYMedia = new Date(2026, 7, 31, 14, 30, 0);
  const a = agujas(dosYMedia);

  afirmar(a.horas === 75, `a las 2:30 la hora está en 75° —entre 60 y 90— (${a.horas})`);
  afirmar(a.minutos === 180, `el minutero, abajo del todo (${a.minutos})`);
  afirmar(a.segundos === 0, `y el segundero, arriba (${a.segundos})`);

  // Las doce en punto son cero grados, no 360.
  const docePunto = new Date(2026, 7, 31, 12, 0, 0);
  afirmar(agujas(docePunto).horas === 0, 'las 12 en punto son 0°, no 360°');

  // El minutero avanza con los segundos.
  const conSegundos = new Date(2026, 7, 31, 14, 30, 30);
  afirmar(
    agujas(conSegundos).minutos === 183,
    `a los 30 s el minutero ya se movió (${agujas(conSegundos).minutos}°)`
  );
}

console.log('\n3. La alarma: la próxima vez que llegue esa hora');
{
  afirmar(horaValida('07:30'), '«07:30» vale');
  afirmar(horaValida('23:59'), '«23:59» vale');
  afirmar(!horaValida('24:00'), '«24:00» no existe');
  afirmar(!horaValida('07:60'), '«07:60» tampoco');
  afirmar(!horaValida('siete'), 'y una palabra menos');

  const manana = new Date(2026, 7, 31, 9, 0, 0);

  // Una hora que aún no ha llegado hoy: hoy.
  const hoy = proximaVez('14:00', manana)!;
  afirmar(hoy.getDate() === 31 && hoy.getHours() === 14, 'las 14:00 vistas a las 9:00 son hoy');

  // Una que ya pasó: mañana. Es el caso que a mano nadie prueba, porque
  // hay que esperar a que sea por la tarde para verlo fallar.
  const ayer = proximaVez('07:00', manana)!;
  afirmar(
    ayer.getDate() === 1 && ayer.getMonth() === 8 && ayer.getHours() === 7,
    `las 7:00 vistas a las 9:00 son mañana, 1 de septiembre (${ayer.toISOString().slice(0, 10)})`
  );

  // Y justo la misma hora también es mañana: si no, sonaría dos veces.
  const clavada = proximaVez('09:00', manana)!;
  afirmar(clavada.getDate() === 1, 'poner la alarma a la hora exacta la manda a mañana');

  // Se deja en el segundo cero.
  const conSegundos = new Date(2026, 7, 31, 9, 0, 43);
  const limpia = proximaVez('14:00', conSegundos)!;
  afirmar(
    limpia.getSeconds() === 0 && limpia.getMilliseconds() === 0,
    'una alarma de las 14:00 no suena a las 14:00:43'
  );

  // Apagada, no falta nada.
  afirmar(faltaParaAlarma(ALARMA_INICIAL, manana) === null, 'apagada, no cuenta');
  const falta = faltaParaAlarma({ hora: '14:00', activa: true }, manana);
  afirmar(falta === 5 * 3600_000, `puesta a las 14:00 desde las 9:00, faltan 5 h (${falta} ms)`);

  // Una hora rota no puede dejar la cuenta en NaN.
  afirmar(proximaVez('nada', manana) === null, 'una hora inválida no devuelve fecha');
  afirmar(faltaParaAlarma({ hora: 'nada', activa: true }, manana) === null, 'ni cuenta atrás');
}

console.log('\n4. El cronómetro cuenta desde donde se quedó');
{
  const parado: Cronometro = { estado: 'parado', acumulado: 4_000, vueltas: [] };
  afirmar(transcurrido(parado, 999_999) === 4_000, 'parado, el reloj de fuera no le afecta');

  const andando: Cronometro = { estado: 'andando', acumulado: 4_000, desde: 1_000, vueltas: [] };
  afirmar(transcurrido(andando, 1_000) === 4_000, 'al reanudar sigue en lo acumulado');
  afirmar(transcurrido(andando, 6_000) === 9_000, 'y suma lo que va desde entonces');

  // El caso raro: `performance.now()` no puede ir hacia atrás, pero si
  // llegara un valor anterior no debe restar tiempo ya contado.
  afirmar(transcurrido(andando, 500) === 4_000, 'un instante anterior no le quita tiempo');
}

console.log('\n5. Las vueltas se derivan de sus marcas');
{
  // Marcas a los 10, 25 y 45 s; el cronómetro va por 60.
  const c: Cronometro = {
    estado: 'andando',
    acumulado: 0,
    desde: 0,
    vueltas: [10_000, 25_000, 45_000],
  };
  const v = vueltasDe(c, 60_000);

  afirmar(v.length === 4, `tres apuntadas más la que está en curso (${v.length})`);
  afirmar(v[0].numero === 4, 'la primera de la lista es la última, que es la que se mira');
  afirmar(v[0].duracion === 15_000, `la vuelta en curso lleva 15 s (${v[0].duracion})`);
  afirmar(v[3].duracion === 10_000, 'la primera vuelta duró 10 s');
  afirmar(v[2].duracion === 15_000, 'la segunda, 15');
  afirmar(v[1].duracion === 20_000, 'la tercera, 20');

  // Los totales son totales, no duraciones: es lo que hace que apuntar
  // una vuelta no pueda descuadrar el número grande.
  afirmar(v[3].total === 10_000 && v[1].total === 45_000, 'y cada una guarda su total');

  const e = extremos(v);
  afirmar(e.rapida === 1, `la más rápida es la 1ª, de 10 s (${e.rapida})`);
  afirmar(
    e.lenta === 3,
    `la más lenta es la 3ª, de 20 s — y NO la 4ª, que aún corre (${e.lenta})`
  );

  // Sin vueltas apuntadas no hay lista: enseñar «la vuelta en curso»
  // sería repetir el número grande de arriba.
  afirmar(vueltasDe(CRONOMETRO_INICIAL, 5_000).length === 0, 'sin marcas, no hay lista');

  // Y si la diferencia no llega a una centésima, tampoco se marca: el
  // cronómetro enseña centésimas, así que dos vueltas que difieren en
  // tres milésimas se leen iguales, y poner «la más rápida» y «la más
  // lenta» sobre dos números idénticos se lee como un fallo.
  const casi: Cronometro = {
    estado: 'andando',
    acumulado: 0,
    desde: 0,
    vueltas: [10_000, 20_003, 30_001],
  };
  const eCasi = extremos(vueltasDe(casi, 40_000));
  afirmar(
    eCasi.rapida === null && eCasi.lenta === null,
    'con diferencias de milésimas no se marca ninguna: en pantalla son el mismo número'
  );

  // Con una sola vuelta cerrada no hay nada que comparar.
  const una: Cronometro = { estado: 'andando', acumulado: 0, desde: 0, vueltas: [10_000] };
  const e1 = extremos(vueltasDe(una, 20_000));
  afirmar(e1.rapida === null && e1.lenta === null, 'con una sola no se marca ni rápida ni lenta');
}

console.log('\n6. El temporizador');
{
  afirmar(puestaMs({ horas: 0, minutos: 5, segundos: 0 }) === 300_000, '5 min son 300 000 ms');
  afirmar(puestaMs({ horas: 1, minutos: 30, segundos: 30 }) === 5_430_000, '1 h 30 m 30 s');

  afirmar(limitarPuesta(75, 'minutos') === LIMITES_PUESTA.minutos.max, '75 minutos se recortan');
  afirmar(limitarPuesta(-3, 'segundos') === 0, 'un negativo sube a cero');
  afirmar(limitarPuesta(NaN, 'horas') === 0, 'y lo que no es número, también');

  const t0 = 1_800_000_000_000;
  const andando: Temporizador = { estado: 'andando', terminaEn: t0 + 300_000, total: 300_000 };

  afirmar(restanteTemporizador(andando, PUESTA_INICIAL, t0) === 300_000, 'al empezar, 5 min');
  afirmar(
    restanteTemporizador(andando, PUESTA_INICIAL, t0 + 600_000) === 0,
    'si se pasa de largo se queda en cero, no en negativo'
  );

  const parado: Temporizador = { estado: 'parado' };
  afirmar(
    restanteTemporizador(parado, { horas: 0, minutos: 12, segundos: 0 }, t0) === 720_000,
    'parado enseña lo puesto, así que cambiar los campos se ve al momento'
  );

  afirmar(avanceTemporizador(andando, PUESTA_INICIAL, t0) === 0, 'el anillo empieza vacío');
  afirmar(
    Math.abs(avanceTemporizador(andando, PUESTA_INICIAL, t0 + 150_000) - 0.5) < 0.001,
    'a la mitad, medio lleno'
  );
  afirmar(avanceTemporizador(andando, PUESTA_INICIAL, t0 + 900_000) === 1, 'y no se pasa');

  // Una puesta a cero no puede dar una división por cero.
  const cero: Temporizador = { estado: 'parado' };
  afirmar(
    avanceTemporizador(cero, { horas: 0, minutos: 0, segundos: 0 }, t0) === 0,
    'con la puesta a cero, el anillo se queda vacío y no en NaN'
  );
}

console.log('\n7. Los dos formatos redondean en sentidos contrarios');
{
  // La cuenta atrás, hacia ARRIBA: mientras quede un resto, todavía no
  // es cero.
  afirmar(comoCuenta(300_000) === '5:00', '5 minutos');
  afirmar(comoCuenta(1) === '0:01', 'una milésima sigue siendo un segundo');
  afirmar(comoCuenta(59_999) === '1:00', '59,999 s son un minuto');
  afirmar(comoCuenta(0) === '0:00', 'y el cero es cero');
  afirmar(comoCuenta(3_723_000) === '1:02:03', 'con horas delante, los minutos llevan cero');

  // El cronómetro, hacia ABAJO: enseña el tiempo que YA ha pasado, así
  // que adelantarse sería mentir.
  afirmar(comoCronometro(12_480) === '0:12.48', '12,48 s');
  afirmar(comoCronometro(999) === '0:00.99', 'a falta de una milésima, sigue sin ser un segundo');
  afirmar(comoCronometro(0) === '0:00.00', 'el cero');
  afirmar(comoCronometro(65_050) === '1:05.05', 'un minuto y cinco');
  afirmar(comoCronometro(3_723_450) === '1:02:03.45', 'y con horas delante');
}

console.log(fallos === 0 ? '\nTODO CORRECTO\n' : `\n${fallos} FALLOS\n`);
process.exit(fallos === 0 ? 0 : 1);
