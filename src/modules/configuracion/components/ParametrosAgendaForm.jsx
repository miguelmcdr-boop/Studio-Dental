import React, { memo, useState } from 'react'
import { TRAMOS_DURACION } from '../constants/configuracionConstants'
import { Calendar } from 'lucide-react'

export const ParametrosAgendaForm = memo(({ parametrosAgenda, alGuardar }) => {
  const [duracion, setDuracion] = useState(parametrosAgenda?.duracionBloqueMinutos || 30)
  const [horaInicio, setHoraInicio] = useState(parametrosAgenda?.horaInicio || '08:30')
  const [horaFin, setHoraFin] = useState(parametrosAgenda?.horaFin || '19:30')

  const handleSubmit = (e) => {
    e.preventDefault()
    alGuardar({
      ...parametrosAgenda,
      duracionBloqueMinutos: parseInt(duracion),
      horaInicio,
      horaFin
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] pb-3">
        <h3 className="font-bold text-sm text-gray-900 dark:text-graphite-50 surgical:text-black uppercase tracking-wider inline-flex items-center gap-2"><Calendar size={14} />Parámetros de Agenda & Tramos Horarios</h3>
        <p className="text-gray-500 dark:text-graphite-400 text-[11px]">Duración predeterminada de los bloques de atención y ventana de horarios.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Duración Bloque Cita</label>
          <select
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-graphite-900 dark:text-graphite-50 surgical:text-black font-bold focus:outline-none focus:ring-2 focus:ring-[#B88E3A]/40"
          >
            {TRAMOS_DURACION.map(d => (
              <option key={d} value={d}>{d} Minutos por atención</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Hora Inicio Jornada</label>
          <input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-graphite-900 dark:text-graphite-50 surgical:text-black font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#B88E3A]/40"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 dark:text-graphite-300 surgical:text-black mb-1">Hora Término Jornada</label>
          <input
            type="time"
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] bg-white dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-graphite-900 dark:text-graphite-50 surgical:text-black font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#B88E3A]/40"
          />
        </div>
      </div>

      <div className="pt-2 text-right">
        <button
          type="submit"
          className="bg-[#B88E3A] hover:bg-[#99732B] dark:bg-[#E5C378] dark:hover:bg-[#B88E3A] text-white dark:text-graphite-950 font-bold px-5 py-2.5 rounded-lg transition-micro shadow-xs cursor-pointer"
        >
          Guardar Parámetros Agenda
        </button>
      </div>
    </form>
  )
})

ParametrosAgendaForm.displayName = 'ParametrosAgendaForm'