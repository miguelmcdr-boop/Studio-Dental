import { describe, it, expect } from 'vitest'
import {
  CANALES_COMUNICACION,
  ESTADOS_CONFIRMACION_CITA,
  PLANTILLAS_DEFAULT,
  MENSAJES_HISTORIAL_DEFAULT
} from './comunicacionesConstants'

describe('comunicacionesConstants', () => {
  it('define los canales de comunicación soportados', () => {
    expect(CANALES_COMUNICACION.length).toBe(3)
    expect(CANALES_COMUNICACION.map(c => c.id)).toEqual(['whatsapp', 'email', 'sms'])
  })

  it('define estados de confirmación de cita con sus estilos', () => {
    expect(ESTADOS_CONFIRMACION_CITA.length).toBe(4)
    ESTADOS_CONFIRMACION_CITA.forEach(e => {
      expect(e.id).toBeDefined()
      expect(e.nombre).toBeDefined()
      expect(e.colorBg).toBeDefined()
      expect(e.colorText).toBeDefined()
      expect(e.colorBorder).toBeDefined()
    })
  })

  it('contiene plantillas por defecto válidas', () => {
    expect(PLANTILLAS_DEFAULT.length).toBeGreaterThan(0)
    PLANTILLAS_DEFAULT.forEach(p => {
      expect(p.id).toBeDefined()
      expect(p.nombre).toBeDefined()
      expect(p.canal).toBeDefined()
      expect(p.cuerpo).toContain('{paciente}')
    })
  })

  it('contiene historial de mensajes por defecto', () => {
    expect(MENSAJES_HISTORIAL_DEFAULT.length).toBeGreaterThan(0)
    expect(MENSAJES_HISTORIAL_DEFAULT[0].estado).toBe('Confirmado')
  })
})
