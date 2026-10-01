/**
 * AgendaProfesionalView — F7-27
 *
 * Vista de agenda agrupada por doctor/profesional.
 * Alternativa a la vista por boxes cuando un doctor atiende en múltiples boxes.
 *
 * Características:
 * - Columnas: una por doctor
 * - Cada columna muestra las citas de ese doctor ordenadas por hora
 * - Similar a vista por box pero con doctores como columnas
 */
import React, { memo, useMemo } from 'react'
import { Calendar, Clock, User, MapPin } from 'lucide-react'

const ESTADO_STYLES = {
  'Agendada': 'border-l-clinical-info bg-clinical-info/5 dark:bg-sky-400/10',
  'EnEspera': 'border-l-clinical-warning bg-clinical-warning/5 dark:bg-amber-400/10',
  'En Espera': 'border-l-clinical-warning bg-clinical-warning/5 dark:bg-amber-400/10',
  'EnAtencion': 'border-l-clinical-success bg-clinical-success/5 dark:bg-emerald-400/10',
  'En Atención': 'border-l-clinical-success bg-clinical-success/5 dark:bg-emerald-400/10',
  'Completado': 'border-l-graphite-400 bg-graphite-50 dark:bg-graphite-700/30',
  'Atendido': 'border-l-graphite-400 bg-graphite-50 dark:bg-graphite-700/30',
  'Cancelada': 'border-l-clinical-error bg-clinical-error/5 dark:bg-red-400/10 opacity-60',
}

export const AgendaProfesionalView = memo(({ citas = [], doctoresDisponibles = [], alVerFichaPaciente }) => {
  const citasPorDoctor = useMemo(() => {
    const agrupadas = {}

    // Inicializar con todos los doctores disponibles
    doctoresDisponibles.forEach((doc) => {
      agrupadas[doc.nombre] = []
    })

    // Agrupar citas por doctor
    citas.forEach((cita) => {
      const doctor = cita.doctor || 'Sin asignar'
      if (!agrupadas[doctor]) {
        agrupadas[doctor] = []
      }
      agrupadas[doctor].push(cita)
    })

    // Ordenar citas de cada doctor por hora
    Object.keys(agrupadas).forEach((doctor) => {
      agrupadas[doctor].sort((a, b) => (a.horaInicio || '').localeCompare(b.horaInicio || ''))
    })

    return agrupadas
  }, [citas, doctoresDisponibles])

  const doctoresConCitas = Object.keys(citasPorDoctor).filter((doc) => citasPorDoctor[doc].length > 0)

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
    <div className="bg-white dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 rounded-2xl p-4" role="region" aria-label="Agenda por profesional">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-graphite-900 dark:text-graphite-50 flex items-center gap-2">
          <User size={16} />
          Agenda por Profesional ({doctoresConCitas.length} doctores activos)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctoresConCitas.map((doctor) => (
          <div key={doctor} className="border border-graphite-200 dark:border-graphite-700 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-graphite-200 dark:border-graphite-700">
              <User size={14} className="text-graphite-500 dark:text-graphite-400" />
              <h4 className="text-xs font-bold text-graphite-900 dark:text-graphite-50">
                {doctor}
              </h4>
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-graphite-100 dark:bg-graphite-700 text-graphite-600 dark:text-graphite-300">
                {citasPorDoctor[doctor].length} cita{citasPorDoctor[doctor].length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="space-y-2">
              {citasPorDoctor[doctor].map((cita) => {
                const estiloEstado = ESTADO_STYLES[cita.estado] || ESTADO_STYLES['Agendada']
                return (
                  <button
                    key={cita.id}
                    type="button"
                    onClick={() => alVerFichaPaciente && alVerFichaPaciente(cita)}
                    className={`w-full text-left p-2.5 rounded-lg border-l-4 ${estiloEstado} hover:shadow-sm transition-all cursor-pointer`}
                    aria-label={`Cita de ${cita.pacienteNombre || 'paciente'} a las ${cita.horaInicio}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-graphite-900 dark:text-graphite-50 flex items-center gap-1">
                        <Clock size={10} />
                        {cita.horaInicio}
                      </span>
                      <span className="text-[10px] text-graphite-500 dark:text-graphite-400 flex items-center gap-1">
                        <MapPin size={10} />
                        {cita.boxAsignado || 'Sin box'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-graphite-800 dark:text-graphite-100 truncate">
                      {cita.pacienteNombre || 'Sin nombre'}
                    </p>
                    {cita.trataMiento && (
                      <p className="text-[10px] text-graphite-500 dark:text-graphite-400 truncate mt-0.5">
                        {cita.trataMiento}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

AgendaProfesionalView.displayName = 'AgendaProfesionalView'
