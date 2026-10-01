import { useState, useCallback, useEffect } from 'react'
import { CLINICA_DEFAULT, PARAMETROS_AGENDA_DEFAULT } from '../constants/configuracionConstants'
import { configuracionStorageService } from '../services/configuracionStorageService'
import { descargarArchivoBackupJSON } from '../utils/configuracionCalculations'
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'
import { guardarPerfil } from '../../../services/authService'
import { createLogger } from '../../../services/logger.js'
import { useAppDialog } from '../../../hooks/useAppDialog'

const log = createLogger('useConfiguracion')

export const useConfiguracion = (userProfileProps, setUserProfileProps) => {
  const { alert: dialogAlert } = useAppDialog()
  const [datosClinica, setDatosClinica] = useState(() =>
    configuracionStorageService.obtenerClinica(CLINICA_DEFAULT)
  )

  const [parametrosAgenda, setParametrosAgenda] = useState(() =>
    configuracionStorageService.obtenerParametrosAgenda(PARAMETROS_AGENDA_DEFAULT)
  )

  // F6-C-e: sincronización inicial desde Supabase al montar.
  // 1. Si el usuario es admin y hay datos en localStorage, migrar a Supabase (una sola vez)
  // 2. Luego sincronizar desde Supabase para refrescar la caché local con los datos más recientes
  // Se ejecuta solo cuando cambia el clinicaId (login / cambio de clínica).
  useEffect(() => {
    const clinicaId = userProfileProps?.clinicaId
    if (!clinicaId) return

    let cancelado = false

    const sincronizar = async () => {
      try {
        // Solo admin puede escribir: si es admin, intentar migración desde localStorage
        if (userProfileProps?.rol === 'admin') {
          await configuracionStorageService.migrarClinicaSiNecesario(clinicaId)
        }
        // Siempre refrescar desde Supabase (lee la fila actualizada)
        const datosDesdeSupabase = await configuracionStorageService.sincronizarClinicaDesdeSupabase(clinicaId)
        if (!cancelado && datosDesdeSupabase) {
          setDatosClinica(datosDesdeSupabase)
        }
      } catch (e) {
        log.error('Error sincronizando clínica:', e)
      }
    }

    sincronizar()
    return () => { cancelado = true }
  }, [userProfileProps?.clinicaId, userProfileProps?.rol])

  const guardarPerfilProfesional = useCallback(async (nuevoPerfil) => {
    if (setUserProfileProps) {
      setUserProfileProps(nuevoPerfil)
    }
    // F2-07c: vía authService (guardarPerfil), no acceso directo a localStorage
    const email = nuevoPerfil.email || 'active_user'
    const ok = guardarPerfil(email, nuevoPerfil)
    if (ok) {
      await dialogAlert({
        title: 'Perfil guardado',
        description: 'Perfil profesional guardado exitosamente.',
        variant: 'success',
        confirmText: 'Entendido'
      })
    } else {
      await dialogAlert({
        title: 'Error al guardar perfil',
        description: 'Error al guardar el perfil. Verifica el almacenamiento del navegador.',
        variant: 'error',
        confirmText: 'Entendido'
      })
    }
  }, [setUserProfileProps, dialogAlert])

  // F6-C-e: guardar en Supabase + localStorage. Si Supabase no está configurado
  // o no hay clinicaId, guarda solo en localStorage (comportamiento legacy).
  const guardarDatosClinica = useCallback(async (nuevosDatos) => {
    setDatosClinica(nuevosDatos)
    const clinicaId = userProfileProps?.clinicaId

    if (clinicaId) {
      await configuracionStorageService.guardarClinicaCompleta(clinicaId, nuevosDatos)
      await dialogAlert({
        title: 'Datos actualizados',
        description: 'Datos de membrete e información de clínica actualizados (compartidos con todos los miembros).',
        variant: 'success',
        confirmText: 'Entendido'
      })
    } else {
      configuracionStorageService.guardarClinica(nuevosDatos)
      await dialogAlert({
        title: 'Datos actualizados',
        description: 'Datos de membrete e información de clínica actualizados (solo en este dispositivo).',
        variant: 'success',
        confirmText: 'Entendido'
      })
    }
  }, [userProfileProps?.clinicaId, dialogAlert])

  const guardarParametrosAgendaHook = useCallback(async (nuevosParametros) => {
    setParametrosAgenda(nuevosParametros)
    configuracionStorageService.guardarParametrosAgenda(nuevosParametros)
    await dialogAlert({
      title: 'Parámetros actualizados',
      description: 'Parámetros de agenda actualizados.',
      variant: 'success',
      confirmText: 'Entendido'
    })
  }, [dialogAlert])

  const ejecutarExportacionBackup = useCallback(() => {
    const backupObj = configuracionStorageService.exportarBaseDeDatosCompleta()
    const fecha = obtenerFechaLocalISO()
    descargarArchivoBackupJSON(backupObj, `Backup_StudioDental_${fecha}.json`)
  }, [])

  const ejecutarImportacionBackup = useCallback(async (jsonBackup) => {
    try {
      configuracionStorageService.importarBaseDeDatosCompleta(jsonBackup)
      await dialogAlert({
        title: 'Base de datos restaurada',
        description: 'Base de datos restaurada con éxito. La página se recargará.',
        variant: 'success',
        confirmText: 'Entendido'
      })
      window.location.reload()
    } catch (e) {
      await dialogAlert({
        title: 'Error al importar',
        description: 'Error al importar respaldo: ' + e.message,
        variant: 'error',
        confirmText: 'Entendido'
      })
    }
  }, [dialogAlert])

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
