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
import { createTenantRepository, leerJSON, escribirJSON } from '../../../services/localStorageRepository'
import { validarListaPacientes, validarPaciente } from '../schemas/pacienteSchema'
import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'
import { transformarDesdeSupabase, transformarParaSupabase } from './pacientesTransformations.js'
import { migrationStorageService } from '../../../services/migrationStorageService'
import { 
  eliminarPaciente as softDeleteEliminar, 
  restaurarPaciente as softDeleteRestaurar, 
  listarPacientesEliminados as softDeleteListar,
  vaciarPapeleraPacientes as softDeleteVaciarPacientes
} from './pacientesSoftDeleteService'
import { esUuidValido } from '../../../services/migrations/uuidUtils'
import { getClinicaActiva } from '../../../services/authService'
import { createLogger } from '../../../services/logger'

const log = createLogger('pacientesStorageService')

export const createTenantLocalStorageRepository = createTenantRepository

const STORAGE_KEY_PACIENTES = 'studio_dental_pacientes_v3'
// F7-36 FASE 1 (Commit 1.5b): migrado a createTenantRepository para aislamiento multi-tenant.
// La clave legacy 'studio_dental_pacientes_v3' ahora se almacena como sd_<clinicaId>_studio_dental_pacientes_v3.
// Fail-safe: si no hay clínica activa, obtenerPacientes() retorna defaultValue (SEED_PACIENTES_DEMO o []).
const pacientesRepo = createTenantRepository(STORAGE_KEY_PACIENTES, [])

import {
  pendingPacientesRepo,
  obtenerPendingPacientes,
  guardarPendingPacientes,
  encolarPaciente,
  guardarPacienteHelper,
  procesarColaPacientesHelper,
  sincronizarPacientesDesdeSupabaseHelper,
  pendingDeletesPacientesRepo,
  obtenerPendingDeletesPacientes,
  guardarPendingDeletesPacientes,
  procesarPendingDeletesPacientesHelper
} from './pacientesOfflineQueueService'

export {
  pendingPacientesRepo,
  obtenerPendingPacientes,
  guardarPendingPacientes,
  encolarPaciente,
  pendingDeletesPacientesRepo,
  obtenerPendingDeletesPacientes,
  guardarPendingDeletesPacientes
}

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
 * Refresca la caché de pacientes desde Supabase protegiendo pacientes locales offline (P1-3).
 * Descarga los pacientes remotos pero preserva pacientes locales con sincronizado: false
 * o que estén en pendingPacientes.
 *
 * @returns {Promise<Array>} Lista actualizada de pacientes
 */
const sincronizarDesdeSupabase = async () => {
  return sincronizarPacientesDesdeSupabaseHelper({
    obtenerPacientes,
    actualizarPacientesLocal: (fusionados) => {
      pacientesCache = fusionados
      cacheInicializado = true
      pacientesRepo.guardar(fusionados)
    }
  })
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
    log.error('Error de validación al guardar pacientes:', error)
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
        log.error('Error al actualizar en Supabase:', updateError.message)
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
            log.error(`Error al actualizar duplicado ${paciente.nombre}:`, updateError.message)
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
          log.warn(`Duplicado detectado por constraint unique para ${paciente.nombre} (RUT: ${paciente.rut})`)
          
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
        
        log.error(`Error al insertar ${paciente.nombre}:`, insertError.message)
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

    // P0-1 / P1-3: Procesar eliminaciones pendientes explícitas (soft-delete vía UPDATE)
    // PROHIBIDO el diff destructivo por ausencia de IDs en memoria
    await procesarPendingDeletesPacientesHelper()

    // Persistir la caché actualizada (con UUIDs nuevos)
    pacientesRepo.guardar(pacientesCache)

    return true
  } catch (error) {
    log.error('Excepción al guardar en Supabase:', error)
    return true
  }
}

/**
 * Guarda o actualiza un único paciente con soporte dual offline-first y encolado (P1-3).
 *
 * @param {Object} paciente - Datos del paciente
 * @returns {Promise<Object|null>} El paciente guardado o null si falla la validación
 */
export const guardarPaciente = async (paciente) => {
  return guardarPacienteHelper(paciente, {
    obtenerPacientes,
    actualizarPacientesLocal: (listado) => {
      pacientesCache = listado
      cacheInicializado = true
      pacientesRepo.guardar(listado)
    }
  })
}

/**
 * Procesa la cola de pacientes pendientes de sincronizar con Supabase (P1-3).
 * Drenaje atómico y fail-closed: solo se retiran los confirmados por Supabase.
 *
 * @returns {Promise<{procesados: number, fallidos: number}>}
 */
export const procesarColaPacientes = async () => {
  return procesarColaPacientesHelper({
    obtenerPacientes,
    actualizarPacientesLocal: (listado) => {
      pacientesCache = listado
      pacientesRepo.guardar(listado)
    }
  })
}

// ═══════════════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════════════

/**
 * Resetea la caché en memoria (útil para tests).
 * Después de llamar esto, el próximo obtenerPacientes() volverá a
 * inicializar la caché desde localStorage.
 */
export const resetCache = () => {
  pacientesCache = null
  cacheInicializado = false
}

export const pacientesStorageService = {
  obtenerPacientes,
  guardarPacientes,
  guardarPaciente,
  procesarColaPacientes,
  obtenerPendingPacientes,
  guardarPendingPacientes,
  obtenerPendingDeletesPacientes,
  guardarPendingDeletesPacientes,
  sincronizarDesdeSupabase,
  resetCache,

  obtenerItem: (key, fallback = []) => leerJSON(key, fallback),
  guardarItem: (key, data) => escribirJSON(key, data),

  /**
   * F6-F: Soft delete de paciente específico.
   * Marca deleted_at; paciente oculto pero reversible por admin.
   * F6-N: Delega a pacientesSoftDeleteService (elimina duplicación).
   */
  eliminarPaciente: async (pacienteId) => {
    // P0-1 / P1-3: Registrar en cola pendingDeletes para retry offline
    const pending = obtenerPendingDeletesPacientes()
    if (!pending.includes(pacienteId)) {
      guardarPendingDeletesPacientes([...pending, pacienteId])
    }

    const resultado = await softDeleteEliminar(pacienteId)
    
    if (resultado) {
      const actualizados = obtenerPendingDeletesPacientes().filter(id => id !== pacienteId)
      guardarPendingDeletesPacientes(actualizados)
    }

    // Mantener cache local sincronizado (solo en modo localStorage)
    if (resultado && (!USE_SUPABASE || !supabase)) {
      pacientesCache = pacientesCache.filter(p => p.id !== pacienteId)
      pacientesRepo.guardar(pacientesCache)
    }
    
    return resultado
  },

  /**
   * F6-F: Restaurar paciente eliminado (solo admin).
   * F6-N: Delega a pacientesSoftDeleteService (elimina duplicación).
   */
  restaurarPaciente: async (pacienteId) => {
    return await softDeleteRestaurar(pacienteId)
  },

  /**
   * F6-F: Listar pacientes eliminados (solo admin, papelera).
   * F6-N: Delega a pacientesSoftDeleteService (elimina duplicación).
   */
  listarPacientesEliminados: async () => {
    return await softDeleteListar()
  },

  /**
   * Feature 1: Purgar pacientes de la papelera (eliminación permanente).
   * Delega a pacientesSoftDeleteService.vaciarPapeleraPacientes.
   */
  vaciarPapeleraPacientes: async (pacienteIds) => {
    return await softDeleteVaciarPacientes(pacienteIds)
  },

  eliminarEvolucionesDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`evoluciones_notas_${pacienteId}`)
    } catch (e) {
      log.error(`Error al eliminar evoluciones del paciente ${pacienteId}:`, e)
    }
  },

  eliminarRecetasDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`recetas_${pacienteId}`)
    } catch (e) {
      log.error(`Error al eliminar recetas del paciente ${pacienteId}:`, e)
    }
  }
}

export {
  obtenerPacientes,
  guardarPacientes,
  sincronizarDesdeSupabase
}
