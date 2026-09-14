import React, { memo, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { certificadosStorageService } from '../services/certificadosStorageService'
import { imprimirCertificadoAislado } from '../services/certificadosPrintService'
import { generarPDFCertificado, respaldarCertificadoEnR2, descargarBlob, descargarCertificadoDesdeR2 } from '../services/certificadosPDFService'
import { useAutoRespaldoCertificados } from '../hooks/useAutoRespaldoCertificados'
import { usePapeleraCertificados } from '../hooks/usePapeleraCertificados'
import { ModalPapeleraCertificados } from './ModalPapeleraCertificados'
import { FormularioNuevoCertificado } from './FormularioNuevoCertificado'
import { CertificadoImprimible } from './CertificadoImprimible'
import { createLogger } from '../../../services/logger'
import { useAppDialog } from '../../../hooks/useAppDialog'

const log = createLogger('CertificadosSection')

/**
 * Sección de Certificados Médicos (F6-D-6 refactor, M2c auto-respaldo)
 *
 * Componente padre que renderiza:
 * - FormularioNuevoCertificado
 * - Historial de certificados emitidos (con mini-badge 🔒 si respaldado)
 * - Preview del certificado seleccionado (con badge grande de estado R2)
 * - Portal de impresión aislada (M2a)
 */
export const CertificadosSection = memo(({
  paciente,
  userProfile,
  certificados = [],
  setCertificados: setCertificadosProp = () => {}
}) => {
  // Estabilizar setCertificados para evitar re-renders masivos
  const setCertificados = useCallback((nuevos) => {
    setCertificadosProp(nuevos)
  }, [setCertificadosProp])

  const [certSeleccionadoVer, setCertSeleccionadoVer] = useState(null)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const { confirm, alert } = useAppDialog()

  // useMemo para estabilizar referencia (evita disparar useEffect en cada render)
  const listaCertificados = useMemo(
    () => (Array.isArray(certificados) ? certificados : []),
    [certificados]
  )

  const {
    papeleraAbierta,
    abrirPapelera,
    cerrarPapelera,
    certificadosActivos,
    hayEliminados,
    moverAPapelera,
    restaurar,
    eliminarDefinitivo
  } = usePapeleraCertificados(paciente.id, certificados, setCertificados)

  const { respaldandoIds, idsConError, reintentarRespaldo } = useAutoRespaldoCertificados(
    listaCertificados,
    paciente.id,
    setCertificados
  )

  const handleGenerarCertificado = (nuevoCertificado) => {
    const actualizados = [nuevoCertificado, ...listaCertificados]
    setCertificados(actualizados)
    certificadosStorageService.guardarCertificados(paciente.id, actualizados).catch(err => log.warn("Error al guardar:", err))
    setCertSeleccionadoVer(nuevoCertificado)
  }

  const handleEliminarCertificado = async (id) => {
    const ok = await confirm({
      title: 'Mover a papelera',
      description: 'El certificado se moverá a la papelera. Podrás restaurarlo o eliminarlo definitivamente después (se conservará 730 días).',
      variant: 'danger',
      confirmText: 'Mover a papelera'
    })
    if (ok) {
      const movido = await moverAPapelera(id)
      if (movido && certSeleccionadoVer?.id === id) setCertSeleccionadoVer(null)
    }
  }

  const handleVerCertificado = (cert) => {
    setCertSeleccionadoVer(cert)
    setTimeout(() => {
      document.getElementById('certificado-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const handleDescargarPDF = async () => {
    if (!certAMostrar || generandoPDF) return
    setGenerandoPDF(true)
    try {
      const nombre = `certificado-${certAMostrar.tipo}-${(certAMostrar.fechaEmision || '').replace(/\//g, '-')}.pdf`

      if (certAMostrar.r2ArchivoId) {
        const ok = await descargarCertificadoDesdeR2(certAMostrar.r2ArchivoId, nombre)
        if (ok) {
          await alert({ title: 'PDF descargado', description: 'El certificado se descargó desde R2 Cloudflare.', variant: 'success', confirmText: 'Entendido' })
          return
        }
        log.warn('Descarga desde R2 falló, regenerando PDF local')
      }

      const nodo = document.getElementById('certificado-preview')
      const blob = await generarPDFCertificado(nodo)
      if (!blob) throw new Error('No se pudo generar el blob PDF')

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

  const certAMostrar = certSeleccionadoVer || (certificadosActivos.length > 0 ? certificadosActivos[0] : null)

  const estadoRespaldo = certAMostrar
    ? respaldandoIds.has(certAMostrar.id)
      ? 'respaldando'
      : certAMostrar.r2ArchivoId
        ? 'respaldado'
        : idsConError.has(certAMostrar.id)
          ? 'error'
          : 'pendiente'
    : null

  return (
    <div className="space-y-6">
      <FormularioNuevoCertificado 
        userProfile={userProfile} 
        onGenerarCertificado={handleGenerarCertificado} 
      />

      {/* Sección Papelera - siempre visible */}
      <div className="bg-white p-3 border border-gray-200 rounded-2xl print:hidden flex justify-between items-center">
        <span className="text-xs text-gray-600">
          {hayEliminados
            ? 'Hay certificados en papelera'
            : 'Papelera vacía'}
        </span>
        <button
          onClick={abrirPapelera}
          disabled={!hayEliminados}
          className="text-xs bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          title={hayEliminados ? 'Abrir papelera' : 'No hay certificados en papelera'}
        >
          🗑️ Papelera
        </button>
      </div>

      {certificadosActivos.length > 0 && (
        <div className="bg-white p-4 border border-gray-200 rounded-2xl print:hidden">
          <h4 className="font-bold text-xs text-gray-800 mb-3 uppercase tracking-wider">Historial de Certificados Emitidos ({certificadosActivos.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {certificadosActivos.map(c => (
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
                  {c.r2ArchivoId && <span className="ml-2" title="Respaldado en R2">🔒</span>}
                  {respaldandoIds.has(c.id) && <span className="ml-2" title="Respaldando...">⏳</span>}
                  {idsConError.has(c.id) && <span className="ml-2" title="Error al respaldar">❌</span>}
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

      {certAMostrar ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center print:hidden">
            <div className="flex items-center gap-2">
              {estadoRespaldo === 'respaldado' && (
                <span className="text-xs bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                  🔒 Respaldado en R2
                </span>
              )}
              {estadoRespaldo === 'respaldando' && (
                <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1 animate-pulse">
                  ⏳ Respaldando en R2...
                </span>
              )}
              {estadoRespaldo === 'error' && (
                <button
                  onClick={() => reintentarRespaldo(certAMostrar.id)}
                  className="text-xs bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1 hover:bg-red-200"
                >
                  ❌ Sin respaldo — Click para reintentar
                </button>
              )}
              {estadoRespaldo === 'pendiente' && (
                <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1 rounded-full font-semibold">
                  Pendiente de respaldo
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDescargarPDF}
                disabled={generandoPDF || estadoRespaldo === 'respaldando'}
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

      {certAMostrar && createPortal(
        <div className="certificado-print-portal">
          <CertificadoImprimible cert={certAMostrar} paciente={paciente} />
        </div>,
        document.body
      )}

      {papeleraAbierta && (
        <ModalPapeleraCertificados
          pacienteId={paciente.id}
          alCerrar={cerrarPapelera}
          onRestaurar={restaurar}
          onEliminar={eliminarDefinitivo}
          onAccionCompletada={() => {}}
        />
      )}
    </div>
  )
})

CertificadosSection.displayName = 'CertificadosSection'
