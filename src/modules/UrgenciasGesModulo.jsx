import React, { useState, useEffect } from 'react'
import { PATOLOGIAS_GES, DIAGNOSTICOS_URGENCIA_SUGERIDOS, TRATAMIENTOS_URGENCIA_SUGERIDOS } from '../data/plantillas'
import { FirmaDigitalCanvas } from '../components/FirmaDigitalCanvas'

export const UrgenciasGesModulo = ({ pacientes = [], userProfile }) => {
  const [tab, setTab] = useState('Urgencias')
  const [pacienteGes, setPacienteGes] = useState(null)
  const [patologiaSeleccionada, setPatologiaSeleccionada] = useState('ges_urgencia')
  const [firmaPacienteData, setFirmaPacienteData] = useState(null)

  const [sugerenciasUrgDiag, setSugerenciasUrgDiag] = useState([])
  const [sugerenciasUrgTrat, setSugerenciasUrgTrat] = useState([])

  const [registroUrgencias, setRegistroUrgencias] = useState(() => {
    const saved = localStorage.getItem('clinica_urgencias_registradas')
    return saved ? JSON.parse(saved) : [
      { id: 1, fecha: new Date().toLocaleDateString('es-CL'), paciente: 'Camila Silva Morales', rut: '18.452.123-K', motivoUrgencia: 'Pulpitis irreversible aguda pieza 1.6', evaDolor: '9/10', tratamientoUrgencia: 'Apertura cameral y pulpectomía de urgencia' }
    ]
  })

  const [nuevaUrgencia, setNuevaUrgencia] = useState({
    paciente: '', rut: '', motivoUrgencia: '', evaDolor: '8/10', tratamientoUrgencia: ''
  })

  useEffect(() => {
    localStorage.setItem('clinica_urgencias_registradas', JSON.stringify(registroUrgencias))
  }, [registroUrgencias])

  const handleMotivoUrgenciaChange = (texto) => {
    setNuevaUrgencia({ ...nuevaUrgencia, motivoUrgencia: texto })
    if (texto.trim().length > 1) {
      const coindicencias = DIAGNOSTICOS_URGENCIA_SUGERIDOS.filter(d => d.toLowerCase().includes(texto.toLowerCase()))
      setSugerenciasUrgDiag(coindicencias)
    } else {
      setSugerenciasUrgDiag([])
    }
  }

  const handleTratamientoUrgenciaChange = (texto) => {
    setNuevaUrgencia({ ...nuevaUrgencia, tratamientoUrgencia: texto })
    if (texto.trim().length > 1) {
      const coindicencias = TRATAMIENTOS_URGENCIA_SUGERIDOS.filter(t => t.toLowerCase().includes(texto.toLowerCase()))
      setSugerenciasUrgTrat(coindicencias)
    } else {
      setSugerenciasUrgTrat([])
    }
  }

  const handleCrearUrgencia = (e) => {
    e.preventDefault()
    if (!nuevaUrgencia.paciente || !nuevaUrgencia.motivoUrgencia) return

    const urgObj = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL'),
      ...nuevaUrgencia
    }

    setRegistroUrgencias([urgObj, ...registroUrgencias])
    setNuevaUrgencia({ paciente: '', rut: '', motivoUrgencia: '', evaDolor: '8/10', tratamientoUrgencia: '' })
  }

  const patologiaActualObj = PATOLOGIAS_GES.find(p => p.id === patologiaSeleccionada)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Urgencias Odontológicas y Garantías GES</h2>
          <p className="text-xs text-gray-500">Categorización Triage, atención rápida y emisión de Notificación Oficial GES Minsal con Firma Digital.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 mb-6 print:hidden">
        <button
          onClick={() => setTab('Urgencias')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${tab === 'Urgencias' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'}`}
        >
          🚨 Triage y Registro de Urgencias
        </button>
        <button
          onClick={() => setTab('GES')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${tab === 'GES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
        >
          🇨🇱 Formulario Oficial Notificación GES
        </button>
      </div>

      {tab === 'Urgencias' && (
        <div className="space-y-6 print:hidden">
          <div className="bg-red-50/50 p-6 border border-red-200 rounded-2xl">
            <h3 className="font-bold text-sm text-red-900 mb-3 uppercase tracking-wider">Ingresar Atención de Urgencia Inmediata</h3>
            <form onSubmit={handleCrearUrgencia} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Paciente registrado</label>
                  <select
                    onChange={(e) => {
                      const pac = pacientes.find(p => p.id === parseInt(e.target.value))
                      if (pac) setNuevaUrgencia({ ...nuevaUrgencia, paciente: pac.nombre, rut: pac.rut })
                    }}
                    className="w-full p-2 rounded-lg border bg-white"
                  >
                    <option value="">-- Seleccionar paciente --</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.rut})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Escala del Dolor (EVA)</label>
                  <select
                    value={nuevaUrgencia.evaDolor}
                    onChange={(e) => setNuevaUrgencia({ ...nuevaUrgencia, evaDolor: e.target.value })}
                    className="w-full p-2 rounded-lg border bg-white font-bold"
                  >
                    <option value="10/10">🔴 10/10 (Dolor Insoportable)</option>
                    <option value="9/10">🔴 9/10 (Dolor Severo)</option>
                    <option value="8/10">🔴 8/10 (Dolor Muy Fuerte)</option>
                    <option value="6/10">🟡 6/10 (Dolor Moderado)</option>
                    <option value="4/10">🟡 4/10 (Dolor Leve)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-gray-700 font-semibold mb-1">Diagnóstico de Urgencia</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Pulpitis / Absceso / Alveolitis..."
                    value={nuevaUrgencia.motivoUrgencia}
                    onChange={(e) => handleMotivoUrgenciaChange(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white"
                  />
                  {sugerenciasUrgDiag.length > 0 && (
                    <div className="absolute left-0 right-0 top-full bg-white border border-gray-300 rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto mt-1">
                      {sugerenciasUrgDiag.map((diag, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setNuevaUrgencia({ ...nuevaUrgencia, motivoUrgencia: diag }); setSugerenciasUrgDiag([]); }}
                          className="p-2 hover:bg-gray-100 cursor-pointer font-bold text-gray-800 border-b border-gray-100 text-xs"
                        >
                          {diag}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-gray-700 font-semibold mb-1">Procedimiento Resolutivo</label>
                  <input
                    type="text"
                    placeholder="Ej: Pulpectomía / Drenaje / Exodoncia..."
                    value={nuevaUrgencia.tratamientoUrgencia}
                    onChange={(e) => handleTratamientoUrgenciaChange(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white"
                  />
                  {sugerenciasUrgTrat.length > 0 && (
                    <div className="absolute left-0 right-0 top-full bg-white border border-gray-300 rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto mt-1">
                      {sugerenciasUrgTrat.map((trat, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setNuevaUrgencia({ ...nuevaUrgencia, tratamientoUrgencia: trat }); setSugerenciasUrgTrat([]); }}
                          className="p-2 hover:bg-gray-100 cursor-pointer font-bold text-gray-800 border-b border-gray-100 text-xs"
                        >
                          {trat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-red-700">
                🚨 Registrar Atención de Urgencia
              </button>
            </form>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-sm text-gray-900 mb-4">Histórico de Urgencias Atendidas</h3>
            <div className="space-y-3">
              {registroUrgencias.map(u => (
                <div key={u.id} className="p-4 bg-gray-50 rounded-xl border flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-gray-900 block text-sm">{u.paciente} ({u.fecha})</span>
                    <p className="text-gray-600 mt-0.5">Diagnóstico: <strong>{u.motivoUrgencia}</strong> | Acción: {u.tratamientoUrgencia}</p>
                  </div>
                  <span className="bg-red-100 text-red-800 font-extrabold px-3 py-1.5 rounded-lg border border-red-200">
                    EVA: {u.evaDolor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'GES' && (
        <div className="space-y-6">
          <div className="bg-blue-50/50 p-6 border border-blue-200 rounded-2xl text-xs space-y-4 print:hidden">
            <h3 className="font-bold text-sm text-blue-900 uppercase tracking-wider">Generar Notificación Oficial GES con Firma Táctil</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Seleccionar Paciente</label>
                <select
                  onChange={(e) => setPacienteGes(pacientes.find(p => p.id === parseInt(e.target.value)))}
                  className="w-full p-2 rounded-lg border bg-white text-sm"
                >
                  <option value="">-- Seleccionar paciente --</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.rut})</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Patología Odontológica GES</label>
                <select
                  value={patologiaSeleccionada}
                  onChange={(e) => setPatologiaSeleccionada(e.target.value)}
                  className="w-full p-2 rounded-lg border bg-white text-sm"
                >
                  {PATOLOGIAS_GES.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>

            {pacienteGes && (
              <div className="border-t pt-4">
                <label className="block font-bold text-gray-800 mb-2">✍️ Firma Digital del Paciente en Pantalla:</label>
                <FirmaDigitalCanvas
                  alGuardarFirma={(dataUrl) => setFirmaPacienteData(dataUrl)}
                  alLimpiarFirma={() => setFirmaPacienteData(null)}
                />
              </div>
            )}

            <button onClick={() => window.print()} className="bg-black text-white font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800">
              🖨️ Imprimir Formulario Oficial GES Firmado (PDF)
            </button>
          </div>

          {pacienteGes ? (
            <div className="bg-white border-2 border-black p-8 print:p-0 text-xs text-gray-900 font-sans space-y-6">
              <div className="flex justify-between items-start border-b-2 border-black pb-4">
                <div>
                  <h1 className="font-extrabold text-sm uppercase tracking-wider">FORMULARIO DE NOTIFICACIÓN DE GARANTÍAS EXPLÍCITAS EN SALUD (GES)</h1>
                  <p className="text-[10px] text-gray-600 font-medium">Ley N° 19.966 — R.E. N° 387 — Ministerio de Salud de Chile</p>
                </div>
                <div className="text-right">
                  <span className="border border-black px-3 py-1 font-bold text-[10px]">FOLIO GES: #{Date.now().toString().slice(-6)}</span>
                  <p className="text-[10px] text-gray-500 mt-1">Fecha: {new Date().toLocaleDateString('es-CL')}</p>
                </div>
              </div>

              <div className="border p-3 rounded-lg bg-gray-50/50 space-y-1">
                <h3 className="font-bold text-[11px] uppercase border-b pb-1 mb-2">1. INFORMACIÓN DEL PRESTADOR NOTIFICADOR</h3>
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="font-bold">Nombre Profesional:</span> {userProfile?.nombreCompleto}</p>
                  <p><span className="font-bold">RUT Profesional:</span> {userProfile?.rut || 'N/I'}</p>
                  <p><span className="font-bold">Especialidad:</span> {userProfile?.especialidad}</p>
                  <p><span className="font-bold">Establecimiento / Consulta:</span> Consulta Odontológica</p>
                </div>
              </div>

              <div className="border p-3 rounded-lg bg-gray-50/50 space-y-1">
                <h3 className="font-bold text-[11px] uppercase border-b pb-1 mb-2">2. INFORMACIÓN DEL PACIENTE Y CONFIRMACIÓN DIAGNÓSTICA</h3>
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="font-bold">Nombre Paciente:</span> {pacienteGes.nombre}</p>
                  <p><span className="font-bold">RUT Paciente:</span> {pacienteGes.rut}</p>
                  <p><span className="font-bold">Edad:</span> {pacienteGes.edad} años</p>
                  <p><span className="font-bold">Previsión:</span> {pacienteGes.prevision}</p>
                </div>
              </div>

              <div className="border-2 border-black p-4 rounded-xl bg-blue-50/30">
                <span className="font-bold text-[10px] uppercase text-blue-900 block">Problema de Salud GES Diagnosticado:</span>
                <h2 className="text-base font-extrabold text-black mt-1">{patologiaActualObj?.nombre}</h2>
                <p className="text-gray-700 mt-1 italic">{patologiaActualObj?.norma}</p>
              </div>

              <div className="pt-12 grid grid-cols-2 gap-12 text-center items-end">
                <div className="border-t border-black pt-2">
                  <p className="font-bold">{userProfile?.nombreCompleto}</p>
                  <p className="text-[10px] text-gray-600">Firma y Timbre del Cirujano Dentista</p>
                </div>
                <div className="border-t border-black pt-2 flex flex-col items-center">
                  {firmaPacienteData ? (
                    <img src={firmaPacienteData} alt="Firma Paciente" className="h-16 object-contain mb-1" />
                  ) : (
                    <div className="h-16 flex items-center justify-center text-gray-400 italic text-[10px]">Firma en pantalla no registrada</div>
                  )}
                  <p className="font-bold">{pacienteGes.nombre}</p>
                  <p className="text-[10px] text-gray-600">Firma / Huella Digital del Paciente</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400 print:hidden">
              <span className="text-3xl block mb-2">🇨🇱</span>
              <p className="text-xs">Selecciona un paciente arriba para generar su Formulario Oficial GES Notificador.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}