/**
 * Constantes y Enumeraciones para el Módulo de Agenda
 */

export const ESTADOS_CITA = [
  { id: 'Confirmada', nombre: '🟡 Confirmada', colorBg: 'bg-amber-50', colorText: 'text-amber-800', colorBorder: 'border-amber-300' },
  { id: 'En Espera', nombre: '🔵 En Sala de Espera', colorBg: 'bg-blue-50', colorText: 'text-blue-800', colorBorder: 'border-blue-300' },
  { id: 'En Atencion', nombre: '🟣 En Atención', colorBg: 'bg-purple-50', colorText: 'text-purple-800', colorBorder: 'border-purple-300' },
  { id: 'Realizada', nombre: '🟢 Realizada / Finalizada', colorBg: 'bg-emerald-50', colorText: 'text-emerald-800', colorBorder: 'border-emerald-300' },
  { id: 'Cancelada', nombre: '🔴 Cancelada', colorBg: 'bg-red-50', colorText: 'text-red-800', colorBorder: 'border-red-300' }
]

export const BOXES_SILLONES = [
  'Box 1 - General',
  'Box 2 - Cirugía / Implantes',
  'Box 3 - Odontopediatría',
  'Box 4 - Higiene / Periodoncia'
]

export const HORARIOS_JORNADA = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '14:00', '14:30', '15:00', '15:30', '16:00',
  '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
]