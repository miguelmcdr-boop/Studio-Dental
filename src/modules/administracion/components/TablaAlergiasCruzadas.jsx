/**
 * Tabla de alergias cruzadas con visualización tipo matriz 16x16.
 * Click en celda abre modal de edición.
 * F4-03f-5a
 */
import React from 'react'
import { FAMILIAS_ALERGIAS } from '../schemas/alergiaCruzadaSchema'
import { Icon } from '../../../components/Icon'
import { Dna, AlertTriangle, FileText } from 'lucide-react'

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
      <span className="text-yellow-600 font-semibold inline-flex items-center gap-1" title={regla.nota_clinica || `Precaución${porcentaje}`}>
        <AlertTriangle size={12} />
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
    <div className="bg-white dark:bg-graphite-800 border border-gray-200 dark:border-graphite-700 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-graphite-700 bg-blue-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-graphite-50">
            <span className="flex items-center gap-1.5"><Icon icon={Dna} size="sm" />Matriz de Alergias Cruzadas</span>
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
        <p className="text-sm text-gray-600 dark:text-graphite-400 mt-1">
          Reactividad cruzada entre familias farmacológicas — Click en cualquier celda para editar
        </p>
      </div>

      {/* Leyenda de símbolos */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-graphite-700 bg-gray-50 dark:bg-graphite-800 flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1">
          <span className="text-red-600 font-bold">X</span>
          <span className="text-gray-600 dark:text-graphite-400">Crítica (contraindicación absoluta)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-yellow-600"><AlertTriangle size={12} /></span>
          <span className="text-gray-600 dark:text-graphite-400">Advertencia (precaución con porcentaje)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-gray-300">—</span>
          <span className="text-gray-600 dark:text-graphite-400">Sin relación conocida</span>
        </span>
      </div>

      {/* Matriz 16x16 */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-graphite-800">
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-graphite-400 uppercase border border-gray-200 dark:border-graphite-700 sticky left-0 bg-gray-50 dark:bg-graphite-800 min-w-[140px]">
                Familia alergia ↓ / Fármaco →
              </th>
              {FAMILIAS_ALERGIAS.map(familia => (
                <th
                  key={familia}
                  className="px-2 py-2 text-center text-xs font-semibold text-gray-600 dark:text-graphite-400 uppercase border border-gray-200 dark:border-graphite-700 whitespace-nowrap"
                >
                  {formatearFamilia(familia)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FAMILIAS_ALERGIAS.map(familiaAlergia => (
              <tr key={familiaAlergia} className="hover:bg-gray-50 dark:hover:bg-graphite-700 dark:hover:bg-graphite-700">
                <td className="px-2 py-2 text-sm font-medium text-gray-900 dark:text-graphite-50 border border-gray-200 dark:border-graphite-700 sticky left-0 bg-white dark:bg-graphite-800">
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
                      className={`px-2 py-2 text-center border border-gray-200 dark:border-graphite-700 cursor-pointer transition-colors ${
                        esCeldaDestacada ? 'bg-gray-100' : 'bg-white dark:bg-graphite-800 hover:bg-blue-50'
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
      <div className="px-6 py-4 border-t border-gray-200 dark:border-graphite-700 bg-yellow-50 text-sm text-yellow-800 space-y-2">
        <p><strong className="inline-flex items-center gap-1"><FileText size={12} />Notas clínicas importantes:</strong></p>
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
