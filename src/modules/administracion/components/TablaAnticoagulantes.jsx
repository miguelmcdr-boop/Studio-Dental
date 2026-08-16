/**
 * Tabla de manejo perioperatorio de anticoagulantes y antiagregantes.
 * Basado en Sección 2B del vademécum v1.1 (tendencia actual AHA/ACC).
 * F4-03f-5c
 */
import React from 'react'

export const TablaAnticoagulantes = ({ anticoagulantes, onEditar, onEliminar, onCrearNueva }) => {
  const datos = Array.isArray(anticoagulantes) ? anticoagulantes : []

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-rose-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            🩸 Manejo Perioperatorio de Anticoagulantes y Antiagregantes
          </h3>
          {onCrearNueva && (
            <button
              onClick={onCrearNueva}
              className="px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700"
            >
              + Nuevo grupo
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {datos.length} grupos farmacológicos — Tendencia actual: NO suspender para cirugía menor
        </p>
      </div>

      {/* Advertencia crítica */}
      <div className="px-6 py-3 border-b border-gray-200 bg-yellow-50 text-sm text-yellow-800">
        <strong>⚠️ Nota importante:</strong> Esta tabla es orientativa y <strong>NO reemplaza la interconsulta con el médico tratante/cardiólogo</strong> cuando el procedimiento implica riesgo hemorrágico moderado-alto. La tendencia actual (AHA/ACC, guías europeas) favorece <strong>NO suspender</strong> la mayoría de estos fármacos para procedimientos dentales menores.
      </div>

      {/* Tabla */}
      {datos.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No hay registros de manejo de anticoagulantes
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fármaco / grupo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Recomendación</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Medidas de hemostasia</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {datos.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[250px]">
                    {item.farmaco_o_grupo}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[400px]">
                    {item.recomendacion}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[350px]" title={item.medidas_hemostasia}>
                    {item.medidas_hemostasia || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      {onEditar && (
                        <button
                          onClick={() => onEditar(item)}
                          className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100"
                        >
                          Editar
                        </button>
                      )}
                      {onEliminar && item.activo !== false && (
                        <button
                          onClick={() => onEliminar(item)}
                          className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-medium hover:bg-red-100"
                        >
                          Eliminar
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

      {/* Nota clínica al pie */}
      <div className="px-6 py-4 border-t border-gray-200 bg-rose-50 text-sm text-rose-800 space-y-2">
        <p><strong>📝 Regla general (cirugía dental simple):</strong></p>
        <ul className="list-disc list-inside space-y-1 text-rose-700">
          <li>1-3 exodoncias no complejas, curetaje, cirugía de tejido blando limitado → <strong>rara vez amerita suspensión</strong> de antitrombóticos.</li>
          <li>Reservar la interrupción de terapia para: cirugías extensas, múltiples extracciones simultáneas, o antecedente personal de sangrado difícil de controlar.</li>
          <li><strong>Warfarina/Acenocumarol:</strong> verificar INR el día del procedimiento (rango terapéutico 2.0 - 3.5-4.0 para exodoncias simples).</li>
          <li><strong>DOACs:</strong> para procedimientos de bajo riesgo, programar en el valle de acción (omitir dosis de la mañana si es de toma matinal).</li>
          <li><strong>Analgesia preferida:</strong> Paracetamol o Tramadol. Evitar AINEs clásicos por riesgo de sangrado.</li>
        </ul>
      </div>
    </div>
  )
}
