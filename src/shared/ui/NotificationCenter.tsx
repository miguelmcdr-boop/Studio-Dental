/**
 * NotificationCenter — Centro de Notificaciones lateral de 320px (Blueprint 02)
 * Slide-in con Framer Motion (250ms), agrupación: Críticas / Operativas / Informativas
 */
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, AlertTriangle, Info, CheckCircle2, Trash2 } from 'lucide-react'
import { notificationService, type NotificationItem } from '../../infrastructure/notification/notificationService'
import { useNotifications } from '../hooks/useNotifications'

export interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const notificaciones = useNotifications()

  const criticas = notificaciones.filter((n) => n.tipo === 'error')
  const operativas = notificaciones.filter((n) => n.tipo === 'warning' || n.tipo === 'info')
  const informativas = notificaciones.filter((n) => n.tipo === 'success')

  const handleDismiss = (id: string) => {
    notificationService.ocultar(id)
  }

  const handleClearAll = () => {
    notificationService.limpiar()
  }

  const renderItem = (item: NotificationItem) => {
    const isCritical = item.tipo === 'error'
    const isWarning = item.tipo === 'warning'
    const isSuccess = item.tipo === 'success'

    return (
      <div
        key={item.id}
        className={`p-3 rounded-xl border transition-all relative flex items-start gap-2.5 ${
          isCritical
            ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50'
            : isWarning
            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
            : isSuccess
            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
            : 'bg-graphite-50 dark:bg-graphite-900 border-surface'
        }`}
      >
        <div className="mt-0.5 flex-shrink-0">
          {isCritical && <AlertTriangle size={15} className="text-rose-600 dark:text-rose-400" />}
          {isWarning && <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400" />}
          {isSuccess && <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />}
          {!isCritical && !isWarning && !isSuccess && <Info size={15} className="text-primary" />}
        </div>

        <div className="flex-1 min-w-0 pr-4">
          {item.titulo && (
            <p className="text-xs font-bold text-graphite-900 dark:text-graphite-100 truncate">
              {item.titulo}
            </p>
          )}
          <p className="text-xs text-graphite-700 dark:text-graphite-300 leading-relaxed break-words">
            {item.mensaje}
          </p>
          <span className="text-[10px] text-graphite-400 mt-1 block">
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <button
          onClick={() => handleDismiss(item.id)}
          className="absolute top-2.5 right-2.5 text-graphite-400 hover:text-graphite-700 dark:hover:text-graphite-200 p-1"
          aria-label="Descartar notificación"
        >
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Panel lateral 320px */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 h-full w-[320px] bg-white dark:bg-graphite-950 border-l border-surface shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-label="Centro de notificaciones"
            data-testid="notification-center-drawer"
          >
            {/* Header */}
            <div className="p-4 border-b border-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-primary" />
                <h3 className="font-bold text-sm text-graphite-900 dark:text-graphite-100">
                  Notificaciones
                </h3>
                {notificaciones.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/20 text-champagne-700 dark:text-gold-satin">
                    {notificaciones.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {notificaciones.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    title="Limpiar todas"
                    aria-label="Limpiar todas las notificaciones"
                    className="p-1.5 text-graphite-400 hover:text-rose-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  aria-label="Cerrar notificaciones"
                  className="p-1.5 text-graphite-400 hover:text-graphite-800 dark:hover:text-graphite-200 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Lista agrupada */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {notificaciones.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-4 text-graphite-400 dark:text-graphite-500">
                  <Bell size={32} className="mb-2 opacity-30 stroke-1" />
                  <p className="text-xs font-semibold">Sin notificaciones pendientes</p>
                  <p className="text-[11px] mt-1">Tu clínica y agenda están al día.</p>
                </div>
              ) : (
                <>
                  {criticas.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                        Críticas ({criticas.length})
                      </p>
                      {criticas.map(renderItem)}
                    </div>
                  )}

                  {operativas.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        Operativas ({operativas.length})
                      </p>
                      {operativas.map(renderItem)}
                    </div>
                  )}

                  {informativas.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Informativas ({informativas.length})
                      </p>
                      {informativas.map(renderItem)}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
