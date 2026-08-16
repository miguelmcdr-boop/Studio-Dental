/**
 * Tabla principal de vademécum odontológico (94 fármacos regulares).
 * Refactorizado en componentes más pequeños:
 * - FiltrosVademecum: barra de búsqueda y filtros
 * - FilaVademecum: renderizado de cada fila
 * - PaginacionVademecum: navegación entre páginas
 * F4-03f-2 (refactorización)
 */
import React, { useState, useMemo } from 'react'
import { FiltrosVademecum } from './FiltrosVademecum'
import { FilaVademecum } from './FilaVademecum'
import { PaginacionVademecum } from './PaginacionVademecum'

const ITEMS_POR_PAGINA = 20

export const TablaVademecum = ({
  vademecum,
  vademecumCompleto,
  familiasDisponibles,
  familiaSeleccionada,
  setFamiliaSeleccionada,
  textoBusqueda,
  setTextoBusqueda,
  soloActivos,
  setSoloActivos,
  onEditar,
  onDesactivar,
  onReactivar,
  onCrearNuevo
}) => {
  const [paginaActual, setPaginaActual] = useState(1)

  // Resetear página cuando cambian los filtros
  const handleFamiliaChange = (value) => {
    setFamiliaSeleccionada(value)
    setPaginaActual(1)
  }

  const handleTextoChange = (value) => {
    setTextoBusqueda(value)
    setPaginaActual(1)
  }

  const handleToggleActivos = () => {
    setSoloActivos(!soloActivos)
    setPaginaActual(1)
  }

  // Paginación
  const totalPaginas = Math.ceil((vademecum?.length || 0) / ITEMS_POR_PAGINA)
  const datosPaginados = useMemo(() => {
    if (!vademecum) return []
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA
    return vademecum.slice(inicio, inicio + ITEMS_POR_PAGINA)
  }, [vademecum, paginaActual])

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Filtros */}
      <FiltrosVademecum
        familiasDisponibles={familiasDisponibles}
        familiaSeleccionada={familiaSeleccionada}
        setFamiliaSeleccionada={handleFamiliaChange}
        textoBusqueda={textoBusqueda}
        setTextoBusqueda={handleTextoChange}
        soloActivos={soloActivos}
        setSoloActivos={handleToggleActivos}
        onCrearNuevo={onCrearNuevo}
      />

      {/* Contador */}
      <div className="px-6 py-2 text-sm text-gray-600 border-b border-gray-200">
        Mostrando <span className="font-semibold">{datosPaginados.length}</span> de{' '}
        <span className="font-semibold">{vademecum?.length || 0}</span> fármacos
        {vademecumCompleto && vademecumCompleto.length !== vademecum?.length && (
          <span className="text-gray-500"> ({vademecumCompleto.length} en total)</span>
        )}
      </div>

      {/* Tabla */}
      {datosPaginados.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No hay fármacos que coincidan con los filtros aplicados
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Familia</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nombre Genérico</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Presentación</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Posología Adulto</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Posología Pediátrica</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {datosPaginados.map((farmaco) => (
                <FilaVademecum
                  key={farmaco.id || farmaco.numero}
                  farmaco={farmaco}
                  onEditar={onEditar}
                  onDesactivar={onDesactivar}
                  onReactivar={onReactivar}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      <PaginacionVademecum
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        setPaginaActual={setPaginaActual}
      />
    </div>
  )
}
