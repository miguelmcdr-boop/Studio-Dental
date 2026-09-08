import { useState, useEffect } from 'react'
import { inventarioStorageService } from '../services/inventarioStorageService'
import { INSUMOS_POR_PRESTACION_DEFAULT, PALABRAS_CLAVE_POR_CATEGORIA_DEFAULT } from '../utils/inventarioCalculations'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('useAsociaciones')
const STORAGE_KEY_PALABRAS_CLAVE = 'studio_dental_inventario_palabras_clave'

export function useAsociaciones(items) {
  const [asociaciones, setAsociaciones] = useState({})
  const [palabrasClave, setPalabrasClave] = useState({})
  const [categoriaActiva, setCategoriaActiva] = useState('Operatoria')
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState('')
  const [nuevaPalabraClave, setNuevaPalabraClave] = useState('')
  const [mostrarInputNuevaCategoria, setMostrarInputNuevaCategoria] = useState(false)

  useEffect(() => {
    const asociacionesGuardadas = inventarioStorageService.obtenerAsociacionesInsumos()
    setAsociaciones(asociacionesGuardadas || INSUMOS_POR_PRESTACION_DEFAULT)
    try {
      const palabrasGuardadas = localStorage.getItem(STORAGE_KEY_PALABRAS_CLAVE)
      setPalabrasClave(palabrasGuardadas ? JSON.parse(palabrasGuardadas) : PALABRAS_CLAVE_POR_CATEGORIA_DEFAULT)
    } catch {
      setPalabrasClave(PALABRAS_CLAVE_POR_CATEGORIA_DEFAULT)
    }
  }, [])

  const guardarAsociaciones = (nuevasAsociaciones) => {
    setAsociaciones(nuevasAsociaciones)
    inventarioStorageService.guardarAsociacionesInsumos(nuevasAsociaciones)
  }

  const guardarPalabrasClave = (nuevasPalabras) => {
    setPalabrasClave(nuevasPalabras)
    try {
      localStorage.setItem(STORAGE_KEY_PALABRAS_CLAVE, JSON.stringify(nuevasPalabras))
    } catch (e) {
      log.error('Error al guardar palabras clave:', e)
    }
  }

  const categorias = Object.keys(asociaciones)
  const asociacionesCategoriaActiva = asociaciones[categoriaActiva] || []
  const palabrasClaveCategoriaActiva = palabrasClave[categoriaActiva] || []

  const handleAgregarAsociacion = () => {
    const nuevasAsociaciones = {
      ...asociaciones,
      [categoriaActiva]: [...asociacionesCategoriaActiva, { itemId: null, nombreInsumo: '', cantidad: 0.01, unidad: 'Unidad' }]
    }
    guardarAsociaciones(nuevasAsociaciones)
  }

  const handleActualizarAsociacion = (index, campo, valor) => {
    const nuevasAsociaciones = { ...asociaciones }
    const itemSeleccionado = items.find(i => i.id === valor)
    nuevasAsociaciones[categoriaActiva][index] = {
      ...nuevasAsociaciones[categoriaActiva][index],
      [campo]: valor,
      ...(campo === 'itemId' && itemSeleccionado && { nombreInsumo: itemSeleccionado.nombre })
    }
    guardarAsociaciones(nuevasAsociaciones)
  }

  const handleEliminarAsociacion = (index) => {
    const nuevasAsociaciones = {
      ...asociaciones,
      [categoriaActiva]: asociacionesCategoriaActiva.filter((_, i) => i !== index)
    }
    guardarAsociaciones(nuevasAsociaciones)
  }

  const handleAgregarCategoria = () => {
    if (!nuevaCategoriaNombre.trim()) return
    const nombreCategoria = nuevaCategoriaNombre.trim()
    const nuevasAsociaciones = { ...asociaciones, [nombreCategoria]: [] }
    guardarAsociaciones(nuevasAsociaciones)
    const nuevasPalabras = { ...palabrasClave, [nombreCategoria]: [] }
    guardarPalabrasClave(nuevasPalabras)
    setCategoriaActiva(nombreCategoria)
    setNuevaCategoriaNombre('')
    setMostrarInputNuevaCategoria(false)
  }

  const handleEliminarCategoria = (categoria) => {
    if (!window.confirm(`¿Eliminar la categoría "${categoria}" y todas sus asociaciones?`)) return
    const nuevasAsociaciones = { ...asociaciones }
    delete nuevasAsociaciones[categoria]
    guardarAsociaciones(nuevasAsociaciones)
    const nuevasPalabras = { ...palabrasClave }
    delete nuevasPalabras[categoria]
    guardarPalabrasClave(nuevasPalabras)
    const categoriasRestantes = Object.keys(nuevasAsociaciones)
    if (categoriasRestantes.length > 0) setCategoriaActiva(categoriasRestantes[0])
  }

  const handleAgregarPalabraClave = () => {
    if (!nuevaPalabraClave.trim()) return
    const nuevasPalabras = {
      ...palabrasClave,
      [categoriaActiva]: [...palabrasClaveCategoriaActiva, nuevaPalabraClave.trim().toLowerCase()]
    }
    guardarPalabrasClave(nuevasPalabras)
    setNuevaPalabraClave('')
  }

  const handleEliminarPalabraClave = (index) => {
    const nuevasPalabras = {
      ...palabrasClave,
      [categoriaActiva]: palabrasClaveCategoriaActiva.filter((_, i) => i !== index)
    }
    guardarPalabrasClave(nuevasPalabras)
  }

  return {
    categoriaActiva,
    setCategoriaActiva,
    categorias,
    asociacionesCategoriaActiva,
    palabrasClaveCategoriaActiva,
    nuevaCategoriaNombre,
    setNuevaCategoriaNombre,
    nuevaPalabraClave,
    setNuevaPalabraClave,
    mostrarInputNuevaCategoria,
    setMostrarInputNuevaCategoria,
    handleAgregarAsociacion,
    handleActualizarAsociacion,
    handleEliminarAsociacion,
    handleAgregarCategoria,
    handleEliminarCategoria,
    handleAgregarPalabraClave,
    handleEliminarPalabraClave
  }
}
