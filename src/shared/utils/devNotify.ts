/**
 * Herramienta DEV para testing de severidades de notificaciones (WS5 / BP03 §05)
 */
import { notificationService } from '../../infrastructure/notification/notificationService'
import { playSound } from './soundEffects'

export type DevNotifyTipo = 'critica' | 'operativa' | 'informativa'

declare global {
  interface Window {
    __dentikosNotify?: (tipo: DevNotifyTipo, mensaje: string) => void
  }
}

export const dentikosNotify = (tipo: DevNotifyTipo, mensaje: string): void => {
  if (tipo === 'critica') {
    notificationService.mostrar(mensaje, {
      tipo: 'error',
      titulo: 'Crítica',
      duracion: 0,
    })
    try { playSound('criticalNotif') } catch {}
  } else if (tipo === 'operativa') {
    notificationService.mostrar(mensaje, {
      tipo: 'info',
      titulo: 'Operativa',
      duracion: 8000,
    })
    try { playSound('infoNotif') } catch {}
  } else {
    notificationService.mostrar(mensaje, {
      tipo: 'success',
      titulo: 'Informativa',
      duracion: 5000,
    })
  }
}

export const initDevNotify = (isDev = Boolean(import.meta.env?.DEV)): void => {
  if (typeof window !== 'undefined') {
    if (isDev) {
      window.__dentikosNotify = dentikosNotify
    } else {
      delete window.__dentikosNotify
    }
  }
}

initDevNotify()
