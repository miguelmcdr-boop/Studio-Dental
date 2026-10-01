/**
 * Utilidades de strings (F10-A7 fix)
 */

/**
 * Elimina emojis de un string.
 * Útil para limpiar datos legacy que tienen emojis como iconos UI.
 *
 * @param {string} text - Texto con posibles emojis
 * @returns {string} Texto sin emojis
 */
export const stripEmojis = (text) => {
  if (!text) return ''
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')  // Emojis principales
    .replace(/[\u{2600}-\u{26FF}]/gu, '')    // Símbolos misceláneos
    .replace(/[\u{2700}-\u{27BF}]/gu, '')    // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')    // Variation selectors
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')  // Extended emojis
    .replace(/\s+/g, ' ')                     // Colapsar espacios múltiples
    .trim()
}
