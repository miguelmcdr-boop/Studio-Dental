import React, { memo, useState, useMemo } from 'react'
import { SILLONES_DENTALES } from '../constants/agendaConstants'
import { obtenerFechaLocalISO } from '.../utils/dateUtils' 

// Tratamientos prediseñados para selección ultra rápida
const TRATAMIENTOS_RAPIDOS = [
  'Evaluación / Diagnóstico Inicial',
  'Limpieza / Destartraje Higiene',
  'Obturación / Tapadura Resina',
  'Exodoncia / Extracción Simple',
  'Exodoncia Tercer Molar (Muela Juicio)',
  'Tratamiento de Conducto (Endodoncia)',
  'Control de Ortodoncia / Frenillos',
  'Instalación / Blanqueamiento Dental',
  'Control / Urgencia Dental'
]

export const ModalNuevaCita = memo(({ pacientes = [], fechaPredeterminada, alGuardar, alCerrar }) => {
  const [esPacienteExpress, setEsPacienteExpress] = useState(false)
  const [pacienteSeleccionadoId, setPacienteSeleccionadoId] = useState('')
  
  // Datos Paciente
  const [pacienteNombre, setPacienteNombre] = useState('')
  const [pacienteTelefono, setPacienteTelefono] = useState('')
  const [pacienteRut, setPacienteRut] = useState('')
  const [autoCrearFicha, setAutoCrearFicha] = useState(true)

  // Datos Cita
  const [tratamiento, setTratamiento] = useState(TRATAMIENTOS_RAPIDOS[0])
  const [boxAsignado, setBoxAsignado] = useState(SILLONES_DENTALES[0]?.nombre || 'Sillón 1 - Odontología General')
  const [fecha, setFecha] = useState(fechaPredeterminada || obtenerFechaLocalISO())
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [duracionMinutos, setDuracionMinutos] = useState(30)
  const [observaciones, setObservaciones] = useState('')

  // Manejador cuando el usuario elige un paciente del menú desplegable
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

  // Cálculo automático de Hora Fin
  const horaFinCalculada = useMemo(() => {
    if (!horaInicio) return '09:30'
    const [h, m] = horaInicio.split(':').map(Number)
    const inicioMin = h * 60 + m
    const finMin = inicioMin + parseInt(duracionMinutos, 10)
    const hFin = String(Math.floor(finMin / 60) % 24).padStart(2, '0')
    const mFin = String(finMin % 60).padStart(2, '0')
    return `${hFin}:${mFin}`
  }, [horaInicio, duracionMinutos])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!pacienteNombre.trim()) {
      alert('⚠️ Por favor selecciona o ingresa un paciente.')
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h3 className="font-black text-sm text-gray-900 flex items-center gap-2 uppercase tracking-tight">
              <span>📅</span> Agendar Cita Médica
            </h3>
            <p className="text-[11px] text-gray-500">Selección directa de paciente registrado o registro express.</p>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-sm flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Toggle Modo Paciente */}
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => {
              setEsPacienteExpress(false)
              setPacienteSeleccionadoId('')
              setPacienteNombre('')
            }}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              !esPacienteExpress ? 'bg-black text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            <span>👤</span> Paciente Registrado ({pacientes.length})
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
              esPacienteExpress ? 'bg-black text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            <span>⚡</span> Paciente Nuevo / Express
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {!esPacienteExpress ? (
            <div>
              <label className="font-extrabold text-gray-800 block mb-1">
                Seleccionar Paciente de la Base de Datos *
              </label>
              {/* Menú Desplegable con Camila Silva, Carlos Mendoza y todos los pacientes registrados */}
              <select
                value={pacienteSeleccionadoId}
                onChange={handleSelectPacienteChange}
                className="w-full p-3 rounded-xl border border-gray-300 font-bold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black cursor-pointer text-xs"
                required
              >
                <option value="">-- Despliega para elegir paciente registrado --</option>
                {pacientes.map(p => {
                  const nombreFull = `${p.nombre || ''} ${p.apellido || ''}`.trim() || p.nombreCompleto || 'Sin Nombre'
                  return (
                    <option key={p.id} value={p.id}>
                      👤 {nombreFull} {p.rut ? `(RUT: ${p.rut})` : ''} {p.telefono ? `- 📞 ${p.telefono}` : ''}
                    </option>
                  )
                })}
              </select>

              {pacienteSeleccionadoId && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-extrabold text-[11px] flex justify-between items-center">
                  <span>✓ Paciente: <strong>{pacienteNombre}</strong></span>
                  <span>📞 {pacienteTelefono || 'Sin fono registrado'}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-gray-700 block mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    value={pacienteNombre}
                    onChange={(e) => setPacienteNombre(e.target.value)}
                    placeholder="Ej. María González"
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="font-extrabold text-gray-700 block mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={pacienteTelefono}
                    onChange={(e) => setPacienteTelefono(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoCrear"
                  checked={autoCrearFicha}
                  onChange={(e) => setAutoCrearFicha(e.target.checked)}
                  className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
                />
                <label htmlFor="autoCrear" className="font-bold text-gray-800 text-[11px] cursor-pointer">
                  📁 Crear automáticamente Ficha Clínica en el Módulo Pacientes
                </label>
              </div>
            </div>
          )}

          {/* Menú Desplegable de Tratamiento Ágil */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold text-gray-700 block mb-1">Tratamiento / Motivo *</label>
              <select
                value={tratamiento}
                onChange={(e) => setTratamiento(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-gray-50 focus:bg-white cursor-pointer"
              >
                {TRATAMIENTOS_RAPIDOS.map((t, idx) => (
                  <option key={idx} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-extrabold text-gray-700 block mb-1">Sillón / Box Dental</label>
              <select
                value={boxAsignado}
                onChange={(e) => setBoxAsignado(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-gray-50 focus:bg-white cursor-pointer"
              >
                {SILLONES_DENTALES.map(s => (
                  <option key={s.id} value={s.nombre}>🪑 {s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-extrabold text-gray-700 block mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="font-extrabold text-gray-700 block mb-1">Hora Inicio</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-gray-50"
                required
              />
            </div>

            <div>
              <label className="font-extrabold text-gray-700 block mb-1">Duración</label>
              <select
                value={duracionMinutos}
                onChange={(e) => setDuracionMinutos(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-gray-50 cursor-pointer"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min (1 hr)</option>
                <option value="90">90 min (1.5 hrs)</option>
                <option value="120">120 min (2 hrs)</option>
              </select>
            </div>
          </div>

          <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 flex justify-between items-center text-[11px] font-extrabold text-blue-900">
            <span>⏰ Horario Asignado: {horaInicio} hrs a {horaFinCalculada} hrs</span>
            <span>⏱️ {duracionMinutos} min</span>
          </div>

          <div>
            <label className="font-extrabold text-gray-700 block mb-1">Observaciones / Notas Clínicas</label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Instrucciones previas, sensibilidad, paciente ansioso..."
              className="w-full p-2.5 rounded-xl border border-gray-300 font-bold bg-gray-50 focus:bg-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={alCerrar}
              className="px-4 py-2.5 rounded-xl text-gray-600 font-extrabold hover:bg-gray-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white font-black shadow-lg cursor-pointer transition-all flex items-center gap-1.5"
            >
              <span>➕</span> Confirmar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

ModalNuevaCita.displayName = 'ModalNuevaCita'