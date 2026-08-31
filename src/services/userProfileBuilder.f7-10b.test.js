/**
 * F7-10b: Tests de construirUserProfile con rol contextual
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock authService antes de importar userProfileBuilder
vi.mock('./authService', () => ({
  USE_SUPABASE: true,
  obtenerRolEnClinicaActual: vi.fn()
}))

import { construirUserProfile } from './userProfileBuilder'
import { obtenerRolEnClinicaActual } from './authService'

describe('F7-10b: construirUserProfile con rol contextual', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe usar rol contextual de miembros_clinica cuando existe', async () => {
    obtenerRolEnClinicaActual.mockResolvedValue('admin')

    const userProfile = await construirUserProfile(
      'test@example.com',
      { role: 'recepcion', full_name: 'Test User' },
      {}
    )

    expect(obtenerRolEnClinicaActual).toHaveBeenCalled()
    expect(userProfile.rol).toBe('admin') // Rol contextual, NO el global
    expect(userProfile.email).toBe('test@example.com')
    expect(userProfile.nombreCompleto).toBe('Test User')
  })

  it('debe hacer fallback a userMetadata.role si no hay membresía', async () => {
    obtenerRolEnClinicaActual.mockResolvedValue(null)

    const userProfile = await construirUserProfile(
      'test@example.com',
      { role: 'dentista', full_name: 'Test User' },
      {}
    )

    expect(userProfile.rol).toBe('dentista') // Fallback al global
  })

  it('debe hacer fallback a metadata.rol si userMetadata no tiene role', async () => {
    obtenerRolEnClinicaActual.mockResolvedValue(null)

    const userProfile = await construirUserProfile(
      'test@example.com',
      { full_name: 'Test User' },
      { rol: 'asistente' }
    )

    expect(userProfile.rol).toBe('asistente')
  })

  it('debe retornar userProfile con estructura correcta', async () => {
    obtenerRolEnClinicaActual.mockResolvedValue('admin')

    const userProfile = await construirUserProfile(
      'test@example.com',
      { 
        role: 'recepcion',
        full_name: 'Dr. Test',
        rut: '12345678-9',
        especialidad: 'Odontología',
        clinicaId: 'clinica-123'
      },
      {}
    )

    expect(userProfile).toEqual({
      email: 'test@example.com',
      nombreCompleto: 'Dr. Test',
      rut: '12345678-9',
      especialidad: 'Odontología',
      rol: 'admin', // Contextual
      clinicaId: 'clinica-123',
      supabaseAuth: true
    })
  })

  it('debe manejar error en obtenerRolEnClinicaActual gracefully', async () => {
    obtenerRolEnClinicaActual.mockRejectedValue(new Error('DB error'))

    const userProfile = await construirUserProfile(
      'test@example.com',
      { role: 'recepcion', full_name: 'Test User' },
      {}
    )

    // Debe hacer fallback al rol global sin romper
    expect(userProfile.rol).toBe('recepcion')
  })
})
