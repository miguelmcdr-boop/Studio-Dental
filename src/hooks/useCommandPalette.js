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
import { SECCIONES_SIDEBAR } from '../constants/sidebarConstants'
import { createLogger } from '../services/logger'

const log = createLogger('useCommandPalette')

const normalizeText = (text) => {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
}

const fuzzyMatch = (text, query) => {
  const normalizedText = normalizeText(text)
  const normalizedQuery = normalizeText(query)
  return normalizedText.includes(normalizedQuery)
}

export const useCommandPalette = ({ onNavigate, onCreateCita, onCreatePaciente, onCreatePresupuesto }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const pacientes = usePacientesStore((state) => state.pacientes)
  const { puede } = useRBAC()

  // Búsqueda de pacientes (top 5)
  const pacientesFiltrados = useMemo(() => {
    if (!query.trim()) return pacientes.slice(0, 5)
    return pacientes
      .filter(p => fuzzyMatch(p.nombre, query) || fuzzyMatch(p.rut, query))
      .slice(0, 5)
  }, [pacientes, query])

  // Módulos filtrados por RBAC
  const modulosFiltrados = useMemo(() => {
    const todosLosItems = SECCIONES_SIDEBAR.flatMap(seccion => seccion.items)
    const permitidos = todosLosItems.filter(item => !item.permisoRequerido || puede(item.permisoRequerido))
    
    if (!query.trim()) return permitidos
    return permitidos.filter(item => fuzzyMatch(item.name, query))
  }, [puede, query])

  // Acciones rápidas (fijas)
  const accionesRapidas = useMemo(() => {
    const acciones = [
      { id: 'nueva-cita', label: 'Nueva cita', icon: '📅', action: onCreateCita },
      { id: 'nuevo-paciente', label: 'Nuevo paciente', icon: '👤', action: onCreatePaciente },
      { id: 'nuevo-presupuesto', label: 'Nuevo presupuesto', icon: '💰', action: onCreatePresupuesto },
    ]
    if (!query.trim()) return acciones
    return acciones.filter(a => fuzzyMatch(a.label, query))
  }, [query, onCreateCita, onCreatePaciente, onCreatePresupuesto])

  // Lista plana de todos los resultados (para navegación con teclado)
  const allResults = useMemo(() => [
    ...pacientesFiltrados.map(p => ({ type: 'paciente', data: p })),
    ...modulosFiltrados.map(m => ({ type: 'modulo', data: m })),
    ...accionesRapidas.map(a => ({ type: 'accion', data: a })),
  ], [pacientesFiltrados, modulosFiltrados, accionesRapidas])

  // Reset selectedIndex cuando cambian los resultados
  useEffect(() => {
    setSelectedIndex(0)
  }, [allResults.length])

  const open = useCallback(() => {
    setIsOpen(true)
    setQuery('')
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
  }, [])

  const toggle = useCallback(() => {
    if (isOpen) close()
    else open()
  }, [isOpen, open, close])

  const selectCurrent = useCallback(() => {
    const result = allResults[selectedIndex]
    if (!result) return

    try {
      if (result.type === 'paciente') {
        onNavigate?.('Pacientes')
        // TODO: seleccionar paciente específico (requiere API en pacientesStore)
      } else if (result.type === 'modulo') {
        onNavigate?.(result.data.name)
      } else if (result.type === 'accion') {
        result.data.action?.()
      }
      close()
    } catch (e) {
      log.error('Error al ejecutar comando:', e.message)
    }
  }, [allResults, selectedIndex, onNavigate, close])

  const moveUp = useCallback(() => {
    setSelectedIndex(prev => (prev > 0 ? prev - 1 : allResults.length - 1))
  }, [allResults.length])

  const moveDown = useCallback(() => {
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
