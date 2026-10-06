/**
 * usePresupuestoForm — Hook coordinador de formulario de presupuesto (F7-25, Fase 5C)
 * Delega orquestación a `treatmentPlan` y `registerTreatmentPayment`.
 */
import { useState, useEffect, useCallback } from 'react'
import type React from 'react'
import { prestacionesStorageService } from '../../../../domains/organization/prestations/services/prestacionesStorageService'
import { registrarPagoTratamiento } from '../../../../application/billing'
import {
  createTreatmentPlan,
  updateTreatmentPlan,
  deleteTreatmentPlan,
  type TreatmentPlanInput,
  type TreatmentPlanResult,
} from '../../../../application/treatment'
import { useEliminarAbono, type AbonoItem } from './useEliminarAbono'
import {
  usePresupuestoItems,
  type ItemPresupuesto,
  type PrestacionArancel,
  type UsePresupuestoItemsReturn
} from './usePresupuestoItems'
import type { Paciente } from '../schemas/pacienteSchema'

export type { ItemPresupuesto, PrestacionArancel, AbonoItem, TreatmentPlanInput, TreatmentPlanResult }

export interface UsePresupuestoFormOptions {
  paciente: Paciente | { id: string | number; nombre: string; prevision?: string | null; [key: string]: unknown }
  prestacionesProp?: PrestacionArancel[]
  itemsPresupuesto?: ItemPresupuesto[]
  setItemsPresupuesto?: (items: ItemPresupuesto[]) => void
  abonos?: AbonoItem[]
  setAbonos?: (abonos: AbonoItem[]) => void
}

export interface UsePresupuestoFormReturn extends UsePresupuestoItemsReturn {
  arancelActualizado: PrestacionArancel[]
  convenioAplicado: string
  montoAbono: string | number
  metodoPagoAbono: string
  handleAgregarAbono: (e: React.FormEvent) => void
  handleEliminarAbono: (idAbono: string | number) => Promise<void>
  handleCambiarConvenioSelect: (nuevoConvenio: string) => void
  setValorAbono: (monto: string) => void
  setMetodoPagoAbono: (metodo: string) => void
  guardarPlanTratamiento: (descuento?: number) => Promise<TreatmentPlanResult>
  actualizarPlanTratamiento: (id: string, updates: Partial<TreatmentPlanInput>) => Promise<TreatmentPlanResult>
  eliminarPlanTratamiento: (id: string) => Promise<void>
}

export const usePresupuestoForm = ({
  paciente,
  prestacionesProp = [],
  itemsPresupuesto = [],
  setItemsPresupuesto = () => {},
  abonos = [],
  setAbonos = () => {}
}: UsePresupuestoFormOptions): UsePresupuestoFormReturn => {
  const [arancelActualizado, setArancelActualizado] = useState<PrestacionArancel[]>(() => {
    const actuales = prestacionesStorageService.obtenerPrestaciones()
    return Array.isArray(actuales) && actuales.length > 0 ? (actuales as PrestacionArancel[]) : prestacionesProp
  })
  const [convenioAplicado, setConvenioAplicado] = useState<string>(paciente.prevision || 'Particular')
  const [montoAbono, setValorAbono] = useState<string>('')
  const [metodoPagoAbono, setMetodoPagoAbono] = useState<string>('Efectivo')

  const itemsHook = usePresupuestoItems({
    paciente,
    arancelActualizado,
    convenioAplicado,
    itemsPresupuesto,
    setItemsPresupuesto
  })

  useEffect(() => {
    const handleRefrescarArancel = (): void => {
      const actuales = prestacionesStorageService.obtenerPrestaciones()
      if (Array.isArray(actuales) && actuales.length > 0) setArancelActualizado(actuales as PrestacionArancel[])
    }
    window.addEventListener('storage', handleRefrescarArancel)
    window.addEventListener('arancel_actualizado', handleRefrescarArancel)
    return () => {
      window.removeEventListener('storage', handleRefrescarArancel)
      window.removeEventListener('arancel_actualizado', handleRefrescarArancel)
    }
  }, [])

  useEffect(() => {
    if (prestacionesProp?.length > 0) setArancelActualizado(prestacionesProp)
  }, [prestacionesProp])

  const handleAgregarAbono = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!montoAbono) return
    const { abonosActualizados } = registrarPagoTratamiento({
      paciente,
      monto: montoAbono,
      metodoPago: metodoPagoAbono,
      abonosPrevios: abonos,
    })
    setAbonos(abonosActualizados)
    setValorAbono('')
  }

  const { handleEliminarAbono } = useEliminarAbono({ abonos, setAbonos, paciente })

  const handleCambiarConvenioSelect = (nuevoConvenio: string): void => {
    setConvenioAplicado(nuevoConvenio)
    itemsHook.handleCambiarConvenioSelect(nuevoConvenio)
  }

  const guardarPlanTratamiento = useCallback(async (descuento = 0): Promise<TreatmentPlanResult> => {
    return createTreatmentPlan({
      pacienteId: paciente.id,
      prestaciones: itemsPresupuesto.map((i) => ({ prestacionId: i.id, piezaDental: typeof i.piezaDental === 'string' ? i.piezaDental : undefined, cantidad: 1 })),
      convenioId: convenioAplicado,
      descuento,
    })
  }, [paciente.id, itemsPresupuesto, convenioAplicado])

  const actualizarPlanTratamiento = useCallback(async (id: string, updates: Partial<TreatmentPlanInput>) => {
    return updateTreatmentPlan(id, updates)
  }, [])

  const eliminarPlanTratamiento = useCallback(async (id: string) => {
    return deleteTreatmentPlan(id)
  }, [])

  return {
    ...itemsHook,
    arancelActualizado,
    convenioAplicado,
    montoAbono,
    metodoPagoAbono,
    handleAgregarAbono,
    handleEliminarAbono,
    handleCambiarConvenioSelect,
    setValorAbono,
    setMetodoPagoAbono,
    guardarPlanTratamiento,
    actualizarPlanTratamiento,
    eliminarPlanTratamiento,
  }
}
