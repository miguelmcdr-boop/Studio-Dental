import React, { memo } from 'react'
import { LayoutDashboard } from 'lucide-react'

export const DashboardHeader = memo(({ userProfile }) => {
  const hoyTexto = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-[#172554] dark:from-[#070B14] dark:via-[#0F172A] dark:to-[#1E293B] surgical:from-[#1E293B] surgical:via-[#334155] surgical:to-[#475569] border border-white/10 dark:border-[#24334A] surgical:border-[#64748B] text-white p-6 rounded-2xl shadow-md flex justify-between items-center flex-wrap gap-4 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#B88E3A] before:to-transparent">
      <div className="relative z-10">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight inline-flex items-center gap-2.5 text-white">
          <div className="p-2 rounded-xl bg-white/10 dark:bg-black/30 backdrop-blur-md border border-white/15 text-[#E5C378]">
            <LayoutDashboard size={20} />
          </div>
          <span>¡Bienvenido/a, <span className="text-[#E5C378] font-bold">{userProfile?.nombreCompleto || 'Dr. Profesional'}</span>!</span>
        </h1>
        <p className="text-xs text-slate-300 dark:text-graphite-300 capitalize mt-2 flex items-center gap-2">
          <span>{hoyTexto}</span>
          <span className="inline-block w-1 h-1 rounded-full bg-[#B88E3A]" />
          <span className="font-medium text-slate-200 dark:text-graphite-200">{userProfile?.especialidad || 'Cirujano Dentista'}</span>
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-2 bg-black/40 dark:bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs border border-white/15 shadow-inner">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-300 font-medium">Estado Consulta:</span>
        <span className="text-emerald-400 font-bold tracking-wide">Operativa Offline-First</span>
      </div>
    </div>
  )
})

DashboardHeader.displayName = 'DashboardHeader'