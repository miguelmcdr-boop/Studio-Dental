import React, { memo, useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { useAppDialog } from '../../../hooks/useAppDialog'
import {
  diasRestantes,
  obtenerCertificadosEliminados,
  vaciarPapelera
} from '../services/papeleraCertificadosService'

/**
 * Modal de Papelera de Certificados (M3)
 *
 * Patrón reutilizado de ModalPapeleraPagos (Commit K6):
 * - Modal es dueño TOTAL del flujo de vaciar (confirm + vaciar + reload + alert)
 * - Recarga defensiva post-acción (Commit K10)
 * - Scope por paciente (a diferencia de pagos que es global)
 *
 * Props:
 *   pacienteId — UUID del paciente
 *   alCerrar — callback al cerrar modal
 *   onRestaurar(certId) — callback delegado al padre para restaurar
 *   onEliminar(certId) — callback delegado al padre para eliminar individual
 *   onAccionCompletada — callback post-acción (recarga lista del padre)
 */
export const ModalPapeleraCertificados = memo(({
  pacienteId,
  alCerrar,
  onRestaurar,
  onEliminar,
  onAccionCompletada
}) => {
  const { confirm, alert } = useAppDialog()
  const [certificados, setCertificados] = useState(() =>
    obtenerCertificadosEliminados(pacienteId)
  )

  // CRÍTICO: recargar cuando cambie el estado del padre
  // (después de restaurar, el padre actualiza su estado, y necesitamos
  // que el modal también se actualice para no mostrar el cert restaurado)
  useEffect(() => {
    const interval = setInterval(() => {
      const actuales = obtenerCertificadosEliminados(pacienteId)
      // Solo actualizar si cambió la cantidad (evita re-renders innecesarios)
      if (actuales.length !== certificados.length) {
        setCertificados(actuales)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [pacienteId, certificados.length])

  const reload = () => setCertificados(obtenerCertificadosEliminados(pacienteId))

  const handleRestaurar = async (certId) => {
    try {
      await onRestaurar(certId)
    } finally {
      // Recarga defensiva: siempre recargar aunque el padre falle
      reload()
      if (onAccionCompletada) onAccionCompletada()
    }
  }

  const handleEliminarDefinitivo = async (certId) => {
    const cert = certificados.find(c => String(c.id) === String(certId))
    const ok = await confirm({
      title: 'Eliminar definitivamente',
      description: `Esto eliminará el certificado de forma permanente${cert?.r2ArchivoId ? ' (incluyendo el PDF respaldado en R2)' : ''}. Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Eliminar definitivamente'
    })
    if (!ok) return

    try {
      await onEliminar(certId)
    } finally {
      reload()
      if (onAccionCompletada) onAccionCompletada()
      
      // CRÍTICO: forzar recarga en el padre después de eliminar
      setTimeout(() => {
        if (onAccionCompletada) onAccionCompletada()
      }, 100)
    }
  }

  const handleVaciar = async () => {
    const hayConR2 = certificados.some(c => c.r2ArchivoId)
    const descripcion = hayConR2
      ? `Esto eliminará DEFINITIVAMENTE los ${certificados.length} certificados de la papelera, incluyendo sus PDFs respaldados en R2. Esta acción NO se puede deshacer.`
      : `Esto eliminará DEFINITIVAMENTE los ${certificados.length} certificados de la papelera. Esta acción NO se puede deshacer.`

    const ok = await confirm({
      title: 'Vaciar papelera',
      description: descripcion,
      variant: 'danger',
      confirmText: 'Vaciar papelera'
    })
    if (!ok) return

    const eliminados = await vaciarPapelera(pacienteId)
    reload()
    if (onAccionCompletada) onAccionCompletada()
    
    // CRÍTICO: forzar recarga en el padre después de vaciar
    setTimeout(() => {
      if (onAccionCompletada) onAccionCompletada()
    }, 100)

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
          {certificados.length > 0 && (
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

        {certificados.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No hay certificados en la papelera</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {certificados.map(cert => {
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
