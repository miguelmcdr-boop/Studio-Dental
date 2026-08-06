import React, { memo, useState, useEffect } from 'react'
import { generarFolioPresupuesto } from '../utils/presupuestosCalculations'
import { presupuestosStorageService } from '../services/presupuestosStorageService'
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'

export const ModalNuevoPresupuesto = memo(({ pacientes = [], prestaciones = [], alGuardar, alCerrar }) => {
  const [pacienteId, setPacienteId] = useState('')
  const [convenio, setConvenio] = useState('Particular')
  const [observacion, setObservacion] = useState('')
  
  // Ítems seleccionados dinámicamente desde el arancel
  const [itemsSeleccionados, setItemsSeleccionados] = useState([])
  const [prestacionSelId, setPrestacionSelId] = useState('')
  const [piezaDental, setPiezaDental] = useState('')

  // Cargar hallazgos del Odontograma si se selecciona un paciente
  const [hallazgosOdontograma, setHallazgosOdontograma] = useState([])

  useEffect(() => {
    if (!pacienteId) {
      setHallazgosOdontograma([])
      return
    }

    try {
      const odontoRaw = localStorage.getItem(`odonto_inicial_${pacienteId}`)
      if (odontoRaw) {
        const odonto = JSON.parse(odontoRaw)
        const listaHallazgos = []

        Object.keys(odonto).forEach(pieza => {
          const estados = odonto[pieza]
          if (Array.isArray(estados)) {
            estados.forEach(est => {
              if (est && est !== 'Sano') {
                listaHallazgos.push({ pieza, diagnostico: est })
              }
            })
          }
        })

        setHallazgosOdontograma(listaHallazgos)
      }
    } catch (e) {
      console.error('Error al leer Odontograma del paciente:', e)
    }
  }, [pacienteId])

  const handleAgregarItem = () => {
    if (!prestacionSelId) return
    const prest = prestaciones.find(p => String(p.id) === String(prestacionSelId))
    if (!prest) return

    const nuevoItem = {
      id: Date.now(),
      pieza: piezaDental || 'General',
      prestacion: prest.nombre,
      convenio,
      precioBase: parseFloat(prest.precioParticular || prest.precio) || 0,
      valor: parseFloat(prest.precioParticular || prest.precio) || 0,
      estado: 'Pendiente'
    }

    setItemsSeleccionados([...itemsSeleccionados, nuevoItem])
    setPrestacionSelId('')
    setPiezaDental('')
  }

  // Cargar hallazgo del odontograma a la cotización con 1 clic
  const handleImportarHallazgo = (hallazgo) => {
    // Buscar sugerencia en arancel
    let prestacionEncontrada = prestaciones.find(p => 
      p.nombre.toLowerCase().includes(hallazgo.diagnostico.toLowerCase())
    ) || prestaciones[0]

    const nuevoItem = {
      id: Date.now() + Math.random(),
      pieza: hallazgo.pieza,
      prestacion: prestacionEncontrada ? `${hallazgo.diagnostico} — ${prestacionEncontrada.nombre}` : hallazgo.diagnostico,
      convenio,
      precioBase: prestacionEncontrada ? (parseFloat(prestacionEncontrada.precioParticular || prestacionEncontrada.precio) || 0) : 35000,
      valor: prestacionEncontrada ? (parseFloat(prestacionEncontrada.precioParticular || prestacionEncontrada.precio) || 0) : 35000,
      estado: 'Pendiente'
    }

    setItemsSeleccionados(prev => [...prev, nuevoItem])
  }

  const handleEliminarItem = (itemId) => {
    setItemsSeleccionados(itemsSeleccionados.filter(i => i.id !== itemId))
  }

  const montoTotal = itemsSeleccionados.reduce((acc, curr) => acc + curr.valor, 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!pacienteId) {
      alert('⚠️ Por favor selecciona un paciente.')
      return
    }
    if (itemsSeleccionados.length === 0) {
      alert('⚠️ Agrega al menos una prestación al presupuesto.')
      return
    }

    const pac = pacientes.find(p => String(p.id) === String(pacienteId))

    const nuevoPresupuesto = {
      id: Date.now(),
      folio: generarFolioPresupuesto(),
      pacienteId: pac?.id,
      pacienteNombre: pac?.nombre || 'Paciente',
      pacienteRut: pac?.rut || 'N/I',
      fechaEmision: obtenerFechaLocalISO(),
      vigenciaDias: 30,
      convenio,
      montoTotal,
      montoAbonado: 0,
      estado: 'Emitido',
      items: itemsSeleccionados,
      observacion
    }

    // 💡 Sincronizar bidireccionalmente con la Ficha del Paciente
    presupuestosStorageService.sincronizarConFichaPaciente(pac?.id, itemsSeleccionados, convenio)

    alGuardar(nuevoPresupuesto)
    alCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-gray-200 shadow-xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Emitir Presupuesto Formal Cotizado</h3>
            <p className="text-[11px] text-gray-500">Sincronizado con la Ficha Clínica y el Arancel Oficial.</p>
          </div>
          <button onClick={alCerrar} className="text-gray-400 hover:text-black font-bold text-lg cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Paciente *</label>
              <select
                value={pacienteId}
                onChange={(e) => {
                  setPacienteId(e.target.value)
                  const pac = pacientes.find(p => String(p.id) === String(e.target.value))
                  if (pac?.prevision) setConvenio(pac.prevision)
                }}
                required
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold cursor-pointer"
              >
                <option value="">-- Seleccionar Paciente --</option>
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
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-semibold cursor-pointer"
              >
                <option value="Particular">Particular</option>
                <option value="Fonasa">Fonasa (-15%)</option>
                <option value="Isapre">Isapre (-20%)</option>
                <option value="Empresa">Convenio Empresa (-25%)</option>
              </select>
            </div>
          </div>

          {/* Precarga rápida desde el Odontograma del paciente */}
          {hallazgosOdontograma.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl space-y-1.5">
              <span className="font-bold text-blue-900 text-[11px] block">
                🦷 Hallazgos detectados en Odontograma ({hallazgosOdontograma.length}):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {hallazgosOdontograma.map((h, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleImportarHallazgo(h)}
                    className="bg-white border border-blue-300 hover:bg-blue-100 text-blue-900 font-bold px-2 py-1 rounded-lg text-[10px] cursor-pointer transition-colors shadow-2xs"
                  >
                    + Pieza {h.pieza}: {h.diagnostico}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Agregar prestaciones dinámicamente */}
          <div className="bg-gray-50 p-3 rounded-xl border space-y-2">
            <label className="block font-bold text-gray-800 uppercase text-[10px]">Añadir Tratamientos del Arancel</label>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Pieza (1.6)"
                  value={piezaDental}
                  onChange={(e) => setPiezaDental(e.target.value)}
                  className="w-full p-2 rounded-lg border bg-white font-bold text-xs"
                />
              </div>

              <div className="sm:col-span-6 min-w-0">
                <select
                  value={prestacionSelId}
                  onChange={(e) => setPrestacionSelId(e.target.value)}
                  className="w-full p-2 rounded-lg border bg-white font-medium truncate text-xs cursor-pointer"
                >
                  <option value="">-- Seleccionar Prestación --</option>
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
                  className="w-full bg-black text-white p-2 rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
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
                    <button type="button" onClick={() => handleEliminarItem(it.id)} className="text-red-500 font-bold hover:text-red-700 cursor-pointer">✕</button>
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
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={alCerrar}
              className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 bg-black text-white py-2.5 rounded-xl font-bold hover:bg-gray-800 shadow-sm cursor-pointer"
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