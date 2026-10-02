/**
 * Persistencia de Presupuestos (F4-02c-4 — migración a Supabase).
 *
 * Estrategia de "caché local + sync en background":
 * - Presupuestos globales (historial completo) → migrados a Supabase
 * - Items de presupuesto → sincronizados transaccionalmente con cola offline (P1-3)
 *
 * API pública:
 * - obtenerPresupuestos()              → SÍNCRONO, retorna de caché en memoria
 * - guardarPresupuestos()              → ASYNC, escribe en Supabase + actualiza caché
 * - guardarPresupuesto()               → ASYNC, offline-first con cola pendingPresupuestos
 * - guardarItemPresupuesto()           → ASYNC, offline-first con cola pendingPresupuestoItems
 * - eliminarPresupuesto()              → ASYNC, eliminación con cola pendingDeletesPresupuestos
 * - eliminarItemPresupuesto()          → ASYNC, eliminación con cola pendingDeletesPresupuestoItems
 * - procesarColaPresupuestos()         → ASYNC, drena colas transaccionalmente
 * - procesarPendingDeletesPresupuestos()→ ASYNC, procesa eliminaciones pendientes
 * - sincronizarDesdeSupabase()         → ASYNC, refresca caché desde Supabase protegiendo pendientes
 * - resetCache()                       → limpia caché (para tests)
 */
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'
import { leerJSON, escribirJSON, createTenantRepository } from '../../../services/localStorageRepository'
import { validarListaPresupuestos } from '../schemas/presupuestoSchema'
import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'
import { migrationStorageService } from '../../../services/migrationStorageService'
import { esUuidValido } from '../../../services/migrations/uuidUtils'
import { createLogger } from '../../../services/logger'
import {
  guardarPresupuestoHelper,
  guardarItemPresupuestoHelper,
  eliminarPresupuestoHelper,
  eliminarItemPresupuestoHelper,
  procesarColaPresupuestosHelper,
  procesarPendingDeletesPresupuestosHelper,
  sincronizarPresupuestosDesdeSupabaseHelper,
  obtenerPendingPresupuestos,
  guardarPendingPresupuestos,
  obtenerPendingPresupuestoItems,
  guardarPendingPresupuestoItems,
  obtenerPendingDeletesPresupuestos,
  guardarPendingDeletesPresupuestos,
  obtenerPendingDeletesPresupuestoItems,
  guardarPendingDeletesPresupuestoItems,
  transformarPresupuestoParaSupabase
} from './presupuestosOfflineQueueService'

const log = createLogger('presupuestosStorageService')

const STORAGE_KEY_PRESUPUESTOS = 'studio_dental_presupuestos_globales'
const presupuestosRepo = createTenantRepository(STORAGE_KEY_PRESUPUESTOS, [], {
  notify: true,
  eventos: ['presupuestos_actualizados']
})

// Caché en memoria
let presupuestosCache = null
let cacheInicializado = false

const inicializarCache = (defaults) => {
  if (cacheInicializado) return
  const datos = presupuestosRepo.obtener(defaults)
  presupuestosCache = Array.isArray(datos) ? datos : defaults
  cacheInicializado = true
}

export const obtenerPresupuestos = (defaults = []) => {
  if (!cacheInicializado) {
    inicializarCache(defaults)
  }
  return presupuestosCache
}

const actualizarPresupuestosLocal = (nuevos) => {
  presupuestosCache = nuevos
  cacheInicializado = true
  presupuestosRepo.guardar(nuevos)
}

export const guardarPresupuesto = async (presupuesto) => {
  return guardarPresupuestoHelper(presupuesto, {
    obtenerPresupuestos,
    actualizarPresupuestosLocal
  })
}

export const guardarItemPresupuesto = async (item) => {
  return guardarItemPresupuestoHelper(item, {
    obtenerPresupuestos,
    actualizarPresupuestosLocal
  })
}

export const eliminarPresupuesto = async (presupuestoId) => {
  return eliminarPresupuestoHelper(presupuestoId, {
    obtenerPresupuestos,
    actualizarPresupuestosLocal
  })
}

export const eliminarItemPresupuesto = async (itemId, presupuestoId) => {
  return eliminarItemPresupuestoHelper(itemId, presupuestoId, {
    obtenerPresupuestos,
    actualizarPresupuestosLocal
  })
}

export const procesarColaPresupuestos = async () => {
  return procesarColaPresupuestosHelper({
    obtenerPresupuestos,
    actualizarPresupuestosLocal
  })
}

export const procesarPendingDeletesPresupuestos = async () => {
  return procesarPendingDeletesPresupuestosHelper()
}

export const sincronizarDesdeSupabase = async () => {
  return sincronizarPresupuestosDesdeSupabaseHelper({
    obtenerPresupuestos,
    actualizarPresupuestosLocal,
    presupuestosRepo
  })
}

export {
  obtenerPendingPresupuestos,
  guardarPendingPresupuestos,
  obtenerPendingPresupuestoItems,
  guardarPendingPresupuestoItems,
  obtenerPendingDeletesPresupuestos,
  guardarPendingDeletesPresupuestos,
  obtenerPendingDeletesPresupuestoItems,
  guardarPendingDeletesPresupuestoItems
}

export const guardarPresupuestos = async (presupuestos) => {
  const validacion = validarListaPresupuestos(presupuestos)
  if (!validacion.valido) {
    log.error('Error de validación al guardar presupuestos (F2-04e):', validacion.error)
    return false
  }
  const datos = validacion.datos

  presupuestosCache = datos
  cacheInicializado = true
  presupuestosRepo.guardar(datos)

  if (!USE_SUPABASE || !supabase) {
    return true
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return true
    }

    const aInsertar = []
    const aActualizar = []

    for (const presupuesto of datos) {
      if (esUuidValido(presupuesto.id)) {
        aActualizar.push(presupuesto)
      } else {
        aInsertar.push(presupuesto)
      }
    }

    // UPDATE en batch
    if (aActualizar.length > 0) {
      const paraUpdate = aActualizar.map((p) => transformarPresupuestoParaSupabase(p, user.id))
      const { error: updateError } = await supabase
        .from('presupuestos')
        .upsert(paraUpdate, { onConflict: 'id' })

      if (updateError) {
        log.error('Error al actualizar en Supabase:', updateError.message)
      }
    }

    // INSERT uno por uno
    for (const presupuesto of aInsertar) {
      const paraInsert = transformarPresupuestoParaSupabase(presupuesto, user.id)
      delete paraInsert.id

      const { data: insertado, error: insertError } = await supabase
        .from('presupuestos')
        .insert(paraInsert)
        .select('id')
        .single()

      if (insertError) {
        log.error('Error al insertar presupuesto:', insertError.message)
        continue
      }

      const index = presupuestosCache.findIndex((p) => !esUuidValido(p.id) &&
        p.folio === presupuesto.folio && p.pacienteId === presupuesto.pacienteId)
      if (index >= 0) {
        const legacyId = presupuestosCache[index].id
        presupuestosCache[index] = { ...presupuestosCache[index], id: insertado.id }
        migrationStorageService.registrarMapeo(legacyId, insertado.id)
      }
    }

    // P1-3: SE REMOVIÓ EL BLOQUE DESTRUCTIVO DE DIFF DELETE (idsAEliminar)
    // Las eliminaciones deben realizarse explícitamente vía pendingDeletesPresupuestos

    presupuestosRepo.guardar(presupuestosCache)
    return true
  } catch (error) {
    log.error('Excepción al guardar en Supabase:', error)
    return true
  }
}

export const resetCache = () => {
  presupuestosCache = null
  cacheInicializado = false
}

export const presupuestosStorageService = {
  obtenerPresupuestos,
  guardarPresupuestos,
  guardarPresupuesto,
  guardarItemPresupuesto,
  eliminarPresupuesto,
  eliminarItemPresupuesto,
  procesarColaPresupuestos,
  procesarPendingDeletesPresupuestos,
  sincronizarDesdeSupabase,
  resetCache,
  obtenerPendingPresupuestos,
  guardarPendingPresupuestos,
  obtenerPendingPresupuestoItems,
  guardarPendingPresupuestoItems,
  obtenerPendingDeletesPresupuestos,
  guardarPendingDeletesPresupuestos,
  obtenerPendingDeletesPresupuestoItems,
  guardarPendingDeletesPresupuestoItems,

  obtenerItemsPorPaciente: (pacienteId) => {
    if (!pacienteId) return []
    return leerJSON(`presupuesto_items_${pacienteId}`, [])
  },

  sincronizarConFichaPaciente: (pacienteId, items, convenio = 'Particular') => {
    if (!pacienteId) return
    const keyItems = `presupuesto_items_${pacienteId}`
    const existentes = leerJSON(keyItems, [])

    const idsExistentes = new Set(existentes.map((i) => i.id))
    const nuevosAjustados = items.map((it) => ({
      ...it,
      convenio: it.convenio || convenio,
      estado: it.estado || 'Pendiente'
    })).filter((it) => !idsExistentes.has(it.id))

    const consolidados = [...existentes, ...nuevosAjustados]
    escribirJSON(keyItems, consolidados, { notify: true })
  },

  eliminarPresupuestoYFicha: (presupuestoId, pacienteId, itemsABorrar = []) => {
    eliminarPresupuesto(presupuestoId)

    if (pacienteId) {
      const keyItems = `presupuesto_items_${pacienteId}`
      const existentes = leerJSON(keyItems, null)
      if (existentes !== null) {
        if (itemsABorrar.length > 0) {
          const idsABorrar = new Set(itemsABorrar.map((i) => i.id))
          const filtrados = existentes.filter((i) => !idsABorrar.has(i.id))
          escribirJSON(keyItems, filtrados)
        } else {
          try {
            localStorage.removeItem(keyItems)
          } catch (e) {
            log.error(`Error al eliminar "${keyItems}" de localStorage:`, e)
          }
        }
      }
    }
  },

  actualizarEstadoPresupuesto: (presupuestoId, nuevoEstado) => {
    const guardados = presupuestosCache || presupuestosRepo.obtener([])
    const actualizados = guardados.map((p) =>
      p.id === presupuestoId ? { ...p, estado: nuevoEstado } : p
    )
    presupuestosCache = actualizados
    presupuestosRepo.guardar(actualizados)

    if (USE_SUPABASE && supabase && esUuidValido(presupuestoId)) {
      supabase.from('presupuestos').update({ estado: nuevoEstado }).eq('id', presupuestoId)
        .then(({ error }) => { if (error) log.error('Error al actualizar estado en Supabase:', error) })
    }
  },

  eliminarItemsDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`presupuesto_items_${pacienteId}`)
    } catch (e) {
      log.error(`Error al eliminar items de presupuesto del paciente ${pacienteId}:`, e)
    }
  },

  consolidarPresupuestosDesdePacientes: (pacientes = []) => {
    const consolidados = []
    pacientes.forEach((p) => {
      const items = leerJSON(`presupuesto_items_${p.id}`, [])
      const abonos = leerJSON(`abonos_${p.id}`, [])

      if (items.length > 0) {
        const total = items.reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0)
        const abonado = abonos.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0)
        const todosRealizados = items.every((i) => i.estado === 'Realizado')
        const saldoRestante = total - abonado

        let estadoCalculado = 'Emitido'
        if (todosRealizados || saldoRestante <= 0) {
          estadoCalculado = 'Aprobado'
        } else if (items.some((i) => i.estado === 'En Proceso' || i.estado === 'Realizado') || abonado > 0) {
          estadoCalculado = 'EnTratamiento'
        }

        consolidados.push({
          id: `paciente_${p.id}`,
          folio: `PRES-PAC-${p.id}`,
          pacienteId: p.id,
          pacienteNombre: p.nombre,
          pacienteRut: p.rut,
          fechaEmision: obtenerFechaLocalISO(),
          convenio: p.prevision || 'Particular',
          montoTotal: total,
          montoAbonado: abonado,
          estado: estadoCalculado,
          items,
          observacion: 'Presupuesto vinculado desde la Ficha Médica del paciente.'
        })
      }
    })
    return consolidados
  }
}
