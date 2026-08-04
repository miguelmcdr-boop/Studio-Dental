import React, { memo } from 'react'
import { ESTADOS_CITA } from '../constants/agendaConstants'
import { generarMensajeWhatsappRecordatorio } from '../utils/agendaCalculations'

export const CitaCard = memo(({ cita, pacientes = [], userProfile, onActualizarEstado, onEliminarCita, onAbrirFichaPaciente }) => {
  const estadoConfig = ESTADOS_CITA.find(e => e.id === cita.estado) || ESTADOS_CITA[0]
  const pacienteObj = pacientes.find(p => p.id === cita.pacienteId)

  const handleEnviarWhatsapp = () => {
    const url = generarMensajeWhatsappRecordatorio(cita, pacienteObj || { nombre: cita.pacienteNombre, telefono: cita.telefono }, userProfile?.nombreCompleto)
    window.open(url, '_blank')
  }

  return (
    <div className={`p-4 rounded-2xl border ${estadoConfig.colorBg} ${estadoConfig.colorBorder} transition-all space-y-3`}>
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div>
          <span className="font-extrabold text-sm text-gray-900 block">{cita.horaInicio} - {cita.horaFin} hrs</span>
          <span className="text-[11px] font-bold text-gray-600 block">{cita.box}</span>
        </div>

        <select
          value={cita.estado}
          onChange={(e) => onActualizarEstado(cita.id, e.target.value)}
          className={`px-2.5 py-1 rounded-xl font-extrabold text-xs border bg-white ${estadoConfig.colorText}`}
        >
          {ESTADOS_CITA.map(e => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
      </div>

      <div className="border-t border-black/10 pt-2 space-y-1">
        <p className="font-bold text-gray-900 text-xs">{cita.pacienteNombre} <span className="text-gray-500 font-normal">({cita.pacienteRut})</span></p>
        <p className="text-gray-600 text-[11px]"><span className="font-semibold">Motivo:</span> {cita.motivo || 'Atención General'}</p>
        {cita.observacion && <p className="text-gray-500 text-[10px] italic">"{cita.observacion}"</p>}
      </div>

      <div className="flex gap-2 pt-2 justify-end border-t border-black/10">
        <button
          onClick={handleEnviarWhatsapp}
          className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors text-[10px]"
        >
          💬 WhatsApp
        </button>

        {pacienteObj && (
          <button
            onClick={() => onAbrirFichaPaciente(pacienteObj)}
            className="px-2.5 py-1 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors text-[10px]"
          >
            📋 Ver Ficha
          </button>
        )}

        <button
          onClick={() => onEliminarCita(cita.id)}
          className="px-2 py-1 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 transition-colors text-[10px]"
        >
          🗑️
        </button>
      </div>
    </div>
  )
})

CitaCard.displayName = 'CitaCard'