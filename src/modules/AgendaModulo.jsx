import React, { useState, useEffect } from 'react'

export const AgendaModulo = ({ pacientes = [] }) => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0])
  const [citas, setCitas] = useState(() => {
    const saved = localStorage.getItem('clinica_citas_agenda')
    if (saved) return JSON.parse(saved)
    return [
      { id: 1, fecha: new Date().toISOString().split('T')[0], hora: '09:00', duracion: '45', paciente: 'Camila Silva Morales', rut: '18.452.123-K', motivo: 'Evaluación y Diagnóstico', estado: 'Confirmada' },
      { id: 2, fecha: new Date().toISOString().split('T')[0], hora: '11:30', duracion: '30', paciente: 'Carlos Mendoza Vera', rut: '15.321.987-4', motivo: 'Obturación Resina Pieza 1.6', estado: 'Atendido' }
    ]
  })

  const [mostrarModalNuevaCita, setMostrarModalNuevaCita] = useState(false)
  const [nuevaCita, setNuevaCita] = useState({
    pacienteNombre: '', rut: '', fecha: fechaSeleccionada, hora: '09:00', duracion: '30', motivo: '', estado: 'Confirmada'
  })

  useEffect(() => {
    localStorage.setItem('clinica_citas_agenda', JSON.stringify(citas))
  }, [citas])

  const handleCrearCita = (e) => {
    e.preventDefault()
    if (!nuevaCita.pacienteNombre) return

    const citaObj = {
      id: Date.now(),
      fecha: nuevaCita.fecha || fechaSeleccionada,
      hora: nuevaCita.hora,
      duracion: nuevaCita.duracion,
      paciente: nuevaCita.pacienteNombre,
      rut: nuevaCita.rut || '',
      motivo: nuevaCita.motivo || 'Consulta Odontológica',
      estado: nuevaCita.estado
    }

    setCitas([...citas, citaObj])
    setMostrarModalNuevaCita(false)
    setNuevaCita({ pacienteNombre: '', rut: '', fecha: fechaSeleccionada, hora: '09:00', duracion: '30', motivo: '', estado: 'Confirmada' })
  }

  const handleCambiarEstadoCita = (id, nuevoEstado) => {
    const actualizadas = citas.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c)
    setCitas(actualizadas)
  }

  const handleEliminarCita = (id) => {
    if (window.confirm('¿Deseas cancelar/eliminar esta cita de la agenda?')) {
      setCitas(citas.filter(c => c.id !== id))
    }
  }

  const citasDelDia = citas.filter(c => c.fecha === fechaSeleccionada).sort((a, b) => a.hora.localeCompare(b.hora))

  const ESTADOS_CITAS = {
    Confirmada: 'bg-blue-50 text-blue-700 border-blue-200',
    'Pendiente Confirmar': 'bg-yellow-50 text-yellow-800 border-yellow-200',
    Atendido: 'bg-green-50 text-green-700 border-green-200',
    Inasistencia: 'bg-red-50 text-red-700 border-red-200'
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agenda Dental</h2>
          <p className="text-xs text-gray-500">Gestiona tus horas clínicas, atenciones y confirmaciones de pacientes.</p>
        </div>

        <button
          onClick={() => setMostrarModalNuevaCita(true)}
          className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
        >
          <span>📅</span> Agendar Cita
        </button>
      </div>

      <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl mb-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-600 uppercase">Fecha seleccionada:</span>
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="px-3 py-1.5 border rounded-xl bg-white text-xs font-semibold text-gray-800 shadow-xs"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFechaSeleccionada(new Date().toISOString().split('T')[0])}
            className="text-xs font-semibold bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            Hoy
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="font-bold text-sm text-gray-900">
            Pacientes Citados — {fechaSeleccionada.split('-').reverse().join('/')}
          </h3>
          <span className="text-xs font-bold text-gray-500">{citasDelDia.length} Cita(s) agendadas</span>
        </div>

        <div className="space-y-3">
          {citasDelDia.map(cita => (
            <div
              key={cita.id}
              className="p-4 rounded-xl border border-gray-200 bg-gray-50 hover:border-gray-400 transition-all flex flex-wrap justify-between items-center gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="bg-black text-white px-3 py-2 rounded-xl text-center min-w-[70px]">
                  <span className="block text-sm font-bold">{cita.hora}</span>
                  <span className="text-[10px] opacity-70">{cita.duracion} min</span>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{cita.paciente}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">Procedimiento: <span className="font-medium text-gray-800">{cita.motivo}</span></p>
                  {cita.rut && <p className="text-[10px] text-gray-400">RUT: {cita.rut}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={cita.estado}
                  onChange={(e) => handleCambiarEstadoCita(cita.id, e.target.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer ${ESTADOS_CITAS[cita.estado] || 'bg-gray-100'}`}
                >
                  <option value="Confirmada">🔵 Confirmada</option>
                  <option value="Pendiente Confirmar">🟡 Pendiente Confirmar</option>
                  <option value="Atendido">🟢 Atendido / En Sillón</option>
                  <option value="Inasistencia">🔴 Cancelada / Inasistencia</option>
                </select>

                <button
                  onClick={() => handleEliminarCita(cita.id)}
                  className="text-xs text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                  title="Eliminar de la agenda"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}

          {citasDelDia.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <span className="text-2xl block mb-1">📅</span>
              <p className="text-xs">No hay citas agendadas para este día.</p>
            </div>
          )}
        </div>
      </div>

      {mostrarModalNuevaCita && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-gray-200 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Agendar Cita Odontológica</h3>
              <button onClick={() => setMostrarModalNuevaCita(false)} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCrearCita} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 uppercase mb-1">Seleccionar Paciente de tu Directorio</label>
                <select
                  onChange={(e) => {
                    const pac = pacientes.find(p => p.id === parseInt(e.target.value))
                    if (pac) setNuevaCita({ ...nuevaCita, pacienteNombre: pac.nombre, rut: pac.rut })
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white mb-2"
                >
                  <option value="">-- Seleccionar paciente registrado --</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.rut})</option>
                  ))}
                </select>

                <label className="block font-semibold text-gray-600 uppercase mb-1">Nombre Paciente (O escribir nuevo)</label>
                <input
                  type="text"
                  required
                  value={nuevaCita.pacienteNombre}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, pacienteNombre: e.target.value })}
                  placeholder="Ej: Camila Silva Morales"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={nuevaCita.fecha}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, fecha: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Hora Inicio</label>
                  <input
                    type="text"
                    required
                    value={nuevaCita.hora}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, hora: e.target.value })}
                    placeholder="Ej: 09:30"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Duración Recom.</label>
                  <select
                    value={nuevaCita.duracion}
                    onChange={(e) => setNuevaCita({ ...nuevaCita, duracion: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
                  >
                    <option value="15">15 min (Evaluación)</option>
                    <option value="30">30 min (Obturación)</option>
                    <option value="45">45 min (Limpieza/UDA)</option>
                    <option value="60">60 min (Endodoncia/Cirugía)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-600 uppercase mb-1">Motivo / Tratamiento a Realizar</label>
                <input
                  type="text"
                  value={nuevaCita.motivo}
                  onChange={(e) => setNuevaCita({ ...nuevaCita, motivo: e.target.value })}
                  placeholder="Ej: Evaluación, Obturación composite, Limpieza..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevaCita(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-black text-white py-2.5 rounded-xl font-semibold hover:bg-gray-800"
                >
                  Guardar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}