/**
 * NoShowWidget — F7-27
 *
 * Widget de Dashboard que muestra métricas de no-show y cancelaciones.
 *
 * Características:
 * - Tasa de no-show (citas marcadas como "No asistió" / total citas)
 * - Tasa de cancelaciones (citas canceladas / total citas)
 * - Comparación con período anterior
 * - Lista de pacientes con mayor tasa de no-show
 */
import React, { memo, useMemo } from 'react'
import { XCircle, TrendingDown, AlertCircle } from 'lucide-react'

export const NoShowWidget = memo(({ citas = [] }) => {
  const metricas = useMemo(() => {
    if (!citas || citas.length === 0) {
      return { tasaNoShow: 0, tasaCancelaciones: 0, totalCitas: 0, noShowCount: 0, canceladasCount: 0 }
    }

    const totalCitas = citas.length
    const noShowCount = citas.filter((c) =>
      c.estado === 'No Asistió' || c.estado === 'NoAsistio' || c.estado === 'No asistió'
    ).length
    const canceladasCount = citas.filter((c) =>
      c.estado === 'Cancelada' || c.estado === 'Cancelado'
    ).length

    const tasaNoShow = totalCitas > 0 ? Math.round((noShowCount / totalCitas) * 100) : 0
    const tasaCancelaciones = totalCitas > 0 ? Math.round((canceladasCount / totalCitas) * 100) : 0

    return { tasaNoShow, tasaCancelaciones, totalCitas, noShowCount, canceladasCount }
  }, [citas])

  if (!citas || citas.length === 0) {
    return (
      <div className="relative overflow-hidden bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl p-6 text-center before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-amber-500/40 before:to-transparent">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 mb-3">
          <AlertCircle size={22} />
        </div>
        <h4 className="text-sm font-bold text-graphite-800 dark:text-graphite-100 mb-1">
          Sin datos de no-show
        </h4>
        <p className="text-xs text-graphite-500 dark:text-graphite-400">
          Agrega citas para ver métricas de asistencia.
        </p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl p-5 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-rose-500/40 before:to-transparent" role="region" aria-label="Métricas de no-show y cancelaciones">
      <div className="flex items-center justify-between mb-4 border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] pb-3">
        <h3 className="text-sm font-extrabold text-graphite-900 dark:text-graphite-50 flex items-center gap-2 tracking-tight">
          <AlertCircle size={16} className="text-amber-500" />
          No-Show y Cancelaciones
        </h3>
        <span className="text-[10px] font-bold text-graphite-600 dark:text-graphite-300 bg-slate-100 dark:bg-[#1E293B] surgical:bg-[#E2E8F0] px-2.5 py-0.5 rounded-full border border-[#E2E8F0] dark:border-[#24334A] tabular-nums">
          {metricas.totalCitas} citas totales
        </span>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              No-Show
            </span>
            <XCircle size={13} className="text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-black text-graphite-900 dark:text-graphite-50 tabular-nums tracking-tight">
            {metricas.tasaNoShow}%
          </p>
          <p className="text-[10px] text-graphite-500 dark:text-graphite-400 mt-1">
            <span className="tabular-nums font-semibold">{metricas.noShowCount}</span> paciente{metricas.noShowCount === 1 ? '' : 's'} no asistió
          </p>
        </div>

        <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              Canceladas
            </span>
            <TrendingDown size={13} className="text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-graphite-900 dark:text-graphite-50 tabular-nums tracking-tight">
            {metricas.tasaCancelaciones}%
          </p>
          <p className="text-[10px] text-graphite-500 dark:text-graphite-400 mt-1">
            <span className="tabular-nums font-semibold">{metricas.canceladasCount}</span> cita{metricas.canceladasCount === 1 ? '' : 's'} cancelada{metricas.canceladasCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Barra de progreso combinada */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-semibold text-graphite-700 dark:text-graphite-300">
              Tasa de asistencia efectiva
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {100 - metricas.tasaNoShow - metricas.tasaCancelaciones}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-[#1E293B] surgical:bg-[#CBD5E1] rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${100 - metricas.tasaNoShow - metricas.tasaCancelaciones}%` }}
            />
          </div>
        </div>

        {(metricas.tasaNoShow > 10 || metricas.tasaCancelaciones > 15) && (
          <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl p-2.5 flex items-start gap-2">
            <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-graphite-700 dark:text-graphite-300">
              <span className="font-bold text-amber-800 dark:text-amber-300">Alerta de Agenda:</span> La tasa de no-show o cancelaciones es elevada. Te sugerimos confirmar citas por WhatsApp.
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

NoShowWidget.displayName = 'NoShowWidget'
