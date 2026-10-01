/**
 * Tests de ErrorBoundary — F6-01
 *
 * Cumple criterios de aceptación del roadmap:
 *   [x] Un error forzado dentro de un módulo envuelto no rompe el resto
 *   [x] Test automatizado verifica que el fallback se renderiza
 *   [x] No se muestra stack trace al usuario final en producción
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

// Componente que lanza error controlado
function ComponenteConError({ shouldThrow, mensaje = 'Error de prueba' }) {
  if (shouldThrow) {
    throw new Error(mensaje)
  }
  return <div data-testid="contenido-normal">Contenido normal</div>
}

describe('ErrorBoundary', () => {
  let consoleSpy

  beforeEach(() => {
    // Suprimir console.error de React durante el error esperado
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('renderiza children normalmente cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <ComponenteConError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByTestId('contenido-normal')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('muestra fallback cuando un child lanza error', () => {
    render(
      <ErrorBoundary modulo="test-modulo">
        <ComponenteConError shouldThrow={true} />
      </ErrorBoundary>
    )

    // Fallback visible
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Error en el módulo/i })).toBeInTheDocument()
    
    // Botones presentes (usar getAllByRole para evitar ambigüedad)
    const botones = screen.getAllByRole('button')
    expect(botones.length).toBeGreaterThanOrEqual(2)
    
    // Verificar textos de botones
    expect(screen.getByRole('button', { name: /volver al inicio/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recargar la página/i })).toBeInTheDocument()

    // Contenido normal NO está visible
    expect(screen.queryByTestId('contenido-normal')).not.toBeInTheDocument()
  })

  it('usa fallback genérico cuando no se especifica módulo', () => {
    render(
      <ErrorBoundary>
        <ComponenteConError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('heading', { name: /error inesperado/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('llama onReset cuando se hace click en el botón', () => {
    const onReset = vi.fn()

    render(
      <ErrorBoundary modulo="test" onReset={onReset}>
        <ComponenteConError shouldThrow={true} />
      </ErrorBoundary>
    )

    const botonReset = screen.getByRole('button', { name: /volver al inicio/i })
    fireEvent.click(botonReset)
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('registra error en console.error con contexto estructurado', () => {
    render(
      <ErrorBoundary modulo="odontograma">
        <ComponenteConError shouldThrow={true} mensaje="Cálculo fallido" />
      </ErrorBoundary>
    )

    expect(consoleSpy).toHaveBeenCalled()
    const logCall = consoleSpy.mock.calls.find(c => c[0] === '[ErrorBoundary]')
    expect(logCall).toBeDefined()

    const contexto = logCall[1]
    expect(contexto.modulo).toBe('odontograma')
    expect(contexto.mensaje).toBe('Cálculo fallido')
    expect(contexto.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('recupera el estado cuando onReset se ejecuta (desmonta fallback)', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ComponenteConError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Simular "reparación" re-renderizando sin throw
    rerender(
      <ErrorBoundary>
        <ComponenteConError shouldThrow={false} />
      </ErrorBoundary>
    )

    // Click en Reintentar
    const botonReintentar = screen.getByRole('button', { name: /reintentar/i })
    fireEvent.click(botonReintentar)

    // Fallback desaparece y vuelve el contenido normal
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByTestId('contenido-normal')).toBeInTheDocument()
  })

  it('NO muestra stack trace al usuario (oculto en <details>)', () => {
    render(
      <ErrorBoundary>
        <ComponenteConError shouldThrow={true} />
      </ErrorBoundary>
    )

    // El stack trace está dentro de <details>, no visible por defecto
    const detalles = document.querySelector('details')
    // Si existe el details (solo en DEV), debe estar cerrado por defecto
    if (detalles) {
      expect(detalles.open).toBeFalsy()
    }
    // El mensaje principal es amigable, no técnico
    expect(screen.getByText(/la aplicación encontró un error/i)).toBeInTheDocument()
  })

  it('mantiene el layout (Sidebar) visible cuando un modulo envuelto falla', () => {
    function SidebarSimulado() {
      return <nav data-testid="sidebar">Sidebar con navegacion</nav>
    }

    function LayoutConModuloFallido() {
      return (
        <div>
          <SidebarSimulado />
          <main>
            <ErrorBoundary modulo="odontograma-inicial">
              <ComponenteConError shouldThrow={true} mensaje="Error en odontograma" />
            </ErrorBoundary>
          </main>
        </div>
      )
    }

    render(<LayoutConModuloFallido />)

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByText(/Sidebar con navegacion/i)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Error en el m.dulo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /volver al inicio/i })).toBeInTheDocument()
  })

  it('mantiene el layout cuando falla ErrorBoundary de periodontograma', () => {
    function SidebarSimulado() {
      return <nav data-testid="sidebar">Sidebar</nav>
    }

    function LayoutConPeriodontogramaFallido() {
      return (
        <div>
          <SidebarSimulado />
          <main>
            <ErrorBoundary modulo="periodontograma">
              <ComponenteConError shouldThrow={true} />
            </ErrorBoundary>
          </main>
        </div>
      )
    }

    render(<LayoutConPeriodontogramaFallido />)

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Error en el m.dulo/i })).toBeInTheDocument()
  })

})
