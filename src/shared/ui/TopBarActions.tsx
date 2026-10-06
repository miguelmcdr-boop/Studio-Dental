/**
 * TopBarActions — Sistema híbrido de acciones contextuales: Primaria dorada + Menú ⋯
 * Blueprint 03
 */
import React, { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, type LucideIcon } from 'lucide-react'

export interface AccionContextualItem {
  label: string
  icon?: LucideIcon
  onClick: () => void
}

export interface TopBarActionsProps {
  primaria?: AccionContextualItem | null
  secundarias?: AccionContextualItem[]
  className?: string
}

export const TopBarActions: React.FC<TopBarActionsProps> = ({
  primaria,
  secundarias = [],
  className = '',
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  if (!primaria && secundarias.length === 0) return null

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Botón primario con gradiente dorado */}
      {primaria && (
        <button
          type="button"
          onClick={primaria.onClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:opacity-95 active:scale-98 transition-all cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #E5C378 0%, #B88E3A 100%)',
            color: '#070B14',
          }}
          title={primaria.label}
        >
          {primaria.icon && <primaria.icon size={14} className="shrink-0" />}
          <span className="hidden sm:inline">{primaria.label}</span>
        </button>
      )}

      {/* Menú secundario ⋯ */}
      {secundarias.length > 0 && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-graphite-600 dark:text-graphite-300 hover:bg-graphite-100 dark:hover:bg-graphite-800 rounded-lg transition-colors border border-surface cursor-pointer"
            aria-label="Más acciones contextuales"
            title="Más acciones"
          >
            <MoreHorizontal size={15} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1.5 w-44 bg-surface border border-surface rounded-xl shadow-xl py-1 z-50 overflow-hidden"
            >
              {secundarias.map((sec) => (
                <button
                  key={sec.label}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    sec.onClick()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-graphite-700 dark:text-graphite-200 hover:bg-graphite-100 dark:hover:bg-graphite-800 transition-colors text-left cursor-pointer"
                >
                  {sec.icon && <sec.icon size={13} className="text-primary shrink-0" />}
                  <span className="truncate">{sec.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
