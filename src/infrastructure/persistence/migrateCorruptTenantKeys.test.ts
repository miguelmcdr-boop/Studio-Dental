import { describe, it, expect, vi, beforeEach } from 'vitest'
import { migrateCorruptTenantKeys } from './migrateCorruptTenantKeys'

const { mockGetClinicaActivaSync } = vi.hoisted(() => ({
  mockGetClinicaActivaSync: vi.fn()
}))

vi.mock('../auth/authService', () => ({
  getClinicaActivaSync: mockGetClinicaActivaSync
}))

describe('migrateCorruptTenantKeys (Hotfix 3/4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('1. Migra claves corruptas al formato correcto', () => {
    mockGetClinicaActivaSync.mockReturnValue('clinica-uuid-123')

    const corruptKey = 'sd_[object Promise]_studio_dental_pacientes_v3'
    const datos = JSON.stringify([{ id: 'p1', nombre: 'Juan' }])
    localStorage.setItem(corruptKey, datos)

    const result = migrateCorruptTenantKeys()

    expect(result.migrated).toBe(1)
    expect(result.deleted).toBe(0)
    expect(result.failed).toBe(0)
    expect(result.clinicaId).toBe('clinica-uuid-123')

    const expectedCorrectKey = 'sd_clinica-uuid-123_studio_dental_pacientes_v3'
    expect(localStorage.getItem(expectedCorrectKey)).toBe(datos)
    expect(localStorage.getItem(corruptKey)).toBeNull()
  })

  it('2. No sobrescribe claves correctas existentes', () => {
    mockGetClinicaActivaSync.mockReturnValue('clinica-uuid-123')

    const corruptKey = 'sd_[object Promise]_studio_dental_agenda_citas_v3'
    const correctKey = 'sd_clinica-uuid-123_studio_dental_agenda_citas_v3'

    const corruptData = JSON.stringify([{ id: 'cita-corrupta' }])
    const existingData = JSON.stringify([{ id: 'cita-valida-existente' }])

    localStorage.setItem(corruptKey, corruptData)
    localStorage.setItem(correctKey, existingData)

    const result = migrateCorruptTenantKeys()

    expect(result.migrated).toBe(0)
    expect(result.deleted).toBe(1) // Eliminada para limpiar la corrupción
    expect(result.failed).toBe(0)

    // Preserva el dato existente correcto sin sobrescribirlo
    expect(localStorage.getItem(correctKey)).toBe(existingData)
    expect(localStorage.getItem(corruptKey)).toBeNull()
  })

  it('3. No hace nada si no hay clínica activa', () => {
    mockGetClinicaActivaSync.mockReturnValue(null)

    const corruptKey = 'sd_[object Promise]_studio_dental_pacientes_v3'
    localStorage.setItem(corruptKey, JSON.stringify([{ id: 'p1' }]))

    const result = migrateCorruptTenantKeys()

    expect(result.migrated).toBe(0)
    expect(result.deleted).toBe(0)
    expect(result.failed).toBe(0)
    expect(result.clinicaId).toBeNull()

    // No se toca la clave ya que no hay contexto de tenant
    expect(localStorage.getItem(corruptKey)).not.toBeNull()
  })
})
