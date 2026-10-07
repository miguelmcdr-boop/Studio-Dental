/**
 * ACCIONES_POR_MODULO — Definición de acciones contextuales por módulo del Blueprint 03
 * Sistema híbrido: Acción primaria con gradiente dorado + secundarias en menú ⋯
 */
import {
  Calendar,
  UserPlus,
  BarChart3,
  Filter,
  Lock,
  Plus,
  CreditCard,
  FileText,
  Package,
  AlertTriangle,
  Sparkles,
  Tag,
  Siren,
  ShieldAlert,
  Search,
  Layers,
  type LucideIcon,
} from 'lucide-react'

export interface AccionContextualConfig {
  label: string
  icon: LucideIcon
  actionKey: string
}

export interface AccionesPorModuloConfig {
  primaria: AccionContextualConfig
  secundarias: AccionContextualConfig[]
}

export const ACCIONES_POR_MODULO: Record<string, AccionesPorModuloConfig> = {
  Dashboard: {
    primaria: { label: 'Nuevo paciente', icon: UserPlus, actionKey: 'crearPaciente' },
    secundarias: [
      { label: 'Nueva cita', icon: Calendar, actionKey: 'crearCita' },
      { label: 'Reportes', icon: BarChart3, actionKey: 'abrirReportes' },
    ],
  },
  Agenda: {
    primaria: { label: 'Nueva cita', icon: Calendar, actionKey: 'crearCita' },
    secundarias: [
      { label: 'Filtrar agenda', icon: Filter, actionKey: 'filtrarAgenda' },
      { label: 'Bloquear horario', icon: Lock, actionKey: 'bloquearHorario' },
    ],
  },
  Pacientes: {
    primaria: { label: 'Nuevo paciente', icon: UserPlus, actionKey: 'crearPaciente' },
    secundarias: [
      { label: 'Nuevo presupuesto', icon: FileText, actionKey: 'crearPresupuesto' },
    ],
  },
  Pagos: {
    primaria: { label: 'Registrar pago', icon: CreditCard, actionKey: 'registrarPago' },
    secundarias: [
      { label: 'Comprobante', icon: FileText, actionKey: 'comprobante' },
    ],
  },
  Inventario: {
    primaria: { label: 'Añadir ítem', icon: Plus, actionKey: 'nuevoItem' },
    secundarias: [
      { label: 'Ajuste de stock', icon: Package, actionKey: 'ajusteStock' },
      { label: 'Alerta crítica', icon: AlertTriangle, actionKey: 'alertaStock' },
    ],
  },
  Esterilización: {
    primaria: { label: 'Nuevo ciclo', icon: Sparkles, actionKey: 'nuevoCiclo' },
    secundarias: [
      { label: 'Etiquetas', icon: Tag, actionKey: 'etiquetas' },
    ],
  },
  'Urgencias GES': {
    primaria: { label: 'Ingreso GES', icon: Siren, actionKey: 'ingresoGes' },
    secundarias: [
      { label: 'Garantías MINSAL', icon: ShieldAlert, actionKey: 'garantias' },
    ],
  },
  'Urgencias y GES': {
    primaria: { label: 'Ingreso GES', icon: Siren, actionKey: 'ingresoGes' },
    secundarias: [
      { label: 'Garantías MINSAL', icon: ShieldAlert, actionKey: 'garantias' },
    ],
  },
  Vademécum: {
    primaria: { label: 'Buscar fármaco', icon: Search, actionKey: 'buscarFarmaco' },
    secundarias: [
      { label: 'Interacciones', icon: Layers, actionKey: 'interacciones' },
    ],
  },
}
