import { useState, useEffect, useCallback } from 'react'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { obtenerAutoresDeEliminacion } from '../services/pacientesSoftDeleteService';
import { usePacientesStore } from '../../../store/pacientesStore'
import { notificationService } from '../../../services/notificationService'
import { createLogger } from '../../../services/logger.js'
import { usePapeleraVaciar } from './usePapelera.vaciar'

const log = createLogger('usePapelera')

/**
 * Hook para gestión de papelera de reciclaje (F6-L).
 * 
 * Proporciona:
 * - Lista de pacientes eliminados (soft delete)
 * - Función para restaurar paciente
 * - Contador de pacientes en papelera
 * - Refresco automático tras restaurar
 * 
 * Solo accesible para usuarios con permiso VER_PAPELERA (admin).
 * 
 * @returns {Object} Estado y métodos de la papelera
 */
export const usePapelera = () => {
  const [pacientesEliminados, setPacientesEliminados] = useState([])
  const [cargando, setCargando] = useState(false)
  const [contador, setContador] = useState(0)
  
  const refrescarPacientes = usePacientesStore((state) => state.refrescarDesdeSupabase)

  /**
   * Carga la lista de pacientes eliminados desde Supabase.
   */
  const cargarPapelera = useCallback(async () => {
    setCargando(true)
    try {
      const eliminados = await pacientesStorageService.listarPacientesEliminados()
      
      // Obtener autores de eliminación (batch query a audit_log)
      const ids = eliminados.map(p => p.id)
      const autoresMap = await obtenerAutoresDeEliminacion(ids)
      
      // Merge datos de pacientes con autores
      const eliminadosConAutor = eliminados.map(paciente => ({
        ...paciente,
        eliminadoPor: autoresMap.get(paciente.id) || 'Usuario desconocido'
      }))
      
      setPacientesEliminados(eliminadosConAutor)
      setContador(eliminadosConAutor.length)
    } catch (error) {
      log.error('Error al cargar papelera:', error)
      notificationService.error('Error al cargar la papelera', { titulo: 'Error' })
    } finally {
      setCargando(false)
    }
  }, [])

  /**
   * Restaura un paciente eliminado.
   * @param {string} pacienteId - UUID del paciente a restaurar
   */
  const restaurar = useCallback(async (pacienteId) => {
    try {
      const exito = await pacientesStorageService.restaurarPaciente(pacienteId)
      
      if (exito) {
        notificationService.success('Paciente restaurado correctamente', { 
          titulo: 'Restauración exitosa' 
        })
        
        // Refrescar lista de papelera
        await cargarPapelera()
        
        // Refrescar directorio de pacientes activos
        await refrescarPacientes()
        
        return true
      } else {
        notificationService.error('No se pudo restaurar el paciente', { 
          titulo: 'Error de restauración' 
        })
        return false
      }
    } catch (error) {
      log.error('Error al restaurar paciente:', error)
      notificationService.error('Error inesperado al restaurar', { titulo: 'Error' })
      return false
    }
  }, [cargarPapelera, refrescarPacientes])

  // Cargar papelera al montar
  useEffect(() => {
    cargarPapelera()
  }, [cargarPapelera])

  const {
    elegibles,
    contadorElegibles,
    aniosRetencion,
    vaciar,
  } = usePapeleraVaciar(pacientesEliminados, cargarPapelera, refrescarPacientes)

  return {
    pacientesEliminados,
    cargando,
    contador,
    restaurar,
    vaciar,
    elegibles,
    contadorElegibles,
    aniosRetencion,
    refrescar: cargarPapelera
  }
}
