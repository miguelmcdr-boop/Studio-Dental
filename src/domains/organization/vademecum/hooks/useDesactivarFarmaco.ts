import { useCallback } from 'react'
import { useAppDialog } from '../../../../shared/hooks/useAppDialog'

export interface VademecumServiceDesactivar {
  desactivarFarmaco: (
    numero: number
  ) => Promise<{ exito: boolean; error?: string }>
}

export interface UseDesactivarFarmacoOptions {
  cargarDatos: () => Promise<void> | void
  vademecumService: VademecumServiceDesactivar
}

export interface UseDesactivarFarmacoReturn {
  desactivar: (numero: number) => Promise<{ exito: boolean; error?: string }>
}

export const useDesactivarFarmaco = ({
  cargarDatos,
  vademecumService
}: UseDesactivarFarmacoOptions): UseDesactivarFarmacoReturn => {
  const { confirm } = useAppDialog()

  const desactivar = useCallback(
    async (numero: number): Promise<{ exito: boolean; error?: string }> => {
      const ok = await confirm({
        title: 'Desactivar fármaco',
        description: `¿Desactivar fármaco #${numero}? (no se borra, solo se oculta)`,
        variant: 'warning',
        confirmText: 'Desactivar'
      })
      if (!ok) {
        return { exito: false, error: 'Cancelado por el usuario' }
      }

      const resultado = await vademecumService.desactivarFarmaco(numero)
      if (resultado.exito) {
        await cargarDatos()
      }
      return resultado
    },
    [cargarDatos, vademecumService, confirm]
  )

  return { desactivar }
}
