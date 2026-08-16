/**
 * Tabla de protocolos de profilaxis antibiótica de endocarditis infecciosa.
 * Basado en AHA 2021 / ADA (Sección 2C del vademécum v1.1).
 * F4-03f-5c
 */
import React from 'react'

export const TablaProfilaxis = ({ protocolos, onEditar, onEliminar, onCrearNueva }) => {
  const datos = Array.isArray(protocolos) ? protocolos : []

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-cyan-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            💉 Profilaxis Antibiótica de Endocarditis Infecciosa
          </h3>
          {onCrearNueva && (
            <button
              onClick={onCrearNueva}
              className="px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-700"
            >
              + Nuevo protocolo
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {datos.length} protocolos AHA 2021 — Solo para pacientes con condiciones cardíacas de alto riesgo
        </p>
      </div>

      {/* Nota clínica sobre indicaciones */}
      <div className="px-6 py-3 border-b border-gray-200 bg-blue-50 text-sm text-blue-800">
        <strong>📋 Indicaciones:</strong> Solo para procedimientos que involucran manipulación de tejido gingival, región periapical o perforación de mucosa oral, en pacientes con:
        <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-700">
          <li>Válvula cardíaca protésica</li>
          <li>Antecedente de endocarditis infecciosa previa</li>
          <li>Cardiopatía congénita cianótica (reparada o no)</li>
          <li>Trasplante cardíaco con valvulopatía</li>
        </ul>
      </div>

      {/* Tabla */}
      {datos.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No hay protocolos registrados
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Situación clínica</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fármaco</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dosis adulto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dosis pediátrica</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nota</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {datos.map((protocolo, idx) => (
                <tr key={protocolo.id || idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[250px]">
                    {protocolo.situacion}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-semibold">
                    {protocolo.farmaco}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {protocolo.dosis_adulto}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {protocolo.dosis_pediatrica || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[300px]" title={protocolo.nota}>
                    {protocolo.nota || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      {onEditar && (
                        <button
                          onClick={() => onEditar(protocolo)}
                          className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100"
                        >
                          Editar
                        </button>
                      )}
                      {onEliminar && protocolo.activo !== false && (
                        <button
                          onClick={() => onEliminar(protocolo)}
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
      <div className="px-6 py-4 border-t border-gray-200 bg-cyan-50 text-sm text-cyan-800 space-y-2">
        <p><strong>📝 Notas clínicas importantes (AHA 2021):</strong></p>
        <ul className="list-disc list-inside space-y-1 text-cyan-700">
          <li><strong>Cefalosporinas (*):</strong> NO usar si el antecedente alérgico a penicilina fue anafilaxia, angioedema o urticaria inmediata (riesgo de reactividad cruzada). Preferir Azitromicina/Claritromicina o Doxiciclina.</li>
          <li><strong>Clindamicina:</strong> La actualización AHA 2021 retiró la recomendación como primera línea por asociación con mayor riesgo de colitis por <em>C. difficile</em>. Solo como última opción si no hay disponibilidad de alternativas.</li>
          <li><strong>Prótesis articulares:</strong> La evidencia actual (ADA/AAOS 2015) NO respalda profilaxis rutinaria en procedimientos dentales, salvo indicación puntual del cirujano ortopédico en casos de alto riesgo.</li>
          <li><strong>Timing:</strong> Administrar dosis única 30-60 minutos antes del procedimiento.</li>
        </ul>
      </div>
    </div>
  )
}
