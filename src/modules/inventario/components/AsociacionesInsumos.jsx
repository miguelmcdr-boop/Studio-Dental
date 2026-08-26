import React, { memo, useState, useEffect } from 'react'
import { inventarioStorageService } from '../services/inventarioStorageService'
import { INSUMOS_POR_PRESTACION_DEFAULT, PALABRAS_CLAVE_POR_CATEGORIA_DEFAULT } from '../utils/inventarioCalculations'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('AsociacionesInsumos')

const STORAGE_KEY_PALABRAS_CLAVE = 'studio_dental_inventario_palabras_clave'

export const AsociacionesInsumos = memo(({ items }) => {
  const [asociaciones, setAsociaciones] = useState({})
  const [palabrasClave, setPalabrasClave] = useState({})
  const [categoriaActiva, setCategoriaActiva] = useState('Operatoria')
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState('')
  const [nuevaPalabraClave, setNuevaPalabraClave] = useState('')
  const [mostrarInputNuevaCategoria, setMostrarInputNuevaCategoria] = useState(false)

  // Cargar asociaciones y palabras clave al montar
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

  // Guardar asociaciones cuando cambian
  const guardarAsociaciones = (nuevasAsociaciones) => {
    setAsociaciones(nuevasAsociaciones)
    inventarioStorageService.guardarAsociacionesInsumos(nuevasAsociaciones)
  }

  // Guardar palabras clave cuando cambian
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

  // Agregar nueva asociación a la categoría activa
  const handleAgregarAsociacion = () => {
    const nuevasAsociaciones = {
      ...asociaciones,
      [categoriaActiva]: [
        ...asociacionesCategoriaActiva,
        { itemId: null, nombreInsumo: '', cantidad: 0.01, unidad: 'Unidad' }
      ]
    }
    guardarAsociaciones(nuevasAsociaciones)
  }

  // Actualizar una asociación específica
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

  // Eliminar una asociación
  const handleEliminarAsociacion = (index) => {
    const nuevasAsociaciones = {
      ...asociaciones,
      [categoriaActiva]: asociacionesCategoriaActiva.filter((_, i) => i !== index)
    }
    guardarAsociaciones(nuevasAsociaciones)
  }

  // Agregar nueva categoría
  const handleAgregarCategoria = () => {
    if (!nuevaCategoriaNombre.trim()) return
    
    const nombreCategoria = nuevaCategoriaNombre.trim()
    
    const nuevasAsociaciones = {
      ...asociaciones,
      [nombreCategoria]: []
    }
    guardarAsociaciones(nuevasAsociaciones)
    
    const nuevasPalabras = {
      ...palabrasClave,
      [nombreCategoria]: []
    }
    guardarPalabrasClave(nuevasPalabras)
    
    setCategoriaActiva(nombreCategoria)
    setNuevaCategoriaNombre('')
    setMostrarInputNuevaCategoria(false)
  }

  // Eliminar categoría
  const handleEliminarCategoria = (categoria) => {
    if (!window.confirm(`¿Eliminar la categoría "${categoria}" y todas sus asociaciones?`)) return
    
    const nuevasAsociaciones = { ...asociaciones }
    delete nuevasAsociaciones[categoria]
    guardarAsociaciones(nuevasAsociaciones)
    
    const nuevasPalabras = { ...palabrasClave }
    delete nuevasPalabras[categoria]
    guardarPalabrasClave(nuevasPalabras)
    
    const categoriasRestantes = Object.keys(nuevasAsociaciones)
    if (categoriasRestantes.length > 0) {
      setCategoriaActiva(categoriasRestantes[0])
    }
  }

  // Agregar palabra clave a la categoría activa
  const handleAgregarPalabraClave = () => {
    if (!nuevaPalabraClave.trim()) return
    
    const nuevasPalabras = {
      ...palabrasClave,
      [categoriaActiva]: [...palabrasClaveCategoriaActiva, nuevaPalabraClave.trim().toLowerCase()]
    }
    guardarPalabrasClave(nuevasPalabras)
    setNuevaPalabraClave('')
  }

  // Eliminar palabra clave
  const handleEliminarPalabraClave = (index) => {
    const nuevasPalabras = {
      ...palabrasClave,
      [categoriaActiva]: palabrasClaveCategoriaActiva.filter((_, i) => i !== index)
    }
    guardarPalabrasClave(nuevasPalabras)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="border-b pb-3">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
          ⚙️ Asociaciones Tratamiento → Material (Descuento Automático de Stock)
        </h3>
        <p className="text-gray-500 text-[11px] mt-1">
          Configura qué materiales se descuentan automáticamente cuando marcas un tratamiento como "Realizado".
          Cada asociación está vinculada al ID específico del item en tu inventario.
        </p>
      </div>

      {/* Selector de categoría */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="font-semibold text-gray-700 text-xs">Categoría de Tratamiento:</span>
        <select
          value={categoriaActiva}
          onChange={(e) => setCategoriaActiva(e.target.value)}
          className="p-2 border rounded-xl bg-white font-semibold text-xs flex-1 sm:flex-initial min-w-[200px]"
        >
          {categorias.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {mostrarInputNuevaCategoria ? (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Nombre de la nueva categoría"
              value={nuevaCategoriaNombre}
              onChange={(e) => setNuevaCategoriaNombre(e.target.value)}
              className="p-2 border rounded-xl bg-white text-xs flex-1 sm:flex-initial min-w-[200px]"
              autoFocus
            />
            <button
              onClick={handleAgregarCategoria}
              className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700"
            >
              ✓ Crear
            </button>
            <button
              onClick={() => {
                setMostrarInputNuevaCategoria(false)
                setNuevaCategoriaNombre('')
              }}
              className="bg-gray-300 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-400"
            >
              ✕ Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setMostrarInputNuevaCategoria(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700"
          >
            + Nueva Categoría
          </button>
        )}

        {categorias.length > 1 && (
          <button
            onClick={() => handleEliminarCategoria(categoriaActiva)}
            className="bg-red-100 text-red-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-200"
          >
            🗑️ Eliminar Categoría
          </button>
        )}
      </div>

      {/* Palabras clave de la categoría activa */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
        <span className="font-semibold text-gray-700 text-xs block">
          🔑 Palabras clave para detectar automáticamente esta categoría:
        </span>
        <div className="flex flex-wrap gap-2 items-center">
          {palabrasClaveCategoriaActiva.map((palabra, index) => (
            <span key={index} className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border text-xs font-semibold">
              {palabra}
              <button
                onClick={() => handleEliminarPalabraClave(index)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ✕
              </button>
            </span>
          ))}
          {palabrasClaveCategoriaActiva.length === 0 && (
            <span className="text-gray-400 text-xs italic">
              Sin palabras clave — esta categoría solo se usa como fallback
            </span>
          )}
          <input
            type="text"
            placeholder="Nueva palabra clave"
            value={nuevaPalabraClave}
            onChange={(e) => setNuevaPalabraClave(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAgregarPalabraClave()}
            className="p-1.5 border rounded-lg bg-white text-xs w-40"
          />
          <button
            onClick={handleAgregarPalabraClave}
            className="bg-gray-200 text-gray-700 px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-300"
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* Lista de asociaciones de la categoría activa */}
      <div className="space-y-3">
        {asociacionesCategoriaActiva.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-xs">
              No hay materiales asociados a esta categoría de tratamiento.
            </p>
            <button
              onClick={handleAgregarAsociacion}
              className="mt-3 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800"
            >
              + Agregar Primer Material
            </button>
          </div>
        ) : (
          <>
            {asociacionesCategoriaActiva.map((asociacion, index) => {
              const sinVinculacion = !asociacion.itemId
              const itemVinculado = items.find(i => i.id === asociacion.itemId)
              
              return (
                <div
                  key={index}
                  className={`p-4 border rounded-xl space-y-3 ${
                    sinVinculacion 
                      ? 'bg-amber-50 border-amber-300' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {sinVinculacion && (
                    <div className="bg-amber-100 border border-amber-300 rounded-lg p-2 text-xs text-amber-900">
                      ⚠️ <strong>Asociación sin vinculación:</strong> Esta asociación fue migrada desde una versión anterior 
                      y necesita ser vinculada a un item real del inventario. Selecciona el item correcto abajo.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Material del Inventario
                      </label>
                      <select
                        value={asociacion.itemId || ''}
                        onChange={(e) => handleActualizarAsociacion(index, 'itemId', e.target.value ? Number(e.target.value) : null)}
                        className="w-full p-2 border rounded-xl bg-white text-xs font-semibold"
                      >
                        <option value="">-- Seleccionar item del inventario --</option>
                        {items.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.nombre} (Stock: {item.cantidad} {item.unidad})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Cantidad por Tratamiento
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={asociacion.cantidad}
                        onChange={(e) => handleActualizarAsociacion(index, 'cantidad', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border rounded-xl bg-white text-xs font-bold"
                        placeholder="0.04"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Unidad
                      </label>
                      <input
                        type="text"
                        value={itemVinculado?.unidad || asociacion.unidad || ''}
                        readOnly
                        className="w-full p-2 border rounded-xl bg-gray-100 text-xs font-semibold text-gray-600"
                        placeholder="Unidad"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        onClick={() => handleEliminarAsociacion(index)}
                        className="bg-red-100 text-red-700 p-2 rounded-xl text-xs font-bold hover:bg-red-200"
                        title="Eliminar esta asociación"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {itemVinculado && (
                    <div className="text-[10px] text-gray-600 bg-white p-2 rounded-lg border">
                      <strong>Stock actual:</strong> {itemVinculado.cantidad} {itemVinculado.unidad} | 
                      <strong> Categoría:</strong> {itemVinculado.categoria} | 
                      <strong> Proveedor:</strong> {itemVinculado.proveedor || 'N/I'}
                    </div>
                  )}
                </div>
              )
            })}

            <button
              onClick={handleAgregarAsociacion}
              className="w-full bg-black text-white py-3 rounded-xl text-xs font-bold hover:bg-gray-800"
            >
              + Agregar Otro Material a {categoriaActiva}
            </button>
          </>
        )}
      </div>

      {/* Nota explicativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-900">
        <strong>💡 Nota:</strong> Cada asociación está vinculada al ID específico del item en tu inventario.
        Esto significa que si cambias el nombre de un producto, la asociación no se rompe.
        Si eliminas un producto del inventario, la asociación quedará sin vinculación y deberás seleccionarla de nuevo.
      </div>
    </div>
  )
})

AsociacionesInsumos.displayName = 'AsociacionesInsumos'