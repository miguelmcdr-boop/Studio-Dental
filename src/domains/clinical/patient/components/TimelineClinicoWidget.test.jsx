/**
 * Tests — TimelineClinicoWidget (F7-26 Pulido P2/P4: click eventos + estado vacío)
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TimelineClinicoWidget } from './TimelineClinicoWidget'

const evolucionesBase = [
  { id: 'ev1', fecha: '20-09-2026', texto: 'Control rutinario' },
]

const tratamientosBase = [
  { id: 'tr1', estado: 'Realizado', prestacion: 'Limpieza', pieza: '1.1', convenio: 'Particular', valor: 30000 },
]

const recetasBase = [
  { id: 'rec1', fecha: '21-09-2026', indicaciones: 'Ibuprofeno 400mg c/8h' },
]

const certificadosBase = [
  { id: 'cert1', fechaEmision: '22-09-2026', tipo: 'asistencia', diagnosticoMotivo: 'Control' },
]

describe('TimelineClinicoWidget — Click eventos (F7-26 P2)', () => {
  it('click en evento "Evolución" llama onNavegarTab con "Ficha Clínica"', () => {
    const onNavegarTab = vi.fn()
    render(
      <TimelineClinicoWidget
        evolucionesNotas={evolucionesBase}
        itemsPresupuesto={[]}
        recetas={[]}
        certificados={[]}
        onNavegarTab={onNavegarTab}
      />
    )
    const evento = screen.getByRole('button', { name: /Nota Clínica de Evolución/i })
    fireEvent.click(evento)
    expect(onNavegarTab).toHaveBeenCalledWith('Ficha Clínica')
  })

  it('click en evento "Tratamiento" llama onNavegarTab con "Plan de Tratamiento"', () => {
    const onNavegarTab = vi.fn()
    render(
      <TimelineClinicoWidget
        evolucionesNotas={[]}
        itemsPresupuesto={tratamientosBase}
        recetas={[]}
        certificados={[]}
        onNavegarTab={onNavegarTab}
      />
    )
    const evento = screen.getByRole('button', { name: /Tratamiento Completado/i })
    fireEvent.click(evento)
    expect(onNavegarTab).toHaveBeenCalledWith('Plan de Tratamiento')
  })

  it('click en evento "Receta" llama onNavegarTab con "Recetas Médicas"', () => {
    const onNavegarTab = vi.fn()
    render(
      <TimelineClinicoWidget
        evolucionesNotas={[]}
        itemsPresupuesto={[]}
        recetas={recetasBase}
        certificados={[]}
        onNavegarTab={onNavegarTab}
      />
    )
    const evento = screen.getByRole('button', { name: /Receta Médica Emitida/i })
    fireEvent.click(evento)
    expect(onNavegarTab).toHaveBeenCalledWith('Recetas Médicas')
  })

  it('click en evento "Certificado" llama onNavegarTab con "Certificados"', () => {
    const onNavegarTab = vi.fn()
    render(
      <TimelineClinicoWidget
        evolucionesNotas={[]}
        itemsPresupuesto={[]}
        recetas={[]}
        certificados={certificadosBase}
        onNavegarTab={onNavegarTab}
      />
    )
    const evento = screen.getByRole('button', { name: /Certificado de Asistencia/i })
    fireEvent.click(evento)
    expect(onNavegarTab).toHaveBeenCalledWith('Certificados')
  })

  it('hitos NO son clickeables (no tienen role=button)', () => {
    const onNavegarTab = vi.fn()
    render(
      <TimelineClinicoWidget
        evolucionesNotas={evolucionesBase}
        itemsPresupuesto={[]}
        recetas={[]}
        certificados={[]}
        onNavegarTab={onNavegarTab}
      />
    )
    // El evento Evolución SÍ es clickeable
    const eventosClickeables = screen.getAllByRole('button', { name: /Nota Clínica|Tratamiento|Receta|Certificado/i })
    expect(eventosClickeables.length).toBeGreaterThan(0)
    // El hito "Primera visita" NO es clickeable
    const hito = screen.getByText(/Primera visita registrada/i)
    expect(hito.closest('[role="button"]')).toBeNull()
  })
})

describe('TimelineClinicoWidget — Estado vacío (F7-26 P4)', () => {
  it('paciente sin historia muestra mensaje + CTAs', () => {
    const onNavegarTab = vi.fn()
    render(
      <TimelineClinicoWidget
        evolucionesNotas={[]}
        itemsPresupuesto={[]}
        recetas={[]}
        certificados={[]}
        onNavegarTab={onNavegarTab}
      />
    )
    expect(screen.getByText(/Sin historial clínico aún/i)).toBeInTheDocument()
    const btnNota = screen.getByRole('button', { name: /Agregar nota clínica/i })
    fireEvent.click(btnNota)
    expect(onNavegarTab).toHaveBeenCalledWith('Ficha Clínica')

    const btnPlan = screen.getByRole('button', { name: /Crear plan de tratamiento/i })
    fireEvent.click(btnPlan)
    expect(onNavegarTab).toHaveBeenCalledWith('Plan de Tratamiento')
  })

  it('filtro con cero resultados muestra mensaje estándar (no CTAs)', () => {
    const onNavegarTab = vi.fn()
    render(
      <TimelineClinicoWidget
        evolucionesNotas={evolucionesBase}
        itemsPresupuesto={[]}
        recetas={[]}
        certificados={[]}
        onNavegarTab={onNavegarTab}
      />
    )
    // Click en filtro "Receta" para forzar cero resultados
    const filtroReceta = screen.getByRole('tab', { name: /^Receta/i })
    fireEvent.click(filtroReceta)
    expect(screen.getByText(/No existen registros clínicos asociados al filtro/i)).toBeInTheDocument()
    expect(screen.queryByText(/Sin historial clínico aún/i)).not.toBeInTheDocument()
  })
})
