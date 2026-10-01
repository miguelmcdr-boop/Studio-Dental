import React, { memo } from 'react'
import { Armchair } from 'lucide-react'
import { Clock } from 'lucide-react'

export const SalaEsperaWidget = memo(({ enEspera = [], enAtencion = [], pacientes = [], alSeleccionarPaciente }) => {
  return (
    <div className="relative overflow-hidden bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl p-5 shadow-sm space-y-4 text-xs before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-emerald-500/40 before:to-transparent">
      <div className="flex justify-between items-center border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <h3 className="font-extrabold text-sm text-graphite-900 dark:text-graphite-50 tracking-tight">Monitor de Recepción & Box Dental</h3>
        </div>
        <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 font-bold px-2.5 py-0.5 rounded-full tabular-nums">
          {enEspera.length} Esperando | {enAtencion.length} En Sillón
        </span>
      </div>

      {/* Pacientes en Atención Actualmente */}
      {enAtencion.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider block inline-flex items-center gap-1.5">
            <Armchair size={13} className="text-[#0EA5E9]" />
            Atendiendo en Sillón / Box:
          </span>
          {enAtencion.map(c => {
            const pac = pacientes.find(p => String(p.id) === String(c.pacienteId))
            return (
              <div key={c.id} className="p-3 bg-sky-50/70 dark:bg-[#1E293B]/70 surgical:bg-[#E2E8F0] border border-sky-200/80 dark:border-sky-800/40 rounded-xl flex justify-between items-center hover:shadow-xs transition-all duration-150">
                <div>
                  <span className="font-extrabold text-sky-950 dark:text-sky-100 block text-xs">{c.pacienteNombre}</span>
                  <span className="text-[10px] text-sky-800 dark:text-sky-300 font-medium">{c.motivo} — {c.doctorNombre}</span>
                </div>
                {pac && alSeleccionarPaciente && (
                  <button
                    onClick={() => alSeleccionarPaciente(pac)}
                    className="bg-[#B88E3A] hover:bg-[#99732B] dark:bg-[#E5C378] dark:hover:bg-[#B88E3A] text-white dark:text-graphite-950 font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-xs transition-colors duration-150"
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
        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block inline-flex items-center gap-1.5">
          <Clock size={12} className="text-[#B88E3A]" />
          Pacientes en Sala de Espera:
        </span>
        {enEspera.length === 0 ? (
          <p className="text-graphite-400 dark:text-graphite-500 italic py-4 text-center bg-slate-50/50 dark:bg-[#1E293B]/30 rounded-xl border border-dashed border-[#E2E8F0] dark:border-[#24334A] text-[11px]">
            No hay pacientes esperando en recepción actualmente.
          </p>
        ) : (
          enEspera.map(c => {
            const pac = pacientes.find(p => String(p.id) === String(c.pacienteId))
            return (
              <div key={c.id} className="p-3 bg-amber-50/70 dark:bg-amber-950/20 surgical:bg-[#E2E8F0] border border-amber-200/80 dark:border-amber-800/40 rounded-xl flex justify-between items-center hover:shadow-xs transition-all duration-150">
                <div>
                  <span className="font-extrabold text-amber-950 dark:text-amber-100 block text-xs">{c.pacienteNombre}</span>
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                    Llegó a las <span className="tabular-nums font-semibold">{c.horaLlegadaEspera || c.horaInicio}</span> hrs
                  </span>
                </div>
                {pac && alSeleccionarPaciente && (
                  <button
                    onClick={() => alSeleccionarPaciente(pac)}
                    className="bg-[#B88E3A] hover:bg-[#99732B] dark:bg-[#E5C378] dark:hover:bg-[#B88E3A] text-white dark:text-graphite-950 font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-xs transition-colors duration-150"
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