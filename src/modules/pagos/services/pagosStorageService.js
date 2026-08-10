/**
 * Persistencia aislada y sincronización con Ficha del Paciente
 */
import { leerJSON, escribirJSON, createLocalStorageRepository } from '../../../services/localStorageRepository'

const STORAGE_KEY_PAGOS = 'studio_dental_pagos_historial_v3'
const pagosRepo = createLocalStorageRepository(STORAGE_KEY_PAGOS, [])

export const pagosStorageService = {
  obtenerPagos: (defaults = []) => pagosRepo.obtener(defaults),

  guardarPagos: (pagos) => pagosRepo.guardar(pagos),

  // Lee los abonos de un paciente específico (clave dinámica)
  obtenerAbonosPorPaciente: (pacienteId) => {
    if (!pacienteId) return []
    return leerJSON(`abonos_${pacienteId}`, [])
  },

  // Sincroniza el abono directamente en la ficha del paciente para actualizar su saldo
  sincronizarAbonoConFichaPaciente: (pacienteId, nuevoPago) => {
    if (!pacienteId) return
    const keyAbonos = `abonos_${pacienteId}`
    const abonosActuales = leerJSON(keyAbonos, [])

    const abonoObj = {
      id: nuevoPago.id,
      fecha: nuevoPago.fecha,
      monto: nuevoPago.monto,
      metodoPago: `${nuevoPago.metodoPago} (${nuevoPago.folioComprobante})`,
      pacienteNombre: nuevoPago.pacienteNombre
    }

    escribirJSON(keyAbonos, [abonoObj, ...abonosActuales], { notify: true })
  },

  // Elimina todos los abonos de un paciente (F2-07d)
  eliminarAbonosDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`abonos_${pacienteId}`)
    } catch (e) {
      console.error(`Error al eliminar abonos del paciente ${pacienteId}:`, e)
    }
  }
}