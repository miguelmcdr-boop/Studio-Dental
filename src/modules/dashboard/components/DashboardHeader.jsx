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
    <div className="bg-slate-900 dark:bg-[#0F172A] surgical:bg-[#334155] border border-transparent dark:border-[#24334A] surgical:border-[#475569] text-white p-6 rounded-2xl shadow-sm flex justify-between items-center flex-wrap gap-4">
      <div>
        <h1 className="text-xl font-bold inline-flex items-center gap-2">
          <LayoutDashboard size={20} />
          ¡Bienvenido/a, {userProfile?.nombreCompleto || 'Dr. Profesional'}!
        </h1>
        <p className="text-xs text-gray-300 capitalize mt-1">
          {hoyTexto} | {userProfile?.especialidad || 'Cirujano Dentista'}
        </p>
      </div>

      <div className="bg-gray-800/80 px-4 py-2 rounded-xl text-xs border border-gray-700">
        <span className="text-emerald-400 font-bold">Estado Consulta:</span> Operativa Offline-First
      </div>
    </div>
  )
})

DashboardHeader.displayName = 'DashboardHeader'