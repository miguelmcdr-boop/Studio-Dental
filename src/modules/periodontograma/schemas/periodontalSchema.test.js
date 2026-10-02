import { describe, it, expect } from 'vitest'
import {
  crearPiezaVaciaSchema,
  crearControlPeriodontalSchema,
} from './periodontalSchema'

describe('periodontalSchema', () => {
  it('crearPiezaVaciaSchema retorna estructura completa con valores por defecto', () => {
    const pieza = crearPiezaVaciaSchema()
    expect(pieza.sondaje).toEqual({ mv: '', v: '', dv: '', mp: '', p: '', dp: '' })
    expect(pieza.recesion).toEqual({ mv: '', v: '', dv: '', mp: '', p: '', dp: '' })
    expect(pieza.sangrado).toEqual({ mv: false, v: false, dv: false, mp: false, p: false, dp: false })
    expect(pieza.placa).toEqual({ mv: false, v: false, dv: false, mp: false, p: false, dp: false })
    expect(pieza.supuracion).toEqual({ mv: false, v: false, dv: false, mp: false, p: false, dp: false })
    expect(pieza.movilidad).toBe('0')
    expect(pieza.furca).toBe('0')
    expect(pieza.implante).toBe(false)
    expect(pieza.ausente).toBe(false)
    expect(pieza.keratinizedGingiva).toEqual({ v: '', p: '' })
  })

  it('crearControlPeriodontalSchema genera control con id y observacion personalizada', () => {
    const control = crearControlPeriodontalSchema('ctrl-123', 'Control Semestral')
    expect(control.id).toBe('ctrl-123')
    expect(control.observacion).toBe('Control Semestral')
    expect(control.piezas).toEqual({})
    expect(typeof control.fecha).toBe('string')
  })

  it('crearControlPeriodontalSchema usa valores por defecto cuando no se especifican', () => {
    const control = crearControlPeriodontalSchema()
    expect(control.id).toBeDefined()
    expect(control.observacion).toBe('Control Inicial')
    expect(control.piezas).toEqual({})
  })
})
