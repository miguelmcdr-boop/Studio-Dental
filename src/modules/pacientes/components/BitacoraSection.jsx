import React, { memo, useState } from 'react'
// F6-D-5: usar evolucionesStorageService en lugar de pacientesStorageService.guardarItem
import { evolucionesStorageService } from '../services/evolucionesStorageService'
import { useDictadoVoz } from '../hooks/useDictadoVoz'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('BitacoraSection')

export const BitacoraSection = memo(({ pacienteId, evolucionesNotas = [], setEvolucionesNotas }) => {
  const [textoNuevaEvolucion, setTextoNuevaEvolucion] = useState('')
  const [loteAutoclave, setLoteAutoclave] = useState('')

  const { escuchando, textoDictado, iniciarDictado, detenerDictado, soporteNativo } = useDictadoVoz()

  const handleAgregarNota = (e) => {
    e.preventDefault()
    if (!textoNuevaEvolucion.trim()) return

    const fechaHora = new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    const textoConLote = loteAutoclave.trim()
      ? `${textoNuevaEvolucion.trim()} — 🧼 [Lote Autoclave/Esterilización: ${loteAutoclave.trim()}]`
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

  const handleEliminarNota = (idNota) => {
    if (window.confirm('¿Deseas eliminar esta nota clínica de la bitácora?')) {
      const actualizadas = evolucionesNotas.filter(n => n.id !== idNota)
      setEvolucionesNotas(actualizadas)
      // F6-D-5: usar evolucionesStorageService (Supabase + localStorage)
      evolucionesStorageService.guardarEvoluciones(pacienteId, actualizadas).catch(err => {
        log.warn('Error guardando evoluciones:', err)
      })
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
        <h3 className="font-bold text-xs text-gray-800 uppercase tracking-wider">
          📝 Bitácora de Evoluciones Clínicas & Historial
        </h3>

        {soporteNativo && (
          <button
            type="button"
            onClick={escuchando ? detenerDictado : iniciarDictado}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              escuchando
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border'
            }`}
          >
            {escuchando ? '🔴 Escuchando... (Clic para detener)' : '🎙️ Dictado Hands-Free'}
          </button>
        )}
      </div>

      {escuchando && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-red-900">🎙️ Transcripción por Voz en Tiempo Real:</span>
            <button
              onClick={handleAplicarDictadoAForm}
              className="bg-red-700 text-white font-bold px-3 py-1 rounded-lg text-[10px]"
            >
              + Insertar Texto Dictado
            </button>
          </div>
          <p className="italic text-gray-800 bg-white p-2 rounded border">
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
          className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black font-medium"
        />

        <div className="flex justify-between items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-600">🧼 Trazabilidad SEREMI (Opcional):</span>
            <input
              type="text"
              placeholder="Ej: LOTE-2026-0804-01"
              value={loteAutoclave}
              onChange={(e) => setLoteAutoclave(e.target.value)}
              className="px-3 py-1.5 border rounded-lg bg-gray-50 text-xs w-48 font-bold"
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
          <p className="text-xs text-gray-400 text-center py-4">No hay evoluciones registradas en la bitácora de este paciente.</p>
        ) : (
          evolucionesNotas.map(nota => (
            <div key={nota.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
              <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold border-b pb-1">
                <span>🗓️ {nota.fecha}</span>
                <button onClick={() => handleEliminarNota(nota.id)} className="text-red-500 hover:text-red-700 cursor-pointer" aria-label="Eliminar nota">🗑️ Borrar</button>
              </div>
              <p className="text-gray-800 font-medium pt-1 whitespace-pre-wrap">{nota.texto}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
})

BitacoraSection.displayName = 'BitacoraSection'