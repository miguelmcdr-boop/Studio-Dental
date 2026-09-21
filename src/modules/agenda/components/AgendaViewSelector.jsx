import React, { memo } from 'react'
import { BOXES_DENTALES } from '../constants/agendaConstants'
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'

export const AgendaViewSelector = memo(({
  fechaSeleccionadaIso,
  setFechaSeleccionadaIso,
  boxFiltro,
  setBoxFiltro,
  doctorFiltro,
  setDoctorFiltro,
  doctoresDisponibles = []
}) => {
  const handleHoy = () => {
   setFechaSeleccionadaIso(obtenerFechaLocalISO())
  }

  return (
    <div className="bg-gray-50 dark:bg-graphite-800 p-4 border border-gray-200 dark:border-graphite-700 rounded-2xl flex justify-between items-center flex-wrap gap-3 text-xs print:hidden">
      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-600 dark:text-graphite-400">Fecha:</span>
          <input
            type="date"
            value={fechaSeleccionadaIso}
            onChange={(e) => setFechaSeleccionadaIso(e.target.value)}
            className="p-2 border rounded-xl bg-white dark:bg-graphite-800 font-bold text-xs"
          />
          <button
            onClick={handleHoy}
            className="px-3 py-2 bg-white dark:bg-graphite-800 border border-gray-300 dark:border-graphite-600 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-graphite-700 text-gray-800 dark:text-graphite-100 transition-colors duration-150"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
          <span className="font-semibold text-gray-600 dark:text-graphite-400">Sillón / Box:</span>
          <select
            value={boxFiltro}
            onChange={(e) => setBoxFiltro(e.target.value)}
            className="p-2 border rounded-xl bg-white dark:bg-graphite-800 font-bold text-xs"
          >
            <option value="Todos">Todos los Boxes Sillones</option>
            {BOXES_DENTALES.map(b => (
              <option key={b.id} value={b.nombre}>{b.nombre}</option>
            ))}
          </select>
        </div>

        {doctoresDisponibles.length > 0 && setDoctorFiltro && (
          <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
            <span className="font-semibold text-gray-600 dark:text-graphite-400">Doctor:</span>
            <select
              value={doctorFiltro}
              onChange={(e) => setDoctorFiltro(e.target.value)}
              className="p-2 border rounded-xl bg-white dark:bg-graphite-800 font-bold text-xs"
            >
              <option value="Todos">Todos los Odontólogos</option>
              {doctoresDisponibles.map(doc => (
                <option key={doc} value={doc}>{doc}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
})

AgendaViewSelector.displayName = 'AgendaViewSelector'