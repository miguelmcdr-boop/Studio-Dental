/**
 * Servicio de lectura de datos clínicos desde Supabase (F4-02d-1).
 *
 * Estrategia:
 * - Mantiene una caché en memoria por paciente
 * - Proporciona método async para sincronizar un paciente desde Supabase
 * - Métodos síncronos de lectura consultan la caché
 * - Fallback a localStorage si Supabase falla o no está configurado
 *
 * Esto permite que los componentes sigan usando API síncrona mientras
 * los datos se leen desde Supabase en background.
 *
 * Flujo:
 * 1. Al abrir ficha de paciente, llamar sincronizarPaciente(pacienteId)
 * 2. Los métodos de lectura consultan la caché (síncrono)
 * 3. Si la caché está vacía, devuelve fallback (localStorage o valor por defecto)
 */
import { supabase, USE_SUPABASE } from './supabaseClient'
import { leerJSON } from './localStorageRepository'

// Caché en memoria: Map<pacienteId, Map<tipoDato, datos>>
const cache = new Map()

/**
 * Sincroniza todos los datos clínicos de un paciente desde Supabase.
 * Debe llamarse al abrir la ficha de un paciente.
 *
 * @param {string} pacienteId - UUID del paciente en Supabase
 * @returns {Promise<void>}
 */
export const sincronizarPaciente = async (pacienteId) => {
  if (!USE_SUPABASE || !supabase || !pacienteId) {
    return
  }

  try {
    const datosPaciente = new Map()

    // 1. Evoluciones clínicas
    const { data: evoluciones } = await supabase
      .from('evoluciones_clinicas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha_hora', { ascending: false })

    if (evoluciones) {
      const evolucionesTransformadas = evoluciones.map(e => ({
        id: e.id,
        fechaHora: e.fecha_hora,
        texto: e.texto,
        tipo: e.tipo || 'evolucion'
      }))
      datosPaciente.set('evoluciones_notas', evolucionesTransformadas)
    }

    // Cargar certificados
    const { data: certificados } = await supabase
      .from('certificados')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha_emision', { ascending: false })

    if (certificados) {
      const certificadosTransformados = certificados.map(c => ({
        ...c.datos,
        id: c.id
      }))
      datosPaciente.set('certificados', certificadosTransformados)
    }

    // 2. Recetas
    const { data: recetas } = await supabase
      .from('recetas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false })

    if (recetas) {
      const recetasTransformadas = recetas.map(r => ({
        id: r.id,
        fecha: r.fecha,
        medicamentos: r.medicamentos,
        diagnostico: r.diagnostico,
        indicaciones: r.indicaciones,
        firma: r.firma
      }))
      datosPaciente.set('recetas', recetasTransformadas)
    }

    // 3. Odontograma inicial
    const { data: odontoInicial } = await supabase
      .from('odontogramas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .eq('tipo', 'inicial')
      .maybeSingle()

    if (odontoInicial) {
      datosPaciente.set('odonto_inicial', odontoInicial.datos || {})
    }

    // 4. Odontograma evolución
    const { data: odontoEvolucion } = await supabase
      .from('odontogramas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .eq('tipo', 'evolucion')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (odontoEvolucion) {
      datosPaciente.set('odonto_evolucion', odontoEvolucion.datos || {})
    }

    // 5. Periodontograma inicial
    const { data: periodontoInicial } = await supabase
      .from('periodontogramas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .eq('tipo', 'inicial')
      .maybeSingle()

    if (periodontoInicial) {
      datosPaciente.set('periodontograma', periodontoInicial.datos || {})
    }

    // 6. Periodontograma control
    const { data: periodontoControl } = await supabase
      .from('periodontogramas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .eq('tipo', 'control')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (periodontoControl) {
      datosPaciente.set('periodontograma_control', periodontoControl.datos || {})
    }

    // 7. Historial periodontal
    const { data: periodontoHistorial } = await supabase
      .from('periodontogramas_historial')
      .select('*')
      .eq('paciente_id', pacienteId)
      .maybeSingle()

    if (periodontoHistorial) {
      datosPaciente.set('periodonto_historial', periodontoHistorial.datos || {})
    }

    // 8. DSD config
    const { data: dsdConfig } = await supabase
      .from('dsd_configs')
      .select('*')
      .eq('paciente_id', pacienteId)
      .maybeSingle()

    if (dsdConfig) {
      datosPaciente.set('dsd_config', dsdConfig.config || {})
    }

    // 9. Odontopediatría
    const { data: pediatria } = await supabase
      .from('odontopediatria')
      .select('*')
      .eq('paciente_id', pacienteId)
      .maybeSingle()

    if (pediatria) {
      datosPaciente.set('pediatria', pediatria.datos || {})
    }

    // 10. Quirúrgico implantes
    const { data: implantes } = await supabase
      .from('quirurgico_implantes')
      .select('*')
      .eq('paciente_id', pacienteId)
      .maybeSingle()

    if (implantes) {
      datosPaciente.set('quirurgico_implantes', implantes.datos || [])
    }

    // 11. Quirúrgico endodoncia
    const { data: endodoncia } = await supabase
      .from('quirurgico_endodoncia')
      .select('*')
      .eq('paciente_id', pacienteId)
      .maybeSingle()

    if (endodoncia) {
      datosPaciente.set('quirurgico_endodoncia', endodoncia.datos || [])
    }

    // Guardar en caché
    cache.set(pacienteId, datosPaciente)
    console.log(`[datosClinicosSupabase] Paciente ${pacienteId} sincronizado desde Supabase`)
  } catch (error) {
    console.error(`[datosClinicosSupabase] Error al sincronizar paciente ${pacienteId}:`, error)
  }
}

/**
 * Lee un tipo de dato clínico de la caché.
 * Si no está en caché, hace fallback a localStorage.
 *
 * @param {string} pacienteId - UUID del paciente
 * @param {string} tipoDato - Tipo de dato ('evoluciones_notas', 'recetas', etc.)
 * @param {any} fallback - Valor por defecto si no hay datos
 * @returns {any} Los datos o el fallback
 */
export const obtenerDatoClinico = (pacienteId, tipoDato, fallback = null) => {
  if (!pacienteId) return fallback

  // Intentar leer de caché primero
  const cachePaciente = cache.get(pacienteId)
  if (cachePaciente) {
    const dato = cachePaciente.get(tipoDato)
    if (dato !== undefined) {
      return dato
    }
  }

  // Fallback a localStorage
  const legacyId = pacienteId // Asumimos que el ID ya es el legacy
  const localStorageKey = `${tipoDato}_${legacyId}`
  return leerJSON(localStorageKey, fallback)
}

/**
 * Limpia la caché de un paciente específico.
 *
 * @param {string} pacienteId - UUID del paciente
 */
export const limpiarCachePaciente = (pacienteId) => {
  cache.delete(pacienteId)
}



/**
 * ═══════════════════════════════════════════════════════════════════
 * MÉTODOS DE ESCRITURA (F4-02d-2)
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * Guarda una evolución clínica en Supabase.
 *
 * @param {string} pacienteId - UUID del paciente
 * @param {Object} evolucion - Datos de la evolución
 * @returns {Promise<Object|null>} La evolución guardada con UUID o null si falla
 */
export const guardarEvolucionClinica = async (pacienteId, evolucion) => {
  if (!USE_SUPABASE || !supabase || !pacienteId) {
    return null
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const evolucionSupabase = {
      user_id: user.id,
      paciente_id: pacienteId,
      fecha_hora: evolucion.fechaHora || new Date().toISOString(),
      texto: evolucion.texto || '',
      tipo: evolucion.tipo || 'evolucion'
    }

    // Si tiene ID y es UUID válido, actualizar; si no, insertar
    if (evolucion.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(evolucion.id)) {
      const { data, error } = await supabase
        .from('evoluciones_clinicas')
        .update(evolucionSupabase)
        .eq('id', evolucion.id)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('evoluciones_clinicas')
        .insert(evolucionSupabase)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('[datosClinicosSupabase] Error al guardar evolución:', error)
    return null
  }
}

/**
 * Guarda un certificado médico en Supabase.
 *
 * @param {string} pacienteId - UUID del paciente
 * @param {Object} certificado - Datos del certificado
 * @returns {Promise<Object|null>} El certificado guardado con UUID o null si falla
 */
// F6-D-6: Normalizar fecha de formato chileno (DD-MM-YYYY) a ISO (YYYY-MM-DD)
const normalizarFechaCertificado = (fecha) => {
  if (!fecha) return new Date().toISOString().split('T')[0]
  
  // Si ya está en formato ISO (YYYY-MM-DD), retornar tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha
  
  // Si está en formato chileno DD-MM-YYYY, convertir
  const match = fecha.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (match) {
    const [, dia, mes, anio] = match
    return `${anio}-${mes}-${dia}`
  }
  
  // Si está en formato DD/MM/YYYY, convertir
  const matchSlash = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (matchSlash) {
    const [, dia, mes, anio] = matchSlash
    return `${anio}-${mes}-${dia}`
  }
  
  // Fallback: usar fecha actual
  return new Date().toISOString().split('T')[0]
}

export const guardarCertificado = async (pacienteId, certificado) => {
  if (!USE_SUPABASE || !supabase || !pacienteId) {
    return null
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const certificadoSupabase = {
      user_id: user.id,
      paciente_id: pacienteId,
      fecha_emision: normalizarFechaCertificado(certificado.fechaEmision),
      tipo: certificado.tipo || 'asistencia',
      datos: certificado
    }

    if (certificado.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(certificado.id)) {
      const { data, error } = await supabase
        .from('certificados')
        .update(certificadoSupabase)
        .eq('id', certificado.id)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('certificados')
        .insert(certificadoSupabase)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('[datosClinicosSupabase] Error al guardar certificado:', error)
    return null
  }
}

/**
 * Guarda una receta en Supabase.
 *
 * @param {string} pacienteId - UUID del paciente
 * @param {Object} receta - Datos de la receta
 * @returns {Promise<Object|null>} La receta guardada con UUID o null si falla
 */
export const guardarReceta = async (pacienteId, receta) => {
  if (!USE_SUPABASE || !supabase || !pacienteId) {
    return null
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const recetaSupabase = {
      user_id: user.id,
      paciente_id: pacienteId,
      fecha: receta.fecha || new Date().toISOString().split('T')[0],
      medicamentos: receta.medicamentos || [],
      diagnostico: receta.diagnostico || '',
      indicaciones: receta.indicaciones || '',
      firma: receta.firma || ''
    }

    if (receta.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(receta.id)) {
      const { data, error } = await supabase
        .from('recetas')
        .update(recetaSupabase)
        .eq('id', receta.id)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('recetas')
        .insert(recetaSupabase)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('[datosClinicosSupabase] Error al guardar receta:', error)
    return null
  }
}

/**
 * Guarda un odontograma en Supabase.
 *
 * @param {string} pacienteId - UUID del paciente
 * @param {Object} odontograma - Datos del odontograma
 * @param {string} tipo - 'inicial' o 'evolucion'
 * @returns {Promise<Object|null>} El odontograma guardado o null si falla
 */
export const guardarOdontograma = async (pacienteId, odontograma, tipo = 'inicial') => {
  if (!USE_SUPABASE || !supabase || !pacienteId) {
    return null
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const odontogramaSupabase = {
      user_id: user.id,
      paciente_id: pacienteId,
      tipo: tipo,
      datos: odontograma,
      fecha_registro: new Date().toISOString().split('T')[0]
    }

    // Buscar si ya existe un odontograma de este tipo para este paciente
    const { data: existente } = await supabase
      .from('odontogramas')
      .select('id')
      .eq('paciente_id', pacienteId)
      .eq('tipo', tipo)
      .maybeSingle()

    if (existente) {
      const { data, error } = await supabase
        .from('odontogramas')
        .update(odontogramaSupabase)
        .eq('id', existente.id)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('odontogramas')
        .insert(odontogramaSupabase)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('[datosClinicosSupabase] Error al guardar odontograma:', error)
    return null
  }
}

/**
 * Guarda un periodontograma en Supabase.
 *
 * @param {string} pacienteId - UUID del paciente
 * @param {Object} periodontograma - Datos del periodontograma
 * @param {string} tipo - 'inicial' o 'control'
 * @returns {Promise<Object|null>} El periodontograma guardado o null si falla
 */
export const guardarPeriodontograma = async (pacienteId, periodontograma, tipo = 'inicial') => {
  if (!USE_SUPABASE || !supabase || !pacienteId) {
    return null
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const periodontogramaSupabase = {
      user_id: user.id,
      paciente_id: pacienteId,
      tipo: tipo,
      datos: periodontograma,
      fecha_registro: new Date().toISOString().split('T')[0]
    }

    const { data: existente } = await supabase
      .from('periodontogramas')
      .select('id')
      .eq('paciente_id', pacienteId)
      .eq('tipo', tipo)
      .maybeSingle()

    if (existente) {
      const { data, error } = await supabase
        .from('periodontogramas')
        .update(periodontogramaSupabase)
        .eq('id', existente.id)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('periodontogramas')
        .insert(periodontogramaSupabase)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('[datosClinicosSupabase] Error al guardar periodontograma:', error)
    return null
  }
}

/**
 * Guarda el historial de controles periodontales en Supabase (F6-D-3).
 *
 * La tabla periodontogramas_historial tiene estructura diferente a periodontogramas:
 * - Columna 'controles' (jsonb) en lugar de 'datos'
 * - Sin columnas 'tipo' ni 'fecha_registro'
 *
 * @param {string} pacienteId - UUID del paciente
 * @param {Array} historial - Historial de controles periodontales
 * @returns {Promise<Object|null>} El historial guardado o null si falla
 */
export const guardarPeriodontogramaHistorial = async (pacienteId, historial) => {
  if (!USE_SUPABASE || !supabase || !pacienteId) {
    return null
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const historialSupabase = {
      user_id: user.id,
      paciente_id: pacienteId,
      controles: historial
    }

    // Buscar si ya existe un historial para este paciente
    const { data: existente } = await supabase
      .from('periodontogramas_historial')
      .select('id')
      .eq('paciente_id', pacienteId)
      .maybeSingle()

    if (existente) {
      const { data, error } = await supabase
        .from('periodontogramas_historial')
        .update(historialSupabase)
        .eq('id', existente.id)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('periodontogramas_historial')
        .insert(historialSupabase)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('[datosClinicosSupabase] Error al guardar historial periodontal:', error)
    return null
  }
}

/**
 * Guarda datos genéricos en una tabla específica.
 *
 * @param {string} pacienteId - UUID del paciente
 * @param {string} tabla - Nombre de la tabla en Supabase
 * @param {Object|Array} datos - Datos a guardar
 * @returns {Promise<Object|null>} Los datos guardados o null si falla
 */
export const guardarDatoGenerico = async (pacienteId, tabla, datos) => {
  if (!USE_SUPABASE || !supabase || !pacienteId) {
    return null
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const datosSupabase = {
      user_id: user.id,
      paciente_id: pacienteId,
      datos: datos
    }

    const { data: existente } = await supabase
      .from(tabla)
      .select('id')
      .eq('paciente_id', pacienteId)
      .maybeSingle()

    if (existente) {
      const { data, error } = await supabase
        .from(tabla)
        .update(datosSupabase)
        .eq('id', existente.id)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from(tabla)
        .insert(datosSupabase)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error(`[datosClinicosSupabase] Error al guardar dato en ${tabla}:`, error)
    return null
  }
}

/**
 * Limpia toda la caché.
 */
export const limpiarCacheCompleta = () => {
  cache.clear()
}
