import { describe, it, expect, beforeEach, vi } from 'vitest'
import { evaluarIncompatibilidadFarmaco } from './pacientesCalculations'
import { vademecumService } from '../../../services/vademecumService'

// Mock de vademecumService
vi.mock('../../../services/vademecumService', () => ({
  vademecumService: {
    obtenerVademecum: vi.fn(),
    evaluarAlergiaCruzada: vi.fn()
  }
}))

// Mock de finanzasStorageService
vi.mock('../../finanzas/services/finanzasStorageService', () => ({
  finanzasStorageService: {
    obtenerConvenios: vi.fn()
  }
}))


describe('evaluarIncompatibilidadFarmaco', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock por defecto: vademecumService retorna datos válidos
    vademecumService.obtenerVademecum.mockReturnValue([
      { nombre_generico: 'Amoxicilina 500 mg', familia: 'penicilina' },
      { nombre_generico: 'Ibuprofeno 400 mg', familia: 'aine' },
      { nombre_generico: 'Cefadroxilo 500 mg', familia: 'cefalosporina' },
      { nombre_generico: 'Clindamicina 300 mg', familia: 'lincosamida' },
      { nombre_generico: 'Azitromicina 500 mg', familia: 'macrolido' },
      { nombre_generico: 'Paracetamol 500 mg', familia: 'paracetamol' }
    ])
    vademecumService.evaluarAlergiaCruzada.mockReturnValue({
      hayIncompatibilidad: false,
      severidad: null,
      porcentaje_cruzado: null,
      nota_clinica: null
    })
  })

  describe('alergias no informadas (Fail-Safe Clinical Default)', () => {
    it('alergiasTexto = "" → tipo sin_datos, nunca null', () => {
      const resultado = evaluarIncompatibilidadFarmaco('Amoxicilina', '')
      expect(resultado).not.toBeNull()
      expect(resultado.tipo).toBe('sin_datos')
    })

    it('alergiasTexto = undefined → tipo sin_datos, nunca null', () => {
      const resultado = evaluarIncompatibilidadFarmaco('Amoxicilina', undefined)
      expect(resultado).not.toBeNull()
      expect(resultado.tipo).toBe('sin_datos')
    })

    it('alergiasTexto = null → tipo sin_datos, sin lanzar excepción', () => {
      expect(() => evaluarIncompatibilidadFarmaco('Amoxicilina', null)).not.toThrow()
      const resultado = evaluarIncompatibilidadFarmaco('Amoxicilina', null)
      expect(resultado.tipo).toBe('sin_datos')
    })

    it('alergiasTexto = "   " (solo espacios) → tipo sin_datos', () => {
      const resultado = evaluarIncompatibilidadFarmaco('Amoxicilina', '   ')
      expect(resultado.tipo).toBe('sin_datos')
    })

    it('el mensaje de sin_datos indica explícitamente que falta verificar', () => {
      const resultado = evaluarIncompatibilidadFarmaco('Amoxicilina', '')
      expect(resultado.mensaje.toLowerCase()).toMatch(/no registradas|verificar/i)
      expect(resultado.sugerencia.toLowerCase()).toMatch(/verifique|consulte/i)
    })
  })

  describe('alergia a Penicilinas/Betalactámicos informada', () => {
    it('detecta incompatibilidad crítica: alergia "Penicilina" + receta "Amoxicilina"', () => {
      vademecumService.evaluarAlergiaCruzada.mockReturnValue({
        hayIncompatibilidad: true,
        severidad: 'critica',
        porcentaje_cruzado: null,
        nota_clinica: null
      })
      
      const resultado = evaluarIncompatibilidadFarmaco('Amoxicilina', 'Penicilina')
      expect(resultado.tipo).toBe('critica')
      expect(resultado.mensaje.toLowerCase()).toMatch(/alerta grave|critica|reactividad/i)
    })

    it('detecta incompatibilidad crítica: alergia "Betalactamico" + receta "Penicilina" (vía fallback legacy)', () => {
      vademecumService.obtenerVademecum.mockReturnValue([])
      
      const resultado = evaluarIncompatibilidadFarmaco('Penicilina', 'Betalactamico')
      expect(resultado.tipo).toBe('critica')
    })

    it('no distingue mayúsculas/minúsculas en ninguno de los dos textos', () => {
      vademecumService.evaluarAlergiaCruzada.mockReturnValue({
        hayIncompatibilidad: true,
        severidad: 'critica',
        porcentaje_cruzado: null,
        nota_clinica: null
      })
      
      const resultado1 = evaluarIncompatibilidadFarmaco('AMOXICILINA', 'PENICILINA')
      const resultado2 = evaluarIncompatibilidadFarmaco('amoxicilina', 'penicilina')
      
      expect(resultado1.tipo).toBe('critica')
      expect(resultado2.tipo).toBe('critica')
    })

    it('alergia a penicilina pero receta de un fármaco no relacionado → no dispara la alerta crítica', () => {
      vademecumService.evaluarAlergiaCruzada.mockReturnValue({
        hayIncompatibilidad: false,
        severidad: null,
        porcentaje_cruzado: null,
        nota_clinica: null
      })
      
      const resultado = evaluarIncompatibilidadFarmaco('Paracetamol', 'Penicilina')
      expect(resultado).toBeNull()
    })
  })

  describe('alergia a AINEs informada', () => {
    it('detecta incompatibilidad: alergia "AINE" + receta "Ibuprofeno"', () => {
      vademecumService.evaluarAlergiaCruzada.mockReturnValue({
        hayIncompatibilidad: true,
        severidad: 'critica',
        porcentaje_cruzado: null,
        nota_clinica: null
      })
      
      const resultado = evaluarIncompatibilidadFarmaco('Ibuprofeno', 'AINE')
      expect(resultado.tipo).toBe('critica')
      expect(resultado.mensaje).toMatch(/ALERTA/i)
    })

    it('detecta advertencia: alergia "Aspirina" + receta "Diclofenaco" (vía fallback legacy)', () => {
      vademecumService.obtenerVademecum.mockReturnValue([])
      
      const resultado = evaluarIncompatibilidadFarmaco('Diclofenaco', 'Aspirina')
      expect(resultado.tipo).toBe('advertencia')
    })

    it('cubre Ketorolaco, Ketoprofeno y Naproxeno como fármacos de esta categoría', () => {
      vademecumService.obtenerVademecum.mockReturnValue([
        { nombre_generico: 'Ketorolaco 10 mg', familia: 'aine' },
        { nombre_generico: 'Ketoprofeno 100 mg', familia: 'aine' },
        { nombre_generico: 'Naproxeno 500 mg', familia: 'aine' }
      ])
      
      vademecumService.evaluarAlergiaCruzada.mockReturnValue({
        hayIncompatibilidad: true,
        severidad: 'critica',
        porcentaje_cruzado: null,
        nota_clinica: null
      })
      
      expect(evaluarIncompatibilidadFarmaco('Ketorolaco', 'AINE').tipo).toBe('critica')
      expect(evaluarIncompatibilidadFarmaco('Ketoprofeno', 'AINE').tipo).toBe('critica')
      expect(evaluarIncompatibilidadFarmaco('Naproxeno', 'AINE').tipo).toBe('critica')
    })
  })

  describe('alergias informadas pero fuera de la cobertura de esta validación', () => {
    it('alergia a "Látex" (no cubierta) + receta de Amoxicilina → null', () => {
      vademecumService.evaluarAlergiaCruzada.mockReturnValue({
        hayIncompatibilidad: false,
        severidad: null,
        porcentaje_cruzado: null,
        nota_clinica: null
      })
      
      const resultado = evaluarIncompatibilidadFarmaco('Amoxicilina', 'Látex')
      expect(resultado).toBeNull()
    })

    it('alergias informadas + fármaco no perteneciente a ninguna categoría → null', () => {
      vademecumService.evaluarAlergiaCruzada.mockReturnValue({
        hayIncompatibilidad: false,
        severidad: null,
        porcentaje_cruzado: null,
        nota_clinica: null
      })
      
      const resultado = evaluarIncompatibilidadFarmaco('Agua destilada', 'Penicilina')
      expect(resultado).toBeNull()
    })
  })

  describe('robustez ante entradas inesperadas', () => {
    it('textoMedicamento vacío o undefined no lanza excepción', () => {
      expect(() => evaluarIncompatibilidadFarmaco('', 'Penicilina')).not.toThrow()
      expect(() => evaluarIncompatibilidadFarmaco(undefined, 'Penicilina')).not.toThrow()
      expect(() => evaluarIncompatibilidadFarmaco(null, 'Penicilina')).not.toThrow()
    })

    it('ambos parámetros ausentes no lanza excepción y retorna sin_datos', () => {
      expect(() => evaluarIncompatibilidadFarmaco(undefined, undefined)).not.toThrow()
      const resultado = evaluarIncompatibilidadFarmaco(undefined, undefined)
      expect(resultado.tipo).toBe('sin_datos')
    })
  })

  describe('F4-03e: integración con vademecumService (nuevas capacidades)', () => {
    it('detecta familia del fármaco desde el vademécum', () => {
      vademecumService.obtenerVademecum.mockReturnValue([
        { nombre_generico: 'Amoxicilina 500 mg', familia: 'penicilina' }
      ])
      vademecumService.evaluarAlergiaCruzada.mockReturnValue({
        hayIncompatibilidad: false,
        severidad: null,
        porcentaje_cruzado: null,
        nota_clinica: null
      })
      
      evaluarIncompatibilidadFarmaco('Amoxicilina 500 mg', 'AINE')
      
      expect(vademecumService.evaluarAlergiaCruzada).toHaveBeenCalledWith('aine', 'penicilina')
    })

    it('detecta múltiples familias de alergias desde texto libre', () => {
      vademecumService.obtenerVademecum.mockReturnValue([
        { nombre_generico: 'Ibuprofeno 400 mg', familia: 'aine' }
      ])
      vademecumService.evaluarAlergiaCruzada.mockReturnValue({
        hayIncompatibilidad: false,
        severidad: null,
        porcentaje_cruzado: null,
        nota_clinica: null
      })
      
      evaluarIncompatibilidadFarmaco('Ibuprofeno', 'Alergia a Penicilina y AINEs')
      
      // Debe consultar matriz para ambas familias detectadas
      expect(vademecumService.evaluarAlergiaCruzada).toHaveBeenCalledWith('penicilina', 'aine')
      expect(vademecumService.evaluarAlergiaCruzada).toHaveBeenCalledWith('aine', 'aine')
    })

    it('retorna severidad dinámica desde matriz de alergias cruzadas (advertencia)', () => {
      vademecumService.evaluarAlergiaCruzada.mockReturnValue({
        hayIncompatibilidad: true,
        severidad: 'advertencia',
        porcentaje_cruzado: '5-10%',
        nota_clinica: 'Reactividad cruzada documentada'
      })
      
      const resultado = evaluarIncompatibilidadFarmaco('Cefadroxilo', 'Alergia a Penicilina')
      
      expect(resultado.tipo).toBe('advertencia')
      expect(resultado.mensaje).toMatch(/5-10%/)
      expect(resultado.mensaje).toMatch(/Reactividad cruzada/)
    })

    it('retorna mensaje crítico cuando severidad es "critica"', () => {
      vademecumService.evaluarAlergiaCruzada.mockReturnValue({
        hayIncompatibilidad: true,
        severidad: 'critica',
        porcentaje_cruzado: null,
        nota_clinica: 'Contraindicación absoluta'
      })
      
      const resultado = evaluarIncompatibilidadFarmaco('Amoxicilina', 'Penicilina')
      
      expect(resultado.tipo).toBe('critica')
      expect(resultado.mensaje).toMatch(/ALERTA GRAVE/)
    })

    it('usa fallback legacy si vademecumService falla', () => {
      vademecumService.obtenerVademecum.mockImplementation(() => {
        throw new Error('Error de red')
      })
      
      const resultado = evaluarIncompatibilidadFarmaco('Amoxicilina', 'Penicilina')
      
      expect(resultado.tipo).toBe('critica')
      expect(resultado.mensaje).toMatch(/ALERTA GRAVE/)
    })

    it('usa fallback legacy si vademecumService retorna array vacío', () => {
      vademecumService.obtenerVademecum.mockReturnValue([])
      
      const resultado = evaluarIncompatibilidadFarmaco('Ibuprofeno', 'AINE')
      
      expect(resultado.tipo).toBe('advertencia')
      expect(resultado.mensaje).toMatch(/ALERTA/)
    })

    it('genera sugerencias específicas por familia', () => {
      vademecumService.evaluarAlergiaCruzada.mockReturnValue({
        hayIncompatibilidad: true,
        severidad: 'critica',
        porcentaje_cruzado: null,
        nota_clinica: null
      })
      
      const resultado = evaluarIncompatibilidadFarmaco('Amoxicilina', 'Penicilina')
      
      expect(resultado.sugerencia).toMatch(/Clindamicina|Azitromicina/)
    })

    it('maneja alergias con tildes y mayúsculas', () => {
      vademecumService.evaluarAlergiaCruzada.mockReturnValue({
        hayIncompatibilidad: true,
        severidad: 'critica',
        porcentaje_cruzado: null,
        nota_clinica: null
      })
      
      const resultado = evaluarIncompatibilidadFarmaco('AMOXICILINA', 'Alergia a PENICILINA')
      
      expect(resultado.tipo).toBe('critica')
    })
  })
})
