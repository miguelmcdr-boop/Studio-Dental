/**
 * CommandPalette — Búsqueda omnicanal ⌘K con 6 categorías y backdrop blur [12px]
 * Blueprint 03: Pacientes, Citas, Módulos, Acciones, Configuración y Documentos.
 */
import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  User,
  Calendar,
  Layers,
  Zap,
  Settings,
  FileText,
  CornerDownLeft,
} from 'lucide-react'
import type { PaletteItem } from '../hooks/useCommandPalette'

export interface CommandPaletteProps {
  isOpen: boolean
  query: string
  setQuery: (q: string) => void
  selectedIndex: number
  allResults: PaletteItem[]
  close: () => void
  selectCurrent: () => void
  moveUp: () => void
  moveDown: () => void
}

const CATEGORIA_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  pacientes: User,
  citas: Calendar,
  modulos: Layers,
  acciones: Zap,
  configuracion: Settings,
  documentos: FileText,
}

const CATEGORIA_LABELS: Record<string, string> = {
  pacientes: 'Pacientes',
  citas: 'Citas',
  modulos: 'Módulos',
  acciones: 'Acciones Rápidas',
  configuracion: 'Configuración',
  documentos: 'Documentos',
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  query,
  setQuery,
  selectedIndex,
  allResults,
  close,
  selectCurrent,
  moveUp,
  moveDown,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    const el = itemRefs.current[selectedIndex]
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      moveDown()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveUp()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      selectCurrent()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] px-4">
          {/* Backdrop blur [12px] */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="absolute inset-0 bg-black/50 backdrop-blur-[12px]"
            aria-hidden="true"
          />

          {/* Palette container: 560px max */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[560px] max-w-[92vw] max-h-[480px] bg-white dark:bg-graphite-950 surgical:bg-graphite-200 rounded-2xl shadow-2xl border border-surface flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Paleta de comandos"
          >
            {/* Input de búsqueda */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface bg-graphite-50/50 dark:bg-graphite-900/40">
              <Search size={18} className="text-primary shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar pacientes, citas, módulos o acciones..."
                className="flex-1 bg-transparent text-sm font-medium text-graphite-900 dark:text-graphite-100 placeholder:text-graphite-400 focus:outline-none"
                aria-label="Entrada de búsqueda"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-graphite-400 hover:text-graphite-700 dark:hover:text-graphite-200 rounded"
                >
                  <X size={15} />
                </button>
              ) : (
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-graphite-900 border border-surface rounded text-graphite-400">
                  Esc
                </kbd>
              )}
            </div>

            {/* Lista de resultados en 6 categorías */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {allResults.length === 0 ? (
                <div className="py-12 text-center text-graphite-400">
                  <p className="text-xs font-semibold">No se encontraron resultados</p>
                  <p className="text-[11px] mt-0.5">Intenta con otro término o abreviatura</p>
                </div>
              ) : (
                allResults.map((item, idx) => {
                  const isSelected = idx === selectedIndex
                  const IconComp = CATEGORIA_ICONS[item.categoria] || Search
                  const catLabel = CATEGORIA_LABELS[item.categoria] || item.categoria

                  return (
                    <button
                      key={item.id}
                      ref={(el) => { itemRefs.current[idx] = el }}
                      type="button"
                      onClick={() => selectCurrent()}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-gold-light/70 dark:bg-graphite-800 text-graphite-900 dark:text-gold-satin shadow-2xs font-semibold'
                          : 'text-graphite-700 dark:text-graphite-300 hover:bg-graphite-100 dark:hover:bg-graphite-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isSelected
                              ? 'bg-primary text-black'
                              : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-500'
                          }`}
                        >
                          <IconComp size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate leading-snug">{item.label}</p>
                          {item.sublabel && (
                            <p className="text-[10px] text-graphite-400 truncate mt-0.5 leading-snug">
                              {item.sublabel}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pl-2">
                        <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-graphite-100 dark:bg-graphite-900 text-graphite-400">
                          {catLabel}
                        </span>
                        {isSelected && (
                          <CornerDownLeft size={13} className="text-primary shrink-0" />
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer de navegación por teclado */}
            <div className="px-4 py-2 border-t border-surface bg-graphite-50/40 dark:bg-graphite-900/30 flex items-center justify-between text-[11px] text-graphite-400">
              <div className="flex items-center gap-2">
                <span><kbd className="px-1 py-0.5 rounded bg-surface border border-surface font-mono">↑↓</kbd> Navegar</span>
                <span><kbd className="px-1 py-0.5 rounded bg-surface border border-surface font-mono">↵</kbd> Seleccionar</span>
              </div>
              <span>6 Categorías Clínicas</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
