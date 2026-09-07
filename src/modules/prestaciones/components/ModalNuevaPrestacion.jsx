import React, { memo, useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { ESPECIALIDADES_ODONTOLOGICAS } from '../constants/prestacionesConstants'

export const ModalNuevaPrestacion = memo(({ prestacionEditar, alGuardar, alCerrar }) => {
  const [nombre, setNombre] = useState('')
  const [especialidad, setEspecialidad] = useState(ESPECIALIDADES_ODONTOLOGICAS[0])
  const [precioParticular, setPrecioParticular] = useState('')
  const [precioFonasa, setPrecioFonasa] = useState('')
  const [codigoFonasa, setCodigoFonasa] = useState('')

  useEffect(() => {
    if (prestacionEditar) {
      setNombre(prestacionEditar.nombre || '')
      setEspecialidad(prestacionEditar.especialidad || ESPECIALIDADES_ODONTOLOGICAS[0])
      setPrecioParticular(prestacionEditar.precioParticular || prestacionEditar.precio || '')
      setPrecioFonasa(prestacionEditar.precioFonasa || '')
      setCodigoFonasa(prestacionEditar.codigoFonasa || '')
    }
  }, [prestacionEditar])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nombre.trim() || !precioParticular) return

    const valParticular = parseFloat(precioParticular) || 0
    const valFonasa = parseFloat(precioFonasa) || 0

    const prestacionObj = {
      id: prestacionEditar ? prestacionEditar.id : Date.now(),
      nombre: nombre.trim(),
      especialidad,
      precio: valParticular, // 💡 Propiedad requerida por FichaPaciente y Presupuestos
      precioParticular: valParticular,
      precioFonasa: valFonasa,
      codigoFonasa: codigoFonasa.trim()
    }

    alGuardar(prestacionObj)
    alCerrar()
  }

  return (
    <Modal
      isOpen={true}
      onClose={alCerrar}
      title={prestacionEditar ? 'Editar Procedimiento de Arancel' : 'Registrar Nueva Prestación'}
      size="md"
    >

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Nombre del Procedimiento / Tratamiento"
            type="text"
            required
            placeholder="Ej: Obturación Resina 1 Cara..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Especialidad Clínica</label>
            <select
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-medium"
            >
              {ESPECIALIDADES_ODONTOLOGICAS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Precio Particular ($)"
              type="number"
              required
              placeholder="Ej: 35000"
              value={precioParticular}
              onChange={(e) => setPrecioParticular(e.target.value)}
            />

            <Input
              label="Precio Fonasa / Convenio ($)"
              type="number"
              placeholder="Ej: 28000"
              value={precioFonasa}
              onChange={(e) => setPrecioFonasa(e.target.value)}
            />
          </div>

          <Input
            label="Código Fonasa (Opcional)"
            type="text"
            placeholder="Ej: 01-02-010"
            value={codigoFonasa}
            onChange={(e) => setCodigoFonasa(e.target.value)}
          />

          <div className="flex gap-2 pt-3">
            <Button type="button" onClick={alCerrar} variant="ghost" fullWidth>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Guardar Prestación
            </Button>
          </div>
        </form>
    </Modal>
  )
})

ModalNuevaPrestacion.displayName = 'ModalNuevaPrestacion'