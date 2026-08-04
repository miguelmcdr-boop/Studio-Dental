/**
 * Utilidades puras para el Módulo de Laboratorio y Tarifarios
 */

export const generarCodigoOrdenLab = () => {
  const anio = new Date().getFullYear()
  const random = Math.floor(100 + Math.random() * 900)
  return `LAB-${anio}-${random}`
}

export const buscarTarifaSugerida = (laboratorios = [], labId, trabajoNombre) => {
  const lab = laboratorios.find(l => l.id === parseInt(labId) || l.id === labId)
  if (!lab || !lab.tarifas) return 0

  const tarifaObj = lab.tarifas.find(t => t.trabajo === trabajoNombre)
  return tarifaObj ? parseFloat(tarifaObj.precio) || 0 : 0
}

export const calcularResumenLaboratorio = (ordenes = []) => {
  let enProcesoCount = 0
  let listosInstalarCount = 0
  let repeticionesCount = 0
  let montoPendientePagoLab = 0
  let costoTotalLab = 0

  ordenes.forEach(o => {
    const costo = parseFloat(o.costoLaboratorio) || 0
    costoTotalLab += costo

    if (o.etapa === 'Enviado' || o.etapa === 'PruebaMetal' || o.etapa === 'PruebaBizcocho') {
      enProcesoCount++
    } else if (o.etapa === 'RecibidoListo') {
      listosInstalarCount++
    } else if (o.etapa === 'Repeticion') {
      repeticionesCount++
    }

    if (o.estadoPagoLab === 'Pendiente') {
      montoPendientePagoLab += costo
    }
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