import React, { memo } from 'react'

export const SalaEsperaWidget = memo(({ enEspera = [], enAtencion = [], pacientes = [], alSeleccionarPaciente }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
      <div className="flex justify-between items-center border-b pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <h3 className="font-bold text-gray-900 uppercase tracking-wider">Monitor de Recepción & Box Dental</h3>
        </div>
        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
          {enEspera.length} Esperando | {enAtencion.length} En Sillón
        </span>
      </div>

      {/* Pacientes en Atención Actualmente */}
      {enAtencion.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">🪑 Atendiendo en Sillón / Box:</span>
          {enAtencion.map(c => {
            const pac = pacientes.find(p => String(p.id) === String(c.pacienteId))
            return (
              <div key={c.id} className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-bold text-blue-950 block">{c.pacienteNombre}</span>
                  <span className="text-[10px] text-blue-800">{c.motivo} — {c.doctorNombre}</span>
                </div>
                {pac && alSeleccionarPaciente && (
                  <button
                    onClick={() => alSeleccionarPaciente(pac)}
                    className="bg-blue-600 text-white font-bold px-3 py-1 rounded-lg text-[10px] hover:bg-blue-800"
                  >
                    Abrir Ficha →
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pacientes en Sala de Espera */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">⏳ Pacientes en Sala de Espera:</span>
        {enEspera.length === 0 ? (
          <p className="text-gray-400 italic py-2 text-center bg-gray-50 rounded-xl border border-dashed text-[11px]">
            No hay pacientes esperando en recepción actualmente.
          </p>
        ) : (
          enEspera.map(c => {
            const pac = pacientes.find(p => String(p.id) === String(c.pacienteId))
            return (
              <div key={c.id} className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-bold text-amber-950 block">{c.pacienteNombre}</span>
                  <span className="text-[10px] text-amber-800">Llegó a las {c.horaLlegadaEspera || c.horaInicio} hrs</span>
                </div>
                {pac && alSeleccionarPaciente && (
                  <button
                    onClick={() => alSeleccionarPaciente(pac)}
                    className="bg-amber-700 text-white font-bold px-3 py-1 rounded-lg text-[10px] hover:bg-amber-900"
                  >
                    Atender Paciente →
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
})

SalaEsperaWidget.displayName = 'SalaEsperaWidget'