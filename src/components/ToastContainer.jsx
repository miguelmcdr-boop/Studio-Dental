import React from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { notificationService } from '../services/notificationService'

/**
 * Contenedor de toasts (F5-05).
 *
 * Se monta UNA VEZ en App.jsx. Renderiza todos los toasts activos
 * en la esquina superior derecha.
 *
 * Tipos soportados:
 * - info (azul)
 * - success (verde)
 * - warning (amarillo)
 * - error (rojo)
 */

const CONFIG_POR_TIPO = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-900',
    icon: 'ℹ️',
    iconBg: 'bg-blue-500'
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    text: 'text-green-900',
    icon: '✅',
    iconBg: 'bg-green-500'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    text: 'text-yellow-900',
    icon: '⚠️',
    iconBg: 'bg-yellow-500'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    text: 'text-red-900',
    icon: '❌',
    iconBg: 'bg-red-500'
  }
}

const ToastItem = ({ notificacion }) => {
  const config = CONFIG_POR_TIPO[notificacion.tipo] || CONFIG_POR_TIPO.info

  return (
    <div
      className={`${config.bg} ${config.border} border-l-4 rounded-lg shadow-lg p-4 mb-3 min-w-[300px] max-w-md animate-slide-in flex items-start gap-3`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0 text-xl">{config.icon}</div>
      <div className="flex-1 min-w-0">
        {notificacion.titulo && (
          <div className={`font-semibold ${config.text} text-sm mb-1`}>
            {notificacion.titulo}
          </div>
        )}
        <div className={`${config.text} text-sm break-words`}>
          {notificacion.mensaje}
        </div>
      </div>
      {notificacion.dismissable && (
        <button
          onClick={() => notificationService.ocultar(notificacion.id)}
          className={`flex-shrink-0 ${config.text} hover:opacity-70 text-lg leading-none p-1`}
          aria-label="Cerrar notificación"
          title="Cerrar"
        >
          ×
        </button>
      )}
    </div>
  )
}

export const ToastContainer = () => {
  const notificaciones = useNotifications()

  if (notificaciones.length === 0) return null

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col items-end"
      aria-label="Notificaciones del sistema"
    >
      {notificaciones.map((notif) => (
        <ToastItem key={notif.id} notificacion={notif} />
      ))}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
