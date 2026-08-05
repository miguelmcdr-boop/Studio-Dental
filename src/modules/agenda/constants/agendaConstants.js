export const SILLONES_DENTALES = [
  { id: 'sillon_1', nombre: 'Sillón 1 - Odontología General', especialidad: 'Evaluación y Restauraciones' },
  { id: 'sillon_2', nombre: 'Sillón 2 - Higiene & Ortodoncia', especialidad: 'Limpieza, Profilaxis y Frenillos' },
  { id: 'box_3', nombre: 'Box 3 - Quirúrgico & Implantes', especialidad: 'Cirugías y Periodoncia' }
]

export const BOXES_DENTALES = SILLONES_DENTALES

export const TIPOS_BLOQUEO_AGENDA = [
  { id: 'almuerzo', label: '🍱 Horario de Almuerzo', color: 'bg-gray-200 text-gray-800' },
  { id: 'reunion', label: '👥 Reunión Clínica / Administrativa', color: 'bg-amber-100 text-amber-900' },
  { id: 'mantenimiento', label: '🛠️ Mantenimiento de Sillón / Box', color: 'bg-red-100 text-red-900' },
  { id: 'urgencia_reserva', label: '🚨 Reserva Exclusiva Urgencias', color: 'bg-purple-100 text-purple-900' }
]

export const ESTADOS_CITA = {
  AGENDADO: { id: 'Agendado', label: '🔵 Agendado', color: 'bg-blue-100 text-blue-800' },
  CONFIRMADO: { id: 'Confirmado', label: '🟢 Confirmado', color: 'bg-emerald-100 text-emerald-800' },
  SALA_ESPERA: { id: 'En Espera', label: '🟡 En Sala de Espera', color: 'bg-amber-100 text-amber-900' },
  EN_SILLON: { id: 'En Sillón', label: '🟣 En Sillón', color: 'bg-purple-100 text-purple-900' },
  ATENDIDO: { id: 'Atendido', label: '⚪ Atendido', color: 'bg-gray-100 text-gray-700' },
  ANULADO: { id: 'Anulado', label: '🔴 Anulado', color: 'bg-red-100 text-red-800' }
}

// 💡 Exportamos un Arreglo Mapeable seguro para ModalNuevaCita.jsx
export const ESTADOS_CITA_GOLD = Object.values(ESTADOS_CITA)
export const ESTADOS_CITA_WORLD_CLASS = ESTADOS_CITA_GOLD