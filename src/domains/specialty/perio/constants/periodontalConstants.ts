/**
 * Constantes del Dominio Periodontal
 * Define nomenclaturas anatómicas, límites clínicos y clasificación anatómica de raíces.
 */

export interface SitioPeriodontal {
  id: string
  label: string
}

export interface LimitesSondajeConfig {
  MIN: number
  MAX: number
  UMBRAL_SACO_MODERADO: number
  UMBRAL_SACO_SEVERO: number
}

export const ARCADA_SUPERIOR: readonly string[] = [
  '1.8','1.7','1.6','1.5','1.4','1.3','1.2','1.1',
  '2.1','2.2','2.3','2.4','2.5','2.6','2.7','2.8'
]

export const ARCADA_INFERIOR: readonly string[] = [
  '4.8','4.7','4.6','4.5','4.4','4.3','4.2','4.1',
  '3.1','3.2','3.3','3.4','3.5','3.6','3.7','3.8'
]

export const SITIOS_VESTIBULAR: readonly SitioPeriodontal[] = [
  { id: 'mv', label: 'MV' },
  { id: 'v',  label: 'V' },
  { id: 'dv', label: 'DV' }
]

export const SITIOS_PALATINO_LINGUAL: readonly SitioPeriodontal[] = [
  { id: 'mp', label: 'MP/ML' },
  { id: 'p',  label: 'P/L' },
  { id: 'dp', label: 'DP/DL' }
]

export const SITIOS_TOTALES: readonly SitioPeriodontal[] = [...SITIOS_VESTIBULAR, ...SITIOS_PALATINO_LINGUAL]

export const DIENTES_MULTIRRADICULARES: readonly string[] = [
  '1.8','1.7','1.6','1.4',
  '2.4','2.6','2.7','2.8',
  '3.8','3.7','3.6',
  '4.6','4.7','4.8'
]

export const LIMITES_SONDAJE: LimitesSondajeConfig = {
  MIN: 0,
  MAX: 12,
  UMBRAL_SACO_MODERADO: 4,
  UMBRAL_SACO_SEVERO: 6
}

export const OPCIONES_MOVILIDAD: readonly string[] = ['0', '1', '2', '3']
export const OPCIONES_FURCA: readonly string[] = ['0', '1', '2', '3']
