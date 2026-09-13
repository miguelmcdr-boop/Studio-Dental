import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import { solicitaUrlUpload, subeArchivoAR2 } from '../../../services/r2ArchivosService'
import { createLogger } from '../../../services/logger'

const log = createLogger('certificadosPDFService')

// Letter: 8.5in x 11in = 215.9mm x 279.4mm
export const LETTER_MM = { ancho: 215.9, alto: 279.4 }

/**
 * Genera un PDF Letter del certificado capturando el nodo DOM (M2b).
 * Usa html2canvas-pro que soporta colores oklch de Tailwind v4.
 * @param {HTMLElement} nodoDOM — contenedor del documento a capturar
 * @returns {Promise<Blob|null>} blob PDF o null si falla
 */
export const generarPDFCertificado = async (nodoDOM) => {
  if (!nodoDOM) {
    log.error('generarPDFCertificado: nodo DOM no encontrado')
    return null
  }

  try {
    const canvas = await html2canvas(nodoDOM, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    })

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
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
