import React, { memo, useState } from 'react'
import { generarFolioPresupuesto } from '../utils/presupuestosCalculations'

export const ModalNuevoPresupuesto = memo(({ pacientes = [], prestaciones = [], alGuardar, alCerrar }) => {
  const [pacienteId, setPacienteId] = useState('')
  const [convenio, setConvenio] = useState('Particular')
  const [observacion, setObservacion] = useState('')
  
  // Ítems seleccionados dinámicamente desde el arancel
  const [itemsSeleccionados, setItemsSeleccionados] = useState([])
  const [prestacionSelId, setPrestacionSelId] = useState('')
  const [piezaDental, setPiezaDental] = useState('')

  const handleAgregarItem = () => {
    if (!prestacionSelId) return
    const prest = prestaciones.find(p => String(p.id) === String(prestacionSelId))
    if (!prest) return

    const nuevoItem = {
      id: Date.now(),
      prestacion: prest.nombre,
      pieza: piezaDental || 'General',
      valor: parseFloat(prest.precioParticular || prest.precio) || 0
    }

    setItemsSeleccionados([...itemsSeleccionados, nuevoItem])
    setPrestacionSelId('')
    setPiezaDental('')
  }

  const handleEliminarItem = (itemId) => {
    setItemsSeleccionados(itemsSeleccionados.filter(i => i.id !== itemId))
  }

  const montoTotal = itemsSeleccionados.reduce((acc, curr) => acc + curr.valor, 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!pacienteId) {
      alert('Selecciona un paciente.')
      return
    }
    if (itemsSeleccionados.length === 0) {
      alert('Agrega al menos una prestación al presupuesto.')
      return
    }

    const pac = pacientes.find(p => String(p.id) === String(pacienteId))

    const nuevoPresupuesto = {
      id: Date.now(),
      folio: generarFolioPresupuesto(),
      pacienteId: pac?.id,
      pacienteNombre: pac?.nombre || 'Paciente',
      pacienteRut: pac?.rut || 'N/I',
      fechaEmision: new Date().toISOString().split('T')[0],
      vigenciaDias: 30,
      convenio,
      montoTotal,
      montoAbonado: 0,
      estado: 'Emitido',
      items: itemsSeleccionados,
      observacion
    }

    alGuardar(nuevoPresupuesto)
    alCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-gray-200 shadow-xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-base font-bold text-gray-900">Emitir Presupuesto Formal Cotizado</h3>
          <button onClick={alCerrar} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Paciente *</label>
              <select
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
              >
                <option value="">-- Seleccionar --</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.rut})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Convenio / Previsión</label>
              <select
                value={convenio}
                onChange={(e) => setConvenio(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-semibold"
              >
                <option value="Particular">Particular</option>
                <option value="Fonasa">Fonasa</option>
                <option value="Isapre">Isapre</option>
                <option value="Empresa">Convenio Empresa</option>
              </select>
            </div>
          </div>

          {/* Agregar prestaciones dinámicamente con distribución responsive */}
          <div className="bg-gray-50 p-3 rounded-xl border space-y-2">
            <label className="block font-bold text-gray-800 uppercase text-[10px]">Añadir Tratamientos del Arancel</label>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Pieza (1.6)"
                  value={piezaDental}
                  onChange={(e) => setPiezaDental(e.target.value)}
                  className="w-full p-2 rounded-lg border bg-white font-bold"
                />
              </div>

              <div className="sm:col-span-6 min-w-0">
                <select
                  value={prestacionSelId}
                  onChange={(e) => setPrestacionSelId(e.target.value)}
                  className="w-full p-2 rounded-lg border bg-white font-medium truncate"
                >
                  <option value="">-- Seleccionar --</option>
                  {prestaciones.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (${(parseFloat(p.precioParticular || p.precio) || 0).toLocaleString('es-CL')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleAgregarItem}
                  className="w-full bg-black text-white p-2 rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-xs"
                >
                  + Añadir
                </button>
              </div>
            </div>

            <div className="space-y-1 max-h-36 overflow-y-auto pt-1">
              {itemsSeleccionados.map(it => (
                <div key={it.id} className="flex justify-between items-center p-2 bg-white border rounded-lg">
                  <span className="truncate max-w-[280px]"><strong>[{it.pieza}]</strong> {it.prestacion}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-gray-900">${it.valor.toLocaleString('es-CL')}</span>
                    <button type="button" onClick={() => handleEliminarItem(it.id)} className="text-red-500 font-bold hover:text-red-700">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <span className="font-bold text-emerald-900 uppercase">Monto Total Cotizado:</span>
            <span className="text-base font-black text-emerald-900">${montoTotal.toLocaleString('es-CL')} CLP</span>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Observaciones / Indicaciones Especiales</label>
            <textarea
              rows="2"
              placeholder="Ej: Cotización válida por 30 días. Incluye controles postoperatorios..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={alCerrar}
              className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 bg-black text-white py-2.5 rounded-xl font-bold hover:bg-gray-800"
            >
              Guardar y Emitir
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalNuevoPresupuesto.displayName = 'ModalNuevoPresupuesto'