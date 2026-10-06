/**
 * SECCIONES_SIDEBAR — Navegación agrupada del Sidebar (F10-B2 / Migración TypeScript)
 * Permisos RBAC idénticos al menú original (F3-05).
 */
import type { LucideIcon } from 'lucide-react'
import {
  Calendar, LayoutDashboard, Users, Siren, Mail,
  Sparkles, FlaskConical, Package, Stethoscope, DollarSign, BarChart3,
  UsersRound, Pill, Settings, FileText, CreditCard
} from 'lucide-react'
import { PERMISOS } from './rbacConstants'
import type { Permiso } from './rbacConstantsBase'

export type CounterVariant = 'info' | 'warning' | 'error' | 'success'

export interface SidebarItem {
  name: string
  icon: LucideIcon
  permisoRequerido?: Permiso
  counterKey?: string
  counterVariant?: CounterVariant
}

export interface SidebarSeccion {
  label: string
  items: SidebarItem[]
}

export const SECCIONES_SIDEBAR: SidebarSeccion[] = [
  {
    label: 'Clínica',
    items: [
      { name: 'Agenda', icon: Calendar, counterKey: 'agenda', counterVariant: 'info' },
      { name: 'Dashboard', icon: LayoutDashboard },
      { name: 'Pacientes', icon: Users, counterKey: 'papelera', counterVariant: 'warning' },
      { name: 'Urgencias y GES', icon: Siren },
      { name: 'Comunicaciones', icon: Mail },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { name: 'Esterilización', icon: Sparkles, permisoRequerido: PERMISOS.VER_ESTERILIZACION },
      { name: 'Laboratorio', icon: FlaskConical, permisoRequerido: PERMISOS.VER_LABORATORIO },
      { name: 'Inventario', icon: Package, permisoRequerido: PERMISOS.VER_INVENTARIO, counterKey: 'inventario', counterVariant: 'error' },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { name: 'Presupuestos', icon: FileText, permisoRequerido: PERMISOS.VER_FINANZAS },
      { name: 'Pagos', icon: CreditCard, permisoRequerido: PERMISOS.VER_FINANZAS },
      { name: 'Prestaciones', icon: Stethoscope, permisoRequerido: PERMISOS.EDITAR_PRECIOS },
      { name: 'Finanzas', icon: DollarSign, permisoRequerido: PERMISOS.VER_FINANZAS },
      { name: 'Reportes', icon: BarChart3, permisoRequerido: PERMISOS.VER_REPORTES },
    ],
  },
  {
    label: 'Admin',
    items: [
      { name: 'Administración DentikOS', icon: Settings, permisoRequerido: PERMISOS.GESTIONAR_USUARIOS },
      { name: 'Vademécum', icon: Pill, permisoRequerido: PERMISOS.ADMINISTRAR_VADEMECUM },
    ],
  },
]
