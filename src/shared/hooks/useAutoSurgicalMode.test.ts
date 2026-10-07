import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAutoSurgicalMode } from './useAutoSurgicalMode'
import { agendaStorageService } from '../../domains/operations/agenda/services/agendaStorageService'
import { notificationService } from '../../infrastructure/notification/notificationService'
import { useSidebarStore } from '../../app/stores/useSidebarStore'
import { useThemeStore } from '../../app/stores/useThemeStore'

vi.mock('../../domains/operations/agenda/services/agendaStorageService', () => ({
  agendaStorageService: {
    obtenerCitas: vi.fn(),
  },
}))

describe('useAutoSurgicalMode (Blueprint 02)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    notificationService.limpiar()
    useSidebarStore.setState({ theme: 'light' })
    useThemeStore.setState({ theme: 'light' })
  })

  it('no notifica si no hay citas próximas de cirugía', () => {
    vi.mocked(agendaStorageService.obtenerCitas).mockReturnValue([])
    const spy = vi.spyOn(notificationService, 'info')

    renderHook(() => useAutoSurgicalMode())
    expect(spy).not.toHaveBeenCalled()
  })

  it('notifica si hay cirugía programada dentro de los próximos 15 minutos', () => {
    const ahora = new Date()
    const citaPronta = new Date(ahora.getTime() + 10 * 60 * 1000)
    const anio = citaPronta.getFullYear()
    const mes = String(citaPronta.getMonth() + 1).padStart(2, '0')
    const dia = String(citaPronta.getDate()).padStart(2, '0')
    const fecha = `${anio}-${mes}-${dia}`
    const hora = citaPronta.toTimeString().slice(0, 5)

    vi.mocked(agendaStorageService.obtenerCitas).mockReturnValue([
      {
        id: 'cita-1',
        fecha,
        hora,
        motivo: 'Cirugía de cordales',
        tipo: 'cirugia',
        pacienteId: 'pac-1',
      } as any,
    ])
    const spy = vi.spyOn(notificationService, 'info')

    renderHook(() => useAutoSurgicalMode())
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('¿Activar Modo Quirúrgico'),
      expect.objectContaining({ dismissable: true })
    )
  })

  it('no notifica si el tema ya es quirúrgico', () => {
    useSidebarStore.setState({ theme: 'surgical' })
    const spy = vi.spyOn(notificationService, 'info')

    renderHook(() => useAutoSurgicalMode())
    expect(spy).not.toHaveBeenCalled()
  })
})
