/**
 * Utilidades puras para evaluación de inventario, alertas y descuento de stock
 */

export const evaluarEstadoStock = (item) => {
  const cantidad = parseFloat(item.cantidad ?? item.stockActual) || 0
  const minimo = parseFloat(item.minimoCritico ?? item.stockMinimo) || 0

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

    const cant = parseFloat(item.cantidad ?? item.stockActual) || 0
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

/**
 * Diccionario semilla de asociaciones tratamiento→material.
 * Se usa como valor por defecto la primera vez que se carga el sistema
 * o si el usuario resetea las asociaciones desde la UI (F2-12).
 * Las cantidades son fraccionales para modelar consumo real (ej: 0.04
 * jeringas por restauración = 1 jeringa / 25 restauraciones).
 * Exportado para que el storageService lo use como fallback.
 */
export const INSUMOS_POR_PRESTACION_DEFAULT = {
  Operatoria: [
    { nombreInsumo: 'Resina Compuesta A2/A3', cantidad: 0.04, unidad: 'Jeringa/Dosis' },
    { nombreInsumo: 'Adhesivo Dental Universal', cantidad: 0.02, unidad: 'Gota/Dosis' },
    { nombreInsumo: 'Kit de Examen & Babero Disposables', cantidad: 1, unidad: 'Set' }
  ],
  Endodoncia: [
    { nombreInsumo: 'Limas de Endodoncia Rotatorias', cantidad: 0.1, unidad: 'Pieza' },
    { nombreInsumo: 'Hipoclorito de Sodio 5.25%', cantidad: 0.1, unidad: 'Jeringa/Irrigación' },
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

/**
 * Palabras clave por categoría para detectar automáticamente la categoría
 * de un tratamiento cuando se marca como "Realizado" (F2-12).
 * Las 4 categorías semilla tienen palabras clave predefinidas.
 * Las categorías nuevas creadas por el usuario empiezan con lista vacía.
 */
export const PALABRAS_CLAVE_POR_CATEGORIA_DEFAULT = {
  Operatoria: [],
  Endodoncia: ['endo', 'conducto'],
  Cirugia: ['exodoncia', 'cirugía', 'cirugia', 'implante'],
  Limpieza: ['limpieza', 'destartraje', 'profilaxis']
}

/**
 * Detecta la categoría de tratamiento según el nombre de la prestación.
 * F2-12: usa las palabras clave configuradas en las asociaciones.
 * @param {string} nombrePrestacion - Nombre de la prestación realizada
 * @param {Object} asociaciones - Diccionario categoría → [{itemId, nombreInsumo, cantidad, unidad}]
 * @param {Object} palabrasClave - Diccionario categoría → [palabras clave]
 * @returns {string} Nombre de la categoría detectada
 */
export const detectarCategoriaTratamiento = (nombrePrestacion = '', asociaciones = {}, palabrasClave = {}) => {
  const nombreLower = nombrePrestacion.toLowerCase()
  
  for (const [categoria, palabras] of Object.entries(palabrasClave)) {
    if (Array.isArray(palabras) && palabras.length > 0 && asociaciones[categoria]) {
      const coincide = palabras.some(p => nombreLower.includes(p.toLowerCase()))
      if (coincide) return categoria
    }
  }
  
  // Fallback a Operatoria si existe, sino a la primera categoría disponible
  const categoriasDisponibles = Object.keys(asociaciones)
  if (categoriasDisponibles.includes('Operatoria')) return 'Operatoria'
  return categoriasDisponibles[0] || 'Operatoria'
}

/**
 * Descuenta stock del inventario según la prestación realizada.
 * F2-12: busca por itemId (vinculación exacta). Si la asociación no tiene
 * itemId (migración pendiente), hace fallback a búsqueda por nombre.
 * @param {Array} inventarioActual - Lista de items del inventario
 * @param {string} nombrePrestacion - Nombre de la prestación realizada
 * @param {Object} asociaciones - Diccionario categoría → [{itemId, nombreInsumo, cantidad, unidad}]
 */
export const descontarStockPorTratamiento = (inventarioActual = [], nombrePrestacion = '', asociaciones = null) => {
  const asociacionesEfectivas = asociaciones || INSUMOS_POR_PRESTACION_DEFAULT

  const nombreLower = nombrePrestacion.toLowerCase()
  let categoriaCoincidente = 'Operatoria'

  if (nombreLower.includes('endo') || nombreLower.includes('conducto')) {
    categoriaCoincidente = 'Endodoncia'
  } else if (nombreLower.includes('exodoncia') || nombreLower.includes('cirugía') || nombreLower.includes('implante')) {
    categoriaCoincidente = 'Cirugia'
  } else if (nombreLower.includes('limpieza') || nombreLower.includes('destartraje') || nombreLower.includes('profilaxis')) {
    categoriaCoincidente = 'Limpieza'
  }

  const insumosARebajar = asociacionesEfectivas[categoriaCoincidente] || asociacionesEfectivas.Operatoria || []

  const inventarioActualizado = inventarioActual.map(item => {
    // F2-12: búsqueda por itemId (vinculación exacta)
    let coincidencia = insumosARebajar.find(ins => ins.itemId && ins.itemId === item.id)
    
    // Fallback: si no hay vinculación por itemId, buscar por nombre (migración pendiente)
    if (!coincidencia) {
      coincidencia = insumosARebajar.find(ins => 
        !ins.itemId && (
          (item.nombre || '').toLowerCase().includes(ins.nombreInsumo.toLowerCase()) ||
          ins.nombreInsumo.toLowerCase().includes((item.nombre || '').toLowerCase())
        )
      )
    }

    if (coincidencia) {
      const stockPrev = parseFloat(item.cantidad ?? item.stockActual) || 0
      const nuevoStock = Math.max(0, stockPrev - coincidencia.cantidad)
      return { ...item, cantidad: nuevoStock, stockActual: nuevoStock }
    }
    return item
  })

  return inventarioActualizado
}

/**
 * Descuenta stock del inventario según los materiales seleccionados manualmente
 * por el usuario en el modal de F2-12.
 * @param {Array} inventarioActual - Lista de items del inventario
 * @param {Array} materialesSeleccionados - [{itemId, cantidad}]
 * @returns {Array} Inventario actualizado
 */
export const descontarMaterialesSeleccionados = (inventarioActual = [], materialesSeleccionados = []) => {
  if (!Array.isArray(materialesSeleccionados) || materialesSeleccionados.length === 0) {
    return inventarioActual
  }

  return inventarioActual.map(item => {
    const materialSel = materialesSeleccionados.find(m => m.itemId === item.id)
    
    if (materialSel) {
      const stockPrev = parseFloat(item.cantidad ?? item.stockActual) || 0
      const cantidadADescontar = parseFloat(materialSel.cantidad) || 0
      const nuevoStock = Math.max(0, stockPrev - cantidadADescontar)
      return { ...item, cantidad: nuevoStock, stockActual: nuevoStock }
    }
    return item
  })
}