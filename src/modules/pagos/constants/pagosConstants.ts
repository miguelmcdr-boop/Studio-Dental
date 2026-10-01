/**
 * Constantes Gold Standard para Pagos, DTE SII y Recaudación Clínica
 */

export interface TipoDocumentoTributario {
  id: string
  nombre: string
  retencionPct: number
}

export interface MetodoPagoGold {
  id: string
  nombre: string
  comisionPct: number
}

export interface PagoDefault {
  id: number
  folioComprobante: string
  tipoDTE: string
  folioDTE: string
  pacienteId: number
  pacienteNombre: string
  pacienteRut: string
  fecha: string
  hora: string
  monto: number
  metodoPago: string
  concepto: string
  estado: string
  prestacionesImputadas: string[]
  emitidoPor: string
  observacion: string
}

export const TIPOS_DOCUMENTO_TRIBUTARIO: readonly TipoDocumentoTributario[] = [
  { id: 'boleta_honorarios', nombre: 'Boleta de Honorarios Electrónica (SII)', retencionPct: 13.75 },
  { id: 'boleta_exenta', nombre: 'Boleta Electrónica Exenta (SII)', retencionPct: 0 },
  { id: 'bono_imed', nombre: 'Bono I-Med / Fonasa / Isapre', retencionPct: 0 },
  { id: 'recibo_interno', nombre: 'Recibo de Dinero Interno (Sin DTE)', retencionPct: 0 }
]

export const METODOS_PAGO_GOLD: readonly MetodoPagoGold[] = [
  { id: 'Efectivo', nombre: 'Efectivo', comisionPct: 0 },
  { id: 'Débito', nombre: 'Tarjeta Débito (POS / Transbank)', comisionPct: 1.2 },
  { id: 'Crédito', nombre: 'Tarjeta Crédito (POS / Transbank)', comisionPct: 2.1 },
  { id: 'Transferencia', nombre: 'Transferencia Bancaria', comisionPct: 0 },
  { id: 'Cheque', nombre: 'Cheque al Día / Fecha', comisionPct: 0 }
]

export const CONCEPTOS_PAGO: readonly string[] = [
  'Abono Plan de Tratamiento',
  'Pago Total Tratamiento',
  'Consulta Clínica / Diagnóstico',
  'Atención de Urgencia',
  'Copago Fonasa / Isapre',
  'Venta Insumo / Kit Higiene'
]

export const PAGOS_DEFAULT: readonly PagoDefault[] = [
  {
    id: 1001,
    folioComprobante: 'REC-2026-8801',
    tipoDTE: 'boleta_honorarios',
    folioDTE: 'BH-452',
    pacienteId: 1,
    pacienteNombre: 'Camila Silva Morales',
    pacienteRut: '18.452.123-K',
    fecha: new Date().toLocaleDateString('es-CL'),
    hora: '10:30',
    monto: 100000,
    metodoPago: 'Transferencia',
    concepto: 'Abono Plan de Tratamiento',
    estado: 'Emitido',
    prestacionesImputadas: ['Corona Zirconio (Pieza 1.1)'],
    emitidoPor: 'Dr. Miguel Díaz',
    observacion: 'Transferencia verificada en Banco de Chile.'
  }
]
