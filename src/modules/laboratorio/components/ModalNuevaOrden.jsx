import React, { memo, useState, useEffect } from 'react'
import { TIPOS_TRABAJO_SUGERIDOS } from '../constants/laboratorioConstants'
import { generarCodigoOrdenLab, buscarTarifaSugerida } from '../utils/laboratorioCalculations'

export const ModalNuevaOrden = memo(({ pacientes = [], laboratorios = [], alGuardar, alCerrar }) => {
  const [pacienteId, setPacienteId] = useState('')
  const [laboratorioId, setLaboratorioId] = useState(laboratorios[0]?.id || '')
  const [tipoTrabajo, setTipoTrabajo] = useState('')
  const [piezaDientaria, setPiezaDientaria] = useState('')
  const [colorGuia, setColorGuia] = useState('A2')
  const [fechaEnvio, setFechaEnvio] = useState(new Date().toISOString().split('T')[0])
  const [fechaEntregaPrometida, setFechaEntregaPrometida] = useState('')
  const [costoLaboratorio, setCostoLaboratorio] = useState('')
  const [indicacionesTecnicas, setIndicacionesTecnicas] = useState('')

  // Autocompletado de tarifa sugerida si el trabajo existe en el tarifario del Lab
  useEffect(() => {
    if (laboratorioId && tipoTrabajo.trim()) {
      const tarifa = buscarTarifaSugerida(laboratorios, laboratorioId, tipoTrabajo)
      if (tarifa > 0) {
        setCostoLaboratorio(tarifa)
      }
    }
  }, [laboratorioId, tipoTrabajo, laboratorios])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!pacienteId) {
      alert('Selecciona un paciente para la orden de trabajo.')
      return
    }
    if (!tipoTrabajo.trim()) {
      alert('Ingresa el tipo de trabajo o procedimiento de laboratorio.')
      return
    }

    const pac = pacientes.find(p => p.id === parseInt(pacienteId) || p.id === pacienteId)
    const lab = laboratorios.find(l => l.id === parseInt(laboratorioId) || l.id === laboratorioId)

    const nuevaOrden = {
      id: Date.now(),
      codigoOrden: generarCodigoOrdenLab(),
      pacienteId: pac?.id,
      pacienteNombre: pac?.nombre || 'Paciente',
      pacienteRut: pac?.rut || 'N/I',
      laboratorioId: lab?.id,
      laboratorioNombre: lab?.nombre || 'Laboratorio',
      tipoTrabajo: tipoTrabajo.trim(),
      piezaDientaria: piezaDientaria || 'Arcada Completa',
      colorGuia,
      fechaEnvio,
      fechaEntregaPrometida,
      etapa: 'Enviado',
      costoLaboratorio: parseFloat(costoLaboratorio) || 0,
      estadoPagoLab: 'Pendiente',
      indicacionesTecnicas
    }

    alGuardar(nuevaOrden)
    alCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-gray-200 shadow-xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-base font-bold text-gray-900">Emitir Orden de Trabajo de Laboratorio</h3>
          <button onClick={alCerrar} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Seleccionar Paciente *</label>
            <select
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold text-sm"
            >
              <option value="">-- Seleccionar paciente --</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.rut})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Laboratorio Destino</label>
              <select
                value={laboratorioId}
                onChange={(e) => setLaboratorioId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold text-blue-900"
              >
                {laboratorios.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tipo de Prótesis / Trabajo *</label>
              <input
                type="text"
                list="tipos-trabajo-sugeridos"
                required
                placeholder="Escribe o selecciona (Ej: Carilla Feldspática, Prótesis Valplast...)"
                value={tipoTrabajo}
                onChange={(e) => setTipoTrabajo(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-white"
              />
              <datalist id="tipos-trabajo-sugeridos">
                {TIPOS_TRABAJO_SUGERIDOS.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Pieza Dientaria / Sector</label>
              <input
                type="text"
                placeholder="Ej: Pieza 1.1, Sector 2.1-2.3..."
                value={piezaDientaria}
                onChange={(e) => setPiezaDientaria(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Color / Guía (Vita)</label>
              <input
                type="text"
                placeholder="Ej: A2, Bleach 2, C2..."
                value={colorGuia}
                onChange={(e) => setColorGuia(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Fecha Envío</label>
              <input
                type="date"
                value={fechaEnvio}
                onChange={(e) => setFechaEnvio(e.target.value)}
                className="w-full p-2 rounded-xl border border-gray-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Promesa Entrega</label>
              <input
                type="date"
                value={fechaEntregaPrometida}
                onChange={(e) => setFechaEntregaPrometida(e.target.value)}
                className="w-full p-2 rounded-xl border border-gray-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Costo Lab ($ CLP)</label>
              <input
                type="number"
                placeholder="Ej: 45000"
                value={costoLaboratorio}
                onChange={(e) => setCostoLaboratorio(e.target.value)}
                className="w-full p-2 rounded-xl border border-gray-300 font-bold text-emerald-900 bg-emerald-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Indicaciones Técnicas para el Ceramista</label>
            <textarea
              rows="3"
              placeholder="Ej: Chamfer subgingival, perfil de emergencia anatómico, translucidez incisal, enviar prueba de bizcocho..."
              value={indicacionesTecnicas}
              onChange={(e) => setIndicacionesTecnicas(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300"
            />
          </div>

          <div className="flex gap-2 pt-3">
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
              Emitir Orden
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalNuevaOrden.displayName = 'ModalNuevaOrden'