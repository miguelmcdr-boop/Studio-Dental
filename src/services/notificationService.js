/**
 * Servicio centralizado de notificaciones (F5-05).
 *
 * Gestiona toasts del sistema en memoria. Los componentes consumen vía
 * el hook useNotifications. El servicio es un singleton con estado mutable.
 *
 * API pública:
 * - mostrar(mensaje, opciones) → { id, dismiss }
 * - ocultar(id) → remueve notificación
 * - limpiar() → remueve todas
 * - listar() → retorna notificaciones actuales
 * - suscribir(callback) → recibe cambios de estado
 *
 * Tipos de toast:
 * - info (azul, 3s) - cambios de otros usuarios
 * - success (verde, 3s) - operaciones exitosas
 * - warning (amarillo, 5s) - advertencias
 * - error (rojo, 7s + requiere dismiss) - errores críticos
 *
 * Límite: máximo 3 toasts visibles simultáneamente.
 */

const MAX_VISIBLES = 3

// Estado interno
let notificaciones = []
const listeners = new Set()

// Duraciones por tipo (ms)
const DURACION_POR_TIPO = {
  info: 3000,
  success: 3000,
  warning: 5000,
  error: 7000
}

/**
 * Genera ID único para cada notificación.
 */
const generarId = () => {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Notifica a todos los suscriptores del cambio de estado.
 */
const notificar = () => {
  const copia = [...notificaciones]
  listeners.forEach((cb) => {
    try {
      cb(copia)
    } catch (e) {
      console.error('[notificationService] Error en listener:', e)
    }
  })
}

/**
 * Agrega una notificación al sistema.
 *
 * @param {string} mensaje - Texto principal del toast
 * @param {Object} opciones - Opciones adicionales
 * @param {'info'|'success'|'warning'|'error'} opciones.tipo - Tipo de toast (default: 'info')
 * @param {number} opciones.duracion - Duración en ms (default: según tipo)
 * @param {string} opciones.titulo - Título opcional
 * @param {boolean} opciones.dismissable - Si se puede cerrar manualmente (default: true)
 * @returns {{ id: string, dismiss: Function }} Objeto con ID y función dismiss
 */
export const mostrar = (mensaje, opciones = {}) => {
  const {
    tipo = 'info',
    duracion = DURACION_POR_TIPO[tipo] || 3000,
    titulo = null,
    dismissable = true
  } = opciones

  const id = generarId()

  const nuevaNotificacion = {
    id,
    tipo,
    mensaje,
    titulo,
    dismissable,
    timestamp: Date.now()
  }

  // Respetar máximo de visibles: remover la más antigua si hay espacio lleno
  if (notificaciones.length >= MAX_VISIBLES) {
    notificaciones = notificaciones.slice(1)
  }

  notificaciones = [...notificaciones, nuevaNotificacion]
  notificar()

  // Auto-dismiss si duración > 0
  if (duracion > 0) {
    setTimeout(() => {
      ocultar(id)
    }, duracion)
  }

  return {
    id,
    dismiss: () => ocultar(id)
  }
}

/**
 * Remueve una notificación por ID.
 *
 * @param {string} id - ID de la notificación a remover
 */
export const ocultar = (id) => {
  const largoAntes = notificaciones.length
  notificaciones = notificaciones.filter((n) => n.id !== id)

  if (notificaciones.length !== largoAntes) {
    notificar()
  }
}

/**
 * Remueve todas las notificaciones.
 */
export const limpiar = () => {
  if (notificaciones.length > 0) {
    notificaciones = []
    notificar()
  }
}

/**
 * Retorna una copia de las notificaciones actuales.
 */
export const listar = () => {
  return [...notificaciones]
}

/**
 * Suscribe un callback a cambios de estado.
 *
 * @param {Function} callback - Función a invocar con la lista de notificaciones
 * @returns {Function} Función para desuscribirse
 */
export const suscribir = (callback) => {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

/**
 * Atajos para tipos comunes.
 */
export const notificarInfo = (mensaje, opciones = {}) =>
  mostrar(mensaje, { ...opciones, tipo: 'info' })

export const notificarExito = (mensaje, opciones = {}) =>
  mostrar(mensaje, { ...opciones, tipo: 'success' })

export const notificarAdvertencia = (mensaje, opciones = {}) =>
  mostrar(mensaje, { ...opciones, tipo: 'warning' })

export const notificarError = (mensaje, opciones = {}) =>
  mostrar(mensaje, { ...opciones, tipo: 'error' })

/**
 * Servicio exportado como objeto para consistencia.
 */
export const notificationService = {
  mostrar,
  ocultar,
  limpiar,
  listar,
  suscribir,
  info: notificarInfo,
  success: notificarExito,
  warning: notificarAdvertencia,
  error: notificarError
}
