/**
 * AgendaListView — F7-27
 *
 * Vista de lista de citas del día en formato tabla.
 * Alternativa a la vista por boxes para ver todas las citas juntas.
 *
 * Características:
 * - Tabla con columnas: Hora, Paciente, Box, Doctor, Estado, Acciones
 * - Ordenamiento por columna (click en header)
 * - Filtros: Estado, Box, Doctor
 * - Paginación si > 20 citas
 */
import React, { memo, useMemo, useState } from 'react'
import { Calendar, Clock, User, MapPin, Stethoscope, CheckCircle, XCircle, ArrowUp, ArrowDown } from 'lucide-react'

const ESTADO_STYLES = {
  'Agendada': 'bg-clinical-info/10 dark:bg-sky-400/15 text-clinical-info dark:text-sky-300',
  'EnEspera': 'bg-clinical-warning/10 dark:bg-amber-400/15 text-clinical-warning dark:text-amber-300',
  'En Espera': 'bg-clinical-warning/10 dark:bg-amber-400/15 text-clinical-warning dark:text-amber-300',
  'EnAtencion': 'bg-clinical-success/10 dark:bg-emerald-400/15 text-clinical-success dark:text-emerald-300',
  'En Atención': 'bg-clinical-success/10 dark:bg-emerald-400/15 text-clinical-success dark:text-emerald-300',
  'Completado': 'bg-graphite-100 dark:bg-graphite-700 text-graphite-600 dark:text-graphite-300',
  'Atendido': 'bg-graphite-100 dark:bg-graphite-700 text-graphite-600 dark:text-graphite-300',
  'Cancelada': 'bg-clinical-error/10 dark:bg-red-400/15 text-clinical-error dark:text-red-300',
}

const COLUMNS = [
  { key: 'horaInicio', label: 'Hora', icon: Clock },
  { key: 'pacienteNombre', label: 'Paciente', icon: User },
  { key: 'boxAsignado', label: 'Box', icon: MapPin },
  { key: 'doctor', label: 'Doctor', icon: Stethoscope },
  { key: 'estado', label: 'Estado', icon: CheckCircle },
]

export const AgendaListView = memo(({ citas = [], alVerFichaPaciente, alCambiarEstadoCita }) => {
  const [sortColumn, setSortColumn] = useState('horaInicio')
  const [sortDirection, setSortDirection] = useState('asc')
  const [pagina, setPagina] = useState(1)
  const citasPorPagina = 20

  const citasOrdenadas = useMemo(() => {
    const ordenadas = [...citas].sort((a, b) => {
      let valA = a[sortColumn] || ''
      let valB = b[sortColumn] || ''

      if (typeof valA === 'string') valA = valA.toLowerCase()
      if (typeof valB === 'string') valB = valB.toLowerCase()

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return ordenadas
  }, [citas, sortColumn, sortDirection])

  const totalPaginas = Math.ceil(citasOrdenadas.length / citasPorPagina)
  const citasPagina = citasOrdenadas.slice((pagina - 1) * citasPorPagina, pagina * citasPorPagina)

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  if (!citas || citas.length === 0) {
    return (
      <div className="bg-white dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 rounded-2xl p-12 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-graphite-100 dark:bg-graphite-700 text-graphite-400 dark:text-graphite-300 mb-3">
          <Calendar size={28} />
        </div>
        <h4 className="text-sm font-bold text-graphite-800 dark:text-graphite-100 mb-1">
          Sin citas para la fecha seleccionada
        </h4>
        <p className="text-xs text-graphite-500 dark:text-graphite-400">
          Agenda una nueva cita o selecciona otra fecha.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 rounded-2xl p-4 overflow-x-auto" role="region" aria-label="Lista de citas del día">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-graphite-900 dark:text-graphite-50 flex items-center gap-2">
          <Calendar size={16} />
          Lista de Citas del Día ({citas.length})
        </h3>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-graphite-200 dark:border-graphite-700">
            {COLUMNS.map((col) => {
              const Icono = col.icon
              return (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-2 text-left font-semibold text-graphite-600 dark:text-graphite-400 cursor-pointer hover:bg-graphite-50 dark:hover:bg-graphite-700/50 transition-colors"
                  aria-sort={sortColumn === col.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <span className="inline-flex items-center gap-1">
                    <Icono size={12} />
                    {col.label}
                    {sortColumn === col.key && (
                      sortDirection === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                    )}
                  </span>
                </th>
              )
            })}
            <th className="px-3 py-2 text-right font-semibold text-graphite-600 dark:text-graphite-400">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {citasPagina.map((cita) => {
            const estiloEstado = ESTADO_STYLES[cita.estado] || ESTADO_STYLES['Agendada']
            return (
              <tr key={cita.id} className="border-b border-graphite-100 dark:border-graphite-700/50 hover:bg-graphite-50 dark:hover:bg-graphite-700/30 transition-colors">
                <td className="px-3 py-2 font-semibold text-graphite-900 dark:text-graphite-50">
                  {cita.horaInicio}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => alVerFichaPaciente && alVerFichaPaciente(cita)}
                    className="text-left font-medium text-graphite-800 dark:text-graphite-100 hover:text-clinical-info dark:hover:text-sky-300 transition-colors cursor-pointer"
                  >
                    {cita.pacienteNombre || 'Sin nombre'}
                  </button>
                </td>
                <td className="px-3 py-2 text-graphite-600 dark:text-graphite-400">
                  {cita.boxAsignado || '—'}
                </td>
                <td className="px-3 py-2 text-graphite-600 dark:text-graphite-400">
                  {cita.doctor || '—'}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${estiloEstado}`}>
                    {cita.estado}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    {cita.estado === 'Agendada' && (
                      <button
                        type="button"
                        onClick={() => alCambiarEstadoCita && alCambiarEstadoCita(cita.id, 'EnEspera')}
                        className="p-1 rounded hover:bg-graphite-100 dark:hover:bg-graphite-700 text-graphite-500 hover:text-clinical-warning transition-colors"
                        aria-label="Marcar como en espera"
                      >
                        <Clock size={12} />
                      </button>
                    )}
                    {(cita.estado === 'EnEspera' || cita.estado === 'En Espera') && (
                      <button
                        type="button"
                        onClick={() => alCambiarEstadoCita && alCambiarEstadoCita(cita.id, 'EnAtencion')}
                        className="p-1 rounded hover:bg-graphite-100 dark:hover:bg-graphite-700 text-graphite-500 hover:text-clinical-success transition-colors"
                        aria-label="Marcar como en atención"
                      >
                        <CheckCircle size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-graphite-200 dark:border-graphite-700">
          <span className="text-[10px] text-graphite-500 dark:text-graphite-400">
            Página {pagina} de {totalPaginas}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPagina(Math.max(1, pagina - 1))}
              disabled={pagina === 1}
              className="px-2 py-1 text-[10px] font-semibold rounded border border-graphite-200 dark:border-graphite-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-graphite-50 dark:hover:bg-graphite-700 transition-colors"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
              disabled={pagina === totalPaginas}
              className="px-2 py-1 text-[10px] font-semibold rounded border border-graphite-200 dark:border-graphite-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-graphite-50 dark:hover:bg-graphite-700 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

AgendaListView.displayName = 'AgendaListView'
