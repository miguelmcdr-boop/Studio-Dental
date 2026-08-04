import React, { memo } from 'react'
import { formatearFechaHoraChile } from '../utils/urgenciasGesCalculations'

export const DocumentoImpresoGes = memo(({ atencion, userProfile, alCerrar }) => {
  if (!atencion) return null

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center print:hidden bg-gray-50 p-4 border rounded-2xl">
        <span className="font-bold text-xs text-gray-700">Constancia Folio: <strong>{atencion.folio}</strong></span>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800"
          >
            🖨️ Imprimir Constancia GES (PDF)
          </button>
          <button
            onClick={alCerrar}
            className="bg-gray-200 text-gray-800 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* DOCUMENTO IMPRESO CON FORMATO OFICIAL MINSAL / GES */}
      <div className="bg-white border border-gray-300 rounded-2xl p-8 print:border-none print:p-0 text-xs text-gray-900 space-y-6">
        <div className="border-b-2 border-black pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-base font-black uppercase tracking-wider">Formulario de Constancia de Información al Paciente GES</h1>
            <p className="text-[10px] text-gray-600 font-bold">(Régimen General de Garantías en Salud - Ley N° 19.966)</p>
            <p className="text-[10px] text-gray-500 mt-1">{userProfile?.nombreCompleto} | RUT: {userProfile?.rut}</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-black bg-gray-100 px-3 py-1 rounded-lg border border-gray-300 block">{atencion.folio}</span>
            <span className="text-[10px] text-gray-500 block mt-1">Fecha: {atencion.fechaCreacion || formatearFechaHoraChile()}</span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1 print:bg-white print:border">
          <h4 className="font-bold text-[11px] uppercase border-b pb-1 mb-2">1. Antecedentes del Paciente</h4>
          <div className="grid grid-cols-2 gap-2">
            <p><span className="font-bold">Nombre Paciente:</span> {atencion.pacienteNombre}</p>
            <p><span className="font-bold">RUT:</span> {atencion.pacienteRut}</p>
            <p><span className="font-bold">Previsión:</span> {atencion.pacientePrevision}</p>
            <p><span className="font-bold">Problema de Salud GES:</span> {atencion.patologiaNombre} ({atencion.patologiaCodigo})</p>
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-xl space-y-2">
          <h4 className="font-bold text-[11px] uppercase border-b pb-1">2. Confirmación Diagnóstica y Conducta</h4>
          <p><span className="font-bold">Diagnóstico Clínico:</span> {atencion.diagnostico}</p>
          <p><span className="font-bold">Indicaciones / Tratamiento Realizado:</span> {atencion.indicacionesTratamiento || 'Atención sintomática y alivio del dolor.'}</p>
          <p><span className="font-bold">Estado de Decisión:</span> {atencion.aceptaAtencion ? '✅ Paciente acepta la atención del prestador designado.' : '❌ Paciente rechaza atención o solicita derivación.'}</p>
        </div>

        <div className="p-4 bg-gray-50 border rounded-xl text-[10px] text-gray-600 text-justify leading-relaxed print:bg-white">
          <p>
            Se deja constancia que en conformidad a la Ley N° 19.966, el paciente ha sido informado formalmente de su diagnóstico de patología GES, de sus derechos a las garantías explícitas de acceso, calidad, oportunidad y protección financiera.
          </p>
        </div>

        <div className="pt-16 grid grid-cols-2 gap-8 text-center print:pt-24">
          <div className="border-t border-black pt-2">
            <p className="font-bold">{atencion.pacienteNombre}</p>
            <p className="text-[10px] text-gray-500">Firma / Huella del Paciente o Apoderado</p>
          </div>

          <div className="border-t border-black pt-2">
            <p className="font-bold">{userProfile?.nombreCompleto}</p>
            <p className="text-[10px] text-gray-500">Firma y Timbre Cirujano Dentista</p>
          </div>
        </div>
      </div>
    </div>
  )
})

DocumentoImpresoGes.displayName = 'DocumentoImpresoGes'