/**
 * useCommandPalette — Estado y lógica de la CommandPalette (F10-B4)
 *
 * Gestiona:
 * - Estado abierto/cerrado
 * - Búsqueda fuzzy en pacientes (nombre/RUT)
 * - Filtrado de módulos por RBAC
 * - Navegación con teclado (↑↓ Enter Esc)
 * - Atajo global ⌘K / Ctrl+K
 */
import { useState, useMemo, useCallback, useEffect } from 'react'
import { usePacientesStore } from '../store/pacientesStore'
import { useRBAC } from './useRBAC'
import { useSesionStore } from '../store/sesionStore' // F7-26: historial de pacientes recientes
import { SECCIONES_SIDEBAR, type SidebarItem } from '../constants/sidebarConstants'
import type { Paciente } from '../modules/pacientes/schemas/pacienteSchema'
import { createLogger } from '../services/logger'

const log = createLogger('useCommandPalette')

const normalizeText = (text: string | null | undefined): string => {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
}

const fuzzyMatch = (text: string | null | undefined, query: string): boolean => {
  const normalizedText = normalizeText(text)
  const normalizedQuery = normalizeText(query)
  return normalizedText.includes(normalizedQuery)
}

export interface UseCommandPaletteProps {
  onNavigate?: (modulo: string) => void
  onCreateCita?: () => void
  onCreatePaciente?: () => void
  onCreatePresupuesto?: () => void
  onSelectPaciente?: (paciente: Paciente) => void
}

export interface AccionRapida {
  id: string
  label: string
  icon: string
  action?: () => void
}

export type CommandPaletteResult =
  | { type: 'paciente'; data: Paciente }
  | { type: 'modulo'; data: SidebarItem }
  | { type: 'accion'; data: AccionRapida }

export interface UseCommandPaletteReturn {
  isOpen: boolean
  query: string
  setQuery: (query: string) => void
  selectedIndex: number
  pacientesFiltrados: Paciente[]
  modulosFiltrados: SidebarItem[]
  accionesRapidas: AccionRapida[]
  open: () => void
  close: () => void
  toggle: () => void
  selectCurrent: () => void
  moveUp: () => void
  moveDown: () => void
}

export const useCommandPalette = ({
  onNavigate,
  onCreateCita,
  onCreatePaciente,
  onCreatePresupuesto,
  onSelectPaciente,
}: UseCommandPaletteProps): UseCommandPaletteReturn => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [query, setQuery] = useState<string>('')
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const pacientes = usePacientesStore((state: { pacientes: Paciente[] }) => state.pacientes)
  const { puede } = useRBAC() as { puede: (permiso: string) => boolean }

  // F7-26: Búsqueda de pacientes (top 5)
  // Cuando no hay query, mostrar pacientes recientes (últimos 5 visitados)
  // Cuando hay query, hacer búsqueda fuzzy por nombre/RUT
  const pacientesFiltrados = useMemo((): Paciente[] => {
    if (!query.trim()) {
      // Mostrar recientes si existen, sino primeros 5 del store
      const sesionState = useSesionStore.getState() as {
        obtenerPacientesRecientes: () => { id: string | number }[]
      }
      const recientes = sesionState.obtenerPacientesRecientes?.() || []
      const recientesIds = new Set(recientes.map(r => r.id))
      if (recientesIds.size > 0) {
        // Pacientes que están en recientes, en el orden de recientes
        const recientesConDatos = recientes
          .map(r => (pacientes || []).find(p => p.id === r.id))
          .filter((p): p is Paciente => Boolean(p))
        if (recientesConDatos.length > 0) return recientesConDatos.slice(0, 5)
      }
      return (pacientes || []).slice(0, 5)
    }
    return (pacientes || [])
      .filter(p => fuzzyMatch(p.nombre, query) || fuzzyMatch(p.rut, query))
      .slice(0, 5)
  }, [pacientes, query])

  // Módulos filtrados por RBAC
  const modulosFiltrados = useMemo((): SidebarItem[] => {
    const todosLosItems: SidebarItem[] = SECCIONES_SIDEBAR.flatMap(seccion => seccion.items)
    const permitidos = todosLosItems.filter(item => !item.permisoRequerido || puede(item.permisoRequerido))
    
    if (!query.trim()) return permitidos
    return permitidos.filter(item => fuzzyMatch(item.name, query))
  }, [puede, query])

  // Acciones rápidas (fijas)
  const accionesRapidas = useMemo((): AccionRapida[] => {
    const acciones: AccionRapida[] = [
      { id: 'nueva-cita', label: 'Nueva cita', icon: 'Calendar', action: onCreateCita },
      { id: 'nuevo-paciente', label: 'Nuevo paciente', icon: 'User', action: onCreatePaciente },
      { id: 'nuevo-presupuesto', label: 'Nuevo presupuesto', icon: 'DollarSign', action: onCreatePresupuesto },
    ]
    if (!query.trim()) return acciones
    return acciones.filter(a => fuzzyMatch(a.label, query))
  }, [query, onCreateCita, onCreatePaciente, onCreatePresupuesto])

  // Lista plana de todos los resultados (para navegación con teclado)
  const allResults = useMemo((): CommandPaletteResult[] => [
    ...pacientesFiltrados.map((p): CommandPaletteResult => ({ type: 'paciente', data: p })),
    ...modulosFiltrados.map((m): CommandPaletteResult => ({ type: 'modulo', data: m })),
    ...accionesRapidas.map((a): CommandPaletteResult => ({ type: 'accion', data: a })),
  ], [pacientesFiltrados, modulosFiltrados, accionesRapidas])

  // Reset selectedIndex cuando cambian los resultados
  useEffect(() => {
    setSelectedIndex(0)
  }, [allResults.length])

  const open = useCallback((): void => {
    setIsOpen(true)
    setQuery('')
  }, [])

  const close = useCallback((): void => {
    setIsOpen(false)
    setQuery('')
  }, [])

  const toggle = useCallback((): void => {
    if (isOpen) close()
    else open()
  }, [isOpen, open, close])

  const selectCurrent = useCallback((): void => {
    const result = allResults[selectedIndex]
    if (!result) return

    try {
      if (result.type === 'paciente') {
        onNavigate?.('Pacientes')
        // F7-26: seleccionar paciente específico y guardar en recientes
        onSelectPaciente?.(result.data)
        const sesionState = useSesionStore.getState() as {
          agregarPacienteReciente: (paciente: Paciente) => void
        }
        sesionState.agregarPacienteReciente?.(result.data)
      } else if (result.type === 'modulo') {
        onNavigate?.(result.data.name)
      } else if (result.type === 'accion') {
        result.data.action?.()
      }
      close()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log.error('Error al ejecutar comando:', msg)
    }
  }, [allResults, selectedIndex, onNavigate, onSelectPaciente, close])

  const moveUp = useCallback((): void => {
    setSelectedIndex(prev => (prev > 0 ? prev - 1 : allResults.length - 1))
  }, [allResults.length])

  const moveDown = useCallback((): void => {
    setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : 0))
  }, [allResults.length])

  return {
    isOpen,
    query,
    setQuery,
    selectedIndex,
    pacientesFiltrados,
    modulosFiltrados,
    accionesRapidas,
    open,
    close,
    toggle,
    selectCurrent,
    moveUp,
    moveDown,
  }
}
