import React, { memo } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { diasRestantes } from '../services/papeleraPagosService'

/**
 * Modal de Papelera de Pagos (Commit K)
 *
 * Muestra pagos purgados con opción de restaurar (volver a 'Anulado').
 * Cada fila muestra: folio, paciente, monto, fecha purga, motivo, días restantes.
 * La eliminación automática (>730 días) ocurre en background al cargar el módulo.
 */
export const ModalPapeleraPagos = memo(({ pagos, alCerrar, onRestaurar }) => {
  const handleRestaurar = async (pagoId) => {
    await onRestaurar(pagoId)
  }

  return (
    <Modal
      isOpen={true}
      onClose={alCerrar}
      title="🗑️ Papelera de Pagos"
      size="lg"
    >
      <div className="space-y-3">
        <p className="text-xs text-gray-600">
          Pagos purgados. Pueden restaurarse (volver a estado "Anulado") o serán eliminados automáticamente después de 730 días.
        </p>

        {pagos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No hay pagos en la papelera</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pagos.map(pago => {
              const dias = diasRestantes(pago.fechaPurga)
              return (
                <div
                  key={pago.id}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{pago.folioComprobante}</span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                          {dias !== null ? `${dias} días restantes` : 'Sin fecha registrada (no se auto-elimina)'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 font-semibold">{pago.pacienteNombre}</p>
                      <p className="text-xs text-gray-600">
                        <span className="font-bold">${pago.monto.toLocaleString('es-CL')} CLP</span> · {pago.metodoPago}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Purgado: {pago.fechaPurga || 'sin fecha'} por {pago.purgadoPor || 'sin registro'}
                      </p>
                      {pago.motivoPurga && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          Motivo: "{pago.motivoPurga}"
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => handleRestaurar(pago.id)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      Restaurar
                    </Button>
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

ModalPapeleraPagos.displayName = 'ModalPapeleraPagos'
