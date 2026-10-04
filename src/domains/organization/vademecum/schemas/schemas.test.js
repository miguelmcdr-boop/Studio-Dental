/**
 * Tests consolidados para schemas Zod del módulo administracion (F6-K Fase 5)
 *
 * Cubre los 5 schemas Zod:
 * - alergiaCruzadaSchema
 * - anticoagulanteSchema + validarAnticoagulante
 * - interaccionSchema + validarInteraccion
 * - profilaxisSchema + validarProfilaxis
 * - vademecumSchema (farmacoSchema, urgenciaSchema, antirresortivoSchema)
 *
 * Patrón de tests:
 * - Caso feliz: datos válidos pasan validación
 * - Casos error: campos requeridos, strings muy cortos/largos, enums inválidos
 * - Valores por defecto y campos opcionales
 */
import { describe, it, expect } from 'vitest'
import { 
  alergiaCruzadaSchema, 
  FAMILIAS_ALERGIAS, 
  NIVELES_SEVERIDAD 
} from './alergiaCruzadaSchema'
import { 
  anticoagulanteSchema, 
  validarAnticoagulante 
} from './anticoagulanteSchema'
import { 
  interaccionSchema, 
  validarInteraccion,
  NIVELES_SEVERIDAD_INTERACCION
} from './interaccionSchema'
import { 
  profilaxisSchema, 
  validarProfilaxis 
} from './profilaxisSchema'
import { 
  farmacoSchema,
  urgenciaSchema,
  antirresortivoSchema,
  FAMILIAS_VADEMECUM
} from './vademecumSchema'

// ═══════════════════════════════════════════════════════════════
// ALERGIA CRUZADA SCHEMA
// ═══════════════════════════════════════════════════════════════
describe('alergiaCruzadaSchema', () => {
  const datosValidos = {
    familia_alergia: 'penicilina',
    familia_farmaco: 'cefalosporina',
    severidad: 'advertencia',
    nota_clinica: 'Reactividad cruzada del 5-10%'
  }

  describe('FAMILIAS_ALERGIAS', () => {
    it('debe tener 16 familias de alergias', () => {
      expect(FAMILIAS_ALERGIAS).toHaveLength(16)
    })

    it('debe incluir familias comunes', () => {
      expect(FAMILIAS_ALERGIAS).toContain('penicilina')
      expect(FAMILIAS_ALERGIAS).toContain('cefalosporina')
      expect(FAMILIAS_ALERGIAS).toContain('aine')
      expect(FAMILIAS_ALERGIAS).toContain('anestesico_amida')
    })
  })

  describe('NIVELES_SEVERIDAD', () => {
    it('debe tener 3 niveles', () => {
      expect(NIVELES_SEVERIDAD).toHaveLength(3)
    })

    it('debe incluir critica, advertencia y sin_relacion', () => {
      expect(NIVELES_SEVERIDAD).toContain('critica')
      expect(NIVELES_SEVERIDAD).toContain('advertencia')
      expect(NIVELES_SEVERIDAD).toContain('sin_relacion')
    })
  })

  it('debe validar datos válidos', () => {
    const resultado = alergiaCruzadaSchema.safeParse(datosValidos)
    expect(resultado.success).toBe(true)
  })

  it('debe rechazar familia_alergia inválida', () => {
    const resultado = alergiaCruzadaSchema.safeParse({
      ...datosValidos,
      familia_alergia: 'familia_invalida'
    })
    expect(resultado.success).toBe(false)
  })

  it('debe rechazar severidad inválida', () => {
    const resultado = alergiaCruzadaSchema.safeParse({
      ...datosValidos,
      severidad: 'severidad_invalida'
    })
    expect(resultado.success).toBe(false)
  })

  it('debe permitir nota_clinica opcional', () => {
    const sinNota = { ...datosValidos }
    delete sinNota.nota_clinica
    
    const resultado = alergiaCruzadaSchema.safeParse(sinNota)
    expect(resultado.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════
// ANTICOAGULANTE SCHEMA
// ═══════════════════════════════════════════════════════════════
describe('anticoagulanteSchema', () => {
  const datosValidos = {
    farmaco_o_grupo: 'Warfarina',
    recomendacion: 'Suspender 5 días antes de cirugía',
    medidas_hemostasia: 'Ácido tranexámico tópico',
    activo: true
  }

  it('debe validar datos válidos', () => {
    const resultado = anticoagulanteSchema.safeParse(datosValidos)
    expect(resultado.success).toBe(true)
  })

  it('debe rechazar farmaco_o_grupo vacío', () => {
    const resultado = anticoagulanteSchema.safeParse({
      ...datosValidos,
      farmaco_o_grupo: ''
    })
    expect(resultado.success).toBe(false)
  })

  it('debe rechazar farmaco_o_grupo muy corto', () => {
    const resultado = anticoagulanteSchema.safeParse({
      ...datosValidos,
      farmaco_o_grupo: 'A'
    })
    expect(resultado.success).toBe(false)
  })

  it('debe rechazar recomendación vacía', () => {
    const resultado = anticoagulanteSchema.safeParse({
      ...datosValidos,
      recomendacion: ''
    })
    expect(resultado.success).toBe(false)
  })

  it('debe permitir medidas_hemostasia opcional', () => {
    const sinMedidas = { ...datosValidos }
    delete sinMedidas.medidas_hemostasia
    
    const resultado = anticoagulanteSchema.safeParse(sinMedidas)
    expect(resultado.success).toBe(true)
  })

  it('debe aplicar valor por defecto activo=true', () => {
    const sinActivo = { ...datosValidos }
    delete sinActivo.activo
    
    const resultado = anticoagulanteSchema.safeParse(sinActivo)
    expect(resultado.success).toBe(true)
    expect(resultado.data.activo).toBe(true)
  })
})

describe('validarAnticoagulante', () => {
  const datosValidos = {
    farmaco_o_grupo: 'Warfarina',
    recomendacion: 'Suspender 5 días antes'
  }

  it('debe retornar valido=true con datos válidos', () => {
    const resultado = validarAnticoagulante(datosValidos)
    expect(resultado.valido).toBe(true)
    expect(resultado.errores).toEqual({})
    expect(resultado.datos).toBeDefined()
  })

  it('debe retornar valido=false con datos inválidos', () => {
    const resultado = validarAnticoagulante({
      farmaco_o_grupo: '',
      recomendacion: ''
    })
    expect(resultado.valido).toBe(false)
    expect(Object.keys(resultado.errores).length).toBeGreaterThan(0)
  })

  it('debe incluir errores específicos por campo', () => {
    const resultado = validarAnticoagulante({
      farmaco_o_grupo: '',
      recomendacion: 'Recomendación válida'
    })
    expect(resultado.errores).toHaveProperty('farmaco_o_grupo')
    expect(resultado.errores).not.toHaveProperty('recomendacion')
  })
})

// ═══════════════════════════════════════════════════════════════
// INTERACCION SCHEMA
// ═══════════════════════════════════════════════════════════════
describe('interaccionSchema', () => {
  const datosValidos = {
    farmaco_a: 'Warfarina',
    farmaco_b: 'AINEs',
    efecto: 'Aumento del riesgo de sangrado',
    manejo: 'Evitar combinación o monitorear INR',
    severidad: 'mayor',
    activo: true
  }

  describe('NIVELES_SEVERIDAD_INTERACCION', () => {
    it('debe tener 3 niveles', () => {
      expect(NIVELES_SEVERIDAD_INTERACCION).toHaveLength(3)
    })

    it('debe incluir mayor, moderada y menor', () => {
      expect(NIVELES_SEVERIDAD_INTERACCION).toContain('mayor')
      expect(NIVELES_SEVERIDAD_INTERACCION).toContain('moderada')
      expect(NIVELES_SEVERIDAD_INTERACCION).toContain('menor')
    })
  })

  it('debe validar datos válidos', () => {
    const resultado = interaccionSchema.safeParse(datosValidos)
    expect(resultado.success).toBe(true)
  })

  it('debe rechazar farmaco_a vacío', () => {
    const resultado = interaccionSchema.safeParse({
      ...datosValidos,
      farmaco_a: ''
    })
    expect(resultado.success).toBe(false)
  })

  it('debe rechazar farmaco_b vacío', () => {
    const resultado = interaccionSchema.safeParse({
      ...datosValidos,
      farmaco_b: ''
    })
    expect(resultado.success).toBe(false)
  })

  it('debe rechazar severidad inválida', () => {
    const resultado = interaccionSchema.safeParse({
      ...datosValidos,
      severidad: 'critica'
    })
    expect(resultado.success).toBe(false)
  })

  it('debe permitir manejo opcional', () => {
    const sinManejo = { ...datosValidos }
    delete sinManejo.manejo
    
    const resultado = interaccionSchema.safeParse(sinManejo)
    expect(resultado.success).toBe(true)
  })
})

describe('validarInteraccion', () => {
  const datosValidos = {
    farmaco_a: 'Warfarina',
    farmaco_b: 'AINEs',
    efecto: 'Aumento del riesgo de sangrado',
    severidad: 'mayor'
  }

  it('debe retornar valido=true con datos válidos', () => {
    const resultado = validarInteraccion(datosValidos)
    expect(resultado.valido).toBe(true)
    expect(resultado.errores).toEqual({})
    expect(resultado.datos).toBeDefined()
  })

  it('debe retornar valido=false con datos inválidos', () => {
    const resultado = validarInteraccion({
      farmaco_a: '',
      farmaco_b: '',
      efecto: '',
      severidad: 'invalida'
    })
    expect(resultado.valido).toBe(false)
    expect(Object.keys(resultado.errores).length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// PROFILAXIS SCHEMA
// ═══════════════════════════════════════════════════════════════
describe('profilaxisSchema', () => {
  const datosValidos = {
    situacion: 'Procedimientos con sangrado',
    farmaco: 'Amoxicilina',
    dosis_adulto: '2g VO 1 hora antes',
    dosis_pediatrica: '50mg/kg VO 1 hora antes',
    nota: 'Alternativa: Clindamicina 600mg',
    activo: true
  }

  it('debe validar datos válidos', () => {
    const resultado = profilaxisSchema.safeParse(datosValidos)
    expect(resultado.success).toBe(true)
  })

  it('debe rechazar situación vacía', () => {
    const resultado = profilaxisSchema.safeParse({
      ...datosValidos,
      situacion: ''
    })
    expect(resultado.success).toBe(false)
  })

  it('debe rechazar fármaco vacío', () => {
    const resultado = profilaxisSchema.safeParse({
      ...datosValidos,
      farmaco: ''
    })
    expect(resultado.success).toBe(false)
  })

  it('debe rechazar dosis_adulto vacía', () => {
    const resultado = profilaxisSchema.safeParse({
      ...datosValidos,
      dosis_adulto: ''
    })
    expect(resultado.success).toBe(false)
  })

  it('debe permitir dosis_pediatrica opcional', () => {
    const sinPediatrica = { ...datosValidos }
    delete sinPediatrica.dosis_pediatrica
    
    const resultado = profilaxisSchema.safeParse(sinPediatrica)
    expect(resultado.success).toBe(true)
  })

  it('debe permitir nota opcional', () => {
    const sinNota = { ...datosValidos }
    delete sinNota.nota
    
    const resultado = profilaxisSchema.safeParse(sinNota)
    expect(resultado.success).toBe(true)
  })
})

describe('validarProfilaxis', () => {
  const datosValidos = {
    situacion: 'Procedimientos con sangrado',
    farmaco: 'Amoxicilina',
    dosis_adulto: '2g VO 1 hora antes'
  }

  it('debe retornar valido=true con datos válidos', () => {
    const resultado = validarProfilaxis(datosValidos)
    expect(resultado.valido).toBe(true)
    expect(resultado.errores).toEqual({})
    expect(resultado.datos).toBeDefined()
  })

  it('debe retornar valido=false con datos inválidos', () => {
    const resultado = validarProfilaxis({
      situacion: '',
      farmaco: '',
      dosis_adulto: ''
    })
    expect(resultado.valido).toBe(false)
    expect(Object.keys(resultado.errores).length).toBeGreaterThan(0)
  })

  it('debe incluir errores específicos por campo', () => {
    const resultado = validarProfilaxis({
      situacion: 'Situación válida',
      farmaco: '',
      dosis_adulto: 'Dosis válida'
    })
    expect(resultado.errores).toHaveProperty('farmaco')
    expect(resultado.errores).not.toHaveProperty('situacion')
    expect(resultado.errores).not.toHaveProperty('dosis_adulto')
  })
})

// ═══════════════════════════════════════════════════════════════
// VADEMECUM SCHEMA
// ═══════════════════════════════════════════════════════════════
describe('vademecumSchema', () => {
  describe('FAMILIAS_VADEMECUM', () => {
    it('debe tener 23 familias', () => {
      expect(FAMILIAS_VADEMECUM).toHaveLength(23)
    })

    it('debe incluir familias comunes', () => {
      expect(FAMILIAS_VADEMECUM).toContain('penicilina')
      expect(FAMILIAS_VADEMECUM).toContain('anestesico_amida')
      expect(FAMILIAS_VADEMECUM).toContain('aine')
      expect(FAMILIAS_VADEMECUM).toContain('antifungico')
    })
  })

  describe('farmacoSchema', () => {
    const datosValidos = {
      numero: 1,
      nombre_generico: 'Amoxicilina',
      nombre_comercial: 'Amoxal',
      familia: 'penicilina',
      presentacion: 'Cápsulas 500mg',
      posologia_adulto: '500mg cada 8 horas',
      posologia_pediatrica: '25-50mg/kg/día dividido en 3 dosis',
      indicaciones: 'Infecciones bacterianas',
      contraindicaciones: 'Alergia a penicilina',
      activo: true
    }

    it('debe validar datos válidos', () => {
      const resultado = farmacoSchema.safeParse(datosValidos)
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar nombre_generico vacío', () => {
      const resultado = farmacoSchema.safeParse({
        ...datosValidos,
        nombre_generico: ''
      })
      expect(resultado.success).toBe(false)
    })

    it('debe rechazar familia inválida', () => {
      const resultado = farmacoSchema.safeParse({
        ...datosValidos,
        familia: 'familia_invalida'
      })
      expect(resultado.success).toBe(false)
    })
  })

  describe('urgenciaSchema', () => {
    const datosValidos = {
      numero: 1,
      nombre_generico: 'Epinefrina',
      presentacion: 'Ampolla 1mg/mL',
      indicacion: 'Anafilaxia, paro cardíaco',
      via_administracion: 'IM',
      activo: true
    }

    it('debe validar datos válidos', () => {
      const resultado = urgenciaSchema.safeParse(datosValidos)
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar nombre_generico vacío', () => {
      const resultado = urgenciaSchema.safeParse({
        ...datosValidos,
        nombre_generico: ''
      })
      expect(resultado.success).toBe(false)
    })
  })

  describe('antirresortivoSchema', () => {
    const datosValidos = {
      numero: 1,
      nombre_generico: 'Alendronato',
      familia: 'bifosfonato_oral',
      via_administracion: 'Oral',
      riesgo_mronj: 'bajo',
      indicacion: 'Osteoporosis postmenopáusica',
      manejo_odontologico: 'Suspender 2 meses antes de cirugía invasiva',
      activo: true
    }

    it('debe validar datos válidos', () => {
      const resultado = antirresortivoSchema.safeParse(datosValidos)
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar nombre_generico vacío', () => {
      const resultado = antirresortivoSchema.safeParse({
        ...datosValidos,
        nombre_generico: ''
      })
      expect(resultado.success).toBe(false)
    })
  })
})
