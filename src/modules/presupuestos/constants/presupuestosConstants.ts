/**
 * Constantes y Estados para el Módulo de Presupuestos Avanzado
 */

export interface EstadoPresupuestoConfig {
  id: string
  nombre: string
  colorBg: string
  colorText: string
  colorBorder: string
}

export interface OpcionCuota {
  cuotas: number
  nombre: string
}

export interface PresupuestoItemDefault {
  id: number
  prestacion: string
  pieza: string
  valor: number
}

export interface PresupuestoDefault {
  id: number
  folio: string
  pacienteId: number
  pacienteNombre: string
  pacienteRut: string
  fechaEmision: string
  vigenciaDias: number
  convenio: string
  montoTotal: number
  montoAbonado: number
  estado: string
  items: PresupuestoItemDefault[]
  observacion: string
}

export const ESTADOS_PRESUPUESTO: readonly EstadoPresupuestoConfig[] = [
  { id: 'Borrador', nombre: 'Borrador', colorBg: 'bg-gray-100', colorText: 'text-gray-800', colorBorder: 'border-gray-300' },
  { id: 'Emitido', nombre: 'Emitido / Entregado', colorBg: 'bg-blue-50', colorText: 'text-blue-800', colorBorder: 'border-blue-300' },
  { id: 'Aprobado', nombre: 'Aprobado por Paciente', colorBg: 'bg-emerald-50', colorText: 'text-emerald-800', colorBorder: 'border-emerald-300' },
  { id: 'EnTratamiento', nombre: 'En Tratamiento', colorBg: 'bg-purple-50', colorText: 'text-purple-800', colorBorder: 'border-purple-300' },
  { id: 'Rechazado', nombre: 'Rechazado / Vencido', colorBg: 'bg-red-50', colorText: 'text-red-800', colorBorder: 'border-red-300' }
]

export const OPCIONES_CUOTAS: readonly OpcionCuota[] = [
  { cuotas: 1, nombre: 'Pago Contado (1 Cuota)' },
  { cuotas: 3, nombre: '3 Cuotas Precio Contado' },
  { cuotas: 6, nombre: '6 Cuotas Mensuales' },
  { cuotas: 12, nombre: '12 Cuotas Mensuales' }
]

export const PRESUPUESTOS_DEFAULT: readonly PresupuestoDefault[] = [
  {
    id: 101,
    folio: 'PRES-2026-101',
    pacienteId: 1,
    pacienteNombre: 'Camila Silva Morales',
    pacienteRut: '18.452.123-K',
    fechaEmision: '2026-08-01',
    vigenciaDias: 30,
    convenio: 'Isapre',
    montoTotal: 320000,
    montoAbonado: 100000,
    estado: 'EnTratamiento',
    items: [
      { id: 1, prestacion: 'Corona de Zirconio Monolítico / E-Max', pieza: '1.1', valor: 280000 },
      { id: 2, prestacion: 'Limpieza Dental UDA + Destartraje', pieza: 'General', valor: 40000 }
    ],
    observacion: 'Plan de rehabilitación estética sector anterior. Incluye garantía de 1 año.'
  }
]
