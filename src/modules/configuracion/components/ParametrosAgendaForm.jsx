import React, { memo, useState } from 'react'
import { TRAMOS_DURACION } from '../constants/configuracionConstants'

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
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="border-b pb-3">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">📅 Parámetros de Agenda & Tramos Horarios</h3>
        <p className="text-gray-500 text-[11px]">Duración predeterminada de los bloques de atención y ventana de horarios.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Duración Bloque Cita</label>
          <select
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
          >
            {TRAMOS_DURACION.map(d => (
              <option key={d} value={d}>{d} Minutos por atención</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Hora Inicio Jornada</label>
          <input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Hora Término Jornada</label>
          <input
            type="time"
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
          />
        </div>
      </div>

      <div className="pt-2 text-right">
        <button
          type="submit"
          className="bg-black text-white font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
        >
          Guardar Parámetros Agenda
        </button>
      </div>
    </form>
  )
})

ParametrosAgendaForm.displayName = 'ParametrosAgendaForm'