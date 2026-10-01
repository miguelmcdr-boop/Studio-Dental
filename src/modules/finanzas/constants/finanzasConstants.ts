/**
 * Constantes y Enumeraciones para el Módulo de Finanzas Avanzado
 */

export interface ConvenioConfig {
  id: string
  nombre: string
  descuentoDefecto: number
  descripcion: string
}

export interface MetodoPagoOpcion {
  id: string
  nombre: string
  comisionPct: number
}

export const CONVENIOS_DEFAULT: readonly ConvenioConfig[] = [
  { id: 'particular', nombre: 'Particular', descuentoDefecto: 0, descripcion: 'Tarifa general sin descuento' },
  { id: 'fonasa', nombre: 'Fonasa (Tramo B, C, D)', descuentoDefecto: 15, descripcion: 'Descuento institucional Fonasa' },
  { id: 'isapre', nombre: 'Isapre (Banmédica / Colmena / Consalud)', descuentoDefecto: 20, descripcion: 'Convenio libre elección' },
  { id: 'empresa', nombre: 'Convenio Corporativo / Empresa', descuentoDefecto: 25, descripcion: 'Descuento por planilla corporativa' }
]

export const CATEGORIAS_EGRESO: readonly string[] = [
  'Insumos Odontológicos (Casa Dental)',
  'Laboratorio Dental',
  'Arriendo / Servicios Básicos / Gastos Comunes',
  'Pago Honorarios Especialista / Cirujano',
  'Sueldos Personal / TENS / Recepción',
  'Mantenimiento Equipos / Autoclave',
  'Impuestos / Contabilidad',
  'Otros Gastos Operativos'
]

export const CATEGORIAS_INGRESO: readonly string[] = [
  'Abono Tratamiento Paciente',
  'Pago Presupuesto Completo',
  'Reembolso Convenio / Seguro / Isapre',
  'Otros Ingresos'
]

export const METODOS_PAGO_OPCIONES: readonly MetodoPagoOpcion[] = [
  { id: 'Efectivo', nombre: 'Efectivo', comisionPct: 0 },
  { id: 'Débito', nombre: 'Tarjeta Débito (POS / Transbank)', comisionPct: 1.2 },
  { id: 'Crédito', nombre: 'Tarjeta Crédito (POS / Transbank)', comisionPct: 2.1 },
  { id: 'Transferencia', nombre: 'Transferencia Bancaria', comisionPct: 0 },
  { id: 'Cheque', nombre: 'Cheque', comisionPct: 0 }
]

export const PORCENTAJE_RETENCION_HONORARIOS_DEFAULT = 13.75
