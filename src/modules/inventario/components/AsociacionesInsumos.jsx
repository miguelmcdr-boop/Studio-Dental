import React, { memo } from 'react'
import { useAsociaciones } from '../hooks/useAsociaciones'
import { SelectorCategoria } from './SelectorCategoria'
import { FormularioPalabrasClave } from './FormularioPalabrasClave'
import { TablaAsociaciones } from './TablaAsociaciones'

export const AsociacionesInsumos = memo(({ items }) => {
  const {
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
  } = useAsociaciones(items)

  return (
    <div className="bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-700 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="border-b dark:border-graphite-700 pb-3">
        <h3 className="font-bold text-sm text-graphite-900 dark:text-graphite-100 uppercase tracking-wider">
          ⚙️ Asociaciones Tratamiento → Material (Descuento Automático de Stock)
        </h3>
        <p className="text-graphite-500 dark:text-graphite-400 text-[11px] mt-1">
          Configura qué materiales se descuentan automáticamente cuando marcas un tratamiento como "Realizado".
          Cada asociación está vinculada al ID específico del item en tu inventario.
        </p>
      </div>

      <SelectorCategoria
        categoriaActiva={categoriaActiva}
        setCategoriaActiva={setCategoriaActiva}
        categorias={categorias}
        nuevaCategoriaNombre={nuevaCategoriaNombre}
        setNuevaCategoriaNombre={setNuevaCategoriaNombre}
        mostrarInputNuevaCategoria={mostrarInputNuevaCategoria}
        setMostrarInputNuevaCategoria={setMostrarInputNuevaCategoria}
        handleAgregarCategoria={handleAgregarCategoria}
        handleEliminarCategoria={handleEliminarCategoria}
      />

      <FormularioPalabrasClave
        palabrasClaveCategoriaActiva={palabrasClaveCategoriaActiva}
        nuevaPalabraClave={nuevaPalabraClave}
        setNuevaPalabraClave={setNuevaPalabraClave}
        handleAgregarPalabraClave={handleAgregarPalabraClave}
        handleEliminarPalabraClave={handleEliminarPalabraClave}
      />

      <TablaAsociaciones
        items={items}
        categoriaActiva={categoriaActiva}
        asociacionesCategoriaActiva={asociacionesCategoriaActiva}
        handleAgregarAsociacion={handleAgregarAsociacion}
        handleActualizarAsociacion={handleActualizarAsociacion}
        handleEliminarAsociacion={handleEliminarAsociacion}
      />

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-[11px] text-blue-900 dark:text-blue-200">
        <strong>💡 Nota:</strong> Cada asociación está vinculada al ID específico del item en tu inventario.
        Esto significa que si cambias el nombre de un producto, la asociación no se rompe.
        Si eliminas un producto del inventario, la asociación quedará sin vinculación y deberás seleccionarla de nuevo.
      </div>
    </div>
  )
})

AsociacionesInsumos.displayName = 'AsociacionesInsumos'
