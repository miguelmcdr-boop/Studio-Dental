import React, { memo } from 'react'
import { useOdontopediatria } from './hooks/useOdontopediatria'
import { EscalaFrankl } from './components/EscalaFrankl'
import { IndiceOLeary } from './components/IndiceOLeary'
import { OdontogramaTemporal } from './components/OdontogramaTemporal'

export const OdontopediatriaModulo = memo(({ pacienteId }) => {
  const {
    datosPediatria,
    porcentajeOLeary,
    cambiarFrankl,
    toggleCaraOleary,
    actualizarAtributo,
    toggleEstadoPiezaDentosana
  } = useOdontopediatria(pacienteId)

  return (
    <div className="space-y-6 text-xs">
      {/* Escala de Conducta de Frankl */}
      <EscalaFrankl
        gradoSeleccionado={datosPediatria.gradoFrankl}
        onCambiarGrado={cambiarFrankl}
        observacion={datosPediatria.observacionConducta}
        onCambiarObservacion={actualizarAtributo}
      />

      {/* Control de Placa de O'Leary */}
      <IndiceOLeary
        mapaOleary={datosPediatria.mapaOleary}
        porcentaje={porcentajeOLeary}
        piezasPresentes={datosPediatria.piezasPresentesOleary}
        onToggleCara={toggleCaraOleary}
        onCambiarPiezasPresentes={actualizarAtributo}
      />

      {/* Odontograma Temporal / Dentición Decidua */}
      <OdontogramaTemporal
        datosDentosana={datosPediatria.mapaDentosana}
        onToggleEstadoPieza={toggleEstadoPiezaDentosana}
      />
    </div>
  )
})

OdontopediatriaModulo.displayName = 'OdontopediatriaModulo'