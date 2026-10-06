/**
 * useAutoSurgicalMode — Detección proactiva de cirugías programadas para sugerir Modo Quirúrgico
 * Blueprint 02: Alerta toast sutil si hay intervención en los próximos 15 minutos.
 */
import { useEffect, useRef } from 'react'
import { agendaStorageService } from '../../domains/operations/agenda/services/agendaStorageService'
import { notificationService } from '../../infrastructure/notification/notificationService'
import { useDarkMode } from './useDarkMode'

export const useAutoSurgicalMode = (): void => {
  const { theme } = useDarkMode()
  const notificadoRef = useRef<boolean>(false)

  useEffect(() => {
    const verificarCirugias = () => {
      if (theme === 'surgical' || notificadoRef.current) return
      try {
        const citas = agendaStorageService.obtenerCitas()
        if (!Array.isArray(citas) || citas.length === 0) return

        const ahora = Date.now()
        const quinceMin = 15 * 60 * 1000

        const cirugiaProxima = citas.find((c) => {
          const motivo = String(c.motivo || '')
          const tratamiento = String((c as { tratamiento?: string }).tratamiento || '')
          const tipo = String((c as { tipo?: string }).tipo || '')

          const esCirugia =
            tipo === 'cirugia' ||
            /cirug|extracc|quirurg|implante/i.test(motivo) ||
            /cirug|extracc|quirurg|implante/i.test(tratamiento)

          if (!esCirugia) return false

          const fechaStr = c.fecha ? `${c.fecha}T${c.hora || '00:00'}` : ''
          const fechaCita = new Date(fechaStr).getTime()
          if (isNaN(fechaCita)) return false

          const diff = fechaCita - ahora
          return diff > 0 && diff <= quinceMin
        })

        if (cirugiaProxima) {
          notificadoRef.current = true
          notificationService.info(
            `¿Activar Modo Quirúrgico para la cirugía de las ${cirugiaProxima.hora || 'próximas horas'}?`,
            {
              duracion: 10000,
              dismissable: true,
              titulo: 'Intervención Quirúrgica Programada',
            }
          )
        }
      } catch {
        // Fail-safe silencioso
      }
    }

    verificarCirugias()
    const timer = setInterval(verificarCirugias, 60000)
    return () => clearInterval(timer)
  }, [theme])
}
