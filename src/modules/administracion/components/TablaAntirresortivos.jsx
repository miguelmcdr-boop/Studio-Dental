/**
 * Tabla de antirresortivos óseos con riesgo de MRONJ.
 * Muestra 6 fármacos con badges de color según riesgo.
 * F4-03f-2
 */
import React, { memo } from 'react'

const RIESGO_COLORS = {
  bajo: 'bg-green-100 text-green-800 border-green-300',
  moderado: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  alto: 'bg-red-100 text-red-800 border-red-300'
}

export const TablaAntirresortivos = memo(({ antirresortivos, onEditar, onDesactivar, onCrearNuevo }) => {
  const datos = Array.isArray(antirresortivos) ? antirresortivos : []

  return (
    <div className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-graphite-700 bg-gray-50 dark:bg-graphite-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-graphite-50">
            Antirresortivos óseos y riesgo de MRONJ
          </h3>
          {onCrearNuevo && (
            <button
              onClick={onCrearNuevo}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-150"
            >
              + Nuevo antirresortivo
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-graphite-400 mt-1">
          {datos.length} fármacos registrados — Relevancia crítica en exodoncias e implantes
        </p>
      </div>

      {datos.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-graphite-400">
          No hay antirresortivos registrados
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-graphite-700">
            <thead className="bg-gray-50 dark:bg-graphite-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-graphite-400 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-graphite-400 uppercase">Medicamento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-graphite-400 uppercase">Familia</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-graphite-400 uppercase">Vía / Dosis</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-graphite-400 uppercase">Indicación</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-graphite-400 uppercase">Riesgo MRONJ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-graphite-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-graphite-800 divide-y divide-gray-200 dark:divide-graphite-700">
              {datos.map((farmaco) => (
                <tr
                  key={farmaco.id || farmaco.numero}
                  className="hover:bg-gray-50 dark:hover:bg-graphite-700 dark:hover:bg-graphite-700 transition-colors duration-150"
                >
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-graphite-300 font-mono">
                    {farmaco.numero}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-graphite-50">
                    {farmaco.nombre_generico}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-graphite-300">
                    {farmaco.familia}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-graphite-300">
                    {farmaco.via_administracion} {farmaco.dosis_habitual && `(${farmaco.dosis_habitual})`}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-graphite-300 max-w-xs truncate">
                    {farmaco.indicacion}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded border ${RIESGO_COLORS[farmaco.riesgo_mronj] || 'bg-gray-100 dark:bg-graphite-800 text-gray-700 dark:text-graphite-300 border-gray-300 dark:border-graphite-600'}`}>
                      {farmaco.riesgo_mronj?.toUpperCase() || 'N/D'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      {onEditar && (
                        <button
                          onClick={() => onEditar(farmaco)}
                          className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100 transition-colors duration-150"
                        >
                          Editar
                        </button>
                      )}
                      {onDesactivar && farmaco.activo !== false && (
                        <button
                          onClick={() => onDesactivar(farmaco)}
                          className="px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded text-xs font-medium hover:bg-yellow-100 transition-colors duration-150"
                        >
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
})
