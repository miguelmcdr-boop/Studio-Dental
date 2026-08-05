import React, { memo } from 'react'
import { DienteSVG } from '../../components/DienteSVG'
import {
  PERMANENTE_SUPERIOR,
  PERMANENTE_INFERIOR,
  TEMPORAL_SUPERIOR,
  TEMPORAL_INFERIOR,
  HERRAMIENTAS_ODONTOGRAMA
} from './constants/odontogramaConstants'
import { useOdontograma } from './hooks/useOdontograma'
import { CpodSummaryCard } from './components/CpodSummaryCard'

export const OdontogramaModulo = memo(({
  odontograma: odontogramaProp = {},
  odontogramaComparar = null,
  guardarOdontograma = () => {},
  esEvolucion = false
}) => {
  const {
    odontograma,
    tipoDenticion,
    setTipoDenticion,
    modoSeleccionado,
    setModoSeleccionado,
    piezaActiva,
    setPiezaActiva,
    modoComparativoSplit,
    setModoComparativoSplit,
    cpodStats,
    handleCaraClick,
    handleEstadoGeneral,
    handleLimpiarPieza,
    handleObservacionChange
  } = useOdontograma(odontogramaProp, guardarOdontograma)

  const piezasSuperiores = tipoDenticion === 'permanente' ? PERMANENTE_SUPERIOR : TEMPORAL_SUPERIOR
  const piezasInferiores = tipoDenticion === 'permanente' ? PERMANENTE_INFERIOR : TEMPORAL_INFERIOR

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Barra Superior */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3 print:hidden">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTipoDenticion('permanente')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
              tipoDenticion === 'permanente' ? 'bg-black text-white border-black shadow-xs' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            🦷 Permanente (11-48)
          </button>

          <button
            type="button"
            onClick={() => setTipoDenticion('temporal')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
              tipoDenticion === 'temporal' ? 'bg-black text-white border-black shadow-xs' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            🧸 Temporal (51-85)
          </button>
        </div>

        {odontogramaComparar && (
          <button
            type="button"
            onClick={() => setModoComparativoSplit(!modoComparativoSplit)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer shadow-xs ${
              modoComparativoSplit ? 'bg-purple-700 text-white border-purple-800' : 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100'
            }`}
          >
            🪞 {modoComparativoSplit ? 'Cerrar Vista Comparativa Split' : 'Ver Antes vs. Después (Split)'}
          </button>
        )}

        {esEvolucion && (
          <span className="bg-emerald-100 text-emerald-900 text-xs font-black px-3.5 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
            🟢 Modo Evolución (Tratamientos Realizados)
          </span>
        )}
      </div>

      {/* Tarjeta CPO-D */}
      <CpodSummaryCard cpodStats={cpodStats} />

      {/* Paleta de Herramientas Ampliada */}
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex flex-wrap gap-2.5 items-center text-xs print:hidden shadow-2xs">
        <span className="font-extrabold text-gray-600 uppercase mr-2 text-[11px] tracking-wider">Herramienta:</span>
        {HERRAMIENTAS_ODONTOGRAMA.map(h => (
          <button
            key={h.id}
            type="button"
            onClick={() => setModoSeleccionado(h.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              modoSeleccionado === h.id ? `${h.color} ring-2 ring-black shadow-xs` : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {h.label}
          </button>
        ))}

        <div className="h-5 w-px bg-gray-300 mx-2"></div>
        <button type="button" onClick={() => handleEstadoGeneral('implante')} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 cursor-pointer">Implante</button>
        <button type="button" onClick={() => handleEstadoGeneral('ausente')} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer">Ausente</button>
        <button type="button" onClick={() => handleEstadoGeneral('indicacion_exodoncia')} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-red-300 text-red-800 hover:bg-red-50 cursor-pointer">Exodoncia</button>
      </div>

      {/* Renderizado Gráfico Tamaño Holgado (Large View HD) */}
      <div className={`grid gap-6 ${modoComparativoSplit ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Odontograma Principal */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xs overflow-x-auto space-y-8">
          {modoComparativoSplit && (
            <h3 className="font-black text-xs text-gray-800 uppercase tracking-wider mb-2 text-center bg-gray-50 p-2.5 rounded-xl border">
              Odontograma Diagnóstico Actual
            </h3>
          )}

          <div>
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 text-center">Arcada Superior (Maxilar)</h3>
            <div className="flex justify-center gap-2.5 min-w-[700px] py-2">
              {piezasSuperiores.map(num => (
                <div key={num} className="scale-110 transform transition-transform hover:scale-125">
                  <DienteSVG numero={num} estadosPieza={odontograma[num]} modoSeleccionado={modoSeleccionado} alHacerClicCara={handleCaraClick} alSeleccionarPieza={setPiezaActiva} piezaActiva={piezaActiva} />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          <div>
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 text-center">Arcada Inferior (Mandíbula)</h3>
            <div className="flex justify-center gap-2.5 min-w-[700px] py-2">
              {piezasInferiores.map(num => (
                <div key={num} className="scale-110 transform transition-transform hover:scale-125">
                  <DienteSVG numero={num} estadosPieza={odontograma[num]} modoSeleccionado={modoSeleccionado} alHacerClicCara={handleCaraClick} alSeleccionarPieza={setPiezaActiva} piezaActiva={piezaActiva} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Odontograma Comparativo en Split */}
        {modoComparativoSplit && odontogramaComparar && (
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-3xl p-8 shadow-xs overflow-x-auto space-y-8">
            <h3 className="font-black text-xs text-emerald-900 uppercase tracking-wider mb-2 text-center bg-white p-2.5 rounded-xl border border-emerald-300">
              Odontograma Proyectado / Post-Tratamiento
            </h3>

            <div>
              <h3 className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest mb-4 text-center">Arcada Superior</h3>
              <div className="flex justify-center gap-2 min-w-[650px] py-2">
                {piezasSuperiores.map(num => (
                  <div key={num} className="scale-105">
                    <DienteSVG numero={num} estadosPieza={odontogramaComparar[num]} />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-emerald-200 my-6"></div>

            <div>
              <h3 className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest mb-4 text-center">Arcada Inferior</h3>
              <div className="flex justify-center gap-2 min-w-[650px] py-2">
                {piezasInferiores.map(num => (
                  <div key={num} className="scale-105">
                    <DienteSVG numero={num} estadosPieza={odontogramaComparar[num]} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Observaciones por Pieza */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs print:hidden">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-extrabold text-gray-900">Observación Clínica — Pieza Dental {piezaActiva}</h4>
          <button type="button" onClick={handleLimpiarPieza} className="text-xs text-red-600 font-bold hover:underline cursor-pointer">🧹 Limpiar Pieza</button>
        </div>
        <textarea
          rows="2"
          value={odontograma[piezaActiva]?.observacion || ''}
          onChange={(e) => handleObservacionChange(e.target.value)}
          placeholder="Añadir hallazgos u observaciones específicas para esta pieza dental..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-black font-medium"
        />
      </div>
    </div>
  )
})

OdontogramaModulo.displayName = 'OdontogramaModulo'