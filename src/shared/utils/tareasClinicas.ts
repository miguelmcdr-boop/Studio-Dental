/**
 * Tareas Clínicas Utils — F7-27
 *
 * Detecta tareas clínicas pendientes para el Dashboard.
 * Tipos: recetas por emitir, certificados pendientes, evoluciones faltantes.
 *
 * Uso:
 *   import { obtenerTareasClinicas } from './tareasClinicas'
 *
 *   const tareas = obtenerTareasClinicas(citas, evoluciones, recetas)
 */

export interface CitaParaTareas {
  id?: string | number
  fecha?: string
  estado?: string
  pacienteId?: string | number | null
  pacienteNombre?: string
  trataMiento?: string
  solicitoCertificado?: boolean
  [key: string]: unknown
}

export interface RecetaParaTareas {
  fechaEmision?: string
  fecha?: string
  pacienteId?: string | number | null
  [key: string]: unknown
}

export interface CertificadoParaTareas {
  fechaEmision?: string
  fecha?: string
  pacienteId?: string | number | null
  [key: string]: unknown
}

export interface EvolucionParaTareas {
  fecha?: string
  pacienteId?: string | number | null
  [key: string]: unknown
}

export type TipoTareaClinica = 'receta_pendiente' | 'certificado_pendiente' | 'evolucion_pendiente'

export interface TareaClinicaItem {
  tipo: TipoTareaClinica
  completada: boolean
  titulo: string
  descripcion: string
  fecha?: string
  citaId?: string | number
  pacienteId?: string | number | null
}

/**
 * Obtiene tareas de recetas por emitir (pacientes con consulta hoy sin receta).
 */
const obtenerTareasRecetas = (
  citas: CitaParaTareas[] = [],
  recetas: RecetaParaTareas[] = []
): TareaClinicaItem[] => {
  const hoy = new Date().toISOString().split('T')[0]

  const citasHoy = citas.filter((c) => c.fecha === hoy && (c.estado === 'Completado' || c.estado === 'Atendido' || c.estado === 'Realizado'))

  const recetasHoy = recetas.filter((r) => {
    const fechaReceta = r.fechaEmision || r.fecha
    return fechaReceta === hoy
  })

  const pacienteIdsConReceta = new Set(recetasHoy.map((r) => r.pacienteId))

  return citasHoy
    .filter((cita) => !pacienteIdsConReceta.has(cita.pacienteId))
    .map((cita) => ({
      tipo: 'receta_pendiente',
      completada: false,
      titulo: 'Emitir receta médica',
      descripcion: `${cita.pacienteNombre || 'Paciente'} - ${cita.trataMiento || 'Sin tratamiento'}`,
      fecha: cita.fecha,
      citaId: cita.id,
      pacienteId: cita.pacienteId,
    }))
}

/**
 * Obtiene tareas de certificados pendientes (pacientes solicitaron pero no se emitieron).
 */
const obtenerTareasCertificados = (
  citas: CitaParaTareas[] = [],
  certificados: CertificadoParaTareas[] = []
): TareaClinicaItem[] => {
  const hoy = new Date().toISOString().split('T')[0]

  const citasHoy = citas.filter((c) => c.fecha === hoy && c.solicitoCertificado)

  const certificadosHoy = certificados.filter((c) => {
    const fechaCert = c.fechaEmision || c.fecha
    return fechaCert === hoy
  })

  const pacienteIdsConCertificado = new Set(certificadosHoy.map((c) => c.pacienteId))

  return citasHoy
    .filter((cita) => !pacienteIdsConCertificado.has(cita.pacienteId))
    .map((cita) => ({
      tipo: 'certificado_pendiente',
      completada: false,
      titulo: 'Emitir certificado',
      descripcion: `${cita.pacienteNombre || 'Paciente'} - Solicitó certificado`,
      fecha: cita.fecha,
      citaId: cita.id,
      pacienteId: cita.pacienteId,
    }))
}

/**
 * Obtiene tareas de evoluciones clínicas faltantes (citas finalizadas sin nota).
 */
const obtenerTareasEvoluciones = (
  citas: CitaParaTareas[] = [],
  evoluciones: EvolucionParaTareas[] = []
): TareaClinicaItem[] => {
  const hoy = new Date().toISOString().split('T')[0]

  const citasHoy = citas.filter((c) => c.fecha === hoy && (c.estado === 'Completado' || c.estado === 'Atendido' || c.estado === 'Realizado'))

  const evolucionesHoy = evoluciones.filter((e) => {
    const fechaEvol = e.fecha
    return fechaEvol === hoy
  })

  const pacienteIdsConEvolucion = new Set(evolucionesHoy.map((e) => e.pacienteId))

  return citasHoy
    .filter((cita) => !pacienteIdsConEvolucion.has(cita.pacienteId))
    .map((cita) => ({
      tipo: 'evolucion_pendiente',
      completada: false,
      titulo: 'Registrar evolución clínica',
      descripcion: `${cita.pacienteNombre || 'Paciente'} - Cita finalizada sin nota`,
      fecha: cita.fecha,
      citaId: cita.id,
      pacienteId: cita.pacienteId,
    }))
}

/**
 * Obtiene todas las tareas clínicas pendientes consolidadas.
 */
export const obtenerTareasClinicas = (
  citas: CitaParaTareas[] = [],
  evoluciones: (EvolucionParaTareas | unknown)[] = [],
  recetas: (RecetaParaTareas | unknown)[] = [],
  certificados: (CertificadoParaTareas | unknown)[] = []
): TareaClinicaItem[] => {
  const tareasRecetas = obtenerTareasRecetas(citas, recetas as RecetaParaTareas[])
  const tareasCertificados = obtenerTareasCertificados(citas, certificados as CertificadoParaTareas[])
  const tareasEvoluciones = obtenerTareasEvoluciones(citas, evoluciones as EvolucionParaTareas[])

  return [...tareasRecetas, ...tareasCertificados, ...tareasEvoluciones]
}
