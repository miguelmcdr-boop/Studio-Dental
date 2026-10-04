/**
 * useEliminarAbono — Hook para eliminar abonos de un paciente (F10-C3.4 + Commit D)
 *
 * Commit D: cuando el abono está sincronizado con un pago global
 * (mismo id + mismo paciente), al borrarlo se propaga la anulación
 * al módulo Pagos con motivo "Abono eliminado desde Plan de Tratamiento".
 */
import { useCallback } from 'react'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { pagosStorageService, type Pago } from '../../../../domains/billing/payment/services/pagosStorageService'
import { useAppDialog } from '../../../../hooks/useAppDialog'

export interface AbonoItem {
  id: string | number
  fecha?: string
  monto?: number | string
  metodoPago?: string
  pacienteNombre?: string
  [key: string]: unknown
}

export interface PacienteRef {
  id: string | number
  nombre?: string
  [key: string]: unknown
}

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
    // Commit D: detectar si el abono corresponde a un pago global sincronizado
    const pagos: Pago[] = pagosStorageService.obtenerPagos([])
    const pagoAsociado = pagos.find(p =>
      String(p.id) === String(idAbono) &&
      String(p.pacienteId) === String(paciente.id) &&
      p.estado !== 'Anulado'
    )

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

    // Propagar anulación al pago global asociado (Commit D)
    if (pagoAsociado) {
      const pagosActualizados: Pago[] = pagos.map(p =>
        String(p.id) === String(idAbono)
          ? {
              ...p,
              estado: 'Anulado',
              motivoAnulacion: 'Abono eliminado desde Plan de Tratamiento',
              fechaAnulacion: new Date().toLocaleDateString('es-CL')
            }
          : p
      )
      await pagosStorageService.guardarPagos(pagosActualizados)
    }

    const actualizados = abonos.filter(a => String(a.id) !== String(idAbono))
    setAbonos(actualizados)
    pacientesStorageService.guardarItem(`abonos_${paciente.id}`, actualizados)
  }, [abonos, setAbonos, paciente, confirm])

  return { handleEliminarAbono }
}
