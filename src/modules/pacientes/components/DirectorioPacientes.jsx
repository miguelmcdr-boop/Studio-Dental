import React, { memo, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { usePacientesStore } from '../../../store/pacientesStore'
import { ModalNuevoPaciente } from './ModalNuevoPaciente'
import { ModalPapelera } from './ModalPapelera'
import { usePapelera } from '../hooks/usePapelera'
import { useRBAC } from '../../../hooks/useRBAC'
import { PERMISOS } from '../../../constants/rbacConstants'

export const DirectorioPacientes = memo(({ alSeleccionarPaciente, alEliminarPaciente, alPacienteCreado }) => {
  // (F2-08) — pacientes ya no llega por prop: se lee directo del store.
  // busqueda y mostrarModalNuevo, al ser UI puramente local del directorio,
  // ya no viven en App.jsx.
  const pacientes = usePacientesStore((state) => state.pacientes)
  const setPacientes = usePacientesStore((state) => state.setPacientes)

  const [busqueda, setBusqueda] = useState('')
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false)
  const [mostrarPapelera, setMostrarPapelera] = useState(false)

  // F6-L: Papelera de reciclaje (solo admin)
  const { puede } = useRBAC()
  const { 
    pacientesEliminados, cargando, contador, restaurar, 
    vaciar, contadorElegibles, aniosRetencion, refrescar
  } = usePapelera()
  const handleEliminarConPapelera = async (id) => {
    const exito = await alEliminarPaciente(id)
    if (exito) {
      await refrescar()
    }
  }
  const puedeVaciar = puede(PERMISOS.VACIAR_PAPELERA)

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
        <div className="flex gap-2">
          {puede(PERMISOS.VER_PAPELERA) && (
            <Button
              data-testid="btn-papelera"
              onClick={() => setMostrarPapelera(true)}
              variant="danger"
              className="bg-orange-600 hover:bg-orange-700"
              size="sm"
            >
              <span>🗑️</span> Papelera {contador > 0 ? `(${contador})` : ''}
            </Button>
          )}
          <Button
            data-testid="btn-nuevo-paciente"
            onClick={() => setMostrarModalNuevo(true)}
            className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>➕</span> Nuevo Paciente
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          data-testid="input-busqueda-paciente"
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar por nombre o RUT del paciente..."
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
              <Button
                data-testid={`btn-ficha-${p.id}`}
                onClick={() => alSeleccionarPaciente(p)}
                size="sm"
                variant="secondary"
                className="text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100 text-xs"
              >
                Ficha →
              </Button>
              <Button
                data-testid={`btn-eliminar-${p.id}`}
                onClick={(e) => { e.stopPropagation(); handleEliminarConPapelera(p.id); }}
                size="sm"
                variant="danger"
                className="p-1.5 text-xs"
                title="Eliminar paciente"
              >
                🗑️
              </Button>
            </div>
          </div>
        ))}
      </div>

      {mostrarModalNuevo && (
        <ModalNuevoPaciente
          pacientes={pacientes}
          alGuardar={handleCrearPaciente}
          alCerrar={() => setMostrarModalNuevo(false)}
        />
      )}

      {mostrarPapelera && (
        <ModalPapelera
          pacientesEliminados={pacientesEliminados}
          cargando={cargando}
          onRestaurar={restaurar}
          onVaciar={vaciar}
          contadorElegibles={contadorElegibles}
          aniosRetencion={aniosRetencion}
          puedeVaciar={puedeVaciar}
          onCerrar={() => setMostrarPapelera(false)}
        />
      )}
    </div>
  )
})

DirectorioPacientes.displayName = 'DirectorioPacientes'