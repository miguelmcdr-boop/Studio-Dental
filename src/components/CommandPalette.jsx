/**
 * CommandPalette — Búsqueda omnicanal con ⌘K (F10-B4)
 *
 * Overlay con input de búsqueda + resultados en 3 secciones:
 * 1. Pacientes (top 5 por match)
 * 2. Módulos (filtrados por RBAC)
 * 3. Acciones rápidas
 *
 * Accesibilidad F6-04:
 * - Autofocus en input al abrir
 * - Trap de foco (↑↓ navega resultados)
 * - Enter selecciona, Esc cierra
 * - role="dialog" + aria-modal
 */
import React, { useEffect, useMemo, useRef } from 'react'
import { Icon } from './Icon'
import { X, Search, User, Calendar, DollarSign } from 'lucide-react'

export const CommandPalette = ({
  isOpen,
  query,
  setQuery,
  selectedIndex,
  pacientesFiltrados,
  modulosFiltrados,
  accionesRapidas,
  onClose,
  onSelect,
  onMoveUp,
  onMoveDown,
}) => {
  const inputRef = useRef(null)
  const dialogRef = useRef(null)

  // Autofocus al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        onMoveUp()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        onMoveDown()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onSelect()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onSelect, onMoveUp, onMoveDown])

  // F7-26: Set de IDs de pacientes recientes para mostrar badge visual
  const recientesIds = useMemo(() => {
    try {
      return new Set(
        useSesionStore.getState().obtenerPacientesRecientes().map(r => r.id)
      )
    } catch {
      return new Set()
    }
  }, [isOpen]) // Re-computar al abrir CommandPalette

  if (!isOpen) return null

  const hasResults = pacientesFiltrados.length > 0 || modulosFiltrados.length > 0 || accionesRapidas.length > 0
  let globalIndex = 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 bg-graphite-900/50 dark:bg-black/75 surgical:bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="bg-white dark:bg-[#0F172A] surgical:bg-[#F1F5F9] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[60vh] overflow-hidden border border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] transition-standard zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input de búsqueda */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] focus-within:ring-2 focus-within:ring-[#B88E3A]/30">
          <Search size={20} className="text-[#B88E3A] dark:text-[#E5C378]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pacientes, módulos o acciones..."
            className="flex-1 bg-transparent text-graphite-900 dark:text-graphite-50 surgical:text-black placeholder:text-graphite-400 dark:placeholder:text-graphite-500 focus:outline-none text-base"
            aria-label="Buscar"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E293B] surgical:hover:bg-slate-200 text-graphite-400 dark:text-graphite-500 transition-micro"
            aria-label="Cerrar"
          >
            <Icon icon={X} size="sm" />
          </button>
        </div>

        {/* Resultados */}
        <div className="overflow-y-auto max-h-[calc(60vh-60px)]">
          {!hasResults && (
            <div className="p-8 text-center text-graphite-500 dark:text-graphite-400">
              No se encontraron resultados
            </div>
          )}

          {/* Pacientes */}
          {pacientesFiltrados.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-graphite-500 dark:text-graphite-400 surgical:text-black uppercase tracking-wider bg-slate-50 dark:bg-[#070B14] surgical:bg-[#E2E8F0]">
                Pacientes
              </div>
              {pacientesFiltrados.map((paciente) => {
                const idx = globalIndex++
                return (
                  <button
                    key={paciente.id}
                    type="button"
                    onClick={onSelect}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-micro ${
                      idx === selectedIndex
                        ? 'bg-[#FFF5DF] text-[#7A591F] dark:bg-[#1E293B] dark:text-[#E5C378] surgical:bg-[#CBD5E1] surgical:text-black font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 surgical:hover:bg-[#E2E8F0]'
                    }`}
                  >
                    <User size={24} className="text-graphite-600 dark:text-graphite-400 surgical:text-black" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-graphite-900 dark:text-graphite-50 surgical:text-black truncate">
                        {paciente.nombre}
                      </div>
                      <div className="text-xs text-graphite-500 dark:text-graphite-400 surgical:text-black truncate flex items-center gap-2">
                        <span className="tabular-nums">{paciente.rut}</span>
                        {recientesIds.has(paciente.id) && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FFF5DF] text-[#7A591F] dark:bg-[#1E293B] dark:text-[#E5C378] uppercase tracking-wider">
                            Reciente
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Módulos */}
          {modulosFiltrados.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-graphite-500 dark:text-graphite-400 surgical:text-black uppercase tracking-wider bg-slate-50 dark:bg-[#070B14] surgical:bg-[#E2E8F0]">
                Módulos
              </div>
              {modulosFiltrados.map((modulo) => {
                const idx = globalIndex++
                const IconComponent = modulo.icon
                return (
                  <button
                    key={modulo.name}
                    type="button"
                    onClick={onSelect}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-micro ${
                      idx === selectedIndex
                        ? 'bg-[#FFF5DF] text-[#7A591F] dark:bg-[#1E293B] dark:text-[#E5C378] surgical:bg-[#CBD5E1] surgical:text-black font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 surgical:hover:bg-[#E2E8F0]'
                    }`}
                  >
                    <Icon icon={IconComponent} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-graphite-900 dark:text-graphite-50 surgical:text-black truncate">
                        {modulo.name}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Acciones rápidas */}
          {accionesRapidas.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-graphite-500 dark:text-graphite-400 surgical:text-black uppercase tracking-wider bg-slate-50 dark:bg-[#070B14] surgical:bg-[#E2E8F0]">
                Acciones rápidas
              </div>
              {accionesRapidas.map((accion) => {
                const idx = globalIndex++
                return (
                  <button
                    key={accion.id}
                    type="button"
                    onClick={onSelect}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-micro ${
                      idx === selectedIndex
                        ? 'bg-[#FFF5DF] text-[#7A591F] dark:bg-[#1E293B] dark:text-[#E5C378] surgical:bg-[#CBD5E1] surgical:text-black font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 surgical:hover:bg-[#E2E8F0]'
                    }`}
                  >
                    {(() => {
                      const IconMap = { Calendar, User, DollarSign }
                      const IconComponent = IconMap[accion.icon] || Search
                      return <IconComponent size={24} className="text-graphite-600 dark:text-graphite-400 surgical:text-black" />
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-graphite-900 dark:text-graphite-50 surgical:text-black truncate">
                        {accion.label}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer con hint de atajos */}
        <div className="px-4 py-2 border-t border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569] bg-slate-50 dark:bg-[#070B14] surgical:bg-[#E2E8F0] flex items-center gap-4 text-xs text-graphite-500 dark:text-graphite-400 surgical:text-black">
          <span>↑↓ navegar</span>
          <span>↵ seleccionar</span>
          <span>esc cerrar</span>
        </div>
      </div>
    </div>
  )
}

CommandPalette.displayName = 'CommandPalette'
