import { useState, useCallback, useEffect } from 'react'
import {
  CLINICA_DEFAULT,
  PARAMETROS_AGENDA_DEFAULT,
  type ClinicaConfig,
  type ParametrosAgendaConfig
} from '../constants/configuracionConstants'
import {
  configuracionStorageService,
  type DatosClinicaConfig,
  type BackupBaseDeDatos
} from '../services/configuracionStorageService'
import { descargarArchivoBackupJSON } from '../utils/configuracionCalculations'
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'
import { guardarPerfil } from '../../../services/authService'
import { createLogger } from '../../../services/logger'
import { useAppDialog } from '../../../hooks/useAppDialog'

const log = createLogger('useConfiguracion')

export interface UserProfileConfigInput {
  clinicaId?: string
  rol?: string
  email?: string
  [key: string]: unknown
}

export interface UseConfiguracionReturn {
  datosClinica: DatosClinicaConfig | ClinicaConfig
  parametrosAgenda: ParametrosAgendaConfig
  guardarPerfilProfesional: (
    nuevoPerfil: Record<string, unknown>
  ) => Promise<void>
  guardarDatosClinica: (
    nuevosDatos: DatosClinicaConfig | ClinicaConfig
  ) => Promise<void>
  guardarParametrosAgenda: (
    nuevosParametros: ParametrosAgendaConfig
  ) => Promise<void>
  ejecutarExportacionBackup: () => void
  ejecutarImportacionBackup: (jsonBackup: BackupBaseDeDatos) => Promise<void>
}

export const useConfiguracion = (
  userProfileProps?: UserProfileConfigInput | null,
  setUserProfileProps?: ((nuevoPerfil: unknown) => void) | null
): UseConfiguracionReturn => {
  const { alert: dialogAlert } = useAppDialog()
  const [datosClinica, setDatosClinica] = useState<
    DatosClinicaConfig | ClinicaConfig
  >(
    () =>
      configuracionStorageService.obtenerClinica(
        CLINICA_DEFAULT as unknown as DatosClinicaConfig
      ) ?? CLINICA_DEFAULT
  )

  const [parametrosAgenda, setParametrosAgenda] =
    useState<ParametrosAgendaConfig>(
      () =>
        (configuracionStorageService.obtenerParametrosAgenda(
          PARAMETROS_AGENDA_DEFAULT as unknown as Record<string, unknown>
        ) as unknown as ParametrosAgendaConfig) ?? PARAMETROS_AGENDA_DEFAULT
    )

  // F6-C-e: sincronización inicial desde Supabase al montar.
  useEffect(() => {
    const clinicaId = userProfileProps?.clinicaId
    if (!clinicaId) return

    let cancelado = false

    const sincronizar = async () => {
      try {
        if (userProfileProps?.rol === 'admin') {
          await configuracionStorageService.migrarClinicaSiNecesario(clinicaId)
        }
        const datosDesdeSupabase =
          await configuracionStorageService.sincronizarClinicaDesdeSupabase(
            clinicaId
          )
        if (!cancelado && datosDesdeSupabase) {
          setDatosClinica(datosDesdeSupabase)
        }
      } catch (e) {
        log.error('Error sincronizando clínica:', e)
      }
    }

    void sincronizar()
    return () => {
      cancelado = true
    }
  }, [userProfileProps?.clinicaId, userProfileProps?.rol])

  const guardarPerfilProfesional = useCallback(
    async (nuevoPerfil: Record<string, unknown>) => {
      if (setUserProfileProps) {
        setUserProfileProps(nuevoPerfil)
      }
      const email = (nuevoPerfil.email as string) || 'active_user'
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
          description:
            'Error al guardar el perfil. Verifica el almacenamiento del navegador.',
          variant: 'error',
          confirmText: 'Entendido'
        })
      }
    },
    [setUserProfileProps, dialogAlert]
  )

  const guardarDatosClinica = useCallback(
    async (nuevosDatos: DatosClinicaConfig | ClinicaConfig) => {
      setDatosClinica(nuevosDatos)
      const clinicaId = userProfileProps?.clinicaId

      if (clinicaId) {
        await configuracionStorageService.guardarClinicaCompleta(
          clinicaId,
          nuevosDatos as DatosClinicaConfig
        )
        await dialogAlert({
          title: 'Datos actualizados',
          description:
            'Datos de membrete e información de clínica actualizados (compartidos con todos los miembros).',
          variant: 'success',
          confirmText: 'Entendido'
        })
      } else {
        configuracionStorageService.guardarClinica(
          nuevosDatos as DatosClinicaConfig
        )
        await dialogAlert({
          title: 'Datos actualizados',
          description:
            'Datos de membrete e información de clínica actualizados (solo en este dispositivo).',
          variant: 'success',
          confirmText: 'Entendido'
        })
      }
    },
    [userProfileProps?.clinicaId, dialogAlert]
  )

  const guardarParametrosAgendaHook = useCallback(
    async (nuevosParametros: ParametrosAgendaConfig) => {
      setParametrosAgenda(nuevosParametros)
      configuracionStorageService.guardarParametrosAgenda(
        nuevosParametros as unknown as Record<string, unknown>
      )
      await dialogAlert({
        title: 'Parámetros actualizados',
        description: 'Parámetros de agenda actualizados.',
        variant: 'success',
        confirmText: 'Entendido'
      })
    },
    [dialogAlert]
  )

  const ejecutarExportacionBackup = useCallback(() => {
    const backupObj =
      configuracionStorageService.exportarBaseDeDatosCompleta()
    const fecha = obtenerFechaLocalISO()
    descargarArchivoBackupJSON(backupObj, `Backup_StudioDental_${fecha}.json`)
  }, [])

  const ejecutarImportacionBackup = useCallback(
    async (jsonBackup: BackupBaseDeDatos) => {
      try {
        configuracionStorageService.importarBaseDeDatosCompleta(jsonBackup)
        await dialogAlert({
          title: 'Base de datos restaurada',
          description:
            'Base de datos restaurada con éxito. La página se recargará.',
          variant: 'success',
          confirmText: 'Entendido'
        })
        window.location.reload()
      } catch (e: unknown) {
        const err = e as Error
        await dialogAlert({
          title: 'Error al importar',
          description: 'Error al importar respaldo: ' + err.message,
          variant: 'error',
          confirmText: 'Entendido'
        })
      }
    },
    [dialogAlert]
  )

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
