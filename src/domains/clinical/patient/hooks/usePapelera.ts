import { useState, useEffect, useCallback } from 'react'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { obtenerAutoresDeEliminacion, type PurgeResult } from '../services/pacientesSoftDeleteService'
import { usePacientesStore } from '../../../../store/pacientesStore'
import { notificationService } from '../../../../services/notificationService'
import { createLogger } from '../../../../services/logger'
import { usePapeleraVaciar, type PacienteEliminado } from './usePapelera.vaciar'

const log = createLogger('usePapelera')

export type { PacienteEliminado, PurgeResult }

export interface UsePapeleraReturn {
  pacientesEliminados: PacienteEliminado[]
  cargando: boolean
  contador: number
  restaurar: (pacienteId: string | number) => Promise<boolean>
  vaciar: (pacienteIds?: (string | number)[]) => Promise<PurgeResult>
  elegibles: PacienteEliminado[]
  contadorElegibles: number
  aniosRetencion: number
  refrescar: () => Promise<void>
}

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
 */
export const usePapelera = (): UsePapeleraReturn => {
  const [pacientesEliminados, setPacientesEliminados] = useState<PacienteEliminado[]>([])
  const [cargando, setCargando] = useState<boolean>(false)
  const [contador, setContador] = useState<number>(0)
  
  // Zustand store tipado implícitamente desde JS
  const refrescarPacientes = usePacientesStore((state: { refrescarDesdeSupabase: () => Promise<void> | void }) => state.refrescarDesdeSupabase)

  /**
   * Carga la lista de pacientes eliminados desde Supabase.
   */
  const cargarPapelera = useCallback(async (): Promise<void> => {
    setCargando(true)
    try {
      const eliminados = await pacientesStorageService.listarPacientesEliminados()
      
      // Obtener autores de eliminación (batch query a audit_log)
      const ids = eliminados.map(p => String(p.id))
      const autoresMap = await obtenerAutoresDeEliminacion(ids)
      
      // Merge datos de pacientes con autores
      const eliminadosConAutor: PacienteEliminado[] = eliminados.map(paciente => ({
        ...paciente,
        eliminadoPor: autoresMap.get(String(paciente.id)) || 'Usuario desconocido'
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
   * @param pacienteId - UUID del paciente a restaurar
   */
  const restaurar = useCallback(async (pacienteId: string | number): Promise<boolean> => {
    try {
      const exito = await pacientesStorageService.restaurarPaciente(String(pacienteId))
      
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
