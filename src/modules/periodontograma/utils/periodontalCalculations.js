/**
 * Motor de Cálculos y Generación de Resumen Clínico
 * Algoritmos independientes desacoplados del ciclo de renderizado.
 */

import { SITIOS_TOTALES, LIMITES_SONDAJE, ARCADA_SUPERIOR, ARCADA_INFERIOR } from '../constants/periodontalConstants'

/**
 * Calcula el Nivel de Inserción Clínica (CAL)
 * CAL = Sondaje (PB) + Recesión (REC)
 */
export const calcularCAL = (sondaje, recesion) => {
  const pb = parseInt(sondaje, 10)
  if (isNaN(pb)) return ''
  const rec = parseInt(recesion, 10) || 0
  return pb + rec
}

/**
 * Procesa estadísticas completas en tiempo real
 */
export const calcularEstadisticasPeriodontales = (datosPeriodontales = {}) => {
  let sitiosEvaluados = 0
  let sitiosSangrado = 0
  let sitiosPlaca = 0
  let sitiosSupuracion = 0
  
  let sacosModerados = 0 // ≥ 4mm
  let sacosSeveros = 0   // ≥ 6mm
  let profundidadMaxima = 0
  let sumaProfundidad = 0

  let dientesAusentes = 0
  let dientesEvaluados = 0

  const TODAS_LAS_PIEZAS = [...ARCADA_SUPERIOR, ...ARCADA_INFERIOR]

  TODAS_LAS_PIEZAS.forEach(piezaId => {
    const pieza = datosPeriodontales[piezaId]
    
    if (pieza?.ausente) {
      dientesAusentes++
      return
    }

    dientesEvaluados++

    if (!pieza) return

    SITIOS_TOTALES.forEach(sitio => {
      const val = pieza.sondaje?.[sitio.id]
      if (val !== '' && val !== null && val !== undefined) {
        sitiosEvaluados++
        sumaProfundidad += val
        if (val > profundidadMaxima) profundidadMaxima = val
        if (val >= LIMITES_SONDAJE.UMBRAL_SACO_MODERADO) sacosModerados++
        if (val >= LIMITES_SONDAJE.UMBRAL_SACO_SEVERO) sacosSeveros++
      }

      if (pieza.sangrado?.[sitio.id] === true) sitiosSangrado++
      if (pieza.placa?.[sitio.id] === true) sitiosPlaca++
      if (pieza.supuracion?.[sitio.id] === true) sitiosSupuracion++
    })
  })

  const porcentajeBop = sitiosEvaluados > 0 ? Math.round((sitiosSangrado / sitiosEvaluados) * 100) : 0
  const porcentajePlaca = sitiosEvaluados > 0 ? Math.round((sitiosPlaca / sitiosEvaluados) * 100) : 0
  const porcentajeSupuracion = sitiosEvaluados > 0 ? Math.round((sitiosSupuracion / sitiosEvaluados) * 100) : 0
  const promedioSondaje = sitiosEvaluados > 0 ? (sumaProfundidad / sitiosEvaluados).toFixed(1) : '0.0'

  return {
    sitiosEvaluados,
    sitiosSangrado,
    sitiosPlaca,
    sitiosSupuracion,
    porcentajeBop,
    porcentajePlaca,
    porcentajeSupuracion,
    sacosModerados,
    sacosSeveros,
    profundidadMaxima,
    promedioSondaje,
    dientesEvaluados,
    dientesAusentes
  }
}

/**
 * Genera un resumen clínico descriptivo y objetivo de hallazgos registrados.
 */
export const generarResumenClinico = (stats, datosPeriodontales = {}) => {
  const hallazgos = []

  // BOP
  if (stats.sitiosEvaluados === 0) {
    return "No se registran datos suficientes para generar un resumen clínico de hallazgos."
  }

  hallazgos.push(`Sangrado al sondaje (BOP) presente en el ${stats.porcentajeBop}% de los sitios evaluados (${stats.sitiosSangrado}/${stats.sitiosEvaluados}).`)
  hallazgos.push(`Índice de placa bacteriana del ${stats.porcentajePlaca}%.`)

  if (stats.porcentajeSupuracion > 0) {
    hallazgos.push(`Presencia de supuración activa en el ${stats.porcentajeSupuracion}% de los sitios.`)
  }

  // Sacos
  if (stats.sacosModerados > 0) {
    hallazgos.push(`Se detectan ${stats.sacosModerados} sitios con profundidad de sondaje ≥ 4 mm (Profundidad máxima alcanzada: ${stats.profundidadMaxima} mm).`)
  } else {
    hallazgos.push(`Sin presencia de sacos periodontales ≥ 4 mm. Profundidad de sondaje promedio de ${stats.promedioSondaje} mm.`)
  }

  if (stats.sacosSeveros > 0) {
    hallazgos.push(`Atención: ${stats.sacosSeveros} sitios presentan compromiso severo con sondaje ≥ 6 mm.`)
  }

  // Movilidad y Furca
  let piezasConMovilidad = []
  let piezasConFurca = []

  Object.entries(datosPeriodontales).forEach(([piezaId, pData]) => {
    if (pData?.ausente) return
    if (pData?.movilidad && pData.movilidad !== '0') {
      piezasConMovilidad.push(`P.${piezaId} (Grado ${pData.movilidad})`)
    }
    if (pData?.furca && pData.furca !== '0') {
      piezasConFurca.push(`P.${piezaId} (Grado ${pData.furca})`)
    }
  })

  if (piezasConMovilidad.length > 0) {
    hallazgos.push(`Movilidad dental alterada en: ${piezasConMovilidad.join(', ')}.`)
  }

  if (piezasConFurca.length > 0) {
    hallazgos.push(`Involucramiento de furca en piezas multirradiculares: ${piezasConFurca.join(', ')}.`)
  }

  if (stats.dientesAusentes > 0) {
    hallazgos.push(`Se registran ${stats.dientesAusentes} piezas ausentes.`)
  }

  return hallazgos.join(' ')
}

/**
 * Preparación de estructura de datos para renderizado de Gráfico Periodontal
 */
export const estructurarDatosParaGrafico = (datosPeriodontales = {}) => {
  const dientes = [...ARCADA_SUPERIOR, ...ARCADA_INFERIOR]
  return dientes.map(piezaId => {
    const p = datosPeriodontales[piezaId]
    return {
      piezaId,
      ausente: !!p?.ausente,
      sondajes: p?.sondaje || {},
      recesiones: p?.recesion || {},
      cals: SITIOS_TOTALES.reduce((acc, s) => {
        acc[s.id] = calcularCAL(p?.sondaje?.[s.id], p?.recesion?.[s.id])
        return acc
      }, {})
    }
  })
}