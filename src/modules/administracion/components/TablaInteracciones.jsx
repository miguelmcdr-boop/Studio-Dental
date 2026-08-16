/**
 * Tabla de interacciones farmacológicas clínicamente relevantes.
 * Incluye búsqueda por fármaco A o B, badges de severidad y CRUD.
 * F4-03f-5b
 */
import React, { useState, useMemo } from 'react'
import { NIVELES_SEVERIDAD_INTERACCION } from '../schemas/interaccionSchema'

const SEVERIDAD_CONFIG = {
  mayor: {
    label: 'Mayor',
    color: 'bg-red-100 text-red-800 border-red-300',
    icono: '🔴'
  },
  moderada: {
    label: 'Moderada',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icono: '🟡'
  },
  menor: {
    label: 'Menor',
    color: 'bg-green-100 text-green-800 border-green-300',
    icono: '🟢'
  }
}

export const TablaInteracciones = ({ interacciones, onEditar, onEliminar, onCrearNueva }) => {
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [filtroSeveridad, setFiltroSeveridad] = useState('')

  const datos = useMemo(
    () => (Array.isArray(interacciones) ? interacciones : []),
    [interacciones]
  )

  // Filtrar por búsqueda y severidad
  const datosFiltrados = useMemo(() => {
    let resultado = [...datos]
    
    if (textoBusqueda.trim()) {
      const textoNorm = textoBusqueda.toLowerCase().trim()
      resultado = resultado.filter(i =>
        (i.farmaco_a || '').toLowerCase().includes(textoNorm) ||
        (i.farmaco_b || '').toLowerCase().includes(textoNorm) ||
        (i.efecto || '').toLowerCase().includes(textoNorm)
      )
    }
    
    if (filtroSeveridad) {
      resultado = resultado.filter(i => i.severidad === filtroSeveridad)
    }
    
    return resultado
  }, [datos, textoBusqueda, filtroSeveridad])

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            ⚗️ Interacciones Farmacológicas Clínicamente Relevantes
          </h3>
          {onCrearNueva && (
            <button
              onClick={onCrearNueva}
              className="px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700"
            >
              + Nueva interacción
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {datos.length} interacciones registradas — Basado en Sección 2D del vademécum v1.1
        </p>
      </div>

      {/* Barra de filtros */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={textoBusqueda}
          onChange={(e) => setTextoBusqueda(e.target.value)}
          placeholder="🔍 Buscar por fármaco A, B o efecto..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        
        <select
          value={filtroSeveridad}
          onChange={(e) => setFiltroSeveridad(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Todas las severidades</option>
          {NIVELES_SEVERIDAD_INTERACCION.map(s => (
            <option key={s} value={s}>
              {SEVERIDAD_CONFIG[s].icono} {SEVERIDAD_CONFIG[s].label}
            </option>
          ))}
        </select>
        
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{datosFiltrados.length}</span> de{' '}
          <span className="font-semibold">{datos.length}</span>
        </div>
      </div>

      {/* Tabla */}
      {datosFiltrados.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No hay interacciones que coincidan con los filtros aplicados
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fármaco A</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fármaco B / Grupo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Efecto de la interacción</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Manejo sugerido</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Severidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {datosFiltrados.map((interaccion, idx) => {
                const config = SEVERIDAD_CONFIG[interaccion.severidad] || SEVERIDAD_CONFIG.menor
                return (
                  <tr key={interaccion.id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px]">
                      {interaccion.farmaco_a}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px]">
                      {interaccion.farmaco_b}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[300px]" title={interaccion.efecto}>
                      {interaccion.efecto}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[250px]" title={interaccion.manejo}>
                      {interaccion.manejo || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded border ${config.color}`}>
                        {config.icono} {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        {onEditar && (
                          <button
                            onClick={() => onEditar(interaccion)}
                            className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100"
                          >
                            Editar
                          </button>
                        )}
                        {onEliminar && interaccion.activo !== false && (
                          <button
                            onClick={() => onEliminar(interaccion)}
                            className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-medium hover:bg-red-100"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Nota clínica al pie */}
      <div className="px-6 py-4 border-t border-gray-200 bg-orange-50 text-sm text-orange-800 space-y-2">
        <p><strong>📝 Notas clínicas importantes (Sección 2D del vademécum v1.1):</strong></p>
        <ul className="list-disc list-inside space-y-1 text-orange-700">
          <li><strong>Macrólidos + Estatinas:</strong> Claritromicina y Eritromicina inhiben CYP3A4. Preferir Azitromicina que tiene menor interacción.</li>
          <li><strong>Metronidazol + Alcohol:</strong> Efecto disulfiram. Advertir al paciente evitar alcohol durante el tratamiento y 48 horas después.</li>
          <li><strong>AINEs + Anticoagulantes:</strong> Preferir Paracetamol como primera línea analgésica en pacientes anticoagulados.</li>
          <li><strong>Vasoconstrictores + Betabloqueantes:</strong> Riesgo de crisis hipertensiva paradójica. Limitar dosis de epinefrina y aspirar siempre antes de infiltrar.</li>
          <li><strong>Codeína/Tramadol + ISRS:</strong> Riesgo de síndrome serotoninérgico. Además, Fluoxetina y Paroxetina inhiben CYP2D6, reduciendo la eficacia analgésica de Codeína.</li>
        </ul>
      </div>
    </div>
  )
}
