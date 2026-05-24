/**
 * Simula o fluxo: agendamento recorrente (segundas) + edição parcial.
 * Reproduz o bug em que só resta a consulta de 25/05 após editar.
 */

function expandMondays(appointment) {
  const recurrenceType = appointment.recurrence_type;
  const recurrenceEnd = appointment.recurrence_end;
  if (!recurrenceType || recurrenceType === 'none' || !recurrenceEnd) {
    return [appointment.appointment_date?.slice(0, 10)];
  }

  const days = typeof appointment.recurrence_days === 'string'
    ? JSON.parse(appointment.recurrence_days)
    : appointment.recurrence_days;

  const start = new Date(appointment.appointment_date);
  const end = new Date(recurrenceEnd);
  const dates = [];
  const current = new Date(start);

  while (current <= end) {
    if (days.includes(current.getDay())) {
      dates.push(current.toISOString().slice(0, 10));
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** Comportamento ATUAL do backend no PUT sem recurrence_type */
function backendUpdateBuggy(appointment, body) {
  const validated = { ...body };
  if (!validated.recurrence_type) {
    validated.recurrence_type = 'none';
  }
  return { ...appointment, ...validated };
}

/** Comportamento CORRIGIDO: só altera campos enviados */
function backendUpdateFixed(appointment, body) {
  return { ...appointment, ...body };
}

/** Payload ATUAL do app ao editar (sem recorrência) */
const editPayloadCurrent = {
  title: 'Consulta psicólogo Allan',
  notes: 'Observação editada',
  appointment_date: '2025-05-25T10:00:00.000Z',
};

const recurringAppointment = {
  id: 1,
  title: 'Consulta psicólogo Allan',
  appointment_date: '2025-05-25T10:00:00.000Z',
  recurrence_type: 'custom',
  recurrence_days: '[1]',
  recurrence_start: '2025-05-25T10:00:00.000Z',
  recurrence_end: '2025-06-15T23:59:59.000Z',
};

console.log('=== Cenário: Marlene — segundas de 25/05 a 15/06 ===\n');
console.log('Antes da edição:', expandMondays(recurringAppointment).join(', '));

const afterBuggy = backendUpdateBuggy(recurringAppointment, editPayloadCurrent);
console.log('\nApós editar (backend ATUAL):', expandMondays(afterBuggy).join(', '));
console.log('recurrence_type gravado:', afterBuggy.recurrence_type);

const afterFixed = backendUpdateFixed(recurringAppointment, editPayloadCurrent);
console.log('\nApós editar (backend CORRIGIDO):', expandMondays(afterFixed).join(', '));
console.log('recurrence_type preservado:', afterFixed.recurrence_type);

const buggyCount = expandMondays(afterBuggy).length;
const fixedCount = expandMondays(afterFixed).length;
const expectedCount = expandMondays(recurringAppointment).length;

console.log('\n=== Resultado ===');
console.log(`Esperado: ${expectedCount} consultas | Bug atual: ${buggyCount} | Corrigido: ${fixedCount}`);
process.exit(buggyCount === 1 && fixedCount === expectedCount ? 0 : 1);
