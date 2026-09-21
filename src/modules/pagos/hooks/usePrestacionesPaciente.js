/**
 * usePrestacionesPaciente — Hook para gestionar prestaciones del plan de tratamiento (Commit G1)
 *
 * Extraído de ModalNuevoPago.jsx para reducir su tamaño de 250 a ~199 líneas.
 * Maneja la carga de prestaciones desde presupuestosStorageService y la
 * selección múltiple para imputación de pagos.
 *
 * @param {string|number} pacienteId - ID del paciente seleccionado
 * @param {Object|null} pagoEditar - Pago en modo edición (para preseleccionar prestaciones)
 * @returns {{
 *   prestacionesPaciente: Array,
 *   prestacionesSeleccionadas: Array,
 *   handleTogglePrestacion: (labelItem: string) => void,
 *   resetPrestaciones: (arrayInicial: string[]) => void
 * }}
 */
import { useState, useEffect } from 'react'
import { presupuestosStorageService } from '../../presupuestos/services/presupuestosStorageService'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('usePrestacionesPaciente')

export const usePrestacionesPaciente = (pacienteId, pagoEditar = null) => {
  const [prestacionesPaciente, setPrestacionesPaciente] = useState([])
  const [prestacionesSeleccionadas, setPrestacionesSeleccionadas] = useState([])

  // Carga de prestaciones desde el plan de tratamiento del paciente (vía servicio, F2-07a)
  useEffect(() => {
    if (!pacienteId) {
      setPrestacionesPaciente([])
      return
    }

    try {
      const items = presupuestosStorageService.obtenerItemsPorPaciente(pacienteId)
      if (Array.isArray(items)) {
        setPrestacionesPaciente(items)
      } else {
        setPrestacionesPaciente([])
      }
    } catch (e) {
      log.error(e)
      setPrestacionesPaciente([])
    }
  }, [pacienteId])

  // Preseleccionar prestaciones en modo edición
  useEffect(() => {
    if (pagoEditar?.prestacionesImputadas) {
      setPrestacionesSeleccionadas(pagoEditar.prestacionesImputadas)
    }
  }, [pagoEditar])

  const handleTogglePrestacion = (labelItem) => {
    if (prestacionesSeleccionadas.includes(labelItem)) {
      setPrestacionesSeleccionadas(prestacionesSeleccionadas.filter(i => i !== labelItem))
    } else {
      setPrestacionesSeleccionadas([...prestacionesSeleccionadas, labelItem])
    }
  }

  const resetPrestaciones = (arrayInicial = []) => {
    setPrestacionesSeleccionadas(arrayInicial)
  }

  return {
    prestacionesPaciente,
    prestacionesSeleccionadas,
    handleTogglePrestacion,
    resetPrestaciones
  }
}
