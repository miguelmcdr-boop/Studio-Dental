/**
 * Servicio de Persistencia y Copias de Seguridad (Backup / Restore)
 */

const KEY_CLINICA = 'studio_dental_config_clinica'
const KEY_PARAMETROS_AGENDA = 'studio_dental_config_agenda'

export const configuracionStorageService = {
  obtenerClinica: (defaults) => {
    try {
      const saved = localStorage.getItem(KEY_CLINICA)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error('Error al leer datos de la clínica:', e)
      return defaults
    }
  },

  guardarClinica: (datos) => {
    try {
      localStorage.setItem(KEY_CLINICA, JSON.stringify(datos))
      window.dispatchEvent(new Event('storage'))
    } catch (e) {
      console.error('Error al guardar datos de la clínica:', e)
    }
  },

  obtenerParametrosAgenda: (defaults) => {
    try {
      const saved = localStorage.getItem(KEY_PARAMETROS_AGENDA)
      return saved ? JSON.parse(saved) : defaults
    } catch (e) {
      console.error(e)
      return defaults
    }
  },

  guardarParametrosAgenda: (parametros) => {
    try {
      localStorage.setItem(KEY_PARAMETROS_AGENDA, JSON.stringify(parametros))
    } catch (e) {
      console.error(e)
    }
  },

  exportarBaseDeDatosCompleta: () => {
    const backupObj = {
      versionSystem: '3.0.0',
      fechaExportacion: new Date().toISOString(),
      localStorageData: {}
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      backupObj.localStorageData[key] = localStorage.getItem(key)
    }

    return backupObj
  },

  importarBaseDeDatosCompleta: (jsonBackup) => {
    if (!jsonBackup || !jsonBackup.localStorageData) {
      throw new Error('El archivo de respaldo no tiene un formato válido de Studio Dental OS.')
    }

    localStorage.clear()
    Object.entries(jsonBackup.localStorageData).forEach(([key, val]) => {
      localStorage.setItem(key, val)
    })
    window.dispatchEvent(new Event('storage'))
  }
}