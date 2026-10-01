import React from 'react'
import { Loader2 } from 'lucide-react'

/**
 * F7-11b: Pantalla de loading mientras se verifica si el usuario necesita bootstrap.
 * Previene flash del Dashboard antes de que bootstrapNecesario esté definido.
 */
export const VerificandoCuenta = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-graphite-800">
    <div className="text-center">
      <Loader2 className="animate-spin text-6xl mb-4 text-blue-500" size={64} />
      <p className="text-gray-600 dark:text-graphite-400">Verificando tu cuenta...</p>
    </div>
  </div>
)
