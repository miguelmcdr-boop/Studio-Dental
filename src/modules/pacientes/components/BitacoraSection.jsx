import React, { memo, useState } from 'react'
import { PLANTILLAS_EVOLUCION } from '../../../data/plantillas'
import { useDictadoVoz } from '../hooks/useDictadoVoz'
import { pacientesStorageService } from '../services/pacientesStorageService'

export const BitacoraSection = memo(({ pacienteId, evolucionesNotas, setEvolucionesNotas }) => {
  const [nuevaNota, setNuevaNota] = useState('')
  const [sugerenciasNota, setSugerenciasNota] = useState([])
  const [idNotaEditando, setIdNotaEditando] = useState(null)
  const [textoNotaEditando, setTextoNotaEditando] = useState('')

  const handleTextoDictado = (texto) => {
    setNuevaNota(prev => prev ? `${prev} ${texto}` : texto)
  }

  const { escuchandoVoz, toggleDictadoVoz } = useDictadoVoz(handleTextoDictado)

  const handleNotaInputChange = (texto) => {
    setNuevaNota(texto)
    if (texto.trim().length > 1) {
      const coincidencias = PLANTILLAS_EVOLUCION.filter(p => p.clave.toLowerCase().includes(texto.toLowerCase()))
      setSugerenciasNota(coincidencias)
    } else {
      setSugerenciasNota([])
    }
  }

  const handleConcatenarPlantilla = (textoPlantilla) => {
    setNuevaNota(prev => prev ? `${prev} ${textoPlantilla}` : textoPlantilla)
    setSugerenciasNota([])
  }

  const handleAgregarEvolucionNota = (e) => {
    e.preventDefault()
    if (!nuevaNota.trim()) return
    const notaObj = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      texto: nuevaNota
    }
    const actualizadas = [notaObj, ...evolucionesNotas]
    setEvolucionesNotas(actualizadas)
    pacientesStorageService.guardarItem(`evoluciones_notas_${pacienteId}`, actualizadas)
    setNuevaNota('')
  }

  const handleEliminarNota = (idNota) => {
    const actualizadas = evolucionesNotas.filter(n => n.id !== idNota)
    setEvolucionesNotas(actualizadas)
    pacientesStorageService.guardarItem(`evoluciones_notas_${pacienteId}`, actualizadas)
  }

  const handleGuardarNotaEditada = (idNota) => {
    const actualizadas = evolucionesNotas.map(n => n.id === idNota ? { ...n, texto: textoNotaEditando } : n)
    setEvolucionesNotas(actualizadas)
    pacientesStorageService.guardarItem(`evoluciones_notas_${pacienteId}`, actualizadas)
    setIdNotaEditando(null)
    setTextoNotaEditando('')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 text-xs shadow-sm">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Bitácora de Atenciones / Ficha de Evolución Diaria</h3>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDictadoVoz}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
              escuchandoVoz ? 'bg-red-600 text-white animate-pulse' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <span>🎙️</span> {escuchandoVoz ? 'Escuchando... (Haz clic para parar)' : 'Dictar por Voz'}
          </button>

          <div className="flex gap-1 overflow-x-auto">
            {PLANTILLAS_EVOLUCION.map(p => (
              <button
                key={p.clave}
                type="button"
                onClick={() => handleConcatenarPlantilla(p.texto)}
                className="bg-gray-100 hover:bg-black hover:text-white border px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all"
              >
                + {p.clave}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <form onSubmit={handleAgregarEvolucionNota} className="flex gap-2 relative">
        <div className="flex-1 relative">
          <input
            type="text"
            value={nuevaNota}
            onChange={(e) => handleNotaInputChange(e.target.value)}
            placeholder="Escribe, dicta por voz o presiona las frases rápidas de arriba para concatenarlas..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300"
          />

          {sugerenciasNota.length > 0 && (
            <div className="absolute left-0 right-0 top-full bg-white border border-gray-300 rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto mt-1">
              {sugerenciasNota.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleConcatenarPlantilla(item.texto)}
                  className="p-2.5 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                >
                  <p className="font-bold text-gray-900">{item.clave}</p>
                  <p className="text-[10px] text-gray-500 truncate">{item.texto}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="bg-black text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800">
          + Agregar Nota
        </button>
      </form>

      <div className="space-y-2 mt-4">
        {evolucionesNotas.map(nota => (
          <div key={nota.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-start gap-4">
            {idNotaEditando === nota.id ? (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={textoNotaEditando}
                  onChange={(e) => setTextoNotaEditando(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded text-xs"
                />
                <button onClick={() => handleGuardarNotaEditada(nota.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold">Guardar</button>
                <button onClick={() => setIdNotaEditando(null)} className="bg-gray-300 text-gray-800 px-3 py-1 rounded text-xs">Cancelar</button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <span className="font-bold text-gray-800 block text-[11px]">{nota.fecha}</span>
                  <p className="text-gray-700 mt-1">{nota.texto}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setIdNotaEditando(nota.id); setTextoNotaEditando(nota.texto); }} className="text-gray-500 hover:text-black font-semibold text-xs">✏️ Editar</button>
                  <button onClick={() => handleEliminarNota(nota.id)} className="text-red-500 hover:text-red-700 font-semibold text-xs">🗑️ Borrar</button>
                </div>
              </>
            )}
          </div>
        ))}
        {evolucionesNotas.length === 0 && (
          <p className="text-gray-400 text-center py-4">No hay evoluciones clínicas registradas todavía.</p>
        )}
      </div>
    </div>
  )
})

BitacoraSection.displayName = 'BitacoraSection'