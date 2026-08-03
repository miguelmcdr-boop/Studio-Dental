import React, { memo } from 'react'
import { useFinanzas } from './hooks/useFinanzas'
import { GestionConvenios } from './components/GestionConvenios'
import { LiquidacionHonorarios } from './components/LiquidacionHonorarios'

export const FinanzasModulo = memo(() => {
  const {
    convenios,
    liquidaciones,
    actualizarDescuentoConvenio,
    guardarLiquidacion,
    eliminarLiquidacion
  } = useFinanzas()

  return (
    <div className="space-y-6">
      <GestionConvenios
        convenios={convenios}
        onActualizarDescuento={actualizarDescuentoConvenio}
      />

      <LiquidacionHonorarios
        liquidaciones={liquidaciones}
        onGuardarLiquidacion={guardarLiquidacion}
        onEliminarLiquidacion={eliminarLiquidacion}
      />
    </div>
  )
})

FinanzasModulo.displayName = 'FinanzasModulo'