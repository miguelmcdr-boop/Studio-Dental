/**
 * Button — Componente base del Design System (F7-25 Fase 3)
 *
 * Botón reutilizable con 5 variantes, 3 tamaños, soporte de iconos,
 * estado loading y dark mode automático.
 *
 * Uso:
 *   import { Button } from '../components/ui/Button'
 *   import { Save, Trash2 } from 'lucide-react'
 *
 *   <Button variant="primary" icon={Save}>Guardar</Button>
 *   <Button variant="danger" icon={Trash2} iconPosition="right">Eliminar</Button>
 *   <Button variant="secondary" loading={true}>Procesando...</Button>
 *   <Button variant="ghost">Cancelar</Button>
 *   <Button variant="outline" fullWidth size="lg">Acción completa</Button>
 *
 * Variantes:
 *   - primary: Champagne (acciones principales)
 *   - secondary: Gris (acciones secundarias)
 *   - danger: Rojo clínico (acciones destructivas)
 *   - ghost: Transparente (acciones sutiles)
 *   - outline: Borde (acciones terciarias)
 *
 * Accesibilidad:
 *   - Soporte aria-label, aria-busy
 *   - Disabled state bloquea click + keyboard
 *   - Focus ring visible
 */
import React, { forwardRef } from 'react'
import { Icon } from '../Icon'
import { Loader2 } from 'lucide-react'

const VARIANT_STYLES = {
  primary: 'bg-primary hover:bg-champagne-600 dark:bg-champagne-500 dark:hover:bg-champagne-600 text-white shadow-sm',
  secondary: 'bg-graphite-100 hover:bg-graphite-200 dark:bg-graphite-800 dark:hover:bg-graphite-700 text-graphite-800 dark:text-graphite-100',
  danger: 'bg-clinical-error hover:bg-red-700 text-white shadow-sm',
  ghost: 'bg-transparent hover:bg-graphite-100 dark:hover:bg-graphite-800 text-graphite-700 dark:text-graphite-300',
  outline: 'bg-transparent border border-graphite-300 dark:border-graphite-600 hover:bg-graphite-50 dark:hover:bg-graphite-800 text-graphite-700 dark:text-graphite-300',
}

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base rounded-lg gap-2.5',
}

const ICON_SIZES = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
}

export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  icon: IconComponent,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  className = '',
  onClick,
  'aria-label': ariaLabel,
  ...rest
}, ref) => {
  const isDisabled = disabled || loading

  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.primary
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md
  const iconSize = ICON_SIZES[size] || ICON_SIZES.md

  const handleClick = (e) => {
    if (isDisabled) {
      e.preventDefault()
      return
    }
    onClick?.(e)
  }

  const handleKeyDown = (e) => {
    if (isDisabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
    }
  }

  return (
    <button
      ref={ref}
      type={type}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading}
      aria-disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-graphite-900
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${fullWidth ? 'w-full' : ''}
        ${variantStyle}
        ${sizeStyle}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...rest}
    >
      {loading && (
        <Icon icon={Loader2} size={iconSize} className="animate-spin" />
      )}

      {!loading && IconComponent && iconPosition === 'left' && (
        <Icon icon={IconComponent} size={iconSize} />
      )}

      {children && <span>{children}</span>}

      {!loading && IconComponent && iconPosition === 'right' && (
        <Icon icon={IconComponent} size={iconSize} />
      )}
    </button>
  )
})

Button.displayName = 'Button'
