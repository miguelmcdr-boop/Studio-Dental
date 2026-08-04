/**
 * Utilidades puras para evaluación de inventario y alertas
 */

export const evaluarEstadoStock = (item) => {
  const cantidad = parseInt(item.cantidad) || 0
  const minimo = parseInt(item.minimoCritico) || 0

  if (cantidad === 0) {
    return { id: 'agotado', texto: '🔴 Agotado', colorBg: 'bg-red-100', colorText: 'text-red-900' }
  }
  if (cantidad <= minimo) {
    return { id: 'critico', texto: '⚠️ Stock Crítico', colorBg: 'bg-amber-100', colorText: 'text-amber-900' }
  }
  return { id: 'normal', texto: '🟢 Normal', colorBg: 'bg-emerald-100', colorText: 'text-emerald-900' }
}

export const evaluarVencimiento = (fechaVencimiento) => {
  if (!fechaVencimiento) return { diasRestantes: 999, estado: 'ok' }

  const hoy = new Date()
  const fechaVenc = new Date(fechaVencimiento)
  const diferenciaTiempo = fechaVenc - hoy
  const diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24))

  if (diasRestantes < 0) {
    return { diasRestantes, estado: 'vencido', texto: '❌ Vencido' }
  }
  if (diasRestantes <= 30) {
    return { diasRestantes, estado: 'por_vencer', texto: `⚠️ Vence en ${diasRestantes} días` }
  }
  return { diasRestantes, estado: 'ok', texto: 'Vigente' }
}

export const calcularResumenInventario = (items = []) => {
  let totalInsumos = items.length
  let stockCriticoCount = 0
  let porVencerCount = 0
  let valorTotalInventario = 0

  items.forEach(item => {
    const estadoStock = evaluarEstadoStock(item)
    if (estadoStock.id === 'critico' || estadoStock.id === 'agotado') {
      stockCriticoCount++
    }

    const estadoVenc = evaluarVencimiento(item.fechaVencimiento)
    if (estadoVenc.estado === 'por_vencer' || estadoVenc.estado === 'vencido') {
      porVencerCount++
    }

    const cant = parseInt(item.cantidad) || 0
    const precio = parseFloat(item.precioUnitario) || 0
    valorTotalInventario += (cant * precio)
  })

  return {
    totalInsumos,
    stockCriticoCount,
    porVencerCount,
    valorTotalInventario
  }
}