import React from 'react'

export interface OnboardingStepperProps {
  paso: number
  totalPasos?: number
}

const PASOS = ['1. Tipo', '2. Espacio', '3. Sedes', '4. Equipo']

export const OnboardingStepper: React.FC<OnboardingStepperProps> = ({
  paso,
  totalPasos = 4,
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">
        {PASOS.map((nombre, idx) => (
          <span
            key={idx}
            className={paso === idx + 1 ? 'text-[#D4AF37] font-semibold' : ''}
          >
            {nombre}
          </span>
        ))}
      </div>
      <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2">
        <div
          className="bg-[#D4AF37] h-2 rounded-full transition-all duration-300"
          style={{ width: `${(paso / totalPasos) * 100}%` }}
        />
      </div>
    </div>
  )
}
