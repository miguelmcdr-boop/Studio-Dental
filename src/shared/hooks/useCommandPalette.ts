/**
 * useCommandPalette — Hook omnicanal con 6 categorías del Blueprint 03
 * Pacientes, Citas, Módulos, Acciones, Configuración y Documentos
 */
import { useState, useMemo, useCallback, useEffect } from 'react'
import { usePacientesStore } from '../../app/stores/pacientesStore'
import { useSesionStore } from '../../app/stores/sesionStore'
import { useSidebarStore } from '../../app/stores/useSidebarStore'
import { useTopBarStore } from '../../app/stores/useTopBarStore'
import { useRBAC } from './useRBAC'
import { SECCIONES_SIDEBAR, type SidebarItem } from '../../constants/sidebarConstants'
import { agendaStorageService } from '../../domains/operations/agenda/services/agendaStorageService'
import { fuzzyMatch } from '../utils/fuzzyMatch'
import { playSound } from '../utils/soundEffects'
import type { Paciente } from '../../domains/clinical/patient/schemas/pacienteSchema'

export type CategoriaPalette = 'pacientes' | 'citas' | 'modulos' | 'acciones' | 'configuracion' | 'documentos'

export interface PaletteItem {
  id: string
  label: string
  sublabel?: string
  categoria: CategoriaPalette
  iconName?: string
  action: () => void
}

export interface UseCommandPaletteProps {
  onNavigate?: (modulo: string) => void
  onCreateCita?: () => void
  onCreatePaciente?: () => void
  onCreatePresupuesto?: () => void
  onSelectPaciente?: (paciente: Paciente) => void
  onOpenAtajos?: () => void
}

export const useCommandPalette = ({
  onNavigate,
  onCreateCita,
  onCreatePaciente,
  onCreatePresupuesto,
  onSelectPaciente,
  onOpenAtajos,
}: UseCommandPaletteProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const pacientes = usePacientesStore((s) => s.pacientes)
  const { puede } = useRBAC()
  const toggleFocusMode = useSidebarStore((s) => s.toggleFocusMode)
  const setPresentationMode = useTopBarStore((s) => s.setPresentationMode)

  // 1. Pacientes (top 4)
  const pacientesItems = useMemo((): PaletteItem[] => {
    const lista = !query.trim() ? (pacientes || []).slice(0, 4) : (pacientes || []).filter(
      (p) => fuzzyMatch(p.nombre, query) || fuzzyMatch(p.rut, query) || fuzzyMatch(p.telefono != null ? String(p.telefono) : '', query)
    ).slice(0, 4)

    return lista.map((p) => ({
      id: `pac-${p.id}`,
      label: p.nombre,
      sublabel: `RUT: ${p.rut || 'S/R'} · Tel: ${p.telefono != null ? String(p.telefono) : 'S/T'}`,
      categoria: 'pacientes',
      action: () => {
        onNavigate?.('Pacientes')
        onSelectPaciente?.(p)
        const sesion = useSesionStore.getState() as { agregarPacienteReciente?: (pac: Paciente) => void }
        sesion.agregarPacienteReciente?.(p)
      },
    }))
  }, [pacientes, query, onNavigate, onSelectPaciente])

  // 2. Citas (top 3)
  const citasItems = useMemo((): PaletteItem[] => {
    let citas: Array<{ id?: string | number; pacienteNombre?: string; motivo?: string; fecha?: string; hora?: string; horaInicio?: string }> = []
    try {
      citas = agendaStorageService.obtenerCitas() || []
    } catch { citas = [] }

    const filtradas = !query.trim() ? citas.slice(0, 3) : citas.filter(
      (c) => fuzzyMatch(c.pacienteNombre, query) || fuzzyMatch(c.motivo, query)
    ).slice(0, 3)

    return filtradas.map((c) => ({
      id: `cita-${c.id || Math.random()}`,
      label: c.pacienteNombre ? `Cita: ${c.pacienteNombre}` : `Cita: ${c.motivo || 'General'}`,
      sublabel: `${c.fecha || ''} a las ${c.hora || c.horaInicio || ''} · ${c.motivo || ''}`,
      categoria: 'citas',
      action: () => onNavigate?.('Agenda'),
    }))
  }, [query, onNavigate])

  // 3. Módulos
  const modulosItems = useMemo((): PaletteItem[] => {
    const permitidos = SECCIONES_SIDEBAR.flatMap((s) => s.items).filter(
      (item) => !item.permisoRequerido || puede(item.permisoRequerido)
    )
    const filtrados = !query.trim() ? permitidos.slice(0, 5) : permitidos.filter(
      (m) => fuzzyMatch(m.name, query) || (m.slug && fuzzyMatch(m.slug, query))
    )

    return filtrados.map((m) => ({
      id: `mod-${m.slug}`,
      label: m.name,
      sublabel: 'Navegación directa',
      categoria: 'modulos',
      action: () => onNavigate?.(m.name),
    }))
  }, [puede, query, onNavigate])

  // 4. Acciones directas
  const accionesItems = useMemo((): PaletteItem[] => {
    const list: PaletteItem[] = [
      { id: 'acc-cita', label: 'Nueva cita médica', sublabel: 'Agendar cita en box', categoria: 'acciones', action: () => onCreateCita?.() },
      { id: 'acc-pac', label: 'Nuevo paciente', sublabel: 'Ficha de ingreso rápido', categoria: 'acciones', action: () => onCreatePaciente?.() },
      { id: 'acc-pres', label: 'Nuevo presupuesto', sublabel: 'Plan de tratamiento', categoria: 'acciones', action: () => onCreatePresupuesto?.() },
    ]
    return !query.trim() ? list : list.filter((a) => fuzzyMatch(a.label, query))
  }, [query, onCreateCita, onCreatePaciente, onCreatePresupuesto])

  // 5. Configuración
  const configItems = useMemo((): PaletteItem[] => {
    const list: PaletteItem[] = [
      { id: 'cfg-foco', label: 'Alternar Modo Foco', sublabel: 'Atajo ⌘⇧F', categoria: 'configuracion', action: () => toggleFocusMode() },
      { id: 'cfg-pres', label: 'Modo Presentación Paciente', sublabel: 'Atajo ⌘⇧M', categoria: 'configuracion', action: () => setPresentationMode(true) },
      { id: 'cfg-atajos', label: 'Ver Atajos de Teclado', sublabel: 'Atajo ?', categoria: 'configuracion', action: () => onOpenAtajos?.() },
    ]
    return !query.trim() ? list : list.filter((c) => fuzzyMatch(c.label, query))
  }, [query, toggleFocusMode, setPresentationMode, onOpenAtajos])

  // 6. Documentos
  const docsItems = useMemo((): PaletteItem[] => {
    const list: PaletteItem[] = [
      { id: 'doc-presup', label: 'Presupuestos clínicos', sublabel: 'Planes comerciales', categoria: 'documentos', action: () => onNavigate?.('Presupuestos') },
      { id: 'doc-recetas', label: 'Recetas & Vademécum', sublabel: 'Fármacos oficiales', categoria: 'documentos', action: () => onNavigate?.('Vademécum') },
    ]
    return !query.trim() ? list : list.filter((d) => fuzzyMatch(d.label, query))
  }, [query, onNavigate])

  // Todos los resultados unificados
  const allResults = useMemo((): PaletteItem[] => [
    ...pacientesItems,
    ...citasItems,
    ...modulosItems,
    ...accionesItems,
    ...configItems,
    ...docsItems,
  ], [pacientesItems, citasItems, modulosItems, accionesItems, configItems, docsItems])

  useEffect(() => { setSelectedIndex(0) }, [allResults.length])

  const open = useCallback(() => {
    playSound('openPalette')
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
    const item = allResults[selectedIndex]
    if (!item) return
    playSound('selectResult')
    item.action()
    close()
  }, [allResults, selectedIndex, close])

  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allResults.length - 1))
  }, [allResults.length])

  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => (prev < allResults.length - 1 ? prev + 1 : 0))
  }, [allResults.length])

  return {
    isOpen,
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    allResults,
    open,
    close,
    toggle,
    selectCurrent,
    moveUp,
    moveDown,
  }
}
