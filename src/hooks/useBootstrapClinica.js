import { useState } from 'react'
import { bootstrapClinica } from '../services/authService'
import { createLogger } from '../services/logger'

const log = createLogger('useBootstrapClinica')

/**
 * F7-11b: Hook que maneja la lógica del wizard de bootstrap de clínica.
 * Extraído de BootstrapClinica.jsx para cumplir con límite constitucional.
 *
 * @param {Function} onComplete - Callback cuando el bootstrap se completa exitosamente
 * @returns {Object} estado del wizard, handlers, validaciones
 */
export const useBootstrapClinica = (onComplete) => {
  const [paso, setPaso] = useState(1)
  const [datos, setDatos] = useState({
    nombre: '',
    rutEmpresa: '',
    direccion: '',
    telefono: '',
    emailContacto: ''
  })
  const [errores, setErrores] = useState({})
  const [procesando, setProcesando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)

  const actualizarCampo = (campo, valor) => {
    setDatos(prev => ({ ...prev, [campo]: valor }))
    // Limpiar error del campo al editar
    if (errores[campo]) {
      setErrores(prev => ({ ...prev, [campo]: null }))
    }
  }

  const validarPaso = (pasoActual) => {
    const nuevosErrores = {}

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

  const validarRutChileno = (rut) => {
    // Algoritmo módulo 11 chileno
    rut = rut.toUpperCase().replace(/[^0-9K]/g, '')
    if (rut.length < 8) return false

    const cuerpo = rut.slice(0, -1)
    const dv = rut.slice(-1)

    let suma = 0, multiplo = 2
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i]) * multiplo
      multiplo = multiplo === 7 ? 2 : multiplo + 1
    }

    const dvEsperado = 11 - (suma % 11)
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString()

    return dv === dvCalculado
  }

  const avanzarPaso = () => {
    if (validarPaso(paso)) {
      setPaso(paso + 1)
      setErrorGeneral(null)
    }
  }

  const retrocederPaso = () => {
    if (paso > 1) {
      setPaso(paso - 1)
      setErrorGeneral(null)
    }
  }

  const handleSubmit = async (e) => {
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
    } catch (err) {
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
