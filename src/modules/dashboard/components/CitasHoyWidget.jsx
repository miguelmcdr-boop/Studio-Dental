import React, { memo } from 'react'

export const CitasHoyWidget = memo(({ citasHoy = [], alSeleccionarPaciente, pacientes = [] }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs text-xs space-y-3">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">📅 Citas de la Jornada de Hoy</h3>
        <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">{citasHoy.length} Pacientes</span>
      </div>

      {citasHoy.length === 0 ? (
        <p className="text-gray-400 text-center py-6">No hay citas agendadas para el día de hoy.</p>
      ) : (
        <div className="space-y-2">
          {citasHoy.map((c) => {
            const pac = pacientes.find(p => String(p.id) === String(c.pacienteId))

            return (
              <div key={c.id} className="p-3 bg-gray-50 border rounded-xl flex justify-between items-center hover:bg-gray-100 transition-colors">
                <div>
                  <span className="font-extrabold text-gray-900 block">{c.pacienteNombre || 'Paciente'}</span>
                  <span className="text-[10px] text-gray-500">{c.hora || '10:00'} hrs | {c.motivo || 'Control Dental'}</span>
                </div>

                {pac && (
                  <button
                    onClick={() => alSeleccionarPaciente(pac)}
                    className="bg-black text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-gray-800"
                  >
                    Ver Ficha →
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})

CitasHoyWidget.displayName = 'CitasHoyWidget'