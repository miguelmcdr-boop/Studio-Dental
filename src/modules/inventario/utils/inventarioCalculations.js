/**
 * Utilidades puras para evaluación de inventario, alertas y descuento de stock
 */

export const evaluarEstadoStock = (item) => {
  const cantidad = parseInt(item.cantidad ?? item.stockActual) || 0
  const minimo = parseInt(item.minimoCritico ?? item.stockMinimo) || 0

  if (cantidad === 0) {
    return { id: 'agotado', texto: '🔴 Agotado', colorBg: 'bg-red-100', colorText: 'text-red-900' }
  }
  if (cantidad <= minimo) {
    return { id: 'critico', texto: '⚠️ Stock Crítico', colorBg: 'bg-amber-100', colorText: 'text-amber-900' }
  }
  return { id: 'normal', texto: '🟢 Normal', colorBg: 'bg-emerald-100', colorText: 'text-emerald-900' }
}

export const evaluarVencimiento = (fechaVencimiento) => {
  if (!fechaVencimiento) return { diasRestantes: 999, estado: 'ok', texto: 'Vigente' }

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

    const cant = parseInt(item.cantidad ?? item.stockActual) || 0
    const precio = parseFloat(item.precioUnitario ?? item.precio) || 0
    valorTotalInventario += (cant * precio)
  })

  return {
    totalInsumos,
    stockCriticoCount,
    porVencerCount,
    valorTotalInventario
  }
}

export const INSUMOS_POR_PRESTACION_DEFAULT = {
  Operatoria: [
    { nombreInsumo: 'Resina Compuesta A2/A3', cantidad: 1, unidad: 'Jeringa/Dosis' },
    { nombreInsumo: 'Adhesivo Dental Universal', cantidad: 1, unidad: 'Gota/Dosis' },
    { nombreInsumo: 'Kit de Examen & Babero Disposables', cantidad: 1, unidad: 'Set' }
  ],
  Endodoncia: [
    { nombreInsumo: 'Limas de Endodoncia Rotatorias', cantidad: 1, unidad: 'Pieza' },
    { nombreInsumo: 'Hipoclorito de Sodio 5.25%', cantidad: 1, unidad: 'Jeringa/Irrigación' },
    { nombreInsumo: 'Conos de Gutapercha', cantidad: 1, unidad: 'Set' }
  ],
  Cirugia: [
    { nombreInsumo: 'Cartucho Anestesia Lidocaína/Epinefrina', cantidad: 2, unidad: 'Tubo' },
    { nombreInsumo: 'Hoja de Bisturí #15', cantidad: 1, unidad: 'Unidad' },
    { nombreInsumo: 'Hilo de Sutura Seda/Nylon 3-0', cantidad: 1, unidad: 'Unidad' }
  ],
  Limpieza: [
    { nombreInsumo: 'Pasta Profiláctica + Cepillo', cantidad: 1, unidad: 'Dosis' },
    { nombreInsumo: 'Eyector de Saliva Disposables', cantidad: 2, unidad: 'Unidad' }
  ]
}

export const descontarStockPorTratamiento = (inventarioActual = [], nombrePrestacion = '') => {
  const nombreLower = nombrePrestacion.toLowerCase()
  let categoriaCoincidente = 'Operatoria'

  if (nombreLower.includes('endo') || nombreLower.includes('conducto')) {
    categoriaCoincidente = 'Endodoncia'
  } else if (nombreLower.includes('exodoncia') || nombreLower.includes('cirugía') || nombreLower.includes('implante')) {
    categoriaCoincidente = 'Cirugia'
  } else if (nombreLower.includes('limpieza') || nombreLower.includes('destartraje') || nombreLower.includes('profilaxis')) {
    categoriaCoincidente = 'Limpieza'
  }

  const insumosARebajar = INSUMOS_POR_PRESTACION_DEFAULT[categoriaCoincidente] || INSUMOS_POR_PRESTACION_DEFAULT.Operatoria

  const inventarioActualizado = inventarioActual.map(item => {
    const coincidencia = insumosARebajar.find(ins => 
      (item.nombre || '').toLowerCase().includes(ins.nombreInsumo.toLowerCase()) ||
      ins.nombreInsumo.toLowerCase().includes((item.nombre || '').toLowerCase())
    )

    if (coincidencia) {
      const stockPrev = parseInt(item.cantidad ?? item.stockActual) || 0
      const nuevoStock = Math.max(0, stockPrev - coincidencia.cantidad)
      return { ...item, cantidad: nuevoStock, stockActual: nuevoStock }
    }
    return item
  })

  return inventarioActualizado
}