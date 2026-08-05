import React, { memo, useState } from 'react'
import { SILLONES_DENTALES } from '../constants/agendaConstants'

export const ModalNuevaCita = memo(({ pacientes = [], fechaPredeterminada, alGuardar, alCerrar }) => {
  const [esPacienteExpress, setEsPacienteExpress] = useState(true)
  const [pacienteId, setPacienteId] = useState('')
  const [pacienteNombre, setPacienteNombre] = useState('')
  const [pacienteTelefono, setPacienteTelefono] = useState('')
  const [tratamiento, setTratamiento] = useState('Evaluación / Diagnóstico')
  const [boxAsignado, setBoxAsignado] = useState(SILLONES_DENTALES[0]?.nombre || 'Sillón 1 - Odontología General')
  const [fecha, setFecha] = useState(fechaPredeterminada || new Date().toISOString().split('T')[0])
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [duracionMinutos, setDuracionMinutos] = useState(30)
  const [observaciones, setObservaciones] = useState('')

  const handleSeleccionarPacienteRegistrado = (id) => {
    setPacienteId(id)
    const seleccionado = pacientes.find(p => String(p.id) === String(id))
    if (seleccionado) {
      const nombreFull = `${seleccionado.nombre || ''} ${seleccionado.apellido || ''}`.trim()
      setPacienteNombre(nombreFull || seleccionado.nombreCompleto || '')
      setPacienteTelefono(seleccionado.telefono || '')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!pacienteNombre.trim()) {
      alert('⚠️ Por favor ingresa el nombre del paciente.')
      return
    }

    const [h, m] = horaInicio.split(':').map(Number)
    const inicioMin = h * 60 + m
    const finMin = inicioMin + parseInt(duracionMinutos, 10)
    const hFin = String(Math.floor(finMin / 60)).padStart(2, '0')
    const mFin = String(finMin % 60).padStart(2, '0')
    const horaFin = `${hFin}:${mFin}`

    alGuardar({
      id: Date.now(),
      pacienteId: pacienteId || `express_${Date.now()}`,
      pacienteNombre,
      pacienteTelefono,
      trataMiento: tratamiento,
      boxAsignado,
      fecha,
      horaInicio,
      horaFin,
      duracionMinutos: parseInt(duracionMinutos, 10),
      observaciones,
      estado: 'Agendado'
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
            <span>📅</span> Agendar Cita
          </h3>
          <button type="button" onClick={alCerrar} className="text-gray-400 hover:text-black font-black text-lg">✕</button>
        </div>

        {/* Toggle Paciente Registrado vs Paciente Express */}
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => { setEsPacienteExpress(true); setPacienteId(''); setPacienteNombre(''); setPacienteTelefono('') }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              esPacienteExpress ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
            }`}
          >
            ⚡ Paciente Express (Rápido)
          </button>
          <button
            type="button"
            onClick={() => setEsPacienteExpress(false)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !esPacienteExpress ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
            }`}
          >
            👤 Buscar Paciente Ficha ({pacientes.length})
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {!esPacienteExpress && (
            <div>
              <label className="font-bold text-gray-700 block mb-1">Buscar Paciente Registrado</label>
              <select
                value={pacienteId}
                onChange={(e) => handleSeleccionarPacienteRegistrado(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-gray-50 focus:outline-none focus:border-black"
              >
                <option value="">-- Seleccionar Paciente --</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>
                    👤 {p.nombre || p.nombreCompleto} {p.apellido || ''} {p.rut ? `(${p.rut})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Nombre Completo</label>
              <input
                type="text"
                value={pacienteNombre}
                onChange={(e) => setPacienteNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Teléfono / WhatsApp</label>
              <input
                type="text"
                value={pacienteTelefono}
                onChange={(e) => setPacienteTelefono(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Sillón / Box Dental</label>
              <select
                value={boxAsignado}
                onChange={(e) => setBoxAsignado(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
              >
                {SILLONES_DENTALES.map(s => (
                  <option key={s.id} value={s.nombre}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Tratamiento / Motivo</label>
              <input
                type="text"
                value={tratamiento}
                onChange={(e) => setTratamiento(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Hora Inicio</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Duración</label>
              <select
                value={duracionMinutos}
                onChange={(e) => setDuracionMinutos(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={alCerrar} className="px-4 py-2 rounded-xl text-gray-600 font-bold hover:bg-gray-100">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-black text-white font-black hover:bg-gray-800 shadow-md">
              Agendar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalNuevaCita.displayName = 'ModalNuevaCita'