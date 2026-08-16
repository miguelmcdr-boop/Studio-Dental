/**
 * Barra de filtros para el vademécum.
 * Incluye búsqueda por texto, filtro por familia y toggle de activos.
 * F4-03f-2 (refactorización)
 */
import React from 'react'

export const FiltrosVademecum = ({
  familiasDisponibles,
  familiaSeleccionada,
  setFamiliaSeleccionada,
  textoBusqueda,
  setTextoBusqueda,
  soloActivos,
  setSoloActivos,
  onCrearNuevo
}) => {
  return (
    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">
          Vademécum Odontológico Regular
        </h3>
        {onCrearNuevo && (
          <button
            onClick={onCrearNuevo}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
          >
            + Nuevo fármaco
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {/* Búsqueda */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={textoBusqueda}
            onChange={(e) => {
              setTextoBusqueda(e.target.value)
            }}
            placeholder="🔍 Buscar por nombre genérico, comercial o presentación..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtro de familia */}
        <select
          value={familiaSeleccionada}
          onChange={(e) => setFamiliaSeleccionada(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todas las familias</option>
          {familiasDisponibles.map((familia) => (
            <option key={familia} value={familia}>
              {familia.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        {/* Toggle activos */}
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={soloActivos}
            onChange={() => setSoloActivos(!soloActivos)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Solo activos</span>
        </label>
      </div>
    </div>
  )
}
