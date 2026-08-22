import React, { memo, useState } from 'react'
import { formatearRut, obtenerErrorRut } from '../../../utils/validarRut'
import { rutDuplicado } from '../schemas/pacienteSchema'

/**
 * Modal para crear nuevo paciente (F2-02).
 * F6-G: agregada validación de RUT en tiempo real con feedback visual.
 *
 * @param {Function} alGuardar - Callback al guardar paciente
 * @param {Function} alCerrar - Callback al cerrar modal
 * @param {Array} pacientes - Lista de pacientes existentes (para verificar duplicados)
 */
export const ModalNuevoPaciente = memo(({ alGuardar, alCerrar, pacientes = [] }) => {
  const [nuevoPaciente, setNuevoPaciente] = useState({
    nombre: '', rut: '', telefono: '', edad: '', prevision: 'Fonasa', alergias: '', email: '', direccion: '', ocupacion: '', contactoEmergencia: ''
  })
  const [errorRut, setErrorRut] = useState('')
  const [rutValido, setRutValido] = useState(false)

  // Validación en tiempo real del RUT
  const handleRutChange = (e) => {
    const valor = e.target.value
    setNuevoPaciente({ ...nuevoPaciente, rut: valor })
    
    if (!valor.trim()) {
      setErrorRut('')
      setRutValido(false)
      return
    }
    
    const error = obtenerErrorRut(valor)
    if (error) {
      setErrorRut(error)
      setRutValido(false)
      return
    }
    
    // Verificar duplicados
    if (rutDuplicado(valor, pacientes)) {
      setErrorRut('Este RUT ya está registrado')
      setRutValido(false)
      return
    }
    
    setErrorRut('')
    setRutValido(true)
  }

  // Normalización automática al perder foco
  const handleRutBlur = () => {
    if (nuevoPaciente.rut.trim() && !errorRut) {
      const formateado = formatearRut(nuevoPaciente.rut)
      setNuevoPaciente({ ...nuevoPaciente, rut: formateado })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validación final antes de guardar
    if (!nuevoPaciente.nombre || !nuevoPaciente.rut) return
    if (!rutValido || errorRut) return

    const nuevo = {
      ...nuevoPaciente,
      id: Date.now(),
      edad: nuevoPaciente.edad || '30'
    }

    alGuardar(nuevo)
  }

  const puedeGuardar = nuevoPaciente.nombre && nuevoPaciente.rut && rutValido && !errorRut

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-lg font-bold text-gray-900">Registrar Nuevo Paciente</h3>
          <button onClick={alCerrar} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-600 uppercase mb-1">Nombre Completo *</label>
            <input
              data-testid="paciente-nombre"
              type="text"
              required
              value={nuevoPaciente.nombre}
              onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, nombre: e.target.value })}
              placeholder="Ej: Juan Pérez González"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">RUT *</label>
              <input
                data-testid="paciente-rut"
                type="text"
                required
                value={nuevoPaciente.rut}
                onChange={handleRutChange}
                onBlur={handleRutBlur}
                placeholder="12.345.678-9"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  errorRut ? 'border-red-500 bg-red-50' :
                  rutValido ? 'border-green-500 bg-green-50' :
                  'border-gray-300'
                }`}
              />
              {errorRut && (
                <p data-testid="paciente-rut-error" className="text-red-600 text-xs mt-1 font-medium">
                  {errorRut}
                </p>
              )}
              {rutValido && !errorRut && (
                <p data-testid="paciente-rut-valido" className="text-green-600 text-xs mt-1 font-medium">
                  ✓ RUT válido
                </p>
              )}
            </div>
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">Teléfono</label>
              <input
                type="text"
                value={nuevoPaciente.telefono}
                onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, telefono: e.target.value })}
                placeholder="+56 9 1234 5678"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">Edad</label>
              <input
                type="number"
                value={nuevoPaciente.edad}
                onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, edad: e.target.value })}
                placeholder="30"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">Correo</label>
              <input
                type="email"
                value={nuevoPaciente.email}
                onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, email: e.target.value })}
                placeholder="juan@ejemplo.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">Previsión</label>
              <select
                value={nuevoPaciente.prevision}
                onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, prevision: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
              >
                <option value="Fonasa">Fonasa</option>
                <option value="Isapre">Isapre</option>
                <option value="Particular">Particular</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-red-600 uppercase mb-1">Alergias Conocidas</label>
            <input
              data-testid="paciente-alergias"
              type="text"
              value={nuevoPaciente.alergias}
              onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, alergias: e.target.value })}
              placeholder="Ej: Penicilina, AINEs, Ninguna"
              className="w-full px-3 py-2 rounded-lg border border-red-200 bg-red-50/30 text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              data-testid="paciente-cancelar"
              type="button"
              onClick={alCerrar}
              className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              data-testid="paciente-crear"
              type="submit"
              disabled={!puedeGuardar}
              className={`w-1/2 py-2.5 rounded-xl font-semibold ${
                puedeGuardar
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Crear Paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalNuevoPaciente.displayName = 'ModalNuevoPaciente'
