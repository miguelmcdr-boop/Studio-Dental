import React, { memo } from 'react'
import { Calendar } from 'lucide-react'

export const CitasHoyWidget = memo(({ citasHoy = [], alSeleccionarPaciente, pacientes = [] }) => {
  return (
    <div className="relative overflow-hidden bg-surface/90 backdrop-blur-md border border-surface rounded-2xl p-5 shadow-sm text-xs space-y-3.5 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#B88E3A]/40 before:to-transparent">
      <div className="flex justify-between items-center border-b border-surface pb-3">
        <h3 className="font-extrabold text-sm text-graphite-900 dark:text-graphite-50 tracking-tight inline-flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          Citas de la Jornada de Hoy
        </h3>
        <span className="text-[10px] bg-slate-100 dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-700 dark:text-graphite-300 border border-surface px-2.5 py-0.5 rounded-full font-bold tabular-nums">
          {citasHoy.length} Pacientes
        </span>
      </div>

      {citasHoy.length === 0 ? (
        <p className="text-graphite-400 dark:text-graphite-500 text-center py-8 italic bg-slate-50/50 dark:bg-graphite-800/30 rounded-xl border border-dashed border-surface text-[11px]">
          No hay citas agendadas para el día de hoy.
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {citasHoy.map((c) => {
            const pac = pacientes.find(p => String(p.id) === String(c.pacienteId))

            return (
              <div key={c.id} className="p-3 bg-slate-50/80 dark:bg-graphite-800/80 surgical:bg-graphite-200 border border-surface rounded-xl flex justify-between items-center hover:bg-slate-100 dark:hover:bg-graphite-700 transition-colors duration-150">
                <div>
                  <span className="font-extrabold text-graphite-900 dark:text-graphite-50 block text-xs">{c.pacienteNombre || 'Paciente'}</span>
                  <span className="text-[10px] text-graphite-600 dark:text-graphite-300">
                    <span className="tabular-nums font-semibold text-primary">{c.hora || '10:00'}</span> hrs | {c.motivo || 'Control Dental'}
                  </span>
                </div>

                {pac && (
                  <button
                    onClick={() => alSeleccionarPaciente(pac)}
                    className="bg-primary hover:bg-champagne-600 dark:bg-gold-satin dark:hover:bg-primary text-white dark:text-graphite-950 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-xs transition-colors duration-150"
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