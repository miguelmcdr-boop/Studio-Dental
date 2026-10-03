import { useState, useEffect } from 'react'
import type React from 'react'
import {
  inventarioStorageService,
  type ItemInventario,
  type AsociacionesInsumos,
  type InsumoAsociado
} from '../services/inventarioStorageService'
import { INSUMOS_POR_PRESTACION_DEFAULT, PALABRAS_CLAVE_POR_CATEGORIA_DEFAULT } from '../utils/inventarioCalculations'
import { createLogger } from '../../../services/logger'
import { useAppDialog } from '../../../hooks/useAppDialog'

const log = createLogger('useAsociaciones')
const STORAGE_KEY_PALABRAS_CLAVE = 'studio_dental_inventario_palabras_clave'

export interface InsumoAsociadoItem extends Partial<InsumoAsociado> {
  itemId?: string | number | null
  nombreInsumo?: string
  cantidad?: number
  unidad?: string
  [key: string]: unknown
}

export type AsociacionesMap = Record<string, InsumoAsociadoItem[]>
export type PalabrasClaveMap = Record<string, string[]>

export interface UseAsociacionesReturn {
  categoriaActiva: string
  setCategoriaActiva: React.Dispatch<React.SetStateAction<string>>
  categorias: string[]
  asociacionesCategoriaActiva: InsumoAsociadoItem[]
  palabrasClaveCategoriaActiva: string[]
  nuevaCategoriaNombre: string
  setNuevaCategoriaNombre: React.Dispatch<React.SetStateAction<string>>
  nuevaPalabraClave: string
  setNuevaPalabraClave: React.Dispatch<React.SetStateAction<string>>
  mostrarInputNuevaCategoria: boolean
  setMostrarInputNuevaCategoria: React.Dispatch<React.SetStateAction<boolean>>
  handleAgregarAsociacion: () => void
  handleActualizarAsociacion: (index: number, campo: string, valor: unknown) => void
  handleEliminarAsociacion: (index: number) => void
  handleAgregarCategoria: () => void
  handleEliminarCategoria: (categoria: string) => Promise<void>
  handleAgregarPalabraClave: () => void
  handleEliminarPalabraClave: (index: number) => void
}

export function useAsociaciones(items: ItemInventario[] = []): UseAsociacionesReturn {
  const { confirm } = useAppDialog()
  const [asociaciones, setAsociaciones] = useState<AsociacionesMap>({})
  const [palabrasClave, setPalabrasClave] = useState<PalabrasClaveMap>({})
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Operatoria')
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState<string>('')
  const [nuevaPalabraClave, setNuevaPalabraClave] = useState<string>('')
  const [mostrarInputNuevaCategoria, setMostrarInputNuevaCategoria] = useState<boolean>(false)

  useEffect(() => {
    const asociacionesGuardadas = inventarioStorageService.obtenerAsociacionesInsumos()
    setAsociaciones((asociacionesGuardadas || INSUMOS_POR_PRESTACION_DEFAULT) as unknown as AsociacionesMap)
    try {
      const palabrasGuardadas = localStorage.getItem(STORAGE_KEY_PALABRAS_CLAVE)
      setPalabrasClave(palabrasGuardadas ? JSON.parse(palabrasGuardadas) : PALABRAS_CLAVE_POR_CATEGORIA_DEFAULT)
    } catch {
      setPalabrasClave(PALABRAS_CLAVE_POR_CATEGORIA_DEFAULT)
    }
  }, [])

  const guardarAsociaciones = (nuevasAsociaciones: AsociacionesMap): void => {
    setAsociaciones(nuevasAsociaciones)
    inventarioStorageService.guardarAsociacionesInsumos(nuevasAsociaciones as unknown as AsociacionesInsumos)
  }

  const guardarPalabrasClave = (nuevasPalabras: PalabrasClaveMap): void => {
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

  const handleAgregarAsociacion = (): void => {
    const nuevasAsociaciones = {
      ...asociaciones,
      [categoriaActiva]: [...asociacionesCategoriaActiva, { itemId: null, nombreInsumo: '', cantidad: 0.01, unidad: 'Unidad' }]
    }
    guardarAsociaciones(nuevasAsociaciones)
  }

  const handleActualizarAsociacion = (index: number, campo: string, valor: unknown): void => {
    const nuevasAsociaciones = { ...asociaciones }
    const itemSeleccionado = items.find(i => String(i.id) === String(valor))
    nuevasAsociaciones[categoriaActiva] = [...(nuevasAsociaciones[categoriaActiva] || [])]
    nuevasAsociaciones[categoriaActiva][index] = {
      ...nuevasAsociaciones[categoriaActiva][index],
      [campo]: valor,
      ...(campo === 'itemId' && itemSeleccionado && { nombreInsumo: itemSeleccionado.nombre })
    }
    guardarAsociaciones(nuevasAsociaciones)
  }

  const handleEliminarAsociacion = (index: number): void => {
    const nuevasAsociaciones = {
      ...asociaciones,
      [categoriaActiva]: asociacionesCategoriaActiva.filter((_, i) => i !== index)
    }
    guardarAsociaciones(nuevasAsociaciones)
  }

  const handleAgregarCategoria = (): void => {
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

  const handleEliminarCategoria = async (categoria: string): Promise<void> => {
    const ok = await confirm({
      title: 'Eliminar categoría',
      description: `¿Eliminar la categoría "${categoria}" y todas sus asociaciones?`,
      variant: 'warning',
      confirmText: 'Eliminar categoría'
    })
    if (!ok) return
    const nuevasAsociaciones = { ...asociaciones }
    delete nuevasAsociaciones[categoria]
    guardarAsociaciones(nuevasAsociaciones)
    const nuevasPalabras = { ...palabrasClave }
    delete nuevasPalabras[categoria]
    guardarPalabrasClave(nuevasPalabras)
    const categoriasRestantes = Object.keys(nuevasAsociaciones)
    if (categoriasRestantes.length > 0) setCategoriaActiva(categoriasRestantes[0])
  }

  const handleAgregarPalabraClave = (): void => {
    if (!nuevaPalabraClave.trim()) return
    const nuevasPalabras = {
      ...palabrasClave,
      [categoriaActiva]: [...palabrasClaveCategoriaActiva, nuevaPalabraClave.trim().toLowerCase()]
    }
    guardarPalabrasClave(nuevasPalabras)
    setNuevaPalabraClave('')
  }

  const handleEliminarPalabraClave = (index: number): void => {
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
