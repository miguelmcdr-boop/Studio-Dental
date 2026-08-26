import React, { memo, useState, useEffect } from 'react'
import { DienteSVG } from '../../../components/DienteSVG'
import { PERMANENTE_SUPERIOR, PERMANENTE_INFERIOR } from '../constants/pacientesConstants'
import { obtenerDescuentoConvenio } from '../utils/pacientesCalculations'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { descontarMaterialesSeleccionados, detectarCategoriaTratamiento, PALABRAS_CLAVE_POR_CATEGORIA_DEFAULT } from '../../inventario/utils/inventarioCalculations'
import { prestacionesStorageService } from '../../prestaciones/services/prestacionesStorageService'
import { inventarioStorageService } from '../../inventario/services/inventarioStorageService'
import { ModalDescuentoInventario } from './ModalDescuentoInventario'
import { createLogger } from '../../../services/logger.js'

const log = createLogger('PresupuestoSection')
const STORAGE_KEY_PALABRAS_CLAVE = 'studio_dental_inventario_palabras_clave'

export const PresupuestoSection = memo(({
  paciente,
  userProfile,
  prestacionesArancel: prestacionesProp = [],
  itemsPresupuesto = [],
  setItemsPresupuesto = () => {},
  abonos = [],
  setAbonos = () => {},
  odontogramaInicial = {},
  totalPresupuesto = 0,
  totalAbonado = 0,
  saldoPendiente = 0,
  evolucionesNotas = [],
  setEvolucionesNotas = () => {}
}) => {
  // Sincronización en tiempo real con el arancel global (vía servicio, F2-07a)
  const [arancelActualizado, setArancelActualizado] = useState(() => {
    const actuales = prestacionesStorageService.obtenerPrestaciones()
    if (Array.isArray(actuales) && actuales.length > 0) return actuales
    return prestacionesProp
  })

  const [convenioAplicado, setConvenioAplicado] = useState(paciente.prevision || 'Particular')
  const [piezaPresupuesto, setPiezaPresupuesto] = useState('')
  const [prestacionSeleccionadaId, setPrestacionSeleccionadaId] = useState('')
  const [nombrePrestacion, setNombrePrestacion] = useState('')
  const [valorPrestacion, setValorPrestacion] = useState('')
  const [precioBaseOriginal, setPrecioBaseOriginal] = useState(0)
  const [porcentajeDescuentoAplicado, setPorcentajeDescuentoAplicado] = useState(0)

  const [montoAbono, setValorAbono] = useState('')
  const [metodoPagoAbono, setMetodoPagoAbono] = useState('Efectivo')

  // F2-12: Estado para el modal de descuento de inventario
  const [itemPendienteDescuento, setItemPendienteDescuento] = useState(null)
  const [categoriaDetectada, setCategoriaDetectada] = useState('')
  const [materialesDisponibles, setMaterialesDisponibles] = useState([])

  useEffect(() => {
    const handleRefrescarArancel = () => {
      const actuales = prestacionesStorageService.obtenerPrestaciones()
      if (Array.isArray(actuales) && actuales.length > 0) {
        setArancelActualizado(actuales)
      }
    }

    window.addEventListener('storage', handleRefrescarArancel)
    window.addEventListener('arancel_actualizado', handleRefrescarArancel)

    return () => {
      window.removeEventListener('storage', handleRefrescarArancel)
      window.removeEventListener('arancel_actualizado', handleRefrescarArancel)
    }
  }, [])

  useEffect(() => {
    if (prestacionesProp && prestacionesProp.length > 0) {
      setArancelActualizado(prestacionesProp)
    }
  }, [prestacionesProp])

  const handleSeleccionarPrestacion = (id, convenioNombre = convenioAplicado) => {
    setPrestacionSeleccionadaId(id)
    if (!id) return

    const prest = arancelActualizado.find(p => String(p.id) === String(id))
    if (prest) {
      const precioBase = parseFloat(prest.precio ?? prest.precioParticular) || 0
      setNombrePrestacion(prest.nombre)
      setPrecioBaseOriginal(precioBase)
      
      const pctDesc = obtenerDescuentoConvenio(convenioNombre)
      setPorcentajeDescuentoAplicado(pctDesc)
      const precioConDescuento = Math.round(precioBase * (1 - pctDesc / 100))
      setValorPrestacion(precioConDescuento)
    }
  }

  const handleCambiarConvenioSelect = (nuevoConvenio) => {
    setConvenioAplicado(nuevoConvenio)
    if (prestacionSeleccionadaId) {
      handleSeleccionarPrestacion(prestacionSeleccionadaId, nuevoConvenio)
    }
  }

  const handleAgregarItemPresupuesto = (e) => {
    e.preventDefault()
    if (!nombrePrestacion || !valorPrestacion) return
    const nuevoItem = {
      id: Date.now(),
      pieza: piezaPresupuesto || 'General',
      prestacion: nombrePrestacion,
      convenio: convenioAplicado,
      precioBase: precioBaseOriginal || parseInt(valorPrestacion),
      descuentoPct: porcentajeDescuentoAplicado,
      valor: parseInt(valorPrestacion),
      estado: 'Pendiente'
    }
    const actualizados = [...itemsPresupuesto, nuevoItem]
    setItemsPresupuesto(actualizados)
    pacientesStorageService.guardarItem(`presupuesto_items_${paciente.id}`, actualizados)
    setPiezaPresupuesto('')
    setPrestacionSeleccionadaId('')
    setNombrePrestacion('')
    setValorPrestacion('')
    setPrecioBaseOriginal(0)
    setPorcentajeDescuentoAplicado(0)
  }

  // 💡 COHESIÓN CLÍNICA & REBAJA DE INVENTARIO (F2-12: con modal de selección)
  const handleCambiarEstadoItem = (id, nuevoEstado) => {
    let itemRealizado = null

    const actualizados = itemsPresupuesto.map(item => {
      if (item.id === id) {
        if (nuevoEstado === 'Realizado' && item.estado !== 'Realizado') {
          itemRealizado = item
        }
        return { ...item, estado: nuevoEstado }
      }
      return item
    })

    setItemsPresupuesto(actualizados)
    pacientesStorageService.guardarItem(`presupuesto_items_${paciente.id}`, actualizados)

    if (itemRealizado) {
      // 1. Cohesión con Bitácora de Evoluciones
      if (setEvolucionesNotas) {
        const fechaHora = new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        const profesional = userProfile?.nombreCompleto || 'Cirujano Dentista'
        
        const nuevaNotaEvolucion = {
          id: Date.now(),
          fecha: fechaHora,
          texto: `✅ TRATAMIENTO REALIZADO: ${itemRealizado.prestacion} (Pieza: ${itemRealizado.pieza}) — Ejecutado por: ${profesional}`
        }

        const notasActualizadas = [nuevaNotaEvolucion, ...evolucionesNotas]
        setEvolucionesNotas(notasActualizadas)
        // F6-D-5: usar evolucionesStorageService (Supabase + localStorage)
        evolucionesStorageService.guardarEvoluciones(paciente.id, notasActualizadas).catch(err => log.warn("Error al guardar:", err))
      }

      // 2. F2-12: Abrir modal de selección de materiales en vez de descontar directamente
      try {
        const asociaciones = inventarioStorageService.obtenerAsociacionesInsumos()
        
        // Cargar palabras clave desde localStorage
        let palabrasClave = PALABRAS_CLAVE_POR_CATEGORIA_DEFAULT
        try {
          const palabrasGuardadas = localStorage.getItem(STORAGE_KEY_PALABRAS_CLAVE)
          if (palabrasGuardadas) {
            palabrasClave = JSON.parse(palabrasGuardadas)
          }
        } catch {
          // Usar default si hay error
        }
        
        const categoria = detectarCategoriaTratamiento(itemRealizado.prestacion, asociaciones, palabrasClave)
        const materialesCategoria = asociaciones[categoria] || []
        const inventarioActual = inventarioStorageService.obtenerItems([])
        
        // Enriquecer materiales con stock actual del inventario
        const materialesEnriquecidos = materialesCategoria
          .filter(m => m.itemId)
          .map(m => {
            const itemInventario = inventarioActual.find(i => i.id === m.itemId)
            return {
              itemId: m.itemId,
              nombreInsumo: itemInventario?.nombre || m.nombreInsumo,
              cantidad: m.cantidad,
              unidad: itemInventario?.unidad || m.unidad || 'Unidad',
              stockActual: parseFloat(itemInventario?.cantidad) || 0
            }
          })
        
        setItemPendienteDescuento(itemRealizado)
        setCategoriaDetectada(categoria)
        setMaterialesDisponibles(materialesEnriquecidos)
      } catch (e) {
        log.error('Error al preparar modal de descuento:', e)
      }
    }
  }

  // F2-12: Confirmar descuento desde el modal
  const handleConfirmarDescuento = (materialesSeleccionados) => {
    try {
      const inventarioGuardado = inventarioStorageService.obtenerItems([])
      if (Array.isArray(inventarioGuardado) && inventarioGuardado.length > 0 && materialesSeleccionados.length > 0) {
        const inventarioActualizado = descontarMaterialesSeleccionados(inventarioGuardado, materialesSeleccionados)
        inventarioStorageService.guardarItems(inventarioActualizado)
        window.dispatchEvent(new CustomEvent('inventario_actualizado'))
      }
    } catch (e) {
      log.error('Error al descontar inventario:', e)
    } finally {
      setItemPendienteDescuento(null)
      setCategoriaDetectada('')
      setMaterialesDisponibles([])
    }
  }

  // F2-12: Cancelar descuento desde el modal (marca Realizado sin descontar)
  const handleCancelarDescuento = () => {
    setItemPendienteDescuento(null)
    setCategoriaDetectada('')
    setMaterialesDisponibles([])
  }

  const handleEliminarItem = (id) => {
    const actualizados = itemsPresupuesto.filter(i => i.id !== id)
    setItemsPresupuesto(actualizados)
    pacientesStorageService.guardarItem(`presupuesto_items_${paciente.id}`, actualizados)
  }

  const handleAgregarAbono = (e) => {
    e.preventDefault()
    if (!montoAbono) return
    const abonoObj = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL'),
      monto: parseInt(montoAbono),
      metodoPago: metodoPagoAbono,
      pacienteNombre: paciente.nombre
    }
    const actualizados = [abonoObj, ...abonos]
    setAbonos(actualizados)
    pacientesStorageService.guardarItem(`abonos_${paciente.id}`, actualizados)
    setValorAbono('')
  }

  const handleEliminarAbono = (idAbono) => {
    if (window.confirm('¿Deseas eliminar este registro de abono ingresado?')) {
      const actualizados = abonos.filter(a => a.id !== idAbono)
      setAbonos(actualizados)
      pacientesStorageService.guardarItem(`abonos_${paciente.id}`, actualizados)
    }
  }
  return (
    <div>
      {/* Selector y Formulario de Agregar Prestación */}
      <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl mb-6 print:hidden space-y-4">
        <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
          <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider">Añadir Prestación al Plan de Tratamiento</h4>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-600">Convenio Activo:</span>
            <select
              value={convenioAplicado}
              onChange={(e) => handleCambiarConvenioSelect(e.target.value)}
              className="px-2.5 py-1 border rounded-lg bg-emerald-50 text-emerald-900 font-bold border-emerald-300"
            >
              <option value="Particular">Particular (Sin Descuento)</option>
              <option value="Fonasa">Fonasa (-15%)</option>
              <option value="Isapre">Isapre (-20%)</option>
              <option value="Empresa">Convenio Institucional (-25%)</option>
            </select>
          </div>
        </div>
        
        <form onSubmit={handleAgregarItemPresupuesto} className="flex flex-wrap gap-3 items-end text-xs">
          <div>
            <label className="block text-gray-600 mb-1 font-semibold">Pieza Dental</label>
            <input
              type="text"
              placeholder="Ej: 1.6 o General"
              value={piezaPresupuesto}
              onChange={(e) => setPiezaPresupuesto(e.target.value)}
              className="px-3 py-2 border rounded-lg w-28 bg-white"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-gray-600 mb-1 font-semibold">Catálogo & Packs ({arancelActualizado.length})</label>
            <select
              value={prestacionSeleccionadaId}
              onChange={(e) => handleSeleccionarPrestacion(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white font-semibold text-xs"
            >
              <option value="">-- Buscar en catálogo de prestaciones o packs --</option>
              {arancelActualizado.map(p => {
                const precioMostrar = parseFloat(p.precio ?? p.precioParticular) || 0
                return (
                  <option key={p.id} value={p.id}>
                    [{p.especialidad || 'General'}] {p.nombre} — Base: ${precioMostrar.toLocaleString('es-CL')} CLP
                  </option>
                )
              })}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="block text-gray-600 mb-1 font-semibold">Nombre Prestación (O libre)</label>
            <input
              type="text"
              placeholder="Nombre de la prestación"
              value={nombrePrestacion}
              onChange={(e) => setNombrePrestacion(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-semibold">
              Valor Final ($ CLP) {porcentajeDescuentoAplicado > 0 && <span className="text-emerald-600 font-bold">(-{porcentajeDescuentoAplicado}%)</span>}
            </label>
            <input
              type="number"
              placeholder="Monto"
              value={valorPrestacion}
              onChange={(e) => setValorPrestacion(e.target.value)}
              className="px-3 py-2 border rounded-lg w-32 bg-white font-bold text-gray-900"
            />
          </div>

          <button type="submit" className="bg-black text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-800 cursor-pointer">
            + Agregar al Presupuesto
          </button>
        </form>

        {precioBaseOriginal > 0 && porcentajeDescuentoAplicado > 0 && (
          <div className="text-[11px] bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-200 flex justify-between items-center">
            <span>🏷️ Descuento aplicado por Convenio (<strong>{convenioAplicado}</strong>): -{porcentajeDescuentoAplicado}%</span>
            <span>Precio Base: <del>${precioBaseOriginal.toLocaleString('es-CL')}</del> → Precio Final: <strong>${parseInt(valorPrestacion).toLocaleString('es-CL')} CLP</strong></span>
          </div>
        )}
      </div>

      {/* Formulario de Registrar Abono */}
      <div className="bg-white p-4 border border-gray-200 rounded-2xl mb-6 print:hidden">
        <h4 className="font-bold text-xs text-gray-800 mb-3 uppercase tracking-wider">Registrar Abono / Pago del Paciente</h4>
        <form onSubmit={handleAgregarAbono} className="flex flex-wrap gap-3 items-end text-xs">
          <div>
            <label className="block text-gray-600 mb-1 font-semibold">Monto ($ CLP)</label>
            <input
              type="number"
              placeholder="Monto ($ CLP)"
              value={montoAbono}
              onChange={(e) => setValorAbono(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white w-36"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-semibold">Método de Pago</label>
            <select
              value={metodoPagoAbono}
              onChange={(e) => setMetodoPagoAbono(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white font-semibold"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia Bancaria</option>
              <option value="Débito">Tarjeta de Débito</option>
              <option value="Crédito">Tarjeta de Crédito</option>
            </select>
          </div>

          <button type="submit" className="bg-green-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-800 cursor-pointer">
            + Registrar Abono
          </button>
        </form>

        {abonos.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <span className="text-[11px] font-bold text-gray-600 uppercase block mb-2">Historial de Abonos Registrados:</span>
            <div className="space-y-1.5">
              {abonos.map(a => (
                <div key={a.id} className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg border text-xs">
                  <span><strong className="text-gray-800">${a.monto.toLocaleString('es-CL')} CLP</strong> — {a.metodoPago} ({a.fecha})</span>
                  <button onClick={() => handleEliminarAbono(a.id)} className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer" aria-label="Eliminar abono">🗑️ Borrar</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Botón de Impresión A4 */}
      <div className="flex justify-end mb-4 print:hidden">
        <button onClick={() => window.print()} className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 shadow-sm flex items-center gap-2 cursor-pointer">
          🖨️ Imprimir Presupuesto con Odontograma (A4)
        </button>
      </div>

      {/* Documento Imprimible del Presupuesto */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 print:border-none print:p-0">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez'}</h1>
            <p className="text-xs text-gray-600">{userProfile?.especialidad || 'Cirujano Dentista'} | RUT: {userProfile?.rut || 'N/I'}</p>
            <p className="text-xs text-gray-500">Consulta Odontológica Particular</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-800 uppercase">Presupuesto Clínico</h2>
            <p className="text-xs text-gray-500">Fecha: {new Date().toLocaleDateString('es-CL')}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-xs grid grid-cols-2 gap-2 print:bg-white print:border">
          <p><span className="font-bold">Paciente:</span> {paciente.nombre}</p>
          <p><span className="font-bold">RUT:</span> {paciente.rut}</p>
          <p><span className="font-bold">Edad:</span> {paciente.edad} años</p>
          <p><span className="font-bold">Previsión:</span> {paciente.prevision || 'Particular'}</p>
        </div>

        {/* Odontograma Integrado en Impresión */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 print:bg-white print:border">
          <h4 className="text-[11px] font-bold text-gray-600 uppercase mb-3 text-center">Estado de Dentición (Odontograma Clínico)</h4>
          <div className="flex flex-col gap-2 items-center">
            <div className="flex gap-0.5 justify-center">
              {PERMANENTE_SUPERIOR.map(num => (
                <DienteSVG key={num} numero={num} estadosPieza={odontogramaInicial[num]} />
              ))}
            </div>
            <div className="border-t border-gray-200 w-full my-1"></div>
            <div className="flex gap-0.5 justify-center">
              {PERMANENTE_INFERIOR.map(num => (
                <DienteSVG key={num} numero={num} estadosPieza={odontogramaInicial[num]} />
              ))}
            </div>
          </div>
        </div>

        {itemsPresupuesto.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">No has agregado prestaciones al presupuesto de este paciente.</p>
        ) : (
          <div>
            <table className="w-full text-left text-xs mb-6 border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-100 text-gray-800 print:bg-gray-50">
                  <th className="p-3">Pieza</th>
                  <th className="p-3">Prestación Definida</th>
                  <th className="p-3">Convenio</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Valor</th>
                  <th className="p-3 text-right print:hidden">Acción</th>
                </tr>
              </thead>
              <tbody>
                {itemsPresupuesto.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="p-3 font-bold text-gray-900">{item.pieza}</td>
                    <td className="p-3 text-gray-700">{item.prestacion}</td>
                    <td className="p-3 text-emerald-800 font-semibold">{item.convenio || paciente.prevision || 'Particular'} {item.descuentoPct > 0 && `(-${item.descuentoPct}%)`}</td>
                    <td className="p-3 text-center">
                      <select
                        value={item.estado || 'Pendiente'}
                        onChange={(e) => handleCambiarEstadoItem(item.id, e.target.value)}
                        className={`text-[11px] rounded-lg px-2.5 py-1 font-bold border border-transparent transition-all cursor-pointer print:border-none print:bg-transparent ${
                          item.estado === 'Realizado'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : item.estado === 'En Proceso'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="Pendiente">🟡 Pendiente</option>
                        <option value="En Proceso">🔵 En Proceso</option>
                        <option value="Realizado">🟢 Realizado</option>
                      </select>
                    </td>
                    <td className="p-3 text-right font-medium text-gray-900">${item.valor.toLocaleString('es-CL')} CLP</td>
                    <td className="p-3 text-right print:hidden">
                      <button onClick={() => handleEliminarItem(item.id)} className="text-red-500 hover:text-red-700 font-bold cursor-pointer">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t-2 border-black pt-4 space-y-1 text-right text-xs">
              <p><span className="text-gray-600">Total Tratamiento:</span> <span className="font-bold">${totalPresupuesto.toLocaleString('es-CL')} CLP</span></p>
              <p><span className="text-green-700">Total Abonado:</span> <span className="font-bold text-green-700">-${totalAbonado.toLocaleString('es-CL')} CLP</span></p>
              <p className="text-sm pt-2"><span className="font-bold text-gray-900">Saldo Pendiente:</span> <span className="font-extrabold text-red-600">${saldoPendiente.toLocaleString('es-CL')} CLP</span></p>
            </div>

            <div className="hidden print:block mt-20 pt-10 border-t border-gray-300 text-center">
              <div className="w-64 mx-auto border-t border-black pt-2">
                <p className="font-bold text-xs">{userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez'}</p>
                <p className="text-[10px] text-gray-600">{userProfile?.especialidad || 'Cirujano Dentista'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* F2-12: Modal de selección de materiales para descuento de inventario */}
      {itemPendienteDescuento && (
        <ModalDescuentoInventario
          item={itemPendienteDescuento}
          categoria={categoriaDetectada}
          materialesDisponibles={materialesDisponibles}
          alConfirmar={handleConfirmarDescuento}
          alCancelar={handleCancelarDescuento}
        />
      )}
    </div>
  )
})

PresupuestoSection.displayName = 'PresupuestoSection'
