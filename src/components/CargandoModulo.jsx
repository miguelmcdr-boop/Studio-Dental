import React from 'react'

export const CargandoModulo = () => (
  <div className="flex items-center justify-center h-64 print:hidden">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargando módulo...</span>
    </div>
  </div>
)