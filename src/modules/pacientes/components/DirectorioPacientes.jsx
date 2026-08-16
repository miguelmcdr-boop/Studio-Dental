import React, { memo, useState } from 'react'
import { usePacientesStore } from '../../../store/pacientesStore'
import { ModalNuevoPaciente } from './ModalNuevoPaciente'

export const DirectorioPacientes = memo(({ alSeleccionarPaciente, alEliminarPaciente, alPacienteCreado }) => {
  // (F2-08) — pacientes ya no llega por prop: se lee directo del store.
  // busqueda y mostrarModalNuevo, al ser UI puramente local del directorio,
  // ya no viven en App.jsx.
  const pacientes = usePacientesStore((state) => state.pacientes)
  const setPacientes = usePacientesStore((state) => state.setPacientes)

  const [busqueda, setBusqueda] = useState('')
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false)

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.rut.includes(busqueda)
  )

  const handleCrearPaciente = (nuevoPaciente) => {
    setPacientes([nuevoPaciente, ...pacientes])
    setMostrarModalNuevo(false)
    if (alPacienteCreado) alPacienteCreado(nuevoPaciente)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Directorio de Pacientes</h2>
          <p className="text-xs text-gray-500">Busca, administra, edita o elimina registros de pacientes.</p>
        </div>
        <button
          data-testid="btn-nuevo-paciente"
          onClick={() => setMostrarModalNuevo(true)}
          className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
        >
          <span>➕</span> Nuevo Paciente
        </button>
      </div>

      <div className="mb-6">
        <input
          data-testid="input-busqueda-paciente"
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar por nombre o RUT del paciente..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black text-sm text-gray-800 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pacientesFiltrados.map(p => (
          <div
            key={p.id}
            data-testid={`paciente-card-${p.id}`}
            className="p-5 border border-gray-200 rounded-2xl hover:border-black transition-all bg-gray-50 flex justify-between items-center group"
          >
            <div onClick={() => alSeleccionarPaciente(p)} className="cursor-pointer flex-1">
              <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{p.nombre}</h3>
              <p className="text-xs text-gray-500">RUT: {p.rut}</p>
              <p className="text-xs text-gray-500">Tel: {p.telefono || 'Sin teléfono'}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                data-testid={`btn-ficha-${p.id}`}
                onClick={() => alSeleccionarPaciente(p)}
                className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100"
              >
                Ficha →
              </button>
              <button
                data-testid={`btn-eliminar-${p.id}`}
                onClick={(e) => { e.stopPropagation(); alEliminarPaciente(p.id); }}
                className="text-xs text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                title="Eliminar paciente"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {mostrarModalNuevo && (
        <ModalNuevoPaciente
          alGuardar={handleCrearPaciente}
          alCerrar={() => setMostrarModalNuevo(false)}
        />
      )}
    </div>
  )
})

DirectorioPacientes.displayName = 'DirectorioPacientes'