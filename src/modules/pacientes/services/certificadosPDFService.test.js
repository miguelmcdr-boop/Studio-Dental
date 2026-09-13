import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generarPDFCertificado, respaldarCertificadoEnR2, descargarBlob } from './certificadosPDFService'
import { solicitaUrlUpload, subeArchivoAR2 } from '../../../services/r2ArchivosService'

// Mocks estables fuera de factory (sobreviven a mockClear)
const mockAddImage = vi.fn()
const mockOutput = vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' }))

vi.mock('html2canvas-pro', () => ({
  default: vi.fn(async () => ({
    toDataURL: () => 'data:image/png;base64,iVBOR',
    width: 800,
    height: 1000
  }))
}))

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => ({ addImage: mockAddImage, output: mockOutput }))
}))

vi.mock('../../../services/r2ArchivosService', () => ({
  solicitaUrlUpload: vi.fn(),
  subeArchivoAR2: vi.fn()
}))

describe('certificadosPDFService (M2b)', () => {
  beforeEach(() => {
    // Limpiar llamadas SIN tocar las implementaciones (clave)
    mockAddImage.mockClear()
    mockOutput.mockClear()
    vi.mocked(solicitaUrlUpload).mockClear()
    vi.mocked(subeArchivoAR2).mockClear()
  })

  describe('generarPDFCertificado', () => {
    it('retorna null si no hay nodo DOM', async () => {
      const result = await generarPDFCertificado(null)
      expect(result).toBeNull()
    })

    it('genera blob PDF desde el nodo', async () => {
      const nodo = document.createElement('div')
      const blob = await generarPDFCertificado(nodo)
      expect(blob).toBeTruthy()
      expect(blob.type).toBe('application/pdf')
      expect(mockAddImage).toHaveBeenCalled()
      expect(mockOutput).toHaveBeenCalledWith('blob')
    })
  })

  describe('respaldarCertificadoEnR2', () => {
    it('retorna referencia R2 cuando la subida es exitosa', async () => {
      solicitaUrlUpload.mockResolvedValue({
        upload_url: 'https://r2/upload',
        upload_headers: { 'x-header': '1' },
        archivo_id: 'arch-123',
        r2_object_key: 'pdf/cert.pdf'
      })
      subeArchivoAR2.mockResolvedValue(true)

      const blob = new Blob(['pdf'], { type: 'application/pdf' })
      const result = await respaldarCertificadoEnR2({ blob, pacienteId: 'pac-1', nombreArchivo: 'cert.pdf' })

      expect(result).toEqual({ archivoId: 'arch-123', objectKey: 'pdf/cert.pdf' })
      expect(solicitaUrlUpload).toHaveBeenCalledWith(expect.objectContaining({ categoria: 'pdf', mimeType: 'application/pdf' }))
    })

    it('retorna null si no hay URL de upload', async () => {
      solicitaUrlUpload.mockResolvedValue(null)
      const blob = new Blob(['pdf'], { type: 'application/pdf' })
      const result = await respaldarCertificadoEnR2({ blob, pacienteId: 'pac-1', nombreArchivo: 'cert.pdf' })
      expect(result).toBeNull()
    })

    it('retorna null si la subida falla', async () => {
      solicitaUrlUpload.mockResolvedValue({ upload_url: 'https://r2/upload', upload_headers: {} })
      subeArchivoAR2.mockResolvedValue(false)
      const blob = new Blob(['pdf'], { type: 'application/pdf' })
      const result = await respaldarCertificadoEnR2({ blob, pacienteId: 'pac-1', nombreArchivo: 'cert.pdf' })
      expect(result).toBeNull()
    })
  })

  describe('descargarBlob', () => {
    it('crea URL, dispara click y revoca la URL', () => {
      const createObjectURL = vi.fn(() => 'blob:test')
      const revokeObjectURL = vi.fn()
      window.URL.createObjectURL = createObjectURL
      window.URL.revokeObjectURL = revokeObjectURL

      const blob = new Blob(['pdf'], { type: 'application/pdf' })
      descargarBlob(blob, 'cert.pdf')

      expect(createObjectURL).toHaveBeenCalled()
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
    })
  })
})
