import { describe, it, expect, vi } from 'vitest'
import {
  normalizarEstadoParaSupabase,
  desnormalizarEstadoParaCodigo,
  transformarDesdeSupabase,
  transformarParaSupabase
} from './agendaTransformations'

describe('agendaTransformations', () => {
  it('normaliza y desnormaliza estados de cita correctamente', () => {
    expect(normalizarEstadoParaSupabase('Agendado')).toBe('Agendada')
    expect(normalizarEstadoParaSupabase('En Sillón')).toBe('En Curso')
    expect(desnormalizarEstadoParaCodigo('En Curso')).toBe('En Sillón')
    expect(desnormalizarEstadoParaCodigo('Agendada')).toBe('Agendado')
  })

  it('transforma desde Supabase mapeando snake_case a camelCase y desnormalizando estado', () => {
    const citaDb = {
      id: 'uuid-1',
      paciente_id: 'pac-1',
      paciente_nombre: 'Juan',
      hora_inicio: '10:00',
      estado: 'En Curso'
    }
    const js = transformarDesdeSupabase(citaDb)
    expect(js.pacienteId).toBe('pac-1')
    expect(js.pacienteNombre).toBe('Juan')
    expect(js.horaInicio).toBe('10:00')
    expect(js.estado).toBe('En Sillón')
  })

  it('retorna null si el input es null o undefined', () => {
    expect(transformarDesdeSupabase(null)).toBeNull()
    expect(transformarParaSupabase(null)).toBeNull()
  })

  it('transforma para Supabase excluyendo createdAt, updatedAt y userId', () => {
    const citaJs = {
      id: 'uuid-1',
      pacienteNombre: 'Juan',
      boxAsignado: 'Box 1',
      estado: 'Completado',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
      userId: 'user-1'
    }
    const db = transformarParaSupabase(citaJs)
    expect(db.paciente_nombre).toBe('Juan')
    expect(db.box_asignado).toBe('Box 1')
    expect(db.estado).toBe('Completada')
    expect(db.createdAt).toBeUndefined()
    expect(db.updatedAt).toBeUndefined()
    expect(db.userId).toBeUndefined()
  })
})
