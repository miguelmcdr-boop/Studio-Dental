/**
 * Funciones de transformación de datos de pacientes
 * Extraído de pacientesStorageService.js para respetar límite arquitectónico
 */

/**
 * Mapeo de campos snake_case (Supabase) a camelCase (JS)
 */
export const SNAKE_TO_CAMEL_MAP = {
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

/**
 * Mapeo inverso: camelCase (JS) a snake_case (Supabase)
 */
export const CAMEL_TO_SNAKE_MAP = Object.fromEntries(
  Object.entries(SNAKE_TO_CAMEL_MAP).map(([snake, camel]) => [camel, snake])
)

/**
 * Transforma un paciente desde formato Supabase (snake_case) a JS (camelCase)
 * @param {Object} pacienteDb - Paciente en formato Supabase
 * @returns {Object|null} Paciente en formato JS o null si es inválido
 */
export const transformarDesdeSupabase = (pacienteDb) => {
  if (!pacienteDb) return null
  const resultado = {}
  for (const [claveDb, valor] of Object.entries(pacienteDb)) {
    const claveJs = SNAKE_TO_CAMEL_MAP[claveDb] || claveDb
    resultado[claveJs] = valor
  }
  return resultado
}

/**
 * Transforma un paciente desde formato JS (camelCase) a Supabase (snake_case)
 * @param {Object} pacienteJs - Paciente en formato JS
 * @returns {Object|null} Paciente en formato Supabase o null si es inválido
 */
export const transformarParaSupabase = (pacienteJs) => {
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
