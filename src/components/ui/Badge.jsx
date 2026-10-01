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
    light: 'bg-status-success/10 text-status-success border-status-success/20',
    dark: 'dark:bg-status-success/10 dark:text-emerald-300 dark:border-status-success/30',
    dot: 'bg-status-success dark:bg-emerald-400',
    icon: 'text-status-success dark:text-emerald-300',
  },
  warning: {
    light: 'bg-status-warning/10 text-amber-700 border-status-warning/20',
    dark: 'dark:bg-status-warning/10 dark:text-amber-300 dark:border-status-warning/30',
    dot: 'bg-status-warning dark:bg-amber-400',
    icon: 'text-status-warning dark:text-amber-300',
  },
  error: {
    light: 'bg-status-danger/10 text-status-danger border-status-danger/20',
    dark: 'dark:bg-status-danger/10 dark:text-red-300 dark:border-status-danger/30',
    dot: 'bg-status-danger dark:text-red-400',
    icon: 'text-status-danger dark:text-red-300',
  },
  danger: {
    light: 'bg-status-danger/10 text-status-danger border-status-danger/20',
    dark: 'dark:bg-status-danger/10 dark:text-red-300 dark:border-status-danger/30',
    dot: 'bg-status-danger dark:text-red-400',
    icon: 'text-status-danger dark:text-red-300',
  },
  info: {
    light: 'bg-status-info/10 text-status-info border-status-info/20',
    dark: 'dark:bg-status-info/10 dark:text-sky-300 dark:border-status-info/30',
    dot: 'bg-status-info dark:text-sky-400',
    icon: 'text-status-info dark:text-sky-300',
  },
  neutral: {
    light: 'bg-graphite-100 text-graphite-700 border-graphite-200',
    dark: 'dark:bg-graphite-800 dark:text-graphite-200 dark:border-graphite-700',
    dot: 'bg-graphite-500 dark:bg-graphite-400',
    icon: 'text-graphite-500 dark:text-graphite-400',
  },
}

// Aliases para variantes semánticas 'status-*'
VARIANT_STYLES['status-success'] = VARIANT_STYLES.success
VARIANT_STYLES['status-warning'] = VARIANT_STYLES.warning
VARIANT_STYLES['status-danger'] = VARIANT_STYLES.danger
VARIANT_STYLES['status-info'] = VARIANT_STYLES.info

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
