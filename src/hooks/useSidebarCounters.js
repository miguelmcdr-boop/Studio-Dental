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
import { agendaStorageService } from '../modules/agenda/services/agendaStorageService'
import { inventarioStorageService } from '../modules/inventario/services/inventarioStorageService'
import { listarPacientesEliminados } from '../modules/pacientes/services/pacientesSoftDeleteService'
import { obtenerFechaLocalISO } from '../utils/dateUtils'
import { createLogger } from '../services/logger'

const log = createLogger('useSidebarCounters')

const contarCitasHoy = () => {
  try {
    const citas = agendaStorageService?.obtenerCitas?.() || []
    const hoy = obtenerFechaLocalISO()
    return citas.filter(c => c.fecha === hoy).length
  } catch (e) {
    log.error('Error al contar citas del día:', e.message)
    return 0
  }
}

const contarInventarioBajo = () => {
  try {
    const items = inventarioStorageService?.obtenerItems?.() || []
    return items.filter(item => {
      const stock = parseFloat(item.cantidad ?? item.stockActual) || 0
      const minimo = parseFloat(item.minimoCritico ?? item.stockMinimo) || 0
      return minimo > 0 && stock < minimo
    }).length
  } catch (e) {
    log.error('Error al contar inventario bajo:', e.message)
    return 0
  }
}

export const useSidebarCounters = () => {
  const [agenda, setAgenda] = useState(0)
  const [inventario, setInventario] = useState(0)
  const [papelera, setPapelera] = useState(0)

  const refrescar = useCallback(() => {
    setAgenda(contarCitasHoy())
    setInventario(contarInventarioBajo())
  }, [])

  const refrescarPapelera = useCallback(async () => {
    try {
      const eliminados = await listarPacientesEliminados()
      setPapelera(Array.isArray(eliminados) ? eliminados.length : 0)
    } catch (e) {
      log.warn('No se pudo refrescar contador de papelera:', e.message)
      setPapelera(0)
    }
  }, [])

  // Carga inicial
  useEffect(() => {
    refrescar()
    refrescarPapelera()
  }, [refrescar, refrescarPapelera])

  // Escuchar cambios de agenda (localStorage + eventos custom)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'agenda_citas' || e.key === null) refrescar()
    }
    const onCitasActualizadas = () => refrescar()

    window.addEventListener('storage', onStorage)
    window.addEventListener('citas_actualizadas', onCitasActualizadas)
    window.addEventListener('pacientes_actualizados', () => {
      refrescarPapelera()
    })

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('citas_actualizadas', onCitasActualizadas)
      window.removeEventListener('pacientes_actualizados', refrescarPapelera)
    }
  }, [refrescar, refrescarPapelera])

  return { agenda, inventario, papelera, refrescar, refrescarPapelera }
}
