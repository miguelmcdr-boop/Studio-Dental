/**
 * usePresupuestoForm — Hook coordinador de formulario de presupuesto (F7-25)
 * 
 * Refactorizado en F3-02: extraída lógica de items a usePresupuestoItems.js
 * Este hook ahora solo coordina entre items y abonos.
 */
import { useState, useEffect } from 'react'
import type React from 'react'
import { prestacionesStorageService } from '../../prestaciones/services/prestacionesStorageService'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { pagosStorageService } from '../../pagos/services/pagosStorageService'
import { useEliminarAbono, type AbonoItem } from './useEliminarAbono'
import {
  usePresupuestoItems,
  type ItemPresupuesto,
  type PrestacionArancel,
  type UsePresupuestoItemsReturn
} from './usePresupuestoItems'
import type { Paciente } from '../schemas/pacienteSchema'

export type { ItemPresupuesto, PrestacionArancel, AbonoItem }

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
}

export const usePresupuestoForm = ({
  paciente,
  prestacionesProp = [],
  itemsPresupuesto = [],
  setItemsPresupuesto = () => {},
  abonos = [],
  setAbonos = () => {}
}: UsePresupuestoFormOptions): UsePresupuestoFormReturn => {
  // Estados de arancel y convenio
  const [arancelActualizado, setArancelActualizado] = useState<PrestacionArancel[]>(() => {
    const actuales = prestacionesStorageService.obtenerPrestaciones()
    return Array.isArray(actuales) && actuales.length > 0 ? (actuales as PrestacionArancel[]) : prestacionesProp
  })
  const [convenioAplicado, setConvenioAplicado] = useState<string>(paciente.prevision || 'Particular')

  // Estados de abono
  const [montoAbono, setValorAbono] = useState<string>('')
  const [metodoPagoAbono, setMetodoPagoAbono] = useState<string>('Efectivo')

  // Hook de items
  const itemsHook = usePresupuestoItems({
    paciente,
    arancelActualizado,
    convenioAplicado,
    itemsPresupuesto,
    setItemsPresupuesto
  })

  // Sincronización con arancel global (F2-07a)
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
    const abonoObj: AbonoItem = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL'),
      monto: parseInt(montoAbono, 10) || 0,
      metodoPago: metodoPagoAbono,
      pacienteNombre: paciente.nombre
    }
    const actualizados = [abonoObj, ...abonos]
    setAbonos(actualizados)
    pacientesStorageService.guardarItem(`abonos_${paciente.id}`, actualizados)

    // BUG-ABONOS-PAGOS: sincronizar con módulo Pagos
    pagosStorageService.crearPagoDesdeAbono(paciente, abonoObj)

    setValorAbono('')
  }

  const { handleEliminarAbono } = useEliminarAbono({
    abonos,
    setAbonos,
    paciente,
  })

  const handleCambiarConvenioSelect = (nuevoConvenio: string): void => {
    setConvenioAplicado(nuevoConvenio)
    itemsHook.handleCambiarConvenioSelect(nuevoConvenio)
  }

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
    setMetodoPagoAbono
  }
}
