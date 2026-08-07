import React, { memo, useState } from 'react'
import { VADEMECUM_ODONTOLOGICO } from '../../../data/vademecum'
import { evaluarIncompatibilidadFarmaco } from '../utils/pacientesCalculations'
import { pacientesStorageService } from '../services/pacientesStorageService'

export const RecetasSection = memo(({ paciente, userProfile, alergiasPaciente, recetas, setRecetas }) => {
  const [nuevaReceta, setNuevaReceta] = useState({ medicamento: '', indicacion: '' })
  const [sugerenciasVademecum, setSugerenciasVademecum] = useState([])
  const [alertaFarmaco, setAlertaFarmaco] = useState(null)

  const handleMedicamentoInputChange = (texto) => {
    setNuevaReceta({ ...nuevaReceta, medicamento: texto })
    setAlertaFarmaco(null)

    if (texto.trim().length > 1) {
      const coincidencias = VADEMECUM_ODONTOLOGICO.filter(v =>
        v.medicamento.toLowerCase().includes(texto.toLowerCase())
      )
      setSugerenciasVademecum(coincidencias)

      const alerta = evaluarIncompatibilidadFarmaco(texto, alergiasPaciente)
      setAlertaFarmaco(alerta)
    } else {
      setSugerenciasVademecum([])
    }
  }

  const handleSeleccionarSugerencia = (item) => {
    setNuevaReceta({ medicamento: item.medicamento, indicacion: item.posologia })
    setSugerenciasVademecum([])
    const alerta = evaluarIncompatibilidadFarmaco(item.medicamento, alergiasPaciente)
    setAlertaFarmaco(alerta)
  }

  const handleAgregarReceta = (e) => {
    e.preventDefault()
    if (!nuevaReceta.medicamento || !nuevaReceta.indicacion) return
    const recetaObj = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL'),
      medicamento: nuevaReceta.medicamento,
      indicacion: nuevaReceta.indicacion
    }
    const actualizadas = [recetaObj, ...recetas]
    setRecetas(actualizadas)
    pacientesStorageService.guardarItem(`recetas_${paciente.id}`, actualizadas)
    setNuevaReceta({ medicamento: '', indicacion: '' })
    setAlertaFarmaco(null)
  }

  const handleEliminarReceta = (id) => {
    const actualizadas = recetas.filter(r => r.id !== id)
    setRecetas(actualizadas)
    pacientesStorageService.guardarItem(`recetas_${paciente.id}`, actualizadas)
  }

  return (
    <div>
      <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl mb-6 print:hidden">
        <h4 className="font-bold text-xs text-gray-800 mb-3 uppercase tracking-wider">Emitir Nueva Receta Médica</h4>
        
        {alertaFarmaco && (
          <div className={`p-4 rounded-xl border mb-4 text-xs ${
            alertaFarmaco.tipo === 'critica'
              ? 'bg-red-100 border-red-300 text-red-900'
              : alertaFarmaco.tipo === 'sin_datos'
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-yellow-100 border-yellow-300 text-yellow-900'
          }`}>
            <p className="font-bold text-sm">{alertaFarmaco.mensaje}</p>
            <p className="mt-1 font-semibold">{alertaFarmaco.sugerencia}</p>
          </div>
        )}

        <form onSubmit={handleAgregarReceta} className="space-y-3 text-xs relative">
          <div className="relative">
            <label className="block text-gray-600 mb-1 font-semibold">Fármaco / Medicamento</label>
            <input
              type="text"
              placeholder="Empieza a escribir... Ej: Amoxicilina, Ibuprofeno, Lidocaína..."
              value={nuevaReceta.medicamento}
              onChange={(e) => handleMedicamentoInputChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            />

            {sugerenciasVademecum.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                {sugerenciasVademecum.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSeleccionarSugerencia(item)}
                    className="p-2.5 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-none"
                  >
                    <p className="font-bold text-gray-800">{item.medicamento}</p>
                    <p className="text-[10px] text-gray-500">{item.posologia}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-semibold">Posología e Indicaciones</label>
            <textarea
              rows="2"
              placeholder="Ej: Tomar 1 comprimido cada 8 horas por 7 días vía oral."
              value={nuevaReceta.indicacion}
              onChange={(e) => setNuevaReceta({ ...nuevaReceta, indicacion: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            />
          </div>

          <button type="submit" className="bg-black text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-800">
            + Emitir Receta
          </button>
        </form>

        <p className="text-[10px] text-gray-400 mt-3">
          La validación automática de alergias cubre únicamente Penicilinas/Betalactámicos y AINEs.
          Para cualquier otro fármaco, verifique manualmente los antecedentes alérgicos del paciente.
        </p>
      </div>

      <div className="flex justify-end mb-4 print:hidden">
        <button onClick={() => window.print()} className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 shadow-sm">
          🖨️ Imprimir Receta
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 print:border-none print:p-0">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez'}</h1>
            <p className="text-xs text-gray-600">{userProfile?.especialidad || 'Cirujano Dentista'} | RUT: {userProfile?.rut || 'N/I'}</p>
            <p className="text-xs text-gray-500">Consulta Odontológica</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-800 uppercase">Receta Médica</h2>
            <p className="text-xs text-gray-500">Fecha: {new Date().toLocaleDateString('es-CL')}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-xs grid grid-cols-2 gap-2 print:bg-white print:border">
          <p><span className="font-bold">Paciente:</span> {paciente.nombre}</p>
          <p><span className="font-bold">RUT:</span> {paciente.rut}</p>
        </div>

        <div className="space-y-4">
          {recetas.map((r, i) => (
            <div key={r.id} className="p-4 border rounded-xl bg-gray-50 print:bg-white print:border-b">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-sm text-gray-900 block">{i + 1}. {r.medicamento}</span>
                  <p className="text-xs text-gray-700 mt-1"><span className="font-semibold">Indicación:</span> {r.indicacion}</p>
                </div>
                <button onClick={() => handleEliminarReceta(r.id)} className="text-red-500 font-bold print:hidden">✕</button>
              </div>
            </div>
          ))}
          {recetas.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No hay recetas prescritas para este paciente.</p>}
        </div>

        <div className="hidden print:block mt-24 pt-10 border-t border-gray-300 text-center">
          <div className="w-64 mx-auto border-t border-black pt-2">
            <p className="font-bold text-xs">{userProfile?.nombreCompleto}</p>
            <p className="text-[10px] text-gray-600">Firma y Timbre Médico</p>
          </div>
        </div>
      </div>
    </div>
  )
})

RecetasSection.displayName = 'RecetasSection'