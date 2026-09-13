import { createLogger } from '../../../services/logger'

const log = createLogger('certificadosPrintService')

const CLASE_AISLAMIENTO = 'print-cert-activo'

/**
 * Imprime el certificado de forma aislada (M2a).
 *
 * Activa la clase print-cert-activo en body para que el CSS
 * oculte todo el shell de la app y muestre solo el portal del
 * certificado. La clase se remueve automáticamente al terminar
 * la impresión (evento afterprint) o si window.print lanza error.
 */
export const imprimirCertificadoAislado = () => {
  const limpiar = () => {
    document.body.classList.remove(CLASE_AISLAMIENTO)
    window.removeEventListener('afterprint', limpiar)
  }

  document.body.classList.add(CLASE_AISLAMIENTO)
  window.addEventListener('afterprint', limpiar)

  try {
    window.print()
  } catch (e) {
    log.error('Error al imprimir certificado:', e)
    limpiar()
  }
}
