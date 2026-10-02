/**
 * Esquema y Modelo de Datos Periodontal (Migración TypeScript)
 * Contrato de datos para cada pieza dental y estructura para el historial evolutivo por controles.
 */

export interface MedidasSitiosString {
  mv: string
  v: string
  dv: string
  mp: string
  p: string
  dp: string
}

export interface MedidasSitiosBoolean {
  mv: boolean
  v: boolean
  dv: boolean
  mp: boolean
  p: boolean
  dp: boolean
}

export interface KeratinizedGingiva {
  v: string
  p: string
}

export interface PiezaPeriodontal {
  sondaje: MedidasSitiosString
  recesion: MedidasSitiosString
  sangrado: MedidasSitiosBoolean
  placa: MedidasSitiosBoolean
  supuracion: MedidasSitiosBoolean
  movilidad: string
  furca: string
  implante: boolean
  ausente: boolean
  keratinizedGingiva: KeratinizedGingiva
}

export interface ControlPeriodontal {
  id: string | number
  fecha: string
  observacion: string
  piezas: Record<string, PiezaPeriodontal>
}

export const crearPiezaVaciaSchema = (): PiezaPeriodontal => ({
  sondaje: { mv: '', v: '', dv: '', mp: '', p: '', dp: '' },
  recesion: { mv: '', v: '', dv: '', mp: '', p: '', dp: '' },
  sangrado: { mv: false, v: false, dv: false, mp: false, p: false, dp: false },
  placa: { mv: false, v: false, dv: false, mp: false, p: false, dp: false },
  supuracion: { mv: false, v: false, dv: false, mp: false, p: false, dp: false },
  movilidad: '0',
  furca: '0',
  implante: false,
  ausente: false,
  keratinizedGingiva: { v: '', p: '' },
})

export const crearControlPeriodontalSchema = (
  id: string | number = Date.now(),
  observacion: string = 'Control Inicial'
): ControlPeriodontal => ({
  id,
  fecha: new Date().toLocaleDateString('es-CL'),
  observacion,
  piezas: {},
})
