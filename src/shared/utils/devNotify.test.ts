import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dentikosNotify, initDevNotify } from './devNotify'
import { notificationService } from '../../infrastructure/notification/notificationService'
import * as soundEffects from './soundEffects'

describe('devNotify (WS5 / BP03 §05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete window.__dentikosNotify
  })

  it('en ambiente DEV expone window.__dentikosNotify', () => {
    initDevNotify(true)
    expect(window.__dentikosNotify).toBeDefined()
    expect(typeof window.__dentikosNotify).toBe('function')
  })

  it('en ambiente PROD window.__dentikosNotify queda undefined', () => {
    initDevNotify(false)
    expect(window.__dentikosNotify).toBeUndefined()
  })

  it('__dentikosNotify("critica", ...) crea notificación de error con duración 0 (sin auto-descarte) y sonido', () => {
    const mostrarSpy = vi.spyOn(notificationService, 'mostrar')
    const playSoundSpy = vi.spyOn(soundEffects, 'playSound').mockImplementation(() => {})

    dentikosNotify('critica', 'Alergia: penicilina')

    expect(mostrarSpy).toHaveBeenCalledWith('Alergia: penicilina', {
      tipo: 'error',
      titulo: 'Crítica',
      duracion: 0,
    })
    expect(playSoundSpy).toHaveBeenCalledWith('criticalNotif')
  })

  it('__dentikosNotify("operativa", ...) crea notificación info con duración 8000ms y sonido', () => {
    const mostrarSpy = vi.spyOn(notificationService, 'mostrar')
    const playSoundSpy = vi.spyOn(soundEffects, 'playSound').mockImplementation(() => {})

    dentikosNotify('operativa', 'Cita próxima en Box 2')

    expect(mostrarSpy).toHaveBeenCalledWith('Cita próxima en Box 2', {
      tipo: 'info',
      titulo: 'Operativa',
      duracion: 8000,
    })
    expect(playSoundSpy).toHaveBeenCalledWith('infoNotif')
  })

  it('__dentikosNotify("informativa", ...) crea notificación success con duración 5000ms', () => {
    const mostrarSpy = vi.spyOn(notificationService, 'mostrar')

    dentikosNotify('informativa', 'Backup local completado')

    expect(mostrarSpy).toHaveBeenCalledWith('Backup local completado', {
      tipo: 'success',
      titulo: 'Informativa',
      duracion: 5000,
    })
  })
})
