/**
 * ConfirmDialog — Componente base del Design System (F10-A5)
 *
 * Diálogo de confirmación accesible que reemplaza window.alert() y
 * window.confirm() en todos los flujos del sistema.
 * Construido sobre <Modal> base: hereda ESC, trampa de foco y dark mode.
 *
 * Uso:
 *   <ConfirmDialog
 *     isOpen={mostrar}
 *     variant="danger"
 *     title="Eliminar paciente"
 *     description="El paciente pasará a la papelera."
 *     confirmText="Eliminar"
 *     loading={eliminando}
 *     onConfirm={handleEliminar}
 *     onCancel={() => setMostrar(false)}
 *   />
 *
 * Variantes:
 *   - info: azul clínico (confirmaciones informativas)
 *   - warning: ámbar clínico (acciones reversibles con cuidado)
 *   - danger: rojo clínico (acciones destructivas)
 *
 * Props extra:
 *   - children: slot bajo la descripción (ej: input de confirmación)
 *   - loading: bloquea ESC/overlay y muestra spinner en confirmar
 */
import React from 'react'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Icon } from '../Icon'

const VARIANT_CONFIG = {
  info: {
    icon: Info,
    iconClasses: 'bg-clinical-info/10 text-clinical-info dark:bg-clinical-info/20 dark:text-sky-300',
    confirmVariant: 'primary',
  },
  warning: {
    icon: AlertTriangle,
    iconClasses: 'bg-clinical-warning/10 text-amber-700 dark:bg-clinical-warning/20 dark:text-amber-300',
    confirmVariant: 'primary',
  },
  danger: {
    icon: AlertCircle,
    iconClasses: 'bg-clinical-error/10 text-clinical-error dark:bg-clinical-error/20 dark:text-red-300',
    confirmVariant: 'danger',
  },
}

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText,
  onConfirm,
  onCancel,
  variant = 'warning',
  loading = false,
  children,
  ...rest
}) => {
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.warning
  const IconComponent = config.icon

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      zIndex="z-[60]"
    >
      <div className="flex items-start gap-4">
        {/* Icono de variante */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.iconClasses}`}
          aria-hidden="true"
        >
          <Icon icon={IconComponent} size="md" />
        </div>

        {/* Cuerpo */}
        <div className="flex-1 min-w-0">
          {description && (
            <div
              className="text-graphite-600 dark:text-graphite-300"
              style={{ fontSize: 'var(--ds-text-base)' }}
            >
              {description}
            </div>
          )}
          {children}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 mt-6">
        {cancelText != null && cancelText !== '' && (
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
        )}
        <Button variant={config.confirmVariant} onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}

ConfirmDialog.displayName = 'ConfirmDialog'
