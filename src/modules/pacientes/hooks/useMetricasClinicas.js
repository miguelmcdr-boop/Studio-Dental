/**
 * useMetricasClinicas — KPIs del paciente para ficha premium (F7-26)
 *
 * Calcula métricas clínicas consolidadas para el ResumenClinicoHeader.
 * Usa datos que ya están cargados en useFichaPaciente (evolucionesNotas,
 * itemsPresupuesto, abonos) + citas del agendaStorageService.
 *
 * KPIs calculados:
 * - ultimaVisita: fecha de la evolución más reciente (o null)
 * - diasDesdeUltimaVisita: diferencia en días con hoy (o null)
 * - totalVisitas: count de evoluciones
 * - proximaCita: próxima cita futura del paciente (o null)
 * - presupuestoTotal: suma de todos los items
 * - presupuestoPagado: suma de abonos
 * - presupuestoPendiente: total - pagado
 * - progresoTratamiento: % de items realizados vs total
 * - alertasActivas: array de strings de alertas (alergias, enfermedades, medicamentos)
 *
 * Contrato:
 * - Todas las métricas son derivadas (useMemo) — cero efectos secundarios
 * - Null-safe: todo funciona aunque no haya datos
 * - No depende de stores globales (recibe datos por props)
 */
import { useMemo } from 'react'
import { agendaStorageService } from '../../agenda/services/agendaStorageService'
import { formatearCLP } from '../../../utils/formatoMoneda'

const parseFecha = (fecha) => {
  if (!fecha) return null
  if (fecha instanceof Date) return fecha
  // Manejar formato "DD-MM-YYYY HH:MM" y ISO string
  if (typeof fecha === 'string') {
    if (fecha.includes('T')) return new Date(fecha)
    const m = fecha.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/)
    if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`)
  }
  return null
}

const diasEntre = (fecha1, fecha2) => {
  if (!fecha1 || !fecha2) return null
  const ms = fecha2.getTime() - fecha1.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export const useMetricasClinicas = ({
  paciente,
  evolucionesNotas = [],
  itemsPresupuesto = [],
  abonos = [],
}) => {
  return useMemo(() => {
    const hoy = new Date()

    // 1. Métricas de visitas (desde evolucionesNotas)
    const fechasEvoluciones = evolucionesNotas
      .map((e) => parseFecha(e.fecha))
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())

    const ultimaVisita = fechasEvoluciones[0] || null
    const diasDesdeUltimaVisita = diasEntre(ultimaVisita, hoy)
    const totalVisitas = evolucionesNotas.length

    // 2. Próxima cita (desde agenda)
    let proximaCita = null
    try {
      if (paciente?.id && agendaStorageService?.obtenerCitas) {
        const todasCitas = agendaStorageService.obtenerCitas() || []
        const citasPaciente = todasCitas
          .filter(
            (c) =>
              String(c.pacienteId) === String(paciente.id) &&
              c.estado !== 'Cancelada' &&
              c.fecha
          )
          .map((c) => ({ ...c, _fechaObj: parseFecha(c.fecha) }))
          .filter((c) => c._fechaObj && c._fechaObj >= new Date(hoy.toDateString()))
          .sort((a, b) => a._fechaObj.getTime() - b._fechaObj.getTime())

        if (citasPaciente[0]) {
          proximaCita = {
            fecha: citasPaciente[0].fecha,
            hora: citasPaciente[0].hora || null,
            box: citasPaciente[0].boxAsignado || null,
            motivo: citasPaciente[0].motivo || null,
          }
        }
      }
    } catch {
      // agendaStorageService no disponible — continuar sin métrica
    }

    // 3. Métricas de presupuesto
    const presupuestoTotal = itemsPresupuesto.reduce((sum, i) => sum + (Number(i.valor) || 0), 0)
    const presupuestoPagado = abonos.reduce((sum, a) => sum + (Number(a.monto) || 0), 0)
    const presupuestoPendiente = Math.max(0, presupuestoTotal - presupuestoPagado)

    // 4. Progreso de tratamiento (% realizados)
    const totalItems = itemsPresupuesto.length
    const itemsRealizados = itemsPresupuesto.filter((i) => i.estado === 'Realizado').length
    const progresoTratamiento =
      totalItems > 0 ? Math.round((itemsRealizados / totalItems) * 100) : 0

    // 5. Alertas activas (clínica)
    const alertasActivas = []
    if (paciente?.alergias && paciente.alergias.trim() && paciente.alergias !== 'Ninguna') {
      alertasActivas.push({ tipo: 'alergia', texto: paciente.alergias })
    }
    if (paciente?.enfermedades && paciente.enfermedades.trim()) {
      alertasActivas.push({ tipo: 'enfermedad', texto: paciente.enfermedades })
    }
    if (paciente?.medicamentos && paciente.medicamentos.trim()) {
      alertasActivas.push({ tipo: 'medicamento', texto: paciente.medicamentos })
    }

    return {
      ultimaVisita,
      diasDesdeUltimaVisita,
      totalVisitas,
      proximaCita,
      presupuestoTotal,
      presupuestoPagado,
      presupuestoPendiente,
      presupuestoTotalFormateado: formatearCLP(presupuestoTotal),
      presupuestoPendienteFormateado: formatearCLP(presupuestoPendiente),
      progresoTratamiento,
      itemsRealizados,
      totalItems,
      alertasActivas,
    }
  }, [paciente, evolucionesNotas, itemsPresupuesto, abonos])
}
