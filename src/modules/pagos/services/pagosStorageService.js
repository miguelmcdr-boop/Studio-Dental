/**
 * Persistencia de Pagos (F4-02c-5 — migración a Supabase).
 *
 * Estrategia de "caché local + sync en background":
 * - Pagos globales (historial completo) → migrados a Supabase
 * - Abonos por paciente (claves dinámicas) → siguen en localStorage (F4-02d)
 *
 * API pública:
 * - obtenerPagos()                    → SÍNCRONO, retorna de caché en memoria
 * - guardarPagos()                    → ASYNC, escribe en Supabase + actualiza caché
 * - sincronizarDesdeSupabase()        → ASYNC, refresca caché desde Supabase
 * - resetCache()                      → limpia caché (para tests)
 *
 * Nota: Los métodos de abonos por paciente (obtenerAbonosPorPaciente,
 * sincronizarAbonoConFichaPaciente, eliminarAbonosDePaciente) siguen usando
 * localStorage en esta fase. Se migrarán completamente en F4-02d.
 */
import { leerJSON, escribirJSON, createLocalStorageRepository } from '../../../services/localStorageRepository'
import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'
import { migrationStorageService } from '../../../services/migrationStorageService'
import { esUuidValido } from '../../../services/migrations/uuidUtils'
import { transformarDesdeSupabase, transformarParaSupabase } from './pagosTransformations'
import { createLogger } from '../../../services/logger'

const log = createLogger('pagosStorageService')

const STORAGE_KEY_PAGOS = 'studio_dental_pagos_historial_v3'
const pagosRepo = createLocalStorageRepository(STORAGE_KEY_PAGOS, [])

// Caché en memoria
let pagosCache = null
let cacheInicializado = false

// ═══════════════════════════════════════════════════════════════════
// INICIALIZACIÓN DE CACHÉ
// ═══════════════════════════════════════════════════════════════════

const inicializarCache = (defaults) => {
  if (cacheInicializado) return
  const datos = pagosRepo.obtener(defaults)
  pagosCache = Array.isArray(datos) ? datos : defaults
  cacheInicializado = true
}

// ═══════════════════════════════════════════════════════════════════
// OBTENER PAGOS (SÍNCRONO)
// ═══════════════════════════════════════════════════════════════════

const obtenerPagos = (defaults = []) => {
  if (!cacheInicializado) {
    inicializarCache(defaults)
  }
  return pagosCache
}

// ═══════════════════════════════════════════════════════════════════
// SINCRONIZAR DESDE SUPABASE (ASYNC)
// ═══════════════════════════════════════════════════════════════════

const sincronizarDesdeSupabase = async () => {
  if (!USE_SUPABASE || !supabase) {
    return pagosCache
  }

  try {
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .order('fecha', { ascending: false })

    if (error) {
      log.warn('Error al sincronizar desde Supabase:', error.message)
      return pagosCache
    }

    if (!Array.isArray(data)) return pagosCache

    if (data.length === 0 && pagosCache && pagosCache.length > 0) {
      log.info('Supabase vacío, manteniendo caché (pendiente migración)')
      return pagosCache
    }

    const nuevos = data.map(transformarDesdeSupabase).filter(Boolean)
    pagosCache = nuevos
    pagosRepo.guardar(nuevos)

    return nuevos
  } catch (error) {
    log.error('Excepción al sincronizar desde Supabase:', error)
    return pagosCache
  }
}

// ═══════════════════════════════════════════════════════════════════
// GUARDAR PAGOS (ASYNC)
// ═══════════════════════════════════════════════════════════════════

const guardarPagos = async (pagos) => {
  if (!Array.isArray(pagos)) {
    log.error('guardarPagos: se esperaba un array')
    return false
  }

  // 1. Actualizar caché en memoria inmediatamente
  pagosCache = pagos
  cacheInicializado = true

  // 2. Persistir en localStorage como caché
  pagosRepo.guardar(pagos)

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

    for (const pago of pagos) {
      if (esUuidValido(pago.id)) {
        aActualizar.push(pago)
        idsEnMemoria.add(pago.id)
      } else {
        aInsertar.push(pago)
      }
    }

    // UPDATE en batch
    if (aActualizar.length > 0) {
      const paraUpdate = aActualizar.map(p => ({
        ...transformarParaSupabase(p),
        user_id: user.id
      }))

      const { error: updateError } = await supabase
        .from('pagos')
        .upsert(paraUpdate, { onConflict: 'id' })

      if (updateError) {
        log.error('Error al actualizar en Supabase:', updateError.message)
      }
    }

    // INSERT uno por uno
    for (const pago of aInsertar) {
      const paraInsert = {
        ...transformarParaSupabase(pago),
        user_id: user.id
      }
      delete paraInsert.id

      const { data: insertado, error: insertError } = await supabase
        .from('pagos')
        .insert(paraInsert)
        .select('id')
        .single()

      if (insertError) {
        log.error(`Error al insertar pago:`, insertError.message)
        continue
      }

      // Actualizar el pago en caché con el nuevo UUID
      const index = pagosCache.findIndex(p => !esUuidValido(p.id) &&
        p.folio === pago.folio && p.monto === pago.monto)
      if (index >= 0) {
        const legacyId = pagosCache[index].id
        pagosCache[index] = { ...pagosCache[index], id: insertado.id }
        migrationStorageService.registrarMapeo(legacyId, insertado.id)
      }
    }

    // DELETE pagos eliminados
    const { data: pagosSupabase } = await supabase
      .from('pagos')
      .select('id')

    if (Array.isArray(pagosSupabase)) {
      const idsAEliminar = pagosSupabase
        .map(p => p.id)
        .filter(id => !idsEnMemoria.has(id))

      if (idsAEliminar.length > 0) {
        const { error: deleteError } = await supabase
          .from('pagos')
          .delete()
          .in('id', idsAEliminar)

        if (deleteError) {
          log.error('Error al eliminar en Supabase:', deleteError.message)
        }
      }
    }

    // Persistir la caché actualizada
    pagosRepo.guardar(pagosCache)

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
  pagosCache = null
  cacheInicializado = false
}

// ═══════════════════════════════════════════════════════════════════
// API PÚBLICA (preserva métodos legacy de abonos por paciente)
// ═══════════════════════════════════════════════════════════════════

export const pagosStorageService = {
  obtenerPagos,
  guardarPagos,
  sincronizarDesdeSupabase,
  resetCache,

  // Lee los abonos de un paciente específico (clave dinámica)
  // Nota: sigue usando localStorage (se migrará en F4-02d)
  obtenerAbonosPorPaciente: (pacienteId) => {
    if (!pacienteId) return []
    return leerJSON(`abonos_${pacienteId}`, [])
  },

  // Sincroniza el abono directamente en la ficha del paciente para actualizar su saldo
  // Nota: sigue usando localStorage (se migrará en F4-02d)
  sincronizarAbonoConFichaPaciente: (pacienteId, nuevoPago) => {
    if (!pacienteId) return
    const keyAbonos = `abonos_${pacienteId}`
    const abonosActuales = leerJSON(keyAbonos, [])

    const abonoObj = {
      id: nuevoPago.id,
      fecha: nuevoPago.fecha,
      monto: nuevoPago.monto,
      metodoPago: `${nuevoPago.metodoPago} (${nuevoPago.folioComprobante})`,
      pacienteNombre: nuevoPago.pacienteNombre
    }

    escribirJSON(keyAbonos, [abonoObj, ...abonosActuales], { notify: true })
  },

  // Elimina todos los abonos de un paciente (F2-07d)
  // Nota: sigue usando localStorage (se migrará en F4-02d)
  eliminarAbonosDePaciente: (pacienteId) => {
    if (!pacienteId) return
    try {
      localStorage.removeItem(`abonos_${pacienteId}`)
    } catch (e) {
      log.error(`Error al eliminar abonos del paciente ${pacienteId}:`, e)
    }
  },

  // Elimina un pago global específico (F10-C3.12)
  eliminarPago: (pagoId) => {
    const actuales = pagosCache || pagosRepo.obtener([])
    const actualizados = actuales.filter(p => String(p.id) !== String(pagoId))
    pagosCache = actualizados
    pagosRepo.guardar(actualizados)
    if (USE_SUPABASE && supabase && esUuidValido(pagoId)) {
      supabase.from('pagos').delete().eq('id', pagoId)
        .then(({ error }) => { if (error) log.error('Error al eliminar pago en Supabase:', error) })
    }
    return true
  },

  // Elimina un abono específico de la ficha del paciente (F10-C3.12)
  eliminarAbono: (pacienteId, abonoId) => {
    if (!pacienteId) return
    const key = `abonos_${pacienteId}`
    const actuales = leerJSON(key, [])
    escribirJSON(key, actuales.filter(a => String(a.id) !== String(abonoId)), { notify: true })
  }
}
