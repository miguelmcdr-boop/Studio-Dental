/**
 * Persistencia de Pacientes (F4-02c-2 — migración a Supabase).
 *
 * Estrategia de "caché local + sync en background" (alineada con RFC F4-01):
 *
 *   localStorage (caché rápida, síncrona)
 *          ↕
 *   Caché en memoria (variable de módulo)
 *          ↕ (async, on-demand)
 *   Supabase (fuente de verdad)
 *
 * API pública:
 * - obtenerPacientes()              → SÍNCRONO, retorna de caché en memoria
 * - guardarPacientes(pacientes)     → ASYNC, escribe en Supabase + actualiza caché
 * - sincronizarDesdeSupabase()      → ASYNC, refresca caché desde Supabase
 * - obtenerItem/guardarItem         → SÍNCRONO, localStorage (F4-02c-5)
 * - eliminarEvoluciones/Recetas     → SÍNCRONO, localStorage (F4-02c-5)
 * - eliminarPaciente(id)            → ASYNC, soft delete (F6-F)
 * - restaurarPaciente(id)           → ASYNC, restaurar soft delete (F6-F)
 * - listarPacientesEliminados()     → ASYNC, papelera admin (F6-F)
 *
 * Modo dual (VITE_USE_SUPABASE):
 * - true: usa Supabase como fuente de verdad, localStorage como caché
 * - false: usa localStorage como fuente de verdad (legacy)
 */
import { createLocalStorageRepository, leerJSON, escribirJSON } from '../../../services/localStorageRepository'
import { validarListaPacientes } from '../schemas/pacienteSchema'
import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'
import { transformarDesdeSupabase, transformarParaSupabase } from './pacientesTransformations.js'
import { migrationStorageService } from '../../../services/migrationStorageService'
import { esUuidValido } from '../../../services/migrations/uuidUtils'

const STORAGE_KEY_PACIENTES = 'studio_dental_pacientes_v3'
const pacientesRepo = createLocalStorageRepository(STORAGE_KEY_PACIENTES, [])

// Caché en memoria: evita lecturas repetidas de localStorage y permite
// que la API pública permanezca síncrona.
let pacientesCache = null
let cacheInicializado = false

// ═══════════════════════════════════════════════════════════════════
// HELPERS DE TRANSFORMACIÓN
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// INICIALIZACIÓN DE CACHÉ
// ═══════════════════════════════════════════════════════════════════

/**
 * Inicializa la caché en memoria desde localStorage.
 * Se ejecuta una sola vez al primer uso de obtenerPacientes.
 */
const inicializarCache = (defaults) => {
  if (cacheInicializado) return
  const datos = pacientesRepo.obtener(defaults)
  pacientesCache = Array.isArray(datos) ? datos : defaults
  cacheInicializado = true
}

// ═══════════════════════════════════════════════════════════════════
// OBTENER PACIENTES (SÍNCRONO)
// ═══════════════════════════════════════════════════════════════════

/**
 * Obtiene la lista de pacientes desde la caché en memoria.
 * SIEMPRE SÍNCRONO: nunca bloquea la UI.
 *
 * Para obtener datos frescos desde Supabase, usar sincronizarDesdeSupabase().
 *
 * @param {Array} defaults - Lista por defecto si no hay datos
 */
const obtenerPacientes = (defaults = []) => {
  if (!cacheInicializado) {
    inicializarCache(defaults)
  }
  return pacientesCache
}

// ═══════════════════════════════════════════════════════════════════
// SINCRONIZAR DESDE SUPABASE (ASYNC)
// ═══════════════════════════════════════════════════════════════════

/**
 * Refresca la caché de pacientes desde Supabase.
 * Útil después del login, al recibir eventos Realtime, o manualmente.
 *
 * @returns {Promise<Array>} Lista actualizada de pacientes
 */
const sincronizarDesdeSupabase = async () => {
  console.log('[pacientesStorageService] Iniciando sincronización desde Supabase...')
  
  if (!USE_SUPABASE || !supabase) {
    console.log('[pacientesStorageService] Supabase no configurado, retornando caché')
    return pacientesCache
  }

  try {
    // F6-F: filtrar pacientes eliminados (soft delete)
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[pacientesStorageService] Error al sincronizar desde Supabase:', error.message)
      return pacientesCache
    }

    console.log(`[pacientesStorageService] Supabase retornó ${data?.length || 0} pacientes`)

    if (!Array.isArray(data)) return pacientesCache

    // F6-C-f: NO usar caché como fallback si Supabase retorna vacío.
    // Esto rompería el aislamiento multi-clínica. Si Supabase retorna vacío,
    // la clínica no tiene pacientes (o el RLS está funcionando correctamente).
    if (data.length === 0) {
      console.log('[pacientesStorageService] Supabase retornó vacío, actualizando caché vacía')
    }

    const nuevos = data.map(transformarDesdeSupabase).filter(Boolean)
    console.log(`[pacientesStorageService] Actualizando caché con ${nuevos.length} pacientes`)
    pacientesCache = nuevos

    // Actualizar también localStorage como caché persistente
    pacientesRepo.guardar(nuevos)

    return nuevos
  } catch (error) {
    console.error('[pacientesStorageService] Excepción al sincronizar desde Supabase:', error)
    return pacientesCache
  }
}

// ═══════════════════════════════════════════════════════════════════
// GUARDAR PACIENTES (ASYNC con actualización de caché síncrona)
// ═══════════════════════════════════════════════════════════════════

/**
 * Guarda la lista completa de pacientes.
 *
 * 1. Actualiza caché en memoria (síncrono) — UX optimista
 * 2. Persiste en localStorage como caché persistente
 * 3. Si Supabase activo, sincroniza en background (no bloquea)
 *
 * @param {Array} pacientes - Lista completa de pacientes a persistir
 */
const guardarPacientes = async (pacientes) => {
  // (F2-04) — validación Zod antes de persistir
  const { valido, datos, error } = validarListaPacientes(pacientes)
  if (!valido) {
    console.error('Error de validación al guardar pacientes:', error)
    return false
  }

  // 1. Actualizar caché en memoria inmediatamente
  pacientesCache = datos
  cacheInicializado = true

  // 2. Persistir en localStorage como caché
  pacientesRepo.guardar(datos)

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

    for (const paciente of datos) {
      if (esUuidValido(paciente.id)) {
        aActualizar.push(paciente)
        idsEnMemoria.add(paciente.id)
      } else {
        aInsertar.push(paciente)
      }
    }

    // UPDATE en batch
    if (aActualizar.length > 0) {
      const paraUpdate = aActualizar.map(p => ({
        ...transformarParaSupabase(p),
        user_id: user.id
      }))

      const { error: updateError } = await supabase
        .from('pacientes')
        .upsert(paraUpdate, { onConflict: 'id' })

      if (updateError) {
        console.error('[pacientesStorageService] Error al actualizar en Supabase:', updateError.message)
      }
    }

    // INSERT uno por uno, verificando duplicados por RUT
    for (const paciente of aInsertar) {
      const paraInsert = {
        ...transformarParaSupabase(paciente),
        user_id: user.id
      }
      delete paraInsert.id

      // CRÍTICO: verificar si ya existe un paciente con el mismo RUT en Supabase.
      // Esto previene duplicados cuando la caché tiene pacientes legacy (sin UUID)
      // que ya fueron migrados previamente.
      if (paciente.rut) {
        const { data: existente, error: checkError } = await supabase
          .from('pacientes')
          .select('id')
          .eq('user_id', user.id)
          .eq('rut', paciente.rut)
          .maybeSingle()

        if (!checkError && existente) {
          // Ya existe un paciente con este RUT: UPDATE en lugar de INSERT
          const { error: updateError } = await supabase
            .from('pacientes')
            .update(paraInsert)
            .eq('id', existente.id)

          if (updateError) {
            console.error(`[pacientesStorageService] Error al actualizar duplicado ${paciente.nombre}:`, updateError.message)
            continue
          }

          // F6-C-d.4 FIX: agregar el UUID existente a idsEnMemoria
          idsEnMemoria.add(existente.id)

          // Actualizar caché con el UUID del paciente existente
          const index = pacientesCache.findIndex(p => p.rut === paciente.rut && !esUuidValido(p.id))
          if (index >= 0) {
            const legacyId = pacientesCache[index].id
            pacientesCache[index] = { ...pacientesCache[index], id: existente.id }
            migrationStorageService.registrarMapeo(legacyId, existente.id)
          }
          continue
        }
      }

      // No existe duplicado: INSERT normal
      const { data: insertado, error: insertError } = await supabase
        .from('pacientes')
        .insert(paraInsert)
        .select('id')
        .single()

      if (insertError) {
        // F6-G: detectar error de constraint unique (duplicado por RUT)
        // Esto puede ocurrir por race condition cuando el check previo no alcanzó a detectar el duplicado
        if (insertError.code === '23505' || insertError.message.includes('duplicate key') || insertError.message.includes('unique constraint')) {
          console.warn(`[pacientesStorageService] Duplicado detectado por constraint unique para ${paciente.nombre} (RUT: ${paciente.rut})`)
          
          // Buscar el paciente existente y actualizar la caché con su UUID
          const { data: existentePostError, error: findError } = await supabase
            .from('pacientes')
            .select('id')
            .eq('user_id', user.id)
            .eq('rut_normalizado', paraInsert.rut?.toUpperCase().replace(/\./g, '').replace(/-/g, ''))
            .maybeSingle()
          
          if (!findError && existentePostError) {
            idsEnMemoria.add(existentePostError.id)
            const index = pacientesCache.findIndex(p =>
              !esUuidValido(p.id) && p.rut === paciente.rut
            )
            if (index >= 0) {
              const legacyId = pacientesCache[index].id
              pacientesCache[index] = { ...pacientesCache[index], id: existentePostError.id }
              migrationStorageService.registrarMapeo(legacyId, existentePostError.id)
            }
          }
          continue
        }
        
        console.error(`[pacientesStorageService] Error al insertar ${paciente.nombre}:`, insertError.message)
        continue
      }

      // F6-C-d.4 FIX: agregar el UUID insertado a idsEnMemoria para que
      // la lógica de DELETE (más abajo) no lo elimine inmediatamente.
      idsEnMemoria.add(insertado.id)

      // Actualizar el paciente en caché con el nuevo UUID
      const index = pacientesCache.findIndex(p =>
        !esUuidValido(p.id) && p.rut === paciente.rut
      )
      if (index >= 0) {
        const legacyId = pacientesCache[index].id
        pacientesCache[index] = { ...pacientesCache[index], id: insertado.id }
        migrationStorageService.registrarMapeo(legacyId, insertado.id)
      }
    }

    // F6-F: SOFT DELETE pacientes eliminados
    // El trigger trg_pacientes_audit registra la acción en audit_log.
    const { data: pacientesSupabase } = await supabase
      .from('pacientes')
      .select('id')
      .is('deleted_at', null)

    if (Array.isArray(pacientesSupabase)) {
      const idsASoftDelete = pacientesSupabase
        .map(p => p.id)
        .filter(id => !idsEnMemoria.has(id))

      if (idsASoftDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('pacientes')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', idsASoftDelete)
          .is('deleted_at', null)

        if (deleteError) {
          console.error('[pacientesStorageService] Error al soft delete:', deleteError.message)
        } else {
          console.log(`[pacientesStorageService] ${idsASoftDelete.length} pacientes marcados eliminados (soft delete)`)
        }
      }
    }

    // Persistir la caché actualizada (con UUIDs nuevos)
    pacientesRepo.guardar(pacientesCache)

    return true
  } catch (error) {
    console.error('[pacientesStorageService] Excepción al guardar en Supabase:', error)
    return true
  }
}

// ═══════════════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════════════

/**
 * Resetea la caché en memoria (útil para tests).
 * Después de llamar esto, el próximo obtenerPacientes() volverá a
 * inicializar la caché desde localStorage.
 */
const resetCache = () => {
  pacientesCache = null
  cacheInicializado = false
}

export const pacientesStorageService = {
  obtenerPacientes,
  guardarPacientes,
  sincronizarDesdeSupabase,
  resetCache,

  obtenerItem: (key, fallback = []) => leerJSON(key, fallback),
  guardarItem: (key, data) => escribirJSON(key, data),

  /**
   * F6-F: Soft delete de paciente específico.
   * Marca deleted_at; paciente oculto pero reversible por admin.
   */
  eliminarPaciente: async (pacienteId) => {
    if (!pacienteId) return false

    if (!USE_SUPABASE || !supabase) {
      pacientesCache = pacientesCache.filter(p => p.id !== pacienteId)
      pacientesRepo.guardar(pacientesCache)
      return true
    }

    try {
      const { error } = await supabase
        .from('pacientes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', pacienteId)
        .is('deleted_at', null)

      if (error) {
        console.error('[pacientesStorageService] Error al eliminar paciente:', error.message)
        return false
      }

      pacientesCache = pacientesCache.filter(p => p.id !== pacienteId)
      pacientesRepo.guardar(pacientesCache)
      return true
    } catch (e) {
      console.error('[pacientesStorageService] Excepción al eliminar:', e)
      return false
    }
  },

  /**
   * F6-F: Restaurar paciente eliminado (solo admin).
   */
  restaurarPaciente: async (pacienteId) => {
    if (!pacienteId || !USE_SUPABASE || !supabase) return false

    try {
      const { error } = await supabase
        .from('pacientes')
        .update({ deleted_at: null })
        .eq('id', pacienteId)
        .not('deleted_at', 'is', null)

      if (error) {
        console.error('[pacientesStorageService] Error al restaurar:', error.message)
        return false
      }
      return true
    } catch (e) {
      console.error('[pacientesStorageService] Excepción al restaurar:', e)
      return false
    }
  },

  /**
   * F6-F: Listar pacientes eliminados (solo admin, papelera).
   */
  listarPacientesEliminados: async () => {
    if (!USE_SUPABASE || !supabase) return []

    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

      if (error) {
        console.error('[pacientesStorageService] Error al listar eliminados:', error.message)
        return []
      }

      return (data || []).map(transformarDesdeSupabase).filter(Boolean)
    } catch (e) {
      console.error('[pacientesStorageService] Excepción al listar:', e)
      return []
    }
  },

  eliminarEvolucionesDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`evoluciones_notas_${pacienteId}`)
    } catch (e) {
      console.error(`Error al eliminar evoluciones del paciente ${pacienteId}:`, e)
    }
  },

  eliminarRecetasDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`recetas_${pacienteId}`)
    } catch (e) {
      console.error(`Error al eliminar recetas del paciente ${pacienteId}:`, e)
    }
  }
}
