import React, { memo, useState } from 'react'
import { PERIODOS_REPORTES } from './constants/reportesConstants'
import { useReportes } from './hooks/useReportes'
import { ReportesSummaryCards } from './components/ReportesSummaryCards'
import { RankingPrestacionesTable } from './components/RankingPrestacionesTable'
import { GraficoProductividad } from './components/GraficoProductividad'
import { RendimientoProfesionales } from './components/RendimientoProfesionales'
import { ReporteImprimibleLetter } from './components/ReporteImprimibleLetter'
import { usePacientesStore } from '../../store/pacientesStore'
import { useSesionStore } from '../../store/sesionStore'
import { exportService } from './services/exportService'

export const ReportesModulo = memo(() => {
  // (F2-02) — pacientes y userProfile ya no llegan como prop desde App.jsx: se leen directo de los stores.
  const pacientes = usePacientesStore((state) => state.pacientes)
  const userProfile = useSesionStore((state) => state.userProfile)

  const [verReporteLetter, setVerReporteLetter] = useState(false)
  const { periodoSeleccionado, setPeriodoSeleccionado, metricas } = useReportes(pacientes)


  const handleExportarPDF = () => {
    exportService.exportarReportePDF(metricas, userProfile)
  }

  const handleExportarExcel = () => {
    exportService.exportarReporteCompletoExcel(metricas, periodoSeleccionado)
  }

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
            onClick={handleExportarPDF}
            className="bg-gray-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
            aria-label="Exportar reporte como PDF"
            title="Exportar a PDF (abre diálogo de impresión)"
          >
            📄 Exportar PDF
          </button>
          <button
            onClick={handleExportarExcel}
            className="bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-emerald-800 transition-colors shadow-xs"
            aria-label="Exportar reporte completo como Excel"
            title="Descargar Excel con resumen, ranking y rendimiento"
          >
            📊 Exportar Excel
          </button>
          <button
            onClick={() => setVerReporteLetter(true)}
            className="bg-black text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-gray-800 transition-colors shadow-xs"
          >
            📄 Informe Letter
          </button>
        </div>
      </div>

      <div className="print:hidden">
        <ReportesSummaryCards metricas={metricas} />
      </div>

      {verReporteLetter ? (
        <ReporteImprimibleLetter
          metricas={metricas}
          userProfile={userProfile}
          alCerrar={() => setVerReporteLetter(false)}
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