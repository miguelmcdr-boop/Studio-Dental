import React, { memo } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { useAppDialog } from '../../../hooks/useAppDialog'
import { diasRestantes } from '../services/papeleraCertificadosService'

/**
 * Modal de Papelera de Certificados (M3)
 *
 * SOLUCIÓN FINAL: Modal es CONTROLADO. Recibe certificados como prop
 * y delega TODAS las operaciones al padre vía callbacks.
 * NO tiene estado propio de certificados.
 */
export const ModalPapeleraCertificados = memo(({
  alCerrar,
  certificadosEliminados = [],
  onRestaurar,
  onEliminar,
  onVaciar
}) => {
  console.log('[TRACE-MODAL] Render con', certificadosEliminados.length, 'certs:', certificadosEliminados.map(c => ({
    id: c.id,
    tipo: c.tipo,
    eliminadoAt: c.eliminadoAt,
    fechaEmision: c.fechaEmision,
    r2ArchivoId: c.r2ArchivoId ? 'SI' : 'NO'
  })))
  
  const { confirm, alert } = useAppDialog()

  const handleRestaurar = async (certId) => {
    const ok = await onRestaurar(certId)
    if (ok) {
      await alert({
        title: 'Certificado restaurado',
        description: 'El certificado ha sido restaurado exitosamente.',
        variant: 'success',
        confirmText: 'Entendido'
      })
    }
  }

  const handleEliminarDefinitivo = async (certId) => {
    const cert = certificadosEliminados.find(c => String(c.id) === String(certId))
    const ok = await confirm({
      title: 'Eliminar definitivamente',
      description: `Esto eliminará el certificado de forma permanente${cert?.r2ArchivoId ? ' (incluyendo el PDF respaldado en R2)' : ''}. Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Eliminar definitivamente'
    })
    if (!ok) return

    await onEliminar(certId)
  }

  const handleVaciar = async () => {
    const hayConR2 = certificadosEliminados.some(c => c.r2ArchivoId)
    const descripcion = hayConR2
      ? `Esto eliminará DEFINITIVAMENTE los ${certificadosEliminados.length} certificados de la papelera, incluyendo sus PDFs respaldados en R2. Esta acción NO se puede deshacer.`
      : `Esto eliminará DEFINITIVAMENTE los ${certificadosEliminados.length} certificados de la papelera. Esta acción NO se puede deshacer.`

    const ok = await confirm({
      title: 'Vaciar papelera',
      description: descripcion,
      variant: 'danger',
      confirmText: 'Vaciar papelera'
    })
    if (!ok) return

    const eliminados = await onVaciar()
    if (eliminados > 0) {
      await alert({
        title: 'Papelera vaciada',
        description: `Se eliminaron ${eliminados} certificado(s) definitivamente${hayConR2 ? ' (metadata + PDFs en R2)' : ''}.`,
        variant: 'success',
        confirmText: 'Entendido'
      })
    }
  }

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'sin fecha'
    try {
      return new Date(fechaISO).toLocaleString('es-CL', {
        dateStyle: 'short',
        timeStyle: 'short'
      })
    } catch {
      return 'sin fecha'
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={alCerrar}
      title="🗑️ Papelera de Certificados"
      size="lg"
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-3">
          <p className="text-xs text-gray-600 flex-1">
            Certificados en papelera. Pueden restaurarse o serán eliminados
            automáticamente después de 730 días.
          </p>
          {certificadosEliminados.length > 0 && (
            <Button
              onClick={handleVaciar}
              variant="danger"
              size="sm"
              className="shrink-0"
            >
              🗑️ Vaciar papelera
            </Button>
          )}
        </div>

        {certificadosEliminados.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No hay certificados en la papelera</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {certificadosEliminados.map(cert => {
              const dias = diasRestantes(cert.eliminadoAt)
              return (
                <div
                  key={cert.id}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-gray-900">
                          {cert.tipo === 'asistencia' ? '📋 Asistencia' : '🛌 Reposo'}
                        </span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                          {dias !== null ? `${dias} días restantes` : 'Sin fecha'}
                        </span>
                        {cert.r2ArchivoId && (
                          <span
                            className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                            title="Tiene PDF respaldado en R2 (se borrará al eliminar definitivamente)"
                          >
                            🔒 R2
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700">
                        Emitido: <span className="font-semibold">{cert.fechaEmision || 'sin fecha'}</span>
                      </p>
                      <p className="text-xs text-gray-600 truncate" title={cert.diagnosticoMotivo}>
                        <span className="font-bold">Motivo:</span>{' '}
                        {cert.diagnosticoMotivo || 'sin diagnóstico'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Eliminado: {formatearFecha(cert.eliminadoAt)}
                      </p>
                      {cert.eliminadoMotivo && (
                        <p className="text-xs text-gray-600 mt-1 italic truncate" title={cert.eliminadoMotivo}>
                          Motivo eliminación: "{cert.eliminadoMotivo}"
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button
                        onClick={() => handleRestaurar(cert.id)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        Restaurar
                      </Button>
                      <Button
                        onClick={() => handleEliminarDefinitivo(cert.id)}
                        variant="danger"
                        size="sm"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t">
          <Button onClick={alCerrar} variant="ghost">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
})

ModalPapeleraCertificados.displayName = 'ModalPapeleraCertificados'
