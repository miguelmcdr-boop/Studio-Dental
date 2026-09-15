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
 * Nota: Los métodos legacy de abonos por paciente fueron extraídos a
 * pagosAbonosLegacyService.js (F3-02 refactor). Se migrarán a Supabase en F4-02d.
 */
import { leerJSON, escribirJSON, createLocalStorageRepository } from '../../../services/localStorageRepository'
import { supabase, USE_SUPABASE } from '../../../services/supabaseClient'
import { migrationStorageService } from '../../../services/migrationStorageService'
import { esUuidValido } from '../../../services/migrations/uuidUtils'
import { transformarDesdeSupabase, transformarParaSupabase, mergeCamposLocales } from './pagosTransformations'
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

    const previos = pagosCache || pagosRepo.obtener([])
    const nuevos = mergeCamposLocales(data.map(transformarDesdeSupabase).filter(Boolean), previos)
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
// API PÚBLICA — métodos legacy de abonos por paciente (localStorage, migración pendiente F4-02d)
// ═══════════════════════════════════════════════════════════════════

export const pagosStorageService = {
  obtenerPagos,
  guardarPagos,
  sincronizarDesdeSupabase,
  resetCache,




  // Elimina un pago global específico (F10-C3.12)
  eliminarPago: (pagoId) => {
    const actuales = pagosCache || pagosRepo.obtener([])
    const actualizados = actuales.filter(p => String(p.id) !== String(pagoId))
    pagosCache = actualizados
    pagosRepo.guardar(actualizados)
    if (USE_SUPABASE && supabase && esUuidValido(pagoId)) {
      supabase.from('pagos').delete().eq('id', pagoId)
        .then(({ error }) => { if (error) log.error('Error eliminando pago Supabase:', error) })
    }
    return true
  },



  // Purga = marcar estado 'Purgado' (Commit H — auditoría inmutable, sin hard delete)
  purgarPago: (pagoId, motivo, userId = null) => {
    const actuales = pagosCache || pagosRepo.obtener([])
    const pago = actuales.find(p => String(p.id) === String(pagoId))
    if (!pago) { log.warn(`purgarPago: pago ${pagoId} no encontrado`); return false }
    const actualizados = actuales.map(p => String(p.id) === String(pagoId) ? { ...p, estado: 'Purgado', motivoPurga: motivo, fechaPurga: new Date().toLocaleDateString('es-CL'), purgadoPor: userId } : p)
    pagosCache = actualizados
    pagosRepo.guardar(actualizados)
    log.warn(`[AUDITORÍA] Purga: id=${pagoId}, folio=${pago.folioComprobante || 's/d'}, monto=${pago.monto}, motivo="${motivo}", userId=${userId}, fecha=${new Date().toISOString()}`)
    if (USE_SUPABASE && supabase && esUuidValido(pagoId)) {
      supabase.from('pagos').update({ estado: 'Purgado' }).eq('id', pagoId)
        .then(({ error }) => { if (error) log.error('Error purgando Supabase:', error) })
    }
    return true
  },



  // BUG-ABONOS-PAGOS: Crear pago desde abono registrado en Ficha Clínica
  // Cuando se registra un abono en el Plan de Tratamiento, este método crea
  // el pago correspondiente en el módulo Pagos para mantener sincronización.
  crearPagoDesdeAbono: (paciente, abono) => {
    if (!paciente?.id || !abono?.id) {
      log.warn('crearPagoDesdeAbono: paciente o abono inválido')
      return false
    }

    const actuales = pagosCache || pagosRepo.obtener([])
    // Verificar que no exista ya un pago con este ID (idempotencia)
    const existe = actuales.some(p => String(p.id) === String(abono.id))
    if (existe) {
      log.info(`crearPagoDesdeAbono: pago ${abono.id} ya existe, omitiendo`)
      return true
    }

    // Generar folio único: REC-YYYY-XXXX (donde XXXX es timestamp-based)
    const año = new Date().getFullYear()
    const secuencia = String(Date.now()).slice(-4)
    const folioComprobante = `REC-${año}-${secuencia}`

    // Crear objeto pago con MISMO ID que el abono (crítico para eliminación)
    const nuevoPago = {
      id: abono.id,
      folioComprobante,
      tipoDTE: 'recibo_interno',
      folioDTE: null,
      pacienteId: paciente.id,
      pacienteNombre: paciente.nombre || abono.pacienteNombre || '',
      pacienteRut: paciente.rut || '',
      fecha: abono.fecha || new Date().toLocaleDateString('es-CL'),
      hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      monto: parseInt(abono.monto || 0),
      metodoPago: abono.metodoPago || 'Efectivo',
      concepto: 'Abono Plan de Tratamiento',
      estado: 'Emitido',
      prestacionesImputadas: [],
      emitidoPor: 'Sistema (desde Ficha Clínica)',
      observacion: 'Abono registrado desde Plan de Tratamiento del paciente'
    }

    const actualizados = [nuevoPago, ...actuales]
    pagosCache = actualizados
    pagosRepo.guardar(actualizados)

    log.info(`crearPagoDesdeAbono: pago ${folioComprobante} creado para paciente ${paciente.nombre}`)
    return true
  },

  obtenerPagosParaAuditoria: () => pagosCache || pagosRepo.obtener([])
}
