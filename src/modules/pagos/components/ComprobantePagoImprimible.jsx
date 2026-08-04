import React, { memo, useState } from 'react'

export const ComprobantePagoImprimible = memo(({ pago, userProfile, alCerrar }) => {
  const [formato, setFormato] = useState('ticket') // 'ticket' | 'carta'

  if (!pago) return null

  const montoVal = parseFloat(pago.monto) || 0

  return (
    <div className="space-y-4 text-xs">
      <div className="flex justify-between items-center print:hidden bg-gray-50 p-4 border rounded-2xl flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-700">Formato de Impresión:</span>
          <button
            onClick={() => setFormato('ticket')}
            className={`px-3 py-1.5 rounded-xl font-bold ${formato === 'ticket' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            🖨️ Ticket POS (80mm)
          </button>
          <button
            onClick={() => setFormato('carta')}
            className={`px-3 py-1.5 rounded-xl font-bold ${formato === 'carta' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            📄 Carta A4 Oficial
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800"
          >
            🖨️ Imprimir Comprobante
          </button>
          <button
            onClick={alCerrar}
            className="bg-gray-200 text-gray-800 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* FORMATO TICKET TÉRMICO POS 80MM */}
      {formato === 'ticket' && (
        <div className="bg-white border-2 border-dashed border-black rounded-2xl p-6 w-[320px] mx-auto space-y-3 font-mono print:border-none print:w-full print:p-0">
          <div className="text-center border-b border-black pb-2">
            <h2 className="text-sm font-black uppercase">STUDIO DENTAL OS</h2>
            <p className="text-[9px] font-bold uppercase">Comprobante Oficial de Pago</p>
            <p className="text-[8px] text-gray-500">{userProfile?.nombreCompleto || 'Clínica Odontológica'}</p>
          </div>

          <div className="space-y-1 text-[10px] border-b border-black pb-2">
            <p><strong>RECIBO:</strong> {pago.folioComprobante}</p>
            {pago.folioDTE && <p><strong>DTE / BONO:</strong> {pago.folioDTE}</p>}
            <p><strong>FECHA:</strong> {pago.fecha} {pago.hora} hrs</p>
            <p><strong>PACIENTE:</strong> {pago.pacienteNombre}</p>
            <p><strong>RUT:</strong> {pago.pacienteRut}</p>
            <p><strong>MÉTODO:</strong> {pago.metodoPago}</p>
            <p><strong>CONCEPTO:</strong> {pago.concepto}</p>
          </div>

          {pago.prestacionesImputadas && pago.prestacionesImputadas.length > 0 && (
            <div className="border-b border-black pb-2 text-[9px]">
              <span className="font-bold block">IMPUTADO A:</span>
              <ul className="list-disc pl-3">
                {pago.prestacionesImputadas.map((it, idx) => <li key={idx}>{it}</li>)}
              </ul>
            </div>
          )}

          <div className="text-center py-2 bg-gray-100 border rounded-lg print:bg-white print:border-black">
            <span className="text-[9px] font-bold block uppercase">TOTAL CANCELADO</span>
            <span className="text-xl font-black">${montoVal.toLocaleString('es-CL')} CLP</span>
          </div>

          <div className="pt-4 text-center text-[9px] space-y-1">
            <p className="font-bold">¡Gracias por su confianza!</p>
            <p className="text-gray-500">Cajero: {pago.emitidoPor}</p>
          </div>
        </div>
      )}

      {/* FORMATO CARTA A4 MEMBRETADA */}
      {formato === 'carta' && (
        <div className="bg-white border border-gray-300 rounded-2xl p-8 max-w-xl mx-auto space-y-6 text-gray-900 print:border-none print:max-w-none print:p-0">
          <div className="border-b-2 border-black pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-base font-black uppercase tracking-wider">Comprobante de Recaudación & Pago</h1>
              <p className="text-[10px] text-gray-600 font-bold">{userProfile?.nombreCompleto || 'Cirujano Dentista'} | Studio Dental OS</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black bg-gray-100 px-3 py-1 rounded-lg border block">{pago.folioComprobante}</span>
              <span className="text-[10px] text-gray-500 block mt-1">{pago.fecha} — {pago.hora} hrs</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <p><span className="font-bold">Paciente:</span> {pago.pacienteNombre}</p>
              <p><span className="font-bold">RUT:</span> {pago.pacienteRut}</p>
            </div>
            <div>
              <p><span className="font-bold">Medio de Pago:</span> {pago.metodoPago}</p>
              <p><span className="font-bold">DTE / Folio:</span> {pago.folioDTE || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase border-b pb-1">Detalle del Pago</h4>
            <p><span className="font-semibold text-gray-700">Concepto:</span> {pago.concepto}</p>
            {pago.observacion && <p><span className="font-semibold text-gray-700">Observación:</span> {pago.observacion}</p>}
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
            <span className="font-extrabold text-emerald-900 uppercase">Monto Total Cancelado:</span>
            <span className="text-2xl font-black text-emerald-900">${montoVal.toLocaleString('es-CL')} CLP</span>
          </div>

          <div className="pt-16 grid grid-cols-2 gap-8 text-center print:pt-24">
            <div className="border-t border-black pt-2">
              <p className="font-bold">{pago.pacienteNombre}</p>
              <p className="text-[10px] text-gray-500">Firma Paciente</p>
            </div>

            <div className="border-t border-black pt-2">
              <p className="font-bold">{pago.emitidoPor}</p>
              <p className="text-[10px] text-gray-500">Recibido Conforme / Caja</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

ComprobantePagoImprimible.displayName = 'ComprobantePagoImprimible'