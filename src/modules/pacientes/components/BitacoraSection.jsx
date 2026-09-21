import React, { memo, useState } from 'react'
import { Square, Mic, Calendar, Trash2 } from 'lucide-react'
// F6-D-5: usar evolucionesStorageService en lugar de pacientesStorageService.guardarItem
import { evolucionesStorageService } from '../services/evolucionesStorageService'
import { useDictadoVoz } from '../hooks/useDictadoVoz'
import { createLogger } from '../../../services/logger.js'
import { useAppDialog } from '../../../hooks/useAppDialog'
import { PenSquare } from 'lucide-react'

const log = createLogger('BitacoraSection')

export const BitacoraSection = memo(({ pacienteId, evolucionesNotas = [], setEvolucionesNotas }) => {
  const [textoNuevaEvolucion, setTextoNuevaEvolucion] = useState('')
  const { confirm } = useAppDialog()
  const [loteAutoclave, setLoteAutoclave] = useState('')

  const { escuchando, textoDictado, iniciarDictado, detenerDictado, soporteNativo } = useDictadoVoz()

  const handleAgregarNota = (e) => {
    e.preventDefault()
    if (!textoNuevaEvolucion.trim()) return

    const fechaHora = new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    const textoConLote = loteAutoclave.trim()
      ? `${textoNuevaEvolucion.trim()} — [Lote Autoclave/Esterilización: ${loteAutoclave.trim()}]`
      : textoNuevaEvolucion.trim()

    const nuevaNota = {
      id: Date.now(),
      fecha: fechaHora,
      texto: textoConLote
    }

    const actualizadas = [nuevaNota, ...evolucionesNotas]
    setEvolucionesNotas(actualizadas)
    // F6-D-5: usar evolucionesStorageService (Supabase + localStorage)
    evolucionesStorageService.guardarEvoluciones(pacienteId, actualizadas).catch(err => {
      log.warn('Error guardando evoluciones:', err)
    })

    setTextoNuevaEvolucion('')
    setLoteAutoclave('')
  }

  const handleAplicarDictadoAForm = () => {
    if (!textoDictado) return
    setTextoNuevaEvolucion(prev => prev ? `${prev} ${textoDictado}` : textoDictado)
  }

  const handleEliminarNota = async (idNota) => {
    const ok = await confirm({
      title: 'Eliminar nota clínica',
      description: '¿Deseas eliminar esta nota clínica de la bitácora?',
      variant: 'danger',
      confirmText: 'Eliminar'
    })
    if (ok) {
      const actualizadas = evolucionesNotas.filter(n => n.id !== idNota)
      setEvolucionesNotas(actualizadas)
      // F6-D-5: usar evolucionesStorageService (Supabase + localStorage)
      evolucionesStorageService.guardarEvoluciones(pacienteId, actualizadas).catch(err => {
        log.warn('Error guardando evoluciones:', err)
      })
    }
  }

  return (
    <div className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-2xl p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
        <h3 className="font-bold text-xs text-gray-800 dark:text-graphite-100 uppercase tracking-wider">
          <span className="inline-flex items-center gap-1"><PenSquare size={12} />Bitácora de Evoluciones Clínicas & Historial</span>
        </h3>

        {soporteNativo && (
          <button
            type="button"
            onClick={escuchando ? detenerDictado : iniciarDictado}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              escuchando
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-gray-100 dark:bg-graphite-800 text-gray-800 dark:text-graphite-100 hover:bg-gray-200 border'
            }`}
          >
            {escuchando ? <span className='inline-flex items-center gap-1'><Square size={12} className='fill-red-500' />Escuchando... (Clic para detener)</span> : <span className='inline-flex items-center gap-1'><Mic size={12} />Dictado Hands-Free</span>}
          </button>
        )}
      </div>

      {escuchando && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-red-900"><span className="inline-flex items-center gap-1"><Mic size={12} />Transcripción por Voz en Tiempo Real:</span></span>
            <button
              onClick={handleAplicarDictadoAForm}
              className="bg-red-700 text-white font-bold px-3 py-1 rounded-lg text-[10px]"
            >
              + Insertar Texto Dictado
            </button>
          </div>
          <p className="italic text-gray-800 dark:text-graphite-100 bg-white dark:bg-graphite-800 p-2 rounded border">
            "{textoDictado || 'Habla claro hacia el micrófono para registrar la evolución...'}"
          </p>
        </div>
      )}

      <form onSubmit={handleAgregarNota} className="space-y-3 text-xs">
        <textarea
          rows="3"
          required
          placeholder="Escribe el detalle de la evolución clínica, tratamiento realizado, pieza intervenida, anestesia o hallazgos..."
          value={textoNuevaEvolucion}
          onChange={(e) => setTextoNuevaEvolucion(e.target.value)}
          className="w-full p-3 rounded-xl border border-gray-300 dark:border-graphite-600 focus:outline-none focus:border-black font-medium"
        />

        <div className="flex justify-between items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-600 dark:text-graphite-400">Trazabilidad SEREMI (Opcional):</span>
            <input
              type="text"
              placeholder="Ej: LOTE-2026-0804-01"
              value={loteAutoclave}
              onChange={(e) => setLoteAutoclave(e.target.value)}
              className="px-3 py-1.5 border rounded-lg bg-gray-50 dark:bg-graphite-800 text-xs w-48 font-bold"
            />
          </div>

          <button
            type="submit"
            className="bg-black text-white font-bold px-4 py-2 rounded-xl hover:bg-gray-800 cursor-pointer"
          >
            + Registrar Evolución
          </button>
        </div>
      </form>

      <div className="space-y-3 pt-4 border-t">
        {evolucionesNotas.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-graphite-500 text-center py-4">No hay evoluciones registradas en la bitácora de este paciente.</p>
        ) : (
          evolucionesNotas.map(nota => (
            <div key={nota.id} className="p-4 bg-gray-50 dark:bg-graphite-800 rounded-xl border border-gray-200 dark:border-graphite-700 text-xs space-y-1">
              <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-graphite-400 font-bold border-b pb-1">
                <span className="inline-flex items-center gap-1"><Calendar size={10} />{nota.fecha}</span>
                <button onClick={() => handleEliminarNota(nota.id)} className="text-red-500 hover:text-red-700 cursor-pointer" aria-label="Eliminar nota"><span className="inline-flex items-center gap-1"><Trash2 size={12} />Borrar</span></button>
              </div>
              <p className="text-gray-800 dark:text-graphite-100 font-medium pt-1 whitespace-pre-wrap">{nota.texto}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
})

BitacoraSection.displayName = 'BitacoraSection'