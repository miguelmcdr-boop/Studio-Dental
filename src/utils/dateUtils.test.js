import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { obtenerFechaLocalISO, tiempoRelativo } from './dateUtils'

describe('dateUtils', () => {
  describe('obtenerFechaLocalISO', () => {
    it('formatea la fecha dada en YYYY-MM-DD usando valores locales', () => {
      const fecha = new Date(2025, 4, 15) // Mes 4 es mayo (0-indexado)
      expect(obtenerFechaLocalISO(fecha)).toBe('2025-05-15')
    })

    it('rellena con ceros los meses y días menores a 10', () => {
      const fecha = new Date(2025, 0, 5) // 5 de enero de 2025
      expect(obtenerFechaLocalISO(fecha)).toBe('2025-01-05')
    })

    it('utiliza la fecha actual si no se proporciona argumento', () => {
      const hoy = new Date()
      const esperado = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
      expect(obtenerFechaLocalISO()).toBe(esperado)
    })
  })

  describe('tiempoRelativo', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-06-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('retorna "Fecha desconocida" para entradas inválidas o nulas', () => {
      expect(tiempoRelativo(null)).toBe('Fecha desconocida')
      expect(tiempoRelativo(undefined)).toBe('Fecha desconocida')
      expect(tiempoRelativo('fecha-invalida')).toBe('Fecha desconocida')
    })

    it('retorna "hace unos segundos" si pasaron menos de 60 segundos', () => {
      const hace30Seg = new Date(Date.now() - 30 * 1000)
      expect(tiempoRelativo(hace30Seg)).toBe('hace unos segundos')
    })

    it('retorna minutos relativos correctamente (singular y plural)', () => {
      const hace1Min = new Date(Date.now() - 65 * 1000)
      expect(tiempoRelativo(hace1Min)).toBe('hace 1 minuto')

      const hace5Min = new Date(Date.now() - 5 * 60 * 1000)
      expect(tiempoRelativo(hace5Min)).toBe('hace 5 minutos')
    })

    it('retorna horas relativas correctamente (singular y plural)', () => {
      const hace1Hora = new Date(Date.now() - 65 * 60 * 1000)
      expect(tiempoRelativo(hace1Hora)).toBe('hace 1 hora')

      const hace3Horas = new Date(Date.now() - 3 * 3600 * 1000)
      expect(tiempoRelativo(hace3Horas)).toBe('hace 3 horas')
    })

    it('retorna días relativos correctamente (singular y plural)', () => {
      const hace1Dia = new Date(Date.now() - 25 * 3600 * 1000)
      expect(tiempoRelativo(hace1Dia)).toBe('hace 1 día')

      const hace4Dias = new Date(Date.now() - 4 * 86400 * 1000)
      expect(tiempoRelativo(hace4Dias)).toBe('hace 4 días')
    })

    it('retorna semanas relativas correctamente', () => {
      const hace2Semanas = new Date(Date.now() - 14 * 86400 * 1000)
      expect(tiempoRelativo(hace2Semanas)).toBe('hace 2 semanas')
    })

    it('retorna meses relativos correctamente', () => {
      const hace2Meses = new Date(Date.now() - 60 * 86400 * 1000)
      expect(tiempoRelativo(hace2Meses)).toBe('hace 2 meses')
    })

    it('acepta strings ISO como entrada', () => {
      const fechaIso = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      expect(tiempoRelativo(fechaIso)).toBe('hace 10 minutos')
    })
  })
})
