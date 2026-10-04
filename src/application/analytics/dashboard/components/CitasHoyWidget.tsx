import React, { memo } from 'react'
import { Calendar, Clock, Stethoscope } from 'lucide-react'
import type { Cita } from '../../../../domains/operations/agenda/schemas/citaSchema'
import type { Paciente } from '../../../../domains/clinical/patient/schemas/pacienteSchema'

export interface CitasHoyWidgetProps {
  citasHoy?: Cita[]
  alSeleccionarPaciente: (paciente: Paciente) => void
  pacientes?: Paciente[]
}

export const CitasHoyWidget: React.FC<CitasHoyWidgetProps> = memo(({
  citasHoy = [],
  alSeleccionarPaciente,
  pacientes = []
}) => {
  return (
    <div className="relative overflow-hidden bg-surface/90 backdrop-blur-md border border-surface rounded-2xl p-5 shadow-sm text-xs space-y-3.5 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#E5C378] before:to-transparent">
      <div className="flex justify-between items-center border-b border-surface pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-gold-satin/10 border border-gold-satin/30">
            <Calendar size={15} className="text-gold-solid dark:text-gold-satin" />
          </div>
          <div>
            <h3 className="font-black text-sm text-graphite-900 dark:text-graphite-50 tracking-tight">
              Agenda & Flujo Quirúrgico de Hoy
            </h3>
            <span className="text-[10px] text-graphite-500 dark:text-graphite-400 font-medium block">
              Programación de atenciones en sillones
            </span>
          </div>
        </div>
        <span className="text-[10px] bg-slate-100 dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-700 dark:text-gold-satin border border-surface px-2.5 py-0.5 rounded-full font-bold tabular-nums">
          {citasHoy.length} Pacientes
        </span>
      </div>

      {citasHoy.length === 0 ? (
        <p className="text-graphite-400 dark:text-graphite-500 text-center py-8 italic bg-slate-50/50 dark:bg-graphite-800/30 rounded-xl border border-dashed border-surface text-[11px]">
          No hay citas agendadas para la jornada de hoy.
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {citasHoy.map((c) => {
            const pac = pacientes.find(p => String(p.id) === String(c.pacienteId))

            return (
              <div
                key={c.id}
                className="p-3 bg-slate-50/80 dark:bg-graphite-800/70 surgical:bg-graphite-200 border border-surface rounded-xl flex justify-between items-center hover:border-gold-satin/30 hover:bg-slate-100 dark:hover:bg-graphite-700/60 transition-all duration-150"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-graphite-900 dark:text-graphite-50 text-xs">
                      {c.pacienteNombre || 'Paciente'}
                    </span>
                    {c.estado && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-graphite-700 text-graphite-700 dark:text-graphite-300 tabular-nums">
                        {c.estado}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-graphite-600 dark:text-graphite-300 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-semibold text-gold-solid dark:text-gold-satin tabular-nums">
                      <Clock size={11} /> {String(c.hora || c.horaInicio || '10:00')} hrs
                    </span>
                    <span>•</span>
                    <span className="text-graphite-500 dark:text-graphite-400 flex items-center gap-1">
                      <Stethoscope size={10} /> {String(c.motivo || c.trataMiento || 'Control Dental')}
                    </span>
                  </div>
                </div>

                {pac && (
                  <button
                    onClick={() => alSeleccionarPaciente(pac)}
                    className="bg-primary hover:bg-champagne-600 dark:bg-gold-satin dark:hover:bg-primary text-white dark:text-graphite-950 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-xs transition-all duration-150 cursor-pointer active:scale-95"
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
