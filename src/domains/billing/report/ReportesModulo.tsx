import React, { memo, useState } from 'react'
import { PERIODOS_REPORTES } from './constants/reportesConstants'
import { useReportes } from './hooks/useReportes'
import { ReportesSummaryCards } from './components/ReportesSummaryCards'
import { RankingPrestacionesTable } from './components/RankingPrestacionesTable'
import { GraficoProductividad } from './components/GraficoProductividad'
import { RendimientoProfesionales } from './components/RendimientoProfesionales'
import { ReporteImprimibleLetter } from './components/ReporteImprimibleLetter'
import { usePacientesStore } from '../../../app/stores/pacientesStore'
import { useSesionStore } from '../../../app/stores/sesionStore'
import { exportService } from './services/exportService'
import { FileText, BarChart3, FileSpreadsheet } from 'lucide-react'
import type { Paciente } from '../../../domains/clinical/patient/schemas/pacienteSchema'

export const ReportesModulo: React.FC = memo(() => {
  // (F2-02) — pacientes y userProfile ya no llegan como prop desde App.jsx: se leen directo de los stores.
  const pacientes = usePacientesStore((state: { pacientes: Paciente[] }) => state.pacientes)
  const userProfile = useSesionStore((state: { userProfile: { nombreCompleto?: string } | null }) => state.userProfile)

  const [verReporteLetter, setVerReporteLetter] = useState<boolean>(false)
  const { periodoSeleccionado, setPeriodoSeleccionado, metricas } = useReportes(pacientes)

  const handleExportarPDF = (): void => {
    exportService.exportarReportePDF(metricas, userProfile || undefined)
  }

  const handleExportarExcel = (): void => {
    exportService.exportarReporteCompletoExcel(metricas, periodoSeleccionado)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-graphite-50 uppercase tracking-wider inline-flex items-center gap-2">
            <BarChart3 size={20} />
            Reportes Gerenciales & Métricas Clínicas
          </h2>
          <p className="text-xs text-gray-500 dark:text-graphite-400">
            Inteligencia de negocios, rentabilidad de arancel y flujo de recaudación.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 dark:text-graphite-400">Período:</span>
          <select
            value={periodoSeleccionado}
            onChange={(e) => setPeriodoSeleccionado(e.target.value)}
            className="p-2 border border-gray-300 dark:border-graphite-600 rounded-xl bg-white dark:bg-graphite-800 font-bold text-xs"
          >
            {PERIODOS_REPORTES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportarPDF}
            className="bg-gray-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
            aria-label="Exportar reporte como PDF"
            title="Exportar a PDF (abre diálogo de impresión)"
          >
            <span className="inline-flex items-center gap-1">
              <FileText size={14} />
              Exportar PDF
            </span>
          </button>
          <button
            onClick={handleExportarExcel}
            className="bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
            aria-label="Exportar reporte completo como Excel"
            title="Descargar Excel con resumen, ranking y rendimiento"
          >
            <span className="inline-flex items-center gap-1">
              <FileSpreadsheet size={14} />
              Exportar Excel
            </span>
          </button>
          <button
            onClick={() => setVerReporteLetter(true)}
            className="bg-black text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
          >
            <span className="inline-flex items-center gap-1">
              <FileText size={14} />
              Informe Letter
            </span>
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
export default ReportesModulo
