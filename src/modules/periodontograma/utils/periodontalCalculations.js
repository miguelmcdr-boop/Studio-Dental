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

export const calcularIndicesPeriodontales = (piezasData = {}) => {
  let sitiosTotales = 0
  let sitiosSangrado = 0
  let sitiosPlaca = 0
  let maxSondaje = 0

  Object.values(piezasData || {}).forEach(pieza => {
    if (pieza?.ausente) return

    ['vestibular', 'palatino'].forEach(cara => {
      if (pieza?.[cara]) {
        const sondajes = pieza[cara].sondaje || [0, 0, 0]
        const sangrados = pieza[cara].sangrado || [false, false, false]
        const placas = pieza[cara].placa || [false, false, false]

        sondajes.forEach((prof, idx) => {
          sitiosTotales++
          const pVal = parseInt(prof) || 0
          if (pVal > maxSondaje) maxSondaje = pVal
          if (sangrados[idx]) sitiosSangrado++
          if (placas[idx]) sitiosPlaca++
        })
      }
    })
  })

  const porcentajeSangrado = sitiosTotales > 0 ? Math.round((sitiosSangrado / sitiosTotales) * 100) : 0
  const indiceOLeary = sitiosTotales > 0 ? Math.round((sitiosPlaca / sitiosTotales) * 100) : 0

  const { etapa, grado, colorEtapa } = calcularClasificacionAAP(maxSondaje, porcentajeSangrado)

  return {
    sitiosTotales,
    sitiosSangrado,
    sitiosPlaca,
    porcentajeSangrado,
    indiceOLeary,
    maxSondaje,
    diagnosticoSugerido: etapa,
    gradoAAP: grado,
    colorEtapa
  }
}