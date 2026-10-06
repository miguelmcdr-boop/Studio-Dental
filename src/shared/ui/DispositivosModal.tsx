/**
 * DispositivosModal — Gestión de sesiones activas (Blueprint 03)
 *
 * Lista dispositivos con sesión activa del usuario.
 * Permite cerrar sesiones remotas.
 * Coherente con "soberanía digital" del Brand Strategy.
 */
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Monitor, Tablet, Smartphone, LogOut } from 'lucide-react'
import { Icon } from './Icon'
import { Button } from './ui/Button'

export interface DispositivosModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Dispositivo {
  id: string
  tipo: 'desktop' | 'tablet' | 'mobile'
  nombre: string
  navegador: string
  ubicacion: string
  ultimaActividad: string
  esActual: boolean
}

const MOCK_DISPOSITIVOS: Dispositivo[] = [
  {
    id: '1',
    tipo: 'desktop',
    nombre: 'MacBook Pro — Recepción',
    navegador: 'Chrome 128',
    ubicacion: 'Santiago, Chile',
    ultimaActividad: 'Ahora mismo',
    esActual: true,
  },
  {
    id: '2',
    tipo: 'tablet',
    nombre: 'iPad Pro — Box 3',
    navegador: 'Safari 17',
    ubicacion: 'Santiago, Chile',
    ultimaActividad: 'Hace 2 horas',
    esActual: false,
  },
]

const iconoPorTipo = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
}

export const DispositivosModal: React.FC<DispositivosModalProps> = ({ isOpen, onClose }) => {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>(MOCK_DISPOSITIVOS)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  const cerrarSesionRemota = (id: string) => {
    setDispositivos((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(7,11,20,0.5)' }}
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-[520px] max-w-full max-h-[90vh] bg-white dark:bg-graphite-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Dispositivos activos"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface">
              <div>
                <h2 className="text-lg font-semibold text-graphite-900 dark:text-graphite-50">
                  Dispositivos activos
                </h2>
                <p className="text-xs text-graphite-500 mt-1">
                  {dispositivos.length === 1 ? '1 sesión activa' : `${dispositivos.length} sesiones activas`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-graphite-100 dark:hover:bg-graphite-800 cursor-pointer"
                aria-label="Cerrar"
              >
                <Icon icon={X} size="sm" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {dispositivos.map((d) => {
                const Icono = iconoPorTipo[d.tipo]
                return (
                  <div
                    key={d.id}
                    className="flex items-start gap-3 p-4 rounded-xl border border-surface hover:border-graphite-300 dark:hover:border-graphite-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-graphite-100 dark:bg-graphite-800 flex items-center justify-center flex-shrink-0">
                      <Icon icon={Icono} size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-graphite-900 dark:text-graphite-100 truncate">{d.nombre}</p>
                        {d.esActual && (
                          <span className="text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-semibold">
                            ESTA SESIÓN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-graphite-500 mt-0.5">
                        {d.navegador} · {d.ubicacion}
                      </p>
                      <p className="text-xs text-graphite-400 mt-1">
                        {d.ultimaActividad}
                      </p>
                    </div>
                    {!d.esActual && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cerrarSesionRemota(d.id)}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                        aria-label={`Cerrar sesión en ${d.nombre}`}
                      >
                        <Icon icon={LogOut} size="xs" />
                        <span className="ml-1">Cerrar</span>
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

DispositivosModal.displayName = 'DispositivosModal'
