/**
 * Tareas Clínicas Utils — F7-27
 *
 * Detecta tareas clínicas pendientes para el Dashboard.
 * Tipos: recetas por emitir, certificados pendientes, evoluciones faltantes.
 *
 * Uso:
 *   import { obtenerTareasClinicas } from '../utils/tareasClinicas'
 *
 *   const tareas = obtenerTareasClinicas(citas, evoluciones, recetas)
 */

/**
 * Obtiene tareas de recetas por emitir (pacientes con consulta hoy sin receta).
 *
 * @param {Array} citas - Array de citas
 * @param {Array} recetas - Array de recetas emitidas
 * @returns {Array} Tareas de recetas pendientes
 */
const obtenerTareasRecetas = (citas = [], recetas = []) => {
  const hoy = new Date().toISOString().split('T')[0]

  const citasHoy = citas.filter((c) => c.fecha === hoy && (c.estado === 'Completado' || c.estado === 'Atendido' || c.estado === 'Realizado'))

  const recetasHoy = recetas.filter((r) => {
    const fechaReceta = r.fechaEmision || r.fecha
    return fechaReceta === hoy
  })

  const pacienteIdsConReceta = new Set(recetasHoy.map((r) => r.pacienteId))

  return citasHoy
    .filter((cita) => !pacienteIdsConReceta.has(cita.pacienteId))
    .map((cita) => ({
      tipo: 'receta_pendiente',
      completada: false,
      titulo: 'Emitir receta médica',
      descripcion: `${cita.pacienteNombre || 'Paciente'} - ${cita.trataMiento || 'Sin tratamiento'}`,
      fecha: cita.fecha,
      citaId: cita.id,
      pacienteId: cita.pacienteId,
    }))
}

/**
 * Obtiene tareas de certificados pendientes (pacientes solicitaron pero no se emitieron).
 *
 * @param {Array} citas - Array de citas
 * @param {Array} certificados - Array de certificados emitidos
 * @returns {Array} Tareas de certificados pendientes
 */
const obtenerTareasCertificados = (citas = [], certificados = []) => {
  const hoy = new Date().toISOString().split('T')[0]

  const citasHoy = citas.filter((c) => c.fecha === hoy && c.solicitoCertificado)

  const certificadosHoy = certificados.filter((c) => {
    const fechaCert = c.fechaEmision || c.fecha
    return fechaCert === hoy
  })

  const pacienteIdsConCertificado = new Set(certificadosHoy.map((c) => c.pacienteId))

  return citasHoy
    .filter((cita) => !pacienteIdsConCertificado.has(cita.pacienteId))
    .map((cita) => ({
      tipo: 'certificado_pendiente',
      completada: false,
      titulo: 'Emitir certificado',
      descripcion: `${cita.pacienteNombre || 'Paciente'} - Solicitó certificado`,
      fecha: cita.fecha,
      citaId: cita.id,
      pacienteId: cita.pacienteId,
    }))
}

/**
 * Obtiene tareas de evoluciones clínicas faltantes (citas finalizadas sin nota).
 *
 * @param {Array} citas - Array de citas
 * @param {Array} evoluciones - Array de evoluciones clínicas
 * @returns {Array} Tareas de evoluciones pendientes
 */
const obtenerTareasEvoluciones = (citas = [], evoluciones = []) => {
  const hoy = new Date().toISOString().split('T')[0]

  const citasHoy = citas.filter((c) => c.fecha === hoy && (c.estado === 'Completado' || c.estado === 'Atendido' || c.estado === 'Realizado'))

  const evolucionesHoy = evoluciones.filter((e) => {
    const fechaEvol = e.fecha
    return fechaEvol === hoy
  })

  const pacienteIdsConEvolucion = new Set(evolucionesHoy.map((e) => e.pacienteId))

  return citasHoy
    .filter((cita) => !pacienteIdsConEvolucion.has(cita.pacienteId))
    .map((cita) => ({
      tipo: 'evolucion_pendiente',
      completada: false,
      titulo: 'Registrar evolución clínica',
      descripcion: `${cita.pacienteNombre || 'Paciente'} - Cita finalizada sin nota`,
      fecha: cita.fecha,
      citaId: cita.id,
      pacienteId: cita.pacienteId,
    }))
}

/**
 * Obtiene todas las tareas clínicas pendientes consolidadas.
 *
 * @param {Array} citas - Array de citas
 * @param {Array} evoluciones - Array de evoluciones clínicas
 * @param {Array} recetas - Array de recetas emitidas
 * @param {Array} certificados - Array de certificados emitidos
 * @returns {Array} Array de tareas ordenadas por tipo
 */
export const obtenerTareasClinicas = (citas = [], evoluciones = [], recetas = [], certificados = []) => {
  const tareasRecetas = obtenerTareasRecetas(citas, recetas)
  const tareasCertificados = obtenerTareasCertificados(citas, certificados)
  const tareasEvoluciones = obtenerTareasEvoluciones(citas, evoluciones)

  return [...tareasRecetas, ...tareasCertificados, ...tareasEvoluciones]
}
