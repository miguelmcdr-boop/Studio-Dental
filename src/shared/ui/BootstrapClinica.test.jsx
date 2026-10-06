import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BootstrapClinica } from './BootstrapClinica'

// Mock del hook
vi.mock('../hooks/useBootstrapClinica', () => ({
  useBootstrapClinica: vi.fn(),
}))

import { useBootstrapClinica } from '../hooks/useBootstrapClinica'

describe('BootstrapClinica - 4 Pasos Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe renderizar el título del wizard y opciones de tipo en paso 1', () => {
    vi.mocked(useBootstrapClinica).mockReturnValue({
      paso: 1,
      tipoActividad: 'clinica',
      datos: { nombre: '', rutEmpresa: '', direccion: '', telefono: '', emailContacto: '' },
      sedes: [],
      equipo: [],
      errores: {},
      procesando: false,
      errorGeneral: null,
      completado: false,
      setTipoActividad: vi.fn(),
      actualizarCampo: vi.fn(),
      agregarSede: vi.fn(),
      eliminarSede: vi.fn(),
      agregarMiembro: vi.fn(),
      eliminarMiembro: vi.fn(),
      avanzarPaso: vi.fn(),
      retrocederPaso: vi.fn(),
      handleSubmit: vi.fn(),
      finalizarBienvenida: vi.fn(),
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByText('Crear tu Clínica')).toBeInTheDocument()
    expect(screen.getByText('Consulta individual')).toBeInTheDocument()
    expect(screen.getByText('Clínica dental')).toBeInTheDocument()
  })

  it('debe mostrar campos de datos en paso 2', () => {
    vi.mocked(useBootstrapClinica).mockReturnValue({
      paso: 2,
      tipoActividad: 'clinica',
      datos: { nombre: '', rutEmpresa: '', direccion: '', telefono: '', emailContacto: '' },
      sedes: [],
      equipo: [],
      errores: {},
      procesando: false,
      errorGeneral: null,
      completado: false,
      setTipoActividad: vi.fn(),
      actualizarCampo: vi.fn(),
      agregarSede: vi.fn(),
      eliminarSede: vi.fn(),
      agregarMiembro: vi.fn(),
      eliminarMiembro: vi.fn(),
      avanzarPaso: vi.fn(),
      retrocederPaso: vi.fn(),
      handleSubmit: vi.fn(),
      finalizarBienvenida: vi.fn(),
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByLabelText(/cómo se llama tu clínica/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/clínica dental/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rut de la empresa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument()
  })

  it('debe mostrar sedes en paso 3', () => {
    vi.mocked(useBootstrapClinica).mockReturnValue({
      paso: 3,
      tipoActividad: 'clinica',
      datos: { nombre: 'Clínica Dental Sonrisas', direccion: 'Av. Providencia 123' },
      sedes: [{ nombre: 'Sede Central', direccion: 'Av. Providencia 123', comuna: 'Providencia', region: 'RM', activa: true }],
      equipo: [],
      errores: {},
      procesando: false,
      errorGeneral: null,
      completado: false,
      setTipoActividad: vi.fn(),
      actualizarCampo: vi.fn(),
      agregarSede: vi.fn(),
      eliminarSede: vi.fn(),
      agregarMiembro: vi.fn(),
      eliminarMiembro: vi.fn(),
      avanzarPaso: vi.fn(),
      retrocederPaso: vi.fn(),
      handleSubmit: vi.fn(),
      finalizarBienvenida: vi.fn(),
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByText('Sedes registradas')).toBeInTheDocument()
    expect(screen.getByText('Sede Central')).toBeInTheDocument()
  })

  it('debe mostrar equipo y botón Crear Clínica en paso 4', () => {
    vi.mocked(useBootstrapClinica).mockReturnValue({
      paso: 4,
      tipoActividad: 'clinica',
      datos: { nombre: 'Clínica Dental Sonrisas' },
      sedes: [{ nombre: 'Sede Central', direccion: 'Av. Providencia 123', comuna: 'Providencia', region: 'RM', activa: true }],
      equipo: [{ email: 'doctor@sonrisas.cl', rol: 'dentista', sedes: [] }],
      errores: {},
      procesando: false,
      errorGeneral: null,
      completado: false,
      setTipoActividad: vi.fn(),
      actualizarCampo: vi.fn(),
      agregarSede: vi.fn(),
      eliminarSede: vi.fn(),
      agregarMiembro: vi.fn(),
      eliminarMiembro: vi.fn(),
      avanzarPaso: vi.fn(),
      retrocederPaso: vi.fn(),
      handleSubmit: vi.fn(),
      finalizarBienvenida: vi.fn(),
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByText(/invitar colaboradores/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear clínica/i })).toBeInTheDocument()
  })

  it('debe mostrar PantallaBienvenida al completar el flujo', () => {
    vi.mocked(useBootstrapClinica).mockReturnValue({
      paso: 4,
      tipoActividad: 'clinica',
      datos: { nombre: 'Clínica Dental Sonrisas' },
      sedes: [{ nombre: 'Sede Central', direccion: 'Av. Providencia 123', comuna: 'Providencia', region: 'RM', activa: true }],
      equipo: [],
      errores: {},
      procesando: false,
      errorGeneral: null,
      completado: true,
      setTipoActividad: vi.fn(),
      actualizarCampo: vi.fn(),
      agregarSede: vi.fn(),
      eliminarSede: vi.fn(),
      agregarMiembro: vi.fn(),
      eliminarMiembro: vi.fn(),
      avanzarPaso: vi.fn(),
      retrocederPaso: vi.fn(),
      handleSubmit: vi.fn(),
      finalizarBienvenida: vi.fn(),
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByText(/¡Bienvenido a DentikOS!/i)).toBeInTheDocument()
    expect(screen.getByText(/Ir al Dashboard/i)).toBeInTheDocument()
  })
})
