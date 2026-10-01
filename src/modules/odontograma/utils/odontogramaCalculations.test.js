import { describe, it, expect } from 'vitest'
import { calcularIndiceCPOD } from './odontogramaCalculations'

describe('calcularIndiceCPOD', () => {
  it('retorna todo en cero para un odontograma vacío o indefinido', () => {
    expect(calcularIndiceCPOD({})).toEqual({
      cariados: 0,
      perdidos: 0,
      obturados: 0,
      sanos: 0,
      cpodTotal: 0,
      nivelRiesgoOMS: 'Muy Bajo',
      colorBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    })
    expect(calcularIndiceCPOD(undefined).cpodTotal).toBe(0)
  })

  it('clasifica piezas ausentes o con indicación de exodoncia como perdidas', () => {
    const odontograma = {
      11: { general: 'ausente' },
      12: { general: 'indicacion_exodoncia' },
    }
    const r = calcularIndiceCPOD(odontograma)
    expect(r.perdidos).toBe(2)
    expect(r.cpodTotal).toBe(2)
  })

  it('clasifica caries a nivel de pieza general', () => {
    const r = calcularIndiceCPOD({ 21: { general: 'caries' } })
    expect(r.cariados).toBe(1)
    expect(r.sanos).toBe(0)
  })

  it('clasifica caries detectada a nivel de cara aunque el estado general no lo indique', () => {
    const odontograma = {
      22: { general: 'sano', caras: { mesial: 'caries', distal: 'sano' } },
    }
    const r = calcularIndiceCPOD(odontograma)
    expect(r.cariados).toBe(1)
  })

  it('la caries tiene prioridad sobre la obturación si ambas están presentes en caras distintas', () => {
    const odontograma = {
      23: { general: 'sano', caras: { mesial: 'restauracion', distal: 'caries' } },
    }
    const r = calcularIndiceCPOD(odontograma)
    expect(r.cariados).toBe(1)
    expect(r.obturados).toBe(0)
  })

  it('clasifica restauración, incrustación o corona como obturado', () => {
    const odontograma = {
      31: { general: 'restauracion' },
      32: { general: 'incrustacion' },
      33: { general: 'corona' },
    }
    const r = calcularIndiceCPOD(odontograma)
    expect(r.obturados).toBe(3)
  })

  it('un sellante a nivel de cara cuenta como obturado', () => {
    const r = calcularIndiceCPOD({ 34: { general: 'sano', caras: { oclusal: 'sellante' } } })
    expect(r.obturados).toBe(1)
  })

  it('una pieza sin caries, sin obturación y no ausente se clasifica como sana', () => {
    const r = calcularIndiceCPOD({ 41: { general: 'sano' } })
    expect(r.sanos).toBe(1)
    expect(r.cpodTotal).toBe(0)
  })

  it('ignora entradas nulas dentro del objeto odontograma sin lanzar error', () => {
    expect(() => calcularIndiceCPOD({ 11: null, 12: undefined })).not.toThrow()
    expect(calcularIndiceCPOD({ 11: null }).cpodTotal).toBe(0)
  })

  // Umbrales OMS: los límites exactos (2, 5, 9, 14) son datos clínicos de referencia,
  // se testean en los bordes para evitar off-by-one en el futuro.
  it.each([
    [0, 'Muy Bajo'],
    [1, 'Muy Bajo'],
    [2, 'Bajo'],
    [4, 'Bajo'],
    [5, 'Moderado'],
    [8, 'Moderado'],
    [9, 'Alto'],
    [13, 'Alto'],
    [14, 'Muy Alto'],
    [20, 'Muy Alto'],
  ])('con cpodTotal=%i clasifica nivelRiesgoOMS como "%s"', (cariados, esperado) => {
    const odontograma = {}
    for (let i = 0; i < cariados; i++) {
      odontograma[`pieza_${i}`] = { general: 'caries' }
    }
    expect(calcularIndiceCPOD(odontograma).nivelRiesgoOMS).toBe(esperado)
  })
})