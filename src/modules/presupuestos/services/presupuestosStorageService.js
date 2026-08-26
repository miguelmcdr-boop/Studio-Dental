/**
 * Persistencia de Presupuestos (F4-02c-4 — migración a Supabase).
 *
 * Estrategia de "caché local + sync en background" (alineada con pacientesStorageService):
 *
 *   localStorage (caché rápida, síncrona)
 *          ↕
 *   Caché en memoria (variable de módulo)
 *          ↕ (async, on-demand)
 *   Supabase (fuente de verdad)
 *
 * API pública:
 * - obtenerPresupuestos()        → SÍNCRONO, retorna de caché en memoria
 * - guardarPresupuestos()        → ASYNC, escribe en Supabase + actualiza caché
 * - sincronizarDesdeSupabase()   → ASYNC, refresca caché desde Supabase
 * - resetCache()                 → limpia caché (para tests)
 *
 * Nota: Los métodos relacionados con items (obtenerItemsPorPaciente,
 * sincronizarConFichaPaciente, eliminarPresupuestoYFicha, eliminarItemsDePaciente)
 * SIGUEN usando localStorage en esta fase. Se migrarán completamente en F4-02d
 * cuando refactoricemos los componentes que los usan directamente.
 *
 * Modo dual (VITE_USE_SUPABASE):
 * - true: usa Supabase como fuente de verdad, localStorage como caché
 * - false: usa localStorage como fuente de verdad (legacy)
 */
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'
import { leerJSON, escribirJSON, createLocalStorageRepository } from '../../../services/localStorageRepository'
import { validarListaPresupuestos } from '../schemas/presupuestoSchema'
import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'
import { migrationStorageService } from '../../../services/migrationStorageService'
import { esUuidValido } from '../../../services/migrations/uuidUtils'
import { createLogger } from '../../../services/logger'

const log = createLogger('presupuestosStorageService')

const STORAGE_KEY_PRESUPUESTOS = 'studio_dental_presupuestos_globales'
const presupuestosRepo = createLocalStorageRepository(STORAGE_KEY_PRESUPUESTOS, [], {
  notify: true,
  eventos: ['presupuestos_actualizados']
})

// Caché en memoria: evita lecturas repetidas de localStorage
let presupuestosCache = null
let cacheInicializado = false

// ═══════════════════════════════════════════════════════════════════
// MAPEO DE CAMPOS (camelCase JS ↔ snake_case SQL)
// ═══════════════════════════════════════════════════════════════════

const SNAKE_TO_CAMEL_MAP = {
  paciente_id: 'pacienteId',
  paciente_nombre: 'pacienteNombre',
  paciente_rut: 'pacienteRut',
  fecha_emision: 'fechaEmision',
  monto_total: 'montoTotal',
  monto_abonado: 'montoAbonado',
  user_id: 'userId',
  created_at: 'createdAt',
  updated_at: 'updatedAt'
}

const CAMEL_TO_SNAKE_MAP = Object.fromEntries(
  Object.entries(SNAKE_TO_CAMEL_MAP).map(([snake, camel]) => [camel, snake])
)

/**
 * Convierte un presupuesto de Supabase (snake_case) a formato JS (camelCase).
 */
const transformarDesdeSupabase = (presupuestoDb) => {
  if (!presupuestoDb) return null
  const resultado = {}
  for (const [claveDb, valor] of Object.entries(presupuestoDb)) {
    const claveJs = SNAKE_TO_CAMEL_MAP[claveDb] || claveDb
    resultado[claveJs] = valor
  }
  return resultado
}

/**
 * Convierte un presupuesto de formato JS (camelCase) a Supabase (snake_case).
 */
const transformarParaSupabase = (presupuestoJs) => {
  if (!presupuestoJs) return null
  const resultado = {}
  for (const [claveJs, valor] of Object.entries(presupuestoJs)) {
    if (claveJs === 'createdAt' || claveJs === 'updatedAt' || claveJs === 'userId' || claveJs === 'items') {
      continue
    }
    const claveDb = CAMEL_TO_SNAKE_MAP[claveJs] || claveJs
    if (claveJs === 'pacienteId') {
      // Resolver pacienteId: si es legacy, buscar en el mapa de migración
      if (esUuidValido(valor)) {
        resultado.paciente_id = valor
      } else if (valor !== null && valor !== undefined) {
        const pacienteUuid = migrationStorageService.obtenerSupabaseId(valor)
        resultado.paciente_id = pacienteUuid || null
      } else {
        resultado.paciente_id = null
      }
    } else if (valor === '' || valor === null || valor === undefined) {
      resultado[claveDb] = null
    } else {
      resultado[claveDb] = valor
    }
  }
  return resultado
}

// ═══════════════════════════════════════════════════════════════════
// INICIALIZACIÓN DE CACHÉ
// ═══════════════════════════════════════════════════════════════════

const inicializarCache = (defaults) => {
  if (cacheInicializado) return
  const datos = presupuestosRepo.obtener(defaults)
  presupuestosCache = Array.isArray(datos) ? datos : defaults
  cacheInicializado = true
}

// ═══════════════════════════════════════════════════════════════════
// OBTENER PRESUPUESTOS (SÍNCRONO)
// ═══════════════════════════════════════════════════════════════════

/**
 * Obtiene la lista de presupuestos desde la caché en memoria.
 * SIEMPRE SÍNCRONO: nunca bloquea la UI.
 */
const obtenerPresupuestos = (defaults = []) => {
  if (!cacheInicializado) {
    inicializarCache(defaults)
  }
  return presupuestosCache
}

// ═══════════════════════════════════════════════════════════════════
// SINCRONIZAR DESDE SUPABASE (ASYNC)
// ═══════════════════════════════════════════════════════════════════

/**
 * Refresca la caché de presupuestos desde Supabase.
 * Útil después del login, después de migración, o al recibir eventos Realtime.
 */
const sincronizarDesdeSupabase = async () => {
  if (!USE_SUPABASE || !supabase) {
    return presupuestosCache
  }

  try {
    const { data, error } = await supabase
      .from('presupuestos')
      .select('*')
      .order('fecha_emision', { ascending: false })

    if (error) {
      log.warn('Error al sincronizar desde Supabase:', error.message)
      return presupuestosCache
    }

    if (!Array.isArray(data)) return presupuestosCache

    // Si Supabase retorna vacío pero hay caché con datos, puede ser que la
    // migración aún no haya corrido. No sobrescribimos la caché.
    if (data.length === 0 && presupuestosCache && presupuestosCache.length > 0) {
      log.info('Supabase vacío, manteniendo caché (pendiente migración)')
      return presupuestosCache
    }

    const nuevos = data.map(transformarDesdeSupabase).filter(Boolean)
    presupuestosCache = nuevos
    presupuestosRepo.guardar(nuevos)

    return nuevos
  } catch (error) {
    log.error('Excepción al sincronizar desde Supabase:', error)
    return presupuestosCache
  }
}

// ═══════════════════════════════════════════════════════════════════
// GUARDAR PRESUPUESTOS (ASYNC con actualización de caché síncrona)
// ═══════════════════════════════════════════════════════════════════

/**
 * Guarda la lista completa de presupuestos.
 *
 * 1. Actualiza caché en memoria (síncrono) — UX optimista
 * 2. Persiste en localStorage como caché persistente
 * 3. Si Supabase activo, sincroniza en background (no bloquea)
 */
const guardarPresupuestos = async (presupuestos) => {
  // Validación Zod antes de persistir
  const validacion = validarListaPresupuestos(presupuestos)
  if (!validacion.valido) {
    log.error('Error de validación al guardar presupuestos (F2-04e):', validacion.error)
    return false
  }
  const datos = validacion.datos

  // 1. Actualizar caché en memoria inmediatamente
  presupuestosCache = datos
  cacheInicializado = true

  // 2. Persistir en localStorage como caché
  presupuestosRepo.guardar(datos)

  if (!USE_SUPABASE || !supabase) {
    return true
  }

  // 3. Sincronizar con Supabase en background
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return true
    }

    const aInsertar = []
    const aActualizar = []
    const idsEnMemoria = new Set()

    for (const presupuesto of datos) {
      if (esUuidValido(presupuesto.id)) {
        aActualizar.push(presupuesto)
        idsEnMemoria.add(presupuesto.id)
      } else {
        aInsertar.push(presupuesto)
      }
    }

    // UPDATE en batch
    if (aActualizar.length > 0) {
      const paraUpdate = aActualizar.map(p => ({
        ...transformarParaSupabase(p),
        user_id: user.id
      }))

      const { error: updateError } = await supabase
        .from('presupuestos')
        .upsert(paraUpdate, { onConflict: 'id' })

      if (updateError) {
        log.error('Error al actualizar en Supabase:', updateError.message)
      }
    }

    // INSERT uno por uno
    for (const presupuesto of aInsertar) {
      const paraInsert = {
        ...transformarParaSupabase(presupuesto),
        user_id: user.id
      }
      delete paraInsert.id

      const { data: insertado, error: insertError } = await supabase
        .from('presupuestos')
        .insert(paraInsert)
        .select('id')
        .single()

      if (insertError) {
        log.error(`Error al insertar presupuesto:`, insertError.message)
        continue
      }

      // Actualizar el presupuesto en caché con el nuevo UUID
      const index = presupuestosCache.findIndex(p => !esUuidValido(p.id) &&
        p.folio === presupuesto.folio && p.pacienteId === presupuesto.pacienteId)
      if (index >= 0) {
        const legacyId = presupuestosCache[index].id
        presupuestosCache[index] = { ...presupuestosCache[index], id: insertado.id }
        migrationStorageService.registrarMapeo(legacyId, insertado.id)
      }
    }

    // DELETE presupuestos eliminados
    const { data: presupuestosSupabase } = await supabase
      .from('presupuestos')
      .select('id')

    if (Array.isArray(presupuestosSupabase)) {
      const idsAEliminar = presupuestosSupabase
        .map(p => p.id)
        .filter(id => !idsEnMemoria.has(id))

      if (idsAEliminar.length > 0) {
        const { error: deleteError } = await supabase
          .from('presupuestos')
          .delete()
          .in('id', idsAEliminar)

        if (deleteError) {
          log.error('Error al eliminar en Supabase:', deleteError.message)
        }
      }
    }

    // Persistir la caché actualizada (con UUIDs nuevos)
    presupuestosRepo.guardar(presupuestosCache)

    return true
  } catch (error) {
    log.error('Excepción al guardar en Supabase:', error)
    return true
  }
}

// ═══════════════════════════════════════════════════════════════════
// RESET CACHE (para tests)
// ═══════════════════════════════════════════════════════════════════

const resetCache = () => {
  presupuestosCache = null
  cacheInicializado = false
}

// ═══════════════════════════════════════════════════════════════════
// API PÚBLICA (preserva métodos legacy de items)
// ═══════════════════════════════════════════════════════════════════

export const presupuestosStorageService = {
  obtenerPresupuestos,
  guardarPresupuestos,
  sincronizarDesdeSupabase,
  resetCache,

  // Lee los ítems de presupuesto de un paciente específico (clave dinámica)
  // Nota: sigue usando localStorage (se migrará en F4-02d)
  obtenerItemsPorPaciente: (pacienteId) => {
    if (!pacienteId) return []
    return leerJSON(`presupuesto_items_${pacienteId}`, [])
  },

  // Vincula los ítems creados en el presupuesto global hacia la Ficha Médica del paciente
  // Nota: sigue usando localStorage (se migrará en F4-02d)
  sincronizarConFichaPaciente: (pacienteId, items, convenio = 'Particular') => {
    if (!pacienteId) return
    const keyItems = `presupuesto_items_${pacienteId}`
    const existentes = leerJSON(keyItems, [])

    const idsExistentes = new Set(existentes.map(i => i.id))
    const nuevosAjustados = items.map(it => ({
      ...it,
      convenio: it.convenio || convenio,
      estado: it.estado || 'Pendiente'
    })).filter(it => !idsExistentes.has(it.id))

    const consolidados = [...existentes, ...nuevosAjustados]
    escribirJSON(keyItems, consolidados, { notify: true })
  },

  // Eliminación Bidireccional: Borra el presupuesto global y sus ítems en el plan de tratamiento del paciente
  // Nota: la parte de presupuesto global ahora va a Supabase, pero items siguen en localStorage
  eliminarPresupuestoYFicha: (presupuestoId, pacienteId, itemsABorrar = []) => {
    // 1. Borrar del registro de presupuestos globales (ahora va a Supabase vía guardarPresupuestos)
    const guardados = presupuestosCache || presupuestosRepo.obtener([])
    const actualizados = guardados.filter(p => p.id !== presupuestoId)
    
    // Actualizar caché y localStorage
    presupuestosCache = actualizados
    presupuestosRepo.guardar(actualizados)
    
    // Si Supabase está activo, eliminar de Supabase también
    if (USE_SUPABASE && supabase && esUuidValido(presupuestoId)) {
      supabase.from('presupuestos').delete().eq('id', presupuestoId)
        .catch(err => log.error('Error al eliminar de Supabase:', err))
    }

    // 2. Borrar del Plan de Tratamiento del paciente si existe pacienteId
    if (pacienteId) {
      const keyItems = `presupuesto_items_${pacienteId}`
      const existentes = leerJSON(keyItems, null)
      if (existentes !== null) {
        if (itemsABorrar.length > 0) {
          const idsABorrar = new Set(itemsABorrar.map(i => i.id))
          const filtrados = existentes.filter(i => !idsABorrar.has(i.id))
          escribirJSON(keyItems, filtrados)
        } else {
          // Si no se especifican ítems, se vacía la ficha vinculada
          try {
            localStorage.removeItem(keyItems)
          } catch (e) {
            log.error(`Error al eliminar "${keyItems}" de localStorage:`, e)
          }
        }
      }
    }
  },

  // Actualiza el estado (Emitido, Aprobado, Rechazado, etc.) de un presupuesto creado directamente
  actualizarEstadoPresupuesto: (presupuestoId, nuevoEstado) => {
    const guardados = presupuestosCache || presupuestosRepo.obtener([])
    const actualizados = guardados.map(p =>
      p.id === presupuestoId ? { ...p, estado: nuevoEstado } : p
    )
    
    presupuestosCache = actualizados
    presupuestosRepo.guardar(actualizados)
    
    // Si Supabase está activo, actualizar en Supabase también
    if (USE_SUPABASE && supabase && esUuidValido(presupuestoId)) {
      supabase.from('presupuestos').update({ estado: nuevoEstado }).eq('id', presupuestoId)
        .catch(err => log.error('Error al actualizar estado en Supabase:', err))
    }
  },

  // Elimina todos los ítems de presupuesto de un paciente (F2-07d)
  // Nota: sigue usando localStorage (se migrará en F4-02d)
  eliminarItemsDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`presupuesto_items_${pacienteId}`)
    } catch (e) {
      log.error(`Error al eliminar items de presupuesto del paciente ${pacienteId}:`, e)
    }
  },

  // Genera presupuestos virtuales consolidados desde los items de cada paciente
  // Nota: este método NO migra, solo calcula presupuestos al vuelo desde localStorage
  consolidarPresupuestosDesdePacientes: (pacientes = []) => {
    const consolidados = []

    pacientes.forEach(p => {
      const items = leerJSON(`presupuesto_items_${p.id}`, [])
      const abonos = leerJSON(`abonos_${p.id}`, [])

      if (items.length > 0) {
        const total = items.reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0)
        const abonado = abonos.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0)

        const todosRealizados = items.every(i => i.estado === 'Realizado')
        const saldoRestante = total - abonado

        let estadoCalculado = 'Emitido'
        if (todosRealizados || saldoRestante <= 0) {
          estadoCalculado = 'Aprobado'
        } else if (items.some(i => i.estado === 'En Proceso' || i.estado === 'Realizado') || abonado > 0) {
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
