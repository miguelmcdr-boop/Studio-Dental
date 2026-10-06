/**
 * Hook para consumir notificaciones del sistema (F5-05).
 *
 * Se suscribe al notificationService y retorna la lista actual de toasts.
 * Re-renderiza automáticamente cuando hay cambios.
 *
 * Uso:
 *   const notificaciones = useNotifications()
 *   return <ToastContainer notificaciones={notificaciones} />
 */
import { useState, useEffect } from 'react'
import { notificationService, type NotificationItem } from '../../infrastructure/notification/notificationService'

export const useNotifications = (): NotificationItem[] => {
  const [notificaciones, setNotificaciones] = useState<NotificationItem[]>(() =>
    notificationService.listar()
  )

  useEffect(() => {
    const unsubscribe = notificationService.suscribir((lista: NotificationItem[]) => {
      setNotificaciones(lista)
    })
    return unsubscribe
  }, [])

  return notificaciones
}
