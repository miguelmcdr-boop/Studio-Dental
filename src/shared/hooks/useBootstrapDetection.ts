import { useState, useEffect } from 'react'
import { verificarBootstrapNecesario } from '../../infrastructure/auth/authService'

/**
 * F7-11b: Hook que detecta si el usuario necesita crear una clínica.
 * Extraído de App.jsx para cumplir con límite constitucional.
 *
 * @param userProfile - Perfil del usuario actual (null si no autenticado)
 * @returns bootstrapNecesario - null=verificando, true/false=resultado
 */
export const useBootstrapDetection = (userProfile: unknown): boolean | null => {
  const [bootstrapNecesario, setBootstrapNecesario] = useState<boolean | null>(null)

  useEffect(() => {
    if (!userProfile) {
      setBootstrapNecesario(null)
      return
    }

    const verificar = async (): Promise<void> => {
      const result = await verificarBootstrapNecesario()
      setBootstrapNecesario(result.necesario)
    }

    void verificar()
  }, [userProfile])

  return bootstrapNecesario
}
