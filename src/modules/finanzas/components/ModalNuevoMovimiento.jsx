import React, { memo, useState } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO } from '../constants/finanzasConstants'
import { useAppDialog } from '../../../hooks/useAppDialog'

export const ModalNuevoMovimiento = memo(({ alGuardar, alCerrar }) => {
  const { alert: dialogAlert } = useAppDialog()
  const [tipo, setTipo] = useState('ingreso')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS_INGRESO[0])
  const [metodoPago, setMetodoPago] = useState('Efectivo')
  const [detalle, setDetalle] = useState('')

  const handleTipoChange = (nuevoTipo) => {
    setTipo(nuevoTipo)
    setCategoria(nuevoTipo === 'ingreso' ? CATEGORIAS_INGRESO[0] : CATEGORIAS_EGRESO[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const montoLimpio = parseInt(monto) || 0
    
    if (!montoLimpio || montoLimpio <= 0) {
      await dialogAlert({
        title: 'Monto inválido',
        description: 'Ingresa un monto mayor a $0.',
        variant: 'warning',
        confirmText: 'Entendido'
      })
      return
    }

    const nuevoMov = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL'),
      tipo,
      monto: montoLimpio,
      categoria,
      metodoPago,
      detalle
    }

    alGuardar(nuevoMov)
    
    await dialogAlert({
      title: 'Movimiento registrado',
      description: `${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} de ${formatearCLP(montoLimpio)} registrado exitosamente.`,
      variant: 'success',
      confirmText: 'Entendido'
    })
    
    alCerrar()
  }

  return (
    <Modal isOpen={true} onClose={alCerrar} title="Registrar Movimiento de Caja" size="md">

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={() => handleTipoChange('ingreso')}
              variant={tipo === 'ingreso' ? 'primary' : 'secondary'}
              className={tipo === 'ingreso' ? 'bg-emerald-600 hover:bg-emerald-700 transition-colors duration-150' : ''}
              fullWidth
            >
              Ingreso
            </Button>
            <Button
              type="button"
              onClick={() => handleTipoChange('egreso')}
              variant={tipo === 'egreso' ? 'danger' : 'secondary'}
              className={tipo === 'egreso' ? 'bg-red-600 hover:bg-red-700 transition-colors duration-150' : ''}
              fullWidth
            >
              Egreso / Gasto
            </Button>
          </div>

          <Input
            label="Monto ($ CLP)"
            type="number"
            required
            placeholder="Ej: 45000"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />

          <div>
            <label className="block font-semibold text-gray-700 dark:text-graphite-300 mb-1">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-graphite-600 bg-white dark:bg-graphite-800 font-semibold"
            >
              {(tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 dark:text-graphite-300 mb-1">Método de Pago</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-graphite-600 bg-white dark:bg-graphite-800"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia Bancaria</option>
              <option value="Débito">Tarjeta de Débito</option>
              <option value="Crédito">Tarjeta de Crédito</option>
            </select>
          </div>

          <Input
            label="Detalle / Observación"
            type="text"
            placeholder="Ej: Compra de cajas de guantes y anestesia..."
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
          />

          <div className="flex gap-2 pt-3">
            <Button type="button" onClick={alCerrar} variant="ghost" fullWidth>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Guardar Registro
            </Button>
          </div>
        </form>
    </Modal>
  )
})

ModalNuevoMovimiento.displayName = 'ModalNuevoMovimiento'