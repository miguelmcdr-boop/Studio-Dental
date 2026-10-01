/**
 * Icon — Wrapper de lucide-react para el Design System (F7-25)
 *
 * Proporciona una API consistente para iconos con tamaños y colores
 * del design system Graphite & Champagne.
 *
 * Uso:
 *   import { Icon } from '../components/Icon'
 *   import { Calendar, Users } from 'lucide-react'
 *
 *   <Icon icon={Calendar} size="md" />
 *   <Icon icon={Users} size="sm" color="primary" />
 */
import React from 'react'

const SIZES = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
}

const COLORS = {
  default: 'currentColor',
  primary: 'var(--color-primary)',
  muted: 'var(--color-graphite-500)',
  success: 'var(--color-clinical-success)',
  warning: 'var(--color-clinical-warning)',
  error: 'var(--color-clinical-error)',
  info: 'var(--color-clinical-info)',
}

/**
 * Wrapper de iconos lucide-react con tamaños y colores del design system.
 *
 * @param {React.ComponentType} icon - Componente de lucide-react (ej: Calendar)
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} size - Tamaño del icono (default: 'md')
 * @param {'default'|'primary'|'muted'|'success'|'warning'|'error'|'info'} color - Color del design system
 * @param {string} className - Clases adicionales
 */
export const Icon = ({ icon: IconComponent, size = 'md', color = 'default', className = '', ...props }) => {
  if (!IconComponent) return null

  const sizePx = SIZES[size] || SIZES.md
  const colorValue = COLORS[color] || COLORS.default

  return (
    <IconComponent
      size={sizePx}
      color={colorValue}
      strokeWidth={1.75}
      className={className}
      {...props}
    />
  )
}
