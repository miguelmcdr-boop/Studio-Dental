/**
 * useEliminarAbono — Hook para eliminar abonos de un paciente (F10-C3.4 + Commit D)
 *
 * Refactorizado en Fase 4C-1: delega la orquestación y sincronización de
 * abonos y pagos globales al Application Service `registerTreatmentPayment`.
 */
import { useCallback } from 'react'
import {
  eliminarPagoTratamiento,
  obtenerPagoAsociadoAAbono,
  type AbonoItem,
  type PacienteRef,
} from '../../../../application/billing'
import { useAppDialog } from '../../../../shared/hooks/useAppDialog'

export type { AbonoItem, PacienteRef }

export interface UseEliminarAbonoOptions {
  abonos: AbonoItem[]
  setAbonos: (abonos: AbonoItem[]) => void
  paciente: PacienteRef
}

export interface UseEliminarAbonoReturn {
  handleEliminarAbono: (idAbono: string | number) => Promise<void>
}

export const useEliminarAbono = ({
  abonos,
  setAbonos,
  paciente
}: UseEliminarAbonoOptions): UseEliminarAbonoReturn => {
  const { confirm } = useAppDialog()

  const handleEliminarAbono = useCallback(async (idAbono: string | number): Promise<void> => {
    // Detectar si el abono corresponde a un pago global sincronizado vía Application Service
    const pagoAsociado = obtenerPagoAsociadoAAbono(idAbono, paciente.id)

    const descripcion = pagoAsociado
      ? `Este abono está vinculado al pago ${pagoAsociado.folioComprobante}. Al eliminarlo, el pago quedará como Anulado en el módulo Pagos. ¿Continuar?`
      : '¿Deseas eliminar este registro de abono ingresado?'

    const ok = await confirm({
      title: 'Eliminar abono',
      description: descripcion,
      variant: 'danger',
      confirmText: 'Eliminar'
    })
    if (!ok) return

    // Delegar anulación global y eliminación local al Application Service
    const { abonosActualizados } = await eliminarPagoTratamiento({
      pacienteId: paciente.id,
      idAbono,
      abonosPrevios: abonos,
    })

    setAbonos(abonosActualizados)
  }, [abonos, setAbonos, paciente, confirm])

  return { handleEliminarAbono }
}
