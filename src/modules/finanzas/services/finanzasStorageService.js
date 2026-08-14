/**
 * Persistencia de Finanzas (F4-02c-5 — migración a Supabase).
 *
 * Estrategia:
 * - Movimientos financieros (Ingresos/Egresos) → migrados a Supabase
 * - Convenios e Isapres → se mantienen en localStorage (no hay tabla en Supabase)
 * - Cierres y Arqueos de Caja → se mantienen en localStorage (no hay tabla en Supabase)
 *
 * API pública:
 * - obtenerMovimientos()              → SÍNCRONO, retorna de caché en memoria
 * - guardarMovimientos()              → ASYNC, escribe en Supabase + actualiza caché
 * - sincronizarDesdeSupabase()        → ASYNC, refresca caché desde Supabase
 * - resetCache()                      → limpia caché (para tests)
 *
 * Convenios y cierres de caja siguen el patrón legacy (localStorage directo)
 * porque no hay tablas correspondientes en Supabase en esta fase.
 * Se migrarán en F4-02d si es necesario.
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'
import { validarListaMovimientos } from '../schemas/movimientoFinancieroSchema'
import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'
import { migrationStorageService } from '../../../services/migrationStorageService'
import { esUuidValido } from '../../../services/migrations/uuidUtils'

const STORAGE_KEY_MOVIMIENTOS = 'studio_dental_finanzas_movimientos'
const STORAGE_KEY_CONVENIOS = 'studio_dental_finanzas_convenios'
const STORAGE_KEY_CIERRES = 'studio_dental_finanzas_cierres_caja'

const movimientosRepo = createLocalStorageRepository(STORAGE_KEY_MOVIMIENTOS, [])
const conveniosRepo = createLocalStorageRepository(STORAGE_KEY_CONVENIOS, [])
const cierresRepo = createLocalStorageRepository(STORAGE_KEY_CIERRES, [])

// Caché en memoria solo para movimientos
let movimientosCache = null
let cacheInicializado = false

// ═══════════════════════════════════════════════════════════════════
// MAPEO DE CAMPOS (camelCase JS ↔ snake_case SQL)
// ═══════════════════════════════════════════════════════════════════

const SNAKE_TO_CAMEL_MAP = {
  metodo_pago: 'metodoPago',
  user_id: 'userId',
  created_at: 'createdAt',
  updated_at: 'updatedAt'
}

const CAMEL_TO_SNAKE_MAP = Object.fromEntries(
  Object.entries(SNAKE_TO_CAMEL_MAP).map(([snake, camel]) => [camel, snake])
)

const transformarDesdeSupabase = (movimientoDb) => {
  if (!movimientoDb) return null
  const resultado = {}
  for (const [claveDb, valor] of Object.entries(movimientoDb)) {
    const claveJs = SNAKE_TO_CAMEL_MAP[claveDb] || claveDb
    resultado[claveJs] = valor
  }
  return resultado
}

const transformarParaSupabase = (movimientoJs) => {
  if (!movimientoJs) return null
  const resultado = {}
  for (const [claveJs, valor] of Object.entries(movimientoJs)) {
    if (claveJs === 'createdAt' || claveJs === 'updatedAt' || claveJs === 'userId') {
      continue
    }
    const claveDb = CAMEL_TO_SNAKE_MAP[claveJs] || claveJs
    if (valor === '' || valor === null || valor === undefined) {
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
  const datos = movimientosRepo.obtener(defaults)
  movimientosCache = Array.isArray(datos) ? datos : defaults
  cacheInicializado = true
}

// ═══════════════════════════════════════════════════════════════════
// OBTENER MOVIMIENTOS (SÍNCRONO)
// ═══════════════════════════════════════════════════════════════════

const obtenerMovimientos = (defaults = []) => {
  if (!cacheInicializado) {
    inicializarCache(defaults)
  }
  return movimientosCache
}

// ═══════════════════════════════════════════════════════════════════
// SINCRONIZAR DESDE SUPABASE (ASYNC)
// ═══════════════════════════════════════════════════════════════════

const sincronizarDesdeSupabase = async () => {
  if (!USE_SUPABASE || !supabase) {
    return movimientosCache
  }

  try {
    const { data, error } = await supabase
      .from('movimientos_financieros')
      .select('*')
      .order('fecha', { ascending: false })

    if (error) {
      console.warn('[finanzasStorageService] Error al sincronizar desde Supabase:', error.message)
      return movimientosCache
    }

    if (!Array.isArray(data)) return movimientosCache

    if (data.length === 0 && movimientosCache && movimientosCache.length > 0) {
      console.log('[finanzasStorageService] Supabase vacío, manteniendo caché (pendiente migración)')
      return movimientosCache
    }

    const nuevos = data.map(transformarDesdeSupabase).filter(Boolean)
    movimientosCache = nuevos
    movimientosRepo.guardar(nuevos)

    return nuevos
  } catch (error) {
    console.error('[finanzasStorageService] Excepción al sincronizar desde Supabase:', error)
    return movimientosCache
  }
}

// ═══════════════════════════════════════════════════════════════════
// GUARDAR MOVIMIENTOS (ASYNC)
// ═══════════════════════════════════════════════════════════════════

const guardarMovimientos = async (movs) => {
  // (F2-04c) — validación Zod antes de persistir
  const validacion = validarListaMovimientos(movs)
  if (!validacion.valido) {
    console.error(
      'Error de validación al guardar movimientos financieros (F2-04c):',
      validacion.error
    )
    return false
  }
  const datos = validacion.datos

  // 1. Actualizar caché en memoria inmediatamente
  movimientosCache = datos
  cacheInicializado = true

  // 2. Persistir en localStorage como caché
  movimientosRepo.guardar(datos)

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

    for (const movimiento of datos) {
      if (esUuidValido(movimiento.id)) {
        aActualizar.push(movimiento)
        idsEnMemoria.add(movimiento.id)
      } else {
        aInsertar.push(movimiento)
      }
    }

    // UPDATE en batch
    if (aActualizar.length > 0) {
      const paraUpdate = aActualizar.map(m => ({
        ...transformarParaSupabase(m),
        user_id: user.id
      }))

      const { error: updateError } = await supabase
        .from('movimientos_financieros')
        .upsert(paraUpdate, { onConflict: 'id' })

      if (updateError) {
        console.error('[finanzasStorageService] Error al actualizar en Supabase:', updateError.message)
      }
    }

    // INSERT uno por uno
    for (const movimiento of aInsertar) {
      const paraInsert = {
        ...transformarParaSupabase(movimiento),
        user_id: user.id
      }
      delete paraInsert.id

      const { data: insertado, error: insertError } = await supabase
        .from('movimientos_financieros')
        .insert(paraInsert)
        .select('id')
        .single()

      if (insertError) {
        console.error(`[finanzasStorageService] Error al insertar movimiento:`, insertError.message)
        continue
      }

      // Actualizar el movimiento en caché con el nuevo UUID
      const index = movimientosCache.findIndex(m => !esUuidValido(m.id) &&
        m.fecha === movimiento.fecha && m.tipo === movimiento.tipo && m.monto === movimiento.monto)
      if (index >= 0) {
        const legacyId = movimientosCache[index].id
        movimientosCache[index] = { ...movimientosCache[index], id: insertado.id }
        migrationStorageService.registrarMapeo(legacyId, insertado.id)
      }
    }

    // DELETE movimientos eliminados
    const { data: movimientosSupabase } = await supabase
      .from('movimientos_financieros')
      .select('id')

    if (Array.isArray(movimientosSupabase)) {
      const idsAEliminar = movimientosSupabase
        .map(m => m.id)
        .filter(id => !idsEnMemoria.has(id))

      if (idsAEliminar.length > 0) {
        const { error: deleteError } = await supabase
          .from('movimientos_financieros')
          .delete()
          .in('id', idsAEliminar)

        if (deleteError) {
          console.error('[finanzasStorageService] Error al eliminar en Supabase:', deleteError.message)
        }
      }
    }

    // Persistir la caché actualizada
    movimientosRepo.guardar(movimientosCache)

    return true
  } catch (error) {
    console.error('[finanzasStorageService] Excepción al guardar en Supabase:', error)
    return true
  }
}

// ═══════════════════════════════════════════════════════════════════
// RESET CACHE (para tests)
// ═══════════════════════════════════════════════════════════════════

const resetCache = () => {
  movimientosCache = null
  cacheInicializado = false
}

// ═══════════════════════════════════════════════════════════════════
// API PÚBLICA (preserva métodos legacy de convenios y cierres)
// ═══════════════════════════════════════════════════════════════════

export const finanzasStorageService = {
  // Movimientos (Ingresos / Egresos) — con migración a Supabase
  obtenerMovimientos,
  guardarMovimientos,
  sincronizarDesdeSupabase,
  resetCache,

  // Convenios e Isapres — siguen en localStorage (no hay tabla en Supabase)
  obtenerConvenios: (defaults = []) => conveniosRepo.obtener(defaults),
  guardarConvenios: (convenios) => conveniosRepo.guardar(convenios),

  // Cierres y Arqueos de Caja — siguen en localStorage (no hay tabla en Supabase)
  obtenerCierresCaja: () => cierresRepo.obtener([]),
  guardarCierresCaja: (cierres) => cierresRepo.guardar(cierres)
}
