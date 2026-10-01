import React, { memo, useState } from 'react'
import { Download } from 'lucide-react'
import { BOXES_DENTALES } from '../constants/agendaConstants'
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'

export const AgendaViewSelector = memo(({
  fechaSeleccionadaIso,
  setFechaSeleccionadaIso,
  boxFiltro,
  setBoxFiltro,
  doctorFiltro,
  setDoctorFiltro,
  doctoresDisponibles = [],
  vista = 'box',
  setVista,
  onExportarCSV,
  onBusquedaChange
}) => {
  // F7-27: Estado de búsqueda con debounce
  const [busquedaLocal, setBusquedaLocal] = useState('')

  const handleBusquedaChange = (e) => {
    const valor = e.target.value
    setBusquedaLocal(valor)
    if (onBusquedaChange) onBusquedaChange(valor)
  }

  const handleHoy = () => {
   setFechaSeleccionadaIso(obtenerFechaLocalISO())
  }

  return (
    <div className="bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] p-4 border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl flex justify-between items-center flex-wrap gap-3 text-xs print:hidden">
      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
        {/* F7-27: Búsqueda avanzada */}
        <input
          type="search"
          placeholder="Buscar paciente, RUT, tratamiento..."
          value={busquedaLocal}
          onChange={handleBusquedaChange}
          className="px-3 py-2 border rounded-xl bg-[#F8FAFC] dark:bg-[#070B14] surgical:bg-white border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] font-medium text-xs text-graphite-900 dark:text-graphite-50 surgical:text-black placeholder-graphite-400 min-w-[200px] focus:ring-2 focus:ring-clinical-info focus:border-transparent"
          aria-label="Buscar en agenda"
        />

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-600 dark:text-graphite-400 surgical:text-black">Fecha:</span>
          <input
            type="date"
            value={fechaSeleccionadaIso}
            onChange={(e) => setFechaSeleccionadaIso(e.target.value)}
            className="p-2 border rounded-xl bg-[#F8FAFC] dark:bg-[#070B14] surgical:bg-white border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] font-bold text-xs text-graphite-900 dark:text-graphite-50 surgical:text-black"
          />
          <button
            onClick={handleHoy}
            className="px-3 py-2 bg-[#F8FAFC] dark:bg-[#070B14] surgical:bg-white border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-graphite-800 text-gray-800 dark:text-graphite-100 surgical:text-black transition-colors duration-150"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
          <span className="font-semibold text-gray-600 dark:text-graphite-400 surgical:text-black">Sillón / Box:</span>
          <select
            value={boxFiltro}
            onChange={(e) => setBoxFiltro(e.target.value)}
            className="p-2 border rounded-xl bg-[#F8FAFC] dark:bg-[#070B14] surgical:bg-white border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] font-bold text-xs text-graphite-900 dark:text-graphite-50 surgical:text-black"
          >
            <option value="Todos">Todos los Boxes Sillones</option>
            {BOXES_DENTALES.map(b => (
              <option key={b.id} value={b.nombre}>{b.nombre}</option>
            ))}
          </select>
        </div>

        {doctoresDisponibles.length > 0 && setDoctorFiltro && (
          <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
            <span className="font-semibold text-gray-600 dark:text-graphite-400 surgical:text-black">Doctor:</span>
            <select
              value={doctorFiltro}
              onChange={(e) => setDoctorFiltro(e.target.value)}
              className="p-2 border rounded-xl bg-[#F8FAFC] dark:bg-[#070B14] surgical:bg-white border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] font-bold text-xs text-graphite-900 dark:text-graphite-50 surgical:text-black"
            >
              <option value="Todos">Todos los Odontólogos</option>
              {doctoresDisponibles.map(doc => (
                <option key={doc} value={doc}>{doc}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* F7-27: Selector de vista y botón exportar */}
      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-600 dark:text-graphite-400 surgical:text-black">Vista:</span>
          <select
            value={vista}
            onChange={(e) => setVista && setVista(e.target.value)}
            className="p-2 border rounded-xl bg-[#F8FAFC] dark:bg-[#070B14] surgical:bg-white border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] font-bold text-xs text-graphite-900 dark:text-graphite-50 surgical:text-black"
            aria-label="Seleccionar vista de agenda"
          >
            <option value="box">Por Box</option>
            <option value="lista">Lista</option>
            <option value="profesional">Por Profesional</option>
          </select>
        </div>

        {onExportarCSV && (
          <button
            type="button"
            onClick={onExportarCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#F8FAFC] dark:bg-[#070B14] surgical:bg-white border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-xl font-bold text-xs text-gray-800 dark:text-graphite-100 surgical:text-black hover:bg-gray-50 dark:hover:bg-graphite-800 transition-colors"
            aria-label="Exportar agenda a CSV"
          >
            <Download size={12} />
            Exportar
          </button>
        )}
      </div>
    </div>
  )
})

AgendaViewSelector.displayName = 'AgendaViewSelector'