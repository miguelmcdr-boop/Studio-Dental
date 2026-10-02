import { describe, it, expect, vi } from 'vitest'
import { descargarArchivoBackupJSON, convertirImagenADataURL } from './configuracionCalculations'

describe('configuracionCalculations', () => {
  describe('descargarArchivoBackupJSON', () => {
    it('crea un elemento anchor con los datos codificados y simula el click', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild')
      const mockClick = vi.fn()
      const origCreate = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        const el = origCreate(tag)
        if (tag === 'a') {
          el.click = mockClick
        }
        return el
      })

      descargarArchivoBackupJSON({ test: 123 }, 'backup.json')

      expect(mockClick).toHaveBeenCalled()
      appendChildSpy.mockRestore()
    })
  })

  describe('convertirImagenADataURL', () => {
    it('resuelve el dataURL de un blob de prueba', async () => {
      const blob = new Blob(['fake image content'], { type: 'image/png' })
      const result = await convertirImagenADataURL(blob)
      expect(typeof result).toBe('string')
      expect(result).toContain('data:image/png;base64,')
    })
  })
})
