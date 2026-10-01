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
      <div className="flex gap-2 border-b border-[#E2E8F0] dark:border-[#24334A] surgical:border-[#475569]">
        <button
          onClick={() => setTabSubSeccion('implantes')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-micro cursor-pointer ${
            tabSubSeccion === 'implantes' ? 'border-[#B88E3A] dark:border-[#E5C378] text-[#7A591F] dark:text-[#E5C378] surgical:border-black surgical:text-black' : 'border-transparent text-graphite-500 dark:text-graphite-400 surgical:text-black hover:text-graphite-800 dark:hover:text-graphite-200'
          }`}
        >
          <span className="inline-flex items-center gap-1"><Wrench size={12} />Implantología y Cirugía</span>
        </button>
        <button
          onClick={() => setTabSubSeccion('endodoncia')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-micro cursor-pointer ${
            tabSubSeccion === 'endodoncia' ? 'border-[#B88E3A] dark:border-[#E5C378] text-[#7A591F] dark:text-[#E5C378] surgical:border-black surgical:text-black' : 'border-transparent text-graphite-500 dark:text-graphite-400 surgical:text-black hover:text-graphite-800 dark:hover:text-graphite-200'
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