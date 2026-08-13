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
 *
 * Modo dual (VITE_USE_SUPABASE):
 * - true: usa Supabase como fuente de verdad, localStorage como caché
 * - false: usa localStorage como fuente de verdad (legacy)
 */
import { createLocalStorageRepository, leerJSON, escribirJSON } from '../../../services/localStorageRepository'
import { validarListaPacientes } from '../schemas/pacienteSchema'
import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'
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

const SNAKE_TO_CAMEL_MAP = {
  contacto_emergencia: 'contactoEmergencia',
  examen_extraoral: 'examenExtraoral',
  examen_intraoral: 'examenIntraoral',
  presion_arterial: 'presionArterial',
  riesgo_cariogenico: 'riesgoCariogenico',
  riesgo_periodontal: 'riesgoPeriodontal',
  motivo_consulta: 'motivoConsulta',
  anamnesis_proxima: 'anamnesisProxima',
  fecha_ingreso: 'fechaIngreso',
  user_id: 'userId',
  created_at: 'createdAt',
  updated_at: 'updatedAt'
}

const CAMEL_TO_SNAKE_MAP = Object.fromEntries(
  Object.entries(SNAKE_TO_CAMEL_MAP).map(([snake, camel]) => [camel, snake])
)

const transformarDesdeSupabase = (pacienteDb) => {
  if (!pacienteDb) return null
  const resultado = {}
  for (const [claveDb, valor] of Object.entries(pacienteDb)) {
    const claveJs = SNAKE_TO_CAMEL_MAP[claveDb] || claveDb
    resultado[claveJs] = valor
  }
  return resultado
}

const transformarParaSupabase = (pacienteJs) => {
  if (!pacienteJs) return null
  const resultado = {}
  for (const [claveJs, valor] of Object.entries(pacienteJs)) {
    if (claveJs === 'createdAt' || claveJs === 'updatedAt' || claveJs === 'userId') {
      continue
    }
    const claveDb = CAMEL_TO_SNAKE_MAP[claveJs] || claveJs
    if (valor === '' && claveJs !== 'notas') {
      resultado[claveDb] = null
    } else if (valor !== undefined) {
      resultado[claveDb] = valor
    }
  }
  return resultado
}

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
  if (!USE_SUPABASE || !supabase) {
    return pacientesCache
  }

  try {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[pacientesStorageService] Error al sincronizar desde Supabase:', error.message)
      return pacientesCache
    }

    if (!Array.isArray(data)) return pacientesCache

    // Si Supabase retorna vacío pero hay caché con datos, puede ser que la
    // migración aún no haya corrido. No sobrescribimos la caché.
    if (data.length === 0 && pacientesCache && pacientesCache.length > 0) {
      console.log('[pacientesStorageService] Supabase vacío, manteniendo caché (pendiente migración)')
      return pacientesCache
    }

    const nuevos = data.map(transformarDesdeSupabase).filter(Boolean)
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
        console.error(`[pacientesStorageService] Error al insertar ${paciente.nombre}:`, insertError.message)
        continue
      }

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

    // DELETE pacientes eliminados
    const { data: pacientesSupabase } = await supabase
      .from('pacientes')
      .select('id')

    if (Array.isArray(pacientesSupabase)) {
      const idsAEliminar = pacientesSupabase
        .map(p => p.id)
        .filter(id => !idsEnMemoria.has(id))

      if (idsAEliminar.length > 0) {
        const { error: deleteError } = await supabase
          .from('pacientes')
          .delete()
          .in('id', idsAEliminar)

        if (deleteError) {
          console.error('[pacientesStorageService] Error al eliminar en Supabase:', deleteError.message)
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
