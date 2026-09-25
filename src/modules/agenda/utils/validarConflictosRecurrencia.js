/**
 * validarConflictosRecurrencia — Valida conflictos de horario para múltiples citas
 * 
 * Extraído de ModalNuevaCita.jsx para cumplir límites de allowlist (F3-02).
 * Usa solo para validar arrays de citas (recurrentes o múltiples).
 * 
 * @param {Array} citasAGuardar - Array de citas a validar
 * @param {Array} citasExistentes - Citas ya existentes en el sistema
 * @param {Function} validarFn - Función de validación de recurrenciaUtils
 * @returns {Promise<boolean>} - true si se puede continuar, false si el usuario canceló
 */
export const confirmarConflictosRecurrencia = async (
  citasAGuardar,
  citasExistentes,
  validarFn
) => {
  const todosLosConflictos = []
  
  citasAGuardar.forEach((cita) => {
    const resultado = validarFn(cita, citasExistentes)
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
    return true
  }

  const mensaje = `Se detectaron ${todosLosConflictos.length} conflicto(s) de horario:\n\n` +
    todosLosConflictos.slice(0, 5).map(c => 
      `• ${c.fecha} a las ${c.hora} - ${c.paciente} (${c.box})`
    ).join('\n') +
    (todosLosConflictos.length > 5 ? `\n...y ${todosLosConflictos.length - 5} más` : '') +
    '\n\n¿Deseas continuar de todos modos?'
  
  return window.confirm(mensaje)
}
