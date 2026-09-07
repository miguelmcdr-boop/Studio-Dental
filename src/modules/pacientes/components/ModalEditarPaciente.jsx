import React, { memo, useState } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'

export const ModalEditarPaciente = memo(({ paciente, alGuardar, alCerrar }) => {
  const [datosEdit, setDatosEdit] = useState({ ...paciente })

  const handleSubmit = (e) => {
    e.preventDefault()
    alGuardar(datosEdit)
    alCerrar()
  }

  return (
    <Modal isOpen={true} onClose={alCerrar} title={`Editar Datos Personales de ${paciente.nombre}`} size="xl">

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre Completo"
              type="text"
              required
              value={datosEdit.nombre || ''}
              onChange={(e) => setDatosEdit({ ...datosEdit, nombre: e.target.value })}
            />
            <Input
              label="RUT"
              type="text"
              required
              value={datosEdit.rut || ''}
              onChange={(e) => setDatosEdit({ ...datosEdit, rut: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Edad"
              type="number"
              value={datosEdit.edad || ''}
              onChange={(e) => setDatosEdit({ ...datosEdit, edad: e.target.value })}
            />
            <Input
              label="Teléfono"
              type="text"
              value={datosEdit.telefono || ''}
              onChange={(e) => setDatosEdit({ ...datosEdit, telefono: e.target.value })}
            />
            <Input
              label="Correo Electrónico"
              type="email"
              value={datosEdit.email || ''}
              onChange={(e) => setDatosEdit({ ...datosEdit, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Ocupación"
              type="text"
              value={datosEdit.ocupacion || ''}
              onChange={(e) => setDatosEdit({ ...datosEdit, ocupacion: e.target.value })}
            />
            <Input
              label="Dirección / Comuna"
              type="text"
              value={datosEdit.direccion || ''}
              onChange={(e) => setDatosEdit({ ...datosEdit, direccion: e.target.value })}
            />
            <div>
              <label className="block font-semibold text-gray-600 uppercase mb-1">Previsión</label>
              <select
                value={datosEdit.prevision || 'Fonasa'}
                onChange={(e) => setDatosEdit({ ...datosEdit, prevision: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
              >
                <option value="Fonasa">Fonasa</option>
                <option value="Isapre">Isapre</option>
                <option value="Particular">Particular</option>
              </select>
            </div>
          </div>

          <Input
            label="Contacto de Emergencia"
            type="text"
            value={datosEdit.contactoEmergencia || ''}
            onChange={(e) => setDatosEdit({ ...datosEdit, contactoEmergencia: e.target.value })}
            placeholder="Ej: María Pérez +56 9 1111 2222"
          />

          <div className="flex gap-2 pt-4">
            <Button type="button" onClick={alCerrar} variant="ghost" fullWidth>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Guardar Cambios
            </Button>
          </div>
        </form>
    </Modal>
  )
})

ModalEditarPaciente.displayName = 'ModalEditarPaciente'