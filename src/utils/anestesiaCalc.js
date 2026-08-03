export const calcularTubosAnestesia = (peso, tipoAnestesico) => {
  const p = parseFloat(peso) || 70
  if (tipoAnestesico === 'lidocaina') return { mgMax: (p * 4.4).toFixed(0), tubos: Math.floor((p * 4.4) / 36) }
  if (tipoAnestesico === 'mepivacaina') return { mgMax: (p * 6.6).toFixed(0), tubos: Math.floor((p * 6.6) / 54) }
  if (tipoAnestesico === 'articaina') return { mgMax: (p * 7.0).toFixed(0), tubos: Math.floor((p * 7.0) / 72) }
  if (tipoAnestesico === 'bupivacaina') return { mgMax: (p * 1.3).toFixed(0), tubos: Math.floor((p * 1.3) / 9) }
  return { mgMax: 300, tubos: 8 }
}