import React, { memo } from 'react'
import { useQuirurgico } from '../../../shared/clinical/quirurgico/useQuirurgico'
import { FichaEndodoncia } from './components/FichaEndodoncia'

export interface EndodonciaModuloProps {
  pacienteId?: string | number | null
}

export const EndodonciaModulo = memo<EndodonciaModuloProps>(({ pacienteId }) => {
  const {
    endodoncias,
    agregarEndodoncia,
    eliminarEndodoncia
  } = useQuirurgico(pacienteId)

  return (
    <div className="space-y-6">
      <FichaEndodoncia
        endodoncias={endodoncias}
        onAgregarEndodoncia={agregarEndodoncia}
        onEliminarEndodoncia={eliminarEndodoncia}
      />
    </div>
  )
})

EndodonciaModulo.displayName = 'EndodonciaModulo'
