/**
 * Utilidades para cálculo de contadores y badges del Sidebar (Blueprint 02 §05)
 * Límite constitucional: ≤50 líneas
 */
import { esterilizacionStorageService } from '../../domains/operations/sterilization/services/esterilizacionStorageService'
import { comunicacionesStorageService } from '../../domains/operations/communications/services/comunicacionesStorageService'
import { pagosStorageService, type Pago } from '../../domains/billing/payment/services/pagosStorageService'

export const contarCiclosEsterilizacionPendientes = (): number => {
  try {
    const cargas = esterilizacionStorageService.obtenerCargas()
    return Array.isArray(cargas)
      ? cargas.filter((c) => c.estado === 'en_proceso' || c.estado === 'pendiente').length
      : 0
  } catch {
    return 0
  }
}

export const contarMensajesNoLeidos = (): number => {
  try {
    const historial = comunicacionesStorageService.obtenerHistorial()
    return Array.isArray(historial)
      ? historial.filter((m) => (m as { leido?: boolean }).leido === false || m.estado === 'pendiente').length
      : 0
  } catch {
    return 0
  }
}

export const contarPagosVencidos = (): number => {
  try {
    const pagos = pagosStorageService.obtenerPagos() as Pago[]
    return Array.isArray(pagos)
      ? pagos.filter((p) => p.estado === 'vencido' || p.estado === 'pendiente_cobro').length
      : 0
  } catch {
    return 0
  }
}
