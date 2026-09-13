/**
 * Transformaciones de datos para pagos (Supabase <-> JavaScript)
 *
 * Extraido de pagosStorageService.js para respetar limites arquitectonicos.
 *
 * Responsabilidad:
 * - Mapeo entre snake_case (DB) y camelCase (JS)
 * - Transformacion de objetos para lectura/escritura en Supabase
 * - Commit K1: allowlist ajustada a schema REAL de Supabase
 */
import { migrationStorageService } from '../../../services/migrationStorageService'
import { esUuidValido } from '../../../services/migrations/uuidUtils'

// MAPEO DE CLAVES: DB (snake_case) <-> JS (camelCase)
// Schema real de Supabase (consultado el 2026-09-13):
// id, user_id, paciente_id, folio, monto, metodo_pago, fecha,
// concepto, created_at, updated_at, clinica_id, estado,
// motivo_anulacion, fecha_anulacion
export const SNAKE_TO_CAMEL_MAP = {
  paciente_id: 'pacienteId',
  metodo_pago: 'metodoPago',
  user_id: 'userId',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  motivo_anulacion: 'motivoAnulacion',
  fecha_anulacion: 'fechaAnulacion',
  clinica_id: 'clinicaId',
  folio: 'folioComprobante'
}

export const CAMEL_TO_SNAKE_MAP = Object.fromEntries(
  Object.entries(SNAKE_TO_CAMEL_MAP).map(([snake, camel]) => [camel, snake])
)

// ALLOWLIST DE COLUMNAS VALIDAS EN SUPABASE (Commit K1)
// Columnas que SI existen en la tabla pagos de Supabase (schema real).
// Cualquier campo fuera de esta lista se omite en el upsert.
//
// Columnas que viven solo en memoria/localStorage (NO en Supabase):
// - tipoDTE, folioDTE, pacienteNombre, pacienteRut, hora, observacion
// - emitidoPor, prestacionesImputadas (campos de UI)
// - motivoPurga, fechaPurga, purgadoPor (auditoria en log y Excel)
const COLUMNAS_SUPABASE_VALIDAS = new Set([
  'id', 'user_id', 'paciente_id', 'clinica_id',
  'folio', 'monto', 'metodo_pago', 'fecha',
  'concepto', 'estado',
  'motivo_anulacion', 'fecha_anulacion',
  'created_at', 'updated_at'
])

/**
 * Transforma un pago desde Supabase (snake_case) a JavaScript (camelCase)
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
 * Transforma un pago desde JavaScript (camelCase) a Supabase (snake_case).
 * Omite columnas que no existen en Supabase (Commit K1).
 */
export const transformarParaSupabase = (pagoJs) => {
  if (!pagoJs) return null
  const filtrado = {}
  for (const [claveJs, valor] of Object.entries(pagoJs)) {
    if (claveJs === 'createdAt' || claveJs === 'updatedAt' || claveJs === 'userId') {
      continue
    }
    const claveDb = CAMEL_TO_SNAKE_MAP[claveJs] || claveJs

    // Commit K1: filtrar columnas que no existen en Supabase
    if (!COLUMNAS_SUPABASE_VALIDAS.has(claveDb)) continue

    if (claveJs === 'pacienteId') {
      if (esUuidValido(valor)) {
        filtrado.paciente_id = valor
      } else if (valor !== null && valor !== undefined) {
        const pacienteUuid = migrationStorageService.obtenerSupabaseId(valor)
        filtrado.paciente_id = pacienteUuid || null
      } else {
        filtrado.paciente_id = null
      }
    } else if (valor === '' || valor === null || valor === undefined) {
      filtrado[claveDb] = null
    } else {
      filtrado[claveDb] = valor
    }
  }
  return filtrado
}
