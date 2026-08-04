import React, { memo, useState } from 'react'
import { PERIODOS_REPORTES } from './constants/reportesConstants'
import { useReportes } from './hooks/useReportes'
import { ReportesSummaryCards } from './components/ReportesSummaryCards'
import { RankingPrestacionesTable } from './components/RankingPrestacionesTable'
import { GraficoProductividad } from './components/GraficoProductividad'
import { RendimientoProfesionales } from './components/RendimientoProfesionales'
import { ReporteImprimibleA4 } from './components/ReporteImprimibleA4'

export const ReportesModulo = memo(({ pacientes = [], userProfile }) => {
  const [verReporteA4, setVerReporteA4] = useState(false)
  const { periodoSeleccionado, setPeriodoSeleccionado, metricas } = useReportes(pacientes)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">📊 Reportes Gerenciales & Métricas Clínicas</h2>
          <p className="text-xs text-gray-500">Inteligencia de negocios, rentabilidad de arancel y flujo de recaudación.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600">Período:</span>
          <select
            value={periodoSeleccionado}
            onChange={(e) => setPeriodoSeleccionado(e.target.value)}
            className="p-2 border rounded-xl bg-white font-bold text-xs"
          >
            {PERIODOS_REPORTES.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>

          <button
            onClick={() => setVerReporteA4(true)}
            className="bg-black text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
          >
            📄 Informe A4
          </button>
        </div>
      </div>

      <div className="print:hidden">
        <ReportesSummaryCards metricas={metricas} />
      </div>

      {verReporteA4 ? (
        <ReporteImprimibleA4
          metricas={metricas}
          userProfile={userProfile}
          alCerrar={() => setVerReporteA4(false)}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RankingPrestacionesTable topPrestaciones={metricas.topPrestaciones} />
            <GraficoProductividad desgloseEspecialidad={metricas.desgloseEspecialidad} />
          </div>

          <RendimientoProfesionales recaudacionPorMetodo={metricas.recaudacionPorMetodo} />
        </div>
      )}
    </div>
  )
})

ReportesModulo.displayName = 'ReportesModulo'