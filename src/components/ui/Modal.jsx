/**
 * Modal — Componente base del Design System (F7-25 Fase 3, Iteración 2)
 *
 * Modal reutilizable con accesibilidad F6-04 incorporada:
 * - Cierre con ESC
 * - Trampa de foco con Tab/Shift+Tab
 * - Click en overlay para cerrar (opcional)
 * - aria-modal, role="dialog", aria-labelledby
 *
 * Uso:
 *   <Modal isOpen={show} onClose={handleClose} title="Editar paciente" size="md">
 *     <p>Contenido del modal</p>
 *   </Modal>
 *
 * Tamaños:
 *   - sm: max-w-md (448px)
 *   - md: max-w-lg (512px) — default
 *   - lg: max-w-2xl (672px)
 *   - xl: max-w-4xl (896px)
 *   - full: max-w-full (pantalla completa)
 */
import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Icon } from '../Icon'

const SIZE_STYLES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  'aria-label': ariaLabel,
}) => {
  const modalRef = useRef(null)
  const previousActiveElement = useRef(null)

  // Trampa de foco + ESC (F6-04)
  useEffect(() => {
    if (!isOpen) return

    // Guardar elemento que tenía foco antes de abrir el modal
    previousActiveElement.current = document.activeElement

    const handleKeyDown = (e) => {
      // Cerrar con ESC
      if (closeOnEscape && e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      // Trampa de foco con Tab
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (!firstElement) return

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Enfocar primer elemento focusable al abrir
    requestAnimationFrame(() => {
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (firstFocusable) {
          firstFocusable.focus()
        } else {
          modalRef.current.focus()
        }
      }
    })

    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      // Restaurar foco al elemento previo
      if (previousActiveElement.current && previousActiveElement.current.focus) {
        previousActiveElement.current.focus()
      }
    }
  }, [isOpen, onClose, closeOnEscape])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md
  const titleId = title ? `modal-title-${title.toLowerCase().replace(/\s+/g, '-')}` : undefined

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={ariaLabel}
        tabIndex={-1}
        className={`bg-white dark:bg-graphite-800 rounded-xl shadow-2xl w-full ${sizeStyle} max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        {title && (
          <div className="sticky top-0 bg-graphite-50 dark:bg-graphite-900 border-b border-graphite-200 dark:border-graphite-700 px-6 py-4 flex items-center justify-between z-10">
            <h2 id={titleId} className="text-xl font-bold text-graphite-900 dark:text-graphite-50">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-graphite-400 hover:text-graphite-600 dark:text-graphite-400 dark:hover:text-graphite-200 transition-colors p-1 rounded-lg hover:bg-graphite-200 dark:hover:bg-graphite-700"
                aria-label="Cerrar modal"
                type="button"
              >
                <Icon icon={X} size="md" />
              </button>
            )}
          </div>
        )}

        {/* Contenido */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
