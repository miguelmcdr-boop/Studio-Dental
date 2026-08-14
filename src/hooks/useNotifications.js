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
import { notificationService } from '../services/notificationService'

export const useNotifications = () => {
  const [notificaciones, setNotificaciones] = useState(() =>
    notificationService.listar()
  )

  useEffect(() => {
    const unsubscribe = notificationService.suscribir((lista) => {
      setNotificaciones(lista)
    })
    return unsubscribe
  }, [])

  return notificaciones
}
