/**
 * Motor de Cálculos y Generación de Resumen Clínico Periodontal
 * Algoritmos independientes desacoplados del ciclo de renderizado React.
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
 * Procesa estadísticas periodontales completas en tiempo real
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

  const TODAS_LAS_PIEZAS = [...(ARCADA_SUPERIOR || []), ...(ARCADA_INFERIOR || [])]

  TODAS_LAS_PIEZAS.forEach(piezaId => {
    const pieza = datosPeriodontales[piezaId]
    
    if (pieza?.ausente) {
      dientesAusentes++
      return
    }

    dientesEvaluados++

    if (!pieza) return

    const sitios = SITIOS_TOTALES || [
      { id: 'mv' }, { id: 'v' }, { id: 'dv' },
      { id: 'mp' }, { id: 'p' }, { id: 'dp' }
    ]

    sitios.forEach(sitio => {
      const val = parseInt(pieza.sondaje?.[sitio.id], 10)
      if (!isNaN(val)) {
        sitiosEvaluados++
        sumaProfundidad += val
        if (val > profundidadMaxima) profundidadMaxima = val
        const umbralModerado = LIMITES_SONDAJE?.UMBRAL_SACO_MODERADO ?? 4
        const umbralSevero = LIMITES_SONDAJE?.UMBRAL_SACO_SEVERO ?? 6
        if (val >= umbralModerado) sacosModerados++
        if (val >= umbralSevero) sacosSeveros++
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

  let diagnosticoSugerido = 'Salud Periodontal'
  if (profundidadMaxima >= 7) {
    diagnosticoSugerido = 'Periodontitis Severa / Avanzada (Etapa III/IV)'
  } else if (profundidadMaxima >= 5) {
    diagnosticoSugerido = 'Periodontitis Moderada (Etapa II)'
  } else if (profundidadMaxima >= 4) {
    diagnosticoSugerido = 'Periodontitis Leve / Inicial (Etapa I)'
  } else if (porcentajeBop > 10) {
    diagnosticoSugerido = 'Gingivitis Inducida por Placa'
  }

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
    dientesAusentes,
    diagnosticoSugerido
  }
}

/**
 * Función compatible con firmas simplificadas
 */
export const calcularIndicesPeriodontales = (piezasData = {}) => {
  const stats = calcularEstadisticasPeriodontales(piezasData)
  return {
    sitiosTotales: stats.sitiosEvaluados,
    sitiosSangrado: stats.sitiosSangrado,
    sitiosPlaca: stats.sitiosPlaca,
    porcentajeSangrado: stats.porcentajeBop,
    porcentajeBop: stats.porcentajeBop,
    indiceOLeary: stats.porcentajePlaca,
    porcentajePlaca: stats.porcentajePlaca,
    maxSondaje: stats.profundidadMaxima,
    diagnosticoSugerido: stats.diagnosticoSugerido
  }
}

/**
 * Genera un resumen clínico descriptivo y objetivo de hallazgos registrados.
 */
export const generarResumenClinico = (stats, datosPeriodontales = {}) => {
  if (!stats || stats.sitiosEvaluados === 0) {
    return "No se registran datos suficientes para generar un resumen clínico de hallazgos."
  }

  const hallazgos = []
  hallazgos.push(`Sangrado al sondaje (BOP) presente en el ${stats.porcentajeBop}% de los sitios evaluados (${stats.sitiosSangrado}/${stats.sitiosEvaluados}).`)
  hallazgos.push(`Índice de placa bacteriana del ${stats.porcentajePlaca}%.`)

  if (stats.porcentajeSupuracion > 0) {
    hallazgos.push(`Presencia de supuración activa en el ${stats.porcentajeSupuracion}% de los sitios.`)
  }

  if (stats.sacosModerados > 0) {
    hallazgos.push(`Se detectan ${stats.sacosModerados} sitios con profundidad de sondaje ≥ 4 mm (Profundidad máxima alcanzada: ${stats.profundidadMaxima} mm).`)
  } else {
    hallazgos.push(`Sin presencia de sacos periodontales ≥ 4 mm. Profundidad de sondaje promedio de ${stats.promedioSondaje} mm.`)
  }

  if (stats.sacosSeveros > 0) {
    hallazgos.push(`Atención: ${stats.sacosSeveros} sitios presentan compromiso severo con sondaje ≥ 6 mm.`)
  }

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
  const dientes = [...(ARCADA_SUPERIOR || []), ...(ARCADA_INFERIOR || [])]
  const sitios = SITIOS_TOTALES || [
    { id: 'mv' }, { id: 'v' }, { id: 'dv' },
    { id: 'mp' }, { id: 'p' }, { id: 'dp' }
  ]

  return dientes.map(piezaId => {
    const p = datosPeriodontales[piezaId]
    return {
      piezaId,
      ausente: !!p?.ausente,
      sondajes: p?.sondaje || {},
      recesiones: p?.recesion || {},
      cals: sitios.reduce((acc, s) => {
        acc[s.id] = calcularCAL(p?.sondaje?.[s.id], p?.recesion?.[s.id])
        return acc
      }, {})
    }
  })
}