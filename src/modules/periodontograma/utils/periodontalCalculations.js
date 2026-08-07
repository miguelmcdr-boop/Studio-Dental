/**
 * Motor de Analítica Periodontal Avanzada & Clasificación AAP/EFP (2017)
 */

export const calcularCAL = (sondaje, recesion) => {
  const pb = parseInt(sondaje, 10)
  if (isNaN(pb)) return ''
  const rec = parseInt(recesion, 10) || 0
  return pb + rec
}

export const calcularClasificacionAAP = (maxSondaje = 0, bopPct = 0, factoresRiesgo = { fumador: false, diabetes: false }) => {
  let etapa = 'Salud Periodontal'
  let grado = 'Grado A (Bajo Riesgo)'
  let colorEtapa = 'bg-emerald-100 text-emerald-900 border-emerald-300'

  if (maxSondaje >= 6) {
    etapa = 'Periodontitis Severa / Avanzada (Etapa III / IV)'
    colorEtapa = 'bg-red-100 text-red-950 border-red-300'
  } else if (maxSondaje >= 5) {
    etapa = 'Periodontitis Moderada (Etapa II)'
    colorEtapa = 'bg-amber-100 text-amber-950 border-amber-300'
  } else if (maxSondaje >= 4) {
    etapa = 'Periodontitis Inicial (Etapa I)'
    colorEtapa = 'bg-yellow-100 text-yellow-900 border-yellow-300'
  } else if (bopPct > 10) {
    etapa = 'Gingivitis Inducida por Placa Bacteriana'
    colorEtapa = 'bg-blue-100 text-blue-900 border-blue-300'
  }

  if (factoresRiesgo.fumador || factoresRiesgo.diabetes) {
    grado = 'Grado C (Riesgo Elevado de Progresión Rápida)'
  } else if (bopPct > 30 || maxSondaje >= 5) {
    grado = 'Grado B (Riesgo Moderado de Progresión)'
  }

  return { etapa, grado, colorEtapa }
}

/**
 * Calcula los índices periodontales agregados (BOP%, O'Leary, sondaje máximo)
 * y sugiere una clasificación AAP/EFP en base a las piezas evaluadas.
 *
 * REGLA DE SEGURIDAD CLÍNICA (Constitución, Cap. V.2 — "Fail-Safe Clinical
 * Default"): un sitio de sondaje sin registrar NUNCA se cuenta como sitio
 * sano (0mm). Se excluye de los promedios y se contabiliza aparte en
 * `sitiosSinRegistrar`. Si la cobertura de sondaje registrado es demasiado
 * baja, la función NO emite una etapa AAP normal — retorna un estado
 * explícito de diagnóstico no concluyente, para que nadie interprete un
 * examen incompleto como "Salud Periodontal".
 *
 * @param {object} piezasData - Datos de sondaje por pieza/cara.
 * @param {{fumador: boolean, diabetes: boolean}} factoresRiesgo - Factores
 *        moduladores de riesgo del paciente, para el Grado AAP.
 */
export const calcularIndicesPeriodontales = (piezasData = {}, factoresRiesgo = { fumador: false, diabetes: false }) => {
  const UMBRAL_COBERTURA_MINIMA = 0.8 // 80% de los sitios esperados deben estar registrados

  let sitiosTotales = 0
  let sitiosRegistrados = 0
  let sitiosSinRegistrar = 0
  let sitiosSangrado = 0
  let sitiosPlaca = 0
  let maxSondaje = 0

  Object.values(piezasData || {}).forEach(pieza => {
    if (pieza?.ausente) return

    ;['vestibular', 'palatino'].forEach(cara => {
      if (pieza?.[cara]) {
        const sondajes = pieza[cara].sondaje || [null, null, null]
        const sangrados = pieza[cara].sangrado || [false, false, false]
        const placas = pieza[cara].placa || [false, false, false]

        sondajes.forEach((prof, idx) => {
          sitiosTotales++

          const pVal = parseInt(prof, 10)
          if (Number.isNaN(pVal)) {
            // Sitio no registrado: se excluye de promedios y de maxSondaje,
            // NUNCA se cuenta como sitio sano.
            sitiosSinRegistrar++
            return
          }

          sitiosRegistrados++
          if (pVal > maxSondaje) maxSondaje = pVal
          if (sangrados[idx]) sitiosSangrado++
          if (placas[idx]) sitiosPlaca++
        })
      }
    })
  })

  const porcentajeSangrado = sitiosRegistrados > 0 ? Math.round((sitiosSangrado / sitiosRegistrados) * 100) : 0
  const indiceOLeary = sitiosRegistrados > 0 ? Math.round((sitiosPlaca / sitiosRegistrados) * 100) : 0
  const cobertura = sitiosTotales > 0 ? sitiosRegistrados / sitiosTotales : 0
  const hayPiezasEvaluables = sitiosTotales > 0
  const diagnosticoConcluyente = !hayPiezasEvaluables || cobertura >= UMBRAL_COBERTURA_MINIMA

  let etapa, grado, colorEtapa

  if (hayPiezasEvaluables && !diagnosticoConcluyente) {
    etapa = 'Sondaje Incompleto — Diagnóstico No Concluyente'
    grado = 'No determinable'
    colorEtapa = 'bg-gray-200 text-gray-800 border-gray-400'
  } else {
    // factoresRiesgo se pasa explícitamente: antes se descartaba porque la
    // función no lo declaraba como parámetro, y Grado AAP se calculaba
    // siempre como si el paciente no fuera fumador ni diabético.
    const clasificacion = calcularClasificacionAAP(maxSondaje, porcentajeSangrado, factoresRiesgo)
    etapa = clasificacion.etapa
    grado = clasificacion.grado
    colorEtapa = clasificacion.colorEtapa
  }

  return {
    sitiosTotales,
    sitiosRegistrados,
    sitiosSinRegistrar,
    sitiosSangrado,
    sitiosPlaca,
    porcentajeSangrado,
    indiceOLeary,
    maxSondaje,
    diagnosticoSugerido: etapa,
    gradoAAP: grado,
    colorEtapa,
    diagnosticoConcluyente
  }
}