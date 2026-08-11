import { describe, it, expect } from 'vitest'

describe('Prueba intencionalmente fallida (F3-01)', () => {
  it('este test debe fallar para probar el pipeline', () => {
    expect(1 + 1).toBe(3) // Falla a propósito
  })
})
