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
import { createLocalStorageRepository } from '../../../services/localStorageRepository'
import { validarListaCitas } from '../schemas/citaSchema'
import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'
import { migrationStorageService } from '../../../services/migrationStorageService'
import { esUuidValido } from '../../../services/migrations/uuidUtils'

const STORAGE_KEY_AGENDA = 'studio_dental_agenda_citas_v3'
const citasRepo = createLocalStorageRepository(STORAGE_KEY_AGENDA, [], { notify: true })

// Caché en memoria: evita lecturas repetidas de localStorage y permite
// que la API pública permanezca síncrona.
let citasCache = null
let cacheInicializado = false

// ═══════════════════════════════════════════════════════════════════
// MAPEO DE ESTADOS
// ═══════════════════════════════════════════════════════════════════

const ESTADO_CODIGO_A_SUPABASE = {
  'Agendado': 'Agendada',
  'Confirmado': 'Confirmada',
  'En Sillón': 'En Curso',
  'Completado': 'Completada',
  'Cancelado': 'Cancelada',
  'No Asistió': 'No Asistió',
  'Agendada': 'Agendada',
  'Confirmada': 'Confirmada',
  'En Curso': 'En Curso',
  'Completada': 'Completada',
  'Cancelada': 'Cancelada'
}

const ESTADO_SUPABASE_A_CODIGO = {
  'Agendada': 'Agendado',
  'Confirmada': 'Confirmado',
  'En Curso': 'En Sillón',
  'Completada': 'Completado',
  'Cancelada': 'Cancelado',
  'No Asistió': 'No Asistió',
  'Agendado': 'Agendado',
  'Confirmado': 'Confirmado',
  'En Sillón': 'En Sillón',
  'Completado': 'Completado',
  'Cancelado': 'Cancelado'
}

const normalizarEstadoParaSupabase = (estado) => {
  return ESTADO_CODIGO_A_SUPABASE[estado] || 'Agendada'
}

const desnormalizarEstadoParaCodigo = (estado) => {
  return ESTADO_SUPABASE_A_CODIGO[estado] || 'Agendado'
}

// ═══════════════════════════════════════════════════════════════════
// MAPEO DE CAMPOS (camelCase JS ↔ snake_case SQL)
// ═══════════════════════════════════════════════════════════════════

const SNAKE_TO_CAMEL_MAP = {
  paciente_id: 'pacienteId',
  paciente_nombre: 'pacienteNombre',
  paciente_telefono: 'pacienteTelefono',
  paciente_rut: 'pacienteRut',
  hora_inicio: 'horaInicio',
  hora_fin: 'horaFin',
  box_asignado: 'boxAsignado',
  hora_inicio_atencion: 'horaInicioAtencion',
  user_id: 'userId',
  created_at: 'createdAt',
  updated_at: 'updatedAt'
}

const CAMEL_TO_SNAKE_MAP = Object.fromEntries(
  Object.entries(SNAKE_TO_CAMEL_MAP).map(([snake, camel]) => [camel, snake])
)

/**
 * Convierte una cita de Supabase (snake_case) a formato JS (camelCase).
 * También desnormaliza el estado al formato del código.
 */
const transformarDesdeSupabase = (citaDb) => {
  if (!citaDb) return null
  const resultado = {}
  for (const [claveDb, valor] of Object.entries(citaDb)) {
    const claveJs = SNAKE_TO_CAMEL_MAP[claveDb] || claveDb
    if (claveJs === 'estado') {
      resultado[claveJs] = desnormalizarEstadoParaCodigo(valor)
    } else {
      resultado[claveJs] = valor
    }
  }
  return resultado
}

/**
 * Convierte una cita de formato JS (camelCase) a Supabase (snake_case).
 * Normaliza el estado al formato esperado por la tabla.
 */
const transformarParaSupabase = (citaJs) => {
  if (!citaJs) return null
  const resultado = {}
  for (const [claveJs, valor] of Object.entries(citaJs)) {
    if (claveJs === 'createdAt' || claveJs === 'updatedAt' || claveJs === 'userId') {
      continue
    }
    const claveDb = CAMEL_TO_SNAKE_MAP[claveJs] || claveJs
    if (claveJs === 'estado') {
      resultado[claveDb] = normalizarEstadoParaSupabase(valor)
    } else if (claveJs === 'pacienteId') {
      // Resolver pacienteId: si es legacy, buscar en el mapa de migración
      if (esUuidValido(valor)) {
        resultado.paciente_id = valor
      } else if (valor !== null && valor !== undefined) {
        const pacienteUuid = migrationStorageService.obtenerSupabaseId(valor)
        resultado.paciente_id = pacienteUuid || null
      } else {
        resultado.paciente_id = null
      }
    } else if (valor === '') {
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
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .order('fecha', { ascending: false })
      .order('hora_inicio', { ascending: true })

    if (error) {
      console.warn('[agendaStorageService] Error al sincronizar desde Supabase:', error.message)
      return citasCache
    }

    if (!Array.isArray(data)) return citasCache

    // Si Supabase retorna vacío pero hay caché con datos, puede ser que la
    // migración aún no haya corrido. No sobrescribimos la caché.
    if (data.length === 0 && citasCache && citasCache.length > 0) {
      console.log('[agendaStorageService] Supabase vacío, manteniendo caché (pendiente migración)')
      return citasCache
    }

    const nuevas = data.map(transformarDesdeSupabase).filter(Boolean)
    citasCache = nuevas
    citasRepo.guardar(nuevas)

    return nuevas
  } catch (error) {
    console.error('[agendaStorageService] Excepción al sincronizar desde Supabase:', error)
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
    console.error('Error de validación al guardar citas (F2-04b):', validacion.error)
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
        console.error('[agendaStorageService] Error al actualizar en Supabase:', updateError.message)
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
        console.error(`[agendaStorageService] Error al insertar cita:`, insertError.message)
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

    // DELETE citas eliminadas
    const { data: citasSupabase } = await supabase
      .from('citas')
      .select('id')

    if (Array.isArray(citasSupabase)) {
      const idsAEliminar = citasSupabase
        .map(c => c.id)
        .filter(id => !idsEnMemoria.has(id))

      if (idsAEliminar.length > 0) {
        const { error: deleteError } = await supabase
          .from('citas')
          .delete()
          .in('id', idsAEliminar)

        if (deleteError) {
          console.error('[agendaStorageService] Error al eliminar en Supabase:', deleteError.message)
        }
      }
    }

    // Persistir la caché actualizada (con UUIDs nuevos)
    citasRepo.guardar(citasCache)

    return true
  } catch (error) {
    console.error('[agendaStorageService] Excepción al guardar en Supabase:', error)
    return true
  }
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
  sincronizarDesdeSupabase,
  resetCache
}
