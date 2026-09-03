import { useCallback } from 'react'
import { solicitaUrlUpload, subeArchivoAR2 } from '../../../services/r2ArchivosService'
import { validarArchivo } from './useArchivosClinicos.helpers'

/**
 * Hook interno para lógica de subida de archivos a R2.
 */
export const useArchivosClinicosUploads = (
  pacienteId,
  categoriaR2,
  permisos,
  setSubiendo,
  setProgreso,
  setError,
  recargar
) => {
  const subirArchivos = useCallback(async (files) => {
    if (!pacienteId || !permisos.puedeSubir) return

    const archivosArray = Array.from(files)
    if (archivosArray.length === 0) return

    setError(null)
    setSubiendo(true)
    setProgreso(0)

    try {
      for (let i = 0; i < archivosArray.length; i++) {
        const file = archivosArray[i]

        const validacion = validarArchivo(file, permisos)
        if (!validacion.valido) {
          setError(validacion.mensaje)
          continue
        }

        const uploadData = await solicitaUrlUpload({
          pacienteId,
          categoria: categoriaR2,
          nombreArchivo: file.name,
          mimeType: file.type,
          tamanoBytes: file.size,
        })

        if (!uploadData || !uploadData.upload_url) {
          setError('No se pudo obtener URL de subida. Intenta de nuevo.')
          continue
        }

        const progresoBase = (i / archivosArray.length) * 100
        const progresoIncremento = 100 / archivosArray.length

        const exito = await subeArchivoAR2({
          uploadUrl: uploadData.upload_url,
          uploadHeaders: uploadData.upload_headers,
          file,
          onProgress: (percent) => {
            const progresoTotal = progresoBase + (percent / 100) * progresoIncremento
            setProgreso(Math.round(progresoTotal))
          },
        })

        if (!exito) {
          setError(`Error subiendo ${file.name}. Intenta de nuevo.`)
        }
      }

      setProgreso(100)
      await recargar()
    } catch (e) {
      setError(e?.message || 'Error subiendo archivos.')
    } finally {
      setSubiendo(false)
      setTimeout(() => setProgreso(0), 1000)
    }
  }, [pacienteId, categoriaR2, permisos, setSubiendo, setProgreso, setError, recargar])

  return { subirArchivos }
}
