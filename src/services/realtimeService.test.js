/**
 * Tests unitarios de realtimeService (F5-01).
 *
 * Cobertura:
 * - Suscripción exitosa a tabla válida
 * - Callback recibe payload cuando hay evento
 * - Desuscripción limpia el canal
 * - Si USE_SUPABASE=false, retorna null sin error
 * - Si supabase=null, no falla
 * - Validación de parámetros (tabla inválida, callback no-función)
 * - Filtros personalizados por columna
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock del módulo supabaseClient
vi.mock('./supabaseClient', () => ({
  get USE_SUPABASE() {
    return globalThis.__mockUseSupabase ?? true
  },
  get supabase() {
    return globalThis.__mockSupabase ?? null
  }
}))

describe('realtimeService', () => {
  let realtimeService
  let mockChannel
  let mockSupabase

  beforeEach(async () => {
    vi.resetModules()

    // Crear mock del canal con suscripción
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        // Simular suscripción exitosa
        if (typeof callback === 'function') {
          callback('SUBSCRIBED')
        }
        return mockChannel
      })
    }

    mockSupabase = {
      channel: vi.fn(() => mockChannel),
      removeChannel: vi.fn()
    }

    globalThis.__mockUseSupabase = true
    globalThis.__mockSupabase = mockSupabase

    const module = await import('./realtimeService')
    realtimeService = module.realtimeService
  })

  afterEach(() => {
    vi.clearAllMocks()
    delete globalThis.__mockUseSupabase
    delete globalThis.__mockSupabase
  })

  describe('suscribirseATabla', () => {
    it('debe suscribirse a una tabla válida y retornar objeto con unsubscribe', () => {
      const callback = vi.fn()
      const sub = realtimeService.suscribirseATabla('citas', callback)

      expect(sub).not.toBeNull()
      expect(typeof sub.unsubscribe).toBe('function')
      expect(mockSupabase.channel).toHaveBeenCalledTimes(1)
      expect(mockChannel.on).toHaveBeenCalledTimes(1)
      expect(mockChannel.subscribe).toHaveBeenCalledTimes(1)
    })

    it('debe pasar el nombre de tabla y evento al canal', () => {
      const callback = vi.fn()
      realtimeService.suscribirseATabla('pacientes', callback, { evento: 'INSERT' })

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pacientes'
        },
        expect.any(Function)
      )
    })

    it('debe usar evento "*" por defecto', () => {
      const callback = vi.fn()
      realtimeService.suscribirseATabla('citas', callback)

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({ event: '*' }),
        expect.any(Function)
      )
    })

    it('debe invocar el callback cuando llega un evento', () => {
      const callback = vi.fn()
      realtimeService.suscribirseATabla('citas', callback)

      // Obtener el callback registrado en .on()
      const registeredCallback = mockChannel.on.mock.calls[0][2]
      const payload = {
        eventType: 'INSERT',
        new: { id: '1', fecha: '2026-08-14' }
      }

      registeredCallback(payload)

      expect(callback).toHaveBeenCalledWith(payload)
    })

    it('debe invocar unsubscribe correctamente', () => {
      const callback = vi.fn()
      const sub = realtimeService.suscribirseATabla('citas', callback)

      sub.unsubscribe()

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })

    it('debe retornar null si USE_SUPABASE es false', async () => {
      vi.resetModules()
      globalThis.__mockUseSupabase = false

      const module = await import('./realtimeService')
      const callback = vi.fn()
      const sub = module.realtimeService.suscribirseATabla('citas', callback)

      expect(sub).toBeNull()
    })

    it('debe retornar null si supabase es null', async () => {
      vi.resetModules()
      globalThis.__mockUseSupabase = true
      globalThis.__mockSupabase = null

      const module = await import('./realtimeService')
      const callback = vi.fn()
      const sub = module.realtimeService.suscribirseATabla('citas', callback)

      expect(sub).toBeNull()
    })

    it('debe retornar null si tabla es inválida', () => {
      const callback = vi.fn()

      expect(realtimeService.suscribirseATabla('', callback)).toBeNull()
      expect(realtimeService.suscribirseATabla(null, callback)).toBeNull()
      expect(realtimeService.suscribirseATabla(undefined, callback)).toBeNull()
      expect(realtimeService.suscribirseATabla(123, callback)).toBeNull()
    })

    it('debe retornar null si callback no es función', () => {
      expect(realtimeService.suscribirseATabla('citas', 'no es función')).toBeNull()
      expect(realtimeService.suscribirseATabla('citas', null)).toBeNull()
      expect(realtimeService.suscribirseATabla('citas', {})).toBeNull()
    })

    it('debe agregar filtro cuando se especifica', () => {
      const callback = vi.fn()
      const pacienteId = '550e8400-e29b-41d4-a716-446655440000'

      realtimeService.suscribirseATabla('citas', callback, {
        filtro: { columna: 'paciente_id', valor: pacienteId }
      })

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          filter: `paciente_id=eq.${pacienteId}`
        }),
        expect.any(Function)
      )
    })

    it('no debe agregar filtro si no se especifica', () => {
      const callback = vi.fn()
      realtimeService.suscribirseATabla('citas', callback)

      const config = mockChannel.on.mock.calls[0][1]
      expect(config).not.toHaveProperty('filter')
    })

    it('debe manejar errores en callback sin romper la suscripción', () => {
      const callback = vi.fn(() => {
        throw new Error('Error en callback')
      })

      // Silenciar console.error durante este test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      realtimeService.suscribirseATabla('citas', callback)

      const registeredCallback = mockChannel.on.mock.calls[0][2]
      registeredCallback({ eventType: 'INSERT' })

      expect(callback).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('debe generar nombres de canal únicos para cada suscripción', () => {
      const callback = vi.fn()
      realtimeService.suscribirseATabla('citas', callback)
      realtimeService.suscribirseATabla('citas', callback)

      const nombresCanales = mockSupabase.channel.mock.calls.map(c => c[0])
      expect(new Set(nombresCanales).size).toBe(2)
    })
  })
})
