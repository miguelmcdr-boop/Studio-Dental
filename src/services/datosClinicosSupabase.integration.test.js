/**
 * F6-D-7: Tests de integración E2E para datos clínicos
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sincronizarPaciente, obtenerDatoClinico, limpiarCacheCompleta } from './datosClinicosSupabase'
import { supabase } from './supabaseClient'

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  },
  USE_SUPABASE: true
}))

/**
 * Crea un objeto "awaitable" que soporta:
 * 1. Encadenamiento de métodos: obj.select().eq().order().limit().maybeSingle()
 * 2. Await directo: const result = await obj.select().eq().order()
 * 
 * Esto se logra haciendo que el objeto tenga método then() (thenable)
 * y también todos los métodos de cadena que retornan el mismo objeto.
 */
const crearAwaitableMock = (result) => {
  const awaitable = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    then: vi.fn((resolve) => Promise.resolve(result).then(resolve))
  }
  awaitable.select.mockReturnValue(awaitable)
  awaitable.eq.mockReturnValue(awaitable)
  awaitable.order.mockReturnValue(awaitable)
  awaitable.limit.mockReturnValue(awaitable)
  awaitable.maybeSingle.mockResolvedValue(result)
  return awaitable
}

const crearMockCompleto = (datosPorTabla = {}) => {
  return (tabla) => {
    const datos = datosPorTabla[tabla] || []
    return crearAwaitableMock({ data: datos, error: null })
  }
}

describe('F6-D-7: Integración E2E de datos clínicos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    limpiarCacheCompleta()
  })

  describe('Flujo completo: Supabase → cache → lectura', () => {
    it('sincroniza recetas correctamente', async () => {
      const pacienteId = 'paciente-123'
      const recetasMock = [
        { id: 'rec-1', fecha: '2026-08-20', medicamentos: ['Amoxicilina'], indicaciones: 'Cada 8h' }
      ]

      supabase.from.mockImplementation(crearMockCompleto({ recetas: recetasMock }))

      await sincronizarPaciente(pacienteId)

      const resultado = obtenerDatoClinico(pacienteId, 'recetas', null)
      expect(resultado).toHaveLength(1)
      expect(resultado[0].medicamentos).toEqual(['Amoxicilina'])
    })

    it('sincroniza evoluciones clínicas correctamente', async () => {
      const pacienteId = 'paciente-456'
      const evolucionesMock = [
        { id: 'evo-1', fecha_hora: '2026-08-20T10:00:00Z', texto: 'Nota 1', tipo: 'evolucion' }
      ]

      supabase.from.mockImplementation(crearMockCompleto({ evoluciones_clinicas: evolucionesMock }))

      await sincronizarPaciente(pacienteId)

      const resultado = obtenerDatoClinico(pacienteId, 'evoluciones_notas', null)
      expect(resultado).toHaveLength(1)
      expect(resultado[0].texto).toBe('Nota 1')
    })

    it('sincroniza certificados correctamente', async () => {
      const pacienteId = 'paciente-789'
      const certificadosMock = [
        { id: 'cert-1', datos: { tipo: 'asistencia', diagnosticoMotivo: 'Exodoncia' } }
      ]

      supabase.from.mockImplementation(crearMockCompleto({ certificados: certificadosMock }))

      await sincronizarPaciente(pacienteId)

      const resultado = obtenerDatoClinico(pacienteId, 'certificados', null)
      expect(resultado).toHaveLength(1)
      expect(resultado[0].tipo).toBe('asistencia')
    })

    it('sincroniza odontograma inicial correctamente', async () => {
      const pacienteId = 'paciente-odontograma'
      const odontogramaMock = {
        id: 'odont-1',
        datos: { '1.1': 'sano', '1.2': 'caries' }
      }

      supabase.from.mockImplementation(crearMockCompleto({ odontogramas: odontogramaMock }))

      await sincronizarPaciente(pacienteId)

      const resultado = obtenerDatoClinico(pacienteId, 'odonto_inicial', null)
      expect(resultado).toEqual({ '1.1': 'sano', '1.2': 'caries' })
    })

    it('sincroniza todos los módulos clínicos simultáneamente', async () => {
      const pacienteId = 'paciente-completo'

      supabase.from.mockImplementation(crearMockCompleto({
        recetas: [{ id: 'rec-1', medicamentos: ['Ibuprofeno'] }],
        evoluciones_clinicas: [{ id: 'evo-1', texto: 'Control' }],
        certificados: [{ id: 'cert-1', datos: { tipo: 'reposo' } }],
        odontogramas: { id: 'odont-1', datos: { '1.1': 'sano' } }
      }))

      await sincronizarPaciente(pacienteId)

      expect(obtenerDatoClinico(pacienteId, 'recetas', null)).toHaveLength(1)
      expect(obtenerDatoClinico(pacienteId, 'evoluciones_notas', null)).toHaveLength(1)
      expect(obtenerDatoClinico(pacienteId, 'certificados', null)).toHaveLength(1)
      expect(obtenerDatoClinico(pacienteId, 'odonto_inicial', null)).toEqual({ '1.1': 'sano' })
    })
  })

  describe('Fallback offline', () => {
    it('retorna fallback cuando Supabase no tiene datos', async () => {
      const pacienteId = 'paciente-vacio'

      supabase.from.mockImplementation(crearMockCompleto())

      await sincronizarPaciente(pacienteId)

      const resultado = obtenerDatoClinico(pacienteId, 'recetas', [])
      expect(resultado).toEqual([])
    })

    it('retorna fallback cuando Supabase falla', async () => {
      const pacienteId = 'paciente-error'

      supabase.from.mockImplementation(() => crearAwaitableMock({
        data: null,
        error: new Error('Network error')
      }))

      await sincronizarPaciente(pacienteId)

      const resultado = obtenerDatoClinico(pacienteId, 'recetas', ['fallback'])
      expect(resultado).toEqual(['fallback'])
    })
  })
})
