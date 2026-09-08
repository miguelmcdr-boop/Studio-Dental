import React from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

export function SelectorCategoria({
  categoriaActiva,
  setCategoriaActiva,
  categorias,
  nuevaCategoriaNombre,
  setNuevaCategoriaNombre,
  mostrarInputNuevaCategoria,
  setMostrarInputNuevaCategoria,
  handleAgregarCategoria,
  handleEliminarCategoria
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="font-semibold text-graphite-700 dark:text-graphite-300 text-xs">Categoría de Tratamiento:</span>
      <select
        value={categoriaActiva}
        onChange={(e) => setCategoriaActiva(e.target.value)}
        className="p-2 border rounded-xl bg-white dark:bg-graphite-800 font-semibold text-xs flex-1 sm:flex-initial min-w-[200px]"
      >
        {categorias.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      {mostrarInputNuevaCategoria ? (
        <div className="flex gap-2 items-center">
          <Input
            type="text"
            placeholder="Nombre de la nueva categoría"
            value={nuevaCategoriaNombre}
            onChange={(e) => setNuevaCategoriaNombre(e.target.value)}
            className="flex-1 sm:flex-initial min-w-[200px]"
            autoFocus
          />
          <Button
            onClick={handleAgregarCategoria}
            variant="primary"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            ✓ Crear
          </Button>
          <Button
            onClick={() => {
              setMostrarInputNuevaCategoria(false)
              setNuevaCategoriaNombre('')
            }}
            variant="secondary"
            size="sm"
          >
            ✕ Cancelar
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => setMostrarInputNuevaCategoria(true)}
          variant="primary"
          size="sm"
        >
          + Nueva Categoría
        </Button>
      )}

      {categorias.length > 1 && (
        <Button
          onClick={() => handleEliminarCategoria(categoriaActiva)}
          variant="danger"
          size="sm"
          className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
        >
          🗑️ Eliminar Categoría
        </Button>
      )}
    </div>
  )
}
