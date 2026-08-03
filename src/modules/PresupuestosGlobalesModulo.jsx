import React, { useState, useEffect } from 'react'

export const PresupuestosGlobalesModulo = ({ pacientes = [], setPacienteSeleccionado, setActiveSection }) => {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [listaPresupuestos, setListaPresupuestos] = useState([])

  useEffect(() => {
    const consolidados = []
    pacientes.forEach(p => {
      const savedItems = localStorage.getItem(`presupuesto_items_${p.id}`)
      const savedAbonos = localStorage.getItem(`abonos_${p.id}`)

      const items = savedItems ? JSON.parse(savedItems) : []
      const abonos = savedAbonos ? JSON.parse(savedAbonos) : []

      if (items.length > 0) {
        const total = items.reduce((acc, curr) => acc + (curr.valor || 0), 0)
        const abonado = abonos.reduce((acc, curr) => acc + (curr.monto || 0), 0)
        const saldo = total - abonado

        consolidados.push({
          paciente: p,
          totalItems: items.length,
          total,
          abonado,
          saldo,
          estadoPago: saldo <= 0 ? 'Pagado Totalmente' : (abonado > 0 ? 'Parcialmente Abonado' : 'Pendiente')
        })
      }
    })
    setListaPresupuestos(consolidados)
  }, [pacientes])

  const totalCotizadoGlobal = listaPresupuestos.reduce((acc, curr) => acc + curr.total, 0)
  const totalAbonadoGlobal = listaPresupuestos.reduce((acc, curr) => acc + curr.abonado, 0)
  const totalSaldoGlobal = listaPresupuestos.reduce((acc, curr) => acc + curr.saldo, 0)

  const presupuestosFiltrados = listaPresupuestos.filter(item => {
    const coincideTexto = item.paciente.nombre.toLowerCase().includes(busqueda.toLowerCase()) || item.paciente.rut.includes(busqueda)
    const coincideEstado = filtroEstado === 'Todos' || 
      (filtroEstado === 'Pendiente' && item.saldo > 0) || 
      (filtroEstado === 'Pagado' && item.saldo <= 0)
    return coincideTexto && coincideEstado
  })

  const irAFichaPresupuesto = (pacienteObj) => {
    setPacienteSeleccionado(pacienteObj)
    setActiveSection('Pacientes')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Control Global de Presupuestos</h2>
          <p className="text-xs text-gray-500">Gestión financiera centralizada, cotizaciones y estados de cobro.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Monto Total Cotizado</span>
          <span className="text-2xl font-extrabold text-gray-900">${totalCotizadoGlobal.toLocaleString('es-CL')} CLP</span>
          <p className="text-[11px] text-gray-400 mt-1">Suma de todos los presupuestos emitidos</p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Recaudado (Abonos)</span>
          <span className="text-2xl font-extrabold text-green-700">${totalAbonadoGlobal.toLocaleString('es-CL')} CLP</span>
          <p className="text-[11px] text-gray-400 mt-1">Ingresos reales recibidos</p>
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Por Cobrar (Pendiente)</span>
          <span className="text-2xl font-extrabold text-red-600">${totalSaldoGlobal.toLocaleString('es-CL')} CLP</span>
          <p className="text-[11px] text-gray-400 mt-1">Saldo pendiente de cobro</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl mb-6 flex flex-wrap gap-4 items-center justify-between">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar por nombre o RUT del paciente..."
          className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs w-full md:w-80 bg-white"
        />

        <div className="flex gap-2">
          {['Todos', 'Pendiente', 'Pagado'].map(e => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                filtroEstado === e ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
              <th className="p-4">Paciente</th>
              <th className="p-4">Ítems Included</th>
              <th className="p-4 text-right">Total Presupuesto</th>
              <th className="p-4 text-right">Abonado</th>
              <th className="p-4 text-right">Saldo Pendiente</th>
              <th className="p-4 text-center">Estado Pago</th>
              <th className="p-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {presupuestosFiltrados.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td className="p-4">
                  <span className="font-bold text-gray-900 block text-sm">{item.paciente.nombre}</span>
                  <span className="text-gray-500 text-[11px]">RUT: {item.paciente.rut}</span>
                </td>
                <td className="p-4">
                  <span className="font-semibold text-gray-700">{item.totalItems} procedimiento(s)</span>
                </td>
                <td className="p-4 text-right font-extrabold text-gray-900">
                  ${item.total.toLocaleString('es-CL')}
                </td>
                <td className="p-4 text-right font-bold text-green-700">
                  ${item.abonado.toLocaleString('es-CL')}
                </td>
                <td className="p-4 text-right font-extrabold text-red-600">
                  ${item.saldo.toLocaleString('es-CL')}
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                    item.saldo <= 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.estadoPago}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => irAFichaPresupuesto(item.paciente)}
                    className="bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-800"
                  >
                    Ver Ficha / Presupuesto →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {presupuestosFiltrados.length === 0 && (
          <p className="text-gray-400 text-center py-10 text-xs">No se encontraron presupuestos emitidos que coincidan con la búsqueda.</p>
        )}
      </div>
    </div>
  )
}