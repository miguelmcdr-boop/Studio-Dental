import { useState, useCallback } from 'react'
import { CLINICA_DEFAULT, PARAMETROS_AGENDA_DEFAULT } from '../constants/configuracionConstants'
import { configuracionStorageService } from '../services/configuracionStorageService'
import { descargarArchivoBackupJSON } from '../utils/configuracionCalculations'
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'
import { guardarPerfil } from '../../../services/authService'

export const useConfiguracion = (userProfileProps, setUserProfileProps) => {
  const [datosClinica, setDatosClinica] = useState(() => 
    configuracionStorageService.obtenerClinica(CLINICA_DEFAULT)
  )

  const [parametrosAgenda, setParametrosAgenda] = useState(() => 
    configuracionStorageService.obtenerParametrosAgenda(PARAMETROS_AGENDA_DEFAULT)
  )

  const guardarPerfilProfesional = useCallback((nuevoPerfil) => {
    if (setUserProfileProps) {
      setUserProfileProps(nuevoPerfil)
    }
    // F2-07c: vía authService (guardarPerfil), no acceso directo a localStorage
    const email = nuevoPerfil.email || 'active_user'
    const ok = guardarPerfil(email, nuevoPerfil)
    if (ok) {
      alert('✅ Perfil profesional guardado exitosamente.')
    } else {
      alert('❌ Error al guardar el perfil. Verifica el almacenamiento del navegador.')
    }
  }, [setUserProfileProps])

  const guardarDatosClinica = useCallback((nuevosDatos) => {
    setDatosClinica(nuevosDatos)
    configuracionStorageService.guardarClinica(nuevosDatos)
    alert('✅ Datos de membrete e información de clínica actualizados.')
  }, [])

  const guardarParametrosAgendaHook = useCallback((nuevosParametros) => {
    setParametrosAgenda(nuevosParametros)
    configuracionStorageService.guardarParametrosAgenda(nuevosParametros)
    alert('✅ Parámetros de agenda actualizados.')
  }, [])

  const ejecutarExportacionBackup = useCallback(() => {
    const backupObj = configuracionStorageService.exportarBaseDeDatosCompleta()
    const fecha = obtenerFechaLocalISO()
    descargarArchivoBackupJSON(backupObj, `Backup_StudioDental_${fecha}.json`)
  }, [])

  const ejecutarImportacionBackup = useCallback((jsonBackup) => {
    try {
      configuracionStorageService.importarBaseDeDatosCompleta(jsonBackup)
      alert('🚀 Base de datos restaurada con éxito. La página se recargará.')
      window.location.reload()
    } catch (e) {
      alert('❌ Error al importar respaldo: ' + e.message)
    }
  }, [])

  return {
    datosClinica,
    parametrosAgenda,
    guardarPerfilProfesional,
    guardarDatosClinica,
    guardarParametrosAgenda: guardarParametrosAgendaHook,
    ejecutarExportacionBackup,
    ejecutarImportacionBackup
  }
}