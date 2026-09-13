/**
 * Transformaciones de datos para pagos (Supabase ↔ JavaScript)
 *
 * Extraído de pagosStorageService.js para respetar límites arquitectónicos.
 *
 * Responsabilidad:
 * - Mapeo entre snake_case (DB) y camelCase (JS)
 * - Transformación de objetos para lectura/escritura en Supabase
 * - Commit J: filtrado por allowlist para omitir columnas que no existen en Supabase
 */
import { migrationStorageService } from '../../../services/migrationStorageService'
import { esUuidValido } from '../../../services/migrations/uuidUtils'

// ═══════════════════════════════════════════════════════════════════
// MAPEO COMPLETO DE CLAVES: DB (snake_case) ↔ JS (camelCase)
// ═══════════════════════════════════════════════════════════════════

// Mapa COMPLETO: TODAS las columnas que la app conoce.
// Si una columna es igual en DB y JS (ej: 'monto'), se omite del mapa
// y se pasa tal cual.
export const SNAKE_TO_CAMEL_MAP = {
  paciente_id: 'pacienteId',
  metodo_pago: 'metodoPago',
  user_id: 'userId',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  motivo_anulacion: 'motivoAnulacion',
  fecha_anulacion: 'fechaAnulacion',
  folio_comprobante: 'folioComprobante',
  tipo_dte: 'tipoDTE',
  folio_dte: 'folioDTE',
  paciente_nombre: 'pacienteNombre',
  paciente_rut: 'pacienteRut'
}

export const CAMEL_TO_SNAKE_MAP = Object.fromEntries(
  Object.entries(SNAKE_TO_CAMEL_MAP).map(([snake, camel]) => [camel, snake])
)

// ═══════════════════════════════════════════════════════════════════
// ALLOWLIST DE COLUMNAS VÁLIDAS EN SUPABASE (Commit J)
// ═══════════════════════════════════════════════════════════════════
//
// Columnas que SÍ existen en la tabla `pagos` de Supabase.
// Cualquier campo fuera de esta lista se omite en el upsert para
// evitar error 400 "Could not find the 'X' column of 'pagos' in the
// schema cache".
//
// Columnas que viven solo en memoria/localStorage (NO en Supabase):
// - emitidoPor, prestacionesImputadas (campos de UI)
// - motivoPurga, fechaPurga, purgadoPor (auditoría en log y Excel)
const COLUMNAS_SUPABASE_VALIDAS = new Set([
  'id',
  'folio_comprobante', 'tipo_dte', 'folio_dte',
  'paciente_id', 'paciente_nombre', 'paciente_rut',
  'fecha', 'hora', 'monto', 'metodo_pago',
  'concepto', 'estado', 'observacion',
  'user_id', 'motivo_anulacion', 'fecha_anulacion',
  'created_at', 'updated_at'
])

// ═══════════════════════════════════════════════════════════════════
// TRANSFORMACIONES
// ═══════════════════════════════════════════════════════════════════

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
 * Omite columnas que no existen en Supabase (Commit J).
 */
export const transformarParaSupabase = (pagoJs) => {
  if (!pagoJs) return null
  const filtrado = {}
  for (const [claveJs, valor] of Object.entries(pagoJs)) {
    if (claveJs === 'createdAt' || claveJs === 'updatedAt' || claveJs === 'userId') {
      continue
    }
    const claveDb = CAMEL_TO_SNAKE_MAP[claveJs] || claveJs

    // Commit J: filtrar columnas que no existen en Supabase
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
