import { useState } from 'react'
import type React from 'react'
import { bootstrapClinica, type BootstrapClinicaDatos } from '../services/authService'
import { createLogger } from '../services/logger'

const log = createLogger('useBootstrapClinica')

export type { BootstrapClinicaDatos }

export interface BootstrapClinicaErrores {
  nombre?: string | null
  rutEmpresa?: string | null
  direccion?: string | null
  telefono?: string | null
  emailContacto?: string | null
  [key: string]: string | null | undefined
}

export interface UseBootstrapClinicaReturn {
  paso: number
  datos: BootstrapClinicaDatos
  errores: BootstrapClinicaErrores
  procesando: boolean
  errorGeneral: string | null
  actualizarCampo: (campo: keyof BootstrapClinicaDatos, valor: string) => void
  avanzarPaso: () => void
  retrocederPaso: () => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  validarPaso: (pasoActual: number) => boolean
}

/**
 * F7-11b: Hook que maneja la lógica del wizard de bootstrap de clínica.
 * Extraído de BootstrapClinica.jsx para cumplir con límite constitucional.
 *
 * @param onComplete - Callback cuando el bootstrap se completa exitosamente
 * @returns estado del wizard, handlers, validaciones
 */
export const useBootstrapClinica = (
  onComplete?: (clinicaId?: string | number) => void
): UseBootstrapClinicaReturn => {
  const [paso, setPaso] = useState<number>(1)
  const [datos, setDatos] = useState<BootstrapClinicaDatos>({
    nombre: '',
    rutEmpresa: '',
    direccion: '',
    telefono: '',
    emailContacto: ''
  })
  const [errores, setErrores] = useState<BootstrapClinicaErrores>({})
  const [procesando, setProcesando] = useState<boolean>(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  const actualizarCampo = (campo: keyof BootstrapClinicaDatos, valor: string): void => {
    setDatos(prev => ({ ...prev, [campo]: valor }))
    // Limpiar error del campo al editar
    if (errores[campo]) {
      setErrores(prev => ({ ...prev, [campo]: null }))
    }
  }

  const validarRutChileno = (rutInput: string): boolean => {
    // Algoritmo módulo 11 chileno
    const rut = rutInput.toUpperCase().replace(/[^0-9K]/g, '')
    if (rut.length < 8) return false

    const cuerpo = rut.slice(0, -1)
    const dv = rut.slice(-1)

    let suma = 0
    let multiplo = 2
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i], 10) * multiplo
      multiplo = multiplo === 7 ? 2 : multiplo + 1
    }

    const dvEsperado = 11 - (suma % 11)
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString()

    return dv === dvCalculado
  }

  const validarPaso = (pasoActual: number): boolean => {
    const nuevosErrores: BootstrapClinicaErrores = {}

    if (pasoActual === 1) {
      if (!datos.nombre || datos.nombre.trim().length < 3) {
        nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres'
      } else if (datos.nombre.trim().length > 100) {
        nuevosErrores.nombre = 'El nombre no puede exceder 100 caracteres'
      }
    }

    if (pasoActual === 2) {
      // Validar RUT chileno si se proporciona
      if (datos.rutEmpresa && datos.rutEmpresa.trim()) {
        const rutLimpio = datos.rutEmpresa.replace(/[^0-9Kk]/g, '')
        if (!validarRutChileno(rutLimpio)) {
          nuevosErrores.rutEmpresa = 'RUT inválido'
        }
      }
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const avanzarPaso = (): void => {
    if (validarPaso(paso)) {
      setPaso(paso + 1)
      setErrorGeneral(null)
    }
  }

  const retrocederPaso = (): void => {
    if (paso > 1) {
      setPaso(paso - 1)
      setErrorGeneral(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setProcesando(true)
    setErrorGeneral(null)

    try {
      const result = await bootstrapClinica(datos)

      if (result.success) {
        log.info('F7-11b: Bootstrap completado, clínica ID:', result.clinicaId)
        // Llamar callback de éxito (recarga la app)
        setTimeout(() => {
          if (onComplete) onComplete(result.clinicaId)
        }, 1500) // Pequeño delay para mostrar mensaje de éxito
      } else {
        setErrorGeneral(result.error || 'Error al crear la clínica')
      }
    } catch (err: unknown) {
      log.error('F7-11b: Error en bootstrap:', err)
      setErrorGeneral('Error inesperado al crear la clínica')
    } finally {
      setProcesando(false)
    }
  }

  return {
    paso,
    datos,
    errores,
    procesando,
    errorGeneral,
    actualizarCampo,
    avanzarPaso,
    retrocederPaso,
    handleSubmit,
    validarPaso
  }
}
