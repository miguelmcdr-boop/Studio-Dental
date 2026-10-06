/**
 * Tests — Surgical Mode Semantics & Ergonomics
 *
 * Verifica que el modo quirúrgico (.theme-surgical):
 * 1. Conserve las clases y estilos semánticos de Badge (success, danger, warning, info).
 * 2. Conserve los estilos y contraste de Button (primary, danger).
 * 3. Cumpla la ergonomía quirúrgica táctil (mínimo 48x48px) en el componente Button base.
 * 4. No exista una regla global de especificidad desmedida en tokens.css que fuerce color: #000000
 *    en todos los elementos hijos (body, p, span, div, label, button).
 */
import React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import fs from 'fs'
import path from 'path'
import { Badge } from './Badge'
import { Button } from './Button'

describe('Surgical Mode Semantics & Ergonomics', () => {
  beforeEach(() => {
    document.documentElement.classList.add('theme-surgical')
  })

  afterEach(() => {
    document.documentElement.classList.remove('theme-surgical')
  })

  describe('Badge en modo quirúrgico', () => {
    it('Badge success conserva clase semántica de éxito en Surgical', () => {
      const { container } = render(
        <div className="theme-surgical">
          <Badge variant="success">Confirmado</Badge>
        </div>
      )
      const badge = container.querySelector('[role="status"], span')
      expect(badge).toBeInTheDocument()
      expect(badge.className).toContain('text-status-success')
      expect(screen.getByText('Confirmado')).toBeInTheDocument()
    })

    it('Badge danger conserva clase semántica de peligro en Surgical', () => {
      const { container } = render(
        <div className="theme-surgical">
          <Badge variant="danger">Urgente</Badge>
        </div>
      )
      const badge = container.querySelector('[role="status"], span')
      expect(badge.className).toContain('text-status-danger')
      expect(screen.getByText('Urgente')).toBeInTheDocument()
    })

    it('Badge warning conserva clase semántica de advertencia en Surgical', () => {
      const { container } = render(
        <div className="theme-surgical">
          <Badge variant="warning">Pendiente</Badge>
        </div>
      )
      const badge = container.querySelector('[role="status"], span')
      expect(badge.className).toContain('text-amber-700')
      expect(screen.getByText('Pendiente')).toBeInTheDocument()
    })

    it('Badge info conserva clase semántica informativa en Surgical', () => {
      const { container } = render(
        <div className="theme-surgical">
          <Badge variant="info">Información</Badge>
        </div>
      )
      const badge = container.querySelector('[role="status"], span')
      expect(badge.className).toContain('text-status-info')
      expect(screen.getByText('Información')).toBeInTheDocument()
    })
  })

  describe('Button en modo quirúrgico', () => {
    it('Button primary conserva clases de variante primary y texto blanco', () => {
      render(
        <div className="theme-surgical">
          <Button variant="primary">Guardar</Button>
        </div>
      )
      const btn = screen.getByRole('button', { name: /guardar/i })
      expect(btn.className).toContain('bg-primary')
      expect(btn.className).toContain('text-white')
      expect(screen.getByText('Guardar')).toBeInTheDocument()
    })

    it('Button danger conserva clases de variante danger y texto blanco (contraste)', () => {
      render(
        <div className="theme-surgical">
          <Button variant="danger">Eliminar</Button>
        </div>
      )
      const btn = screen.getByRole('button', { name: /eliminar/i })
      expect(btn.className).toContain('bg-clinical-error')
      expect(btn.className).toContain('text-white')
      expect(screen.getByText('Eliminar')).toBeInTheDocument()
    })

    it('Button base incorpora ergonomía táctil quirúrgica (mínimo 48x48px)', () => {
      render(
        <div className="theme-surgical">
          <Button size="md">Táctil</Button>
        </div>
      )
      const btn = screen.getByRole('button', { name: /táctil/i })
      expect(btn.className).toContain('surgical:min-h-[48px]')
      expect(btn.className).toContain('surgical:min-w-[48px]')
    })
  })

  describe('Integridad arquitectónica de tokens.css', () => {
    it('tokens.css NO contiene la regla desmedida que fuerce color: #000000 sobre descendientes genéricos', () => {
      const tokensPath = path.resolve(__dirname, '../../../design/tokens.css')
      const tokensContent = fs.readFileSync(tokensPath, 'utf-8')

      // Verificar que no existan selectores que fuercen color negro indiscriminadamente
      expect(tokensContent).not.toMatch(/\.theme-surgical\s+span\b/)
      expect(tokensContent).not.toMatch(/\.theme-surgical\s+button\s*\{[^}]*color:\s*#000000/)
      expect(tokensContent).not.toMatch(/\.theme-surgical\s+div\b/)
      expect(tokensContent).not.toMatch(/\.theme-surgical\s+p\b/)
    })

    it('tokens.css define la subpaleta clínica dentro de .theme-surgical', () => {
      const tokensPath = path.resolve(__dirname, '../../../design/tokens.css')
      const tokensContent = fs.readFileSync(tokensPath, 'utf-8')

      expect(tokensContent).toContain('--clinical-caries: #DC2626')
      expect(tokensContent).toContain('--clinical-healthy: #0284C7')
      expect(tokensContent).toContain('--chart-caries: #DC2626')
    })
  })
})
