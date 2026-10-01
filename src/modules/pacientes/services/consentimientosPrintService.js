import { createLogger } from '../../../services/logger'

const log = createLogger('consentimientosPrintService')

// Reutiliza la misma clase de aislamiento que certificados
// (CSS compartido en index.css)
const CLASE_AISLAMIENTO = 'print-cert-activo'

/**
 * Imprime el consentimiento de forma aislada (M4a).
 *
 * Activa la clase print-cert-activo en body para que el CSS
 * oculte todo el shell de la app y muestre solo el portal del
 * consentimiento. La clase se remueve automáticamente al
 * terminar la impresión (evento afterprint) o si window.print
 * lanza error.
 */
export const imprimirConsentimientoAislado = () => {
  const limpiar = () => {
    document.body.classList.remove(CLASE_AISLAMIENTO)
    window.removeEventListener('afterprint', limpiar)
  }

  document.body.classList.add(CLASE_AISLAMIENTO)
  window.addEventListener('afterprint', limpiar)

  try {
    window.print()
  } catch (e) {
    log.error('Error al imprimir consentimiento:', e)
    limpiar()
  }
}
