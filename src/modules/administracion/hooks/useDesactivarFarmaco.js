/**
 * useDesactivarFarmaco — Hook para desactivar fármacos (F10-C3.11)
 *
 * Extraído de useVademecumAdmin.js para respetar el límite congelado de 194 líneas.
 *
 * @param {Object} options
 * @param {Function} options.cargarDatos - Función para recargar datos
 * @param {Object} options.vademecumService - Servicio de vademécum
 * @returns {{ desactivar: (numero: number) => Promise<{exito: boolean, error?: string}> }}
 */
import { useCallback } from 'react'
import { useAppDialog } from '../../../hooks/useAppDialog'

export const useDesactivarFarmaco = ({ cargarDatos, vademecumService }) => {
  const { confirm } = useAppDialog()

  const desactivar = useCallback(async (numero) => {
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
  }, [cargarDatos, vademecumService, confirm])

  return { desactivar }
}
