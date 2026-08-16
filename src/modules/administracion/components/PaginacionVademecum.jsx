/**
 * Componente de paginación para tablas de vademécum.
 * F4-03f-2 (refactorización)
 */
import React from 'react'

export const PaginacionVademecum = ({ paginaActual, totalPaginas, setPaginaActual }) => {
  if (totalPaginas <= 1) return null

  return (
    <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
      <div className="text-sm text-gray-600">
        Página {paginaActual} de {totalPaginas}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setPaginaActual(paginaActual - 1)}
          disabled={paginaActual === 1}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Anterior
        </button>
        <button
          onClick={() => setPaginaActual(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}
