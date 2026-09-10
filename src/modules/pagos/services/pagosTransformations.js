/**
 * Transformaciones de datos para pagos (Supabase ↔ JavaScript)
 *
 * Extraído de pagosStorageService.js para respetar límites arquitectónicos.
 *
 * Responsabilidad:
 * - Mapeo entre snake_case (DB) y camelCase (JS)
 * - Transformación de objetos para lectura/escritura en Supabase
 */
import { migrationStorageService } from '../../../services/migrationStorageService'
import { esUuidValido } from '../../../services/migrations/uuidUtils'

// ═══════════════════════════════════════════════════════════════════
// MAPEO DE CLAVES: DB (snake_case) ↔ JS (camelCase)
// ═══════════════════════════════════════════════════════════════════

export const SNAKE_TO_CAMEL_MAP = {
  paciente_id: 'pacienteId',
  metodo_pago: 'metodoPago',
  user_id: 'userId',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  motivo_anulacion: 'motivoAnulacion',
  fecha_anulacion: 'fechaAnulacion'
}

export const CAMEL_TO_SNAKE_MAP = Object.fromEntries(
  Object.entries(SNAKE_TO_CAMEL_MAP).map(([snake, camel]) => [camel, snake])
)

// ═══════════════════════════════════════════════════════════════════
// TRANSFORMACIONES
// ═══════════════════════════════════════════════════════════════════

/**
 * Transforma un pago desde Supabase (snake_case) a JavaScript (camelCase)
 * @param {Object} pagoDb - Objeto de pago desde Supabase
 * @returns {Object|null} - Objeto transformado o null si pagoDb es inválido
 */
export const transformarDesdeSupabase = (pagoDb) => {
  if (!pagoDb) return null
  const resultado = {}
  for (const [claveDb, valor] of Object.entries(pagoDb)) {
    const claveJs = SNAKE_TO_CAMEL_MAP[claveDb] || claveDb
    resultado[claveJs] = valor
  }
  return resultado
}

/**
 * Transforma un pago desde JavaScript (camelCase) a Supabase (snake_case)
 * @param {Object} pagoJs - Objeto de pago en formato JavaScript
 * @returns {Object|null} - Objeto transformado o null si pagoJs es inválido
 */
export const transformarParaSupabase = (pagoJs) => {
  if (!pagoJs) return null
  const resultado = {}
  for (const [claveJs, valor] of Object.entries(pagoJs)) {
    if (claveJs === 'createdAt' || claveJs === 'updatedAt' || claveJs === 'userId') {
      continue
    }
    const claveDb = CAMEL_TO_SNAKE_MAP[claveJs] || claveJs
    if (claveJs === 'pacienteId') {
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
