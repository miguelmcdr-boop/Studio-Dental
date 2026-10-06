/**
 * PerfilModal — Modal wrapper para PerfilProfesionalForm (Blueprint 03)
 *
 * Envuelve el formulario existente de Perfil Profesional en un modal
 * accesible con backdrop blur. Conecta con el perfil actual del usuario.
 */
import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Icon } from './Icon'
import { PerfilProfesionalForm } from '../../domains/organization/team/components/PerfilProfesionalForm'
import type { PerfilProfesionalData } from '../../domains/organization/team/components/PerfilProfesionalForm'
import { useSesionStore } from '../../app/stores/sesionStore'

export interface PerfilModalProps {
  isOpen: boolean
  onClose: () => void
  userProfile?: PerfilProfesionalData | null
  onGuardar?: (perfil: PerfilProfesionalData) => void | Promise<void>
}

export const PerfilModal: React.FC<PerfilModalProps> = ({
  isOpen,
  onClose,
  userProfile: propUserProfile,
  onGuardar,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const storeUserProfile = useSesionStore((s) => s.userProfile)
  const userProfile = propUserProfile || (storeUserProfile as PerfilProfesionalData | null)

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

  const handleGuardar = async (perfil: PerfilProfesionalData) => {
    if (onGuardar) {
      await onGuardar(perfil)
    }
    onClose()
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
            className="w-[640px] max-w-full max-h-[90vh] bg-white dark:bg-graphite-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Perfil profesional"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface">
              <h2 className="text-lg font-semibold text-graphite-900 dark:text-graphite-50">
                Perfil profesional
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-graphite-100 dark:hover:bg-graphite-800 cursor-pointer"
                aria-label="Cerrar"
              >
                <Icon icon={X} size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <PerfilProfesionalForm
                userProfile={userProfile}
                alGuardar={handleGuardar}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

PerfilModal.displayName = 'PerfilModal'
