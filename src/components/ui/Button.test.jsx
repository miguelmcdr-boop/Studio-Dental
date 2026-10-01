/**
 * Tests — Button component (F7-25 Fase 3)
 *
 * Valida variantes, tamaños, iconos, loading, disabled y accesibilidad.
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'
import { Save, Trash2 } from 'lucide-react'

describe('Button (F7-25)', () => {

  describe('renderizado básico', () => {
    it('renderiza el children como texto', () => {
      render(<Button>Guardar</Button>)
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument()
    })

    it('type por defecto es "button" (no submit)', () => {
      render(<Button>Click</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('acepta type="submit" para formularios', () => {
      render(<Button type="submit">Enviar</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })
  })

  describe('variantes', () => {
    it('aplica clases de variante primary por defecto', () => {
      render(<Button>Primary</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('bg-primary')
    })

    it('aplica clases de variante danger', () => {
      render(<Button variant="danger">Eliminar</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('bg-clinical-error')
    })

    it('aplica clases de variante ghost', () => {
      render(<Button variant="ghost">Cancelar</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('bg-transparent')
    })
  })

  describe('tamaños', () => {
    it('aplica clases de tamaño md por defecto', () => {
      render(<Button>Default</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('px-4 py-2')
    })

    it('aplica clases de tamaño lg', () => {
      render(<Button size="lg">Grande</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('px-5 py-2.5')
    })
  })

  describe('iconos', () => {
    it('renderiza icono a la izquierda por defecto', () => {
      render(<Button icon={Save}>Guardar</Button>)
      const btn = screen.getByRole('button')
      // Icono debe estar antes del texto
      const svg = btn.querySelector('svg')
      const span = btn.querySelector('span')
      expect(svg).toBeInTheDocument()
      expect(span).toBeInTheDocument()
      expect(svg.compareDocumentPosition(span)).toBe(4) // span después de svg
    })

    it('renderiza icono a la derecha cuando iconPosition="right"', () => {
      render(<Button icon={Trash2} iconPosition="right">Eliminar</Button>)
      const btn = screen.getByRole('button')
      const svg = btn.querySelector('svg')
      const span = btn.querySelector('span')
      // Icono debe estar después del texto
      expect(svg.compareDocumentPosition(span)).toBe(2) // span antes de svg
    })
  })

  describe('estado loading', () => {
    it('muestra spinner cuando loading=true', () => {
      render(<Button loading>Guardando</Button>)
      const btn = screen.getByRole('button')
      expect(btn).toHaveAttribute('aria-busy', 'true')
      expect(btn.querySelector('svg.animate-spin')).toBeInTheDocument()
    })

    it('está disabled cuando loading=true', () => {
      render(<Button loading>Cargando</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('estado disabled', () => {
    it('está disabled cuando disabled=true', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
    })

    it('NO ejecuta onClick cuando disabled', () => {
      const onClick = vi.fn()
      render(<Button disabled onClick={onClick}>Click</Button>)
      fireEvent.click(screen.getByRole('button'))
      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('eventos', () => {
    it('ejecuta onClick cuando no está disabled', () => {
      const onClick = vi.fn()
      render(<Button onClick={onClick}>Click</Button>)
      fireEvent.click(screen.getByRole('button'))
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('pasa eventos adicionales al button', () => {
      const onMouseEnter = vi.fn()
      render(<Button onMouseEnter={onMouseEnter}>Hover</Button>)
      fireEvent.mouseEnter(screen.getByRole('button'))
      expect(onMouseEnter).toHaveBeenCalledTimes(1)
    })
  })

  describe('accesibilidad', () => {
    it('soporta aria-label', () => {
      render(<Button aria-label="Cerrar modal">X</Button>)
      expect(screen.getByRole('button', { name: 'Cerrar modal' })).toBeInTheDocument()
    })

    it('soporta forwardRef', () => {
      const ref = { current: null }
      render(<Button ref={ref}>Ref</Button>)
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })
  })

  describe('fullWidth', () => {
    it('aplica w-full cuando fullWidth=true', () => {
      render(<Button fullWidth>Full</Button>)
      expect(screen.getByRole('button').className).toContain('w-full')
    })
  })
})
