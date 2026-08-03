/**
 * Constantes y Colores para Odontograma Anatómico de 5 Caras (FDI)
 */

export const HALLAZGOS_ANATOMICOS = [
  { id: 'sano', nombre: 'Sano / Normal', color: '#FFFFFF', borde: '#D1D5DB', texto: 'Sano' },
  { id: 'caries', nombre: 'Caries Activa', color: '#EF4444', borde: '#DC2626', texto: '🔴 Caries (Rojo)' },
  { id: 'restauracion_resina', nombre: 'Restauración Resina', color: '#3B82F6', borde: '#2563EB', texto: '🔵 Resina (Azul)' },
  { id: 'restauracion_amalgama', nombre: 'Restauración Amalgama', color: '#6B7280', borde: '#4B5563', texto: '⚪ Amalgama (Gris)' },
  { id: 'endodoncia', nombre: 'Tratamiento de Conducto', color: '#8B5CF6', borde: '#7C3AED', texto: '🟣 Endodoncia (Morado)' },
  { id: 'corona', nombre: 'Corona Prótesis Fija', color: '#F59E0B', borde: '#D97706', texto: '🟡 Corona (Amarillo)' },
  { id: 'implante', nombre: 'Implante Óseointegrado', color: '#10B981', borde: '#059669', texto: '🟢 Implante (Verde)' },
  { id: 'ausente', nombre: 'Pieza Ausente / Exodoncia', color: '#111827', borde: '#000000', texto: '❌ Exodoncia / Ausente' }
]

export const PIEZAS_PERMANENTES_SUPERIOR = ['1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8']
export const PIEZAS_PERMANENTES_INFERIOR = ['4.8', '4.7', '4.6', '4.5', '4.4', '4.3', '4.2', '4.1', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8']
export const PIEZAS_TEMPORALES_SUPERIOR = ['5.5', '5.4', '5.3', '5.2', '5.1', '6.1', '6.2', '6.3', '6.4', '6.5']
export const PIEZAS_TEMPORALES_INFERIOR = ['8.5', '8.4', '8.3', '8.2', '8.1', '7.1', '7.2', '7.3', '7.4', '7.5']