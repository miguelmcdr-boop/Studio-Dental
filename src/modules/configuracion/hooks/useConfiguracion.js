import { useState, useCallback, useEffect } from 'react'
import { CLINICA_DEFAULT, PARAMETROS_AGENDA_DEFAULT } from '../constants/configuracionConstants'
import { configuracionStorageService } from '../services/configuracionStorageService'
import { descargarArchivoBackupJSON } from '../utils/configuracionCalculations'
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'
import { guardarPerfil } from '../../../services/authService'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('useConfiguracion')

export const useConfiguracion = (userProfileProps, setUserProfileProps) => {
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

  // F6-C-e: guardar en Supabase + localStorage. Si Supabase no está configurado
  // o no hay clinicaId, guarda solo en localStorage (comportamiento legacy).
  const guardarDatosClinica = useCallback(async (nuevosDatos) => {
    setDatosClinica(nuevosDatos)
    const clinicaId = userProfileProps?.clinicaId

    if (clinicaId) {
      await configuracionStorageService.guardarClinicaCompleta(clinicaId, nuevosDatos)
      alert('✅ Datos de membrete e información de clínica actualizados (compartidos con todos los miembros).')
    } else {
      configuracionStorageService.guardarClinica(nuevosDatos)
      alert('✅ Datos de membrete e información de clínica actualizados (solo en este dispositivo).')
    }
  }, [userProfileProps?.clinicaId])

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
