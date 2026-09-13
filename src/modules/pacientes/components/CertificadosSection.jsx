import React, { memo, useState } from 'react'
import { createPortal } from 'react-dom'
// F6-D-6: usar certificadosStorageService en lugar de pacientesStorageService.guardarItem
import { certificadosStorageService } from '../services/certificadosStorageService'
import { imprimirCertificadoAislado } from '../services/certificadosPrintService'
import { generarPDFCertificado, respaldarCertificadoEnR2, descargarBlob } from '../services/certificadosPDFService'
import { FormularioNuevoCertificado } from './FormularioNuevoCertificado'
import { CertificadoImprimible } from './CertificadoImprimible'
import { createLogger } from '../../../services/logger'
import { useAppDialog } from '../../../hooks/useAppDialog'

const log = createLogger('CertificadosSection')

/**
 * Sección de Certificados Médicos (F6-D-6 refactor, M2a print isolation)
 *
 * Componente padre que renderiza:
 * - FormularioNuevoCertificado (extraído para respetar límite de 285 líneas)
 * - Historial de certificados emitidos
 * - Preview del certificado seleccionado (CertificadoImprimible)
 * - Portal de impresión aislada (M2a)
 */
export const CertificadosSection = memo(({
  paciente,
  userProfile,
  certificados = [],
  setCertificados = () => {}
}) => {
  const [certSeleccionadoVer, setCertSeleccionadoVer] = useState(null)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const { confirm, alert } = useAppDialog()

  const listaCertificados = Array.isArray(certificados) ? certificados : []

  const handleGenerarCertificado = (nuevoCertificado) => {
    const actualizados = [nuevoCertificado, ...listaCertificados]
    setCertificados(actualizados)
    // F6-D-6: usar certificadosStorageService (Supabase + localStorage)
    certificadosStorageService.guardarCertificados(paciente.id, actualizados).catch(err => log.warn("Error al guardar:", err))
    setCertSeleccionadoVer(nuevoCertificado)
  }

  const handleEliminarCertificado = async (id) => {
    const ok = await confirm({
      title: 'Eliminar certificado',
      description: '¿Deseas eliminar este registro de certificado del historial?',
      variant: 'danger',
      confirmText: 'Eliminar'
    })
    if (ok) {
      const actualizados = listaCertificados.filter(c => c.id !== id)
      setCertificados(actualizados)
      // F6-D-6: usar certificadosStorageService (Supabase + localStorage)
      certificadosStorageService.guardarCertificados(paciente.id, actualizados).catch(err => log.warn("Error al guardar:", err))
      if (certSeleccionadoVer?.id === id) setCertSeleccionadoVer(null)
    }
  }

  const handleDescargarPDF = async () => {
    if (!certAMostrar || generandoPDF) return
    setGenerandoPDF(true)
    try {
      const nodo = document.getElementById('certificado-preview')
      const blob = await generarPDFCertificado(nodo)
      if (!blob) throw new Error('No se pudo generar el blob PDF')

      const nombre = `certificado-${certAMostrar.tipo}-${(certAMostrar.fechaEmision || '').replace(/\//g, '-')}.pdf`
      descargarBlob(blob, nombre)

      const respaldo = await respaldarCertificadoEnR2({ blob, pacienteId: paciente.id, nombreArchivo: nombre })
      if (respaldo) {
        const actualizados = listaCertificados.map(c =>
          c.id === certAMostrar.id ? { ...c, r2ArchivoId: respaldo.archivoId, r2ObjectKey: respaldo.objectKey } : c
        )
        setCertificados(actualizados)
        certificadosStorageService.guardarCertificados(paciente.id, actualizados).catch(err => log.warn('Error al guardar:', err))
        await alert({ title: 'PDF descargado y respaldado', description: 'El certificado se descargó y quedó respaldado en R2 Cloudflare.', variant: 'success', confirmText: 'Entendido' })
      } else {
        await alert({ title: 'PDF descargado sin respaldo', description: 'El PDF se descargó correctamente pero no se pudo respaldar en R2. Intenta de nuevo más tarde.', variant: 'warning', confirmText: 'Entendido' })
      }
    } catch (e) {
      log.error('Error generando PDF:', e)
      await alert({ title: 'Error al generar PDF', description: 'No se pudo generar el PDF del certificado. Intenta de nuevo.', variant: 'error', confirmText: 'Entendido' })
    } finally {
      setGenerandoPDF(false)
    }
  }

  const handleVerCertificado = (cert) => {
    setCertSeleccionadoVer(cert)
    setTimeout(() => {
      document.getElementById('certificado-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const certAMostrar = certSeleccionadoVer || (listaCertificados.length > 0 ? listaCertificados[0] : null)

  return (
    <div className="space-y-6">
      {/* Formulario de Emisión */}
      <FormularioNuevoCertificado 
        userProfile={userProfile} 
        onGenerarCertificado={handleGenerarCertificado} 
      />

      {/* Historial de Certificados Guardados */}
      {listaCertificados.length > 0 && (
        <div className="bg-white p-4 border border-gray-200 rounded-2xl print:hidden">
          <h4 className="font-bold text-xs text-gray-800 mb-3 uppercase tracking-wider">Historial de Certificados Emitidos ({listaCertificados.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {listaCertificados.map(c => (
              <div
                key={c.id}
                onClick={() => handleVerCertificado(c)}
                className={`p-3 rounded-xl border text-xs flex justify-between items-center cursor-pointer transition-all ${
                  certAMostrar?.id === c.id ? 'bg-black text-white border-black' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
                }`}
              >
                <div>
                  <span className="font-bold uppercase tracking-wider mr-2">
                    {c.tipo === 'asistencia' ? '📋 Asistencia' : '🛌 Reposo'}
                  </span>
                  <span>({c.fechaEmision}) — {c.diagnosticoMotivo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleVerCertificado(c); }}
                    className="text-[10px] opacity-75 hover:opacity-100 underline cursor-pointer"
                  >
                    Ver/Imprimir →
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEliminarCertificado(c.id); }}
                    className="text-red-400 hover:text-red-200 font-bold ml-2"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview del Certificado Listo para Impresión Letter */}
      {certAMostrar ? (
        <div className="space-y-4">
          <div className="flex justify-end print:hidden">
            <button
              onClick={handleDescargarPDF}
              disabled={generandoPDF}
              className="bg-gray-100 text-gray-800 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-200 border border-gray-300 shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {generandoPDF ? '⏳ Generando PDF...' : '📥 Descargar PDF'}
            </button>
            <button
              onClick={imprimirCertificadoAislado}
              className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 shadow-sm flex items-center gap-2"
            >
              🖨️ Imprimir Certificado Oficial (Letter)
            </button>
          </div>

          <div id="certificado-preview">
            <CertificadoImprimible cert={certAMostrar} paciente={paciente} />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-xs text-gray-500 print:hidden">
          No hay certificados emitidos para este paciente. Completa el formulario superior para generar uno.
        </div>
      )}

      {/* Portal de impresión aislada (M2a): solo visible al imprimir */}
      {certAMostrar && createPortal(
        <div className="certificado-print-portal">
          <CertificadoImprimible cert={certAMostrar} paciente={paciente} />
        </div>,
        document.body
      )}
    </div>
  )
})

CertificadosSection.displayName = 'CertificadosSection'
