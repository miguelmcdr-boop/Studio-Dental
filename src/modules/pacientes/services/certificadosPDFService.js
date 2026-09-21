import { solicitaUrlUpload, subeArchivoAR2, solicitaUrlDownload, descargaArchivoDeR2 } from '../../../services/r2ArchivosService'
import { createLogger } from '../../../services/logger'

const log = createLogger('certificadosPDFService')

// Letter: 8.5in x 11in = 215.9mm x 279.4mm
// E2: lazy load de dependencias pesadas (~300 kB)
// html2canvas-pro y jspdf solo se cargan al primer uso, no en el bundle inicial
let _html2canvas = null
let _jsPDF = null
const getHtml2canvas = async () => {
  if (!_html2canvas) _html2canvas = (await import('html2canvas-pro')).default
  return _html2canvas
}
const getJsPDF = async () => {
  if (!_jsPDF) ({ jsPDF: _jsPDF } = await import('jspdf'))
  return _jsPDF
}

export const LETTER_MM = { ancho: 215.9, alto: 279.4 }

/**
 * Genera un PDF Letter del certificado capturando el nodo DOM (M2b).
 * Usa html2canvas-pro que soporta colores oklch de Tailwind v4.
 * @param {HTMLElement} nodoDOM — contenedor del documento a capturar
 * @returns {Promise<Blob|null>} blob PDF o null si falla
 */
export const generarPDFCertificado = async (nodoDOM) => {
  console.log('[TRACE-PDF-1] generarPDFCertificado: inicio | nodo =', !!nodoDOM)
  if (!nodoDOM) {
    console.log('[TRACE-PDF-2] ERROR: nodo DOM no encontrado')
    log.error('generarPDFCertificado: nodo DOM no encontrado')
    return null
  }

  try {
    console.log('[TRACE-PDF-3] Llamando html2canvas')
    const canvas = await (await getHtml2canvas())(nodoDOM, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    })

    const pdf = new (await getJsPDF())({ orientation: 'portrait', unit: 'mm', format: 'letter' })
    const img = canvas.toDataURL('image/png')

    // Ajustar al ancho de página manteniendo proporción
    const proporcion = canvas.height / canvas.width
    const anchoImg = LETTER_MM.ancho
    const altoImg = anchoImg * proporcion

    pdf.addImage(img, 'PNG', 0, 0, anchoImg, altoImg)
    return pdf.output('blob')
  } catch (e) {
    log.error('Error en generarPDFCertificado:', e)
    return null
  }
}

/**
 * Respalda el blob PDF en R2 Cloudflare vía Worker de URLs firmadas (M2b).
 * @returns {Promise<{archivoId, objectKey}|null>} referencia R2 o null si falla
 */
export const respaldarCertificadoEnR2 = async ({ blob, pacienteId, nombreArchivo }) => {
  console.log('[TRACE-R2-1] respaldarCertificadoEnR2: blob.size =', blob?.size)
  const uploadData = await solicitaUrlUpload({
    pacienteId,
    categoria: 'pdf',
    nombreArchivo,
    mimeType: 'application/pdf',
    tamanoBytes: blob.size
  })

  if (!uploadData?.upload_url) {
    log.warn('respaldarCertificadoEnR2: sin URL de upload')
    return null
  }

  const ok = await subeArchivoAR2({
    uploadUrl: uploadData.upload_url,
    uploadHeaders: uploadData.upload_headers,
    file: blob
  })

  if (!ok) {
    log.warn('respaldarCertificadoEnR2: subida falló')
    return null
  }

  return { archivoId: uploadData.archivo_id, objectKey: uploadData.r2_object_key }
}

/**
 * Descarga un blob como archivo local (M2b).
 */
export const descargarBlob = (blob, nombreArchivo) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

/**
 * Descarga el certificado desde R2 usando URL firmada (M2c).
 * Más rápido que regenerar el PDF localmente.
 * @param {string} archivoId — UUID del archivo en archivos_clinicos
 * @param {string} nombreArchivo — nombre para el download
 * @returns {Promise<boolean>} true si se descargó correctamente
 */
export const descargarCertificadoDesdeR2 = async (archivoId, nombreArchivo) => {
  if (!archivoId) {
    log.warn('descargarCertificadoDesdeR2: sin archivoId')
    return false
  }
  const downloadData = await solicitaUrlDownload(archivoId)
  if (!downloadData?.download_url) {
    log.warn('descargarCertificadoDesdeR2: sin URL de descarga')
    return false
  }
  return descargaArchivoDeR2({
    downloadUrl: downloadData.download_url,
    downloadHeaders: downloadData.download_headers || {},
    nombreArchivo
  })
}
