import React, { memo, useState } from 'react'
import { BOXES_SILLONES, HORARIOS_JORNADA } from '../constants/agendaConstants'

export const ModalNuevaCita = memo(({ pacientes = [], fechaDefecto, alGuardar, alCerrar }) => {
  const [pacienteId, setPacienteId] = useState('')
  const [fecha, setFecha] = useState(fechaDefecto)
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [horaFin, setHoraFin] = useState('09:30')
  const [box, setBox] = useState(BOXES_SILLONES[0])
  const [motivo, setMotivo] = useState('')
  const [observacion, setObservacion] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!pacienteId) {
      alert('Selecciona un paciente para agendar.')
      return
    }

    const pac = pacientes.find(p => p.id === parseInt(pacienteId) || p.id === pacienteId)

    const nuevaCitaObj = {
      id: Date.now(),
      pacienteId: pac?.id,
      pacienteNombre: pac?.nombre || 'Paciente',
      pacienteRut: pac?.rut || 'N/I',
      telefono: pac?.telefono || '',
      fecha,
      horaInicio,
      horaFin,
      box,
      motivo,
      observacion,
      estado: 'Confirmada'
    }

    alGuardar(nuevaCitaObj)
    alCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-gray-200 shadow-xl space-y-4 text-xs">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-base font-bold text-gray-900">Agendar Nueva Cita Médica</h3>
          <button onClick={alCerrar} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Seleccionar Paciente</label>
            <select
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
            >
              <option value="">-- Buscar paciente de la lista --</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.rut})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full p-2 rounded-xl border border-gray-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Hora Inicio</label>
              <select
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full p-2 rounded-xl border border-gray-300 bg-white"
              >
                {HORARIOS_JORNADA.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Hora Fin</label>
              <select
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full p-2 rounded-xl border border-gray-300 bg-white"
              >
                {HORARIOS_JORNADA.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Sillón / Box Dental</label>
            <select
              value={box}
              onChange={(e) => setBox(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-semibold"
            >
              {BOXES_SILLONES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Motivo de la Cita</label>
            <input
              type="text"
              placeholder="Ej: Evaluación, Limpieza, Exodoncia, Control..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Observaciones Opcionales</label>
            <textarea
              rows="2"
              placeholder="Notas internas para el box..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300"
            />
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={alCerrar}
              className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 bg-black text-white py-2.5 rounded-xl font-bold hover:bg-gray-800"
            >
              Confirmar Agendamiento
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalNuevaCita.displayName = 'ModalNuevaCita'