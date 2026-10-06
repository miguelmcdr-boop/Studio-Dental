/**
 * DentikOSLogo — Componente Maestro de Identidad Visual (DentikOS v1.0)
 *
 * Características:
 * - Isotipo vectorial con molar estilizado y trazo de precisión.
 * - Gradiente lineal oficial dentikosGoldOfficial (#FFF5DF -> #E5C378 -> #B88E3A -> #D4AF37).
 * - Optical sizes: 'micro' (10px), 'standard' (7.5px), 'display' (5.5px).
 * - Variantes: 'horizontal', 'stacked', 'icon-only'.
 * - Modo oscuro adaptable o forzado vía prop `dark`.
 *
 * Exportación nombrada estricta (Constitución de Arquitectura).
 */
import React from 'react'

const MOLAR_PATH =
  'M 18 36 C 18 16, 36 16, 46 20 C 50 22, 58 22, 62 20 C 72 16, 90 16, 90 36 C 90 54, 82 66, 78 82 C 76 86, 70 86, 68 80 C 62 62, 58 54, 54 54 C 50 54, 46 62, 40 80 C 38 86, 32 86, 30 82 C 26 66, 18 54, 18 36 Z'

export type DentikOSLogoVariant = 'horizontal' | 'stacked' | 'icon-only'
export type DentikOSOpticalSize = 'micro' | 'standard' | 'display'
export type DentikOSLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number

const OPTICAL_STROKES: Record<DentikOSOpticalSize, number> = {
  micro: 10.0,
  standard: 7.5,
  display: 5.5,
}

interface SizeDimensions {
  icon: number
  text: string
  gap: string
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', SizeDimensions> = {
  xs: { icon: 20, text: 'text-xs', gap: 'gap-1.5' },
  sm: { icon: 28, text: 'text-sm', gap: 'gap-2' },
  md: { icon: 36, text: 'text-lg', gap: 'gap-2.5' },
  lg: { icon: 48, text: 'text-2xl', gap: 'gap-3' },
  xl: { icon: 64, text: 'text-3xl', gap: 'gap-3.5' },
}

export interface DentikOSLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: DentikOSLogoVariant
  opticalSize?: DentikOSOpticalSize
  size?: DentikOSLogoSize
  dark?: boolean
  className?: string
  accessibleTitle?: string
}

export const DentikOSLogo: React.FC<DentikOSLogoProps> = ({
  variant = 'horizontal',
  opticalSize = 'standard',
  size = 'md',
  dark = false,
  className = '',
  accessibleTitle = 'DentikOS Logo',
  ...props
}) => {
  const strokeWidth = OPTICAL_STROKES[opticalSize] || OPTICAL_STROKES.standard

  const dimensions: SizeDimensions = typeof size === 'number'
    ? { icon: size, text: 'text-base', gap: 'gap-2' }
    : (SIZE_MAP[size] || SIZE_MAP.md)

  const textColorClass = dark
    ? 'text-white'
    : 'text-graphite-900 dark:text-white'

  // Isotipo SVG
  const IconSvg = (
    <svg
      viewBox="0 0 108 108"
      width={dimensions.icon}
      height={dimensions.icon}
      className="flex-shrink-0"
      fill="none"
      role="img"
      aria-label={accessibleTitle}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{accessibleTitle}</title>
      <defs>
        <linearGradient
          id="dentikosGoldOfficial"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#FFF5DF" />
          <stop offset="35%" stopColor="#E5C378" />
          <stop offset="70%" stopColor="#B88E3A" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      <path
        d={MOLAR_PATH}
        stroke="url(#dentikosGoldOfficial)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        data-testid="dentikos-molar-path"
      />
    </svg>
  )

  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`} {...props}>
        {IconSvg}
      </div>
    )
  }

  const Wordmark = (
    <div className={`flex items-baseline tracking-tight font-display ${dimensions.text}`}>
      <span className={`font-semibold ${textColorClass}`}>
        Dentik
      </span>
      <span className="font-bold text-[#E5C378] ml-0.5">
        OS
      </span>
    </div>
  )

  if (variant === 'stacked') {
    return (
      <div
        className={`inline-flex flex-col items-center text-center ${dimensions.gap} ${className}`}
        {...props}
      >
        {IconSvg}
        {Wordmark}
      </div>
    )
  }

  // Variant horizontal (default)
  return (
    <div
      className={`inline-flex items-center ${dimensions.gap} ${className}`}
      {...props}
    >
      {IconSvg}
      {Wordmark}
    </div>
  )
}

DentikOSLogo.displayName = 'DentikOSLogo'
