export {
  obtenerCitasDelDia,
  obtenerPacientesEnEspera,
  obtenerPacientesEnAtencion,
  obtenerTodosLosPagosDashboard,
  obtenerIngresosDelDia,
  obtenerPresupuestosDashboard,
  obtenerAlertasOperativasDashboard,
  obtenerResumenConsultasDashboard,
  type ResumenConsultasDashboard,
} from './dashboardQueries'

export {
  obtenerDatosConsolidadosReportes,
  obtenerProductividadPorProfesional,
  obtenerRankingPrestaciones,
  obtenerIngresosPorPeriodo,
  type DatosReportesConsolidados,
  type ProductividadProfesional,
  type ItemRankingPrestacion,
  type IngresosPeriodoResumen,
} from './reportQueries'
