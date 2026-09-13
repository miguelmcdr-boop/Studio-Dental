import React, { memo, useState, useEffect } from 'react'
import { formatearCLP } from '../../../utils/formatoMoneda'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { METODOS_PAGO_GOLD, TIPOS_DOCUMENTO_TRIBUTARIO, CONCEPTOS_PAGO } from '../constants/pagosConstants'
import { generarFolioRecibo } from '../utils/pagosCalculations'
import { useAppDialog } from '../../../hooks/useAppDialog'
import { usePrestacionesPaciente } from '../hooks/usePrestacionesPaciente'
import { SelectorPrestacionesImputadas } from './SelectorPrestacionesImputadas'

export const ModalNuevoPago = memo(({ pagoEditar, pacientes = [], userProfile, alGuardar, alCerrar }) => {
  const [pacienteId, setPacienteId] = useState('')
  const { alert: dialogAlert } = useAppDialog()
  const [monto, setMonto] = useState('')
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO_GOLD[0].id)
  const [tipoDTE, setTipoDTE] = useState(TIPOS_DOCUMENTO_TRIBUTARIO[0].id)
  const [folioDTE, setFolioDTE] = useState('')
  const [concepto, setConcepto] = useState(CONCEPTOS_PAGO[0])
  const [observacion, setObservacion] = useState('')

  const {
    prestacionesPaciente,
    prestacionesSeleccionadas,
    handleTogglePrestacion
  } = usePrestacionesPaciente(pacienteId, pagoEditar)

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
    }
  }, [pagoEditar])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const montoLimpio = parseFloat(String(monto).replace(/[^0-9]/g, '')) || 0

    if (!pacienteId || montoLimpio <= 0) {
      await dialogAlert({
        title: 'Datos incompletos',
        description: 'Selecciona un paciente e ingresa un monto mayor a $0.',
        variant: 'warning',
        confirmText: 'Entendido'
      })
      return
    }

    const pac = pacientes.find(p => String(p.id) === String(pacienteId))

    const pagoFinal = {
      id: pagoEditar ? pagoEditar.id : (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
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
    
    await dialogAlert({
      title: pagoEditar ? 'Pago actualizado' : 'Pago registrado',
      description: `Comprobante ${pagoFinal.folioComprobante} ${pagoEditar ? 'actualizado' : 'registrado'} exitosamente por ${formatearCLP(montoLimpio)}.`,
      variant: 'success',
      confirmText: 'Entendido'
    })
    
    alCerrar()
  }

  return (
    <Modal
      isOpen={true}
      onClose={alCerrar}
      title={pagoEditar ? '✏️ Editar Recibo / Transacción de Pago' : '💳 Registrar Cobro e Imputación de Pago'}
      size="lg"
    >

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Paciente *</label>
            <select
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
            >
              <option value="">-- Seleccionar paciente --</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.rut})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Monto a Cobrar ($ CLP)"
              type="text"
              required
              placeholder="Ej: 50000"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="font-black text-emerald-900 bg-emerald-50/50"
            />

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

            <Input
              label="Folio DTE / N° Bono"
              type="text"
              placeholder="Ej: BH-104 o I-MED-88"
              value={folioDTE}
              onChange={(e) => setFolioDTE(e.target.value)}
            />
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

          <SelectorPrestacionesImputadas
            prestaciones={prestacionesPaciente}
            seleccionadas={prestacionesSeleccionadas}
            onToggle={handleTogglePrestacion}
          />

          <Input
            label="Observaciones Internas / N° Operación"
            type="text"
            placeholder="Ej: N° Voucher Transbank 48512..."
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
          />

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              onClick={alCerrar}
              variant="ghost"
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
            >
              {pagoEditar ? 'Guardar Cambios' : 'Emitir Pago'}
            </Button>
          </div>
        </form>
    </Modal>
  )
})

ModalNuevoPago.displayName = 'ModalNuevoPago'
