import { describe, it, expect, vi, beforeEach } from 'vitest'
import { clinicStorageService, KEY_CLINICA } from './clinicStorageService'
import { supabase, USE_SUPABASE } from '../../../../infrastructure/supabase/supabaseClient'
import { notificationService } from '../../../../infrastructure/notification/notificationService'
import { useSesionStore } from '../../../../app/stores/sesionStore'

vi.mock('../../../../infrastructure/supabase/supabaseClient', () => ({
  USE_SUPABASE: true,
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('../../../../infrastructure/notification/notificationService', () => ({
  notificationService: {
    mostrar: vi.fn(),
  },
}))

describe('clinicStorageService - Sincronización y Fail-Safe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('clinica_active_user', 'admin@test.cl')
    localStorage.setItem('profile_admin@test.cl', JSON.stringify({ clinicaId: 'clinica-123' }))
    useSesionStore.setState({ clinicaActual: 'clinica-123' })
  })

  it('sincronizarClinicaDesdeSupabase: lee de Supabase, escribe en caché y emite evento', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    const filaDb = {
      id: 'clinica-123',
      nombre: 'Clínica Dental Sincronizada',
      rut_empresa: '76.123.456-7',
      direccion: 'Av. Providencia 100',
    }

    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: filaDb, error: null }),
      }),
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: selectMock,
    })

    const resultado = await clinicStorageService.sincronizarClinicaDesdeSupabase('clinica-123')

    expect(resultado?.nombreClinica).toBe('Clínica Dental Sincronizada')
    expect(clinicStorageService.obtenerClinica()?.nombreClinica).toBe('Clínica Dental Sincronizada')
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'clinica_actualizada',
        detail: { nombre: 'Clínica Dental Sincronizada' },
      })
    )
  })

  it('guardarClinicaCompleta con error 403 (no admin): muestra toast de error y NO toca caché', async () => {
    // Configurar estado inicial en caché
    clinicStorageService.guardarClinica({
      nombreClinica: 'Clínica Original Intacta',
    })
    expect(clinicStorageService.obtenerClinica()?.nombreClinica).toBe('Clínica Original Intacta')

    // Mockear Supabase devolviendo 0 filas por RLS (código 403 / sin permisos)
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [], // 0 filas actualizadas
          error: null,
          status: 403,
        }),
      }),
    })

    vi.mocked(supabase.from).mockReturnValue({
      update: updateMock,
    })

    const ok = await clinicStorageService.guardarClinicaCompleta('clinica-123', {
      nombreClinica: 'Intento de Cambio Ilegítimo',
    })

    expect(ok).toBe(false)
    expect(notificationService.mostrar).toHaveBeenCalledWith(
      'Solo administradores pueden editar datos de la clínica',
      expect.objectContaining({ tipo: 'error' })
    )
    // Fail-safe verificado: el caché NO fue modificado
    expect(clinicStorageService.obtenerClinica()?.nombreClinica).toBe('Clínica Original Intacta')
  })

  it('guardarClinicaCompleta exitoso: persiste en Supabase, actualiza caché y emite evento', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'clinica-123', nombre: 'Clínica Actualizada Admin' }],
          error: null,
          status: 200,
        }),
      }),
    })

    vi.mocked(supabase.from).mockReturnValue({
      update: updateMock,
    })

    const ok = await clinicStorageService.guardarClinicaCompleta('clinica-123', {
      nombreClinica: 'Clínica Actualizada Admin',
    })

    expect(ok).toBe(true)
    expect(clinicStorageService.obtenerClinica()?.nombreClinica).toBe('Clínica Actualizada Admin')
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'clinica_actualizada',
        detail: { nombre: 'Clínica Actualizada Admin' },
      })
    )
  })
})
