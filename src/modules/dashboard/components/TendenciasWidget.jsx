/**
 * TendenciasWidget — F7-27
 *
 * Widget de Dashboard que muestra tendencias históricas de citas.
 * Usa recharts para gráficos de líneas/barras.
 *
 * Características:
 * - Gráfico de líneas: últimos 7 días
 * - Gráfico de barras: últimos 30 días
 * - Toggle: 7 días / 30 días
 * - Tooltip con detalles al hover
 * - Métricas: promedio diario, día pico, día más bajo
 */
import React, { memo, useMemo, useState } from 'react'
import { TrendingUp, Calendar } from 'lucide-react'
import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const formatearFechaCorta = (fechaIso) => {
  if (!fechaIso) return ''
  const fecha = new Date(fechaIso + 'T00:00:00')
  const dia = fecha.getDate()
  const mes = fecha.toLocaleDateString('es-CL', { month: 'short' })
  return `${dia} ${mes}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] border border-graphite-200 dark:border-[#24334A] surgical:border-[#475569] rounded-lg p-3 shadow-lg">
        <p className="text-xs font-bold text-graphite-900 dark:text-graphite-50 mb-1">
          {formatearFechaCorta(label)}
        </p>
        <p className="text-[10px] text-graphite-600 dark:text-graphite-400">
          Citas: <span className="font-bold text-clinical-info dark:text-sky-300">{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}

export const TendenciasWidget = memo(({ tendenciaCitas7Dias = [], tendenciaCitas30Dias = [] }) => {
  const [periodo, setPeriodo] = useState('7d') // '7d' | '30d'

  const datos = periodo === '7d' ? tendenciaCitas7Dias : tendenciaCitas30Dias

  const metricas = useMemo(() => {
    if (!datos || datos.length === 0) {
      return { promedio: 0, max: 0, min: 0, diaPico: null }
    }

    const totales = datos.map((d) => d.citas)
    const promedio = Math.round(totales.reduce((a, b) => a + b, 0) / totales.length)
    const max = Math.max(...totales)
    const min = Math.min(...totales)
    const diaPico = datos.find((d) => d.citas === max)

    return { promedio, max, min, diaPico }
  }, [datos])

  if ((!tendenciaCitas7Dias || tendenciaCitas7Dias.length === 0) &&
      (!tendenciaCitas30Dias || tendenciaCitas30Dias.length === 0)) {
    return (
      <div className="relative overflow-hidden bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl p-6 text-center before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#0EA5E9]/40 before:to-transparent">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 mb-3">
          <TrendingUp size={22} />
        </div>
        <h4 className="text-sm font-bold text-graphite-800 dark:text-graphite-100 mb-1">
          Sin datos de tendencias
        </h4>
        <p className="text-xs text-graphite-500 dark:text-graphite-400">
          Agrega citas para ver tendencias históricas.
        </p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-white/90 dark:bg-[#0F172A]/90 surgical:bg-[#F1F5F9] backdrop-blur-md border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] rounded-2xl p-5 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#0EA5E9]/40 before:to-transparent" role="region" aria-label="Tendencias de citas">
      <div className="flex items-center justify-between mb-4 border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] pb-3">
        <h3 className="text-sm font-extrabold text-graphite-900 dark:text-graphite-50 flex items-center gap-2 tracking-tight">
          <TrendingUp size={16} className="text-[#0EA5E9]" />
          Tendencias de Citas
        </h3>
        <div className="flex gap-1 bg-slate-100 dark:bg-[#1E293B] surgical:bg-[#CBD5E1] rounded-xl p-1 border border-[#E2E8F0] dark:border-[#24334A]">
          <button
            type="button"
            onClick={() => setPeriodo('7d')}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all duration-150 cursor-pointer ${
              periodo === '7d'
                ? 'bg-white dark:bg-[#070B14] surgical:bg-white text-graphite-900 dark:text-graphite-50 shadow-xs'
                : 'text-graphite-500 dark:text-graphite-400 hover:text-graphite-800 dark:hover:text-graphite-200'
            }`}
            aria-pressed={periodo === '7d'}
          >
            7 días
          </button>
          <button
            type="button"
            onClick={() => setPeriodo('30d')}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all duration-150 cursor-pointer ${
              periodo === '30d'
                ? 'bg-white dark:bg-[#070B14] surgical:bg-white text-graphite-900 dark:text-graphite-50 shadow-xs'
                : 'text-graphite-500 dark:text-graphite-400 hover:text-graphite-800 dark:hover:text-graphite-200'
            }`}
            aria-pressed={periodo === '30d'}
          >
            30 días
          </button>
        </div>
      </div>

      {/* Métricas resumidas */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/40 rounded-xl p-3 text-center">
          <p className="text-[9px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-0.5">
            Promedio diario
          </p>
          <p className="text-xl font-black text-graphite-900 dark:text-graphite-50 tabular-nums">{metricas.promedio}</p>
        </div>
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl p-3 text-center">
          <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-0.5">
            Día pico
          </p>
          <p className="text-xl font-black text-graphite-900 dark:text-graphite-50 tabular-nums">{metricas.max}</p>
          {metricas.diaPico && (
            <p className="text-[9px] text-graphite-500 dark:text-graphite-400 tabular-nums">{formatearFechaCorta(metricas.diaPico.fecha)}</p>
          )}
        </div>
        <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-xl p-3 text-center">
          <p className="text-[9px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-0.5">
            Día más bajo
          </p>
          <p className="text-xl font-black text-graphite-900 dark:text-graphite-50 tabular-nums">{metricas.min}</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {periodo === '7d' ? (
            <LineChart data={datos} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis
                dataKey="fecha"
                tickFormatter={formatearFechaCorta}
                tick={{ fontSize: 9, fill: 'currentColor' }}
                className="text-graphite-500 dark:text-graphite-400"
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'currentColor' }}
                className="text-graphite-500 dark:text-graphite-400"
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="citas"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ r: 3, fill: '#0ea5e9' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
            <BarChart data={datos} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis
                dataKey="fecha"
                tickFormatter={formatearFechaCorta}
                tick={{ fontSize: 8, fill: 'currentColor' }}
                className="text-graphite-500 dark:text-graphite-400"
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'currentColor' }}
                className="text-graphite-500 dark:text-graphite-400"
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="citas" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
})

TendenciasWidget.displayName = 'TendenciasWidget'
