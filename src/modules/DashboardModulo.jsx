import React, { useState, useEffect } from 'react'

export const DashboardModulo = ({ userProfile, pacientes = [], setPacienteSeleccionado, setActiveSection }) => {
  const hoyFecha = new Date().toISOString().split('T')[0]

  const [citas] = useState(() => {
    const saved = localStorage.getItem('clinica_citas_agenda')
    return saved ? JSON.parse(saved) : []
  })

  const citasHoy = citas.filter(c => c.fecha === hoyFecha)
  const citasAtendidasHoy = citasHoy.filter(c => c.estado === 'Atendido')

  const [totalRecaudadoMes, setTotalRecaudadoMes] = useState(0)

  useEffect(() => {
    let sumaAbonos = 0
    pacientes.forEach(p => {
      const savedAbonos = localStorage.getItem(`abonos_${p.id}`)
      if (savedAbonos) {
        const abonosLista = JSON.parse(savedAbonos)
        abonosLista.forEach(a => {
          sumaAbonos += a.monto || 0
        })
      }
    })
    setTotalRecaudadoMes(sumaAbonos)
  }, [pacientes])

  const abrirFichaPacientePorNombre = (nombre) => {
    const pac = pacientes.find(p => p.nombre.toLowerCase().trim() === nombre.toLowerCase().trim())
    if (pac) {
      setPacienteSeleccionado(pac)
      setActiveSection('Pacientes')
    } else {
      setActiveSection('Pacientes')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            ¡Hola, {userProfile?.nombreCompleto || 'Doctor(a)'}! 👋
          </h2>
          <p className="text-xs text-gray-500">Resumen operativo de tu consulta odontológica para el día de hoy.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveSection('Agenda')}
            className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
          >
            📅 Ir a la Agenda
          </button>
          <button
            onClick={() => setActiveSection('Pacientes')}
            className="bg-gray-100 text-gray-800 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200"
          >
            👥 Directorio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Citas Hoy</span>
            <span className="text-lg">📅</span>
          </div>
          <span className="text-2xl font-extrabold text-gray-900">{citasHoy.length}</span>
          <p className="text-[11px] text-gray-400 mt-1">Pacientes citados para hoy</p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Atendidos Hoy</span>
            <span className="text-lg">🟢</span>
          </div>
          <span className="text-2xl font-extrabold text-green-700">{citasAtendidasHoy.length}</span>
          <p className="text-[11px] text-gray-400 mt-1">Sillón completado</p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Pacientes Registrados</span>
            <span className="text-lg">👥</span>
          </div>
          <span className="text-2xl font-extrabold text-gray-900">{pacientes.length}</span>
          <p className="text-[11px] text-gray-400 mt-1">Fichas clínicas activas</p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Abonos Recaudados</span>
            <span className="text-lg">💳</span>
          </div>
          <span className="text-2xl font-extrabold text-gray-900">${totalRecaudadoMes.toLocaleString('es-CL')}</span>
          <p className="text-[11px] text-gray-400 mt-1">Monto total registrado</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs mb-6">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="font-bold text-sm text-gray-900">
            Pacientes Citados para Hoy ({new Date().toLocaleDateString('es-CL')})
          </h3>
          <button onClick={() => setActiveSection('Agenda')} className="text-xs text-blue-600 font-bold hover:underline">
            Ver Agenda Completa →
          </button>
        </div>

        <div className="space-y-3">
          {citasHoy.map(c => (
            <div key={c.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="bg-black text-white font-bold px-3 py-1.5 rounded-lg text-xs">{c.hora}</span>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{c.paciente}</h4>
                  <p className="text-xs text-gray-500">{c.motivo}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold bg-gray-200 px-2.5 py-1 rounded-md text-gray-700">{c.estado}</span>
                <button
                  onClick={() => abrirFichaPacientePorNombre(c.paciente)}
                  className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-blue-100"
                >
                  Abrir Ficha →
                </button>
              </div>
            </div>
          ))}

          {citasHoy.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">No hay citas programadas para el día de hoy.</p>
          )}
        </div>
      </div>
    </div>
  )
}