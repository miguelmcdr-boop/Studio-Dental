/**
 * Input — Componente base del Design System (F7-25 Fase 3, Iteración 2)
 *
 * Input reutilizable con label, error states, helper text, tamaños e iconos.
 * Usa Graphite & Champagne tokens y soporta dark mode automático.
 *
 * Uso:
 *   import { Input } from '../components/ui/Input'
 *   import { User, Mail } from 'lucide-react'
 *
 *   <Input
 *     label="Nombre del paciente"
 *     value={nombre}
 *     onChange={(e) => setNombre(e.target.value)}
 *     error="Nombre es requerido"
 *     helperText="Mínimo 3 caracteres"
 *     required
 *   />
 *
 *   <Input
 *     label="Email"
 *     type="email"
 *     icon={Mail}
 *     iconPosition="left"
 *     size="md"
 *   />
 *
 * Tamaños: sm, md (default), lg
 * Estados: default, focus, error, disabled
 */
import React, { forwardRef, useId } from 'react'
import { Icon } from '../Icon'

const SIZE_STYLES = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
}

const ICON_SIZES = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
}

export const Input = forwardRef(({
  label,
  error,
  helperText,
  size = 'md',
  icon: IconComponent,
  iconPosition = 'left',
  required = false,
  disabled = false,
  className = '',
  id: idProp,
  'aria-describedby': ariaDescribedBy,
  ...rest
}, ref) => {
  const autoId = useId()
  const id = idProp || autoId
  const errorId = `${id}-error`
  const helperId = `${id}-helper`

  const hasError = Boolean(error)
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md
  const iconSize = ICON_SIZES[size] || ICON_SIZES.md

  // Construir aria-describedby
  const describedBy = [
    hasError ? errorId : null,
    helperText && !hasError ? helperId : null,
    ariaDescribedBy,
  ].filter(Boolean).join(' ') || undefined

  // Estilos del input
  const inputClasses = `
    w-full
    ${sizeStyle}
    bg-white dark:bg-graphite-900
    border
    ${hasError
      ? 'border-clinical-error focus:border-clinical-error focus:ring-clinical-error/20'
      : 'border-graphite-300 dark:border-graphite-600 focus:border-primary focus:ring-primary/20'
    }
    rounded-lg
    text-graphite-900 dark:text-graphite-50
    placeholder:text-graphite-400 dark:placeholder:text-graphite-500
    focus:outline-none focus:ring-2
    transition-all duration-200 shadow-sm focus:shadow-md
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-graphite-100 dark:disabled:bg-graphite-800
    ${IconComponent && iconPosition === 'left' ? 'pl-10' : ''}
    ${IconComponent && iconPosition === 'right' ? 'pr-10' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ')

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-graphite-700 dark:text-graphite-300 uppercase mb-1.5"
        >
          {label}
          {required && <span className="text-clinical-error ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      {/* Input wrapper (para posicionar icono) */}
      <div className="relative">
        {/* Icono izquierdo */}
        {IconComponent && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon
              icon={IconComponent}
              size={iconSize}
              color={hasError ? 'error' : 'muted'}
            />
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          aria-required={required}
          className={inputClasses}
          {...rest}
        />

        {/* Icono derecho */}
        {IconComponent && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Icon
              icon={IconComponent}
              size={iconSize}
              color={hasError ? 'error' : 'muted'}
            />
          </div>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p id={errorId} className="text-xs text-clinical-error mt-1.5 flex items-center gap-1" role="alert">
          {error}
        </p>
      )}

      {/* Helper text (solo si no hay error) */}
      {helperText && !hasError && (
        <p id={helperId} className="text-xs text-graphite-500 dark:text-graphite-400 mt-1.5">
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
