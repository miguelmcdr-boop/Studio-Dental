/**
 * Logger centralizado con niveles (F6-03).
 * 
 * Reemplaza console.log/error/warn sueltos por una API estructurada.
 * 
 * Uso:
 *   import { createLogger } from '../services/logger'
 *   const log = createLogger('useDataMigration')
 *   log.info('Mensaje informativo')
 *   log.error('Error:', err)
 *   log.warn('Advertencia')
 *   log.debug('Solo visible en desarrollo')
 * 
 * Configuración por entorno:
 * - Desarrollo (DEV=true, MODE!='test'): muestra todos los niveles (DEBUG)
 * - Tests (MODE='test' o TEST=true): muestra solo WARN y ERROR por defecto
 * - Producción: muestra solo WARN y ERROR por defecto
 * - Puede sobrescribirse con VITE_LOG_LEVEL=debug|info|warn|error|none
 * - Para tests específicos: usar globalThis.__LOG_LEVEL__ = 'DEBUG'
 * 
 * Formato de salida:
 *   [nombreModulo] mensaje datos
 *   Ejemplo: [useDataMigration] Migrando pacientes... { pendientes: 5 }
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
}

const getLogLevel = () => {
  // Prioridad 1: Override explícito para tests (globalThis)
  if (typeof globalThis !== 'undefined' && globalThis.__LOG_LEVEL__) {
    const level = String(globalThis.__LOG_LEVEL__).toUpperCase()
    if (LOG_LEVELS[level] !== undefined) {
      return LOG_LEVELS[level]
    }
  }
  
  // Prioridad 2: Override por variable de entorno (producción)
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LOG_LEVEL) {
    const level = import.meta.env.VITE_LOG_LEVEL.toUpperCase()
    if (LOG_LEVELS[level] !== undefined) {
      return LOG_LEVELS[level]
    }
  }
  
  // Prioridad 3: Detectar entorno de test (Vitest configura TEST=true y MODE='test')
  if (typeof import.meta !== 'undefined') {
    const env = import.meta.env
    if (env?.TEST === true || env?.TEST === 'true' || env?.MODE === 'test') {
      return LOG_LEVELS.WARN
    }
    
    // Prioridad 4: Desarrollo real (navegador, no test)
    if (env?.DEV === true) {
      return LOG_LEVELS.DEBUG
    }
  }
  
  // Prioridad 5: Producción por defecto
  return LOG_LEVELS.WARN
}

const shouldLog = (level) => level >= getLogLevel()

export const createLogger = (moduleName) => {
  const prefix = `[${moduleName}]`
  
  return {
    debug: (...args) => {
      if (shouldLog(LOG_LEVELS.DEBUG)) {
        console.debug(prefix, ...args)
      }
    },
    
    info: (...args) => {
      if (shouldLog(LOG_LEVELS.INFO)) {
        console.log(prefix, ...args)
      }
    },
    
    warn: (...args) => {
      if (shouldLog(LOG_LEVELS.WARN)) {
        console.warn(prefix, ...args)
      }
    },
    
    error: (...args) => {
      if (shouldLog(LOG_LEVELS.ERROR)) {
        console.error(prefix, ...args)
      }
    },
  }
}

// Logger por defecto para uso simple (sin módulo específico)
export const logger = createLogger('app')
