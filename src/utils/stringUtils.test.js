/**
 * Tests — stringUtils (F10-A7 fix)
 */
import { describe, it, expect } from 'vitest'
import { stripEmojis } from './stringUtils'

describe('stripEmojis (F10-A7)', () => {
  it('elimina emojis de comida', () => {
    expect(stripEmojis('🍱 Horario de Almuerzo')).toBe('Horario de Almuerzo')
  })

  it('elimina emojis de herramientas', () => {
    expect(stripEmojis('🛠️ Mantenimiento Técnico')).toBe('Mantenimiento Técnico')
  })

  it('elimina emojis de educación', () => {
    expect(stripEmojis('🎓 Capacitación / Evento')).toBe('Capacitación / Evento')
  })

  it('elimina emojis de alerta', () => {
    expect(stripEmojis('🚨 Ausencia / Urgencia')).toBe('Ausencia / Urgencia')
  })

  it('maneja texto sin emojis', () => {
    expect(stripEmojis('Horario de Almuerzo')).toBe('Horario de Almuerzo')
  })

  it('maneja string vacío', () => {
    expect(stripEmojis('')).toBe('')
  })

  it('maneja null/undefined', () => {
    expect(stripEmojis(null)).toBe('')
    expect(stripEmojis(undefined)).toBe('')
  })

  it('colapsa espacios múltiples', () => {
    expect(stripEmojis('🍱   Horario   de   Almuerzo')).toBe('Horario de Almuerzo')
  })
})
