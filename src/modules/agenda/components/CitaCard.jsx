import React, { memo } from 'react'
import { BOXES_DENTALES, ESTADOS_CITA_GOLD } from '../constants/agendaConstants'

export const CitaCard = memo(({ cita, onCambiarEstado, onEditar, onEliminar, alSeleccionarPaciente, pacientes = [] }) => {
  const boxObj = BOXES_DENTALES.find(b => b.id === cita.boxId) || BOXES_DENTALES[0]
  const configEstado = ESTADOS_CITA_GOLD.find(e => e.id === cita.estado) || ESTADOS_CITA_GOLD[0]
  const paciente = pacientes.find(p => String(p.id) === String(cita.pacienteId))

  const handleEnviarWhatsapp = () => {
    const telefonoLimpio = (cita.pacienteTelefono || '').replace(/[^0-9]/g, '')
    if (!telefonoLimpio) {
      alert('El paciente no tiene un número de teléfono válido registrado.')
      return
    }

    const mensaje = encodeURIComponent(
      `Hola ${cita.pacienteNombre}, te saludamos de Studio Dental. Te recordamos tu cita agendada para el día ${cita.fecha || cita.fechaIso} a las ${cita.horaInicio} hrs en el ${boxObj.nombre} con el/la ${cita.doctorNombre}. Por favor respóndenos a este mensaje para confirmar tu asistencia. ¡Te esperamos!`
    )

    window.open(`https://wa.me/${telefonoLimpio}?text=${mensaje}`, '_blank')
  }

  return (
    <div className={`p-4 border rounded-2xl shadow-xs space-y-3 bg-white ${boxObj.colorBorder}`}>
      <div className="flex justify-between items-start border-b pb-2 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-gray-900 block">{cita.pacienteNombre}</span>
            {paciente?.alergias && paciente.alergias.toLowerCase() !== 'ninguna' && (
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded border border-red-200" title={`Alergias: ${paciente.alergias}`}>
                ⚠️ Alergia
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-500 block">RUT: {cita.pacienteRut} | Tel: {cita.pacienteTelefono || 'N/I'}</span>
        </div>

        <div className="flex items-center gap-1">
          <select
            value={cita.estado}
            onChange={(e) => onCambiarEstado(cita.id, e.target.value)}
            className={`px-2.5 py-1 rounded-xl font-black text-[10px] border bg-white cursor-pointer ${configEstado.colorText} ${configEstado.colorBorder}`}
          >
            {ESTADOS_CITA_GOLD.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="font-semibold text-gray-600 block">Horario & Box:</span>
          <span className="font-black text-gray-900">{cita.horaInicio} - {cita.horaFin} hrs</span>
          <span className="text-[10px] font-bold text-gray-600 block mt-0.5">{boxObj.nombre}</span>
        </div>

        <div>
          <span className="font-semibold text-gray-600 block">Tratamiento / Motivo:</span>
          <span className="font-bold text-gray-800">{cita.motivo}</span>
          <span className="text-[10px] text-gray-500 block">{cita.doctorNombre}</span>
        </div>
      </div>

      {cita.horaLlegadaEspera && cita.estado === 'EnEspera' && (
        <div className="p-2 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 text-[10px] font-bold">
          ⏳ Llegó a recepción a las {cita.horaLlegadaEspera} hrs (En espera)
        </div>
      )}

      {cita.observaciones && (
        <p className="text-[10px] text-gray-600 italic bg-gray-50 p-2 rounded-lg border">
          📌 {cita.observaciones}
        </p>
      )}

      <div className="flex justify-between items-center pt-2 border-t text-[11px] print:hidden flex-wrap gap-2">
        <div className="flex gap-3 items-center">
          {paciente && alSeleccionarPaciente ? (
            <button
              onClick={() => alSeleccionarPaciente(paciente)}
              className="text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              👥 Ir a Ficha Clínica →
            </button>
          ) : <span />}

          <button
            onClick={handleEnviarWhatsapp}
            className="text-emerald-700 font-bold hover:text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] flex items-center gap-1"
            title="Enviar recordatorio por WhatsApp"
          >
            💬 WhatsApp
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={() => onEditar(cita)} className="text-gray-600 font-bold hover:text-black">✏️ Editar</button>
          <button onClick={() => onEliminar(cita.id)} className="text-red-500 font-bold hover:text-red-700">🗑️ Cancelar</button>
        </div>
      </div>
    </div>
  )
})

CitaCard.displayName = 'CitaCard'