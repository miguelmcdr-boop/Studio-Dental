/**
 * Repositorio genérico de persistencia en LocalStorage.
 * Tarea MASTER_ROADMAP: F2-03
 *
 * Extrae el patrón try/catch + JSON.parse/JSON.stringify que estaba
 * duplicado en los 14 `*StorageService.js` de módulo. No reemplaza la
 * lógica de dominio de cada servicio (sincronizaciones cruzadas, eventos
 * custom, validaciones) — solo la lectura/escritura mecánica de una clave
 * de LocalStorage.
 *
 * Cumple el Cap. VII.4 de la Constitución de Arquitectura (try/catch
 * obligatorio en toda llamada a LocalStorage/IndexedDB).
 */

/**
 * Lee y parsea de forma segura una clave de LocalStorage.
 * @param {string} key - Clave de LocalStorage a leer.
 * @param {*} fallback - Valor a retornar si la clave no existe o el JSON está corrupto.
 * @returns {*} El valor parseado, o `fallback` si no existe/falla el parseo.
 */
export const leerJSON = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key)
    return saved !== null ? JSON.parse(saved) : fallback
  } catch (e) {
    console.error(`Error al leer "${key}" desde localStorage:`, e)
    return fallback
  }
}

/**
 * Escribe de forma segura un valor serializable en una clave de LocalStorage.
 * @param {string} key - Clave de LocalStorage a escribir.
 * @param {*} value - Valor serializable a guardar (se aplica JSON.stringify).
 * @param {{ notify?: boolean, eventos?: string[] }} [opciones] - `notify` dispara
 *   el evento nativo `storage` (para sincronía entre pestañas/módulos);
 *   `eventos` dispara además CustomEvents adicionales por nombre.
 * @returns {boolean} `true` si la escritura fue exitosa, `false` si falló.
 */
export const escribirJSON = (key, value, opciones = {}) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    if (opciones.notify) {
      window.dispatchEvent(new Event('storage'))
    }
    ;(opciones.eventos || []).forEach((nombreEvento) => {
      window.dispatchEvent(new CustomEvent(nombreEvento))
    })
    return true
  } catch (e) {
    console.error(`Error al guardar "${key}" en localStorage:`, e)
    return false
  }
}

/**
 * Crea un repositorio ligado a una clave fija de LocalStorage.
 * Uso previsto: el caso común de los `*StorageService.js` de módulo, donde
 * cada dato de dominio (citas, pacientes, movimientos, etc.) vive bajo una
 * única clave conocida en tiempo de definición del servicio.
 *
 * @param {string} key - Clave de LocalStorage.
 * @param {*} defaultValue - Valor por defecto si la clave no existe o el dato está corrupto.
 * @param {{ notify?: boolean, eventos?: string[] }} [opciones] - Eventos a emitir tras cada `guardar`.
 * @returns {{
 *   key: string,
 *   obtener: (fallback?: *) => *,
 *   guardar: (value: *) => boolean
 * }}
 */
export const createLocalStorageRepository = (key, defaultValue, opciones = {}) => ({
  key,
  obtener: (fallback = defaultValue) => leerJSON(key, fallback),
  guardar: (value) => escribirJSON(key, value, opciones),
})