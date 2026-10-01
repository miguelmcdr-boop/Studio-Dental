/**
 * F6-D-7: Tests de aislamiento multi-clínica
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sincronizarPaciente, obtenerDatoClinico, limpiarCacheCompleta } from '../../services/datosClinicosSupabase'
import { supabase } from '../../services/supabaseClient'

vi.mock('../../services/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  },
  USE_SUPABASE: true
}))

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

describe('F6-D-7: Aislamiento multi-clínica', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    limpiarCacheCompleta()
  })

  describe('Aislamiento entre clínicas', () => {
    it('clínica 1 solo ve sus propias recetas', async () => {
      const pacienteId1 = 'paciente-clinica-1-test1'
      const recetasClinica1 = [
        { id: 'rec-1', fecha: '2026-08-20', medicamentos: ['Amoxicilina'] }
      ]

      supabase.from.mockImplementation(crearMockCompleto({ recetas: recetasClinica1 }))

      await sincronizarPaciente(pacienteId1)

      const resultado = obtenerDatoClinico(pacienteId1, 'recetas', null)
      expect(resultado).toHaveLength(1)
      expect(resultado[0].medicamentos).toEqual(['Amoxicilina'])
    })

    it('clínica 2 solo ve sus propias recetas', async () => {
      const pacienteId2 = 'paciente-clinica-2-test2'
      const recetasClinica2 = [
        { id: 'rec-2', fecha: '2026-08-20', medicamentos: ['Ibuprofeno'] }
      ]

      supabase.from.mockImplementation(crearMockCompleto({ recetas: recetasClinica2 }))

      await sincronizarPaciente(pacienteId2)

      const resultado = obtenerDatoClinico(pacienteId2, 'recetas', null)
      expect(resultado).toHaveLength(1)
      expect(resultado[0].medicamentos).toEqual(['Ibuprofeno'])
    })

    it('datos de clínica 1 no aparecen en clínica 2', async () => {
      const pacienteId1 = 'paciente-clinica-1-test3'
      const pacienteId2 = 'paciente-clinica-2-test3'

      const recetasClinica1 = [
        { id: 'rec-1', fecha: '2026-08-20', medicamentos: ['Amoxicilina'] }
      ]

      supabase.from.mockImplementation(crearMockCompleto({ recetas: recetasClinica1 }))
      await sincronizarPaciente(pacienteId1)

      const resultadoClinica1 = obtenerDatoClinico(pacienteId1, 'recetas', null)
      expect(resultadoClinica1).toHaveLength(1)
      expect(resultadoClinica1[0].medicamentos).toEqual(['Amoxicilina'])

      vi.clearAllMocks()
      limpiarCacheCompleta()
      
      const recetasClinica2 = [
        { id: 'rec-2', fecha: '2026-08-20', medicamentos: ['Ibuprofeno'] }
      ]

      supabase.from.mockImplementation(crearMockCompleto({ recetas: recetasClinica2 }))
      await sincronizarPaciente(pacienteId2)

      const resultadoClinica2 = obtenerDatoClinico(pacienteId2, 'recetas', null)
      expect(resultadoClinica2).toHaveLength(1)
      expect(resultadoClinica2[0].medicamentos).toEqual(['Ibuprofeno'])
      expect(resultadoClinica2[0].medicamentos).not.toEqual(['Amoxicilina'])
    })

    it('cambio de clínica recarga datos correctos', async () => {
      const pacienteId1 = 'paciente-clinica-1-test4'
      const pacienteId2 = 'paciente-clinica-2-test4'

      supabase.from.mockImplementation(crearMockCompleto({
        recetas: [{ id: 'rec-1', medicamentos: ['Paracetamol'] }]
      }))

      await sincronizarPaciente(pacienteId1)
      let resultado = obtenerDatoClinico(pacienteId1, 'recetas', null)
      expect(resultado[0].medicamentos).toEqual(['Paracetamol'])

      vi.clearAllMocks()
      limpiarCacheCompleta()
      
      supabase.from.mockImplementation(crearMockCompleto({
        recetas: [{ id: 'rec-2', medicamentos: ['Ketorolaco'] }]
      }))

      await sincronizarPaciente(pacienteId2)
      resultado = obtenerDatoClinico(pacienteId2, 'recetas', null)
      expect(resultado[0].medicamentos).toEqual(['Ketorolaco'])
      expect(resultado[0].medicamentos).not.toEqual(['Paracetamol'])
    })

    it('aislamiento funciona para todos los módulos clínicos', async () => {
      const pacienteId1 = 'paciente-clinica-1-test5'
      const pacienteId2 = 'paciente-clinica-2-test5'

      supabase.from.mockImplementation(crearMockCompleto({
        recetas: [{ id: 'rec-1', medicamentos: ['Med1'] }],
        evoluciones_clinicas: [{ id: 'evo-1', texto: 'Nota clínica 1' }]
      }))

      await sincronizarPaciente(pacienteId1)

      expect(obtenerDatoClinico(pacienteId1, 'recetas', null)).toHaveLength(1)
      expect(obtenerDatoClinico(pacienteId1, 'evoluciones_notas', null)).toHaveLength(1)

      vi.clearAllMocks()
      limpiarCacheCompleta()
      
      supabase.from.mockImplementation(crearMockCompleto({
        recetas: [{ id: 'rec-2', medicamentos: ['Med2'] }],
        evoluciones_clinicas: [{ id: 'evo-2', texto: 'Nota clínica 2' }]
      }))

      await sincronizarPaciente(pacienteId2)

      const recetasClinica2 = obtenerDatoClinico(pacienteId2, 'recetas', null)
      const evolucionesClinica2 = obtenerDatoClinico(pacienteId2, 'evoluciones_notas', null)

      expect(recetasClinica2[0].medicamentos).toEqual(['Med2'])
      expect(evolucionesClinica2[0].texto).toBe('Nota clínica 2')
    })
  })
})
