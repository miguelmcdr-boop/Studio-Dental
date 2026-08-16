/**
 * Lógica de cálculos de anestesia local (F4-03d).
 *
 * Este archivo contiene la implementación completa de los cálculos de dosis
 * máxima de anestesia local según el vademécum v1.1 curado por odontólogo.
 * El archivo `anestesiaCalc.js` actúa como re-export delgado (wrapper) para
 * preservar la compatibilidad de imports existentes.
 *
 * APIs públicas:
 * - calcularTubosAnestesia(peso, tipoAnestesico) → API legada F1-03
 * - calcularDosisAnestesiaCompleta(params) → API enriquecida F4-03d
 * - listarAnestesicosDisponibles() → utilidad para selectores UI
 *
 * Fail-Safe Clinical Default (Constitución, Cap. V.2):
 * Si el peso no es válido, o si el anestésico no está en la tabla de referencia,
 * NUNCA se asume un valor por defecto ni se calcula una dosis "aproximada".
 *
 * Fuente de datos (doble fallback):
 * 1. vademecumService.obtenerDosisAnestesia() (v1.1 desde Supabase)
 * 2. DOSIS_RESPALDO_V10 (v1.0 hardcodeada, 4 anestésicos originales)
 */
import { vademecumService } from '../services/vademecumService'

// ═══════════════════════════════════════════════════════════════
// HELPERS DE NORMALIZACIÓN DE TEXTO
// ═══════════════════════════════════════════════════════════════

/**
 * Normaliza texto: minúsculas + elimina tildes/diacríticos.
 * Útil para comparar nombres de fármacos ignorando tildes y case.
 * Ej: "Articaína" → "articaina", "Lidocaína" → "lidocaina"
 *
 * @param {string|any} texto
 * @returns {string}
 */
export const normalizar = (texto) => {
  if (texto === null || texto === undefined) return ''
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // elimina diacríticos (tildes, dieresis)
}

// ═══════════════════════════════════════════════════════════════
// DATOS DE RESPALDO (v1.0 hardcodeados)
// Fallback si vademecumService retorna vacío o no está disponible
// ═══════════════════════════════════════════════════════════════
export const DOSIS_RESPALDO_V10 = {
  lidocaina: {
    numero: 1,
    nombreGenerico: 'Lidocaína 2% + Epinefrina 1:100.000',
    familia: 'anestesico_amida',
    mgPorKgAdulto: 4.4,
    topeAbsolutoAdulto: 300,
    mgPorKgPediatrico: 4.4,
    topeAbsolutoPediatrico: 300,
    mgPorTubo: 36,
    volumenPorTubo: 1.8,
    concentracionMgPorMl: 20,
    tieneVasoconstrictor: true,
    concentracionVasoconstrictor: 0.01,
    contraindicaciones: 'Bloqueo AV severo, feocromocitoma, alergia amidas, sulfito-sensibilidad',
    notasEspeciales: 'Embarazo: de elección (máx 2 tubos). Cardiopatías: limitar Epi a 0.04 mg.'
  },
  mepivacaina: {
    numero: 2,
    nombreGenerico: 'Mepivacaína 3% sin vasoconstrictor',
    familia: 'anestesico_amida',
    mgPorKgAdulto: 6.6,
    topeAbsolutoAdulto: 400,
    mgPorKgPediatrico: 4.4,
    topeAbsolutoPediatrico: 300,
    mgPorTubo: 54,
    volumenPorTubo: 1.8,
    concentracionMgPorMl: 30,
    tieneVasoconstrictor: false,
    concentracionVasoconstrictor: 0,
    contraindicaciones: 'Bloqueo AV, disfunción hepática severa',
    notasEspeciales: 'Elección en hipertensos no controlados y cardiopatías'
  },
  articaina: {
    numero: 3,
    nombreGenerico: 'Articaína 4% + Epinefrina 1:100.000',
    familia: 'anestesico_amida',
    mgPorKgAdulto: 7.0,
    topeAbsolutoAdulto: 500,
    mgPorKgPediatrico: 7.0,
    topeAbsolutoPediatrico: 500,
    mgPorTubo: 72,
    volumenPorTubo: 1.8,
    concentracionMgPorMl: 40,
    tieneVasoconstrictor: true,
    concentracionVasoconstrictor: 0.01,
    contraindicaciones: 'Metahemoglobinemia, déficit colinesterasa plasmática, asma por sulfitos',
    notasEspeciales: 'Contraindicado <4 años. Alta difusibilidad ósea.'
  },
  bupivacaina: {
    numero: 4,
    nombreGenerico: 'Bupivacaína 0.5% + Epinefrina 1:200.000',
    familia: 'anestesico_amida',
    mgPorKgAdulto: 1.3,
    topeAbsolutoAdulto: 90,
    mgPorKgPediatrico: null,
    topeAbsolutoPediatrico: null,
    mgPorTubo: 9,
    volumenPorTubo: 1.8,
    concentracionMgPorMl: 5,
    tieneVasoconstrictor: true,
    concentracionVasoconstrictor: 0.005,
    contraindicaciones: 'Cardiopatía isquémica severa, niños <12 años, arritmias ventriculares',
    notasEspeciales: 'Larga duración para cirugías complejas'
  }
}

// ═══════════════════════════════════════════════════════════════
// MAPA DE CLAVES (compatibilidad con API legada)
// Las claves usan versiones normalizadas (sin tildes, en minúsculas)
// ═══════════════════════════════════════════════════════════════
const MAPA_CLAVES = {
  lidocaina: { patron: /lidoca/i },
  mepivacaina: { patron: /mepivaca/i },
  articaina: { patron: /articaina/i },
  bupivacaina: { patron: /bupivaca/i },
  prilocaina: { patron: /prilocaina/i }
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN INTERNA: obtener datos de anestesia (con fallback)
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene datos de anestesia desde vademecumService.
 * Si falla o retorna vacío, usa DOSIS_RESPALDO_V10.
 * @returns {Array} Array de anestésicos con datos completos
 */
export const obtenerDatosAnestesia = () => {
  try {
    const desdeService = vademecumService?.obtenerDosisAnestesia?.()
    if (Array.isArray(desdeService) && desdeService.length > 0) {
      return desdeService.map((d) => ({
        numero: d.id,
        nombreGenerico: d.nombre,
        familia: d.familia,
        presentacion: d.presentacion,
        mgPorKgAdulto: d.mgPorKgAdulto || d.mgPorKgAdultoMax || null,
        topeAbsolutoAdulto: d.mgPorKgAdultoMax,
        mgPorKgPediatrico: d.mgPorKgAdulto,
        topeAbsolutoPediatrico: null,
        mgPorTubo: d.mgPorTubo,
        volumenPorTubo: d.volumenPorTubo || 1.8,
        concentracionMgPorMl: d.concentracionMgPorMl,
        tieneVasoconstrictor: normalizar(d.nombre || '').includes('epinefrina') || normalizar(d.nombre || '').includes('felipresina'),
        concentracionVasoconstrictor:
          (d.nombre || '').includes('1:100.000') ? 0.01
          : (d.nombre || '').includes('1:200.000') ? 0.005
          : 0,
        contraindicaciones: d.contraindicaciones,
        notasEspeciales: d.notas
      }))
    }
  } catch (e) {
    console.warn('[anestesiaCalc] vademecumService no disponible, usando respaldo v1.0:', e?.message)
  }

  // Fallback: datos hardcodeados v1.0
  return Object.entries(DOSIS_RESPALDO_V10).map(([clave, datos]) => ({
    clave,
    ...datos
  }))
}

/**
 * Busca anestésico por clave corta (API legada) o por número/nombre.
 * Usa normalización (sin tildes, case-insensitive) para robustez.
 * @param {string|number} tipoAnestesico
 * @returns {Object|null}
 */
export const buscarAnestesico = (tipoAnestesico) => {
  const datos = obtenerDatosAnestesia()

  // Búsqueda por clave corta normalizada (legada: lidocaina, mepivacaina, etc.)
  if (typeof tipoAnestesico === 'string') {
    const claveNormalizada = normalizar(tipoAnestesico)
    if (MAPA_CLAVES[claveNormalizada]) {
      const patron = MAPA_CLAVES[claveNormalizada].patron
      const encontrado = datos.find((d) => patron.test(normalizar(d.nombreGenerico || '')))
      if (encontrado) return encontrado
    }
  }

  // Búsqueda por número de vademécum
  if (typeof tipoAnestesico === 'number') {
    const encontrado = datos.find((d) => d.numero === tipoAnestesico)
    if (encontrado) return encontrado
  }

  // Búsqueda por texto en nombre genérico (normalizado)
  if (typeof tipoAnestesico === 'string') {
    const textoNormalizado = normalizar(tipoAnestesico)
    const encontrado = datos.find((d) =>
      normalizar(d.nombreGenerico || '').includes(textoNormalizado)
    )
    if (encontrado) return encontrado
  }

  return null
}

// ═══════════════════════════════════════════════════════════════
// GENERADOR DE ADVERTENCIAS CLÍNICAS (Sección 1 del vademécum v1.1)
// ═══════════════════════════════════════════════════════════════

/**
 * Genera advertencias clínicas automáticas según Sección 1 del vademécum v1.1.
 * @param {Object} anestesia
 * @param {Object} params
 * @returns {Array<string>}
 */
export const generarAdvertencias = (anestesia, params) => {
  const { esPediatria = false, esCardiopata = false, esEmbarazo = false, peso } = params
  const advertencias = []
  const nombreNorm = normalizar(anestesia.nombreGenerico || '')

  // 1. Embarazo + Felipresina
  if (esEmbarazo && nombreNorm.includes('felipresina')) {
    advertencias.push('⚠️ Felipresina: evitar en embarazo por estructura análoga a oxitocina (riesgo controvertido)')
  }

  // 2. Embarazo + vasoconstrictor
  if (esEmbarazo && anestesia.tieneVasoconstrictor) {
    advertencias.push('⚠️ Vasoconstrictor en embarazo: limitar a máximo 2 tubos por precaución')
  }

  // 3. Cardiopata + vasoconstrictor
  if (esCardiopata && anestesia.tieneVasoconstrictor) {
    const epiPorTubo = (anestesia.concentracionVasoconstrictor || 0) * (anestesia.volumenPorTubo || 1.8)
    if (epiPorTubo > 0) {
      const tubosMaximoEpi = Math.floor(0.04 / epiPorTubo)
      advertencias.push(`⚠️ Cardiopatía: limitar Epinefrina a 0.04 mg por sesión (≈ ${tubosMaximoEpi} tubos)`)
    }
  }

  // 4. Cardiopata: sugerencia de alternativas
  if (esCardiopata && anestesia.tieneVasoconstrictor) {
    if (!nombreNorm.includes('mepivacaina') && !nombreNorm.includes('prilocaina')) {
      advertencias.push('ℹ️ En cardiopatías descompensadas considerar Mepivacaína 3% sin vaso o Prilocaína + Felipresina')
    }
  }

  // 5. Pediátrica: Bupivacaína contraindicada <12 años
  if (esPediatria && nombreNorm.includes('bupivacaina')) {
    advertencias.push('⛔ Bupivacaína NO recomendada en niños <12 años')
  }

  // 6. Pediátrica: Articaína contraindicada <4 años
  if (esPediatria && nombreNorm.includes('articaina')) {
    advertencias.push('⚠️ Articaína contraindicada en niños <4 años')
  }

  // 7. Paciente de bajo peso (<50 kg) con vasoconstrictor
  if (peso && peso < 50 && anestesia.tieneVasoconstrictor) {
    advertencias.push('ℹ️ Paciente <50 kg: calcular SIEMPRE dosis antes del procedimiento y registrar en ficha')
  }

  // 8. Contraindicaciones específicas del fármaco
  if (anestesia.contraindicaciones) {
    const contra = normalizar(anestesia.contraindicaciones)
    if (contra.includes('metahemoglobinemia') && (contra.includes('sulfito') || contra.includes('sulf'))) {
      advertencias.push('ℹ️ Precaución con pacientes que reciben sulfas (riesgo metahemoglobinemia)')
    }
  }

  return advertencias
}

// ═══════════════════════════════════════════════════════════════
// API PÚBLICA LEGADA (F1-03 — preservada para compatibilidad)
// ═══════════════════════════════════════════════════════════════

/**
 * Calcula la dosis máxima (mg) y el número máximo de tubos de anestesia local
 * seguros para un paciente, según su peso corporal y el anestésico elegido.
 *
 * REGLA DE SEGURIDAD CLÍNICA (Constitución, Cap. V.2): si el peso no es un
 * dato numérico válido y positivo, o si el tipo de anestésico no está en la
 * tabla de referencia, la función NUNCA debe asumir un valor por defecto ni
 * calcular una dosis "aproximada".
 *
 * @param {number|string} peso - Peso del paciente en kg.
 * @param {string} tipoAnestesico - Clave del anestésico.
 * @returns {{estado: string, mensaje: string|null, mgMax: string|null, tubos: number|null}}
 */
export const calcularTubosAnestesia = (peso, tipoAnestesico) => {
  const pesoNumerico = parseFloat(peso)
  const pesoValido = Number.isFinite(pesoNumerico) && pesoNumerico > 0

  if (!pesoValido) {
    return {
      estado: 'DATOS_INCOMPLETOS',
      mensaje: 'Peso no informado o inválido — Verificación manual requerida antes de administrar anestesia.',
      mgMax: null,
      tubos: null
    }
  }

  const anestesia = buscarAnestesico(tipoAnestesico)
  if (!anestesia) {
    return {
      estado: 'ANESTESICO_DESCONOCIDO',
      mensaje: `Tipo de anestésico "${tipoAnestesico}" no reconocido — Verificación manual requerida.`,
      mgMax: null,
      tubos: null
    }
  }

  const mgPorKg = anestesia.mgPorKgAdulto
  const topeAbsoluto = anestesia.topeAbsolutoAdulto

  if (!mgPorKg || !anestesia.mgPorTubo) {
    return {
      estado: 'ANESTESICO_DESCONOCIDO',
      mensaje: `Datos de dosis incompletos para "${anestesia.nombreGenerico}" — Verificación manual requerida.`,
      mgMax: null,
      tubos: null
    }
  }

  // Fórmula Sección 1B: Dosis máxima (mg) = mg/kg × peso
  let mgMaximo = pesoNumerico * mgPorKg

  // Aplicar tope absoluto (relevante en pacientes con sobrepeso)
  if (topeAbsoluto && mgMaximo > topeAbsoluto) {
    mgMaximo = topeAbsoluto
  }

  // Número de tubos = mg máximo / mg por tubo
  const tubos = Math.floor(mgMaximo / anestesia.mgPorTubo)

  return {
    estado: 'OK',
    mensaje: null,
    mgMax: mgMaximo.toFixed(0),
    tubos
  }
}

// ═══════════════════════════════════════════════════════════════
// API PÚBLICA NUEVA (F4-03d — vademécum v1.1 enriquecido)
// ═══════════════════════════════════════════════════════════════

/**
 * Calcula dosis máxima COMPLETA de anestesia con todos los parámetros
 * del vademécum v1.1 curado por odontólogo.
 *
 * @param {Object} params
 * @param {number|string} params.peso - Peso en kg (requerido)
 * @param {string|number} params.tipoAnestesico
 * @param {boolean} [params.esPediatria=false]
 * @param {boolean} [params.esCardiopata=false]
 * @param {boolean} [params.esEmbarazo=false]
 * @param {number} [params.edad] - Edad en años (para validaciones)
 */
export const calcularDosisAnestesiaCompleta = (params = {}) => {
  const {
    peso,
    tipoAnestesico,
    esPediatria = false,
    esCardiopata = false,
    esEmbarazo = false,
    edad = null
  } = params

  // ─── Validación de peso (Fail-Safe Clinical Default) ───
  const pesoNumerico = parseFloat(peso)
  const pesoValido = Number.isFinite(pesoNumerico) && pesoNumerico > 0

  if (!pesoValido) {
    return {
      estado: 'DATOS_INCOMPLETOS',
      mensaje: 'Peso no informado o inválido — Verificación manual requerida antes de administrar anestesia.',
      anestesiaInfo: null,
      calculos: null,
      advertencias: []
    }
  }

  // ─── Búsqueda del anestésico ───
  const anestesia = buscarAnestesico(tipoAnestesico)
  if (!anestesia) {
    return {
      estado: 'ANESTESICO_DESCONOCIDO',
      mensaje: `Tipo de anestésico "${tipoAnestesico}" no reconocido — Verificación manual requerida.`,
      anestesiaInfo: null,
      calculos: null,
      advertencias: []
    }
  }

  const nombreNorm = normalizar(anestesia.nombreGenerico || '')

  // ─── Validación específica por edad ───
  // Bupivacaína contraindicada <12 años
  if (edad !== null && edad < 12 && nombreNorm.includes('bupivacaina')) {
    return {
      estado: 'DATOS_INCOMPLETOS',
      mensaje: 'Bupivacaína NO recomendada en niños <12 años — Verificación manual requerida.',
      anestesiaInfo: {
        nombreGenerico: anestesia.nombreGenerico,
        familia: anestesia.familia,
        presentacion: anestesia.presentacion
      },
      calculos: null,
      advertencias: ['⛔ Bupivacaína contraindicada en menores de 12 años']
    }
  }

  // Articaína contraindicada <4 años
  if (edad !== null && edad < 4 && nombreNorm.includes('articaina')) {
    return {
      estado: 'DATOS_INCOMPLETOS',
      mensaje: 'Articaína contraindicada en niños <4 años — Verificación manual requerida.',
      anestesiaInfo: {
        nombreGenerico: anestesia.nombreGenerico,
        familia: anestesia.familia,
        presentacion: anestesia.presentacion
      },
      calculos: null,
      advertencias: ['⛔ Articaína contraindicada en menores de 4 años']
    }
  }

  // ─── Determinar dosis según población ───
  let mgPorKg, topeAbsoluto, dosisPorKgUsada

  if (esPediatria) {
    mgPorKg = anestesia.mgPorKgPediatrico
    topeAbsoluto = anestesia.topeAbsolutoPediatrico || anestesia.topeAbsolutoAdulto
    dosisPorKgUsada = 'pediatrica'

    if (!mgPorKg) {
      mgPorKg = anestesia.mgPorKgAdulto
      topeAbsoluto = anestesia.topeAbsolutoAdulto
      dosisPorKgUsada = 'adulta_fallback'
    }
  } else {
    mgPorKg = anestesia.mgPorKgAdulto
    topeAbsoluto = anestesia.topeAbsolutoAdulto
    dosisPorKgUsada = 'adulta'
  }

  if (!mgPorKg) {
    return {
      estado: 'ANESTESICO_DESCONOCIDO',
      mensaje: `Datos de dosis no disponibles para "${anestesia.nombreGenerico}" en población ${esPediatria ? 'pediátrica' : 'adulta'} — Verificación manual requerida.`,
      anestesiaInfo: {
        nombreGenerico: anestesia.nombreGenerico,
        familia: anestesia.familia,
        presentacion: anestesia.presentacion
      },
      calculos: null,
      advertencias: []
    }
  }

  // ─── Cálculos (fórmulas Sección 1B) ───
  let mgMaximo = pesoNumerico * mgPorKg

  let topeUsado = null
  if (topeAbsoluto && mgMaximo > topeAbsoluto) {
    mgMaximo = topeAbsoluto
    topeUsado = topeAbsoluto
  }

  const concentracion = anestesia.concentracionMgPorMl || 1
  const mlMaximo = mgMaximo / concentracion

  const volumenPorTubo = anestesia.volumenPorTubo || 1.8
  const tubosMaximo = Math.floor(mlMaximo / volumenPorTubo)

  let epinefrinaMg = 0
  if (anestesia.tieneVasoconstrictor && anestesia.concentracionVasoconstrictor > 0) {
    epinefrinaMg = anestesia.concentracionVasoconstrictor * mlMaximo
  }

  const epinefrinaCardioSeguro = !esCardiopata || epinefrinaMg <= 0.04

  // ─── Generar advertencias clínicas ───
  const advertencias = generarAdvertencias(anestesia, {
    esPediatria,
    esCardiopata,
    esEmbarazo,
    peso: pesoNumerico
  })

  if (topeUsado !== null) {
    advertencias.unshift(`ℹ️ Se aplicó tope absoluto de ${topeUsado} mg (cálculo por peso excedía el límite del fármaco)`)
  }

  return {
    estado: 'OK',
    mensaje: null,
    anestesiaInfo: {
      nombreGenerico: anestesia.nombreGenerico,
      familia: anestesia.familia,
      presentacion: anestesia.presentacion,
      concentracion: anestesia.concentracionMgPorMl,
      tieneVasoconstrictor: anestesia.tieneVasoconstrictor,
      contraindicaciones: anestesia.contraindicaciones,
      notasEspeciales: anestesia.notasEspeciales
    },
    calculos: {
      mgMaximo: Math.round(mgMaximo * 10) / 10,
      mlMaximo: Math.round(mlMaximo * 100) / 100,
      tubosMaximo,
      dosisPorKgUsada,
      topeUsado,
      epinefrinaMg: Math.round(epinefrinaMg * 1000) / 1000,
      epinefrinaCardioSeguro
    },
    advertencias
  }
}

// ═══════════════════════════════════════════════════════════════
// UTILIDAD PÚBLICA
// ═══════════════════════════════════════════════════════════════

/**
 * Lista todos los anestésicos disponibles (desde vademécum o respaldo).
 */
export const listarAnestesicosDisponibles = () => {
  const datos = obtenerDatosAnestesia()
  return datos.map((d) => ({
    numero: d.numero,
    nombreGenerico: d.nombreGenerico,
    familia: d.familia,
    presentacion: d.presentacion,
    concentracionMgPorMl: d.concentracionMgPorMl,
    tieneVasoconstrictor: d.tieneVasoconstrictor
  }))
}
