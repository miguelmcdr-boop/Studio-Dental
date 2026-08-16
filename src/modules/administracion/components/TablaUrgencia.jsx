/**
 * Tabla de fármacos de urgencia / carro de reanimación odontológico.
 * Muestra 11 fármacos críticos con vía de administración e indicación.
 * F4-03f-2
 */
import React from 'react'

export const TablaUrgencia = ({ urgencia, onEditar, onDesactivar, onCrearNuevo }) => {
  const datos = Array.isArray(urgencia) ? urgencia : []

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            🚨 Fármacos de Urgencia / Carro de Reanimación
          </h3>
          {onCrearNuevo && (
            <button
              onClick={onCrearNuevo}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700"
            >
              + Nuevo fármaco
            </button>
          )}
        </div>
        <p className="text-sm text-gray-700 mt-1">
          {datos.length} fármacos críticos — Verificar fechas de vencimiento periódicamente
        </p>
      </div>

      {datos.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No hay fármacos de urgencia registrados
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Medicamento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Concentración</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Presentación</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Indicación</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vía</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {datos.map((farmaco) => (
                <tr
                  key={farmaco.id || farmaco.numero}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                    {farmaco.numero}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {farmaco.nombre_generico}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {farmaco.concentracion}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {farmaco.presentacion}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={farmaco.indicacion}>
                    {farmaco.indicacion}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-200">
                      {farmaco.via_administracion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      {onEditar && (
                        <button
                          onClick={() => onEditar(farmaco)}
                          className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100"
                        >
                          Editar
                        </button>
                      )}
                      {onDesactivar && farmaco.activo !== false && (
                        <button
                          onClick={() => onDesactivar(farmaco)}
                          className="px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded text-xs font-medium hover:bg-yellow-100"
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

      <div className="px-6 py-3 border-t border-gray-200 bg-yellow-50 text-xs text-yellow-800">
        <strong>⚠️ Nota crítica:</strong> Todo box dental debe contar con estos fármacos accesibles, con verificación periódica de fechas de vencimiento, y el equipo debe estar entrenado en reanimación básica (BLS) y protocolo de manejo de anafilaxia.
      </div>
    </div>
  )
}
