/**
 * validarConflictoCitaUnica — Valida conflictos para una cita única
 * 
 * Extraído de ModalNuevaCita.jsx para cumplir límites de allowlist (F3-02).
 * Usa solo para validar una sola cita (no arrays).
 * 
 * @param {Object} citaUnica - Cita a validar
 * @param {Array} citasExistentes - Citas ya existentes
 * @param {Function} validarFn - Función de validación
 * @returns {Promise<boolean>} - true si se puede continuar, false si el usuario canceló
 */
export const validarConflictoCitaUnica = async (
  citaUnica,
  citasExistentes,
  validarFn
) => {
  const resultado = validarFn(citaUnica, citasExistentes)
  
  if (resultado.valido) {
    return true
  }

  const conflictos = resultado.conflictos
  const mensaje = `Conflicto de horario detectado:\n\n` +
    conflictos.map(c => 
      `• ${c.fecha} a las ${c.horaInicio} - ${c.pacienteNombre} (${c.boxAsignado})`
    ).join('\n') +
    '\n\n¿Deseas continuar de todos modos?'
  
  return window.confirm(mensaje)
}
