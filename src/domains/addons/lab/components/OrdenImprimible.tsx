import React, { memo } from 'react'
import { Printer } from 'lucide-react'
import { DentikOSMicroSeal } from '../../../../components/brand/DentikOSMicroSeal'
import type { OrdenLaboratorio } from '../constants/laboratorioConstants'

export interface UserProfileLab {
  nombreCompleto?: string
  [key: string]: unknown
}

export interface OrdenImprimibleProps {
  orden: OrdenLaboratorio | null
  userProfile?: UserProfileLab | null
  alCerrar: () => void
}

export const OrdenImprimible: React.FC<OrdenImprimibleProps> = memo(({
  orden,
  userProfile,
  alCerrar
}) => {
  if (!orden) return null

  return (
    <div className="space-y-4 text-xs">
      <div className="flex justify-between items-center no-print print:hidden bg-gray-50 dark:bg-graphite-800 p-4 border border-gray-200 dark:border-graphite-700 rounded-2xl">
        <span className="font-bold text-xs text-gray-700 dark:text-graphite-300">
          Orden Folio: <strong className="tabular-nums">{orden.codigoOrden}</strong>
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors duration-150"
          >
            <span className="inline-flex items-center gap-1">
              <Printer size={14} />
              Imprimir Orden Técnica (PDF)
            </span>
          </button>
          <button
            onClick={alCerrar}
            className="bg-gray-200 dark:bg-graphite-700 text-gray-800 dark:text-graphite-200 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-300 dark:hover:bg-graphite-600 transition-colors duration-150"
          >
            Cerrar
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-2xl p-8 print:border-none print:p-0 print:bg-white print:text-black text-gray-900 space-y-6">
        <div className="border-b-2 border-black pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-base font-black uppercase tracking-wider">
              Orden de Trabajo Prótesis / Laboratorio Dental
            </h1>
            <p className="text-[10px] text-gray-600 font-bold">
              {userProfile?.nombreCompleto || 'Cirujano Dentista'} | DentikOS
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-black bg-gray-100 px-3 py-1 rounded-lg border border-gray-300 block tabular-nums">
              {orden.codigoOrden}
            </span>
            <span className="text-[10px] text-gray-500 block mt-1">
              Fecha Envío: <span className="tabular-nums">{orden.fechaEnvio}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 print:bg-white print:border">
          <div>
            <h4 className="font-bold text-[11px] uppercase border-b border-gray-200 pb-1 mb-1">
              Destino
            </h4>
            <p>
              <span className="font-bold">Laboratorio:</span> {orden.laboratorioNombre}
            </p>
            <p>
              <span className="font-bold">Fecha Requerida Entrega:</span>{' '}
              <span className="tabular-nums">{orden.fechaEntregaPrometida || 'A convenir'}</span>
            </p>
          </div>
          <div>
            <h4 className="font-bold text-[11px] uppercase border-b border-gray-200 pb-1 mb-1">
              Paciente
            </h4>
            <p>
              <span className="font-bold">Nombre Paciente:</span> {orden.pacienteNombre}
            </p>
            <p>
              <span className="font-bold">RUT:</span>{' '}
              <span className="tabular-nums">{orden.pacienteRut}</span>
            </p>
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-xl space-y-2">
          <h4 className="font-bold text-[11px] uppercase border-b border-gray-200 pb-1">
            Especificaciones Prescritas
          </h4>
          <div className="grid grid-cols-3 gap-2 pt-1 font-semibold">
            <p>
              <span className="text-gray-500 font-normal block">Tipo Trabajo:</span>{' '}
              {orden.tipoTrabajo}
            </p>
            <p>
              <span className="text-gray-500 font-normal block">Pieza / Sector:</span>{' '}
              <span className="tabular-nums">{orden.piezaDientaria}</span>
            </p>
            <p>
              <span className="text-gray-500 font-normal block">Color / Guía:</span>{' '}
              {orden.colorGuia}
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1 print:bg-white">
          <h4 className="font-bold text-[11px] uppercase border-b border-gray-200 pb-1">
            Indicaciones Técnicas para el Ceramista
          </h4>
          <p className="text-gray-800 leading-relaxed pt-1">
            {orden.indicacionesTecnicas || 'Sin indicaciones especiales.'}
          </p>
        </div>

        <div className="pt-16 grid grid-cols-2 gap-8 text-center print:pt-24">
          <div className="border-t border-black pt-2">
            <p className="font-bold">Recepcionado por Laboratorio</p>
            <p className="text-[10px] text-gray-500">Firma / Fecha de Recepción</p>
          </div>

          <div className="border-t border-black pt-2">
            <p className="font-bold">{userProfile?.nombreCompleto || 'Firma Profesional'}</p>
            <p className="text-[10px] text-gray-500">Firma y Timbre Cirujano Dentista</p>
          </div>
        </div>

        {/* Micro-Sello DentikOS Normativo */}
        <DentikOSMicroSeal className="mt-8" />
      </div>
    </div>
  )
})

OrdenImprimible.displayName = 'OrdenImprimible'
