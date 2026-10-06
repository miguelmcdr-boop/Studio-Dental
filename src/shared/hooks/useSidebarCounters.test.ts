import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSidebarCounters } from './useSidebarCounters'
import * as sidebarCounterUtils from '../utils/sidebarCounterUtils'
import * as badgeSoundUtils from '../utils/badgeSoundUtils'
import { agendaStorageService } from '../../domains/operations/agenda/services/agendaStorageService'
import { inventarioStorageService } from '../../domains/operations/inventory/services/inventarioStorageService'
import { obtenerFechaLocalISO } from '../utils/dateUtils'

vi.mock('../../domains/operations/agenda/services/agendaStorageService', () => ({
  agendaStorageService: {
    obtenerCitas: vi.fn(),
  },
}))

vi.mock('../../domains/operations/inventory/services/inventarioStorageService', () => ({
  inventarioStorageService: {
    obtenerItems: vi.fn(),
  },
}))

vi.mock('../../domains/clinical/patient/services/pacientesSoftDeleteService', () => ({
  listarPacientesEliminados: vi.fn().mockResolvedValue([{ id: 'p1' }]),
}))

vi.mock('../utils/dateUtils', () => ({
  obtenerFechaLocalISO: vi.fn(),
}))

describe('useSidebarCounters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(obtenerFechaLocalISO).mockReturnValue('2026-10-06')
    vi.mocked(agendaStorageService.obtenerCitas).mockReturnValue([
      { fecha: '2026-10-06' },
      { fecha: '2026-10-06' },
    ])
    vi.mocked(inventarioStorageService.obtenerItems).mockReturnValue([
      { cantidad: 2, minimoCritico: 5 },
    ])
    vi.spyOn(sidebarCounterUtils, 'contarCiclosEsterilizacionPendientes').mockReturnValue(3)
    vi.spyOn(sidebarCounterUtils, 'contarMensajesNoLeidos').mockReturnValue(4)
    vi.spyOn(sidebarCounterUtils, 'contarPagosVencidos').mockReturnValue(1)
  })

  it('retorna los contadores de los 5 módulos de Blueprint 02', async () => {
    const playSpy = vi.spyOn(badgeSoundUtils, 'playCriticoSound').mockImplementation(() => {})

    const { result } = renderHook(() => useSidebarCounters())

    expect(result.current.agenda).toBe(2)
    expect(result.current.agendaSinConfirmar).toBe(2)
    expect(result.current.inventario).toBe(1)
    expect(result.current.inventarioBajo).toBe(1)
    expect(result.current.esterilizacionPendiente).toBe(3)
    expect(result.current.mensajesNoLeidos).toBe(4)
    expect(result.current.pagosVencidos).toBe(1)

    // Debe emitir sonido crítico una vez al cargar si hay items en error
    expect(playSpy).toHaveBeenCalledTimes(1)
  })

  it('refresca contadores al llamar refrescar()', () => {
    const { result } = renderHook(() => useSidebarCounters())

    act(() => {
      result.current.refrescar()
    })

    expect(result.current.agendaSinConfirmar).toBe(2)
  })
})
