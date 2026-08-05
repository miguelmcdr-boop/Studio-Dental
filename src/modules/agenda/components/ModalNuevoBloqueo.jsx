import React, { memo, useState } from 'react'
import { TIPOS_BLOQUEO_AGENDA, SILLONES_DENTALES } from '../constants/agendaConstants'

export const ModalNuevoBloqueo = memo(({ fechaPredeterminada, alGuardar, alCerrar }) => {
  const [form, setForm] = useState({
    motivoBloqueo: '🍱 Horario de Almuerzo',
    fecha: fechaPredeterminada || new Date().toISOString().split('T')[0],
    horaInicio: '13:00',
    horaFin: '14:00',
    boxAsignado: 'Todos los Boxes',
    observaciones: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (form.horaInicio >= form.horaFin) {
      alert('⚠️ La hora de fin debe ser posterior a la hora de inicio.')
      return
    }

    alGuardar({
      id: Date.now(),
      esBloqueo: true,
      fecha: form.fecha,
      motivoBloqueo: form.motivoBloqueo,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      boxAsignado: form.boxAsignado,
      observaciones: form.observaciones,
      estado: 'Bloqueado'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-gray-100">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h3 className="font-black text-sm text-gray-900 flex items-center gap-2 uppercase tracking-tight">
              <span>⛔</span> Añadir Bloqueo / Mantenimiento
            </h3>
            <p className="text-[11px] text-gray-500">Reserva franjas horarias no disponibles para atención.</p>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-sm flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-extrabold text-gray-700 block mb-1">Motivo del Bloqueo</label>
            <select
              value={form.motivoBloqueo}
              onChange={(e) => setForm({ ...form, motivoBloqueo: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-300 font-bold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
            >
              {TIPOS_BLOQUEO_AGENDA.map(b => (
                <option key={b.id} value={b.label}>{b.label}</option>
              ))}
              <option value="🛠️ Mantenimiento Técnico">🛠️ Mantenimiento Técnico de Box</option>
              <option value="🎓 Capacitación / Evento">🎓 Capacitación / Evento Clínico</option>
              <option value="🚨 Ausencia / Urgencia">🚨 Ausencia del Profesional</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold text-gray-700 block mb-1">Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-gray-50 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="font-extrabold text-gray-700 block mb-1">Box / Sillón</label>
              <select
                value={form.boxAsignado}
                onChange={(e) => setForm({ ...form, boxAsignado: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-gray-50 focus:bg-white"
              >
                <option value="Todos los Boxes">🏢 Todos los Boxes</option>
                {SILLONES_DENTALES.map(s => (
                  <option key={s.id} value={s.nombre}>🪑 {s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold text-gray-700 block mb-1">Hora Inicio</label>
              <input
                type="time"
                value={form.horaInicio}
                onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-gray-50 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="font-extrabold text-gray-700 block mb-1">Hora Fin</label>
              <input
                type="time"
                value={form.horaFin}
                onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-gray-50 focus:bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-extrabold text-gray-700 block mb-1">Notas / Observaciones (Opcional)</label>
            <input
              type="text"
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              placeholder="Ej. Revisión anual de compresor dental"
              className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-gray-50 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={alCerrar}
              className="px-4 py-2.5 rounded-xl text-gray-600 font-extrabold hover:bg-gray-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
              ⛔ Bloquear Horario
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalNuevoBloqueo.displayName = 'ModalNuevoBloqueo'