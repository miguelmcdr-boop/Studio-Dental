/**
 * Renderizado de una fila de la tabla de vademécum.
 * F4-03f-2 (refactorización)
 */
import React from 'react'

const FAMILIA_COLORS = {
  anestesico_amida: 'bg-purple-100 text-purple-800 border-purple-300',
  anestesico_ester: 'bg-purple-100 text-purple-800 border-purple-300',
  anestesico_topico: 'bg-purple-100 text-purple-800 border-purple-300',
  penicilina: 'bg-blue-100 text-blue-800 border-blue-300',
  cefalosporina: 'bg-blue-100 text-blue-800 border-blue-300',
  lincosamida: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  macrolido: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  nitroimidazol: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  quinolona: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  tetraciclina: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  aine: 'bg-orange-100 text-orange-800 border-orange-300',
  cox2: 'bg-orange-100 text-orange-800 border-orange-300',
  paracetamol: 'bg-green-100 text-green-800 border-green-300',
  opioide: 'bg-red-100 text-red-800 border-red-300',
  corticoide: 'bg-pink-100 text-pink-800 border-pink-300',
  antiseptico: 'bg-teal-100 text-teal-800 border-teal-300',
  antifungico: 'bg-teal-100 text-teal-800 border-teal-300',
  antiviral: 'bg-teal-100 text-teal-800 border-teal-300',
  ansiolitico: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  antihistaminico: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  hemostatico: 'bg-amber-100 text-amber-800 border-amber-300',
  protector_gastrico: 'bg-amber-100 text-amber-800 border-amber-300',
  preventivo: 'bg-cyan-100 text-cyan-800 border-cyan-300'
}

export const FilaVademecum = ({ farmaco, onEditar, onDesactivar, onReactivar }) => {
  return (
    <tr className={`hover:bg-gray-50 ${farmaco.activo === false ? 'opacity-50' : ''}`}>
      <td className="px-3 py-3 text-sm text-gray-700 font-mono">
        {farmaco.numero}
      </td>
      <td className="px-3 py-3 text-sm">
        <span className={`px-2 py-1 text-xs font-semibold rounded border ${FAMILIA_COLORS[farmaco.familia] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
          {farmaco.familia?.replace(/_/g, ' ') || 'N/D'}
        </span>
      </td>
      <td className="px-3 py-3 text-sm font-medium text-gray-900 max-w-xs truncate" title={farmaco.nombre_generico}>
        {farmaco.nombre_generico}
      </td>
      <td className="px-3 py-3 text-sm text-gray-700 max-w-[150px] truncate" title={farmaco.presentacion}>
        {farmaco.presentacion}
      </td>
      <td className="px-3 py-3 text-sm text-gray-700 max-w-[180px] truncate" title={farmaco.posologia_adulto}>
        {farmaco.posologia_adulto || '-'}
      </td>
      <td className="px-3 py-3 text-sm text-gray-700 max-w-[180px] truncate" title={farmaco.posologia_pediatrica}>
        {farmaco.posologia_pediatrica || '-'}
      </td>
      <td className="px-3 py-3 text-sm">
        {farmaco.activo === false ? (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded border border-gray-300">
            Inactivo
          </span>
        ) : (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded border border-green-300">
            Activo
          </span>
        )}
      </td>
      <td className="px-3 py-3 text-sm">
        <div className="flex gap-1">
          {onEditar && (
            <button
              onClick={() => onEditar(farmaco)}
              className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100"
            >
              Editar
            </button>
          )}
          {farmaco.activo !== false && onDesactivar && (
            <button
              onClick={() => onDesactivar(farmaco)}
              className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded text-xs font-medium hover:bg-yellow-100"
            >
              Desactivar
            </button>
          )}
          {farmaco.activo === false && onReactivar && (
            <button
              onClick={() => onReactivar(farmaco)}
              className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-medium hover:bg-green-100"
            >
              Reactivar
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
