/**
 * DentikOSMicroSeal — Componente Micro-Sello Oficial para Documentos Impresos y PDFs (DentikOS v1.0)
 *
 * Especificaciones de Marca y Normativa:
 * - Glifo del molar en tamaño 14 × 14 px con trazo áureo (#B88E3A).
 * - Wordmark tipográfico en Plus Jakarta Sans (11px / ~9pt, color #64748B): "Dentik" en slate y "OS" en oro (#B88E3A).
 * - Leyenda normativa estandarizada:
 *   "Trazabilidad Firma Digital — Powered by DentikOS • Ficha clínica electrónica conforme a Ley 20.584 y Ley 19.628"
 *
 * Exportación nombrada estricta (Constitución de Arquitectura).
 */
import React from 'react'

const MOLAR_PATH =
  'M 18 36 C 18 16, 36 16, 46 20 C 50 22, 58 22, 62 20 C 72 16, 90 16, 90 36 C 90 54, 82 66, 78 82 C 76 86, 70 86, 68 80 C 62 62, 58 54, 54 54 C 50 54, 46 62, 40 80 C 38 86, 32 86, 30 82 C 26 66, 18 54, 18 36 Z'

export const DentikOSMicroSeal = ({ className = '', ...props }) => {
  return (
    <footer
      data-testid="dentikos-micro-seal"
      className={`border-t border-gray-200 dark:border-graphite-700 pt-3 mt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[#64748B] text-[11px] font-sans select-none print:mt-4 print:pt-2 print:border-gray-300 print:text-gray-600 ${className}`}
      {...props}
    >
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <svg
          viewBox="0 0 108 108"
          width="14"
          height="14"
          className="flex-shrink-0"
          fill="none"
          role="img"
          aria-label="DentikOS Molar Glyph"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={MOLAR_PATH}
            stroke="#B88E3A"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            data-testid="dentikos-molar-glyph"
          />
        </svg>
        <span className="font-semibold text-slate-700 dark:text-graphite-300 print:text-black tracking-tight font-display text-[11px]">
          Dentik<span className="font-bold text-[#B88E3A] ml-0.5">OS</span>
        </span>
      </div>

      <p className="text-[10px] leading-tight text-center sm:text-right text-[#64748B] dark:text-graphite-400 print:text-gray-600">
        Trazabilidad Firma Digital — Powered by DentikOS • Ficha clínica electrónica conforme a Ley 20.584 y Ley 19.628
      </p>
    </footer>
  )
}

DentikOSMicroSeal.displayName = 'DentikOSMicroSeal'
