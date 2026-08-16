/**
 * Constantes de nombres de eventos Realtime (F5-02).
 *
 * Define los nombres canónicos de los eventos custom que se emiten
 * cuando hay cambios en tablas de Supabase que NO tienen store Zustand.
 *
 * Los hooks de módulos individuales (useAgenda, usePresupuestos, etc.)
 * pueden escuchar estos eventos para refrescarse cuando hay cambios
 * desde otros dispositivos.
 *
 * Uso en emisor (useRealtimeSync.js):
 *   window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.CITAS_CHANGED))
 *
 * Uso en receptor (hook de módulo):
 *   useEffect(() => {
 *     const handler = () => { /* refrescar datos *\/ }
 *     window.addEventListener(REALTIME_EVENTS.CITAS_CHANGED, handler)
 *     return () => window.removeEventListener(REALTIME_EVENTS.CITAS_CHANGED, handler)
 *   }, [])
 */

export const REALTIME_EVENTS = {
  // Eventos de módulos con estado local (sin store Zustand)
  CITAS_CHANGED: 'realtime:citas_changed',
  PRESUPUESTOS_CHANGED: 'realtime:presupuestos_changed',
  PAGOS_CHANGED: 'realtime:pagos_changed',
  FINANZAS_CHANGED: 'realtime:finanzas_changed',

  // Eventos de datos clínicos (hooks individuales escucharán en trabajo incremental)
  EVOLUCIONES_CHANGED: 'realtime:evoluciones_changed',
  RECETAS_CHANGED: 'realtime:recetas_changed',
  ODONTOGRAMA_CHANGED: 'realtime:odontograma_changed',
  PERIODONTOGRAMA_CHANGED: 'realtime:periodontograma_changed',

  // Eventos de inventario
  INVENTARIO_CHANGED: 'realtime:inventario_changed',

  // Eventos de datos de referencia (vademécum, alergias cruzadas, etc.)
  VADEMECUM_CHANGED: 'realtime:vademecum_changed'
}

/**
 * Tablas críticas que requieren sincronización en tiempo real.
 * Mapea nombre de tabla → nombre de evento a emitir.
 */
export const TABLAS_REALTIME = {
  pacientes: null, // Usa pacientesStore.refrescarDesdeSupabase()
  citas: REALTIME_EVENTS.CITAS_CHANGED,
  presupuestos: REALTIME_EVENTS.PRESUPUESTOS_CHANGED,
  presupuesto_items: REALTIME_EVENTS.PRESUPUESTOS_CHANGED,
  pagos: REALTIME_EVENTS.PAGOS_CHANGED,
  movimientos_financieros: REALTIME_EVENTS.FINANZAS_CHANGED,
  evoluciones_clinicas: REALTIME_EVENTS.EVOLUCIONES_CHANGED,
  recetas: REALTIME_EVENTS.RECETAS_CHANGED,
  odontogramas: REALTIME_EVENTS.ODONTOGRAMA_CHANGED,
  periodontogramas: REALTIME_EVENTS.PERIODONTOGRAMA_CHANGED,
  inventario: REALTIME_EVENTS.INVENTARIO_CHANGED,
  vademecum: REALTIME_EVENTS.VADEMECUM_CHANGED,
  vademecum_urgencia: REALTIME_EVENTS.VADEMECUM_CHANGED,
  vademecum_antirresortivos: REALTIME_EVENTS.VADEMECUM_CHANGED,
  alergias_cruzadas: REALTIME_EVENTS.VADEMECUM_CHANGED,
  interacciones_farmacologicas: REALTIME_EVENTS.VADEMECUM_CHANGED,
  profilaxis_endocarditis: REALTIME_EVENTS.VADEMECUM_CHANGED,
  manejo_anticoagulantes: REALTIME_EVENTS.VADEMECUM_CHANGED
}
