/**
 * SECCIONES_SIDEBAR — Navegación agrupada del Sidebar (F10-B2)
 * Permisos RBAC idénticos al menú original (F3-05).
 * counterKey/counterVariant: API de contadores (datos reales en B2.5).
 */
import {
  Calendar, LayoutDashboard, Users, Siren, Mail,
  Sparkles, FlaskConical, Package, Stethoscope, DollarSign, BarChart3,
  UsersRound, Pill, Settings, FileText, CreditCard
} from 'lucide-react'
import { PERMISOS } from './rbacConstants'

export const SECCIONES_SIDEBAR = [
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
      { name: 'Presupuestos', icon: FileText },
      { name: 'Pagos', icon: CreditCard },
      { name: 'Prestaciones', icon: Stethoscope, permisoRequerido: PERMISOS.EDITAR_PRECIOS },
      { name: 'Finanzas', icon: DollarSign, permisoRequerido: PERMISOS.VER_FINANZAS },
      { name: 'Reportes', icon: BarChart3, permisoRequerido: PERMISOS.VER_REPORTES },
    ],
  },
  {
    label: 'Admin',
    items: [
      { name: 'Miembros', icon: UsersRound, permisoRequerido: PERMISOS.GESTIONAR_USUARIOS },
      { name: 'Vademécum', icon: Pill, permisoRequerido: PERMISOS.ADMINISTRAR_VADEMECUM },
      { name: 'Configuración', icon: Settings, permisoRequerido: PERMISOS.VER_CONFIGURACION },
    ],
  },
]
