import React, { useState, useEffect } from 'react'

export const PagosModulo = ({ pacientes = [] }) => {
  const [todosLosAbonos, setTodosLosAbonos] = useState([])

  useEffect(() => {
    const lista = []
    pacientes.forEach(p => {
      const savedAbonos = localStorage.getItem(`abonos_${p.id}`)
      if (savedAbonos) {
        const abonosLista = JSON.parse(savedAbonos)
        abonosLista.forEach(a => {
          lista.push({
            ...a,
            pacienteNombre: p.nombre,
            pacienteRut: p.rut
          })
        })
      }
    })
    lista.sort((a, b) => b.id - a.id)
    setTodosLosAbonos(lista)
  }, [pacientes])

  const totalEfectivo = todosLosAbonos.filter(a => a.metodoPago === 'Efectivo').reduce((acc, c) => acc + c.monto, 0)
  const totalTransferencia = todosLosAbonos.filter(a => a.metodoPago === 'Transferencia').reduce((acc, c) => acc + c.monto, 0)
  const totalDebito = todosLosAbonos.filter(a => a.metodoPago === 'Débito').reduce((acc, c) => acc + c.monto, 0)
  const totalCredito = todosLosAbonos.filter(a => a.metodoPago === 'Crédito').reduce((acc, c) => acc + c.monto, 0)
  const totalRecaudadoGlobal = todosLosAbonos.reduce((acc, c) => acc + c.monto, 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Control e Historial de Pagos</h2>
          <p className="text-xs text-gray-500">Cierre de caja, desgloses por medio de pago e historial de abonos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">💵 Efectivo</span>
          <span className="text-xl font-extrabold text-gray-900">${totalEfectivo.toLocaleString('es-CL')} CLP</span>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">🏦 Transferencias</span>
          <span className="text-xl font-extrabold text-gray-900">${totalTransferencia.toLocaleString('es-CL')} CLP</span>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">💳 Débito (Redcompra)</span>
          <span className="text-xl font-extrabold text-gray-900">${totalDebito.toLocaleString('es-CL')} CLP</span>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">💳 Tarjeta de Crédito</span>
          <span className="text-xl font-extrabold text-gray-900">${totalCredito.toLocaleString('es-CL')} CLP</span>
        </div>
      </div>

      <div className="bg-black text-white p-6 rounded-2xl mb-6 flex justify-between items-center">
        <div>
          <span className="text-xs uppercase font-bold text-gray-400 block">Total General de Ingresos Registrados</span>
          <span className="text-2xl font-extrabold">${totalRecaudadoGlobal.toLocaleString('es-CL')} CLP</span>
        </div>
        <button onClick={() => window.print()} className="bg-white text-black text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100">
          🖨️ Imprimir Cierre
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-sm text-gray-800">Registro General de Transacciones y Abonos</h3>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
              <th className="p-4">Fecha</th>
              <th className="p-4">Paciente</th>
              <th className="p-4">Método de Pago</th>
              <th className="p-4 text-right">Monto Recibido</th>
            </tr>
          </thead>
          <tbody>
            {todosLosAbonos.map((a, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="p-4 font-semibold text-gray-600">{a.fecha}</td>
                <td className="p-4">
                  <span className="font-bold text-gray-900 block text-sm">{a.pacienteNombre}</span>
                  <span className="text-[11px] text-gray-500">RUT: {a.pacienteRut}</span>
                </td>
                <td className="p-4">
                  <span className="bg-gray-100 border px-2.5 py-1 rounded-md text-[11px] font-semibold text-gray-800">
                    {a.metodoPago || 'Efectivo'}
                  </span>
                </td>
                <td className="p-4 text-right font-extrabold text-green-700 text-sm">
                  +${a.monto.toLocaleString('es-CL')} CLP
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {todosLosAbonos.length === 0 && (
          <p className="text-gray-400 text-center py-10 text-xs">No hay registro de abonos o pagos procesados aún.</p>
        )}
      </div>
    </div>
  )
}