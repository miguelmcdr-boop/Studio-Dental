import React, { memo, useState, useEffect } from 'react'
import { vademecumService } from '../../../services/vademecumService'
import { VADEMECUM_ODONTOLOGICO } from '../../../data/vademecum'
import { evaluarIncompatibilidadFarmaco } from '../utils/pacientesCalculations'
import { AlertaAlergiaMejorada } from './AlertaAlergiaMejorada'

/**
 * Formulario para emitir nueva receta médica (F6-D-4 refactor)
 * 
 * Componente extraído de RecetasSection.jsx para respetar el límite
 * arquitectónico de 217 líneas. Encapsula:
 * - Estado del formulario
 * - Carga de vademecum (Supabase con fallback local)
 * - Sugerencias autocompletado
 * - Validación de incompatibilidades farmacológicas
 */
export const FormularioNuevaReceta = memo(({ alergiasPaciente, onAgregarReceta }) => {
  const [nuevaReceta, setNuevaReceta] = useState({ medicamento: '', indicacion: '' })
  const [sugerenciasVademecum, setSugerenciasVademecum] = useState([])
  const [alertaFarmaco, setAlertaFarmaco] = useState(null)
  
  // F4-03g: Vademécum cargado desde Supabase (94 fármacos) con fallback a datos locales (22 fármacos)
  const [vademecumCargado, setVademecumCargado] = useState(VADEMECUM_ODONTOLOGICO)
  
  useEffect(() => {
    // F4-03g-fix: Construye posología completa combinando campos existentes
    const construirPosologiaCompleta = (f) => {
      let posologia = f.posologia_adulto || f.posologiaAdulto || ''
      
      if (!posologia) return f.presentacion || 'Dosis según indicación médica'
      
      const duracion = f.duracion_dias || f.duracionDias
      if (duracion && !posologia.toLowerCase().includes('día') && !posologia.toLowerCase().includes('dias')) {
        posologia += ` por ${duracion}`
      }
      
      if (!posologia.toLowerCase().includes('oral') && 
          !posologia.toLowerCase().includes('vo') &&
          !posologia.toLowerCase().includes('sublingual') &&
          !posologia.toLowerCase().includes('tópico') &&
          !posologia.toLowerCase().includes('inyec')) {
        posologia += ' vía oral'
      }
      
      return posologia
    }
    
    const cargarVademecum = () => {
      try {
        const desdeService = vademecumService.obtenerVademecum()
        if (Array.isArray(desdeService) && desdeService.length > 0) {
          const adaptado = desdeService.map(f => ({
            medicamento: f.nombre_generico || f.nombreGenerico || '',
            posologia: construirPosologiaCompleta(f),
            familia: f.familia || ''
          }))
          setVademecumCargado(adaptado)
        } else {
          setVademecumCargado(VADEMECUM_ODONTOLOGICO)
        }
      } catch (e) {
        console.warn('[FormularioNuevaReceta] vademecumService no disponible, usando datos locales:', e?.message)
        setVademecumCargado(VADEMECUM_ODONTOLOGICO)
      }
    }
    cargarVademecum()
  }, [])

  const handleMedicamentoInputChange = (texto) => {
    setNuevaReceta({ ...nuevaReceta, medicamento: texto })
    setAlertaFarmaco(null)

    if (texto.trim().length > 1) {
      const coincidencias = vademecumCargado.filter(v =>
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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nuevaReceta.medicamento || !nuevaReceta.indicacion) return
    
    const recetaObj = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL'),
      medicamento: nuevaReceta.medicamento,
      indicacion: nuevaReceta.indicacion
    }
    onAgregarReceta(recetaObj)
    setNuevaReceta({ medicamento: '', indicacion: '' })
    setAlertaFarmaco(null)
  }

  return (
    <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl mb-6 print:hidden">
      <h4 className="font-bold text-xs text-gray-800 mb-3 uppercase tracking-wider">Emitir Nueva Receta Médica</h4>
      
      {alertaFarmaco && <AlertaAlergiaMejorada alerta={alertaFarmaco} />}

      <form onSubmit={handleSubmit} className="space-y-3 text-xs relative">
        <div className="relative">
          <label className="block text-gray-600 mb-1 font-semibold">Fármaco / Medicamento</label>
          <input
            data-testid="receta-farmaco"
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
            data-testid="receta-indicacion"
            rows="2"
            placeholder="Ej: Tomar 1 comprimido cada 8 horas por 7 días vía oral."
            value={nuevaReceta.indicacion}
            onChange={(e) => setNuevaReceta({ ...nuevaReceta, indicacion: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg bg-white"
          />
        </div>

        <button data-testid="btn-emitir-receta" type="submit" className="bg-black text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-800">
          + Emitir Receta
        </button>
      </form>

      <p className="text-[10px] text-gray-400 mt-3">
        La validación automática evalúa reactividad cruzada entre las 16 familias farmacológicas del vademécum v1.1.
        Si las alergias del paciente no están registradas, verifique manualmente los antecedentes antes de prescribir.
      </p>
    </div>
  )
})

FormularioNuevaReceta.displayName = 'FormularioNuevaReceta'
