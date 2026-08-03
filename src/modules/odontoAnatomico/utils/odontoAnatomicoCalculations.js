/**
 * Motor de Cálculos Epidemiológicos para el Odontograma Anatómico
 */

export const calcularCPODAnatomico = (dataAnatomica = {}) => {
  let caries = 0
  let perdidos = 0
  let obturados = 0

  Object.entries(dataAnatomica).forEach(([_, datos]) => {
    if (typeof datos === 'object' && datos !== null) {
      const caras = Object.values(datos)
      if (caras.includes('caries')) caries++
      if (caras.includes('ausente')) perdidos++
      if (caras.includes('restauracion_resina') || caras.includes('restauracion_amalgama')) obturados++
    }
  })

  return {
    caries,
    perdidos,
    obturados,
    totalCPOD: caries + perdidos + obturados
  }
}