import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AceptarInvitacion } from './AceptarInvitacion'

// Mock de authService
vi.mock('../services/authService', () => ({
  aceptarInvitacion: vi.fn(),
  supabaseSignIn: vi.fn(),
  supabaseSignUp: vi.fn()
}))

// Mock de logger
vi.mock('../services/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  })
}))

import { aceptarInvitacion, supabaseSignIn, supabaseSignUp } from '../services/authService'

describe('AceptarInvitacion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock de window.location
    delete window.location
    window.location = { 
      hash: '#/aceptar-invita?token=valid-token-123',
      pathname: '/',
      href: 'http://localhost:5173/'
    }
    
    // Mock de window.history
    window.history = {
      replaceState: vi.fn()
    }
  })

  it('debe extraer token de la URL hash', async () => {
    render(<AceptarInvitacion />)
    
    // Debería mostrar formulario de login
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
  })

  it('debe mostrar error si no hay token en URL', async () => {
    window.location.hash = '#/otra-ruta'
    
    render(<AceptarInvitacion />)
    
    await waitFor(() => {
      expect(screen.getByText(/token de invitación no encontrado/i)).toBeInTheDocument()
    })
  })

  it('debe mostrar formulario de login por defecto', async () => {
    render(<AceptarInvitacion />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/nombre completo/i)).not.toBeInTheDocument()
    })
  })

  it('debe cambiar a modo registro', async () => {
    render(<AceptarInvitacion />)
    
    await waitFor(() => {
      expect(screen.getByText(/no tienes cuenta/i)).toBeInTheDocument()
    })
    
    const toggleButton = screen.getByText(/no tienes cuenta/i)
    fireEvent.click(toggleButton)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
      expect(screen.getByText(/ya tienes cuenta/i)).toBeInTheDocument()
    })
  })

  it('debe hacer login y aceptar invitación exitosamente', async () => {
    supabaseSignIn.mockResolvedValue({ success: true })
    aceptarInvitacion.mockResolvedValue({ success: true, clinicaId: 'clinica-123' })
    
    const onAceptarExitoso = vi.fn()
    
    render(<AceptarInvitacion onAceptarExitoso={onAceptarExitoso} />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } })
    
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    
    await waitFor(() => {
      expect(supabaseSignIn).toHaveBeenCalledWith('user@test.com', 'password123')
      expect(aceptarInvitacion).toHaveBeenCalledWith('valid-token-123')
    })
    
    // Debería mostrar mensaje de éxito
    await waitFor(() => {
      expect(screen.getByText(/invitación aceptada/i)).toBeInTheDocument()
    })
  })

  it('debe hacer signup y aceptar invitación exitosamente', async () => {
    supabaseSignUp.mockResolvedValue({ success: true })
    aceptarInvitacion.mockResolvedValue({ success: true, clinicaId: 'clinica-123' })
    
    render(<AceptarInvitacion />)
    
    await waitFor(() => {
      expect(screen.getByText(/no tienes cuenta/i)).toBeInTheDocument()
    })
    
    // Cambiar a modo registro
    fireEvent.click(screen.getByText(/no tienes cuenta/i))
    
    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    })
    
    fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Nuevo User' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'nuevo@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } })
    
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))
    
    await waitFor(() => {
      expect(supabaseSignUp).toHaveBeenCalledWith('nuevo@test.com', 'password123', {
        nombreCompleto: 'Nuevo User',
        email: 'nuevo@test.com'
      })
      expect(aceptarInvitacion).toHaveBeenCalledWith('valid-token-123')
    })
  })

  it('debe mostrar error si login falla', async () => {
    supabaseSignIn.mockResolvedValue({ error: 'Credenciales inválidas' })
    
    render(<AceptarInvitacion />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'wrong' } })
    
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument()
    })
  })

  it('debe mostrar error si aceptación de invitación falla', async () => {
    supabaseSignIn.mockResolvedValue({ success: true })
    aceptarInvitacion.mockResolvedValue({ success: false, error: 'Token expirado' })
    
    render(<AceptarInvitacion />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } })
    
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Token expirado')).toBeInTheDocument()
    })
  })

  it('debe limpiar hash de URL después de aceptar', async () => {
    supabaseSignIn.mockResolvedValue({ success: true })
    aceptarInvitacion.mockResolvedValue({ success: true, clinicaId: 'clinica-123' })
    
    render(<AceptarInvitacion />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
    
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } })
    
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    
    await waitFor(() => {
      expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/')
    })
  })
})
