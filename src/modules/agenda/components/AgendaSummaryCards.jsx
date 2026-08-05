import React, { memo } from 'react'

export const AgendaSummaryCards = memo(({ resumen, citas = [] }) => {
  const arrayCitas = Array.isArray(citas) ? citas : []

  const totalHoy = resumen?.totalHoy ?? arrayCitas.length

  const enEsperaCount = resumen?.enEsperaCount ?? arrayCitas.filter(
    c => c?.estado === 'En Espera' || c?.estado === 'EnEspera'
  ).length

  const enSillonCount = resumen?.enSillonCount ?? arrayCitas.filter(
    c => c?.estado === 'En Sillón' || c?.estado === 'EnSillon'
  ).length

  const finalizadosCount = resumen?.finalizadosCount ?? arrayCitas.filter(
    c => c?.estado === 'Atendido' || c?.estado === 'Finalizado'
  ).length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Citas Programadas Hoy</span>
        <span className="text-2xl font-black text-gray-900 mt-1 block">{totalHoy} Atenciones</span>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">En Sala de Espera</span>
        <span className="text-2xl font-black text-amber-900 mt-1 block">
          {enEsperaCount} Pacientes
        </span>
      </div>

      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">En Sillón / Atención</span>
        <span className="text-2xl font-black text-emerald-900 mt-1 block">
          {enSillonCount} Pacientes
        </span>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl shadow-xs">
        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">Finalizados Hoy</span>
        <span className="text-2xl font-black text-gray-800 mt-1 block">
          {finalizadosCount} Completados
        </span>
      </div>
    </div>
  )
})

AgendaSummaryCards.displayName = 'AgendaSummaryCards'