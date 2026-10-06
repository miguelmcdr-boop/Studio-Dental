import React, { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BootstrapClinica } from './BootstrapClinica'

// Mock del hook useBootstrapClinica
vi.mock('../hooks/useBootstrapClinica', () => ({
  useBootstrapClinica: vi.fn(),
}))

// Mock del hook useAppDialog
vi.mock('../hooks/useAppDialog', () => ({
  useAppDialog: vi.fn(() => ({
    confirm: vi.fn().mockResolvedValue(true),
    alert: vi.fn(),
  })),
}))

import { useBootstrapClinica } from '../hooks/useBootstrapClinica'
import { useAppDialog } from '../hooks/useAppDialog'

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
      cancelarConfiguracion: vi.fn(),
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
      cancelarConfiguracion: vi.fn(),
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
      cancelarConfiguracion: vi.fn(),
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
      cancelarConfiguracion: vi.fn(),
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
      cancelarConfiguracion: vi.fn(),
      handleSubmit: vi.fn(),
      finalizarBienvenida: vi.fn(),
    })

    render(<BootstrapClinica onComplete={vi.fn()} />)

    expect(screen.getByText(/¡Bienvenido a DentikOS!/i)).toBeInTheDocument()
    expect(screen.getByText(/Ir al Dashboard/i)).toBeInTheDocument()
  })
})

describe('Ruta de escape del onboarding', () => {
  const mockCancelarConfiguracion = vi.fn()
  const mockConfirm = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockResolvedValue(true)
    mockCancelarConfiguracion.mockResolvedValue(undefined)

    vi.mocked(useAppDialog).mockReturnValue({
      confirm: mockConfirm,
      alert: vi.fn(),
    })

    // Mock dinámico con estado para simular avance y retroceso de pasos
    vi.mocked(useBootstrapClinica).mockImplementation(() => {
      const [paso, setPaso] = useState(1)
      const [tipoActividad, setTipoActividad] = useState('clinica')
      return {
        paso,
        tipoActividad,
        datos: { nombre: 'Clínica Test', rutEmpresa: '', direccion: 'Av. Test 123', telefono: '', emailContacto: '' },
        sedes: [{ nombre: 'Sede Principal', direccion: 'Av. Test 123', comuna: 'Central', region: 'RM', activa: true }],
        equipo: [],
        errores: {},
        procesando: false,
        errorGeneral: null,
        completado: false,
        setTipoActividad,
        actualizarCampo: vi.fn(),
        agregarSede: vi.fn(),
        eliminarSede: vi.fn(),
        agregarMiembro: vi.fn(),
        eliminarMiembro: vi.fn(),
        avanzarPaso: () => setPaso((prev) => Math.min(prev + 1, 4)),
        retrocederPaso: () => setPaso((prev) => Math.max(prev - 1, 1)),
        cancelarConfiguracion: mockCancelarConfiguracion,
        handleSubmit: vi.fn(),
        finalizarBienvenida: vi.fn(),
      }
    })
  })

  it('muestra botón Cancelar en el paso 1', () => {
    render(<BootstrapClinica />)
    expect(screen.getByTestId('bootstrap-cancelar')).toBeInTheDocument()
    expect(screen.getByText(/Cancelar y cerrar sesión/i)).toBeInTheDocument()
  })

  it('no muestra botón Anterior en el paso 1', () => {
    render(<BootstrapClinica />)
    expect(screen.queryByText(/Anterior/i)).not.toBeInTheDocument()
  })

  it('muestra botón Anterior desde el paso 2', async () => {
    render(<BootstrapClinica />)

    // Seleccionar tipo y avanzar a paso 2
    fireEvent.click(screen.getByText(/Clínica dental/i))
    fireEvent.click(screen.getByText(/Continuar/i))

    expect(screen.getByText(/Anterior/i)).toBeInTheDocument()
  })

  it('permite retroceder con el botón Anterior al paso 1', async () => {
    render(<BootstrapClinica />)

    // Avanzar a paso 2
    fireEvent.click(screen.getByText(/Continuar/i))
    expect(screen.getByText(/Anterior/i)).toBeInTheDocument()

    // Retroceder a paso 1
    fireEvent.click(screen.getByText(/Anterior/i))
    expect(screen.queryByText(/Anterior/i)).not.toBeInTheDocument()
  })

  it('cancelar con confirmación cierra sesión', async () => {
    render(<BootstrapClinica />)

    const btnCancelar = screen.getByTestId('bootstrap-cancelar')
    fireEvent.click(btnCancelar)

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/cancelar/i),
        variant: 'warning',
      })
    )

    await waitFor(() => {
      expect(mockCancelarConfiguracion).toHaveBeenCalled()
    })
  })

  it('no cancela ni cierra sesión si el usuario rechaza la confirmación', async () => {
    mockConfirm.mockResolvedValue(false)
    render(<BootstrapClinica />)

    const btnCancelar = screen.getByTestId('bootstrap-cancelar')
    fireEvent.click(btnCancelar)

    expect(mockConfirm).toHaveBeenCalled()
    await waitFor(() => {
      expect(mockCancelarConfiguracion).not.toHaveBeenCalled()
    })
  })
})
