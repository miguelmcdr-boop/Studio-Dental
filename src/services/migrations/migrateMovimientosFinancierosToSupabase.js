/**
 * Script de migración de movimientos financieros de localStorage a Supabase (F4-02c-5).
 *
 * Estrategia:
 * 1. Lee movimientos financieros de studio_dental_finanzas_movimientos
 * 2. Para cada movimiento:
 *    a. Si ya tiene UUID, se omite
 *    b. Si ya fue migrado (legacyId mapeado), se omite
 *    c. Se convierte a formato Supabase (snake_case)
 *    d. Se inserta en Supabase y se registra el mapeo legacyId → supabaseId
 * 3. Retorna un resumen de la migración
 *
 * Es idempotente: puede ejecutarse múltiples veces sin duplicar movimientos.
 *
 * Nota: convenios y cierres de caja NO se migran en esta fase (se mantienen
 * en localStorage). Se migrarán en F4-02d si es necesario.
 */
import { supabase } from '../supabaseClient'
import { finanzasStorageService } from '../../modules/finanzas/services/finanzasStorageService'
import { migrationStorageService } from '../migrationStorageService'
import { esUuidValido } from './uuidUtils'

/**
 * Convierte un movimiento financiero de formato localStorage (camelCase) a formato
 * Supabase (snake_case).
 */
const transformarMovimientoParaSupabase = (movimiento, userId) => {
  return {
    user_id: userId,
    fecha: movimiento.fecha || new Date().toISOString().split('T')[0],
    tipo: movimiento.tipo || 'Ingreso',
    categoria: movimiento.categoria || 'Sin categoría',
    monto: movimiento.monto || 0,
    metodo_pago: movimiento.metodoPago || 'Efectivo',
    descripcion: movimiento.descripcion || ''
  }
}

/**
 * Ejecuta la migración de movimientos financieros de localStorage a Supabase.
 *
 * @param {string} userId - UUID del usuario autenticado en Supabase
 * @returns {Promise<{success: boolean, migrados: number, omitidos: number, errores: Array}>}
 */
export const migrateMovimientosFinancierosToSupabase = async (userId) => {
  if (!supabase) {
    return {
      success: false,
      migrados: 0,
      omitidos: 0,
      errores: ['Supabase no configurado']
    }
  }

  if (!userId) {
    return {
      success: false,
      migrados: 0,
      omitidos: 0,
      errores: ['userId requerido para la migración']
    }
  }

  const movimientos = finanzasStorageService.obtenerMovimientos([])
  const resultado = {
    success: true,
    migrados: 0,
    omitidos: 0,
    errores: []
  }

  for (const movimiento of movimientos) {
    try {
      // Si ya tiene UUID, omitir (ya está en Supabase)
      if (esUuidValido(movimiento.id)) {
        resultado.omitidos++
        continue
      }

      // Si ya fue migrado (legacyId mapeado a UUID), omitir
      if (migrationStorageService.yaFueMigrado(movimiento.id)) {
        resultado.omitidos++
        continue
      }

      // Transformar a formato Supabase
      const movimientoSupabase = transformarMovimientoParaSupabase(movimiento, userId)

      // Insertar en Supabase
      const { data, error } = await supabase
        .from('movimientos_financieros')
        .insert(movimientoSupabase)
        .select('id')
        .single()

      if (error) {
        resultado.errores.push({
          movimientoId: movimiento.id,
          tipo: movimiento.tipo,
          error: error.message
        })
        continue
      }

      // Registrar mapeo legacyId → supabaseId
      migrationStorageService.registrarMapeo(movimiento.id, data.id)
      resultado.migrados++
    } catch (error) {
      resultado.errores.push({
        movimientoId: movimiento.id,
        tipo: movimiento.tipo,
        error: error.message
      })
    }
  }

  return resultado
}

/**
 * Verifica si hay movimientos financieros pendientes de migrar.
 *
 * @returns {{total: number, pendientes: number, yaMigrados: number}}
 */
export const verificarMovimientosPendientes = () => {
  const movimientos = finanzasStorageService.obtenerMovimientos([])
  let yaMigrados = 0

  for (const movimiento of movimientos) {
    if (esUuidValido(movimiento.id)) {
      yaMigrados++
      continue
    }
    if (migrationStorageService.yaFueMigrado(movimiento.id)) {
      yaMigrados++
    }
  }

  return {
    total: movimientos.length,
    pendientes: movimientos.length - yaMigrados,
    yaMigrados
  }
}
