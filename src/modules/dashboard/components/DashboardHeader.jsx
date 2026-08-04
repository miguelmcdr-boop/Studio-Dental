import React, { memo } from 'react'

export const DashboardHeader = memo(({ userProfile }) => {
  const hoyTexto = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="bg-black text-white p-6 rounded-2xl shadow-sm flex justify-between items-center flex-wrap gap-4">
      <div>
        <h1 className="text-xl font-bold">
          ¡Bienvenido/a, {userProfile?.nombreCompleto || 'Dr. Profesional'}! 👋
        </h1>
        <p className="text-xs text-gray-300 capitalize mt-1">
          {hoyTexto} | {userProfile?.especialidad || 'Cirujano Dentista'}
        </p>
      </div>

      <div className="bg-gray-800/80 px-4 py-2 rounded-xl text-xs border border-gray-700">
        <span className="text-emerald-400 font-bold">🟢 Estado Consulta:</span> Operativa Offline-First
      </div>
    </div>
  )
})

DashboardHeader.displayName = 'DashboardHeader'