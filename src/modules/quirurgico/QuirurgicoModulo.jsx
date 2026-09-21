import React, { useState, memo } from 'react'
import { FlaskConical } from 'lucide-react'
import { Icon } from '../../components/Icon'
import { useQuirurgico } from './hooks/useQuirurgico'
import { FichaImplante } from './components/FichaImplante'
import { FichaEndodoncia } from './components/FichaEndodoncia'
import { Wrench } from 'lucide-react'

export const QuirurgicoModulo = memo(({ pacienteId }) => {
  const [tabSubSeccion, setTabSubSeccion] = useState('implantes')
  const {
    implantes,
    endodoncias,
    agregarImplante,
    eliminarImplante,
    agregarEndodoncia,
    eliminarEndodoncia
  } = useQuirurgico(pacienteId)

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200 dark:border-graphite-700">
        <button
          onClick={() => setTabSubSeccion('implantes')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            tabSubSeccion === 'implantes' ? 'border-black text-black dark:text-graphite-50' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span className="inline-flex items-center gap-1"><Wrench size={12} />Implantología y Cirugía</span>
        </button>
        <button
          onClick={() => setTabSubSeccion('endodoncia')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            tabSubSeccion === 'endodoncia' ? 'border-black text-black dark:text-graphite-50' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Icon icon={FlaskConical} size="sm" />
            Endodoncia & Conductometría
          </span>
        </button>
      </div>

      {tabSubSeccion === 'implantes' && (
        <FichaImplante
          implantes={implantes}
          onAgregarImplante={agregarImplante}
          onEliminarImplante={eliminarImplante}
        />
      )}

      {tabSubSeccion === 'endodoncia' && (
        <FichaEndodoncia
          endodoncias={endodoncias}
          onAgregarEndodoncia={agregarEndodoncia}
          onEliminarEndodoncia={eliminarEndodoncia}
        />
      )}
    </div>
  )
})

QuirurgicoModulo.displayName = 'QuirurgicoModulo'