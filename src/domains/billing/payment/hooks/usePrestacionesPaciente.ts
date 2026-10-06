/**
 * usePrestacionesPaciente — Hook para gestionar prestaciones del plan de tratamiento (Commit G1)
 *
 * Extraído de ModalNuevoPago.jsx para reducir su tamaño de 250 a ~199 líneas.
 * Maneja la carga de prestaciones desde presupuestosStorageService y la
 * selección múltiple para imputación de pagos.
 */
import { useState, useEffect } from 'react'
import {
  presupuestosStorageService,
  type PresupuestoItemLocal
} from '../../budget/services/presupuestosStorageService'
import { createLogger } from '../../../../infrastructure/logging/logger'

const log = createLogger('usePrestacionesPaciente')

export type { PresupuestoItemLocal }

export interface PagoEditarRef {
  prestacionesImputadas?: string[]
  [key: string]: unknown
}

export interface UsePrestacionesPacienteReturn {
  prestacionesPaciente: PresupuestoItemLocal[]
  prestacionesSeleccionadas: string[]
  handleTogglePrestacion: (labelItem: string) => void
  resetPrestaciones: (arrayInicial?: string[]) => void
}

export const usePrestacionesPaciente = (
  pacienteId?: string | number | null,
  pagoEditar: PagoEditarRef | null = null
): UsePrestacionesPacienteReturn => {
  const [prestacionesPaciente, setPrestacionesPaciente] = useState<PresupuestoItemLocal[]>([])
  const [prestacionesSeleccionadas, setPrestacionesSeleccionadas] = useState<string[]>([])

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

  const handleTogglePrestacion = (labelItem: string): void => {
    if (prestacionesSeleccionadas.includes(labelItem)) {
      setPrestacionesSeleccionadas(prestacionesSeleccionadas.filter(i => i !== labelItem))
    } else {
      setPrestacionesSeleccionadas([...prestacionesSeleccionadas, labelItem])
    }
  }

  const resetPrestaciones = (arrayInicial: string[] = []): void => {
    setPrestacionesSeleccionadas(arrayInicial)
  }

  return {
    prestacionesPaciente,
    prestacionesSeleccionadas,
    handleTogglePrestacion,
    resetPrestaciones
  }
}
