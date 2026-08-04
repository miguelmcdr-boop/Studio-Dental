/**
 * Constantes Gold Standard para la Agenda Multi-Box
 */

export const BOXES_DENTALES = [
  { id: 'box_1', nombre: '🦷 Box 1 (General / Operatoria)', colorBg: 'bg-blue-50', colorBorder: 'border-blue-300' },
  { id: 'box_2', nombre: '🔬 Box 2 (Endodoncia / Cirugía)', colorBg: 'bg-purple-50', colorBorder: 'border-purple-300' },
  { id: 'box_3', nombre: '✨ Box 3 (Estética / Ortodoncia)', colorBg: 'bg-emerald-50', colorBorder: 'border-emerald-300' },
  { id: 'box_higiene', nombre: '🧼 Box Higiene / Profilaxis', colorBg: 'bg-amber-50', colorBorder: 'border-amber-300' }
]

export const ESTADOS_CITA_GOLD = [
  { id: 'Agendado', nombre: '📅 Agendado', colorBg: 'bg-blue-100', colorText: 'text-blue-900', colorBorder: 'border-blue-300' },
  { id: 'EnEspera', nombre: '⏳ En Sala de Espera', colorBg: 'bg-amber-100', colorText: 'text-amber-900', colorBorder: 'border-amber-300' },
  { id: 'EnSillon', nombre: '🟢 En Sillón / Atención', colorBg: 'bg-emerald-100', colorText: 'text-emerald-900', colorBorder: 'border-emerald-300' },
  { id: 'Finalizado', nombre: '✅ Finalizado', colorBg: 'bg-gray-100', colorText: 'text-gray-800', colorBorder: 'border-gray-300' },
  { id: 'NoAsiste', nombre: '🔴 No Asiste (No-Show)', colorBg: 'bg-red-100', colorText: 'text-red-900', colorBorder: 'border-red-300' },
  { id: 'Bloqueo', nombre: '🔒 Bloqueo / Mantenimiento', colorBg: 'bg-gray-200', colorText: 'text-gray-700', colorBorder: 'border-gray-400' }
]

export const CITAS_DEFAULT = [
  {
    id: 501,
    pacienteId: 1,
    pacienteNombre: 'Camila Silva Morales',
    pacienteRut: '18.452.123-K',
    pacienteTelefono: '+56 9 8765 4321',
    fecha: new Date().toLocaleDateString('es-CL'),
    fechaIso: new Date().toISOString().split('T')[0],
    horaInicio: '09:00',
    horaFin: '09:30',
    boxId: 'box_1',
    doctorNombre: 'Dr. Miguel Díaz',
    motivo: 'Evaluación de Corona Zirconio',
    estado: 'EnSillon',
    horaLlegadaEspera: '08:55',
    observaciones: 'Paciente puntual. Presenta sensibilidad leve.'
  },
  {
    id: 502,
    pacienteId: 2,
    pacienteNombre: 'Carlos Mendoza Vera',
    pacienteRut: '15.321.987-4',
    pacienteTelefono: '+56 9 1234 5678',
    fecha: new Date().toLocaleDateString('es-CL'),
    fechaIso: new Date().toISOString().split('T')[0],
    horaInicio: '10:00',
    horaFin: '10:45',
    boxId: 'box_2',
    doctorNombre: 'Dr. Miguel Díaz',
    motivo: 'Endodoncia Unirradicular',
    estado: 'EnEspera',
    horaLlegadaEspera: '09:50',
    observaciones: 'Requiere anestesia sin vasoconstrictor por hipertensión.'
  }
]