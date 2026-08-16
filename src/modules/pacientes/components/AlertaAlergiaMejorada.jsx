/**
 * Alerta mejorada de alergias cruzadas para RecetasSection.
 * Muestra información enriquecida: iconos, familia, alternativas seguras, nota clínica expandible.
 * F4-03h
 */
import React, { useState } from 'react'

const CONFIG_TIPO = {
  critica: {
    icono: '🔴',
    titulo: '¡ALERTA GRAVE!',
    subtitulo: 'Contraindicación absoluta',
    bg: 'bg-red-50',
    border: 'border-red-400',
    texto: 'text-red-900',
    badge: 'bg-red-600 text-white',
    badgeFam: 'bg-red-100 text-red-800 border-red-300',
    btnDetalle: 'text-red-700 hover:bg-red-100'
  },
  advertencia: {
    icono: '🟡',
    titulo: '¡Precaución!',
    subtitulo: 'Reactividad cruzada detectada',
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    texto: 'text-yellow-900',
    badge: 'bg-yellow-600 text-white',
    badgeFam: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    btnDetalle: 'text-yellow-700 hover:bg-yellow-100'
  },
  sin_datos: {
    icono: '🟠',
    titulo: 'Información incompleta',
    subtitulo: 'Alergias no registradas',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    texto: 'text-amber-900',
    badge: 'bg-amber-600 text-white',
    badgeFam: 'bg-amber-100 text-amber-800 border-amber-300',
    btnDetalle: 'text-amber-700 hover:bg-amber-100'
  }
}

const formatearFamilia = (familia) => {
  if (!familia) return ''
  return familia.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export const AlertaAlergiaMejorada = ({ alerta }) => {
  const [detallesExpandidos, setDetallesExpandidos] = useState(false)
  
  if (!alerta) return null
  
  const config = CONFIG_TIPO[alerta.tipo] || CONFIG_TIPO.sin_datos
  const tieneDetalles = alerta.notaClinica || alerta.porcentajeCruzado || alerta.familiaFarmaco

  return (
    <div data-testid="alerta-alergia" className={`p-4 rounded-xl border-2 mb-4 ${config.bg} ${config.border}`}>
      {/* Header con icono y título */}
      <div className="flex items-start gap-3 mb-2">
        <div className="text-3xl leading-none">{config.icono}</div>
        <div className="flex-1">
          <h5 className={`font-bold text-base ${config.texto}`}>
            {config.titulo}
          </h5>
          <p className={`text-xs font-medium ${config.texto} opacity-80`}>
            {config.subtitulo}
          </p>
        </div>
        {alerta.familiaFarmaco && (
          <span className={`px-2 py-1 text-[10px] font-bold rounded border ${config.badgeFam}`}>
            💊 {formatearFamilia(alerta.familiaFarmaco)}
          </span>
        )}
      </div>

      {/* Mensaje principal */}
      <p className={`text-sm font-semibold ${config.texto} mb-2`}>
        {alerta.mensaje}
      </p>

      {/* Sugerencia */}
      {alerta.sugerencia && (
        <p className={`text-xs ${config.texto} mb-3`}>
          <strong>💡 Sugerencia:</strong> {alerta.sugerencia}
        </p>
      )}

      {/* Alternativas seguras */}
      {alerta.alternativas && alerta.alternativas.length > 0 && alerta.tipo !== 'sin_datos' && (
        <div className="mt-3 pt-3 border-t border-black/10">
          <p className={`text-xs font-bold ${config.texto} mb-2`}>
            ✅ Alternativas seguras ({alerta.alternativas.length}):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {alerta.alternativas.map((alt, idx) => (
              <div
                key={idx}
                data-testid={`alerta-alternativa-${idx}`}
                className="bg-white/70 rounded-lg p-2 border border-white shadow-sm"
              >
                <p className="text-xs font-bold text-gray-900">{alt.nombre}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Familia: {alt.familia_legible}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección expandible de detalles */}
      {tieneDetalles && alerta.tipo !== 'sin_datos' && (
        <div className="mt-3">
          <button
            data-testid="alerta-btn-detalles"
            onClick={() => setDetallesExpandidos(!detallesExpandidos)}
            className={`text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded ${config.btnDetalle}`}
          >
            <span className={`transform transition-transform ${detallesExpandidos ? 'rotate-90' : ''}`}>
              ▶
            </span>
            {detallesExpandidos ? 'Ocultar' : 'Ver'} detalles de reactividad cruzada
          </button>
          
          {detallesExpandidos && (
            <div className="mt-2 p-3 bg-white/60 rounded-lg border border-black/10 space-y-2 text-xs">
              {alerta.familiaAlergia && (
                <div className="flex gap-2">
                  <span className="font-bold text-gray-700 min-w-[130px]">Alergia del paciente:</span>
                  <span className="text-gray-900">{formatearFamilia(alerta.familiaAlergia)}</span>
                </div>
              )}
              {alerta.familiaFarmaco && (
                <div className="flex gap-2">
                  <span className="font-bold text-gray-700 min-w-[130px]">Familia del fármaco:</span>
                  <span className="text-gray-900">{formatearFamilia(alerta.familiaFarmaco)}</span>
                </div>
              )}
              {alerta.porcentajeCruzado && (
                <div className="flex gap-2">
                  <span className="font-bold text-gray-700 min-w-[130px]">% reactividad cruzada:</span>
                  <span className="text-gray-900 font-semibold">{alerta.porcentajeCruzado}</span>
                </div>
              )}
              {alerta.notaClinica && (
                <div className="pt-2 border-t border-black/10">
                  <span className="font-bold text-gray-700 block mb-1">📝 Nota clínica:</span>
                  <p className="text-gray-800 leading-relaxed">{alerta.notaClinica}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
