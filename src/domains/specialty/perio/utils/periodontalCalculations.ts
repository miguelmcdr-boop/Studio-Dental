/**
 * Motor de Analítica Periodontal Avanzada & Clasificación AAP/EFP (2017)
 *
 * F1-04e: Extendido con 5 métricas adicionales:
 * - sacosModerados (4-5mm), sacosSeveros (≥6mm)
 * - porcentajeSupuracion (sitios con supuración)
 * - promedioSondaje (promedio de sitios registrados)
 * - dientesAusentes (piezas marcadas como ausentes)
 */

export interface FactoresRiesgoAAP {
  fumador?: boolean
  diabetes?: boolean
}

export interface ClasificacionAAPResultado {
  etapa: string
  grado: string
  colorEtapa: string
}

export interface CaraPeriodontalCalculo {
  sondaje?: readonly (number | string | null | undefined)[]
  sangrado?: readonly boolean[]
  placa?: readonly boolean[]
  supuracion?: readonly boolean[]
  [key: string]: unknown
}

export interface PiezaPeriodontalCalculo {
  ausente?: boolean
  vestibular?: CaraPeriodontalCalculo
  palatino?: CaraPeriodontalCalculo
  [key: string]: unknown
}

export type PiezasDataCalculo = Record<string, unknown>

export interface IndicesPeriodontalesResultado {
  sitiosTotales: number
  sitiosRegistrados: number
  sitiosSinRegistrar: number
  sitiosSangrado: number
  sitiosPlaca: number
  porcentajeSangrado: number
  indiceOLeary: number
  maxSondaje: number
  diagnosticoSugerido: string
  gradoAAP: string
  colorEtapa: string
  diagnosticoConcluyente: boolean
  sacosModerados: number
  sacosSeveros: number
  sitiosSupuracion: number
  porcentajeSupuracion: number
  promedioSondaje: string
  dientesAusentes: number
}

export interface ResumenClinicoPeriodontal {
  diagnostico: string
  recomendaciones: string[]
}

export const calcularCAL = (sondaje: number | string, recesion: number | string): number | string => {
  const pb = parseInt(String(sondaje), 10)
  if (isNaN(pb)) return ''
  const rec = parseInt(String(recesion), 10) || 0
  return pb + rec
}

export const calcularClasificacionAAP = (
  maxSondaje: number = 0,
  bopPct: number = 0,
  factoresRiesgo: FactoresRiesgoAAP = { fumador: false, diabetes: false }
): ClasificacionAAPResultado => {
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

export const calcularIndicesPeriodontales = (
  piezasData: PiezasDataCalculo = {},
  factoresRiesgo: FactoresRiesgoAAP = { fumador: false, diabetes: false }
): IndicesPeriodontalesResultado => {
  const UMBRAL_COBERTURA_MINIMA = 0.8 // 80% de los sitios esperados deben estar registrados

  let sitiosTotales = 0
  let sitiosRegistrados = 0
  let sitiosSinRegistrar = 0
  let sitiosSangrado = 0
  let sitiosPlaca = 0
  let sitiosSupuracion = 0
  let sacosModerados = 0
  let sacosSeveros = 0
  let sumaSondajes = 0
  let maxSondaje = 0
  let dientesAusentes = 0

  Object.values(piezasData || {}).forEach(piezaRaw => {
    const pieza = piezaRaw as PiezaPeriodontalCalculo | undefined
    // F1-04e: Contar piezas ausentes (antes del return)
    if (pieza?.ausente) {
      dientesAusentes++
      return
    }

    const caras: ('vestibular' | 'palatino')[] = ['vestibular', 'palatino']
    caras.forEach(cara => {
      const caraData = pieza?.[cara]
      if (caraData) {
        const sondajes = caraData.sondaje || [null, null, null]
        const sangrados = caraData.sangrado || [false, false, false]
        const placas = caraData.placa || [false, false, false]
        const supuraciones = caraData.supuracion || [false, false, false]

        sondajes.forEach((prof, idx) => {
          sitiosTotales++

          const pVal = parseInt(String(prof), 10)
          if (Number.isNaN(pVal)) {
            // Sitio no registrado: se excluye de promedios y de maxSondaje,
            // NUNCA se cuenta como sitio sano.
            sitiosSinRegistrar++
            return
          }

          sitiosRegistrados++
          sumaSondajes += pVal

          if (pVal > maxSondaje) maxSondaje = pVal
          if (sangrados[idx]) sitiosSangrado++
          if (placas[idx]) sitiosPlaca++
          if (supuraciones[idx]) sitiosSupuracion++

          // F1-04e: Clasificar sitios por profundidad
          if (pVal >= 6) {
            sacosSeveros++
          } else if (pVal >= 4) {
            sacosModerados++
          }
        })
      }
    })
  })

  const porcentajeSangrado = sitiosRegistrados > 0 ? Math.round((sitiosSangrado / sitiosRegistrados) * 100) : 0
  const indiceOLeary = sitiosRegistrados > 0 ? Math.round((sitiosPlaca / sitiosRegistrados) * 100) : 0
  // F1-04e: Porcentaje de supuración (sitios con supuración / sitios registrados)
  const porcentajeSupuracion = sitiosRegistrados > 0 ? Math.round((sitiosSupuracion / sitiosRegistrados) * 100) : 0
  // F1-04e: Promedio de sondaje (con 1 decimal)
  const promedioSondaje = sitiosRegistrados > 0 ? (sumaSondajes / sitiosRegistrados).toFixed(1) : '0.0'

  const cobertura = sitiosTotales > 0 ? sitiosRegistrados / sitiosTotales : 0
  const hayPiezasEvaluables = sitiosTotales > 0
  const diagnosticoConcluyente = !hayPiezasEvaluables || cobertura >= UMBRAL_COBERTURA_MINIMA

  let etapa: string
  let grado: string
  let colorEtapa: string

  if (hayPiezasEvaluables && !diagnosticoConcluyente) {
    etapa = 'Sondaje Incompleto — Diagnóstico No Concluyente'
    grado = 'No determinable'
    colorEtapa = 'bg-gray-200 text-gray-800 border-gray-400'
  } else {
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
    diagnosticoConcluyente,
    // F1-04e: Nuevas métricas
    sacosModerados,
    sacosSeveros,
    sitiosSupuracion,
    porcentajeSupuracion,
    promedioSondaje,
    dientesAusentes
  }
}

export const calcularEstadisticasPeriodontales = (piezasData: PiezasDataCalculo = {}): IndicesPeriodontalesResultado => {
  return calcularIndicesPeriodontales(piezasData)
}

export const generarResumenClinico = (
  metricas: Partial<IndicesPeriodontalesResultado> = {},
  _piezasData: PiezasDataCalculo = {}
): ResumenClinicoPeriodontal => {
  return {
    diagnostico: metricas?.diagnosticoSugerido || 'Periodonto sano',
    recomendaciones: []
  }
}

export const estructurarDatosParaGrafico = (_piezasData: PiezasDataCalculo = {}): unknown[] => {
  return []
}
