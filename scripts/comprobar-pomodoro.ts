/**
 * Comprobación de la aritmética del pomodoro. Se ejecuta a mano.
 *
 * Lo que de verdad hay que demostrar aquí es que la cuenta atrás no se
 * descuadra. Una cuenta que resta un segundo cada segundo parece correcta
 * durante los dos minutos que dura una prueba a mano, y falla justo
 * cuando importa: con la pestaña de fondo, con el portátil suspendido, o
 * después de veinticinco minutos de errores acumulados.
 *
 * Aquí se comprueba contra instantes concretos, saltándose el tiempo en
 * vez de esperarlo, que es la única forma de probar una hora de cuenta
 * atrás en un milisegundo.
 */
import {
  AJUSTES_INICIALES,
  LIMITES,
  avance,
  comoReloj,
  descansoTras,
  duracionMs,
  margenRestanteMs,
  limitar,
  minutosDe,
  restanteMs,
  siguiente,
  type Ajustes,
  type Fase,
  type Cuenta,
} from '../src/lib/pomodoro.ts';

let fallos = 0;

function afirmar(condicion: boolean, mensaje: string) {
  console.log((condicion ? '  ok    ' : '  FALLO ') + mensaje);
  if (!condicion) fallos++;
}

const base: Ajustes = AJUSTES_INICIALES;

console.log('\n1. El ciclo: trabajo, descanso, y el largo cada cuatro');
{
  // Se recorre el ciclo entero dos vueltas y se anota qué toca en cada
  // punto. Es la secuencia que alguien vería en dos horas de trabajo.
  let fase: Fase = 'trabajo';
  let hechos = 0;
  const recorrido: string[] = [];

  for (let i = 0; i < 16; i++) {
    recorrido.push(fase === 'trabajo' ? 'T' : fase === 'corto' ? 'c' : 'L');
    const paso = siguiente(fase, hechos, base);
    fase = paso.fase;
    hechos = paso.hechos;
  }

  const esperado = 'TcTcTcTLTcTcTcTL';
  afirmar(recorrido.join('') === esperado, `dos vueltas seguidas: ${recorrido.join('')}`);
  afirmar(hechos === 8, `y ocho pomodoros contados (${hechos})`);

  // El descanso largo cae donde toca, y solo ahí.
  afirmar(descansoTras(4, base) === 'largo', 'tras el cuarto, descanso largo');
  afirmar(descansoTras(3, base) === 'corto', 'tras el tercero, corto');
  afirmar(descansoTras(8, base) === 'largo', 'tras el octavo, largo otra vez');
  afirmar(descansoTras(0, base) === 'corto', 'y el cero no cuenta como múltiplo');

  // Con otro «cada», la secuencia cambia entera.
  const cadaTres: Ajustes = { ...base, cada: 3 };
  afirmar(descansoTras(3, cadaTres) === 'largo', 'con cada=3, el largo cae en el tercero');
  afirmar(descansoTras(4, cadaTres) === 'corto', 'y el cuarto vuelve a ser corto');
}

console.log('\n2. La cuenta sale del reloj, no de un contador');
{
  const t0 = 1_800_000_000_000;
  const andando: Cuenta = {
    estado: 'andando',
    fase: 'trabajo',
    hechos: 0,
    terminaEn: t0 + 25 * 60_000,
  };

  afirmar(restanteMs(andando, base, t0) === 25 * 60_000, 'al empezar quedan los 25 minutos');
  afirmar(restanteMs(andando, base, t0 + 60_000) === 24 * 60_000, 'un minuto después, 24');

  // El caso que rompe a las cuentas acumuladas: la pestaña estuvo en
  // segundo plano veinte minutos y nadie contó los tics.
  afirmar(
    restanteMs(andando, base, t0 + 20 * 60_000) === 5 * 60_000,
    'tras veinte minutos sin mirar, quedan 5 y no 25'
  );

  // Y el que rompe a las que se guardan a medias: el portátil durmió más
  // de lo que duraba la fase.
  afirmar(
    restanteMs(andando, base, t0 + 40 * 60_000) === 0,
    'si se pasa de largo, se queda en cero y no en negativo'
  );

  const pausada: Cuenta = { estado: 'pausa', fase: 'corto', hechos: 1, restanteMs: 90_000 };
  afirmar(
    restanteMs(pausada, base, t0) === 90_000 &&
      restanteMs(pausada, base, t0 + 10 * 60_000) === 90_000,
    'en pausa, el tiempo de fuera no corre'
  );

  const parada: Cuenta = { estado: 'parado', fase: 'largo', hechos: 4 };
  afirmar(
    restanteMs(parada, base, t0) === 15 * 60_000,
    'parada, enseña la duración entera de su fase'
  );
}

console.log('\n3. El reloj se escribe como un reloj');
{
  afirmar(comoReloj(25 * 60_000) === '25:00', '25 minutos');
  afirmar(comoReloj(9 * 60_000) === '9:00', 'los minutos no se rellenan con cero');
  afirmar(comoReloj(65_000) === '1:05', 'los segundos sí');
  afirmar(comoReloj(0) === '0:00', 'el cero');
  // Se redondea hacia arriba: mientras quede un resto, el número que se
  // ve todavía no es cero. Si no, «0:00» aparecería un segundo antes de
  // que la fase acabara de verdad.
  afirmar(comoReloj(1) === '0:01', 'y una milésima sigue siendo un segundo');
  afirmar(comoReloj(59_999) === '1:00', 'igual que 59,999 s son un minuto');
}

console.log('\n4. El anillo se llena, no se vacía');
{
  const t0 = 1_800_000_000_000;
  const c: Cuenta = { estado: 'andando', fase: 'trabajo', hechos: 0, terminaEn: t0 + 25 * 60_000 };

  afirmar(avance(c, base, t0) === 0, 'al empezar está vacío');
  afirmar(Math.abs(avance(c, base, t0 + 12.5 * 60_000) - 0.5) < 0.001, 'a la mitad, medio lleno');
  afirmar(avance(c, base, t0 + 25 * 60_000) === 1, 'al acabar, lleno');
  afirmar(avance(c, base, t0 + 99 * 60_000) === 1, 'y no se pasa de lleno');
}

console.log('\n5. Los ajustes se quedan dentro de sus límites');
{
  afirmar(limitar(25, 'trabajo') === 25, 'un valor normal pasa tal cual');
  afirmar(limitar(9999, 'trabajo') === LIMITES.trabajo.max, 'lo que se pasa se recorta al máximo');
  afirmar(limitar(0, 'trabajo') === LIMITES.trabajo.min, 'y lo que se queda corto, al mínimo');
  // Se redondea al medio minuto más cercano, no al entero: 25,7 cae en
  // 25,5. Los medios existen desde que se admiten descansos de minuto y
  // medio; ver el apartado 7.
  afirmar(limitar(25.7, 'trabajo') === 25.5, 'los decimales caen al medio más cercano');

  // Una dirección manipulada no debe poder dejar la cuenta en NaN.
  afirmar(limitar(NaN, 'trabajo') === AJUSTES_INICIALES.trabajo, 'un NaN vuelve al valor de fábrica');
  afirmar(
    limitar(Number('hola'), 'cada') === AJUSTES_INICIALES.cada,
    'y lo que no es un número, también'
  );
  afirmar(limitar(-5, 'cada') === LIMITES.cada.min, 'un negativo se sube al mínimo');
}

console.log('\n6. Cada fase dura lo que dice su ajuste');
{
  afirmar(minutosDe('trabajo', base) === base.trabajo, 'trabajo');
  afirmar(minutosDe('corto', base) === base.corto, 'descanso corto');
  afirmar(minutosDe('largo', base) === base.largo, 'descanso largo');

  const otro: Ajustes = { trabajo: 50, corto: 10, largo: 30, cada: 2, margen: 5 };
  afirmar(minutosDe('trabajo', otro) === 50, 'y con otras duraciones, las otras');
  afirmar(
    restanteMs({ estado: 'parado', fase: 'largo', hechos: 0 }, otro, 0) === 30 * 60_000,
    'la cuenta parada las respeta'
  );
}

console.log('\n7. Medios minutos');
{
  // Un descanso de minuto y medio es un patrón real, y con enteros no se
  // podía escribir. El paso es de medio minuto: ni decimales infinitos ni
  // un campo de segundos aparte.
  afirmar(limitar(2.5, 'corto') === 2.5, 'dos minutos y medio se aceptan tal cual');
  afirmar(limitar(2.4, 'corto') === 2.5, '2,4 se redondea al medio más cercano');
  afirmar(limitar(2.2, 'corto') === 2, 'y 2,2 baja a 2');
  afirmar(limitar(0.5, 'corto') === 0.5, 'medio minuto es el mínimo, y vale');
  afirmar(limitar(0.1, 'corto') === 0.5, 'menos de medio sube al mínimo');

  // Pero «cada» y «margen» siguen siendo enteros: «4,5 pomodoros» no
  // significa nada, y medio segundo de margen tampoco.
  afirmar(limitar(4.5, 'cada') === 5, 'los pomodoros del ciclo se redondean a entero');
  afirmar(limitar(5.4, 'margen') === 5, 'y los segundos de margen también');

  const medios: Ajustes = { ...base, corto: 2.5 };
  afirmar(duracionMs('corto', medios) === 150_000, 'dos minutos y medio son 150 000 ms');
  afirmar(comoReloj(duracionMs('corto', medios)) === '2:30', 'y se leen «2:30»');
}

console.log('\n8. El reloj pasa de la hora');
{
  // Con el trabajo al máximo (180 min) el reloj enseñaba «180:00», que se
  // lee mal y se sale del anillo. Por encima de la hora se escribe con
  // horas delante.
  afirmar(comoReloj(180 * 60_000) === '3:00:00', 'tres horas');
  afirmar(comoReloj(60 * 60_000) === '1:00:00', 'una hora justa');
  afirmar(comoReloj(59 * 60_000 + 59_000) === '59:59', 'y justo por debajo, sin horas');
  afirmar(comoReloj(3661_000) === '1:01:01', 'los minutos sí se rellenan si hay horas delante');
}

console.log('\n9. El margen entre fases');
{
  const t0 = 1_800_000_000_000;
  const m: Cuenta = { estado: 'margen', fase: 'corto', hechos: 1, empiezaEn: t0 + 5000 };

  afirmar(margenRestanteMs(m, t0) === 5000, 'al empezar el margen quedan cinco segundos');
  afirmar(margenRestanteMs(m, t0 + 3000) === 2000, 'a los tres, quedan dos');
  afirmar(margenRestanteMs(m, t0 + 9000) === 0, 'y no baja de cero');
  afirmar(
    margenRestanteMs({ estado: 'parado', fase: 'corto', hechos: 0 }, t0) === 0,
    'fuera del margen, no hay margen que contar'
  );

  // Mientras corre el margen, el reloj enseña la fase ENTERA: es la que
  // va a empezar, no una a medias.
  afirmar(restanteMs(m, base, t0) === 5 * 60_000, 'el reloj enseña el descanso entero');
  afirmar(avance(m, base, t0) === 0, 'y el anillo está vacío, que aún no ha empezado');
}

console.log('\n10. Cambiar una duración se ve al momento');
{
  // El fallo que se arregló: se cambiaba «trabajo» a 50 y el reloj seguía
  // diciendo 25:00. Parada, la cuenta tiene que salir de los ajustes de
  // ahora y no de los de cuando se montó.
  const parada: Cuenta = { estado: 'parado', fase: 'trabajo', hechos: 0 };
  afirmar(comoReloj(restanteMs(parada, base, 0)) === '25:00', 'con 25 min, marca 25:00');
  afirmar(
    comoReloj(restanteMs(parada, { ...base, trabajo: 50 }, 0)) === '50:00',
    'y al ponerlo en 50, marca 50:00'
  );

  // En pausa NO, y es a propósito: la fase que está a medias se respeta.
  const pausada: Cuenta = { estado: 'pausa', fase: 'trabajo', hechos: 0, restanteMs: 600_000 };
  afirmar(
    restanteMs(pausada, { ...base, trabajo: 50 }, 0) === 600_000,
    'lo que está en pausa a mitad no se recalcula'
  );
}

console.log(fallos === 0 ? '\nTODO CORRECTO\n' : `\n${fallos} FALLOS\n`);
process.exit(fallos === 0 ? 0 : 1);
