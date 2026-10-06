/**
 * Alertas Operativas Utils — F7-27
 *
 * Detecta alertas operativas críticas para el Dashboard.
 * Tipos: citas sin confirmar, deuda pendiente, post-operatorios pendientes.
 *
 * Uso:
 *   import { obtenerAlertasOperativas } from './alertasOperativas'
 *
 *   const alertas = obtenerAlertasOperativas(citas, pagos, presupuestos)
 */

export interface CitaParaAlertas {
  id?: string | number
  fecha?: string
  horaInicio?: string
  boxAsignado?: string
  pacienteId?: string | number | null
  pacienteNombre?: string
  trataMiento?: string
  confirmada?: boolean
  estado?: string
  postOperatorioEnviado?: boolean
  [key: string]: unknown
}

export interface PagoParaAlertas {
  pacienteId?: string | number | null
  estado?: string
  monto?: number | string
  [key: string]: unknown
}

export interface PresupuestoParaAlertas {
  pacienteId?: string | number | null
  estado?: string
  total?: number | string
  [key: string]: unknown
}

export type SeveridadAlerta = 'alta' | 'media' | 'baja'
export type TipoAlertaOperativa = 'cita_sin_confirmar' | 'deuda_pendiente' | 'post_operatorio_pendiente'

export interface AlertaOperativaItem {
  tipo: TipoAlertaOperativa
  severidad: SeveridadAlerta
  titulo: string
  descripcion: string
  fecha?: string
  citaId?: string | number
  pacienteId?: string | number | null
  monto?: number
}

/**
 * Obtiene alertas de citas sin confirmar (últimas 24h).
 */
const obtenerAlertasCitasSinConfirmar = (citas: CitaParaAlertas[] = []): AlertaOperativaItem[] => {
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
      descripcion: `${cita.pacienteNombre || 'Paciente'} - ${cita.horaInicio || 'Sin hora'} - ${cita.boxAsignado || 'Sin box'}`,
      fecha: cita.fecha,
      citaId: cita.id,
      pacienteId: cita.pacienteId,
    }))
}

/**
 * Obtiene alertas de pacientes con deuda pendiente > $50.000.
 */
const obtenerAlertasDeudaPendiente = (
  pagos: PagoParaAlertas[] = [],
  presupuestos: PresupuestoParaAlertas[] = []
): AlertaOperativaItem[] => {
  const deudaPorPaciente = new Map<string | number, number>()

  // Sumar presupuestos aceptados por paciente
  presupuestos
    .filter((p) => p.estado === 'Aceptado' || p.estado === 'En Proceso' || p.estado === 'Finalizado')
    .forEach((p) => {
      if (p.pacienteId === undefined || p.pacienteId === null) return
      const total = parseFloat(String(p.total)) || 0
      deudaPorPaciente.set(p.pacienteId, (deudaPorPaciente.get(p.pacienteId) || 0) + total)
    })

  // Restar pagos realizados por paciente
  pagos
    .filter((p) => p.estado !== 'Anulado')
    .forEach((p) => {
      if (p.pacienteId === undefined || p.pacienteId === null) return
      const monto = parseFloat(String(p.monto)) || 0
      deudaPorPaciente.set(p.pacienteId, (deudaPorPaciente.get(p.pacienteId) || 0) - monto)
    })

  // Filtrar pacientes con deuda > $50.000
  const alertas: AlertaOperativaItem[] = []
  deudaPorPaciente.forEach((deuda, pacienteId) => {
    if (deuda > 50000) {
      alertas.push({
        tipo: 'deuda_pendiente',
        severidad: 'alta',
        titulo: 'Deuda pendiente',
        descripcion: `Paciente ID ${String(pacienteId)} - Deuda: $${deuda.toLocaleString('es-CL')} CLP`,
        pacienteId: pacienteId,
        monto: deuda,
      })
    }
  })

  return alertas
}

/**
 * Obtiene alertas de post-operatorios por enviar (últimas 48h).
 */
const obtenerAlertasPostOperatorios = (citas: CitaParaAlertas[] = []): AlertaOperativaItem[] => {
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
 * @param citas - Array de citas
 * @param pagos - Array de pagos
 * @param presupuestos - Array de presupuestos
 * @returns Array de alertas ordenadas por severidad
 */
export const obtenerAlertasOperativas = (
  citas: CitaParaAlertas[] = [],
  pagos: PagoParaAlertas[] = [],
  presupuestos: PresupuestoParaAlertas[] = []
): AlertaOperativaItem[] => {
  const alertasCitas = obtenerAlertasCitasSinConfirmar(citas)
  const alertasDeuda = obtenerAlertasDeudaPendiente(pagos, presupuestos)
  const alertasPostOp = obtenerAlertasPostOperatorios(citas)

  const todasAlertas = [...alertasCitas, ...alertasDeuda, ...alertasPostOp]

  // Ordenar por severidad: alta > media > baja
  const ordenSeveridad: Record<SeveridadAlerta, number> = { alta: 0, media: 1, baja: 2 }
  return todasAlertas.sort((a, b) => ordenSeveridad[a.severidad] - ordenSeveridad[b.severidad])
}
