/**
 * Persistencia aislada y sincronización con Ficha del Paciente
 */

const STORAGE_KEY_PAGOS = 'studio_dental_pagos_historial_v3'

export const pagosStorageService = {
  obtenerPagos: (defaults = []) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PAGOS)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer historial de pagos:', e)
      return defaults
    }
  },

  guardarPagos: (pagos) => {
    try {
      localStorage.setItem(STORAGE_KEY_PAGOS, JSON.stringify(pagos))
    } catch (e) {
      console.error('Error al guardar pagos:', e)
    }
  },

  // Sincroniza el abono directamente en la ficha del paciente para actualizar su saldo
  sincronizarAbonoConFichaPaciente: (pacienteId, nuevoPago) => {
    if (!pacienteId) return
    try {
      const keyAbonos = `abonos_${pacienteId}`
      const savedAbonos = localStorage.getItem(keyAbonos)
      const abonosActuales = savedAbonos ? JSON.parse(savedAbonos) : []

      const abonoObj = {
        id: nuevoPago.id,
        fecha: nuevoPago.fecha,
        monto: nuevoPago.monto,
        metodoPago: `${nuevoPago.metodoPago} (${nuevoPago.folioComprobante})`,
        pacienteNombre: nuevoPago.pacienteNombre
      }

      localStorage.setItem(keyAbonos, JSON.stringify([abonoObj, ...abonosActuales]))
      window.dispatchEvent(new Event('storage'))
    } catch (e) {
      console.error('Error al sincronizar abono con ficha del paciente:', e)
    }
  }
}