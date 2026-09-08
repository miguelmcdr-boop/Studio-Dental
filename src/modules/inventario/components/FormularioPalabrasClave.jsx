import React from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

export function FormularioPalabrasClave({
  palabrasClaveCategoriaActiva,
  nuevaPalabraClave,
  setNuevaPalabraClave,
  handleAgregarPalabraClave,
  handleEliminarPalabraClave
}) {
  return (
    <div className="bg-gray-50 dark:bg-graphite-800 p-4 rounded-xl border border-gray-200 dark:border-graphite-700 space-y-2">
      <span className="font-semibold text-graphite-700 dark:text-graphite-300 text-xs block">
        🔑 Palabras clave para detectar automáticamente esta categoría:
      </span>
      <div className="flex flex-wrap gap-2 items-center">
        {palabrasClaveCategoriaActiva.map((palabra, index) => (
          <span key={index} className="inline-flex items-center gap-1 bg-white dark:bg-graphite-700 px-2 py-1 rounded-lg border dark:border-graphite-600 text-xs font-semibold text-graphite-800 dark:text-graphite-200">
            {palabra}
            <Button
              onClick={() => handleEliminarPalabraClave(index)}
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 p-0 w-4 h-4"
            >
              ✕
            </Button>
          </span>
        ))}
        {palabrasClaveCategoriaActiva.length === 0 && (
          <span className="text-graphite-400 dark:text-graphite-500 text-xs italic">
            Sin palabras clave — esta categoría solo se usa como fallback
          </span>
        )}
        <Input
          type="text"
          placeholder="Nueva palabra clave"
          value={nuevaPalabraClave}
          onChange={(e) => setNuevaPalabraClave(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAgregarPalabraClave()}
          className="w-40"
        />
        <Button
          onClick={handleAgregarPalabraClave}
          variant="secondary"
          size="sm"
        >
          + Agregar
        </Button>
      </div>
    </div>
  )
}
