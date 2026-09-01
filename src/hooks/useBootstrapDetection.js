import { useState, useEffect } from 'react'
import { verificarBootstrapNecesario } from '../services/authService'

/**
 * F7-11b: Hook que detecta si el usuario necesita crear una clínica.
 * Extraído de App.jsx para cumplir con límite constitucional.
 *
 * @param {Object} userProfile - Perfil del usuario actual (null si no autenticado)
 * @returns {boolean|null} bootstrapNecesario - null=verificando, true/false=resultado
 */
export const useBootstrapDetection = (userProfile) => {
  const [bootstrapNecesario, setBootstrapNecesario] = useState(null)

  useEffect(() => {
    if (!userProfile) {
      setBootstrapNecesario(null)
      return
    }

    const verificar = async () => {
      const result = await verificarBootstrapNecesario()
      setBootstrapNecesario(result.necesario)
    }

    verificar()
  }, [userProfile])

  return bootstrapNecesario
}
