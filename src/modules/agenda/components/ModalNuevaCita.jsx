import React, { memo, useState, useEffect } from 'react'
import { BOXES_DENTALES, ESTADOS_CITA_GOLD } from '../constants/agendaConstants'

export const ModalNuevaCita = memo(({ citaEditar, pacientes = [], userProfile, alGuardar, alCrearPacienteRapido, alCerrar }) => {
  const [pacienteId, setPacienteId] = useState('')
  const [crearNuevoPaciente, setCrearNuevoPaciente] = useState(false)
  
  // Campos Paciente Nuevo Express
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoRut, setNuevoRut] = useState('')
  const [nuevoTelefono, setNuevoTelefono] = useState('')

  const [fechaIso, setFechaIso] = useState(new Date().toISOString().split('T')[0])
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [horaFin, setHoraFin] = useState('09:30')
  const [boxId, setBoxId] = useState(BOXES_DENTALES[0].id)
  const [doctorNombre, setDoctorNombre] = useState(userProfile?.nombreCompleto || 'Dr. Miguel Díaz')
  const [motivo, setMotivo] = useState('')
  const [estado, setEstado] = useState('Agendado')
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    if (citaEditar) {
      setPacienteId(citaEditar.pacienteId || '')
      setFechaIso(citaEditar.fechaIso || new Date().toISOString().split('T')[0])
      setHoraInicio(citaEditar.horaInicio || '09:00')
      setHoraFin(citaEditar.horaFin || '09:30')
      setBoxId(citaEditar.boxId || BOXES_DENTALES[0].id)
      setDoctorNombre(citaEditar.doctorNombre || userProfile?.nombreCompleto || '')
      setMotivo(citaEditar.motivo || '')
      setEstado(citaEditar.estado || 'Agendado')
      setObservaciones(citaEditar.observaciones || '')
    }
  }, [citaEditar, userProfile])

  const handleSubmit = (e) => {
    e.preventDefault()

    let pacFinal = null

    if (crearNuevoPaciente) {
      if (!nuevoNombre || !nuevoRut) {
        alert('Por favor ingresa el nombre y RUT del nuevo paciente.')
        return
      }

      pacFinal = {
        id: Date.now(),
        nombre: nuevoNombre.trim(),
        rut: nuevoRut.trim(),
        telefono: nuevoTelefono.trim(),
        edad: '30',
        prevision: 'Particular'
      }

      if (alCrearPacienteRapido) {
        alCrearPacienteRapido(pacFinal)
      }
    } else {
      if (!pacienteId && estado !== 'Bloqueo') {
        alert('Selecciona un paciente o activa la opción de crear paciente express.')
        return
      }
      pacFinal = pacientes.find(p => String(p.id) === String(pacienteId))
    }

    const fechaObj = new Date(fechaIso + 'T00:00:00')

    const citaFinal = {
      id: citaEditar ? citaEditar.id : Date.now(),
      pacienteId: pacFinal?.id,
      pacienteNombre: pacFinal?.nombre || 'Bloqueo de Box',
      pacienteRut: pacFinal?.rut || 'N/A',
      pacienteTelefono: pacFinal?.telefono || '',
      fecha: fechaObj.toLocaleDateString('es-CL'),
      fechaIso,
      horaInicio,
      horaFin,
      boxId,
      doctorNombre,
      motivo: motivo.trim() || 'Consulta Odontológica General',
      estado,
      observaciones: observaciones.trim()
    }

    const exito = alGuardar(citaFinal)
    if (exito !== false) {
      alCerrar()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-gray-200 shadow-xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-base font-bold text-gray-900">
            {citaEditar ? '✏️ Modificar Cita Odontológica' : '📅 Agendar Cita en Box / Sillón'}
          </h3>
          <button onClick={alCerrar} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-gray-800">Paciente Destinatario *</label>
              <button
                type="button"
                onClick={() => setCrearNuevoPaciente(!crearNuevoPaciente)}
                className="text-blue-600 font-bold hover:underline text-[11px]"
              >
                {crearNuevoPaciente ? '← Elegir de la lista' : '➕ Nuevo Paciente Express'}
              </button>
            </div>

            {!crearNuevoPaciente ? (
              <select
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
              >
                <option value="">-- Seleccionar paciente del directorio --</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.rut})</option>
                ))}
              </select>
            ) : (
              <div className="space-y-2 pt-1">
                <div>
                  <input
                    type="text"
                    placeholder="Nombre completo *"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="RUT (Ej: 12.345.678-9) *"
                    value={nuevoRut}
                    onChange={(e) => setNuevoRut(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Teléfono (+569...)"
                    value={nuevoTelefono}
                    onChange={(e) => setNuevoTelefono(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Fecha de Atención *</label>
              <input
                type="date"
                required
                value={fechaIso}
                onChange={(e) => setFechaIso(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Sillón / Box Dental *</label>
              <select
                value={boxId}
                onChange={(e) => setBoxId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
              >
                {BOXES_DENTALES.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Hora Inicio *</label>
              <input
                type="time"
                required
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Hora Término *</label>
              <input
                type="time"
                required
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Odontólogo Tratante</label>
              <input
                type="text"
                value={doctorNombre}
                onChange={(e) => setDoctorNombre(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Estado Inicial Cita</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
              >
                {ESTADOS_CITA_GOLD.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Motivo / Tratamiento a Realizar</label>
            <input
              type="text"
              placeholder="Ej: Evaluación, Limpieza UDA, Instalación de Brackets..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Observaciones / Indicaciones Especiales</label>
            <textarea
              rows="2"
              placeholder="Ej: Paciente con fobia, requiere confirmación 24 hrs antes..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300"
            />
          </div>

          <div className="flex gap-2 pt-2">
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
              {citaEditar ? 'Guardar Cambios' : 'Agendar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalNuevaCita.displayName = 'ModalNuevaCita'