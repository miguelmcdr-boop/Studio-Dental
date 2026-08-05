/**
 * Motor de Cálculo del Índice CPO-D (Permanente) y ceod (Temporal)
 * Estándar de la Organización Mundial de la Salud (OMS)
 */

export const calcularIndiceCPOD = (odontograma = {}) => {
  let cariados = 0
  let perdidos = 0
  let obturados = 0
  let sanos = 0

  const piezasKeys = Object.keys(odontograma)

  piezasKeys.forEach(num => {
    const pieza = odontograma[num]
    if (!pieza) return

    if (pieza.general === 'ausente' || pieza.general === 'indicacion_exodoncia') {
      perdidos++
      return
    }

    let tieneCaries = pieza.general === 'caries'
    let tieneObturacion = pieza.general === 'restauracion' || pieza.general === 'incrustacion' || pieza.general === 'corona'

    if (pieza.caras) {
      Object.values(pieza.caras).forEach(estadoCara => {
        if (estadoCara === 'caries') tieneCaries = true
        if (estadoCara === 'restauracion' || estadoCara === 'incrustacion' || estadoCara === 'sellante') tieneObturacion = true
      })
    }

    if (tieneCaries) {
      cariados++
    } else if (tieneObturacion) {
      obturados++
    } else {
      sanos++
    }
  })

  const cpodTotal = cariados + perdidos + obturados

  let nivelRiesgoOMS = 'Muy Bajo'
  let colorBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300'

  if (cpodTotal >= 14) {
    nivelRiesgoOMS = 'Muy Alto'
    colorBadge = 'bg-red-100 text-red-900 border-red-300'
  } else if (cpodTotal >= 9) {
    nivelRiesgoOMS = 'Alto'
    colorBadge = 'bg-amber-100 text-amber-900 border-amber-300'
  } else if (cpodTotal >= 5) {
    nivelRiesgoOMS = 'Moderado'
    colorBadge = 'bg-yellow-100 text-yellow-900 border-yellow-300'
  } else if (cpodTotal >= 2) {
    nivelRiesgoOMS = 'Bajo'
    colorBadge = 'bg-blue-100 text-blue-800 border-blue-300'
  }

  return {
    cariados,
    perdidos,
    obturados,
    sanos,
    cpodTotal,
    nivelRiesgoOMS,
    colorBadge
  }
}