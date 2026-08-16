/**
 * Tabla de alergias cruzadas con visualización tipo matriz 16x16.
 * Click en celda abre modal de edición.
 * F4-03f-5a
 */
import React from 'react'
import { FAMILIAS_ALERGIAS } from '../schemas/alergiaCruzadaSchema'

/**
 * Convierte el array de reglas en un mapa para acceso rápido por celda.
 * Clave: "familia_alergia|familia_farmaco"
 */
const construirMapaReglas = (alergiasCruzadas) => {
  const mapa = new Map()
  if (!Array.isArray(alergiasCruzadas)) return mapa
  
  alergiasCruzadas.forEach(regla => {
    const clave = `${regla.familia_alergia}|${regla.familia_farmaco}`
    mapa.set(clave, regla)
  })
  
  return mapa
}

/**
 * Determina el contenido visual de una celda según la severidad
 */
const renderCelda = (regla) => {
  if (!regla || regla.severidad === 'sin_relacion') {
    return <span className="text-gray-300">—</span>
  }
  
  if (regla.severidad === 'critica') {
    return (
      <span className="text-red-600 font-bold" title={regla.nota_clinica || 'Contraindicación absoluta'}>
        X
      </span>
    )
  }
  
  if (regla.severidad === 'advertencia') {
    const porcentaje = regla.porcentaje_cruzado ? ` (${regla.porcentaje_cruzado})` : ''
    return (
      <span className="text-yellow-600 font-semibold" title={regla.nota_clinica || `Precaución${porcentaje}`}>
        ⚠️
      </span>
    )
  }
  
  return <span className="text-gray-300">—</span>
}

/**
 * Formatea el nombre de la familia para mostrar en la UI
 */
const formatearFamilia = (familia) => {
  return familia.replace(/_/g, ' ')
}

export const TablaAlergiasCruzadas = ({ alergiasCruzadas, onEditarCelda, onCrearNueva }) => {
  const mapaReglas = construirMapaReglas(alergiasCruzadas)

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            🧬 Matriz de Alergias Cruzadas
          </h3>
          {onCrearNueva && (
            <button
              onClick={onCrearNueva}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
            >
              + Nueva regla
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Reactividad cruzada entre familias farmacológicas — Click en cualquier celda para editar
        </p>
      </div>

      {/* Leyenda de símbolos */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1">
          <span className="text-red-600 font-bold">X</span>
          <span className="text-gray-600">Crítica (contraindicación absoluta)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-yellow-600">⚠️</span>
          <span className="text-gray-600">Advertencia (precaución con porcentaje)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-gray-300">—</span>
          <span className="text-gray-600">Sin relación conocida</span>
        </span>
      </div>

      {/* Matriz 16x16 */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase border border-gray-200 sticky left-0 bg-gray-50 min-w-[140px]">
                Familia alergia ↓ / Fármaco →
              </th>
              {FAMILIAS_ALERGIAS.map(familia => (
                <th
                  key={familia}
                  className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase border border-gray-200 whitespace-nowrap"
                >
                  {formatearFamilia(familia)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FAMILIAS_ALERGIAS.map(familiaAlergia => (
              <tr key={familiaAlergia} className="hover:bg-gray-50">
                <td className="px-2 py-2 text-sm font-medium text-gray-900 border border-gray-200 sticky left-0 bg-white">
                  {formatearFamilia(familiaAlergia)}
                </td>
                {FAMILIAS_ALERGIAS.map(familiaFarmaco => {
                  const clave = `${familiaAlergia}|${familiaFarmaco}`
                  const regla = mapaReglas.get(clave)
                  const esCeldaDestacada = familiaAlergia === familiaFarmaco
                  
                  return (
                    <td
                      key={familiaFarmaco}
                      onClick={() => onEditarCelda && onEditarCelda({
                        familia_alergia: familiaAlergia,
                        familia_farmaco: familiaFarmaco,
                        regla: regla || null
                      })}
                      className={`px-2 py-2 text-center border border-gray-200 cursor-pointer transition-colors ${
                        esCeldaDestacada ? 'bg-gray-100' : 'bg-white hover:bg-blue-50'
                      }`}
                      title={regla ? `${regla.severidad} — ${regla.porcentaje_cruzado || 'sin porcentaje'} — ${regla.nota_clinica || 'sin nota'}` : 'Click para agregar regla'}
                    >
                      {renderCelda(regla)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notas clínicas al pie */}
      <div className="px-6 py-4 border-t border-gray-200 bg-yellow-50 text-sm text-yellow-800 space-y-2">
        <p><strong>📝 Notas clínicas importantes:</strong></p>
        <ul className="list-disc list-inside space-y-1 text-yellow-700">
          <li><strong>Penicilinas y Cefalosporinas:</strong> La tasa real de reacción cruzada con cefalosporinas de 2ª, 3ª y 4ª generación es inferior al 2%. La reactividad histórica del 10% ocurría con cefalosporinas de 1ª generación.</li>
          <li><strong>AINEs y Paracetamol:</strong> El 95% de los pacientes con hipersensibilidad a AINEs toleran Paracetamol en dosis &lt;1.000 mg/día.</li>
          <li><strong>Anestésicos Locales tipo Amida:</strong> Alergia mediada por IgE a las amidas es &lt;1%. Reacciones adversas suelen ser síncopes vasovagales o alergia a sulfitos del vasoconstrictor.</li>
          <li><strong>Látex:</strong> No es una familia farmacológica, pero es una alergia de manejo obligatorio en box dental (guantes, dique de goma). Existe el síndrome látex-fruta.</li>
        </ul>
      </div>
    </div>
  )
}
