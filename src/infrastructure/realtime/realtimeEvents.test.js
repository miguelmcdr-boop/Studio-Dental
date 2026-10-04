import { describe, it, expect } from 'vitest'
import { REALTIME_EVENTS, TABLAS_REALTIME } from './realtimeEvents'

describe('realtimeEvents', () => {
  it('define eventos canónicos para módulos sin Zustand', () => {
    expect(REALTIME_EVENTS.CITAS_CHANGED).toBe('realtime:citas_changed')
    expect(REALTIME_EVENTS.PRESUPUESTOS_CHANGED).toBe('realtime:presupuestos_changed')
    expect(REALTIME_EVENTS.PAGOS_CHANGED).toBe('realtime:pagos_changed')
    expect(REALTIME_EVENTS.FINANZAS_CHANGED).toBe('realtime:finanzas_changed')
    expect(REALTIME_EVENTS.EVOLUCIONES_CHANGED).toBe('realtime:evoluciones_changed')
  })

  it('mapea tablas a sus respectivos eventos', () => {
    expect(TABLAS_REALTIME.pacientes).toBeNull() // Usa store directamente
    expect(TABLAS_REALTIME.citas).toBe(REALTIME_EVENTS.CITAS_CHANGED)
    expect(TABLAS_REALTIME.pagos).toBe(REALTIME_EVENTS.PAGOS_CHANGED)
    expect(TABLAS_REALTIME.vademecum).toBe(REALTIME_EVENTS.VADEMECUM_CHANGED)
  })
})
