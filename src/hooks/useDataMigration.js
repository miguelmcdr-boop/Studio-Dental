/**
 * Hook de migración automática de datos localStorage → Supabase (F4-02c-2).
 *
 * Se ejecuta automáticamente cuando:
 * 1. El usuario está autenticado con Supabase (VITE_USE_SUPABASE=true)
 * 2. Hay datos en localStorage pendientes de migrar
 * 3. La migración no se ha ejecutado aún en esta sesión
 *
 * IMPORTANTE: usa variable de módulo (no useRef) para el lock de ejecución.
 * Esto es necesario porque React.StrictMode ejecuta useEffect dos veces en
 * desarrollo, y useRef se resetea entre las dos ejecuciones. Con variable
 * de módulo, el lock persiste entre ambas ejecuciones.
 */
import { useEffect } from 'react'
import { supabase, USE_SUPABASE } from '../services/supabaseClient'
import { migratePacientesToSupabase, verificarPacientesPendientes } from '../services/migrations/migratePacientesToSupabase'
import { usePacientesStore } from '../store/pacientesStore'
import { pacientesStorageService } from '../modules/pacientes'

// Lock de módulo: persiste entre re-renders y entre ejecuciones de StrictMode
let migracionEnProgreso = false
let migracionCompletada = false

/**
 * Hook que ejecuta la migración de datos al primer login con Supabase.
 * Debe usarse en App.jsx o en el componente raíz autenticado.
 *
 * @param {Object} userProfile - Perfil del usuario autenticado (de sesionStore)
 */
export const useDataMigration = (userProfile) => {
  useEffect(() => {
    // Solo ejecutar si:
    // 1. Supabase está activo
    // 2. Hay usuario autenticado
    // 3. No hay migración en progreso
    // 4. No se ha completado aún en esta sesión
    if (!USE_SUPABASE || !supabase || !userProfile) {
      return
    }

    if (migracionEnProgreso || migracionCompletada) {
      return
    }

    const ejecutarMigracion = async () => {
      // Marcar lock ANTES de hacer cualquier operación async
      // para que la segunda ejecución de StrictMode no entre
      migracionEnProgreso = true

      try {
        // Verificar si hay pacientes pendientes de migrar
        const pendientes = verificarPacientesPendientes()

        if (pendientes.pendientes === 0) {
          console.log('[useDataMigration] No hay pacientes pendientes de migrar')

          // Aunque no haya migración, sincronizar desde Supabase para asegurar
          // que la caché tenga los datos más recientes (útil en multi-dispositivo)
          await pacientesStorageService.sincronizarDesdeSupabase()

          const pacientesActualizados = pacientesStorageService.obtenerPacientes([])
          usePacientesStore.setState({ pacientes: pacientesActualizados })

          migracionCompletada = true
          return
        }

        console.log(`[useDataMigration] Migrando ${pendientes.pendientes} pacientes a Supabase...`)

        // Obtener el user_id del usuario autenticado
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error('[useDataMigration] No se pudo obtener user_id de Supabase')
          migracionEnProgreso = false
          return
        }

        // Ejecutar la migración
        const resultado = await migratePacientesToSupabase(user.id)

        console.log('[useDataMigration] Resultado de migración:', {
          migrados: resultado.migrados,
          omitidos: resultado.omitidos,
          errores: resultado.errores.length,
          success: resultado.success
        })

        if (resultado.errores.length > 0) {
          console.error('[useDataMigration] Errores durante la migración:', resultado.errores)
        }

        // Después de migrar, sincronizar desde Supabase para refrescar la caché
        // con los UUIDs asignados por Supabase
        await pacientesStorageService.sincronizarDesdeSupabase()

        // Actualizar el store de pacientes con los datos migrados
        const pacientesActualizados = pacientesStorageService.obtenerPacientes([])
        usePacientesStore.setState({ pacientes: pacientesActualizados })

        console.log('[useDataMigration] Migración completada y caché sincronizada')

        migracionCompletada = true
      } catch (error) {
        console.error('[useDataMigration] Error inesperado durante la migración:', error)
        migracionEnProgreso = false // Permitir reintentar si hubo error
      } finally {
        // Liberar el lock de "en progreso" pero mantener "completada"
        migracionEnProgreso = false
      }
    }

    ejecutarMigracion()
  }, [userProfile])
}
