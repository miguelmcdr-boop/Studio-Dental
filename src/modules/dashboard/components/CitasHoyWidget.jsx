import React, { memo } from 'react'
import { Calendar } from 'lucide-react'

export const CitasHoyWidget = memo(({ citasHoy = [], alSeleccionarPaciente, pacientes = [] }) => {
  return (
    <div className="relative overflow-hidden bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl p-5 shadow-sm text-xs space-y-3.5 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#B88E3A]/40 before:to-transparent">
      <div className="flex justify-between items-center border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] pb-3">
        <h3 className="font-extrabold text-sm text-graphite-900 dark:text-graphite-50 tracking-tight inline-flex items-center gap-2">
          <Calendar size={16} className="text-[#B88E3A]" />
          Citas de la Jornada de Hoy
        </h3>
        <span className="text-[10px] bg-slate-100 dark:bg-[#1E293B] surgical:bg-[#E2E8F0] text-graphite-700 dark:text-graphite-300 border border-[#E2E8F0] dark:border-[#24334A] px-2.5 py-0.5 rounded-full font-bold tabular-nums">
          {citasHoy.length} Pacientes
        </span>
      </div>

      {citasHoy.length === 0 ? (
        <p className="text-graphite-400 dark:text-graphite-500 text-center py-8 italic bg-slate-50/50 dark:bg-[#1E293B]/30 rounded-xl border border-dashed border-[#E2E8F0] dark:border-[#24334A] text-[11px]">
          No hay citas agendadas para el día de hoy.
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {citasHoy.map((c) => {
            const pac = pacientes.find(p => String(p.id) === String(c.pacienteId))

            return (
              <div key={c.id} className="p-3 bg-slate-50/80 dark:bg-[#1E293B]/80 surgical:bg-[#E2E8F0] border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-xl flex justify-between items-center hover:bg-slate-100 dark:hover:bg-[#24334A] transition-colors duration-150">
                <div>
                  <span className="font-extrabold text-graphite-900 dark:text-graphite-50 block text-xs">{c.pacienteNombre || 'Paciente'}</span>
                  <span className="text-[10px] text-graphite-600 dark:text-graphite-300">
                    <span className="tabular-nums font-semibold text-[#B88E3A] dark:text-[#E5C378]">{c.hora || '10:00'}</span> hrs | {c.motivo || 'Control Dental'}
                  </span>
                </div>

                {pac && (
                  <button
                    onClick={() => alSeleccionarPaciente(pac)}
                    className="bg-[#B88E3A] hover:bg-[#99732B] dark:bg-[#E5C378] dark:hover:bg-[#B88E3A] text-white dark:text-graphite-950 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-xs transition-colors duration-150"
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