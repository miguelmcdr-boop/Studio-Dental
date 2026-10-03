import React, { memo } from 'react'
import { LayoutDashboard, ShieldCheck } from 'lucide-react'

export interface UserProfileInfo {
  nombreCompleto?: string
  especialidad?: string
  [key: string]: unknown
}

export interface DashboardHeaderProps {
  userProfile?: UserProfileInfo | null
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = memo(({ userProfile }) => {
  const hoyTexto = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-[#172554] dark:from-[#070B14] dark:via-[#0F172A] dark:to-[#1E293B] surgical:from-[#1E293B] surgical:via-[#334155] surgical:to-[#475569] border border-white/10 dark:border-graphite-700/80 surgical:border-[#64748B] text-white p-6 rounded-2xl shadow-lg flex justify-between items-center flex-wrap gap-4 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#E5C378] before:to-transparent">
      <div className="relative z-10 space-y-1">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/5 dark:bg-black/40 border border-[#E5C378]/30 text-gold-satin text-[10px] font-bold uppercase tracking-widest">
          <ShieldCheck size={11} className="text-gold-satin" />
          <span>Consola Operativa Clínica</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-3 text-white">
          <div className="p-2 rounded-xl bg-white/10 dark:bg-black/40 backdrop-blur-md border border-[#E5C378]/25 text-gold-satin shadow-xs">
            <LayoutDashboard size={20} />
          </div>
          <span>
            Bienvenido/a, <span className="text-gold-satin font-black">{userProfile?.nombreCompleto || 'Dr. Profesional'}</span>
          </span>
        </h1>
        <p className="text-xs text-slate-300 dark:text-graphite-300 capitalize flex items-center gap-2 pt-0.5">
          <span className="font-medium text-slate-300 dark:text-graphite-300">{hoyTexto}</span>
          <span className="inline-block w-1 h-1 rounded-full bg-gold-satin" />
          <span className="font-semibold text-slate-100 dark:text-gold-satin/90 uppercase tracking-wide text-[11px]">
            {userProfile?.especialidad || 'Cirujano Dentista'}
          </span>
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-2.5 bg-black/40 dark:bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs border border-[#E5C378]/20 shadow-inner">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-slate-300 dark:text-graphite-300 font-medium">Cockpit Quirúrgico:</span>
        <span className="text-emerald-400 font-bold tracking-wide">Activo & Offline-First</span>
      </div>
    </div>
  )
})

DashboardHeader.displayName = 'DashboardHeader'
