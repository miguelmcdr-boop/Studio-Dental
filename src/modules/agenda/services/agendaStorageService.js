/**
 * Persistencia de Citas de Agenda (F4-02c-3 — migración a Supabase).
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
 * - obtenerCitas()              → SÍNCRONO, retorna de caché en memoria
 * - guardarCitas(citas)         → ASYNC, escribe en Supabase + actualiza caché
 * - sincronizarDesdeSupabase()  → ASYNC, refresca caché desde Supabase
 * - resetCache()                → limpia caché (para tests)
 *
 * Modo dual (VITE_USE_SUPABASE):
 * - true: usa Supabase como fuente de verdad, localStorage como caché
 * - false: usa localStorage como fuente de verdad (legacy)
 *
 * Mapeo bidireccional de estados:
 * - El código usa: 'Agendado', 'Confirmado', 'En Sillón', 'Completado', 'Cancelado'
 * - Supabase espera: 'Agendada', 'Confirmada', 'En Curso', 'Completada', 'Cancelada'
 * - Al leer desde Supabase: desnormalizar al formato del código
 * - Al escribir a Supabase: normalizar al formato esperado
 */
import { createTenantRepository } from '../../../services/localStorageRepository'
import { validarListaCitas } from '../schemas/citaSchema'
import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'
import { migrationStorageService } from '../../../services/migrationStorageService'
import { esUuidValido } from '../../../services/migrations/uuidUtils'
import { createLogger } from '../../../services/logger'

const log = createLogger('agendaStorageService')

const STORAGE_KEY_AGENDA = 'studio_dental_agenda_citas_v3'
// F7-36 FASE 1 (Commit 1.5b): migrado a createTenantRepository para aislamiento multi-tenant.
// La clave legacy 'studio_dental_agenda_citas_v3' ahora se almacena como sd_<clinicaId>_studio_dental_agenda_citas_v3.
const citasRepo = createTenantRepository(STORAGE_KEY_AGENDA, [], { notify: true })

// P0-1: Repositorio aislado por tenant para registrar eliminaciones pendientes explícitas
const STORAGE_KEY_PENDING_DELETES = 'studio_dental_agenda_pending_deletes'
const pendingDeletesRepo = createTenantRepository(STORAGE_KEY_PENDING_DELETES, [])

const obtenerPendingDeletes = () => pendingDeletesRepo.obtener([])
const guardarPendingDeletes = (ids) => {
  if (!ids || ids.length === 0) {
    return pendingDeletesRepo.eliminar()
  }
  return pendingDeletesRepo.guardar(ids)
}

// Caché en memoria: evita lecturas repetidas de localStorage y permite
// que la API pública permanezca síncrona.
let citasCache = null
let cacheInicializado = false

import {
  transformarDesdeSupabase,
  transformarParaSupabase
} from './agendaTransformations'

// ═══════════════════════════════════════════════════════════════════
// INICIALIZACIÓN DE CACHÉ
// ═══════════════════════════════════════════════════════════════════

const inicializarCache = (defaults) => {
  if (cacheInicializado) return
  const datos = citasRepo.obtener(defaults)
  citasCache = Array.isArray(datos) ? datos : defaults
  cacheInicializado = true
}

// ═══════════════════════════════════════════════════════════════════
// OBTENER CITAS (SÍNCRONO)
// ═══════════════════════════════════════════════════════════════════

/**
 * Obtiene la lista de citas desde la caché en memoria.
 * SIEMPRE SÍNCRONO: nunca bloquea la UI.
 */
const obtenerCitas = (defaults = []) => {
  if (!cacheInicializado) {
    inicializarCache(defaults)
  }
  return citasCache
}

// ═══════════════════════════════════════════════════════════════════
// SINCRONIZAR DESDE SUPABASE (ASYNC)
// ═══════════════════════════════════════════════════════════════════

/**
 * Refresca la caché de citas desde Supabase.
 * Útil después del login, después de migración, o al recibir eventos Realtime.
 */
const sincronizarDesdeSupabase = async () => {
  if (!USE_SUPABASE || !supabase) {
    return citasCache
  }

  try {
    let query = supabase.from('citas').select('*')
    if (typeof query.is === 'function') {
      query = query.is('deleted_at', null)
    }
    const { data, error } = await query
      .order('fecha', { ascending: false })
      .order('hora_inicio', { ascending: true })

    if (error) {
      log.warn('Error al sincronizar desde Supabase:', error.message)
      return citasCache
    }

    if (!Array.isArray(data)) return citasCache

    // F7-36: Supabase [] = clínica sin citas. Error de red ya retornó cache arriba.
    if (data.length === 0) {
      log.info('Supabase retornó []: clínica sin citas, cache limpiada')
    }

    const nuevas = data.map(transformarDesdeSupabase).filter(Boolean)
    citasCache = nuevas
    citasRepo.guardar(nuevas)

    return nuevas
  } catch (error) {
    log.error('Excepción al sincronizar desde Supabase:', error)
    return citasCache
  }
}

// ═══════════════════════════════════════════════════════════════════
// GUARDAR CITAS (ASYNC con actualización de caché síncrona)
// ═══════════════════════════════════════════════════════════════════

/**
 * Guarda la lista completa de citas.
 *
 * 1. Actualiza caché en memoria (síncrono) — UX optimista
 * 2. Persiste en localStorage como caché persistente
 * 3. Si Supabase activo, sincroniza en background (no bloquea)
 */
const guardarCitas = async (citas) => {
  // (F2-04b) — validación Zod antes de persistir
  const validacion = validarListaCitas(citas)
  if (!validacion.valido) {
    log.error('Error de validación al guardar citas (F2-04b):', validacion.error)
    return false
  }
  const datos = validacion.datos

  // 1. Actualizar caché en memoria inmediatamente
  citasCache = datos
  cacheInicializado = true

  // 2. Persistir en localStorage como caché
  citasRepo.guardar(datos)

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

    for (const cita of datos) {
      if (esUuidValido(cita.id)) {
        aActualizar.push(cita)
        idsEnMemoria.add(cita.id)
      } else {
        aInsertar.push(cita)
      }
    }

    // UPDATE en batch
    if (aActualizar.length > 0) {
      const paraUpdate = aActualizar.map(c => ({
        ...transformarParaSupabase(c),
        user_id: user.id
      }))

      const { error: updateError } = await supabase
        .from('citas')
        .upsert(paraUpdate, { onConflict: 'id' })

      if (updateError) {
        log.error('Error al actualizar en Supabase:', updateError.message)
      }
    }

    // INSERT uno por uno (INSERT directo sin verificación de duplicados)
    for (const cita of aInsertar) {
      const paraInsert = {
        ...transformarParaSupabase(cita),
        user_id: user.id
      }
      delete paraInsert.id

      // INSERT directo en Supabase
      const { data: insertado, error: insertError } = await supabase
        .from('citas')
        .insert(paraInsert)
        .select('id')
        .single()

      if (insertError) {
        log.error(`Error al insertar cita:`, insertError.message)
        continue
      }

      // Actualizar la cita en caché con el nuevo UUID
      const index = citasCache.findIndex(c => !esUuidValido(c.id) &&
        c.fecha === cita.fecha && c.horaInicio === cita.horaInicio &&
        c.pacienteId === cita.pacienteId)
      if (index >= 0) {
        const legacyId = citasCache[index].id
        citasCache[index] = { ...citasCache[index], id: insertado.id }
        migrationStorageService.registrarMapeo(legacyId, insertado.id)
      }
    }

    // P0-1: Procesar eliminaciones pendientes explícitas (soft-delete vía UPDATE)
    // PROHIBIDO el diff destructivo por ausencia de IDs en memoria
    const pendingDeletes = obtenerPendingDeletes()
    if (Array.isArray(pendingDeletes) && pendingDeletes.length > 0) {
      const exitosos = []
      const timestampEliminacion = new Date().toISOString()

      for (const idAEliminar of pendingDeletes) {
        if (!esUuidValido(idAEliminar)) {
          exitosos.push(idAEliminar)
          continue
        }

        const { error: updateError } = await supabase
          .from('citas')
          .update({ deleted_at: timestampEliminacion })
          .eq('id', idAEliminar)
          .is('deleted_at', null)

        if (!updateError) {
          exitosos.push(idAEliminar)
        } else {
          log.warn(`Error al aplicar soft-delete a cita ${idAEliminar}:`, updateError.message)
        }
      }

      if (exitosos.length > 0) {
        const exitososSet = new Set(exitosos)
        const restantes = pendingDeletes.filter(id => !exitososSet.has(id))
        guardarPendingDeletes(restantes)
      }
    }

    // Persistir la caché actualizada (con UUIDs nuevos)
    citasRepo.guardar(citasCache)

    return true
  } catch (error) {
    log.error('Excepción al guardar en Supabase:', error)
    return true
  }
}

/**
 * Elimina una cita de forma explícita (P0-1).
 *
 * 1. Actualiza inmediatamente la caché en memoria y localStorage (UX optimista).
 * 2. Registra el ID en pendingDeletes (aislado por clínica en tenantRepository).
 * 3. Si Supabase está disponible, ejecuta el soft-delete vía UPDATE con deleted_at.
 * 4. Si tiene éxito remoto, lo retira de pendingDeletes; si falla la red, queda encolado.
 *
 * @param {string} citaId - ID de la cita a eliminar
 * @returns {Promise<boolean>}
 */
const eliminarCita = async (citaId) => {
  if (!citaId) return false

  // 1. Actualizar caché local
  if (!cacheInicializado) {
    citasCache = citasRepo.obtener([])
    cacheInicializado = true
  }
  citasCache = (citasCache || []).filter(c => c.id !== citaId)
  citasRepo.guardar(citasCache)

  // 2. Registrar en cola pendingDeletes de la clínica activa
  const pending = obtenerPendingDeletes()
  if (!pending.includes(citaId)) {
    guardarPendingDeletes([...pending, citaId])
  }

  // 3. Sincronizar soft-delete con Supabase si está disponible
  if (!USE_SUPABASE || !supabase || !esUuidValido(citaId)) {
    return true
  }

  try {
    const { error } = await supabase
      .from('citas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', citaId)
      .is('deleted_at', null)

    if (!error) {
      const actualizados = obtenerPendingDeletes().filter(id => id !== citaId)
      guardarPendingDeletes(actualizados)
    } else {
      log.warn(`Error al soft-deletear cita ${citaId}, permanece en pendingDeletes:`, error.message)
    }
  } catch (err) {
    log.warn(`Fallo de red al soft-deletear cita ${citaId}, queda encolado:`, err?.message)
  }

  return true
}

// ═══════════════════════════════════════════════════════════════════
// RESET CACHE (para tests)
// ═══════════════════════════════════════════════════════════════════

const resetCache = () => {
  citasCache = null
  cacheInicializado = false
}

// ═══════════════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════════════

export const agendaStorageService = {
  obtenerCitas,
  guardarCitas,
  eliminarCita,
  sincronizarDesdeSupabase,
  resetCache,
  obtenerPendingDeletes
}
