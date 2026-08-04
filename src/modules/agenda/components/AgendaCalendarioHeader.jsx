import React, { memo } from 'react'
import { BOXES_SILLONES } from '../constants/agendaConstants'

export const AgendaCalendarioHeader = memo(({
  fechaSeleccionada,
  setFechaSeleccionada,
  boxFiltro,
  setBoxFiltro,
  busquedaPaciente,
  setBusquedaPaciente,
  onAbrirModalNuevaCita
}) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 text-xs">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">
            📅 Agenda Clínica de Citas
          </h3>
          <p className="text-gray-500 text-[11px]">Gestión de atención por box y profesional.</p>
        </div>

        <button
          onClick={onAbrirModalNuevaCita}
          className="bg-black text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 transition-all cursor-pointer"
        >
          + Agendar Nueva Cita
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-200">
        <div>
          <label className="block font-semibold text-gray-600 mb-1">Fecha de Atención</label>
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="w-full p-2 rounded-xl border border-gray-300 bg-white font-bold"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-600 mb-1">Filtrar por Box / Sillón</label>
          <select
            value={boxFiltro}
            onChange={(e) => setBoxFiltro(e.target.value)}
            className="w-full p-2 rounded-xl border border-gray-300 bg-white font-semibold"
          >
            <option value="Todos">Todos los Boxes</option>
            {BOXES_SILLONES.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-gray-600 mb-1">Buscar Paciente (Nombre/RUT)</label>
          <input
            type="text"
            placeholder="Escribe para filtrar..."
            value={busquedaPaciente}
            onChange={(e) => setBusquedaPaciente(e.target.value)}
            className="w-full p-2 rounded-xl border border-gray-300 bg-white"
          />
        </div>
      </div>
    </div>
  )
})

AgendaCalendarioHeader.displayName = 'AgendaCalendarioHeader'