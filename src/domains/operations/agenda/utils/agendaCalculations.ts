import { obtenerFechaLocalISO } from '../../../../utils/dateUtils'

export interface CitaAgendaCalc {
  id?: string | number
  boxId?: string
  fechaIso?: string
  fecha?: string
  horaInicio?: string
  horaFin?: string
  estado?: string
  [key: string]: unknown
}

export interface ResumenAgenda {
  totalHoy: number
  agendadosCount: number
  enEsperaCount: number
  enSillonCount: number
  finalizadosCount: number
  citasHoy: CitaAgendaCalc[]
}

export const verificarDisponibilidadBox = (
  citas: CitaAgendaCalc[] = [],
  boxId: string,
  fechaIso: string,
  horaInicio: string,
  idExcluir: string | number | null = null
): boolean => {
  return !citas.some(c => {
    if (idExcluir && String(c.id) === String(idExcluir)) return false
    if (c.boxId !== boxId || c.fechaIso !== fechaIso || c.estado === 'NoAsiste') return false
    return Boolean(c.horaInicio && c.horaFin && horaInicio >= c.horaInicio && horaInicio < c.horaFin)
  })
}

export const calcularResumenAgenda = (citas: CitaAgendaCalc[] = []): ResumenAgenda => {
  const hoyIso = obtenerFechaLocalISO()
  const citasHoy = citas.filter(c => c.fechaIso === hoyIso || c.fecha === new Date().toLocaleDateString('es-CL'))

  let agendadosCount = 0
  let enEsperaCount = 0
  let enSillonCount = 0
  let finalizadosCount = 0

  citasHoy.forEach(c => {
    if (c.estado === 'Agendado') agendadosCount++
    if (c.estado === 'EnEspera') enEsperaCount++
    if (c.estado === 'EnSillon') enSillonCount++
    if (c.estado === 'Finalizado') finalizadosCount++
  })

  return {
    totalHoy: citasHoy.length,
    agendadosCount,
    enEsperaCount,
    enSillonCount,
    finalizadosCount,
    citasHoy
  }
}
