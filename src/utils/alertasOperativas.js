/**
 * Alertas Operativas Utils — F7-27
 *
 * Detecta alertas operativas críticas para el Dashboard.
 * Tipos: citas sin confirmar, deuda pendiente, post-operatorios pendientes.
 *
 * Uso:
 *   import { obtenerAlertasOperativas } from '../utils/alertasOperativas'
 *
 *   const alertas = obtenerAlertasOperativas(citas, pagos, presupuestos)
 */

/**
 * Obtiene alertas de citas sin confirmar (últimas 24h).
 *
 * @param {Array} citas - Array de citas
 * @returns {Array} Alertas de citas sin confirmar
 */
const obtenerAlertasCitasSinConfirmar = (citas = []) => {
  const ahora = new Date()
  const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000)

  return citas
    .filter((cita) => {
      if (!cita.fecha) return false
      const fechaCita = new Date(cita.fecha + 'T' + (cita.horaInicio || '00:00') + ':00')
      return fechaCita >= hace24h && fechaCita <= ahora
    })
    .filter((cita) => !cita.confirmada)
    .map((cita) => ({
      tipo: 'cita_sin_confirmar',
      severidad: 'media',
      titulo: 'Cita sin confirmar',
      descripcion: `${cita.pacienteNombre || 'Paciente'} - ${cita.horaInicio} - ${cita.boxAsignado || 'Sin box'}`,
      fecha: cita.fecha,
      citaId: cita.id,
      pacienteId: cita.pacienteId,
    }))
}

/**
 * Obtiene alertas de pacientes con deuda pendiente > $50.000.
 *
 * @param {Array} pagos - Array de pagos
 * @param {Array} presupuestos - Array de presupuestos
 * @returns {Array} Alertas de deuda pendiente
 */
const obtenerAlertasDeudaPendiente = (pagos = [], presupuestos = []) => {
  const deudaPorPaciente = new Map()

  // Sumar presupuestos aceptados por paciente
  presupuestos
    .filter((p) => p.estado === 'Aceptado' || p.estado === 'En Proceso' || p.estado === 'Finalizado')
    .forEach((p) => {
      const total = parseFloat(p.total) || 0
      deudaPorPaciente.set(p.pacienteId, (deudaPorPaciente.get(p.pacienteId) || 0) + total)
    })

  // Restar pagos realizados por paciente
  pagos
    .filter((p) => p.estado !== 'Anulado')
    .forEach((p) => {
      const monto = parseFloat(p.monto) || 0
      deudaPorPaciente.set(p.pacienteId, (deudaPorPaciente.get(p.pacienteId) || 0) - monto)
    })

  // Filtrar pacientes con deuda > $50.000
  const alertas = []
  deudaPorPaciente.forEach((deuda, pacienteId) => {
    if (deuda > 50000) {
      alertas.push({
        tipo: 'deuda_pendiente',
        severidad: 'alta',
        titulo: 'Deuda pendiente',
        descripcion: `Paciente ID ${pacienteId} - Deuda: $${deuda.toLocaleString('es-CL')} CLP`,
        pacienteId: pacienteId,
        monto: deuda,
      })
    }
  })

  return alertas
}

/**
 * Obtiene alertas de post-operatorios por enviar (últimas 48h).
 *
 * @param {Array} citas - Array de citas
 * @returns {Array} Alertas de post-operatorios pendientes
 */
const obtenerAlertasPostOperatorios = (citas = []) => {
  const ahora = new Date()
  const hace48h = new Date(ahora.getTime() - 48 * 60 * 60 * 1000)

  return citas
    .filter((cita) => {
      if (!cita.fecha) return false
      const fechaCita = new Date(cita.fecha + 'T' + (cita.horaInicio || '00:00') + ':00')
      return fechaCita >= hace48h && fechaCita <= ahora
    })
    .filter((cita) => cita.estado === 'Completado' || cita.estado === 'Atendido' || cita.estado === 'Realizado')
    .filter((cita) => !cita.postOperatorioEnviado)
    .map((cita) => ({
      tipo: 'post_operatorio_pendiente',
      severidad: 'baja',
      titulo: 'Post-operatorio por enviar',
      descripcion: `${cita.pacienteNombre || 'Paciente'} - ${cita.trataMiento || 'Sin tratamiento'}`,
      fecha: cita.fecha,
      citaId: cita.id,
      pacienteId: cita.pacienteId,
    }))
}

/**
 * Obtiene todas las alertas operativas consolidadas.
 *
 * @param {Array} citas - Array de citas
 * @param {Array} pagos - Array de pagos
 * @param {Array} presupuestos - Array de presupuestos
 * @returns {Array} Array de alertas ordenadas por severidad
 */
export const obtenerAlertasOperativas = (citas = [], pagos = [], presupuestos = []) => {
  const alertasCitas = obtenerAlertasCitasSinConfirmar(citas)
  const alertasDeuda = obtenerAlertasDeudaPendiente(pagos, presupuestos)
  const alertasPostOp = obtenerAlertasPostOperatorios(citas)

  const todasAlertas = [...alertasCitas, ...alertasDeuda, ...alertasPostOp]

  // Ordenar por severidad: alta > media > baja
  const ordenSeveridad = { alta: 0, media: 1, baja: 2 }
  return todasAlertas.sort((a, b) => ordenSeveridad[a.severidad] - ordenSeveridad[b.severidad])
}
