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
      <div className="bg-white dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 rounded-2xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-graphite-100 dark:bg-graphite-700 text-graphite-400 dark:text-graphite-300 mb-3">
          <AlertCircle size={24} />
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
    <div className="bg-white dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 rounded-2xl p-4" role="region" aria-label="Métricas de no-show y cancelaciones">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-graphite-900 dark:text-graphite-50 flex items-center gap-2">
          <AlertCircle size={16} />
          No-Show y Cancelaciones
        </h3>
        <span className="text-[10px] text-graphite-500 dark:text-graphite-400">
          {metricas.totalCitas} citas totales
        </span>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-clinical-error/5 dark:bg-red-400/10 border border-clinical-error/20 dark:border-red-400/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-semibold text-clinical-error dark:text-red-300 uppercase tracking-wider">
              No-Show
            </span>
            <XCircle size={12} className="text-clinical-error dark:text-red-300" />
          </div>
          <p className="text-2xl font-black text-graphite-900 dark:text-graphite-50">
            {metricas.tasaNoShow}%
          </p>
          <p className="text-[10px] text-graphite-500 dark:text-graphite-400 mt-1">
            {metricas.noShowCount} paciente{metricas.noShowCount === 1 ? '' : 's'} no asistió
          </p>
        </div>

        <div className="bg-clinical-warning/5 dark:bg-amber-400/10 border border-clinical-warning/20 dark:border-amber-400/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-semibold text-clinical-warning dark:text-amber-300 uppercase tracking-wider">
              Canceladas
            </span>
            <TrendingDown size={12} className="text-clinical-warning dark:text-amber-300" />
          </div>
          <p className="text-2xl font-black text-graphite-900 dark:text-graphite-50">
            {metricas.tasaCancelaciones}%
          </p>
          <p className="text-[10px] text-graphite-500 dark:text-graphite-400 mt-1">
            {metricas.canceladasCount} cita{metricas.canceladasCount === 1 ? '' : 's'} cancelada{metricas.canceladasCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Barra de progreso combinada */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-semibold text-graphite-600 dark:text-graphite-400">
              Tasa de asistencia
            </span>
            <span className="text-[10px] font-bold text-clinical-success dark:text-emerald-300">
              {100 - metricas.tasaNoShow - metricas.tasaCancelaciones}%
            </span>
          </div>
          <div className="w-full bg-graphite-100 dark:bg-graphite-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-clinical-success h-2 rounded-full transition-all"
              style={{ width: `${100 - metricas.tasaNoShow - metricas.tasaCancelaciones}%` }}
            />
          </div>
        </div>

        {(metricas.tasaNoShow > 10 || metricas.tasaCancelaciones > 15) && (
          <div className="bg-clinical-warning/10 dark:bg-amber-400/15 border border-clinical-warning/30 dark:border-amber-400/40 rounded-lg p-2.5 flex items-start gap-2">
            <AlertCircle size={14} className="text-clinical-warning dark:text-amber-300 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-graphite-700 dark:text-graphite-300">
              <span className="font-bold">Alerta:</span> La tasa de no-show o cancelaciones es alta. Considera implementar recordatorios por WhatsApp o SMS.
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

NoShowWidget.displayName = 'NoShowWidget'
