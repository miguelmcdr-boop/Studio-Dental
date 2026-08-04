import React, { memo } from 'react'
import { BOXES_DENTALES, ESTADOS_CITA_GOLD } from '../constants/agendaConstants'

export const CitaCard = memo(({ cita, onCambiarEstado, onEditar, onEliminar, alSeleccionarPaciente, pacientes = [] }) => {
  const boxObj = BOXES_DENTALES.find(b => b.id === cita.boxId) || BOXES_DENTALES[0]
  const configEstado = ESTADOS_CITA_GOLD.find(e => e.id === cita.estado) || ESTADOS_CITA_GOLD[0]
  const paciente = pacientes.find(p => String(p.id) === String(cita.pacienteId))

  return (
    <div className={`p-4 border rounded-2xl shadow-xs space-y-3 bg-white ${boxObj.colorBorder}`}>
      <div className="flex justify-between items-start border-b pb-2 flex-wrap gap-2">
        <div>
          <span className="font-extrabold text-sm text-gray-900 block">{cita.pacienteNombre}</span>
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

      <div className="flex justify-between items-center pt-2 border-t text-[11px] print:hidden">
        {paciente && alSeleccionarPaciente ? (
          <button
            onClick={() => alSeleccionarPaciente(paciente)}
            className="text-blue-600 font-bold hover:underline"
          >
            👥 Ir a Ficha Clínica →
          </button>
        ) : <span />}

        <div className="flex gap-2">
          <button onClick={() => onEditar(cita)} className="text-gray-600 font-bold hover:text-black">✏️ Editar</button>
          <button onClick={() => onEliminar(cita.id)} className="text-red-500 font-bold hover:text-red-700">🗑️ Cancelar</button>
        </div>
      </div>
    </div>
  )
})

CitaCard.displayName = 'CitaCard'