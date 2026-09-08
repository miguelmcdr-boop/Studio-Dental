/**
 * DocumentoImprimiblePresupuesto — Documento imprimible con odontograma integrado
 * Extraído de PresupuestoSection.jsx para cumplir límites arquitectónicos (F7-25)
 */
import React, { memo } from 'react'
import { DienteSVG } from '../../../components/DienteSVG'
import { PERMANENTE_SUPERIOR, PERMANENTE_INFERIOR } from '../constants/pacientesConstants'
import { TablaItemsPresupuesto } from './TablaItemsPresupuesto'

export const DocumentoImprimiblePresupuesto = memo(({
  paciente,
  userProfile,
  odontogramaInicial,
  itemsPresupuesto,
  totalPresupuesto,
  totalAbonado,
  saldoPendiente,
  handleCambiarEstadoItem,
  handleEliminarItem
}) => {
  return (
    <div className="bg-white dark:bg-graphite-900 border border-gray-200 dark:border-graphite-700 rounded-2xl p-8 print:border-none print:p-0">
      {/* Header del documento */}
      <div className="border-b-2 border-black dark:border-graphite-100 pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-graphite-900 dark:text-graphite-100">
            {userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez'}
          </h1>
          <p className="text-xs text-graphite-600 dark:text-graphite-400">
            {userProfile?.especialidad || 'Cirujano Dentista'} | RUT: {userProfile?.rut || 'N/I'}
          </p>
          <p className="text-xs text-graphite-500 dark:text-graphite-500">Consulta Odontológica Particular</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-graphite-800 dark:text-graphite-200 uppercase">
            Presupuesto Clínico
          </h2>
          <p className="text-xs text-graphite-500 dark:text-graphite-500">
            Fecha: {new Date().toLocaleDateString('es-CL')}
          </p>
        </div>
      </div>

      {/* Datos del paciente */}
      <div className="bg-gray-50 dark:bg-graphite-800 p-4 rounded-xl border border-gray-200 dark:border-graphite-700 mb-6 text-xs grid grid-cols-2 gap-2 print:bg-white print:border">
        <p><span className="font-bold dark:text-graphite-100">Paciente:</span> <span className="dark:text-graphite-300">{paciente.nombre}</span></p>
        <p><span className="font-bold dark:text-graphite-100">RUT:</span> <span className="dark:text-graphite-300">{paciente.rut}</span></p>
        <p><span className="font-bold dark:text-graphite-100">Edad:</span> <span className="dark:text-graphite-300">{paciente.edad} años</span></p>
        <p><span className="font-bold dark:text-graphite-100">Previsión:</span> <span className="dark:text-graphite-300">{paciente.prevision || 'Particular'}</span></p>
      </div>

      {/* Odontograma Integrado en Impresión */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-graphite-800 rounded-xl border border-gray-200 dark:border-graphite-700 print:bg-white print:border">
        <h4 className="text-[11px] font-bold text-graphite-600 dark:text-graphite-400 uppercase mb-3 text-center">
          Estado de Dentición (Odontograma Clínico)
        </h4>
        <div className="flex flex-col gap-2 items-center">
          <div className="flex gap-0.5 justify-center">
            {PERMANENTE_SUPERIOR.map(num => (
              <DienteSVG key={num} numero={num} estadosPieza={odontogramaInicial[num]} />
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-graphite-700 w-full my-1"></div>
          <div className="flex gap-0.5 justify-center">
            {PERMANENTE_INFERIOR.map(num => (
              <DienteSVG key={num} numero={num} estadosPieza={odontogramaInicial[num]} />
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de items del presupuesto */}
      <TablaItemsPresupuesto
        itemsPresupuesto={itemsPresupuesto}
        paciente={paciente}
        totalPresupuesto={totalPresupuesto}
        totalAbonado={totalAbonado}
        saldoPendiente={saldoPendiente}
        userProfile={userProfile}
        handleCambiarEstadoItem={handleCambiarEstadoItem}
        handleEliminarItem={handleEliminarItem}
      />
    </div>
  )
})

DocumentoImprimiblePresupuesto.displayName = 'DocumentoImprimiblePresupuesto'
