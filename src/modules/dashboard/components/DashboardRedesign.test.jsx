import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardHeader } from './DashboardHeader'
import { DashboardKpiCards } from './DashboardKpiCards'
import { SalaEsperaWidget } from './SalaEsperaWidget'
import { TendenciasWidget } from './TendenciasWidget'
import { CitasHoyWidget } from './CitasHoyWidget'

describe('Dashboard Redesign — Bento Cockpit & Surgical Experience', () => {
  const mockResumen = {
    totalPacientes: 42,
    citasHoyCount: 8,
    recaudacionHoy: 350000,
    citasHoy: [
      { id: 'c1', pacienteId: 'p1', pacienteNombre: 'Ana Silva', hora: '09:00', motivo: 'Limpieza' },
      { id: 'c2', pacienteId: 'p2', pacienteNombre: 'Carlos Ruiz', hora: '10:30', motivo: 'Endodoncia' },
    ],
    enEspera: [
      { id: 'c3', pacienteId: 'p3', pacienteNombre: 'María Soto', horaInicio: '11:00', horaLlegadaEspera: '10:55' },
    ],
    enAtencion: [
      { id: 'c4', pacienteId: 'p4', pacienteNombre: 'Juan Pérez', doctorNombre: 'Dr. Gómez', motivo: 'Cirugía' },
    ],
    finalizadas: [
      { id: 'c5', pacienteId: 'p5', pacienteNombre: 'Pedro López' },
    ],
    tasaOcupacionAgenda: 75,
    montoTotalCotizado: 1200000,
    montoTotalAceptado: 850000,
    tasaConversionPresupuestos: 71,
    proyeccionMensual: 4500000,
  }

  const mockPacientes = [
    { id: 'p1', nombre: 'Ana Silva' },
    { id: 'p2', nombre: 'Carlos Ruiz' },
    { id: 'p3', nombre: 'María Soto' },
    { id: 'p4', nombre: 'Juan Pérez' },
    { id: 'p5', nombre: 'Pedro López' },
  ]

  describe('DashboardHeader', () => {
    it('renderiza saludo con nombre del profesional y badge de cockpit operativo', () => {
      render(
        <DashboardHeader
          userProfile={{ nombreCompleto: 'Dra. Valentina Montes', especialidad: 'Ortodoncia' }}
        />
      )
      expect(screen.getByText(/Dra. Valentina Montes/i)).toBeInTheDocument()
      expect(screen.getByText(/Ortodoncia/i)).toBeInTheDocument()
      expect(screen.getByText(/Consola Operativa Clínica/i)).toBeInTheDocument()
      expect(screen.getByText(/Activo & Offline-First/i)).toBeInTheDocument()
    })
  })

  describe('DashboardKpiCards (Asymmetric Bento)', () => {
    it('renderiza tarjeta Hero de recaudación con proyección mensual y ritmo de cumplimiento', () => {
      render(<DashboardKpiCards resumen={mockResumen} />)
      expect(screen.getByText(/Recaudación & Flujo Quirúrgico/i)).toBeInTheDocument()
      expect(screen.getByText(/350.000/i)).toBeInTheDocument()
      expect(screen.getByText(/4.500.000 CLP/i)).toBeInTheDocument()
      expect(screen.getByText(/Ritmo de Cumplimiento Jornada/i)).toBeInTheDocument()
    })

    it('renderiza tarjetas secundarias con ocupación de sillones y flujo de pacientes', () => {
      render(<DashboardKpiCards resumen={mockResumen} />)
      expect(screen.getByText(/Ocupación de Sillones/i)).toBeInTheDocument()
      expect(screen.getByText(/75% Capacidad/i)).toBeInTheDocument()
      expect(screen.getByText(/Flujo de Pacientes/i)).toBeInTheDocument()
      expect(screen.getAllByText(/42/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/1 En Espera/i)).toBeInTheDocument()
    })
  })

  describe('SalaEsperaWidget (Monitor Quirúrgico de Boxes)', () => {
    it('renderiza pacientes en box y pacientes en recepción con telemetría de tiempos', () => {
      const handleSelect = vi.fn()
      render(
        <SalaEsperaWidget
          enEspera={mockResumen.enEspera}
          enAtencion={mockResumen.enAtencion}
          pacientes={mockPacientes}
          alSeleccionarPaciente={handleSelect}
        />
      )
      expect(screen.getByText(/Monitor Quirúrgico de Boxes & Sala/i)).toBeInTheDocument()
      expect(screen.getByText(/Juan Pérez/i)).toBeInTheDocument()
      expect(screen.getByText(/Box 01/i)).toBeInTheDocument()
      expect(screen.getByText(/Ficha Box →/i)).toBeInTheDocument()
      expect(screen.getByText(/María Soto/i)).toBeInTheDocument()
      expect(screen.getByText(/10:55/i)).toBeInTheDocument()

      fireEvent.click(screen.getByText(/Ficha Box →/i))
      expect(handleSelect).toHaveBeenCalledWith(mockPacientes[3])
    })

    it('renderiza estado vacío cuando no hay pacientes esperando ni en atención', () => {
      render(
        <SalaEsperaWidget
          enEspera={[]}
          enAtencion={[]}
          pacientes={mockPacientes}
        />
      )
      expect(screen.getByText(/Boxes disponibles/i)).toBeInTheDocument()
      expect(screen.getByText(/No hay pacientes esperando en recepción/i)).toBeInTheDocument()
    })
  })

  describe('TendenciasWidget', () => {
    const mock7d = [
      { fecha: '2026-09-25', citas: 5 },
      { fecha: '2026-09-26', citas: 8 },
      { fecha: '2026-09-27', citas: 3 },
    ]
    const mock30d = [
      { fecha: '2026-09-01', citas: 10 },
      { fecha: '2026-09-15', citas: 12 },
    ]

    it('renderiza métricas resumidas y permite alternar entre 7 y 30 días', () => {
      render(
        <TendenciasWidget
          tendenciaCitas7Dias={mock7d}
          tendenciaCitas30Dias={mock30d}
        />
      )
      expect(screen.getByText(/Tendencias de Flujo Quirúrgico/i)).toBeInTheDocument()
      expect(screen.getByText(/Promedio diario/i)).toBeInTheDocument()
      expect(screen.getByText(/Día pico/i)).toBeInTheDocument()
      expect(screen.getByText(/Día más bajo/i)).toBeInTheDocument()

      const btn30d = screen.getByRole('button', { name: '30 días' })
      fireEvent.click(btn30d)
      expect(btn30d).toHaveAttribute('aria-pressed', 'true')
    })

    it('renderiza mensaje sin datos si ambas tendencias están vacías', () => {
      render(<TendenciasWidget tendenciaCitas7Dias={[]} tendenciaCitas30Dias={[]} />)
      expect(screen.getByText(/Sin datos de tendencias/i)).toBeInTheDocument()
    })
  })

  describe('CitasHoyWidget', () => {
    it('renderiza citas agendadas y permite ver ficha', () => {
      const handleSelect = vi.fn()
      render(
        <CitasHoyWidget
          citasHoy={mockResumen.citasHoy}
          pacientes={mockPacientes}
          alSeleccionarPaciente={handleSelect}
        />
      )
      expect(screen.getByText(/Agenda & Flujo Quirúrgico de Hoy/i)).toBeInTheDocument()
      expect(screen.getByText(/Ana Silva/i)).toBeInTheDocument()
      expect(screen.getByText(/09:00 hrs/i)).toBeInTheDocument()

      const btns = screen.getAllByText(/Ver Ficha →/i)
      fireEvent.click(btns[0])
      expect(handleSelect).toHaveBeenCalledWith(mockPacientes[0])
    })

    it('renderiza mensaje si no hay citas hoy', () => {
      render(<CitasHoyWidget citasHoy={[]} />)
      expect(screen.getByText(/No hay citas agendadas/i)).toBeInTheDocument()
    })
  })
})
