/**
 * Tests — ResumenClinicoHeader (F7-26 Pulido P1: click KPIs → tabs)
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResumenClinicoHeader } from './ResumenClinicoHeader'

const metricasBase = {
  ultimaVisita: new Date('2026-09-20'),
  diasDesdeUltimaVisita: 4,
  totalVisitas: 3,
  proximaCita: null,
  presupuestoTotal: 500000,
  presupuestoPagado: 200000,
  presupuestoPendiente: 300000,
  presupuestoTotalFormateado: '$500.000',
  presupuestoPendienteFormateado: '$300.000',
  progresoTratamiento: 40,
  itemsRealizados: 2,
  totalItems: 5,
  alertasActivas: [],
}

describe('ResumenClinicoHeader — Click KPIs (F7-26 P1)', () => {
  it('renderiza sin romperse con métricas básicas', () => {
    render(<ResumenClinicoHeader metricas={metricasBase} />)
    expect(screen.getByText('Última visita')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Tratamiento')).toBeInTheDocument()
    expect(screen.getByText('Alertas clínicas')).toBeInTheDocument()
  })

  it('click en "Última visita" llama onNavegarTab con "Línea de Tiempo"', () => {
    const onNavegarTab = vi.fn()
    render(<ResumenClinicoHeader metricas={metricasBase} onNavegarTab={onNavegarTab} />)
    const tarjeta = screen.getByRole('button', { name: /Última visita/i })
    fireEvent.click(tarjeta)
    expect(onNavegarTab).toHaveBeenCalledWith('Línea de Tiempo')
  })

  it('click en "Pendiente" llama onNavegarTab con "Plan de Tratamiento"', () => {
    const onNavegarTab = vi.fn()
    render(<ResumenClinicoHeader metricas={metricasBase} onNavegarTab={onNavegarTab} />)
    const tarjeta = screen.getByRole('button', { name: /Presupuesto pendiente/i })
    fireEvent.click(tarjeta)
    expect(onNavegarTab).toHaveBeenCalledWith('Plan de Tratamiento')
  })

  it('click en "Tratamiento" llama onNavegarTab con "Plan de Tratamiento"', () => {
    const onNavegarTab = vi.fn()
    render(<ResumenClinicoHeader metricas={metricasBase} onNavegarTab={onNavegarTab} />)
    const tarjeta = screen.getByRole('button', { name: /Progreso de tratamiento/i })
    fireEvent.click(tarjeta)
    expect(onNavegarTab).toHaveBeenCalledWith('Plan de Tratamiento')
  })

  it('click en "Alertas clínicas" llama onNavegarTab con "Ficha Clínica"', () => {
    const onNavegarTab = vi.fn()
    render(<ResumenClinicoHeader metricas={metricasBase} onNavegarTab={onNavegarTab} />)
    const tarjeta = screen.getByRole('button', { name: /Sin alertas clínicas/i })
    fireEvent.click(tarjeta)
    expect(onNavegarTab).toHaveBeenCalledWith('Ficha Clínica')
  })

  it('"Próxima cita" NO es clickeable (role=region, no button)', () => {
    const onNavegarTab = vi.fn()
    render(<ResumenClinicoHeader metricas={metricasBase} onNavegarTab={onNavegarTab} />)
    const tarjeta = screen.getByRole('region', { name: /Sin citas agendadas/i })
    expect(tarjeta.tagName).not.toBe('BUTTON')
    expect(tarjeta).not.toHaveAttribute('tabIndex', '0')
  })

  it('navegación por teclado: Enter activa onNavegarTab', () => {
    const onNavegarTab = vi.fn()
    render(<ResumenClinicoHeader metricas={metricasBase} onNavegarTab={onNavegarTab} />)
    const tarjeta = screen.getByRole('button', { name: /Última visita/i })
    fireEvent.keyDown(tarjeta, { key: 'Enter' })
    expect(onNavegarTab).toHaveBeenCalledWith('Línea de Tiempo')
  })

  it('navegación por teclado: Space activa onNavegarTab', () => {
    const onNavegarTab = vi.fn()
    render(<ResumenClinicoHeader metricas={metricasBase} onNavegarTab={onNavegarTab} />)
    const tarjeta = screen.getByRole('button', { name: /Última visita/i })
    fireEvent.keyDown(tarjeta, { key: ' ' })
    expect(onNavegarTab).toHaveBeenCalledWith('Línea de Tiempo')
  })
})
