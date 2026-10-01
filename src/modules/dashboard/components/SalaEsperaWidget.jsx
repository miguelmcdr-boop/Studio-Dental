import React, { memo } from 'react'
import { Armchair, Clock, Activity, Stethoscope } from 'lucide-react'

export const SalaEsperaWidget = memo(({ enEspera = [], enAtencion = [], pacientes = [], alSeleccionarPaciente }) => {
  return (
    <div className="relative overflow-hidden bg-surface/90 backdrop-blur-md border border-surface rounded-2xl p-5 shadow-sm space-y-4 text-xs before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-emerald-500/50 before:to-transparent">
      {/* Cabecera del Monitor Quirúrgico */}
      <div className="flex justify-between items-center border-b border-surface pb-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div>
            <h3 className="font-black text-sm text-graphite-900 dark:text-graphite-50 tracking-tight flex items-center gap-1.5">
              <span>Monitor Quirúrgico de Boxes & Sala</span>
            </h3>
            <span className="text-[10px] text-graphite-500 dark:text-graphite-400 font-medium block">
              Telemetría de sillones y tiempos de espera en vivo
            </span>
          </div>
        </div>
        <span className="text-[10px] bg-slate-100 dark:bg-graphite-800 surgical:bg-graphite-200 text-graphite-800 dark:text-gold-satin border border-surface font-extrabold px-2.5 py-1 rounded-full tabular-nums">
          <span className="text-emerald-500 font-black">{enAtencion.length}</span> En Sillón | <span className="text-gold-solid dark:text-gold-satin font-black">{enEspera.length}</span> En Espera
        </span>
      </div>

      {/* Monitor de Sillones / Boxes en Atención */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-sky-800 dark:text-sky-300 uppercase tracking-wider inline-flex items-center gap-1.5">
            <Armchair size={13} className="text-[#0EA5E9]" />
            Sillones Quirúrgicos Activos:
          </span>
          {enAtencion.length > 0 && (
            <span className="text-[9px] bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-[#38BDF8] font-bold px-2 py-0.5 rounded-full border border-sky-300/40 tabular-nums flex items-center gap-1">
              <Activity size={10} className="text-[#0EA5E9] animate-pulse" />
              Procedimiento en curso
            </span>
          )}
        </div>

        {enAtencion.length === 0 ? (
          <div className="p-3.5 bg-sky-50/30 dark:bg-sky-950/10 rounded-xl border border-dashed border-sky-200/50 dark:border-sky-900/30 text-center">
            <span className="text-[11px] text-graphite-500 dark:text-graphite-400 italic">
              Boxes disponibles. Ningún procedimiento activo en este momento.
            </span>
          </div>
        ) : (
          enAtencion.map((c, idx) => {
            const pac = pacientes.find(p => String(p.id) === String(c.pacienteId))
            return (
              <div
                key={c.id}
                className="p-3.5 bg-gradient-to-r from-sky-50/80 via-surface to-surface dark:from-sky-950/30 dark:via-graphite-800/80 dark:to-graphite-800/80 border border-sky-300/50 dark:border-sky-800/50 rounded-xl flex justify-between items-center hover:shadow-xs transition-all duration-150"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#0EA5E9]/15 text-[#0EA5E9] border border-[#0EA5E9]/30 tabular-nums">
                      Box 0{idx + 1}
                    </span>
                    <span className="font-black text-graphite-900 dark:text-graphite-50 text-xs">
                      {c.pacienteNombre}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-graphite-600 dark:text-graphite-300 font-medium">
                    <span className="text-clinical-info font-semibold">{c.motivo || 'Procedimiento Clínico'}</span>
                    <span>•</span>
                    <span className="text-graphite-500 dark:text-graphite-400 flex items-center gap-1">
                      <Stethoscope size={10} /> {c.doctorNombre || 'Dr. Asignado'}
                    </span>
                  </div>
                </div>

                {pac && alSeleccionarPaciente && (
                  <button
                    onClick={() => alSeleccionarPaciente(pac)}
                    className="bg-primary hover:bg-champagne-600 dark:bg-gold-satin dark:hover:bg-primary text-white dark:text-graphite-950 font-extrabold px-3 py-1.5 rounded-lg text-[10px] shadow-xs transition-all duration-150 cursor-pointer active:scale-95"
                  >
                    Ficha Box →
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Flujo de Pacientes en Espera / Recepción */}
      <div className="space-y-2 pt-2 border-t border-surface">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-amber-800 dark:text-gold-satin uppercase tracking-wider inline-flex items-center gap-1.5">
            <Clock size={12} className="text-gold-solid dark:text-gold-satin" />
            Pacientes en Recepción & Espera:
          </span>
          <span className="text-[9px] text-graphite-500 dark:text-graphite-400 font-semibold tabular-nums">
            {enEspera.length} en fila
          </span>
        </div>

        {enEspera.length === 0 ? (
          <p className="text-graphite-400 dark:text-graphite-500 italic py-3 text-center bg-slate-50/50 dark:bg-graphite-800/30 rounded-xl border border-dashed border-surface text-[11px]">
            No hay pacientes esperando en recepción actualmente.
          </p>
        ) : (
          enEspera.map(c => {
            const pac = pacientes.find(p => String(p.id) === String(c.pacienteId))
            return (
              <div
                key={c.id}
                className="p-3 bg-amber-50/60 dark:bg-amber-950/15 surgical:bg-graphite-200 border border-amber-200/80 dark:border-amber-800/40 rounded-xl flex justify-between items-center hover:shadow-xs transition-all duration-150"
              >
                <div>
                  <span className="font-extrabold text-graphite-900 dark:text-amber-100 block text-xs">
                    {c.pacienteNombre}
                  </span>
                  <span className="text-[10px] text-graphite-600 dark:text-amber-300/80 font-medium">
                    Ingreso a recepción: <strong className="tabular-nums font-bold text-graphite-900 dark:text-gold-satin">{c.horaLlegadaEspera || c.horaInicio}</strong> hrs
                  </span>
                </div>
                {pac && alSeleccionarPaciente && (
                  <button
                    onClick={() => alSeleccionarPaciente(pac)}
                    className="bg-primary hover:bg-champagne-600 dark:bg-gold-satin dark:hover:bg-primary text-white dark:text-graphite-950 font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-xs transition-all duration-150 cursor-pointer active:scale-95"
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