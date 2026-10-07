/**
 * Utilidades para conectar formularios al ciclo de vida de guardado del TopBar
 * BP03 §08 Feature 3
 */
import { useTopBarStore } from '../../app/stores/useTopBarStore'

export const markFormDirty = (): void => {
  useTopBarStore.getState().setIsDirty(true)
}

export const markFormSaved = (): void => {
  useTopBarStore.getState().markSaved()
}
