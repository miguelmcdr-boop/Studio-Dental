import React, { memo } from 'react'
import { useQuirurgico } from '../../../shared/clinical/quirurgico/useQuirurgico'
import { FichaImplante } from './components/FichaImplante'

export interface ImplantesModuloProps {
  pacienteId?: string | number | null
}

export const ImplantesModulo = memo<ImplantesModuloProps>(({ pacienteId }) => {
  const {
    implantes,
    agregarImplante,
    eliminarImplante
  } = useQuirurgico(pacienteId)

  return (
    <div className="space-y-6">
      <FichaImplante
        implantes={implantes}
        onAgregarImplante={agregarImplante}
        onEliminarImplante={eliminarImplante}
      />
    </div>
  )
})

ImplantesModulo.displayName = 'ImplantesModulo'
