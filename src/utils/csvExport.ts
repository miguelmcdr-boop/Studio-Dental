/**
 * CSV Export Utils — F7-27 / Migración TypeScript
 *
 * Exporta datos de agenda a formato CSV para descarga con UTF-8 BOM para Excel.
 */

export interface CitaCSVInput {
  id?: string | null
  fecha?: string | null
  horaInicio?: string | null
  pacienteNombre?: string | null
  pacienteRut?: string | null
  pacienteTelefono?: string | null
  trataMiento?: string | null
  boxAsignado?: string | null
  estado?: string | null
  [key: string]: unknown
}

export interface CitaCSVFormateada {
  Fecha: string
  Hora: string
  Paciente: string
  RUT: string
  Teléfono: string
  Tratamiento: string
  Box: string
  Estado: string
  ID: string
}

/** Escapa un valor para CSV (maneja comillas, saltos de línea, comas). */
const escaparValorCSV = (valor: unknown): string => {
  if (valor === null || valor === undefined) return ''
  const str = String(valor)
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

/** Formatea una cita para exportación a CSV. */
export const formatearCitaParaCSV = (cita: CitaCSVInput): CitaCSVFormateada => ({
  'Fecha': cita?.fecha || '',
  'Hora': cita?.horaInicio || '',
  'Paciente': cita?.pacienteNombre || 'Sin nombre',
  'RUT': cita?.pacienteRut || '',
  'Teléfono': cita?.pacienteTelefono || '',
  'Tratamiento': cita?.trataMiento || '',
  'Box': cita?.boxAsignado || '',
  'Estado': cita?.estado || '',
  'ID': cita?.id || '',
})

/** Exporta un array de citas a CSV y descarga el archivo. */
export const exportarCitasCSV = (citas: CitaCSVInput[], filename: string = 'agenda'): void => {
  if (!Array.isArray(citas) || citas.length === 0) {
    console.warn('exportarCitasCSV: No hay citas para exportar')
    return
  }

  const citasFormateadas = citas.map(formatearCitaParaCSV)
  const headers = Object.keys(citasFormateadas[0]) as (keyof CitaCSVFormateada)[]

  const lineas = [
    headers.map(escaparValorCSV).join(','),
    ...citasFormateadas.map((cita) =>
      headers.map((header) => escaparValorCSV(cita[header])).join(',')
    ),
  ]

  const csvFinal = '\uFEFF' + lineas.join('\n')
  const blob = new Blob([csvFinal], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
