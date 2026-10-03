/**
 * Utilidades puras para el Módulo de Laboratorio y Tarifarios
 */

export interface TarifaLab {
  trabajo?: string
  precio?: number | string
}

export interface LaboratorioConTarifas {
  id?: number | string
  tarifas?: readonly TarifaLab[] | TarifaLab[]
}

export interface OrdenLabCalc {
  costoLaboratorio?: number | string
  etapa?: string
  estadoPagoLab?: string
}

export interface ResumenLaboratorio {
  totalOrdenes: number
  enProcesoCount: number
  listosInstalarCount: number
  repeticionesCount: number
  montoPendientePagoLab: number
  costoTotalLab: number
}

export const generarCodigoOrdenLab = (): string => {
  const anio = new Date().getFullYear()
  const random = Math.floor(100 + Math.random() * 900)
  return `LAB-${anio}-${random}`
}

export const buscarTarifaSugerida = (
  laboratorios: readonly LaboratorioConTarifas[] | LaboratorioConTarifas[] = [],
  labId: number | string,
  trabajoNombre: string
): number => {
  const lab = laboratorios.find(l => l.id === parseInt(String(labId), 10) || l.id === labId)
  if (!lab?.tarifas) return 0
  const tarifaObj = lab.tarifas.find(t => t.trabajo === trabajoNombre)
  return tarifaObj ? parseFloat(String(tarifaObj.precio)) || 0 : 0
}

export const calcularResumenLaboratorio = (ordenes: OrdenLabCalc[] = []): ResumenLaboratorio => {
  let enProcesoCount = 0, listosInstalarCount = 0, repeticionesCount = 0
  let montoPendientePagoLab = 0, costoTotalLab = 0

  ordenes.forEach(o => {
    const costo = parseFloat(String(o.costoLaboratorio)) || 0
    costoTotalLab += costo
    if (['Enviado', 'PruebaMetal', 'PruebaBizcocho'].includes(String(o.etapa))) enProcesoCount++
    else if (o.etapa === 'RecibidoListo') listosInstalarCount++
    else if (o.etapa === 'Repeticion') repeticionesCount++
    if (o.estadoPagoLab === 'Pendiente') montoPendientePagoLab += costo
  })

  return {
    totalOrdenes: ordenes.length,
    enProcesoCount,
    listosInstalarCount,
    repeticionesCount,
    montoPendientePagoLab,
    costoTotalLab
  }
}
