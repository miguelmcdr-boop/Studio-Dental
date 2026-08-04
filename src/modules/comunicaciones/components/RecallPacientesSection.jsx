import React, { memo, useState } from 'react'
import { generarLinkWhatsAppWeb } from '../utils/comunicacionesCalculations'

export const RecallPacientesSection = memo(({ pacientes = [], alEnviarRecall }) => {
  const [busquedaRecall, setBusquedaRecall] = useState('')

  const pacientesFiltrados = pacientes.filter(p => 
    p.nombre.toLowerCase().includes(busquedaRecall.toLowerCase()) || p.rut.includes(busquedaRecall)
  )

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
      <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-sm text-gray-900 uppercase">🔔 Recall & Citación Preventiva de Pacientes (6 Meses)</h3>
          <p className="text-gray-500 text-[11px]">Directorio de llamadas y citaciones para controles periódicos o limpiezas.</p>
        </div>

        <input
          type="text"
          placeholder="🔍 Buscar paciente para recall..."
          value={busquedaRecall}
          onChange={(e) => setBusquedaRecall(e.target.value)}
          className="p-2 border rounded-xl bg-white w-64"
        />
      </div>

      <div className="divide-y divide-gray-100">
        {pacientesFiltrados.map(p => {
          const mensajeRecall = `Hola ${p.nombre}, han pasado 6 meses desde su último control preventivo en Studio Dental. Le invitamos a agendar su cita de limpieza y revisión bucal.`

          return (
            <div key={p.id} className="py-3 flex justify-between items-center flex-wrap gap-2 hover:bg-gray-50 p-2 rounded-xl">
              <div>
                <span className="font-extrabold text-gray-900 block text-xs">{p.nombre} ({p.rut})</span>
                <span className="text-[10px] text-gray-500">Tel: {p.telefono || 'Sin teléfono'} | Previsión: {p.prevision || 'Particular'}</span>
              </div>

              <div className="flex items-center gap-2">
                {p.telefono && (
                  <a
                    href={generarLinkWhatsAppWeb(p.telefono, mensajeRecall)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => alEnviarRecall(p, mensajeRecall)}
                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] hover:bg-emerald-700 transition-colors"
                  >
                    💬 Enviar Recall WhatsApp
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

RecallPacientesSection.displayName = 'RecallPacientesSection'