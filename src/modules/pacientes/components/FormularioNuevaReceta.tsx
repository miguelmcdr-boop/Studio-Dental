import React, { memo, useState, useEffect } from 'react'
import { vademecumService, type FarmacoVademecum } from '../../../services/vademecumService'
import { VADEMECUM_ODONTOLOGICO } from '../../../data/vademecum'
import { evaluarIncompatibilidadFarmaco } from '../utils/pacientesCalculations'
import { AlertaAlergiaMejorada, type AlertaAlergiaData } from './AlertaAlergiaMejorada'
import { createLogger } from '../../../services/logger'

const log = createLogger('FormularioNuevaReceta')

export interface VademecumItemLocal {
  medicamento: string
  posologia: string
  familia: string
}

export interface FormularioNuevaRecetaProps {
  alergiasPaciente?: string | null
  onAgregarReceta: (receta: { id: number; fecha: string; medicamento: string; indicacion: string }) => void
}

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
export const FormularioNuevaReceta: React.FC<FormularioNuevaRecetaProps> = memo(({ alergiasPaciente, onAgregarReceta }) => {
  const [nuevaReceta, setNuevaReceta] = useState({ medicamento: '', indicacion: '' })
  const [sugerenciasVademecum, setSugerenciasVademecum] = useState<VademecumItemLocal[]>([])
  const [alertaFarmaco, setAlertaFarmaco] = useState<AlertaAlergiaData | null>(null)
  
  // F4-03g: Vademécum cargado desde Supabase (94 fármacos) con fallback a datos locales (22 fármacos)
  const [vademecumCargado, setVademecumCargado] = useState<VademecumItemLocal[]>(VADEMECUM_ODONTOLOGICO as VademecumItemLocal[])
  
  useEffect(() => {
    // F4-03g-fix: Construye posología completa combinando campos existentes
    const construirPosologiaCompleta = (f: FarmacoVademecum | (Record<string, unknown> & { posologia_adulto?: string; posologiaAdulto?: string; presentacion?: string; duracion_dias?: string; duracionDias?: string })): string => {
      let posologia = f.posologia_adulto || (f as Record<string, unknown>).posologiaAdulto as string || ''
      
      if (!posologia) return f.presentacion || 'Dosis según indicación médica'
      
      const duracion = f.duracion_dias || (f as Record<string, unknown>).duracionDias as string
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
    
    const cargarVademecum = (): void => {
      try {
        const desdeService = vademecumService.obtenerVademecum()
        if (Array.isArray(desdeService) && desdeService.length > 0) {
          const adaptado: VademecumItemLocal[] = desdeService.map(f => ({
            medicamento: f.nombre_generico || (f as Record<string, unknown>).nombreGenerico as string || '',
            posologia: construirPosologiaCompleta(f),
            familia: f.familia || ''
          }))
          setVademecumCargado(adaptado)
        } else {
          setVademecumCargado(VADEMECUM_ODONTOLOGICO as VademecumItemLocal[])
        }
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e)
        log.warn('vademecumService no disponible, usando datos locales:', errorMsg)
        setVademecumCargado(VADEMECUM_ODONTOLOGICO as VademecumItemLocal[])
      }
    }
    cargarVademecum()
  }, [])

  const handleMedicamentoInputChange = (texto: string): void => {
    setNuevaReceta({ ...nuevaReceta, medicamento: texto })
    setAlertaFarmaco(null)

    if (texto.trim().length > 1) {
      const coincidencias = vademecumCargado.filter(v =>
        v.medicamento.toLowerCase().includes(texto.toLowerCase())
      )
      setSugerenciasVademecum(coincidencias)

      const alerta = evaluarIncompatibilidadFarmaco(texto, alergiasPaciente || '')
      setAlertaFarmaco(alerta as AlertaAlergiaData | null)
    } else {
      setSugerenciasVademecum([])
    }
  }

  const handleSeleccionarSugerencia = (item: VademecumItemLocal): void => {
    setNuevaReceta({ medicamento: item.medicamento, indicacion: item.posologia })
    setSugerenciasVademecum([])
    const alerta = evaluarIncompatibilidadFarmaco(item.medicamento, alergiasPaciente || '')
    setAlertaFarmaco(alerta as AlertaAlergiaData | null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
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
    <div className="bg-gray-50 dark:bg-graphite-800 p-4 border border-gray-200 dark:border-graphite-700 rounded-2xl mb-6 print:hidden">
      <h4 className="font-bold text-xs text-gray-800 dark:text-graphite-100 mb-3 uppercase tracking-wider">Emitir Nueva Receta Médica</h4>
      
      {alertaFarmaco && <AlertaAlergiaMejorada alerta={alertaFarmaco} />}

      <form onSubmit={handleSubmit} className="space-y-3 text-xs relative">
        <div className="relative">
          <label className="block text-gray-600 dark:text-graphite-400 mb-1 font-semibold">Fármaco / Medicamento</label>
          <input
            data-testid="receta-farmaco"
            type="text"
            placeholder="Empieza a escribir... Ej: Amoxicilina, Ibuprofeno, Lidocaína..."
            value={nuevaReceta.medicamento}
            onChange={(e) => handleMedicamentoInputChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-graphite-800"
          />

          {sugerenciasVademecum.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-graphite-800 border border-gray-300 dark:border-graphite-600 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
              {sugerenciasVademecum.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSeleccionarSugerencia(item)}
                  className="p-2.5 hover:bg-gray-100 dark:hover:bg-graphite-700 cursor-pointer border-b border-gray-100 dark:border-graphite-800 last:border-none transition-colors duration-150"
                >
                  <p className="font-bold text-gray-800 dark:text-graphite-100">{item.medicamento}</p>
                  <p className="text-[10px] text-gray-500 dark:text-graphite-400">{item.posologia}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-gray-600 dark:text-graphite-400 mb-1 font-semibold">Posología e Indicaciones</label>
          <textarea
            data-testid="receta-indicacion"
            rows={2}
            placeholder="Ej: Tomar 1 comprimido cada 8 horas por 7 días vía oral."
            value={nuevaReceta.indicacion}
            onChange={(e) => setNuevaReceta({ ...nuevaReceta, indicacion: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-graphite-800"
          />
        </div>

        <button data-testid="btn-emitir-receta" type="submit" className="bg-black text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-150">
          + Emitir Receta
        </button>
      </form>

      <p className="text-[10px] text-gray-400 dark:text-graphite-500 mt-3">
        La validación automática evalúa reactividad cruzada entre las 16 familias farmacológicas del vademécum v1.1.
        Si las alergias del paciente no están registradas, verifique manualmente los antecedentes antes de prescribir.
      </p>
    </div>
  )
})

FormularioNuevaReceta.displayName = 'FormularioNuevaReceta'
