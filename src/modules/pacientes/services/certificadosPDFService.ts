import { solicitaUrlUpload, subeArchivoAR2, solicitaUrlDownload, descargaArchivoDeR2 } from '../../../services/r2ArchivosService'
import { createLogger } from '../../../services/logger'

const log = createLogger('certificadosPDFService')

export interface LetterDimensions {
  ancho: number
  alto: number
}

export interface RespaldarCertificadoParams {
  blob: Blob
  pacienteId: string
  nombreArchivo: string
}

export interface RespaldoCertificadoResult {
  archivoId: string
  objectKey: string
}

interface Html2CanvasOptions {
  scale?: number
  backgroundColor?: string
  useCORS?: boolean
}

type Html2CanvasFn = (element: HTMLElement, options?: Html2CanvasOptions) => Promise<HTMLCanvasElement>

interface JsPdfInstance {
  addImage: (imageData: string | HTMLCanvasElement, format: string, x: number, y: number, width: number, height: number) => void
  output: (type: 'blob') => Blob
}

type JsPdfConstructor = new (options?: {
  orientation?: 'portrait' | 'landscape'
  unit?: 'mm' | 'pt' | 'px' | 'in'
  format?: string | [number, number]
}) => JsPdfInstance

// Letter: 8.5in x 11in = 215.9mm x 279.4mm
// E2: lazy load de dependencias pesadas (~300 kB)
// html2canvas-pro y jspdf solo se cargan al primer uso, no en el bundle inicial
let _html2canvas: Html2CanvasFn | null = null
let _jsPDF: JsPdfConstructor | null = null

const getHtml2canvas = async (): Promise<Html2CanvasFn> => {
  if (!_html2canvas) {
    const mod = await import('html2canvas-pro')
    _html2canvas = mod.default as unknown as Html2CanvasFn
  }
  return _html2canvas
}

const getJsPDF = async (): Promise<JsPdfConstructor> => {
  if (!_jsPDF) {
    const mod = await import('jspdf')
    _jsPDF = mod.jsPDF as unknown as JsPdfConstructor
  }
  return _jsPDF
}

export const LETTER_MM: LetterDimensions = { ancho: 215.9, alto: 279.4 }

/**
 * Genera un PDF Letter del certificado capturando el nodo DOM (M2b).
 * Usa html2canvas-pro que soporta colores oklch de Tailwind v4.
 * @param nodoDOM — contenedor del documento a capturar
 * @returns blob PDF o null si falla
 */
export const generarPDFCertificado = async (nodoDOM: HTMLElement | null): Promise<Blob | null> => {
  if (!nodoDOM) {
    log.error('generarPDFCertificado: nodo DOM no encontrado')
    return null
  }

  try {
    const html2canvas = await getHtml2canvas()
    const canvas = await html2canvas(nodoDOM, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    })

    const JsPdf = await getJsPDF()
    const pdf = new JsPdf({ orientation: 'portrait', unit: 'mm', format: 'letter' })
    const img = canvas.toDataURL('image/png')

    // Ajustar al ancho de página manteniendo proporción
    const proporcion = canvas.height / canvas.width
    const anchoImg = LETTER_MM.ancho
    const altoImg = anchoImg * proporcion

    pdf.addImage(img, 'PNG', 0, 0, anchoImg, altoImg)
    return pdf.output('blob')
  } catch (e: unknown) {
    log.error('Error en generarPDFCertificado:', e)
    return null
  }
}

/**
 * Respalda el blob PDF en R2 Cloudflare vía Worker de URLs firmadas (M2b).
 * @returns referencia R2 o null si falla
 */
export const respaldarCertificadoEnR2 = async ({
  blob,
  pacienteId,
  nombreArchivo
}: RespaldarCertificadoParams): Promise<RespaldoCertificadoResult | null> => {
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
export const descargarBlob = (blob: Blob, nombreArchivo: string): void => {
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
 * @param archivoId — UUID del archivo en archivos_clinicos
 * @param nombreArchivo — nombre para el download
 * @returns true si se descargó correctamente
 */
export const descargarCertificadoDesdeR2 = async (
  archivoId: string | null | undefined,
  nombreArchivo: string
): Promise<boolean> => {
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
