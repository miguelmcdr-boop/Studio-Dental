import React, { memo, useState } from 'react'
import { TIPOS_BLOQUEO_AGENDA } from '../constants/agendaConstants'

export const ModalNuevoBloqueo = memo(({ alGuardar, alCerrar }) => {
  const [form, setForm] = useState({
    motivoBloqueo: '🍱 Horario de Almuerzo',
    horaInicio: '13:00',
    horaFin: '14:00',
    boxAsignado: 'Todos los Boxes',
    observacion: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    alGuardar({
      ...form,
      id: Date.now(),
      esBloqueo: true
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
            <span>⛔</span> Añadir Bloqueo / Mantenimiento de Agenda
          </h3>
          <button type="button" onClick={alCerrar} className="text-gray-400 hover:text-black font-black text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Motivo del Bloqueo</label>
            <select
              value={form.motivoBloqueo}
              onChange={(e) => setForm({ ...form, motivoBloqueo: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-bold focus:outline-none focus:border-black"
            >
              {TIPOS_BLOQUEO_AGENDA.map(b => (
                <option key={b.id} value={b.label}>{b.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Hora Inicio</label>
              <input
                type="time"
                value={form.horaInicio}
                onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Hora Fin</label>
              <input
                type="time"
                value={form.horaFin}
                onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Box / Sillón Afectado</label>
            <select
              value={form.boxAsignado}
              onChange={(e) => setForm({ ...form, boxAsignado: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
            >
              <option value="Todos los Boxes">Todos los Boxes</option>
              <option value="Sillón 1 - Odontología General">Sillón 1 - Odontología General</option>
              <option value="Sillón 2 - Higiene & Ortodoncia">Sillón 2 - Higiene & Ortodoncia</option>
              <option value="Box 3 - Quirúrgico & Implantes">Box 3 - Quirúrgico & Implantes</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={alCerrar} className="px-4 py-2 rounded-xl text-gray-600 font-bold hover:bg-gray-100">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-black text-white font-black hover:bg-gray-800">
              Guardar Bloqueo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalNuevoBloqueo.displayName = 'ModalNuevoBloqueo'