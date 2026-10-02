import { describe, it, expect } from 'vitest'
import {
  SNAKE_TO_CAMEL_MAP,
  CAMEL_TO_SNAKE_MAP,
  transformarDesdeSupabase,
  transformarParaSupabase
} from './pacientesTransformations'

describe('pacientesTransformations', () => {
  it('mapea correctamente campos snake_case a camelCase', () => {
    const pacienteDb = {
      id: 'uuid-1',
      contacto_emergencia: 'Mamá',
      examen_intraoral: 'Sin hallazgos',
      otra_columna: 'valor'
    }
    const js = transformarDesdeSupabase(pacienteDb)
    expect(js.contactoEmergencia).toBe('Mamá')
    expect(js.examenIntraoral).toBe('Sin hallazgos')
    expect(js.otra_columna).toBe('valor')
  })

  it('retorna null si pacienteDb es null o undefined', () => {
    expect(transformarDesdeSupabase(null)).toBeNull()
    expect(transformarDesdeSupabase(undefined)).toBeNull()
  })

  it('transforma objeto JS a formato Supabase excluyendo createdAt, updatedAt y userId', () => {
    const pacienteJs = {
      id: 'uuid-1',
      contactoEmergencia: 'Mamá',
      notas: '',
      telefono: '',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
      userId: 'user-1'
    }
    const db = transformarParaSupabase(pacienteJs)
    expect(db.contacto_emergencia).toBe('Mamá')
    expect(db.notas).toBe('') // notas preserva string vacio
    expect(db.telefono).toBeNull() // otros campos vacios van como null
    expect(db.createdAt).toBeUndefined()
    expect(db.updatedAt).toBeUndefined()
    expect(db.userId).toBeUndefined()
  })

  it('retorna null si pacienteJs es null o undefined', () => {
    expect(transformarParaSupabase(null)).toBeNull()
    expect(transformarParaSupabase(undefined)).toBeNull()
  })
})
