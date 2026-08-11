/**
 * Servicio de Persistencia y Copias de Seguridad (Backup / Restore)
 */
import { createLocalStorageRepository } from '../../../services/localStorageRepository'

const KEY_CLINICA = 'studio_dental_config_clinica'
const KEY_PARAMETROS_AGENDA = 'studio_dental_config_agenda'

const clinicaRepo = createLocalStorageRepository(KEY_CLINICA, undefined, { notify: true })
const parametrosAgendaRepo = createLocalStorageRepository(KEY_PARAMETROS_AGENDA, undefined)

export const configuracionStorageService = {
  obtenerClinica: (defaults) => clinicaRepo.obtener(defaults),
  guardarClinica: (datos) => clinicaRepo.guardar(datos),

  obtenerParametrosAgenda: (defaults) => parametrosAgendaRepo.obtener(defaults),
  guardarParametrosAgenda: (parametros) => parametrosAgendaRepo.guardar(parametros),

  // Backup/restore completo: opera sobre TODA la base de LocalStorage, no
  // sobre una clave individual — no encaja en el patrón de repositorio de
  // clave fija y se deja fuera del alcance de F2-03 intencionalmente.
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
  },

  // Limpieza total de la base de datos local (F2-07 — migración desde RespaldoDatosSection.jsx).
  // Sigue el patrón del factory de F2-03: try/catch, retorna boolean, nunca lanza excepción.
  // Dispara el evento 'storage' para sincronizar entre pestañas (coherente con F2-01).
  // El window.confirm() y window.location.reload() quedan en el componente (son UI/navegación, no persistencia).
  limpiarBaseDeDatosCompleta: () => {
    try {
      localStorage.clear()
      window.dispatchEvent(new Event('storage'))
      return true
    } catch (e) {
      console.error('Error al limpiar base de datos:', e)
      return false
    }
  }
}