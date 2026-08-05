import React, { memo } from 'react'

export const CitaCard = memo(({
  cita,
  alHacerClic,
  alCambiarEstado,
  alEnviarWhatsApp,
  alVerFicha
}) => {
  const esBloqueo = cita.esBloqueo

  if (esBloqueo) {
    return (
      <div className="p-2.5 rounded-xl border border-dashed border-gray-300 bg-gray-100/80 text-gray-700 text-xs flex justify-between items-center my-1">
        <span className="font-extrabold text-[11px] flex items-center gap-1.5">
          ⛔ {cita.motivoBloqueo || 'Bloqueo Horario'} ({cita.horaInicio} - {cita.horaFin})
        </span>
        <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-gray-200 font-bold">
          {cita.boxAsignado || 'Box Reservado'}
        </span>
      </div>
    )
  }

  return (
    <div
      onClick={() => alHacerClic && alHacerClic(cita)}
      className={`p-3 rounded-2xl border transition-all cursor-pointer shadow-2xs space-y-2 bg-white ${
        cita.estado === 'En Sillón'
          ? 'border-purple-500 ring-2 ring-purple-400/30 bg-purple-50/20'
          : cita.estado === 'Confirmado'
          ? 'border-emerald-300 bg-emerald-50/10'
          : 'border-gray-200 hover:border-black'
      }`}
    >
      <div className="flex justify-between items-center text-xs">
        <span className="font-black text-gray-900 text-[11px]">
          ⏰ {cita.horaInicio} - {cita.horaFin} ({cita.duracionMinutos || 30} min)
        </span>
        <select
          value={cita.estado || 'Agendado'}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => alCambiarEstado && alCambiarEstado(cita.id, e.target.value)}
          className="text-[10px] font-extrabold rounded-lg px-2 py-0.5 border bg-white focus:outline-none cursor-pointer"
        >
          <option value="Agendado">🔵 Agendado</option>
          <option value="Confirmado">🟢 Confirmado</option>
          <option value="En Espera">🟡 En Sala de Espera</option>
          <option value="En Sillón">🟣 En Sillón</option>
          <option value="Atendido">⚪ Atendido</option>
          <option value="Anulado">🔴 Anulado</option>
        </select>
      </div>

      <div>
        <h4 className="font-black text-sm text-gray-900 leading-tight">{cita.pacienteNombre}</h4>
        <p className="text-[11px] font-medium text-gray-500 flex justify-between pt-0.5">
          <span>🩺 {cita.trataMiento || cita.motivo || 'Consulta Clínica'}</span>
          <span className="font-bold text-gray-700">{cita.boxAsignado || 'Sillón 1'}</span>
        </p>
      </div>

      <div className="flex justify-between items-center pt-1 border-t border-gray-100 text-[10px]">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); alVerFicha && alVerFicha(cita.pacienteId) }}
          className="font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
        >
          📁 Ver Ficha
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (alEnviarWhatsApp) {
              alEnviarWhatsApp(cita)
            }
          }}
          className="font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1"
        >
          📲 Confirmar WhatsApp
        </button>
      </div>
    </div>
  )
})

CitaCard.displayName = 'CitaCard'