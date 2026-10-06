/**
 * AtajosTecladoModal — Panel elegante de atajos de teclado de DentikOS
 * Blueprint 02: Se activa con '?' y documenta navegación, creación, vista y sesión.
 */
import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard, Compass, PlusCircle, Eye, LogOut } from 'lucide-react'

export interface AtajosTecladoModalProps {
  isOpen: boolean
  onClose: () => void
}

interface AtajoGrupo {
  titulo: string
  icono: React.ComponentType<{ size?: number; className?: string }>
  items: { teclas: string[]; descripcion: string }[]
}

const GRUPOS_ATAJOS: AtajoGrupo[] = [
  {
    titulo: 'NAVEGACIÓN',
    icono: Compass,
    items: [
      { teclas: ['⌘', 'K'], descripcion: 'Buscar pacientes, citas y módulos' },
      { teclas: ['?'], descripcion: 'Mostrar este panel de atajos' },
    ],
  },
  {
    titulo: 'CREACIÓN',
    icono: PlusCircle,
    items: [
      { teclas: ['⌘', 'N'], descripcion: 'Crear nueva cita en agenda' },
      { teclas: ['⌘', 'P'], descripcion: 'Registrar nuevo paciente' },
    ],
  },
  {
    titulo: 'VISTA',
    icono: Eye,
    items: [
      { teclas: ['⌘', '⇧', 'F'], descripcion: 'Alternar Modo Foco quirúrgico' },
      { teclas: ['⌘', '⇧', 'M'], descripcion: 'Alternar Modo Presentación (pacientes)' },
      { teclas: ['⌘', '⇧', 'D'], descripcion: 'Alternar tema (Claro / Quirúrgico / Oscuro)' },
    ],
  },
  {
    titulo: 'SESIÓN & VENTANAS',
    icono: LogOut,
    items: [
      { teclas: ['Esc'], descripcion: 'Cerrar modal / Salir de Modo Foco' },
    ],
  },
]

export const AtajosTecladoModal: React.FC<AtajosTecladoModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg bg-white dark:bg-graphite-950 surgical:bg-graphite-200 border border-surface rounded-2xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-label="Atajos de teclado"
            data-testid="modal-atajos-teclado"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-surface flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-gold-light/60 dark:bg-graphite-800 text-primary">
                  <Keyboard size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-graphite-900 dark:text-graphite-100 surgical:text-black">
                    Atajos de Teclado
                  </h3>
                  <p className="text-[11px] text-graphite-500">
                    Navega y opera DentikOS a máxima velocidad
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-graphite-400 hover:text-graphite-700 dark:hover:text-graphite-200 rounded-lg transition-colors"
                aria-label="Cerrar panel de atajos"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido agrupado */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {GRUPOS_ATAJOS.map((grupo) => {
                const IconComponent = grupo.icono
                return (
                  <div key={grupo.titulo} className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-graphite-400 dark:text-graphite-500 uppercase tracking-wider">
                      <IconComponent size={12} className="text-primary" />
                      <span>{grupo.titulo}</span>
                    </div>

                    <div className="space-y-1.5">
                      {grupo.items.map((item) => (
                        <div
                          key={item.descripcion}
                          className="flex items-center justify-between p-2 rounded-xl bg-graphite-50 dark:bg-graphite-900/60 surgical:bg-white/60 border border-surface text-xs"
                        >
                          <span className="text-graphite-700 dark:text-graphite-300 surgical:text-black">
                            {item.descripcion}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {item.teclas.map((tecla) => (
                              <kbd
                                key={tecla}
                                className="min-w-[20px] px-1.5 py-0.5 text-[10px] font-mono font-bold text-center rounded bg-white dark:bg-graphite-800 surgical:bg-graphite-100 border border-surface shadow-2xs text-graphite-900 dark:text-gold-satin"
                              >
                                {tecla}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-surface bg-graphite-50/50 dark:bg-graphite-900/30 flex items-center justify-between text-[11px] text-graphite-500">
              <span>Presiona <kbd className="px-1 py-0.5 rounded bg-surface font-mono">?</kbd> en cualquier pantalla</span>
              <button
                type="button"
                onClick={onClose}
                className="font-semibold text-primary hover:underline"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
