/**
 * Utilidades de manipulación de cadenas de texto (F10-A7 fix / Migración TypeScript)
 */

/**
 * Tipo aceptado para funciones de procesamiento de texto seguro.
 */
export type StringInput = string | null | undefined

/**
 * Elimina emojis de un string y colapsa espacios múltiples.
 * Útil para limpiar datos legacy que tienen emojis como iconos UI.
 *
 * @param text - Texto con posibles emojis
 * @returns Texto normalizado sin emojis
 */
export const stripEmojis = (text: StringInput): string => {
  if (!text) return ''
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis principales
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Símbolos misceláneos
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation selectors
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '') // Extended emojis
    .replace(/\s+/g, ' ') // Colapsar espacios múltiples
    .trim()
}
