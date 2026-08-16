/**
 * Componente de visualización de metadata de curación del vademécum.
 * Muestra versión, curador, fechas y alerta si próxima revisión está cerca.
 * F4-03f-2
 */
import React from 'react'

const diasHasta = (fechaStr) => {
  if (!fechaStr) return null
  const fecha = new Date(fechaStr)
  const hoy = new Date()
  const diffMs = fecha - hoy
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export const MetadataCuracion = ({ metadata }) => {
  if (!metadata) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
        Metadata no disponible
      </div>
    )
  }

  const diasParaRevision = diasHasta(metadata.fecha_proxima_revision)
  const estaVencido = diasParaRevision !== null && diasParaRevision < 0
  const revisionCercana = diasParaRevision !== null && diasParaRevision >= 0 && diasParaRevision <= 30
  const revisionProxima = diasParaRevision !== null && diasParaRevision > 30 && diasParaRevision <= 90

  const badgeColor = estaVencido
    ? 'bg-red-100 text-red-800 border-red-300'
    : revisionCercana
    ? 'bg-red-50 text-red-700 border-red-200'
    : revisionProxima
    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
    : 'bg-green-50 text-green-700 border-green-200'

  const fuentes = Array.isArray(metadata.fuentes) ? metadata.fuentes : []

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-lg font-bold text-gray-900">Información de Curación Clínica</h3>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full border border-blue-300">
          {metadata.version || 'v1.0'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500 text-xs uppercase font-semibold">Curado por</p>
          <p className="text-gray-900 font-medium">{metadata.curado_por || 'No especificado'}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-semibold">Fecha de curación</p>
          <p className="text-gray-900 font-medium">{metadata.fecha_curacion || 'No especificada'}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-semibold">Total de fármacos</p>
          <p className="text-gray-900 font-medium">{metadata.total_farmacos || 0}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-semibold">Próxima revisión</p>
          <div className="flex items-center gap-2">
            <p className="text-gray-900 font-medium">{metadata.fecha_proxima_revision || 'No programada'}</p>
            {diasParaRevision !== null && (
              <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${badgeColor}`}>
                {estaVencido
                  ? `Vencida hace ${Math.abs(diasParaRevision)} días`
                  : diasParaRevision === 0
                  ? 'Hoy'
                  : `En ${diasParaRevision} días`}
              </span>
            )}
          </div>
        </div>
      </div>

      {fuentes.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Fuentes de referencia</p>
          <div className="flex flex-wrap gap-2">
            {fuentes.map((fuente, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200"
              >
                {fuente}
              </span>
            ))}
          </div>
        </div>
      )}

      {metadata.notas && (
        <div className="pt-3 border-t">
          <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Notas</p>
          <p className="text-gray-700 text-sm">{metadata.notas}</p>
        </div>
      )}

      {(estaVencido || revisionCercana) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          ⚠️ <strong>Atención:</strong> {estaVencido ? 'La revisión del vademécum está vencida.' : 'La revisión del vademécum está próxima.'} Contacte al curador clínico para actualizar.
        </div>
      )}
    </div>
  )
}
