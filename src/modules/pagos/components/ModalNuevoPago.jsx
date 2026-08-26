import React, { memo, useState, useEffect } from 'react'
import { METODOS_PAGO_GOLD, TIPOS_DOCUMENTO_TRIBUTARIO, CONCEPTOS_PAGO } from '../constants/pagosConstants'
import { generarFolioRecibo } from '../utils/pagosCalculations'
import { presupuestosStorageService } from '../../presupuestos/services/presupuestosStorageService'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('ModalNuevoPago')

export const ModalNuevoPago = memo(({ pagoEditar, pacientes = [], userProfile, alGuardar, alCerrar }) => {
  const [pacienteId, setPacienteId] = useState('')
  const [monto, setMonto] = useState('')
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO_GOLD[0].id)
  const [tipoDTE, setTipoDTE] = useState(TIPOS_DOCUMENTO_TRIBUTARIO[0].id)
  const [folioDTE, setFolioDTE] = useState('')
  const [concepto, setConcepto] = useState(CONCEPTOS_PAGO[0])
  const [observacion, setObservacion] = useState('')

  const [prestacionesPaciente, setPrestacionesPaciente] = useState([])
  const [prestacionesSeleccionadas, setPrestacionesSeleccionadas] = useState([])

  // Carga inicial en modo edición
  useEffect(() => {
    if (pagoEditar) {
      setPacienteId(pagoEditar.pacienteId || '')
      setMonto(pagoEditar.monto || '')
      setMetodoPago(pagoEditar.metodoPago || METODOS_PAGO_GOLD[0].id)
      setTipoDTE(pagoEditar.tipoDTE || TIPOS_DOCUMENTO_TRIBUTARIO[0].id)
      setFolioDTE(pagoEditar.folioDTE || '')
      setConcepto(pagoEditar.concepto || CONCEPTOS_PAGO[0])
      setObservacion(pagoEditar.observacion || '')
      setPrestacionesSeleccionadas(pagoEditar.prestacionesImputadas || [])
    }
  }, [pagoEditar])

  // Carga de prestaciones desde el plan de tratamiento del paciente (vía servicio, F2-07a)
  useEffect(() => {
    if (!pacienteId) {
      setPrestacionesPaciente([])
      return
    }

    try {
      const items = presupuestosStorageService.obtenerItemsPorPaciente(pacienteId)
      if (Array.isArray(items)) {
        setPrestacionesPaciente(items)
      } else {
        setPrestacionesPaciente([])
      }
    } catch (e) {
      log.error(e)
      setPrestacionesPaciente([])
    }
  }, [pacienteId])

  const handleTogglePrestacion = (nombreItem) => {
    if (prestacionesSeleccionadas.includes(nombreItem)) {
      setPrestacionesSeleccionadas(prestacionesSeleccionadas.filter(i => i !== nombreItem))
    } else {
      setPrestacionesSeleccionadas([...prestacionesSeleccionadas, nombreItem])
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const montoLimpio = parseFloat(String(monto).replace(/[^0-9]/g, '')) || 0

    if (!pacienteId || montoLimpio <= 0) {
      alert('Selecciona un paciente e ingresa un monto mayor a $0.')
      return
    }

    const pac = pacientes.find(p => String(p.id) === String(pacienteId))

    const pagoFinal = {
      id: pagoEditar ? pagoEditar.id : Date.now(),
      folioComprobante: pagoEditar ? pagoEditar.folioComprobante : generarFolioRecibo(),
      tipoDTE,
      folioDTE: folioDTE.trim(),
      pacienteId: pac?.id,
      pacienteNombre: pac?.nombre || 'Paciente',
      pacienteRut: pac?.rut || 'N/I',
      fecha: pagoEditar ? pagoEditar.fecha : new Date().toLocaleDateString('es-CL'),
      hora: pagoEditar ? pagoEditar.hora : new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      monto: montoLimpio,
      metodoPago,
      concepto,
      estado: pagoEditar ? pagoEditar.estado : 'Emitido',
      prestacionesImputadas: prestacionesSeleccionadas,
      emitidoPor: userProfile?.nombreCompleto || 'Cajero de Turno',
      observacion: observacion.trim()
    }

    alGuardar(pagoFinal)
    alCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-gray-200 shadow-xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-base font-bold text-gray-900">
            {pagoEditar ? '✏️ Editar Recibo / Transacción de Pago' : '💳 Registrar Cobro e Imputación de Pago'}
          </h3>
          <button onClick={alCerrar} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Paciente *</label>
            <select
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
            >
              <option value="">-- Seleccionar paciente --</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.rut})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Monto a Cobrar ($ CLP) *</label>
              <input
                type="text"
                required
                placeholder="Ej: 50000"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-black text-emerald-900 bg-emerald-50/50 text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Método de Pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
              >
                {METODOS_PAGO_GOLD.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tipo de Documento Tributario</label>
              <select
                value={tipoDTE}
                onChange={(e) => setTipoDTE(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-semibold"
              >
                {TIPOS_DOCUMENTO_TRIBUTARIO.map(d => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Folio DTE / N° Bono</label>
              <input
                type="text"
                placeholder="Ej: BH-104 o I-MED-88"
                value={folioDTE}
                onChange={(e) => setFolioDTE(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Concepto de Pago</label>
            <select
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-medium"
            >
              {CONCEPTOS_PAGO.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Imputación de dinero a prestaciones específicas */}
          {prestacionesPaciente.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-xl border space-y-1.5">
              <label className="block font-bold text-gray-800 uppercase text-[10px]">
                Imputar Abono a Tratamientos Específicos del Paciente:
              </label>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {prestacionesPaciente.map(p => {
                  const labelItem = `${p.prestacion} (${p.pieza}) - $${(parseFloat(p.valor) || 0).toLocaleString('es-CL')}`
                  const estaCheck = prestacionesSeleccionadas.includes(labelItem)

                  return (
                    <label key={p.id} className="flex items-center gap-2 p-1.5 bg-white border rounded-lg cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={estaCheck}
                        onChange={() => handleTogglePrestacion(labelItem)}
                        className="rounded"
                      />
                      <span className="font-semibold text-gray-800">{labelItem}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Observaciones Internas / N° Operación</label>
            <input
              type="text"
              placeholder="Ej: N° Voucher Transbank 48512..."
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
              {pagoEditar ? 'Guardar Cambios' : 'Emitir Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalNuevoPago.displayName = 'ModalNuevoPago'