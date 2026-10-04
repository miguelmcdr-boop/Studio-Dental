/**
 * useRestaurarPaciente — Hook para restaurar paciente seleccionado desde Supabase (F4-02e)
 *
 * Al recargar la app, restaura el paciente seleccionado previamente
 * usando el UUID guardado en localStorage.
 *
 * Uso:
 *   useRestaurarPaciente(userProfile, pacienteSeleccionado, setPacienteSeleccionadoState, setActiveSection)
 */
import { useEffect } from 'react'
import { supabase, USE_SUPABASE } from '../../infrastructure/supabase/supabaseClient'
import { createLogger } from '../../infrastructure/logging/logger'
import type { Paciente } from '../../domains/clinical/patient/schemas/pacienteSchema'

const log = createLogger('useRestaurarPaciente')

interface PacienteRow {
  id: string
  rut: string
  nombre: string
  edad?: number | string | null
  telefono?: string | null
  email?: string | null
  ocupacion?: string | null
  prevision?: string | null
  alergias?: string | null
  fecha_nacimiento?: string | null
  direccion?: string | null
  created_at?: string | null
  updated_at?: string | null
  [key: string]: unknown
}

export const useRestaurarPaciente = (
  userProfile: unknown,
  pacienteSeleccionado: Paciente | null,
  setPacienteSeleccionadoState: (paciente: Paciente) => void,
  setActiveSection: (seccion: string) => void
): void => {
  useEffect(() => {
    // Solo ejecutar si el usuario está autenticado y aún no hay paciente cargado
    if (!userProfile || !USE_SUPABASE || !supabase || pacienteSeleccionado !== null) {
      return
    }

    const restaurarPacienteSeleccionado = async (): Promise<void> => {
      if (!supabase) return
      try {
        const pacienteIdGuardado = localStorage.getItem('clinica_paciente_seleccionado_id')
        if (!pacienteIdGuardado) return

        // Validar que sea UUID válido
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pacienteIdGuardado)) {
          localStorage.removeItem('clinica_paciente_seleccionado_id')
          return
        }

        log.info('Restaurando ficha de paciente desde Supabase:', pacienteIdGuardado)

        const { data, error } = await supabase
          .from('pacientes')
          .select('*')
          .eq('id', pacienteIdGuardado)
          .maybeSingle()

        if (error) {
          log.error('Error al restaurar paciente:', error.message)
          return
        }

        if (!data) {
          // El paciente fue eliminado en otro dispositivo — limpiar selección
          log.warn('Paciente no encontrado (pudo ser eliminado), limpiando selección')
          localStorage.removeItem('clinica_paciente_seleccionado_id')
          return
        }

        const pacienteData = data as PacienteRow

        // Transformar de snake_case a camelCase
        const pacienteRestaurado: Paciente = {
          id: pacienteData.id,
          rut: pacienteData.rut,
          nombre: pacienteData.nombre,
          edad: pacienteData.edad ?? undefined,
          telefono: pacienteData.telefono ?? undefined,
          email: pacienteData.email ?? undefined,
          ocupacion: pacienteData.ocupacion ?? undefined,
          prevision: pacienteData.prevision ?? undefined,
          alergias: pacienteData.alergias ?? undefined,
          fechaNacimiento: pacienteData.fecha_nacimiento ?? undefined,
          direccion: pacienteData.direccion ?? undefined,
          createdAt: pacienteData.created_at ?? undefined,
          updatedAt: pacienteData.updated_at ?? undefined
        }

        // Asegurar que estamos en la sección correcta
        setPacienteSeleccionadoState(pacienteRestaurado)
        setActiveSection('Pacientes')
        log.info('Ficha de paciente restaurada:', pacienteRestaurado.nombre)
      } catch (e: unknown) {
        log.error('Error inesperado al restaurar paciente:', e)
      }
    }

    void restaurarPacienteSeleccionado()
  }, [userProfile, pacienteSeleccionado, setPacienteSeleccionadoState, setActiveSection])
}
