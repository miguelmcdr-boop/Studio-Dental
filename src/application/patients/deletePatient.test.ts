import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deletePatient } from './deletePatient'
import { pacientesStorageService } from '../../domains/clinical/patient'
import { odontogramaStorageService } from '../../domains/clinical/odontogram'
import { periodontogramaStorageService } from '../../domains/specialty/perio'
import { presupuestosStorageService } from '../../domains/billing/budget'
import * as paymentDomain from '../../domains/billing/payment'
import * as adjuntosModule from '../../services/adjuntosStorageService'

describe('deletePatient (Application Service)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('debe fallar si no se proporciona pacienteId', async () => {
    const res = await deletePatient({ pacienteId: '' })
    expect(res.success).toBe(false)
    expect(res.error).toBeDefined()
  })

  it('debe rechazar la eliminación si el rol no tiene permisos', async () => {
    const res = await deletePatient({
      pacienteId: 'pac-1',
      userRole: 'recepcion',
    })
    expect(res.success).toBe(false)
    expect(res.error).toContain('permisos suficientes')
  })

  it('debe retornar error si el almacenamiento falla al hacer soft delete', async () => {
    vi.spyOn(pacientesStorageService, 'eliminarPaciente').mockResolvedValue(false)

    const res = await deletePatient({
      pacienteId: 'pac-1',
      userRole: 'admin',
    })
    expect(res.success).toBe(false)
    expect(res.error).toContain('No se pudo eliminar')
  })

  it('debe coordinar la eliminación en cascada de todos los datos asociados al tener éxito', async () => {
    vi.spyOn(pacientesStorageService, 'eliminarPaciente').mockResolvedValue(true)
    const spyEvoluciones = vi
      .spyOn(pacientesStorageService, 'eliminarEvolucionesDePaciente')
      .mockImplementation(() => {})
    const spyRecetas = vi
      .spyOn(pacientesStorageService, 'eliminarRecetasDePaciente')
      .mockImplementation(() => {})
    const spyItem = vi
      .spyOn(pacientesStorageService, 'eliminarItem')
      .mockImplementation(() => {})
    const spyOdonto = vi
      .spyOn(odontogramaStorageService, 'eliminarOdontogramasDePaciente')
      .mockImplementation(() => {})
    const spyPerio = vi
      .spyOn(periodontogramaStorageService, 'eliminarDatosDePaciente')
      .mockImplementation(() => {})
    const spyPresupuesto = vi
      .spyOn(presupuestosStorageService, 'eliminarItemsDePaciente')
      .mockImplementation(() => {})
    const spyAbonos = vi
      .spyOn(paymentDomain, 'eliminarAbonosDePaciente')
      .mockImplementation(() => {})
    const spyAdjuntos = vi
      .spyOn(adjuntosModule, 'eliminarTodosPorPaciente')
      .mockResolvedValue(true)

    const res = await deletePatient({
      pacienteId: 'pac-123',
      userRole: 'admin',
      userEmail: 'admin@studiodental.cl',
    })

    expect(res.success).toBe(true)
    expect(spyEvoluciones).toHaveBeenCalledWith('pac-123')
    expect(spyRecetas).toHaveBeenCalledWith('pac-123')
    expect(spyItem).toHaveBeenCalledWith('certificados_pac-123')
    expect(spyItem).toHaveBeenCalledWith('consentimientos_pac-123')
    expect(spyOdonto).toHaveBeenCalledWith('pac-123')
    expect(spyPerio).toHaveBeenCalledWith('pac-123')
    expect(spyPresupuesto).toHaveBeenCalledWith('pac-123')
    expect(spyAbonos).toHaveBeenCalledWith('pac-123')
    expect(spyAdjuntos).toHaveBeenCalledWith('pac-123')
  })
})
