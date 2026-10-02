import { describe, it, expect } from 'vitest'
import { esUuidValido } from './uuidUtils'

describe('uuidUtils', () => {
  it('identifica UUIDs válidos en minúsculas y mayúsculas', () => {
    expect(esUuidValido('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true)
    expect(esUuidValido('A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11')).toBe(true)
  })

  it('rechaza IDs que no son UUIDs válidos', () => {
    expect(esUuidValido(123)).toBe(false)
    expect(esUuidValido(null)).toBe(false)
    expect(esUuidValido(undefined)).toBe(false)
    expect(esUuidValido('')).toBe(false)
    expect(esUuidValido('12345')).toBe(false)
    expect(esUuidValido('not-a-valid-uuid-format-at-all')).toBe(false)
    expect(esUuidValido('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1g')).toBe(false) // 'g' no es hex
  })
})
