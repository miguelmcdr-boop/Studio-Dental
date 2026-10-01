/**
 * Tests — TopBar component (F7-25 Fase 4, Iteración 2)
 *
 * Valida logo, usuario, rol, logout, dark mode toggle y ClinicaSelector.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopBar } from './TopBar'

// Mock ClinicaSelector (hace llamadas async a authService)
vi.mock('./ClinicaSelector', () => ({
  ClinicaSelector: ({ onCambioClinica }) => (
    <div data-testid="clinica-selector" onClick={onCambioClinica}>
      Clínica Test
    </div>
  )
}))

describe('TopBar (F7-25)', () => {
  const mockUserProfile = {
    nombreCompleto: 'Dr. Miguel Díaz',
    email: 'miguel@clinica.com',
    rol: 'admin'
  }

  const defaultProps = {
    userProfile: mockUserProfile,
    onLogout: vi.fn(),
    darkMode: false,
    onToggleDarkMode: vi.fn(),
    onCambioClinica: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('renderizado básico', () => {
    it('renderiza el logo oficial DentikOS', () => {
      render(<TopBar {...defaultProps} />)
      expect(screen.getByText('Dentik')).toBeInTheDocument()
      expect(screen.getByText('OS')).toBeInTheDocument()
    })

    it('renderiza el nombre del usuario', () => {
      render(<TopBar {...defaultProps} />)
      expect(screen.getByText('Dr. Miguel Díaz')).toBeInTheDocument()
    })

    it('renderiza el rol del usuario', () => {
      render(<TopBar {...defaultProps} />)
      expect(screen.getByText('Administrador')).toBeInTheDocument()
    })

    it('renderiza ClinicaSelector', () => {
      render(<TopBar {...defaultProps} />)
      expect(screen.getByTestId('clinica-selector')).toBeInTheDocument()
    })
  })

  describe('avatar', () => {
    it('muestra la inicial del nombre (sin Dr./Dra.)', () => {
      render(<TopBar {...defaultProps} />)
      expect(screen.getByText('M')).toBeInTheDocument()
    })

    it('muestra U si no hay nombreCompleto', () => {
      render(<TopBar {...defaultProps} userProfile={{}} />)
      expect(screen.getByText('U')).toBeInTheDocument()
    })

    it('maneja Dra. correctamente', () => {
      render(<TopBar {...defaultProps} userProfile={{ nombreCompleto: 'Dra. Ana López', rol: 'dentista' }} />)
      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })

  describe('botón logout', () => {
    it('renderiza el botón de logout', () => {
      render(<TopBar {...defaultProps} />)
      expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument()
    })

    it('llama a onLogout al hacer click', () => {
      render(<TopBar {...defaultProps} />)
      fireEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }))
      expect(defaultProps.onLogout).toHaveBeenCalledTimes(1)
    })
  })

  describe('theme mode toggle (tri-estado)', () => {
    it('renderiza el toggle cuando onToggleDarkMode está presente', () => {
      render(<TopBar {...defaultProps} />)
      expect(screen.getByRole('button', { name: /activar modo oscuro/i })).toBeInTheDocument()
    })

    it('NO renderiza el toggle cuando onToggleDarkMode y onCycleTheme son undefined', () => {
      render(<TopBar {...defaultProps} onToggleDarkMode={undefined} onCycleTheme={undefined} />)
      expect(screen.queryByRole('button', { name: /activar modo/i })).not.toBeInTheDocument()
    })

    it('llama a onToggleDarkMode al hacer click cuando onCycleTheme no está definido', () => {
      render(<TopBar {...defaultProps} />)
      fireEvent.click(screen.getByRole('button', { name: /activar modo oscuro/i }))
      expect(defaultProps.onToggleDarkMode).toHaveBeenCalledTimes(1)
    })

    it('llama a onCycleTheme con prioridad al hacer click', () => {
      const mockCycle = vi.fn()
      render(<TopBar {...defaultProps} onCycleTheme={mockCycle} />)
      fireEvent.click(screen.getByRole('button', { name: /activar modo oscuro/i }))
      expect(mockCycle).toHaveBeenCalledTimes(1)
      expect(defaultProps.onToggleDarkMode).not.toHaveBeenCalled()
    })

    it('muestra "Activar modo quirúrgico" cuando darkMode=true o theme="dark"', () => {
      render(<TopBar {...defaultProps} darkMode={true} />)
      expect(screen.getByRole('button', { name: /activar modo quirúrgico/i })).toBeInTheDocument()
    })

    it('muestra "Activar modo claro" cuando theme="surgical"', () => {
      render(<TopBar {...defaultProps} theme="surgical" />)
      expect(screen.getByRole('button', { name: /activar modo claro/i })).toBeInTheDocument()
    })
  })

  describe('ClinicaSelector', () => {
    it('pasa onCambioClinica a ClinicaSelector', () => {
      render(<TopBar {...defaultProps} />)
      fireEvent.click(screen.getByTestId('clinica-selector'))
      expect(defaultProps.onCambioClinica).toHaveBeenCalledTimes(1)
    })
  })

  describe('usuario sin perfil', () => {
    it('muestra "Mi sesión" si no hay nombreCompleto', () => {
      render(<TopBar {...defaultProps} userProfile={{}} />)
      expect(screen.getByText('Mi sesión')).toBeInTheDocument()
    })

    it('muestra "Usuario" si no hay rol', () => {
      render(<TopBar {...defaultProps} userProfile={{ nombreCompleto: 'Test' }} />)
      expect(screen.getByText('Usuario')).toBeInTheDocument()
    })
  })
})
