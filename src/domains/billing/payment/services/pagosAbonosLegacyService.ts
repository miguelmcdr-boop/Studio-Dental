/**
 * pagosAbonosLegacyService — Servicio legacy de abonos por paciente (F4-02d pendiente)
 *
 * Extraído de pagosStorageService.js para cumplir límite arquitectónico (F3-02).
 * Estos métodos gestionan abonos en localStorage (claves dinámicas `abonos_{pacienteId}`).
 *
 * Migración pendiente F4-02d: mover a Supabase cuando se complete la migración.
 *
 * API pública:
 * - obtenerAbonosPorPaciente(pacienteId)
 * - sincronizarAbonoConFichaPaciente(pacienteId, nuevoPago)
 * - eliminarAbonosDePaciente(pacienteId)
 * - eliminarAbono(pacienteId, abonoId)
 * - removerAbonoDeFichaPaciente(pacienteId, abonoId)
 */
import { leerJSON, escribirJSON } from '../../../../services/localStorageRepository'
import { createLogger } from '../../../../services/logger'

const log = createLogger('pagosAbonosLegacyService')

export interface AbonoFicha {
  id: string | number
  fecha: string
  monto: number
  metodoPago: string
  pacienteNombre: string
  [key: string]: unknown
}

export interface NuevoPagoAbono {
  id: string | number
  fecha: string
  monto: number
  metodoPago: string
  folioComprobante?: string | number
  pacienteNombre: string
  [key: string]: unknown
}

/**
 * Lee los abonos de un paciente específico (clave dinámica).
 * Nota: sigue usando localStorage (se migrará en F4-02d)
 */
export const obtenerAbonosPorPaciente = (pacienteId?: string | number | null): AbonoFicha[] => {
  if (!pacienteId) return []
  return leerJSON<AbonoFicha[]>(`abonos_${pacienteId}`, [])
}

/**
 * Sincroniza el abono directamente en la ficha del paciente para actualizar su saldo.
 * Nota: sigue usando localStorage (se migrará en F4-02d)
 */
export const sincronizarAbonoConFichaPaciente = (
  pacienteId: string | number | null | undefined,
  nuevoPago: NuevoPagoAbono
): void => {
  if (!pacienteId) return
  const keyAbonos = `abonos_${pacienteId}`
  const abonosActuales = leerJSON<AbonoFicha[]>(keyAbonos, [])

  const folio = nuevoPago.folioComprobante ? ` (${nuevoPago.folioComprobante})` : ''
  const abonoObj: AbonoFicha = {
    id: nuevoPago.id,
    fecha: nuevoPago.fecha,
    monto: nuevoPago.monto,
    metodoPago: `${nuevoPago.metodoPago}${folio}`,
    pacienteNombre: nuevoPago.pacienteNombre
  }

  // Dedup por id: reemplaza abono existente con mismo id (evita duplicados)
  const sinDuplicados = abonosActuales.filter(a => String(a.id) !== String(nuevoPago.id))
  escribirJSON(keyAbonos, [abonoObj, ...sinDuplicados], { notify: true })
}

/**
 * Elimina todos los abonos de un paciente (F2-07d).
 * Nota: sigue usando localStorage (se migrará en F4-02d)
 */
export const eliminarAbonosDePaciente = (pacienteId?: string | number | null): void => {
  if (!pacienteId) return
  try {
    localStorage.removeItem(`abonos_${pacienteId}`)
  } catch (e: unknown) {
    log.error(`Error al eliminar abonos del paciente ${pacienteId}:`, e)
  }
}

/**
 * Elimina un abono específico de la ficha del paciente (F10-C3.12)
 */
export const eliminarAbono = (
  pacienteId: string | number | null | undefined,
  abonoId: string | number | null | undefined
): void => {
  if (!pacienteId || !abonoId) return
  const key = `abonos_${pacienteId}`
  const actuales = leerJSON<AbonoFicha[]>(key, [])
  escribirJSON(key, actuales.filter(a => String(a.id) !== String(abonoId)), { notify: true })
}

/**
 * Remueve abono de ficha al anular/purgar el pago asociado (Commit C)
 */
export const removerAbonoDeFichaPaciente = (
  pacienteId: string | number | null | undefined,
  abonoId: string | number | null | undefined
): boolean => {
  if (!pacienteId || !abonoId) return false
  const key = `abonos_${pacienteId}`
  const actuales = leerJSON<AbonoFicha[]>(key, [])
  const filtrados = actuales.filter(a => String(a.id) !== String(abonoId))
  if (filtrados.length === actuales.length) return false
  escribirJSON(key, filtrados, { notify: true })
  return true
}
