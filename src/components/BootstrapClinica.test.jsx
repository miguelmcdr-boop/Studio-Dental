import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BootstrapClinica } from './BootstrapClinica'

// Mock del hook
vi.mock('../hooks/useBootstrapClinica', () => ({
  useBootstrapClinica: vi.fn()
}))

import { useBootstrapClinica } from '../hooks/useBootstrapClinica'

describe('BootstrapClinica', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe renderizar el título del wizard', () => {
    useBootstrapClinica.mockReturnValue({
      paso: 1,
      datos: { nombre: '', rutEmpresa: '', direccion: '', telefono: '', emailContacto: '' },
      errores: {},
      procesando: false,
      errorGeneral: null,
      actualizarCampo: vi.fn(),
      avanzarPaso: vi.fn(),
      retrocederPaso: vi.fn(),
      handleSubmit: vi.fn()
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByText('Crear tu Clínica')).toBeInTheDocument()
  })

  it('debe mostrar campo de nombre en paso 1', () => {
    useBootstrapClinica.mockReturnValue({
      paso: 1,
      datos: { nombre: '', rutEmpresa: '', direccion: '', telefono: '', emailContacto: '' },
      errores: {},
      procesando: false,
      errorGeneral: null,
      actualizarCampo: vi.fn(),
      avanzarPaso: vi.fn(),
      retrocederPaso: vi.fn(),
      handleSubmit: vi.fn()
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByLabelText(/cómo se llama tu clínica/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/clínica dental/i)).toBeInTheDocument()
  })

  it('debe mostrar campos adicionales en paso 2', () => {
    useBootstrapClinica.mockReturnValue({
      paso: 2,
      datos: { nombre: 'Clínica Test', rutEmpresa: '', direccion: '', telefono: '', emailContacto: '' },
      errores: {},
      procesando: false,
      errorGeneral: null,
      actualizarCampo: vi.fn(),
      avanzarPaso: vi.fn(),
      retrocederPaso: vi.fn(),
      handleSubmit: vi.fn()
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByLabelText(/rut de la empresa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
  })

  it('debe mostrar resumen en paso 3', () => {
    useBootstrapClinica.mockReturnValue({
      paso: 3,
      datos: { nombre: 'Clínica Test', rutEmpresa: '76.123.456-7', direccion: 'Av. Test 123', telefono: '+56912345678', emailContacto: '' },
      errores: {},
      procesando: false,
      errorGeneral: null,
      actualizarCampo: vi.fn(),
      avanzarPaso: vi.fn(),
      retrocederPaso: vi.fn(),
      handleSubmit: vi.fn()
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByText('Resumen de tu clínica')).toBeInTheDocument()
    expect(screen.getByText('Clínica Test')).toBeInTheDocument()
    expect(screen.getByText('76.123.456-7')).toBeInTheDocument()
  })

  it('debe mostrar botón "Continuar" en pasos 1 y 2', () => {
    useBootstrapClinica.mockReturnValue({
      paso: 1,
      datos: { nombre: '', rutEmpresa: '', direccion: '', telefono: '', emailContacto: '' },
      errores: {},
      procesando: false,
      errorGeneral: null,
      actualizarCampo: vi.fn(),
      avanzarPaso: vi.fn(),
      retrocederPaso: vi.fn(),
      handleSubmit: vi.fn()
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument()
  })

  it('debe mostrar botón "Crear Clínica" en paso 3', () => {
    useBootstrapClinica.mockReturnValue({
      paso: 3,
      datos: { nombre: 'Clínica Test', rutEmpresa: '', direccion: '', telefono: '', emailContacto: '' },
      errores: {},
      procesando: false,
      errorGeneral: null,
      actualizarCampo: vi.fn(),
      avanzarPaso: vi.fn(),
      retrocederPaso: vi.fn(),
      handleSubmit: vi.fn()
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByRole('button', { name: /crear clínica/i })).toBeInTheDocument()
  })

  it('debe mostrar botón "Atrás" en pasos 2 y 3', () => {
    useBootstrapClinica.mockReturnValue({
      paso: 2,
      datos: { nombre: 'Clínica Test', rutEmpresa: '', direccion: '', telefono: '', emailContacto: '' },
      errores: {},
      procesando: false,
      errorGeneral: null,
      actualizarCampo: vi.fn(),
      avanzarPaso: vi.fn(),
      retrocederPaso: vi.fn(),
      handleSubmit: vi.fn()
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByRole('button', { name: /atrás/i })).toBeInTheDocument()
  })

  it('debe mostrar error general cuando existe', () => {
    useBootstrapClinica.mockReturnValue({
      paso: 3,
      datos: { nombre: 'Clínica Test', rutEmpresa: '', direccion: '', telefono: '', emailContacto: '' },
      errores: {},
      procesando: false,
      errorGeneral: 'Ya existe una clínica con este RUT',
      actualizarCampo: vi.fn(),
      avanzarPaso: vi.fn(),
      retrocederPaso: vi.fn(),
      handleSubmit: vi.fn()
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByText('Ya existe una clínica con este RUT')).toBeInTheDocument()
  })

  it('debe deshabilitar botones cuando está procesando', () => {
    useBootstrapClinica.mockReturnValue({
      paso: 3,
      datos: { nombre: 'Clínica Test', rutEmpresa: '', direccion: '', telefono: '', emailContacto: '' },
      errores: {},
      procesando: true,
      errorGeneral: null,
      actualizarCampo: vi.fn(),
      avanzarPaso: vi.fn(),
      retrocederPaso: vi.fn(),
      handleSubmit: vi.fn()
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByRole('button', { name: /creando clínica/i })).toBeDisabled()
  })
})
