import React, { memo } from 'react'

export const CitaCard = memo(({
  cita,
  alHacerClic,
  alCambiarEstado,
  alEnviarWhatsApp,
  alVerFicha,
  alEliminar
}) => {
  const esBloqueo = cita.esBloqueo

  if (esBloqueo) {
    return (
      <div className="p-3 rounded-2xl border border-dashed border-red-300 bg-red-50/60 text-red-900 text-xs flex justify-between items-center my-1.5 shadow-2xs group">
        <div className="space-y-0.5">
          <span className="font-black text-[11px] flex items-center gap-1.5">
            ⛔ {cita.motivoBloqueo || 'Bloqueo Horario'}
          </span>
          <p className="text-[10px] font-bold text-red-700">
            ⏰ {cita.horaInicio} - {cita.horaFin} hrs | 🪑 {cita.boxAsignado || 'Todos los Boxes'}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('¿Deseas quitar este bloqueo de la agenda?')) {
              alEliminar && alEliminar(cita.id)
            }
          }}
          className="text-red-500 hover:text-red-800 hover:bg-red-100 p-1.5 rounded-lg text-xs font-black transition-all cursor-pointer"
          title="Eliminar bloqueo"
        >
          🗑️
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={() => alHacerClic && alHacerClic(cita)}
      className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs space-y-2.5 bg-white hover:shadow-md ${
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
        
        <div className="flex items-center gap-1">
          <select
            value={cita.estado || 'Agendado'}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => alCambiarEstado && alCambiarEstado(cita.id, e.target.value)}
            className="text-[10px] font-extrabold rounded-lg px-2 py-0.5 border bg-white focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="Agendado">🔵 Agendado</option>
            <option value="Confirmado">🟢 Confirmado</option>
            <option value="En Espera">🟡 En Sala de Espera</option>
            <option value="En Sillón">🟣 En Sillón</option>
            <option value="Atendido">⚪ Atendido</option>
            <option value="Anulado">🔴 Anulado</option>
          </select>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(`¿Eliminar la cita de "${cita.pacienteNombre}"?`)) {
                alEliminar && alEliminar(cita.id)
              }
            }}
            className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
            title="Eliminar cita"
          >
            🗑️
          </button>
        </div>
      </div>

      <div>
        <h4 className="font-black text-sm text-gray-900 leading-tight flex items-center justify-between">
          <span>{cita.pacienteNombre}</span>
        </h4>
        <p className="text-[11px] font-semibold text-gray-500 flex justify-between pt-0.5">
          <span>🩺 {cita.trataMiento || cita.motivo || 'Consulta Clínica'}</span>
          <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
            {cita.boxAsignado || 'Sillón 1'}
          </span>
        </p>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-[10px]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (alVerFicha) alVerFicha(cita.pacienteId)
          }}
          className="font-black text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
        >
          📁 Ver Ficha Clínica
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (alEnviarWhatsApp) alEnviarWhatsApp(cita)
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