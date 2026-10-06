import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  enviarEmailInvitacion,
  enviarEmailVerificacion,
  generarHtmlEmailInvitacion,
  generarHtmlEmailVerificacion,
} from './emailService'

describe('emailService - Plantillas y Despacho DentikOS', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('genera correctamente el template HTML de invitación con todos los detalles', () => {
    const html = generarHtmlEmailInvitacion({
      emailDestinatario: 'colega@clinica.cl',
      nombreInvitado: 'Dra. Camila Soto',
      nombreInvitador: 'Dr. Miguel Díaz',
      rol: 'dentista',
      clinicaNombre: 'Studio Dental Providencia',
      sedesAsignadas: ['Sede Central', 'Sede Oriente'],
      permisos: ['Ficha Clínica Completa', 'Agenda Quirúrgica'],
      enlaceAceptar: 'https://dentikos.app/#invitacion?token=test-token-123',
    })

    expect(html).toContain('Dra. Camila Soto')
    expect(html).toContain('Dr. Miguel Díaz')
    expect(html).toContain('Studio Dental Providencia')
    expect(html).toContain('Sede Central, Sede Oriente')
    expect(html).toContain('test-token-123')
    expect(html).toContain('7 días')
    expect(html).toContain('Ley 19.628')
  })

  it('genera correctamente el template HTML de verificación', () => {
    const html = generarHtmlEmailVerificacion({
      emailDestinatario: 'dr.miguel@clinica.cl',
      nombreUsuario: 'Dr. Miguel Díaz',
      enlaceVerificacion: 'https://dentikos.app/#verificar?code=abc',
    })

    expect(html).toContain('Dr. Miguel Díaz')
    expect(html).toContain('Verificar mi Correo Electrónico')
    expect(html).toContain('24 horas')
  })

  it('enviarEmailInvitacion procesa exitosamente el despacho', async () => {
    const resultado = await enviarEmailInvitacion({
      emailDestinatario: 'colega@clinica.cl',
      nombreInvitado: 'Dra. Soto',
      nombreInvitador: 'Dr. Díaz',
      rol: 'dentista',
      clinicaNombre: 'Clínica Dental',
      sedesAsignadas: ['Sede Central'],
      permisos: ['Agenda'],
    })

    expect(resultado).toBe(true)
  })

  it('enviarEmailVerificacion procesa exitosamente el despacho', async () => {
    const resultado = await enviarEmailVerificacion({
      emailDestinatario: 'dr@clinica.cl',
      nombreUsuario: 'Dr. Díaz',
    })

    expect(resultado).toBe(true)
  })
})
