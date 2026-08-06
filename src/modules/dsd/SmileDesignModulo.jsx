import React, { memo } from 'react'
import { useSmileDesign } from './hooks/useSmileDesign'
import { SimuladorCarillas } from './components/SimuladorCarillas'
import { ProporcionesCanino } from './components/ProporcionesCanino'

export const SmileDesignModulo = memo(({ pacienteId }) => {
  const {
    dsdData,
    ratioAnchoAlto,
    visibilidadDorada,
    esProporcionIdeal,
    actualizarAtributoDsd
  } = useSmileDesign(pacienteId)

  return (
    <div className="space-y-6">
      <SimuladorCarillas
        dsdData={dsdData}
        ratioAnchoAlto={ratioAnchoAlto}
        esProporcionIdeal={esProporcionIdeal}
        visibilidadDorada={visibilidadDorada}
        onActualizar={actualizarAtributoDsd}
      />

      <ProporcionesCanino visibilidadDorada={visibilidadDorada} />
    </div>
  )
})

SmileDesignModulo.displayName = 'SmileDesignModulo'