/**
 * Icon — Wrapper de lucide-react para el Design System (F7-25)
 *
 * Proporciona una API consistente para iconos con tamaños y colores
 * del design system Graphite & Champagne.
 */
import React from 'react'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type IconColor =
  | 'default'
  | 'primary'
  | 'muted'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'

const SIZES: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
}

const COLORS: Record<IconColor, string> = {
  default: 'currentColor',
  primary: 'var(--color-primary)',
  muted: 'var(--color-graphite-500)',
  success: 'var(--color-clinical-success)',
  warning: 'var(--color-clinical-warning)',
  error: 'var(--color-clinical-error)',
  info: 'var(--color-clinical-info)',
}

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'color'> {
  icon: React.ElementType
  size?: IconSize
  color?: IconColor
  className?: string
  strokeWidth?: number
}

export const Icon: React.FC<IconProps> = ({
  icon: IconComponent,
  size = 'md',
  color = 'default',
  className = '',
  ...props
}) => {
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

Icon.displayName = 'Icon'
