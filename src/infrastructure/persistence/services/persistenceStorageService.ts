/**
 * Servicio de Persistencia y Copias de Seguridad (Backup / Restore / Reset)
 */
import { createLogger } from '../../../../services/logger'

const log = createLogger('persistenceStorageService')

export interface BackupBaseDeDatos {
  versionSystem: string
  fechaExportacion: string
  localStorageData: Record<string, string | null>
}

export const persistenceStorageService = {
  exportarBaseDeDatosCompleta: (): BackupBaseDeDatos => {
    const backupObj: BackupBaseDeDatos = {
      versionSystem: '3.0.0',
      fechaExportacion: new Date().toISOString(),
      localStorageData: {}
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key !== null) {
        backupObj.localStorageData[key] = localStorage.getItem(key)
      }
    }

    return backupObj
  },

  importarBaseDeDatosCompleta: (jsonBackup: BackupBaseDeDatos): void => {
    if (!jsonBackup || !jsonBackup.localStorageData) {
      throw new Error('El archivo de respaldo no tiene un formato válido de Studio Dental OS.')
    }

    localStorage.clear()
    Object.entries(jsonBackup.localStorageData).forEach(([key, val]) => {
      if (val !== null) {
        localStorage.setItem(key, val)
      }
    })
    window.dispatchEvent(new Event('storage'))
  },

  limpiarBaseDeDatosCompleta: (): boolean => {
    try {
      localStorage.clear()
      window.dispatchEvent(new Event('storage'))
      return true
    } catch (e: unknown) {
      log.error('Error al limpiar base de datos:', e)
      return false
    }
  }
}

export const descargarArchivoBackupJSON = (datos: unknown, nombreArchivo: string): void => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datos, null, 2))
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute('href', dataStr)
  downloadAnchor.setAttribute('download', nombreArchivo)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
}
