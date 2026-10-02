/**
 * Constantes de Diseño Digital de Sonrisa (DSD)
 */

export interface TonoVita {
  id: string
  nombre: string
  hex: string
}

export interface FormaDentaria {
  id: string
  nombre: string
  desc: string
}

export interface ProporcionDoradaTeorica {
  incisivoCentralAnchoAlto: number
  visibilidadCentral: number
  visibilidadLateral: number
  visibilidadCanino: number
}

export const GUIA_TONOS_VITA: readonly TonoVita[] = [
  { id: 'BL1', nombre: 'BL1 (Bleach Hollywood Extra)', hex: '#FFFFFF' },
  { id: 'BL2', nombre: 'BL2 (Bleach Natural)', hex: '#FDFBF7' },
  { id: 'A1', nombre: 'A1 (Blanco Brillante)', hex: '#FAF6ED' },
  { id: 'A2', nombre: 'A2 (Marfil Estándar)', hex: '#F5EFE0' },
  { id: 'A3', nombre: 'A3 (Cálido Natural)', hex: '#EFE5CE' },
  { id: 'B1', nombre: 'B1 (Claro Luminoso)', hex: '#FAF7EE' },
  { id: 'B2', nombre: 'B2 (Marfil Cálido)', hex: '#F3E8CE' }
]

export const FORMAS_DENTARIAS: readonly FormaDentaria[] = [
  { id: 'ovoidal', nombre: 'Ovoidal / Suave / Femenino', desc: 'Líneas curvas, ángulos incisales redondeados.' },
  { id: 'cuadrada', nombre: 'Cuadrada / Recta / Masculino', desc: 'Ángulos rectos definidos, bordes planos.' },
  { id: 'triangular', nombre: 'Triangular / Estilizado', desc: 'Cérvix estrecho con divergencia incisal prominente.' }
]

export const PROPORCION_DORADA_TEORICA: ProporcionDoradaTeorica = {
  incisivoCentralAnchoAlto: 0.80, // 80% relación ancho/alto ideal
  visibilidadCentral: 1.618,
  visibilidadLateral: 1.0,
  visibilidadCanino: 0.618
}
