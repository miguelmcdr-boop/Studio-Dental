/**
 * Badge — Componente base del Design System (F10-A2)
 *
 * Badge de estado semántico con variantes clínicas, sizes, dot y icono.
 * Usa tokens del DS v2 y dark mode automático.
 *
 * Uso:
 *   <Badge variant="success" size="md" dot icon={CheckCircle}>Confirmado</Badge>
 *   <Badge variant="error" size="sm">Stock bajo</Badge>
 *   <Badge variant="neutral">Particular</Badge>
 *
 * Variantes:
 *   - success: verde clínico (confirmaciones, realizado)
 *   - warning: ámbar clínico (advertencias, stock bajo)
 *   - error: rojo clínico (errores, urgente)
 *   - info: azul clínico (informativo, en proceso)
 *   - neutral: gris (estados por defecto, tags)
 *
 * Accesibilidad:
 *   - role="status" cuando hay dot (indica estado visual)
 *   - aria-label cuando hay solo icono sin texto
 */
import React from 'react'
import { Icon } from '../Icon'

const VARIANT_STYLES = {
  success: {
    light: 'bg-clinical-success/10 text-clinical-success border-clinical-success/20',
    dark: 'dark:bg-clinical-success/5 dark:text-emerald-300 dark:border-clinical-success/30',
    dot: 'bg-clinical-success dark:bg-emerald-400',
    icon: 'text-clinical-success dark:text-emerald-300',
  },
  warning: {
    light: 'bg-clinical-warning/10 text-amber-700 border-clinical-warning/20',
    dark: 'dark:bg-clinical-warning/5 dark:text-amber-300 dark:border-clinical-warning/30',
    dot: 'bg-clinical-warning dark:bg-amber-400',
    icon: 'text-clinical-warning dark:text-amber-300',
  },
  error: {
    light: 'bg-clinical-error/10 text-clinical-error border-clinical-error/20',
    dark: 'dark:bg-clinical-error/5 dark:text-red-300 dark:border-clinical-error/30',
    dot: 'bg-clinical-error dark:text-red-400',
    icon: 'text-clinical-error dark:text-red-300',
  },
  info: {
    light: 'bg-clinical-info/10 text-clinical-info border-clinical-info/20',
    dark: 'dark:bg-clinical-info/5 dark:text-sky-300 dark:border-clinical-info/30',
    dot: 'bg-clinical-info dark:text-sky-400',
    icon: 'text-clinical-info dark:text-sky-300',
  },
  neutral: {
    light: 'bg-graphite-100 text-graphite-700 border-graphite-200',
    dark: 'dark:bg-graphite-800 dark:text-graphite-200 dark:border-graphite-700',
    dot: 'bg-graphite-500 dark:bg-graphite-400',
    icon: 'text-graphite-500 dark:text-graphite-400',
  },
}

const SIZE_STYLES = {
  sm: {
    root: 'px-2 py-0.5 text-[10px]',
    dot: 'w-1.5 h-1.5',
    icon: 'xs',
    gap: 'gap-1',
  },
  md: {
    root: 'px-2.5 py-1 text-xs',
    dot: 'w-2 h-2',
    icon: 'sm',
    gap: 'gap-1.5',
  },
}

export const Badge = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon: IconComponent,
  children,
  className = '',
  'aria-label': ariaLabel,
  ...rest
}) => {
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md

  const hasOnlyIcon = IconComponent && !children
  const computedAriaLabel = ariaLabel || (hasOnlyIcon ? 'status badge' : undefined)

  return (
    <span
      role={dot ? 'status' : undefined}
      aria-label={computedAriaLabel}
      className={`
        inline-flex items-center font-medium whitespace-nowrap
        border rounded-md
        ${sizeStyle.root}
        ${sizeStyle.gap}
        ${variantStyle.light}
        ${variantStyle.dark}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...rest}
    >
      {/* Dot indicador */}
      {dot && (
        <span
          className={`rounded-full ${sizeStyle.dot} ${variantStyle.dot}`}
          aria-hidden="true"
        />
      )}

      {/* Icono */}
      {IconComponent && !dot && (
        <Icon
          icon={IconComponent}
          size={sizeStyle.icon}
          className={variantStyle.icon}
        />
      )}

      {/* Texto */}
      {children && <span>{children}</span>}
    </span>
  )
}

Badge.displayName = 'Badge'
