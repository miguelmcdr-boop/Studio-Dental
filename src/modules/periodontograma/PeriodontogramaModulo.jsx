import React, { memo, useState } from 'react'
import { usePeriodontograma } from './hooks/usePeriodontograma'
import { HeaderPeriodontal } from './components/HeaderPeriodontal'
import { ArcadaSuperior } from './components/ArcadaSuperior'
import { ArcadaInferior } from './components/ArcadaInferior'

export const PeriodontogramaModulo = memo(({ pacienteId }) => {
  const {
    datosPeriodontales,
    metricas,
    resumenClinico,
    historialControles,
    controlActivoId,
    setControlActivoId,
    crearNuevoControl,
    actualizarSondaje,
    actualizarRecesion,
    toggleFlagSitio,
    actualizarAtributoGlobalPieza,
    togglePiezaAusente,
    togglePiezaImplante
  } = usePeriodontograma(pacienteId)

  const [mostrarModalNuevoControl, setMostrarModalNuevoControl] = useState(false)
  const [nuevaObservacionControl, setNuevaObservacionControl] = useState('')

  const handleGuardarNuevoControl = (e) => {
    e.preventDefault()
    crearNuevoControl(nuevaObservacionControl)
    setNuevaObservacionControl('')
    setMostrarModalNuevoControl(false)
  }

  return (
    <div className="space-y-6 text-xs">
      {/* Selector de Historial de Controles Periodontales */}
      <div className="bg-gray-100 border border-gray-200 p-3 rounded-2xl flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="font-bold text-gray-600 uppercase text-[10px]">Controles Periodontales:</span>
          {historialControles.map(ctrl => (
            <button
              key={ctrl.id}
              onClick={() => setControlActivoId(ctrl.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                controlActivoId === ctrl.id ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              📅 {ctrl.fecha} — {ctrl.observacion}
            </button>
          ))}
        </div>

        <button
          onClick={() => setMostrarModalNuevoControl(true)}
          className="bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>➕</span> Nuevo Control
        </button>
      </div>

      {/* Encabezado y Métricas */}
      <HeaderPeriodontal metricas={metricas} resumenClinico={resumenClinico} />

      {/* Grid de Arcadas */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-8 overflow-x-auto">
        <ArcadaSuperior
          datosPeriodontales={datosPeriodontales}
          onSondajeChange={actualizarSondaje}
          onRecesionChange={actualizarRecesion}
          onFlagToggle={toggleFlagSitio}
          onAtributoChange={actualizarAtributoGlobalPieza}
          onAusenteToggle={togglePiezaAusente}
          onImplanteToggle={togglePiezaImplante}
        />

        <ArcadaInferior
          datosPeriodontales={datosPeriodontales}
          onSondajeChange={actualizarSondaje}
          onRecesionChange={actualizarRecesion}
          onFlagToggle={toggleFlagSitio}
          onAtributoChange={actualizarAtributoGlobalPieza}
          onAusenteToggle={togglePiezaAusente}
          onImplanteToggle={togglePiezaImplante}
        />
      </div>

      {/* Modal Crear Nuevo Control Periodontal */}
      {mostrarModalNuevoControl && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-gray-200 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-gray-900 border-b pb-2">Añadir Nuevo Control Periodontal</h3>
            <form onSubmit={handleGuardarNuevoControl} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Descripción / Tipo de Control</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Reevaluación a los 45 días, Mantenimiento..."
                  value={nuevaObservacionControl}
                  onChange={(e) => setNuevaObservacionControl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevoControl(false)}
                  className="w-1/2 py-2 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-black text-white font-bold py-2 rounded-xl hover:bg-gray-800"
                >
                  Crear Control
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
})

PeriodontogramaModulo.displayName = 'PeriodontogramaModulo'