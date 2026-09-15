import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import { solicitaUrlUpload, subeArchivoAR2, solicitaUrlDownload, descargaArchivoDeR2 } from '../../../services/r2ArchivosService'
import { createLogger } from '../../../services/logger'

const log = createLogger('consentimientosPDFService')

// Letter: 8.5in x 11in = 215.9mm x 279.4mm
export const LETTER_MM = { ancho: 215.9, alto: 279.4 }

/**
 * Genera un PDF Letter del consentimiento capturando el nodo DOM (M4a).
 * Usa html2canvas-pro que soporta colores oklch de Tailwind v4.
 * @param {HTMLElement} nodoDOM — contenedor del consentimiento a capturar
 * @returns {Promise<Blob|null>} blob PDF o null si falla
 */
export const generarPDFConsentimiento = async (nodoDOM) => {
  if (!nodoDOM) {
    log.error('generarPDFConsentimiento: nodo DOM no encontrado')
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

    const proporcion = canvas.height / canvas.width
    const anchoImg = LETTER_MM.ancho
    const altoImg = anchoImg * proporcion

    pdf.addImage(img, 'PNG', 0, 0, anchoImg, altoImg)
    return pdf.output('blob')
  } catch (e) {
    log.error('Error en generarPDFConsentimiento:', e)
    return null
  }
}

/**
 * Respalda el blob PDF en R2 Cloudflare con categoría 'consentimiento' (M4a).
 * @returns {Promise<{archivoId, objectKey}|null>} referencia R2 o null si falla
 */
export const respaldarConsentimientoEnR2 = async ({ blob, pacienteId, nombreArchivo }) => {
  if (!blob || !pacienteId || !nombreArchivo) {
    log.warn('respaldarConsentimientoEnR2: parámetros inválidos')
    return null
  }

  const uploadData = await solicitaUrlUpload({
    pacienteId,
    categoria: 'consentimiento',
    nombreArchivo,
    mimeType: 'application/pdf',
    tamanoBytes: blob.size
  })

  if (!uploadData?.upload_url) {
    log.warn('respaldarConsentimientoEnR2: sin URL de upload')
    return null
  }

  const ok = await subeArchivoAR2({
    uploadUrl: uploadData.upload_url,
    uploadHeaders: uploadData.upload_headers,
    file: blob
  })

  if (!ok) {
    log.warn('respaldarConsentimientoEnR2: subida falló')
    return null
  }

  return { archivoId: uploadData.archivo_id, objectKey: uploadData.r2_object_key }
}

/**
 * Descarga un blob como archivo local (M4a).
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
 * Descarga el consentimiento desde R2 usando URL firmada (M4a).
 * @param {string} archivoId — UUID del archivo en archivos_clinicos
 * @param {string} nombreArchivo — nombre para el download
 * @returns {Promise<boolean>} true si se descargó correctamente
 */
export const descargarConsentimientoDesdeR2 = async (archivoId, nombreArchivo) => {
  if (!archivoId) {
    log.warn('descargarConsentimientoDesdeR2: sin archivoId')
    return false
  }
  const downloadData = await solicitaUrlDownload(archivoId)
  if (!downloadData?.download_url) {
    log.warn('descargarConsentimientoDesdeR2: sin URL de descarga')
    return false
  }
  return descargaArchivoDeR2({
    downloadUrl: downloadData.download_url,
    downloadHeaders: downloadData.download_headers || {},
    nombreArchivo
  })
}

/**
 * M4a: Genera PDF renderizando un componente React en un contenedor temporal.
 * Extraído de useConsentimientosPDF para cumplir límite constitucional.
 *
 * @param {Function} Componente — componente React a renderizar
 * @param {Object} props — props del componente
 * @returns {Promise<Blob|null>} blob PDF o null si falla
 */
export const generarPDFDesdeComponente = async (Componente, props) => {
  try {
    // Crear contenedor temporal oculto
    const contenedor = document.createElement('div')
    contenedor.style.position = 'absolute'
    contenedor.style.left = '-9999px'
    contenedor.style.top = '0'
    document.body.appendChild(contenedor)

    // Renderizar el componente (usando React DOM)
    const ReactDOM = await import('react-dom/client')
    const root = ReactDOM.createRoot(contenedor)
    root.render(<Componente {...props} />)

    // Esperar a que se renderice
    await new Promise(resolve => setTimeout(resolve, 100))

    // Generar PDF
    const nodo = contenedor.firstChild
    const blob = await generarPDFConsentimiento(nodo)

    // Limpiar
    root.unmount()
    document.body.removeChild(contenedor)

    return blob
  } catch (e) {
    log.error('Error en generarPDFDesdeComponente:', e)
    return null
  }
}
