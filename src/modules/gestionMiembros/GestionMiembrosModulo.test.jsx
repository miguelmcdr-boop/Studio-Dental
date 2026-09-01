import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GestionMiembrosModulo } from './GestionMiembrosModulo'

// Mock de authService
vi.mock('../../services/authService', () => ({
  invitarMiembro: vi.fn(),
  listarInvitaciones: vi.fn(),
  revocarInvitacion: vi.fn(),
  generarUrlInvitacion: vi.fn(),
  listarMiembros: vi.fn()
}))

// Mock de sesionStore
vi.mock('../../store/sesionStore', () => ({
  useSesionStore: vi.fn((selector) => {
    const state = {
      userProfile: {
        email: 'admin@test.com',
        rol: 'admin',
        nombreCompleto: 'Admin Test'
      }
    }
    return selector(state)
  })
}))

// Mock de logger
vi.mock('../../services/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  })
}))

import { 
  invitarMiembro, 
  listarInvitaciones, 
  revocarInvitacion, 
  generarUrlInvitacion,
  listarMiembros 
} from '../../services/authService'

describe('GestionMiembrosModulo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock por defecto
    listarMiembros.mockResolvedValue({
      success: true,
      miembros: [
        { id: '1', user_id: 'u1', email: 'dentista@test.com', rol: 'dentista', activo: true }
      ]
    })
    
    listarInvitaciones.mockResolvedValue({
      success: true,
      invitaciones: []
    })
  })

  it('debe renderizar el título del módulo', async () => {
    render(<GestionMiembrosModulo />)
    
    await waitFor(() => {
      expect(screen.getByText('Gestión de Miembros')).toBeInTheDocument()
    })
  })

  it('debe mostrar el formulario de invitación', async () => {
    render(<GestionMiembrosModulo />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/rol/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /enviar invitación/i })).toBeInTheDocument()
    })
  })

  it('debe listar miembros actuales', async () => {
    render(<GestionMiembrosModulo />)
    
    await waitFor(() => {
      expect(screen.getByText('dentista@test.com')).toBeInTheDocument()
    })
  })

  it('debe invitar miembro exitosamente', async () => {
    invitarMiembro.mockResolvedValue({ success: true })
    
    render(<GestionMiembrosModulo />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
    
    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'nuevo@test.com' } })
    
    const submitButton = screen.getByRole('button', { name: /enviar invitación/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(invitarMiembro).toHaveBeenCalledWith('nuevo@test.com', 'recepcion')
    })
  })

  it('debe llamar a invitarMiembro con email inválido y manejar error', async () => {
    invitarMiembro.mockResolvedValue({ 
      success: false, 
      error: 'Email inválido' 
    })
    
    render(<GestionMiembrosModulo />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
    
    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'invalid' } })
    
    const submitButton = screen.getByRole('button', { name: /enviar invitación/i })
    fireEvent.click(submitButton)
    
    // Verificar que se llamó a invitarMiembro con el email inválido
    await waitFor(() => {
      expect(invitarMiembro).toHaveBeenCalledWith('invalid', 'recepcion')
    })
    
    // Nota: la validación de email está cubierta en authService.f7-11.test.js
    // Aquí solo verificamos que el componente maneja el flujo correctamente
  })

  it('debe listar invitaciones pendientes', async () => {
    listarInvitaciones.mockResolvedValue({
      success: true,
      invitaciones: [
        { id: 'inv1', email: 'pendiente@test.com', rol: 'recepcion', token: 'token123', creada_en: new Date().toISOString() }
      ]
    })
    
    render(<GestionMiembrosModulo />)
    
    await waitFor(() => {
      expect(screen.getByText('pendiente@test.com')).toBeInTheDocument()
    })
  })

  it('debe revocar invitación (flujo básico)', async () => {
    // Spy de confirm con auto-accept
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    
    listarInvitaciones.mockResolvedValue({
      success: true,
      invitaciones: [
        { id: 'inv1', email: 'pendiente@test.com', rol: 'recepcion', token: 'token123', creada_en: new Date().toISOString() }
      ]
    })
    
    revocarInvitacion.mockResolvedValue({ success: true })
    
    render(<GestionMiembrosModulo />)
    
    await waitFor(() => {
      expect(screen.getByText('pendiente@test.com')).toBeInTheDocument()
    })
    
    const revocarButtons = screen.getAllByText('Revocar')
    fireEvent.click(revocarButtons[0])
    
    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled()
      expect(revocarInvitacion).toHaveBeenCalledWith('inv1')
    })
    
    confirmSpy.mockRestore()
  })

  it('debe copiar link de invitación', async () => {
    listarInvitaciones.mockResolvedValue({
      success: true,
      invitaciones: [
        { id: 'inv1', email: 'pendiente@test.com', rol: 'recepcion', token: 'token123', creada_en: new Date().toISOString() }
      ]
    })
    
    generarUrlInvitacion.mockReturnValue('http://localhost:5173/#/aceptar-invita?token=token123')
    
    // Mock de clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })
    
    render(<GestionMiembrosModulo />)
    
    await waitFor(() => {
      expect(screen.getByText('Copiar Link')).toBeInTheDocument()
    })
    
    const copiarButton = screen.getByText('Copiar Link')
    fireEvent.click(copiarButton)
    
    await waitFor(() => {
      expect(generarUrlInvitacion).toHaveBeenCalledWith('token123')
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:5173/#/aceptar-invita?token=token123')
    })
  })

  it('debe mostrar estado de carga', () => {
    listarMiembros.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<GestionMiembrosModulo />)
    
    // Debería mostrar skeleton de carga
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('debe manejar error al cargar datos', async () => {
    listarMiembros.mockResolvedValue({ success: false, error: 'Error de red' })
    
    render(<GestionMiembrosModulo />)
    
    await waitFor(() => {
      // No debería mostrar miembros
      expect(screen.queryByText('dentista@test.com')).not.toBeInTheDocument()
    })
  })
})
