/**
 * Utilidades puras para simulación de aranceles y cálculos
 */

export const calcularResumenArancel = (prestaciones = []) => {
  const totalProcedimientos = prestaciones.length
  if (totalProcedimientos === 0) {
    return { totalProcedimientos: 0, precioPromedio: 0, especialidadMasFrecuente: 'N/I', precioMaximo: 0 }
  }

  let sumaPrecios = 0
  let precioMaximo = 0
  const conteoEspecialidad = {}

  prestaciones.forEach(p => {
    const precio = parseFloat(p.precioParticular) || 0
    sumaPrecios += precio
    if (precio > precioMaximo) precioMaximo = precio

    const esp = p.especialidad || 'General'
    conteoEspecialidad[esp] = (conteoEspecialidad[esp] || 0) + 1
  })

  let especialidadMasFrecuente = 'General'
  let maxConteo = 0

  Object.entries(conteoEspecialidad).forEach(([esp, cant]) => {
    if (cant > maxConteo) {
      maxConteo = cant
      especialidadMasFrecuente = esp
    }
  })

  return {
    totalProcedimientos,
    precioPromedio: Math.round(sumaPrecios / totalProcedimientos),
    especialidadMasFrecuente,
    precioMaximo
  }
}