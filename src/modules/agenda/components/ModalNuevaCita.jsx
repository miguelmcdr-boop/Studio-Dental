/**
 * ModalNuevaCita — Modal para agendar cita médica
 * Migrado a <Modal> base + CamposFormularioCita (F7-25)
 */
import { Plus } from 'lucide-react'
import React, { memo, useState, useMemo } from 'react'
import { Icon } from '../../../components/Icon'
import { User, Zap } from 'lucide-react'
import { SILLONES_DENTALES } from '../constants/agendaConstants'
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { useAppDialog } from '../../../hooks/useAppDialog'
import { CamposFormularioCita } from './CamposFormularioCita'

export const ModalNuevaCita = memo(({ pacientes = [], fechaPredeterminada, alGuardar, alCerrar }) => {
  const [esPacienteExpress, setEsPacienteExpress] = useState(false)
  const [pacienteSeleccionadoId, setPacienteSeleccionadoId] = useState('')
  
  const [pacienteNombre, setPacienteNombre] = useState('')
  const [pacienteTelefono, setPacienteTelefono] = useState('')
  const [pacienteRut, setPacienteRut] = useState('')
  const [autoCrearFicha, setAutoCrearFicha] = useState(true)

  const [tratamiento, setTratamiento] = useState('Evaluación / Diagnóstico Inicial')
  const [boxAsignado, setBoxAsignado] = useState(SILLONES_DENTALES[0]?.nombre || 'Sillón 1 - Odontología General')
  const [fecha, setFecha] = useState(fechaPredeterminada || obtenerFechaLocalISO())
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [duracionMinutos, setDuracionMinutos] = useState(30)
  const [observaciones, setObservaciones] = useState('')
  const { alert: dialogAlert } = useAppDialog()

  const handleSelectPacienteChange = (e) => {
    const pId = e.target.value
    setPacienteSeleccionadoId(pId)

    if (!pId) {
      setPacienteNombre('')
      setPacienteTelefono('')
      setPacienteRut('')
      return
    }

    const pEncontrado = pacientes.find(p => String(p.id) === String(pId))
    if (pEncontrado) {
      const nombreCompleto = `${pEncontrado.nombre || ''} ${pEncontrado.apellido || ''}`.trim() || pEncontrado.nombreCompleto || ''
      setPacienteNombre(nombreCompleto)
      setPacienteTelefono(pEncontrado.telefono || '')
      setPacienteRut(pEncontrado.rut || '')
    }
  }

  const horaFinCalculada = useMemo(() => {
    if (!horaInicio) return '09:30'
    const [h, m] = horaInicio.split(':').map(Number)
    const inicioMin = h * 60 + m
    const finMin = inicioMin + parseInt(duracionMinutos, 10)
    const hFin = String(Math.floor(finMin / 60) % 24).padStart(2, '0')
    const mFin = String(finMin % 60).padStart(2, '0')
    return `${hFin}:${mFin}`
  }, [horaInicio, duracionMinutos])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!pacienteNombre.trim()) {
      await dialogAlert({
        title: 'Paciente requerido',
        description: 'Por favor selecciona o ingresa un paciente.',
        variant: 'warning',
        confirmText: 'Entendido'
      })
      return
    }

    alGuardar(
      {
        id: Date.now(),
        pacienteId: pacienteSeleccionadoId || `express_${Date.now()}`,
        pacienteNombre,
        pacienteTelefono,
        pacienteRut,
        trataMiento: tratamiento,
        boxAsignado,
        fecha,
        horaInicio,
        horaFin: horaFinCalculada,
        duracionMinutos: parseInt(duracionMinutos, 10),
        observaciones,
        estado: 'Agendado'
      },
      esPacienteExpress ? autoCrearFicha : false
    )
  }

  return (
    <Modal
      isOpen={true}
      onClose={alCerrar}
      title="Agendar cita médica"
      size="lg"
    >
      <p className="text-[11px] text-graphite-500 dark:text-graphite-400 mb-4">
        Selección directa de paciente registrado o registro express.
      </p>

      {/* Toggle Modo Paciente */}
      <div className="flex bg-gray-100 dark:bg-graphite-800 p-1 rounded-xl gap-1 mb-4">
        <button
          type="button"
          onClick={() => {
            setEsPacienteExpress(false)
            setPacienteSeleccionadoId('')
            setPacienteNombre('')
          }}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            !esPacienteExpress ? 'bg-graphite-900 dark:bg-graphite-100 text-white dark:text-graphite-900 shadow-xs' : 'text-gray-600 dark:text-graphite-400 hover:text-graphite-900 dark:hover:text-graphite-100'
          }`}
        >
          <Icon icon={User} size="xs" /> Paciente Registrado ({pacientes.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setEsPacienteExpress(true)
            setPacienteSeleccionadoId('')
            setPacienteNombre('')
            setPacienteTelefono('')
          }}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            esPacienteExpress ? 'bg-graphite-900 dark:bg-graphite-100 text-white dark:text-graphite-900 shadow-xs' : 'text-gray-600 dark:text-graphite-400 hover:text-graphite-900 dark:hover:text-graphite-100'
          }`}
        >
          <Icon icon={Zap} size="xs" /> Paciente Nuevo / Express
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <CamposFormularioCita
          pacientes={pacientes}
          sillonesDentales={SILLONES_DENTALES}
          esPacienteExpress={esPacienteExpress}
          pacienteSeleccionadoId={pacienteSeleccionadoId}
          pacienteNombre={pacienteNombre}
          pacienteTelefono={pacienteTelefono}
          pacienteRut={pacienteRut}
          autoCrearFicha={autoCrearFicha}
          tratamiento={tratamiento}
          boxAsignado={boxAsignado}
          fecha={fecha}
          horaInicio={horaInicio}
          horaFinCalculada={horaFinCalculada}
          duracionMinutos={duracionMinutos}
          observaciones={observaciones}
          setPacienteSeleccionadoId={setPacienteSeleccionadoId}
          setPacienteNombre={setPacienteNombre}
          setPacienteTelefono={setPacienteTelefono}
          setPacienteRut={setPacienteRut}
          setAutoCrearFicha={setAutoCrearFicha}
          setTratamiento={setTratamiento}
          setBoxAsignado={setBoxAsignado}
          setFecha={setFecha}
          setHoraInicio={setHoraInicio}
          setDuracionMinutos={setDuracionMinutos}
          setObservaciones={setObservaciones}
          handleSelectPacienteChange={handleSelectPacienteChange}
        />

        {/* Botones */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-graphite-700">
          <Button
            type="button"
            onClick={alCerrar}
            variant="ghost"
          >
            Cancelar
          </Button>
          <Button
              type="submit"
              variant="primary"
              icon={Plus}
            >
              Confirmar cita
            </Button>
        </div>
      </form>
    </Modal>
  )
})

ModalNuevaCita.displayName = 'ModalNuevaCita'
