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
      className="fixed inset-0 z-50 bg-graphite-900/50 dark:bg-graphite-950/70 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="bg-white dark:bg-graphite-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[60vh] overflow-hidden border border-graphite-200 dark:border-graphite-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input de búsqueda */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-graphite-200 dark:border-graphite-700">
          <Search size={20} className="text-graphite-400 dark:text-graphite-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pacientes, módulos o acciones..."
            className="flex-1 bg-transparent text-graphite-900 dark:text-graphite-50 placeholder:text-graphite-400 dark:placeholder:text-graphite-500 focus:outline-none text-base"
            aria-label="Buscar"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-graphite-100 dark:hover:bg-graphite-700 text-graphite-400 dark:text-graphite-500"
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
              <div className="px-4 py-2 text-xs font-semibold text-graphite-500 dark:text-graphite-400 uppercase tracking-wider bg-graphite-50 dark:bg-graphite-900">
                Pacientes
              </div>
              {pacientesFiltrados.map((paciente) => {
                const idx = globalIndex++
                return (
                  <button
                    key={paciente.id}
                    type="button"
                    onClick={onSelect}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                      idx === selectedIndex
                        ? 'bg-graphite-100 dark:bg-graphite-700'
                        : 'hover:bg-graphite-50 dark:hover:bg-graphite-900'
                    }`}
                  >
                    <User size={24} className="text-graphite-600 dark:text-graphite-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-graphite-900 dark:text-graphite-50 truncate">
                        {paciente.nombre}
                      </div>
                      <div className="text-xs text-graphite-500 dark:text-graphite-400 truncate flex items-center gap-2">
                        <span>{paciente.rut}</span>
                        {recientesIds.has(paciente.id) && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-clinical-info/15 text-clinical-info dark:bg-sky-400/20 dark:text-sky-300 uppercase tracking-wider">
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
              <div className="px-4 py-2 text-xs font-semibold text-graphite-500 dark:text-graphite-400 uppercase tracking-wider bg-graphite-50 dark:bg-graphite-900">
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
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                      idx === selectedIndex
                        ? 'bg-graphite-100 dark:bg-graphite-700'
                        : 'hover:bg-graphite-50 dark:hover:bg-graphite-900'
                    }`}
                  >
                    <Icon icon={IconComponent} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-graphite-900 dark:text-graphite-50 truncate">
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
              <div className="px-4 py-2 text-xs font-semibold text-graphite-500 dark:text-graphite-400 uppercase tracking-wider bg-graphite-50 dark:bg-graphite-900">
                Acciones rápidas
              </div>
              {accionesRapidas.map((accion) => {
                const idx = globalIndex++
                return (
                  <button
                    key={accion.id}
                    type="button"
                    onClick={onSelect}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                      idx === selectedIndex
                        ? 'bg-graphite-100 dark:bg-graphite-700'
                        : 'hover:bg-graphite-50 dark:hover:bg-graphite-900'
                    }`}
                  >
                    {(() => {
                      const IconMap = { Calendar, User, DollarSign }
                      const IconComponent = IconMap[accion.icon] || Search
                      return <IconComponent size={24} className="text-graphite-600 dark:text-graphite-400" />
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-graphite-900 dark:text-graphite-50 truncate">
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
        <div className="px-4 py-2 border-t border-graphite-200 dark:border-graphite-700 bg-graphite-50 dark:bg-graphite-900 flex items-center gap-4 text-xs text-graphite-500 dark:text-graphite-400">
          <span>↑↓ navegar</span>
          <span>↵ seleccionar</span>
          <span>esc cerrar</span>
        </div>
      </div>
    </div>
  )
}

CommandPalette.displayName = 'CommandPalette'
