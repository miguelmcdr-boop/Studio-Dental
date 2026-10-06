import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginScreen } from './LoginScreen'
import * as authService from '../../infrastructure/auth/authService'

vi.mock('../../infrastructure/auth/authService', () => ({
  supabaseSignIn: vi.fn(),
  supabaseSignUp: vi.fn(),
  reenviarEmailVerificacion: vi.fn(),
  solicitarRecuperacionContrasena: vi.fn(),
  actualizarContrasena: vi.fn(),
}))

vi.mock('../../infrastructure/clinical-data/userProfileBuilder', () => ({
  construirUserProfile: vi.fn().mockResolvedValue({
    email: 'test@dentikos.cl',
    nombreCompleto: 'Dr. Test',
    rol: 'dentista',
  }),
}))

describe('Blueprint 01 - LoginScreen Split Screen & 9 Estados', () => {
  const onLoginMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renderiza la vista split screen con propuesta de valor y formulario', () => {
    render(<LoginScreen onLogin={onLoginMock} />)

    expect(screen.getByText(/El sistema operativo de la/i)).toBeInTheDocument()
    expect(screen.getByText(/Ficha clínica integrada/i)).toBeInTheDocument()
    expect(screen.getByTestId('login-email')).toBeInTheDocument()
    expect(screen.getByTestId('login-password')).toBeInTheDocument()
    expect(screen.getByTestId('login-submit')).toBeInTheDocument()
    expect(screen.getByText('Recordarme')).toBeInTheDocument()
    expect(screen.getByText('¿Olvidaste tu contraseña?')).toBeInTheDocument()
  })

  it('Estado 1: botón deshabilitado si campos están vacíos', () => {
    render(<LoginScreen onLogin={onLoginMock} />)
    const submitBtn = screen.getByTestId('login-submit')
    expect(submitBtn).toBeDisabled()
  })

  it('permite alternar visibilidad de contraseña', () => {
    render(<LoginScreen onLogin={onLoginMock} />)
    const passwordInput = screen.getByTestId('login-password')
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleBtn = screen.getByLabelText(/Ver contraseña/i)
    fireEvent.click(toggleBtn)
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('Estado 3: muestra error genérico ante fallo de credenciales', async () => {
    vi.mocked(authService.supabaseSignIn).mockResolvedValueOnce({
      success: false,
      error: 'Invalid login credentials',
    })

    render(<LoginScreen onLogin={onLoginMock} />)
    fireEvent.change(screen.getByTestId('login-email'), { target: { value: 'dr@ejemplo.com' } })
    fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'erronea123' } })

    fireEvent.click(screen.getByTestId('login-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toBeInTheDocument()
      expect(screen.getByTestId('login-error')).toHaveTextContent(/Email o contraseña incorrectos/i)
    })
  })

  it('abre el modal de recuperación de contraseña', () => {
    render(<LoginScreen onLogin={onLoginMock} />)
    fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Recuperar contraseña/i)).toBeInTheDocument()
  })
})
