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
import { supabase, USE_SUPABASE } from '../services/supabaseClient'
import { createLogger } from '../services/logger'

const log = createLogger('useRestaurarPaciente')

export const useRestaurarPaciente = (userProfile, pacienteSeleccionado, setPacienteSeleccionadoState, setActiveSection) => {
  useEffect(() => {
    // Solo ejecutar si el usuario está autenticado y aún no hay paciente cargado
    if (!userProfile || !USE_SUPABASE || !supabase || pacienteSeleccionado !== null) {
      return
    }

    const restaurarPacienteSeleccionado = async () => {
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

        // Transformar de snake_case a camelCase
        const pacienteRestaurado = {
          id: data.id,
          rut: data.rut,
          nombre: data.nombre,
          edad: data.edad,
          telefono: data.telefono,
          email: data.email,
          ocupacion: data.ocupacion,
          prevision: data.prevision,
          alergias: data.alergias,
          fechaNacimiento: data.fecha_nacimiento,
          direccion: data.direccion,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }

        // Asegurar que estamos en la sección correcta
        setPacienteSeleccionadoState(pacienteRestaurado)
        setActiveSection('Pacientes')
        log.info('✅ Ficha de paciente restaurada:', pacienteRestaurado.nombre)
      } catch (e) {
        log.error('Error inesperado al restaurar paciente:', e)
      }
    }

    restaurarPacienteSeleccionado()
  }, [userProfile, pacienteSeleccionado, setPacienteSeleccionadoState, setActiveSection])
}
