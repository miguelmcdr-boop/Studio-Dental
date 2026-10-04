/**
 * useSidebarCounters — Contadores del Sidebar (F10-B2.5)
 *
 * Devuelve contadores derivados de los servicios:
 * - agenda: citas del día actual
 * - inventario: items con stock < stockMinimo
 * - papelera: pacientes eliminados pendientes (async Supabase)
 *
 * Escucha eventos 'storage' + 'citas_actualizadas' para refrescar agenda.
 * Papelera se refresca al montar y al escuchar 'pacientes_actualizados'.
 */
import { useState, useEffect, useCallback } from 'react'
import { agendaStorageService } from '../domains/operations/agenda/services/agendaStorageService'
import { inventarioStorageService } from '../domains/operations/inventory/services/inventarioStorageService'
import { listarPacientesEliminados } from '../domains/clinical/patient/services/pacientesSoftDeleteService'
import { obtenerFechaLocalISO } from '../utils/dateUtils'
import { createLogger } from '../infrastructure/logging/logger'

const log = createLogger('useSidebarCounters')

export interface SidebarCountersReturn {
  agenda: number
  inventario: number
  papelera: number
  refrescar: () => void
  refrescarPapelera: () => Promise<void>
}

interface CitaItem {
  fecha?: string
  [key: string]: unknown
}

interface InventarioItem {
  cantidad?: number | string
  stockActual?: number | string
  minimoCritico?: number | string
  stockMinimo?: number | string
  [key: string]: unknown
}

const contarCitasHoy = (): number => {
  try {
    const citas = (agendaStorageService?.obtenerCitas?.() || []) as CitaItem[]
    const hoy = obtenerFechaLocalISO()
    return citas.filter(c => c.fecha === hoy).length
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error('Error al contar citas del día:', msg)
    return 0
  }
}

const contarInventarioBajo = (): number => {
  try {
    const items = (inventarioStorageService?.obtenerItems?.() || []) as InventarioItem[]
    return items.filter(item => {
      const stock = parseFloat(String(item.cantidad ?? item.stockActual ?? 0)) || 0
      const minimo = parseFloat(String(item.minimoCritico ?? item.stockMinimo ?? 0)) || 0
      return minimo > 0 && stock < minimo
    }).length
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error('Error al contar inventario bajo:', msg)
    return 0
  }
}

export const useSidebarCounters = (): SidebarCountersReturn => {
  const [agenda, setAgenda] = useState<number>(0)
  const [inventario, setInventario] = useState<number>(0)
  const [papelera, setPapelera] = useState<number>(0)

  const refrescar = useCallback((): void => {
    setAgenda(contarCitasHoy())
    setInventario(contarInventarioBajo())
  }, [])

  const refrescarPapelera = useCallback(async (): Promise<void> => {
    try {
      const eliminados = await listarPacientesEliminados()
      setPapelera(Array.isArray(eliminados) ? eliminados.length : 0)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.warn('No se pudo refrescar contador de papelera:', msg)
      setPapelera(0)
    }
  }, [])

  // Carga inicial
  useEffect(() => {
    refrescar()
    void refrescarPapelera()
  }, [refrescar, refrescarPapelera])

  // Escuchar cambios de agenda (localStorage + eventos custom)
  useEffect(() => {
    const onStorage = (e: StorageEvent): void => {
      if (e.key === 'agenda_citas' || e.key === null) refrescar()
    }
    const onCitasActualizadas = (): void => refrescar()
    const onPacientesActualizados = (): void => {
      void refrescarPapelera()
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('citas_actualizadas', onCitasActualizadas)
    window.addEventListener('pacientes_actualizados', onPacientesActualizados)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('citas_actualizadas', onCitasActualizadas)
      window.removeEventListener('pacientes_actualizados', onPacientesActualizados)
    }
  }, [refrescar, refrescarPapelera])

  return { agenda, inventario, papelera, refrescar, refrescarPapelera }
}
