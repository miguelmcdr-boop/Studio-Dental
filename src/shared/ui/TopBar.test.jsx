/**
 * Tests — TopBar component (Blueprint 02)
 * Valida breadcrumbs, usuario, rol, logout, ClinicaSelector, selector de sede y ocultamiento en modo quirúrgico.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopBar } from './TopBar'

// Mock ClinicaSelector
vi.mock('./ClinicaSelector', () => ({
  ClinicaSelector: ({ onCambioClinica }) => (
    <div data-testid="clinica-selector" onClick={onCambioClinica}>
      Clínica Test
    </div>
  ),
}))

// Mock SelectorSede
vi.mock('./SelectorSede', () => ({
  SelectorSede: () => <div data-testid="selector-sede">Sede Central</div>,
}))

describe('TopBar (Blueprint 02)', () => {
  const mockUserProfile = {
    nombreCompleto: 'Dr. Miguel Díaz',
    email: 'miguel@clinica.com',
    rol: 'admin',
  }

  const defaultProps = {
    userProfile: mockUserProfile,
    onLogout: vi.fn(),
    onCambioClinica: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('renderizado básico y breadcrumbs', () => {
    it('renderiza breadcrumbs por defecto (Dashboard)', () => {
      render(<TopBar {...defaultProps} />)
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('renderiza breadcrumbs anidados personalizados', () => {
      const breadcrumbs = [
        { label: 'Pacientes', onClick: vi.fn() },
        { label: 'Juan Pérez' },
      ]
      render(<TopBar {...defaultProps} breadcrumbs={breadcrumbs} />)
      expect(screen.getByText('Pacientes')).toBeInTheDocument()
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    it('renderiza el nombre y rol del usuario', () => {
      render(<TopBar {...defaultProps} />)
      expect(screen.getByText('Dr. Miguel Díaz')).toBeInTheDocument()
      expect(screen.getByText('Administrador')).toBeInTheDocument()
    })

    it('renderiza ClinicaSelector y SelectorSede', () => {
      render(<TopBar {...defaultProps} />)
      expect(screen.getByTestId('clinica-selector')).toBeInTheDocument()
      expect(screen.getByTestId('selector-sede')).toBeInTheDocument()
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

  describe('botón de logout en menú', () => {
    it('abre menú al clickear avatar y ejecuta onLogout', () => {
      render(<TopBar {...defaultProps} />)
      const trigger = screen.getByRole('button', { name: /menú de usuario/i })
      fireEvent.click(trigger)

      const logoutBtn = screen.getByRole('menuitem', { name: /cerrar sesión/i })
      expect(logoutBtn).toBeInTheDocument()
      fireEvent.click(logoutBtn)
      expect(defaultProps.onLogout).toHaveBeenCalledTimes(1)
    })
  })

  describe('modo quirúrgico', () => {
    it('se oculta completamente cuando theme="surgical"', () => {
      const { container } = render(<TopBar {...defaultProps} theme="surgical" />)
      expect(container.querySelector('header')).not.toBeInTheDocument()
    })
  })

  describe('centro de notificaciones y búsqueda', () => {
    it('renderiza botón de notificaciones y botón de búsqueda ⌘K', () => {
      const onOpenSearch = vi.fn()
      render(<TopBar {...defaultProps} onOpenSearch={onOpenSearch} />)

      const searchBtn = screen.getByRole('button', { name: /buscar pacientes y módulos/i })
      expect(searchBtn).toBeInTheDocument()
      fireEvent.click(searchBtn)
      expect(onOpenSearch).toHaveBeenCalledTimes(1)

      const notifBtn = screen.getByRole('button', { name: /centro de notificaciones/i })
      expect(notifBtn).toBeInTheDocument()
    })
  })
})
