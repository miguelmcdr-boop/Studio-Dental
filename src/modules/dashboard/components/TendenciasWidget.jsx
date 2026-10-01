import React, { memo, useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
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
      <div className="bg-[#0F172A]/95 dark:bg-[#070B14]/95 backdrop-blur-md border border-[#E5C378]/40 rounded-xl p-3 shadow-2xl">
        <p className="text-[10px] font-bold text-graphite-300 mb-1 uppercase tracking-wider">
          {formatearFechaCorta(label)}
        </p>
        <p className="text-xs text-white font-extrabold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gold-satin inline-block" />
          Citas Clínicas: <span className="font-black text-gold-satin tabular-nums">{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}

export const TendenciasWidget = memo(({ tendenciaCitas7Dias = [], tendenciaCitas30Dias = [] }) => {
  const [periodo, setPeriodo] = useState('7d')

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
      <div className="relative overflow-hidden bg-surface/90 backdrop-blur-md border border-surface rounded-2xl p-6 text-center before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#E5C378]/40 before:to-transparent">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-graphite-800 text-gold-solid dark:text-gold-satin mb-3">
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
    <div className="relative overflow-hidden bg-surface/90 backdrop-blur-md border border-surface rounded-2xl p-5 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#E5C378] before:to-transparent" role="region" aria-label="Tendencias de citas">
      <div className="flex items-center justify-between mb-4 border-b border-surface pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-graphite-900 dark:text-graphite-50 flex items-center gap-2 tracking-tight">
            <TrendingUp size={16} className="text-gold-solid dark:text-gold-satin" />
            Tendencias de Flujo Quirúrgico
          </h3>
          <span className="text-[10px] text-graphite-500 dark:text-graphite-400 font-medium">
            Dinámica comparativa de citas y volumen clínico
          </span>
        </div>

        <div className="flex gap-1 bg-slate-100 dark:bg-graphite-800 surgical:bg-graphite-300 rounded-xl p-1 border border-surface">
          <button
            type="button"
            onClick={() => setPeriodo('7d')}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all duration-150 cursor-pointer ${
              periodo === '7d'
                ? 'bg-white dark:bg-graphite-950 surgical:bg-white text-gold-solid dark:text-gold-satin shadow-xs'
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
                ? 'bg-white dark:bg-graphite-950 surgical:bg-white text-gold-solid dark:text-gold-satin shadow-xs'
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
        <div className="bg-gold-satin/10 dark:bg-gold-satin/5 border border-gold-satin/20 rounded-xl p-3 text-center">
          <p className="text-[9px] font-bold text-gold-solid dark:text-gold-satin uppercase tracking-wider mb-0.5">
            Promedio diario
          </p>
          <p className="text-xl font-black text-graphite-900 dark:text-gold-satin tabular-nums">{metricas.promedio}</p>
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
        <div className="bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/40 rounded-xl p-3 text-center">
          <p className="text-[9px] font-bold text-sky-700 dark:text-[#38BDF8] uppercase tracking-wider mb-0.5">
            Día más bajo
          </p>
          <p className="text-xl font-black text-graphite-900 dark:text-graphite-50 tabular-nums">{metricas.min}</p>
        </div>
      </div>

      {/* Gráfico Recharts con gradiente Oro y sin cuadrícula vertical */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {periodo === '7d' ? (
            <AreaChart data={datos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tendenciaOroGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E5C378" stopOpacity={0.20} />
                  <stop offset="95%" stopColor="#B88E3A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229,195,120,0.12)" />
              <XAxis
                dataKey="fecha"
                tickFormatter={formatearFechaCorta}
                tick={{ fontSize: 9, fill: 'currentColor' }}
                className="text-graphite-500 dark:text-graphite-400"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'currentColor' }}
                className="text-graphite-500 dark:text-graphite-400"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="citas"
                stroke="#E5C378"
                strokeWidth={2.5}
                fill="url(#tendenciaOroGradient)"
                dot={{ r: 3.5, fill: '#E5C378', strokeWidth: 1.5, stroke: '#070B14' }}
                activeDot={{ r: 5.5, fill: '#B88E3A', stroke: '#E5C378', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={datos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barOroGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E5C378" />
                  <stop offset="100%" stopColor="#B88E3A" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229,195,120,0.12)" />
              <XAxis
                dataKey="fecha"
                tickFormatter={formatearFechaCorta}
                tick={{ fontSize: 8, fill: 'currentColor' }}
                className="text-graphite-500 dark:text-graphite-400"
                interval="preserveStartEnd"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'currentColor' }}
                className="text-graphite-500 dark:text-graphite-400"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="citas" fill="url(#barOroGradient)" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
})

TendenciasWidget.displayName = 'TendenciasWidget'
