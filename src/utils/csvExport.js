/**
 * CSV Export Utils — F7-27
 *
 * Exporta datos de agenda a formato CSV para descarga.
 * Maneja caracteres especiales (UTF-8 BOM para Excel).
 *
 * Uso:
 *   import { exportarCitasCSV } from '../utils/csvExport'
 *
 *   exportarCitasCSV(citas, 'agenda_2026-09-24.csv')
 */

/**
 * Escapa un valor para CSV (maneja comillas, saltos de línea, comas).
 *
 * @param {any} valor - Valor a escapar
 * @returns {string} Valor escapado para CSV
 */
const escaparValorCSV = (valor) => {
  if (valor === null || valor === undefined) return ''

  const str = String(valor)

  // Si contiene comillas, comas o saltos de línea, envolver en comillas
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }

  return str
}

/**
 * Formatea una cita para exportación a CSV.
 *
 * @param {Object} cita - Cita a formatear
 * @returns {Object} Cita formateada con campos legibles
 */
export const formatearCitaParaCSV = (cita) => {
  return {
    'Fecha': cita.fecha || '',
    'Hora': cita.horaInicio || '',
    'Paciente': cita.pacienteNombre || 'Sin nombre',
    'RUT': cita.pacienteRut || '',
    'Teléfono': cita.pacienteTelefono || '',
    'Tratamiento': cita.trataMiento || '',
    'Box': cita.boxAsignado || '',
    'Estado': cita.estado || '',
    'ID': cita.id || '',
  }
}

/**
 * Exporta un array de citas a CSV y descarga el archivo.
 *
 * @param {Array} citas - Array de citas a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export const exportarCitasCSV = (citas, filename = 'agenda') => {
  if (!Array.isArray(citas) || citas.length === 0) {
    console.warn('exportarCitasCSV: No hay citas para exportar')
    return
  }

  const citasFormateadas = citas.map(formatearCitaParaCSV)
  const headers = Object.keys(citasFormateadas[0])

  // Construir CSV
  const lineas = [
    headers.map(escaparValorCSV).join(','),
    ...citasFormateadas.map((cita) =>
      headers.map((header) => escaparValorCSV(cita[header])).join(',')
    ),
  ]

  const csvContent = lineas.join('\n')

  // Agregar BOM UTF-8 para que Excel reconozca caracteres especiales
  const BOM = '\uFEFF'
  const csvFinal = BOM + csvContent

  // Crear blob y descargar
  const blob = new Blob([csvFinal], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Liberar URL después de 1 segundo
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
