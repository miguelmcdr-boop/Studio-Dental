import React, { memo, useState } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { useAppDialog } from '../../../hooks/useAppDialog'

export const ReajusteMasivoModal = memo(({ alAplicarReajuste, alCerrar }) => {
  const [porcentaje, setPorcentaje] = useState('5')
  const { confirm, alert: dialogAlert } = useAppDialog()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const pct = parseFloat(porcentaje) || 0
        const confirmado = await confirm({
      title: 'Reajustar arancel',
      description: `¿Estás seguro de reajustar todo el arancel en un ${pct}%? Esta acción actualizará los precios particulares y de convenio.`,
      variant: 'warning',
      confirmText: 'Reajustar'
    })
    if (confirmado) {
      alAplicarReajuste(pct)
      await dialogAlert({
        title: 'Arancel reajustado',
        description: `Arancel reajustado exitosamente en un ${pct}%.`,
        variant: 'success',
        confirmText: 'Entendido'
      })
      alCerrar()
    }
  }

  return (
    <Modal isOpen={true} onClose={alCerrar} title="Reajuste Masivo de Arancel" size="sm">

        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-gray-600 text-[11px] leading-relaxed">
            Aplica un incremento o descuento porcentual global a todos los ítems del arancel de la clínica (Ej: IPC anual del 4.5%).
          </p>

          <Input
            label="Porcentaje de Reajuste (%)"
            type="number"
            step="0.1"
            required
            value={porcentaje}
            onChange={(e) => setPorcentaje(e.target.value)}
          />

          <div className="flex gap-2 pt-2">
            <Button type="button" onClick={alCerrar} variant="ghost" fullWidth>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Aplicar Reajuste
            </Button>
          </div>
        </form>
    </Modal>
  )
})

ReajusteMasivoModal.displayName = 'ReajusteMasivoModal'