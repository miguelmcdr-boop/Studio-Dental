import { describe, it, expect, vi } from 'vitest'
import { formatearCitaParaCSV, exportarCitasCSV } from './csvExport'

describe('csvExport', () => {
  describe('formatearCitaParaCSV', () => {
    it('formatea cita con todos los campos', () => {
      const cita = {
        fecha: '2026-09-24',
        horaInicio: '10:00',
        pacienteNombre: 'Juan Pérez',
        pacienteRut: '12.345.678-9',
        pacienteTelefono: '+56912345678',
        trataMiento: 'Limpieza dental',
        boxAsignado: 'Box 1',
        estado: 'Agendada',
        id: 'cita_123',
      }
      const formateada = formatearCitaParaCSV(cita)
      expect(formateada.Fecha).toBe('2026-09-24')
      expect(formateada.Hora).toBe('10:00')
      expect(formateada.Paciente).toBe('Juan Pérez')
      expect(formateada.RUT).toBe('12.345.678-9')
      expect(formateada.Teléfono).toBe('+56912345678')
      expect(formateada.Tratamiento).toBe('Limpieza dental')
      expect(formateada.Box).toBe('Box 1')
      expect(formateada.Estado).toBe('Agendada')
      expect(formateada.ID).toBe('cita_123')
    })

    it('maneja campos faltantes con valores por defecto', () => {
      const cita = { fecha: '2026-09-24', horaInicio: '10:00' }
      const formateada = formatearCitaParaCSV(cita)
      expect(formateada.Paciente).toBe('Sin nombre')
      expect(formateada.RUT).toBe('')
      expect(formateada.Box).toBe('')
      expect(formateada.Teléfono).toBe('')
      expect(formateada.Tratamiento).toBe('')
      expect(formateada.Estado).toBe('')
      expect(formateada.ID).toBe('')
    })
  })

  describe('exportarCitasCSV', () => {
    it('no lanza error con array vacío', () => {
      expect(() => exportarCitasCSV([], 'test')).not.toThrow()
    })

    it('exporta citas sin error', () => {
      const citas = [
        { fecha: '2026-09-24', horaInicio: '10:00', pacienteNombre: 'Juan Pérez' },
        { fecha: '2026-09-24', horaInicio: '11:00', pacienteNombre: 'María López' },
      ]
      // Mock de document.createElement y URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:test')
      global.URL.revokeObjectURL = vi.fn()
      expect(() => exportarCitasCSV(citas, 'test')).not.toThrow()
    })
  })
})
