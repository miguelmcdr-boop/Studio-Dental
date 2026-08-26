/**
 * Hook de migración automática de datos localStorage → Supabase (F4-02c-2, F4-02c-3).
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
 *
 * Flujo de migración:
 * 1. Migrar pacientes (F4-02c-2)
 * 2. Migrar citas (F4-02c-3) — solo citas cuyos pacientes ya fueron migrados
 * 3. Sincronizar caché de pacientes y citas desde Supabase
 */
import { useEffect } from 'react'
import { supabase, USE_SUPABASE } from '../services/supabaseClient'
import { migratePacientesToSupabase, verificarPacientesPendientes } from '../services/migrations/migratePacientesToSupabase'
import { migrateCitasToSupabase, verificarCitasPendientes } from '../services/migrations/migrateCitasToSupabase'
import { migratePresupuestosToSupabase, verificarPresupuestosPendientes } from '../services/migrations/migratePresupuestosToSupabase'
import { migratePagosToSupabase, verificarPagosPendientes } from '../services/migrations/migratePagosToSupabase'
import { migrateMovimientosFinancierosToSupabase, verificarMovimientosPendientes } from '../services/migrations/migrateMovimientosFinancierosToSupabase'
import { migrateDatosClinicosToSupabase, verificarDatosClinicosPendientes } from '../services/migrations/migrateDatosClinicosToSupabase'
import { usePacientesStore } from '../store/pacientesStore'
import { pacientesStorageService } from '../modules/pacientes'
import { agendaStorageService } from '../modules/agenda'
import { presupuestosStorageService } from '../modules/presupuestos/services/presupuestosStorageService'
import { pagosStorageService } from '../modules/pagos/services/pagosStorageService'
import { finanzasStorageService } from '../modules/finanzas/services/finanzasStorageService'
import { createLogger } from '../services/logger'

const log = createLogger('useDataMigration')

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
        // Verificar si hay datos pendientes de migrar
        const pacientesPendientes = verificarPacientesPendientes()
        const citasPendientes = verificarCitasPendientes()
        const presupuestosPendientes = verificarPresupuestosPendientes()
        const pagosPendientes = verificarPagosPendientes()
        const movimientosPendientes = verificarMovimientosPendientes()
        const datosClinicosPendientes = verificarDatosClinicosPendientes()

        const totalPendientes = pacientesPendientes.pendientes + 
          citasPendientes.pendientes + 
          presupuestosPendientes.pendientes + 
          pagosPendientes.globalesPendientes + 
          movimientosPendientes.pendientes + 
          datosClinicosPendientes.conDatos

        if (totalPendientes === 0) {
          log.info('No hay datos pendientes de migrar')

          // Aunque no haya migración, sincronizar desde Supabase para asegurar
          // que la caché tenga los datos más recientes (útil en multi-dispositivo)
          await pacientesStorageService.sincronizarDesdeSupabase()
          await agendaStorageService.sincronizarDesdeSupabase()

          const pacientesActualizados = pacientesStorageService.obtenerPacientes([])
          usePacientesStore.setState({ pacientes: pacientesActualizados })

          migracionCompletada = true
          return
        }

        log.info(`Migrando ${totalPendientes} registros a Supabase...`, {
          pacientes: pacientesPendientes.pendientes,
          citas: citasPendientes.pendientes,
          presupuestos: presupuestosPendientes.pendientes,
          pagos: pagosPendientes.globalesPendientes,
          movimientos: movimientosPendientes.pendientes,
          datosClinicos: datosClinicosPendientes.conDatos
        })

        // Obtener el user_id del usuario autenticado
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          log.error('No se pudo obtener user_id de Supabase')
          migracionEnProgreso = false
          return
        }

        // ═══════════════════════════════════════════════════
        // PASO 1: Migrar pacientes (F4-02c-2)
        // ═══════════════════════════════════════════════════
        if (pacientesPendientes.pendientes > 0) {
          log.info(`Paso 1: Migrando ${pacientesPendientes.pendientes} pacientes...`)

          const resultadoPacientes = await migratePacientesToSupabase(user.id)

          log.info('Resultado migración pacientes:', {
            migrados: resultadoPacientes.migrados,
            omitidos: resultadoPacientes.omitidos,
            errores: resultadoPacientes.errores.length,
            success: resultadoPacientes.success
          })

          if (resultadoPacientes.errores.length > 0) {
            log.error('Errores en migración de pacientes:', resultadoPacientes.errores)
          }
        }

        // ═══════════════════════════════════════════════════
        // PASO 2: Migrar citas (F4-02c-3)
        // ═══════════════════════════════════════════════════
        if (citasPendientes.pendientes > 0) {
          log.info(`Paso 2: Migrando ${citasPendientes.pendientes} citas...`)

          if (citasPendientes.sinPacienteMigrado > 0) {
            log.warn(`${citasPendientes.sinPacienteMigrado} citas omitidas: paciente no migrado aún`)
          }

          const resultadoCitas = await migrateCitasToSupabase(user.id)

          log.info('Resultado migración citas:', {
            migradas: resultadoCitas.migradas,
            omitidas: resultadoCitas.omitidas,
            errores: resultadoCitas.errores.length,
            success: resultadoCitas.success
          })

          if (resultadoCitas.errores.length > 0) {
            log.error('Errores en migración de citas:', resultadoCitas.errores)
          }
        }

        // ═══════════════════════════════════════════════════
        // PASO 3: Migrar presupuestos (F4-02c-4)
        // ═══════════════════════════════════════════════════
        if (presupuestosPendientes.pendientes > 0) {
          log.info(`Paso 3: Migrando ${presupuestosPendientes.pendientes} presupuestos...`)

          const resultadoPresupuestos = await migratePresupuestosToSupabase(user.id)

          log.info('Resultado migración presupuestos:', {
            migrados: resultadoPresupuestos.migrados,
            itemsMigrados: resultadoPresupuestos.itemsMigrados,
            omitidos: resultadoPresupuestos.omitidos,
            errores: resultadoPresupuestos.errores.length,
            success: resultadoPresupuestos.success
          })

          if (resultadoPresupuestos.errores.length > 0) {
            log.error('Errores en migración de presupuestos:', resultadoPresupuestos.errores)
          }
        }

        // ═══════════════════════════════════════════════════
        // PASO 4: Migrar pagos y movimientos financieros (F4-02c-5)
        // ═══════════════════════════════════════════════════
        if (pagosPendientes.globalesPendientes > 0) {
          log.info(`Paso 4a: Migrando ${pagosPendientes.globalesPendientes} pagos globales...`)

          const resultadoPagos = await migratePagosToSupabase(user.id)

          log.info('Resultado migración pagos:', {
            migrados: resultadoPagos.migrados,
            abonosMigrados: resultadoPagos.abonosMigrados,
            omitidos: resultadoPagos.omitidos,
            errores: resultadoPagos.errores.length,
            success: resultadoPagos.success
          })

          if (resultadoPagos.errores.length > 0) {
            log.error('Errores en migración de pagos:', resultadoPagos.errores)
          }
        }

        if (movimientosPendientes.pendientes > 0) {
          log.info(`Paso 4b: Migrando ${movimientosPendientes.pendientes} movimientos financieros...`)

          const resultadoMovimientos = await migrateMovimientosFinancierosToSupabase(user.id)

          log.info('Resultado migración movimientos:', {
            migrados: resultadoMovimientos.migrados,
            omitidos: resultadoMovimientos.omitidos,
            errores: resultadoMovimientos.errores.length,
            success: resultadoMovimientos.success
          })

          if (resultadoMovimientos.errores.length > 0) {
            log.error('Errores en migración de movimientos:', resultadoMovimientos.errores)
          }
        }

        // ═══════════════════════════════════════════════════
        // PASO 5: Migrar datos clínicos (F4-02c-6)
        // ═══════════════════════════════════════════════════
        if (datosClinicosPendientes.conDatos > 0) {
          log.info(`Paso 5: Migrando datos clínicos de ${datosClinicosPendientes.conDatos} pacientes...`)

          const resultadoDatosClinicos = await migrateDatosClinicosToSupabase(user.id)

          log.info('Resultado migración datos clínicos:', {
            evolucionesMigradas: resultadoDatosClinicos.evolucionesMigradas,
            recetasMigradas: resultadoDatosClinicos.recetasMigradas,
            otrosMigrados: resultadoDatosClinicos.otrosMigrados,
            errores: resultadoDatosClinicos.errores.length,
            success: resultadoDatosClinicos.success
          })

          if (resultadoDatosClinicos.errores.length > 0) {
            log.error('Errores en migración de datos clínicos:', resultadoDatosClinicos.errores)
          }
        }

        // ═══════════════════════════════════════════════════
        // PASO 6: Sincronizar caché desde Supabase
        // ═══════════════════════════════════════════════════
        log.info('Paso 6: Sincronizando caché desde Supabase...')

        await pacientesStorageService.sincronizarDesdeSupabase()
        await agendaStorageService.sincronizarDesdeSupabase()
        await presupuestosStorageService.sincronizarDesdeSupabase()
        await pagosStorageService.sincronizarDesdeSupabase()
        await finanzasStorageService.sincronizarDesdeSupabase()

        // Actualizar stores con datos migrados
        const pacientesActualizados = pacientesStorageService.obtenerPacientes([])
        usePacientesStore.setState({ pacientes: pacientesActualizados })

        log.info('✅ Migración completada y caché sincronizada')

        migracionCompletada = true
      } catch (error) {
        log.error('Error inesperado durante la migración:', error)
        migracionEnProgreso = false // Permitir reintentar si hubo error
      } finally {
        // Liberar el lock de "en progreso" pero mantener "completada"
        migracionEnProgreso = false
      }
    }

    ejecutarMigracion()
  }, [userProfile])
}
