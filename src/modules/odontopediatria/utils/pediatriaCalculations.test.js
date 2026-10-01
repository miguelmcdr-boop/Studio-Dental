/**
 * Tests — calcularPorcentajeOLeary
 * Archivo: src/modules/odontopediatria/utils/pediatriaCalculations.js
 * Tarea MASTER_ROADMAP: F1-06
 */

import { describe, it, expect } from 'vitest'
import { calcularPorcentajeOLeary } from './pediatriaCalculations'
import { CARAS_OLEARY } from '../constants/pediatriaConstants'

describe('calcularPorcentajeOLeary', () => {
  it('retorna 0 cuando el mapa de placa está vacío', () => {
    expect(calcularPorcentajeOLeary({}, 20)).toBe(0)
  })

  it('retorna 0 cuando totalPiezasPresentes es 0 (evita división por cero)', () => {
    expect(calcularPorcentajeOLeary({ 11: { vestibular: true } }, 0)).toBe(0)
  })

  it('calcula 100% cuando todas las caras evaluadas de todas las piezas tienen placa', () => {
    const piezaConTodasLasCaras = {}
    CARAS_OLEARY.forEach((cara) => { piezaConTodasLasCaras[cara] = true })
    const mapaPlaca = { 11: piezaConTodasLasCaras, 12: piezaConTodasLasCaras }
    // total de caras posibles = totalPiezasPresentes * 4, no depende de cuántas piezas
    // vengan en mapaPlaca — por eso pasamos totalPiezasPresentes = 2 para que cuadre 100%
    expect(calcularPorcentajeOLeary(mapaPlaca, 2)).toBe(100)
  })

  it('calcula el porcentaje proporcional cuando solo algunas caras tienen placa', () => {
    // 1 pieza con 1 sola cara marcada, sobre un total de 20 piezas => 1 / 80 caras = 1%
    const mapaPlaca = { 11: { [CARAS_OLEARY[0]]: true } }
    const resultado = calcularPorcentajeOLeary(mapaPlaca, 20)
    expect(resultado).toBe(Math.round((1 / 80) * 100))
  })

  it('ignora piezas nulas o ausentes en el mapa sin lanzar error', () => {
    const mapaPlaca = { 11: null, 12: undefined, 13: { [CARAS_OLEARY[0]]: true } }
    expect(() => calcularPorcentajeOLeary(mapaPlaca, 20)).not.toThrow()
  })

  it('ignora caras marcadas con valores distintos de true (ej. false o string)', () => {
    const mapaPlaca = { 11: { [CARAS_OLEARY[0]]: false, [CARAS_OLEARY[1]]: 'si' } }
    expect(calcularPorcentajeOLeary(mapaPlaca, 20)).toBe(0)
  })

  it('usa 20 piezas como valor por defecto cuando no se especifica totalPiezasPresentes', () => {
    const mapaPlaca = { 11: { [CARAS_OLEARY[0]]: true } }
    const resultado = calcularPorcentajeOLeary(mapaPlaca)
    expect(resultado).toBe(Math.round((1 / 80) * 100))
  })
})