import { describe, it, expect } from 'vitest'
import {
  interpolarVariablesMensaje,
  generarLinkWhatsAppWeb,
  generarLinkWhatsAppApp,
  calcularResumenComunicaciones
} from './comunicacionesCalculations'

describe('comunicacionesCalculations', () => {
  it('interpola variables en la plantilla de mensaje', () => {
    const plantilla = 'Hola {paciente}, tu cita es el {fecha} a las {hora} con el {doctor} en {clinica}.'
    const res = interpolarVariablesMensaje(plantilla, {
      pacienteNombre: 'María',
      fechaCita: '2026-10-05',
      horaCita: '11:00',
      doctorNombre: 'Dr. Pérez',
      clinicaNombre: 'Studio Dental'
    })
    expect(res).toBe('Hola María, tu cita es el 2026-10-05 a las 11:00 con el Dr. Pérez en Studio Dental.')
  })

  it('genera enlaces de whatsapp web y app correctamente', () => {
    const web = generarLinkWhatsAppWeb('+56 9 1234 5678', 'Hola')
    const app = generarLinkWhatsAppApp('+56 9 1234 5678', 'Hola')
    expect(web).toContain('56912345678')
    expect(app).toContain('56912345678')
    expect(generarLinkWhatsAppWeb('', 'Hola')).toBe('#')
  })

  it('calcula resumen de metricas de comunicacion', () => {
    const historial = [
      { canal: 'whatsapp', estado: 'Confirmado' },
      { canal: 'email', estado: 'Enviado' }
    ]
    const res = calcularResumenComunicaciones(historial)
    expect(res.totalEnviados).toBe(2)
    expect(res.totalWhatsApp).toBe(1)
    expect(res.totalEmail).toBe(1)
    expect(res.confirmadosCount).toBe(1)
    expect(res.tasaConfirmacion).toBe(50)
  })
})
