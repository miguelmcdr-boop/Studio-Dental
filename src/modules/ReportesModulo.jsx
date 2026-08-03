import React, { useState } from 'react'

export const ReportesModulo = ({ pacientes = [] }) => {
  const [citas] = useState(() => {
    const saved = localStorage.getItem('clinica_citas_agenda')
    return saved ? JSON.parse(saved) : []
  })

  const totalCitas = citas.length
  const citasAtendidas = citas.filter(c => c.estado === 'Atendido').length
  const citasInasistencia = citas.filter(c => c.estado === 'Inasistencia').length
  const tasaAsistencia = totalCitas > 0 ? Math.round((citasAtendidas / totalCitas) * 100) : 0

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes y Métricas Clínicas</h2>
          <p className="text-xs text-gray-500">Análisis operativo, tasas de asistencia y actividad de la consulta.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Total Citas Registradas</span>
          <span className="text-2xl font-extrabold text-gray-900">{totalCitas}</span>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Efectividad / Asistencia</span>
          <span className="text-2xl font-extrabold text-green-700">{tasaAsistencia}%</span>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Atenciones Concluidas</span>
          <span className="text-2xl font-extrabold text-blue-600">{citasAtendidas}</span>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Inasistencias / Canceladas</span>
          <span className="text-2xl font-extrabold text-red-600">{citasInasistencia}</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-sm text-gray-900 mb-4 border-b pb-2">Distribución de Pacientes por Previsión</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-xs text-gray-500 block font-bold">Fonasa</span>
            <span className="text-lg font-extrabold text-gray-800">
              {pacientes.filter(p => p.prevision === 'Fonasa').length} pacientes
            </span>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-xs text-gray-500 block font-bold">Isapre</span>
            <span className="text-lg font-extrabold text-gray-800">
              {pacientes.filter(p => p.prevision === 'Isapre').length} pacientes
            </span>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-xs text-gray-500 block font-bold">Particular</span>
            <span className="text-lg font-extrabold text-gray-800">
              {pacientes.filter(p => p.prevision === 'Particular' || !p.prevision).length} pacientes
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}