/**
 * validarConflictosAntesDeGuardar — Valida conflictos de horario antes de guardar citas
 * 
 * Extraído de ModalNuevaCita.jsx para cumplir límites de allowlist (F3-02).
 * Encapsula la lógica de validación + mensaje de confirmación.
 * 
 * @param {Array} citasAGuardar - Array de citas a validar
 * @param {Array} citasExistentes - Citas ya existentes en el sistema
 * @param {Function} validarConflictosRecurrencia - Función de validación de recurrenciaUtils
 * @returns {Promise<boolean>} - true si se puede continuar, false si el usuario canceló
 */
export const validarConflictosAntesDeGuardar = async (
  citasAGuardar,
  citasExistentes,
  validarConflictosRecurrencia
) => {
  const todosLosConflictos = []
  
  citasAGuardar.forEach((cita) => {
    const resultado = validarConflictosRecurrencia(cita, citasExistentes)
    if (!resultado.valido) {
      resultado.conflictos.forEach((conflicto) => {
        todosLosConflictos.push({
          fecha: conflicto.fecha,
          hora: conflicto.horaInicio,
          paciente: conflicto.pacienteNombre,
          box: conflicto.boxAsignado
        })
      })
    }
  })

  if (todosLosConflictos.length === 0) {
    return true // No hay conflictos, continuar
  }

  // Hay conflictos, mostrar confirmación
  const mensaje = `Se detectaron ${todosLosConflictos.length} conflicto(s) de horario:\n\n` +
    todosLosConflictos.slice(0, 5).map(c => 
      `• ${c.fecha} a las ${c.hora} - ${c.paciente} (${c.box})`
    ).join('\n') +
    (todosLosConflictos.length > 5 ? `\n...y ${todosLosConflictos.length - 5} más` : '') +
    '\n\n¿Deseas continuar de todos modos?'
  
  return window.confirm(mensaje)
}

/**
 * validarConflictoCitaUnica — Valida conflictos para una cita única
 * 
 * @param {Object} citaUnica - Cita a validar
 * @param {Array} citasExistentes - Citas ya existentes
 * @param {Function} validarConflictosRecurrencia - Función de validación
 * @returns {Promise<boolean>} - true si se puede continuar, false si el usuario canceló
 */
export const validarConflictoCitaUnica = async (
  citaUnica,
  citasExistentes,
  validarConflictosRecurrencia
) => {
  const resultado = validarConflictosRecurrencia(citaUnica, citasExistentes)
  
  if (resultado.valido) {
    return true // No hay conflicto, continuar
  }

  // Hay conflicto, mostrar confirmación
  const conflictos = resultado.conflictos
  const mensaje = `Conflicto de horario detectado:\n\n` +
    conflictos.map(c => 
      `• ${c.fecha} a las ${c.horaInicio} - ${c.pacienteNombre} (${c.boxAsignado})`
    ).join('\n') +
    '\n\n¿Deseas continuar de todos modos?'
  
  return window.confirm(mensaje)
}
