/**
 * ModalNuevoPresupuesto — Modal para emitir presupuesto formal cotizado
 * Migrado a <Modal> base + CamposFormularioPresupuesto (F7-25)
 */
import React, { memo, useState, useEffect } from 'react'
import { generarFolioPresupuesto } from '../utils/presupuestosCalculations'
import { presupuestosStorageService } from '../services/presupuestosStorageService'
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'
import { odontogramaStorageService } from '../../odontograma'
import { createLogger } from '../../../services/logger.js'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { CamposFormularioPresupuesto } from './CamposFormularioPresupuesto'

const log = createLogger('ModalNuevoPresupuesto')

export const ModalNuevoPresupuesto = memo(({ pacientes = [], prestaciones = [], alGuardar, alCerrar }) => {
  const [pacienteId, setPacienteId] = useState('')
  const [convenio, setConvenio] = useState('Particular')
  const [observacion, setObservacion] = useState('')
  
  const [itemsSeleccionados, setItemsSeleccionados] = useState([])
  const [prestacionSelId, setPrestacionSelId] = useState('')
  const [piezaDental, setPiezaDental] = useState('')

  const [hallazgosOdontograma, setHallazgosOdontograma] = useState([])

  useEffect(() => {
    if (!pacienteId) {
      setHallazgosOdontograma([])
      return
    }

    try {
      const odonto = odontogramaStorageService.obtenerOdontograma(`odonto_inicial_${pacienteId}`, {})
      if (odonto && typeof odonto === 'object') {
        const listaHallazgos = []

        Object.keys(odonto).forEach(pieza => {
          const estados = odonto[pieza]
          if (Array.isArray(estados)) {
            estados.forEach(est => {
              if (est && est !== 'Sano') {
                listaHallazgos.push({ pieza, diagnostico: est })
              }
            })
          }
        })

        setHallazgosOdontograma(listaHallazgos)
      } else {
        setHallazgosOdontograma([])
      }
    } catch (e) {
      log.error('Error al leer Odontograma del paciente:', e)
      setHallazgosOdontograma([])
    }
  }, [pacienteId])

  const handleAgregarItem = () => {
    if (!prestacionSelId) return
    const prest = prestaciones.find(p => String(p.id) === String(prestacionSelId))
    if (!prest) return

    const nuevoItem = {
      id: Date.now(),
      pieza: piezaDental || 'General',
      prestacion: prest.nombre,
      convenio,
      precioBase: parseFloat(prest.precioParticular || prest.precio) || 0,
      valor: parseFloat(prest.precioParticular || prest.precio) || 0,
      estado: 'Pendiente'
    }

    setItemsSeleccionados([...itemsSeleccionados, nuevoItem])
    setPrestacionSelId('')
    setPiezaDental('')
  }

  const handleImportarHallazgo = (hallazgo) => {
    let prestacionEncontrada = prestaciones.find(p => 
      p.nombre.toLowerCase().includes(hallazgo.diagnostico.toLowerCase())
    ) || prestaciones[0]

    const nuevoItem = {
      id: Date.now() + Math.random(),
      pieza: hallazgo.pieza,
      prestacion: prestacionEncontrada ? `${hallazgo.diagnostico} — ${prestacionEncontrada.nombre}` : hallazgo.diagnostico,
      convenio,
      precioBase: prestacionEncontrada ? (parseFloat(prestacionEncontrada.precioParticular || prestacionEncontrada.precio) || 0) : 35000,
      valor: prestacionEncontrada ? (parseFloat(prestacionEncontrada.precioParticular || prestacionEncontrada.precio) || 0) : 35000,
      estado: 'Pendiente'
    }

    setItemsSeleccionados(prev => [...prev, nuevoItem])
  }

  const handleEliminarItem = (itemId) => {
    setItemsSeleccionados(itemsSeleccionados.filter(i => i.id !== itemId))
  }

  const montoTotal = itemsSeleccionados.reduce((acc, curr) => acc + curr.valor, 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!pacienteId) {
      alert('⚠️ Por favor selecciona un paciente.')
      return
    }
    if (itemsSeleccionados.length === 0) {
      alert('⚠️ Agrega al menos una prestación al presupuesto.')
      return
    }

    const pac = pacientes.find(p => String(p.id) === String(pacienteId))

    const nuevoPresupuesto = {
      id: Date.now(),
      folio: generarFolioPresupuesto(),
      pacienteId: pac?.id,
      pacienteNombre: pac?.nombre || 'Paciente',
      pacienteRut: pac?.rut || 'N/I',
      fechaEmision: obtenerFechaLocalISO(),
      vigenciaDias: 30,
      convenio,
      montoTotal,
      montoAbonado: 0,
      estado: 'Emitido',
      items: itemsSeleccionados,
      observacion
    }

    presupuestosStorageService.sincronizarConFichaPaciente(pac?.id, itemsSeleccionados, convenio)

    alGuardar(nuevoPresupuesto)
    alCerrar()
  }

  return (
    <Modal
      isOpen={true}
      onClose={alCerrar}
      title="Emitir Presupuesto Formal Cotizado"
      size="lg"
    >
      <p className="text-[11px] text-graphite-500 dark:text-graphite-400 mb-4">
        Sincronizado con la Ficha Clínica y el Arancel Oficial.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <CamposFormularioPresupuesto
          pacientes={pacientes}
          prestaciones={prestaciones}
          pacienteId={pacienteId}
          convenio={convenio}
          hallazgosOdontograma={hallazgosOdontograma}
          piezaDental={piezaDental}
          prestacionSelId={prestacionSelId}
          itemsSeleccionados={itemsSeleccionados}
          montoTotal={montoTotal}
          observacion={observacion}
          setPacienteId={setPacienteId}
          setConvenio={setConvenio}
          setPiezaDental={setPiezaDental}
          setPrestacionSelId={setPrestacionSelId}
          setObservacion={setObservacion}
          handleImportarHallazgo={handleImportarHallazgo}
          handleAgregarItem={handleAgregarItem}
          handleEliminarItem={handleEliminarItem}
        />

        {/* Botones */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            onClick={alCerrar}
            variant="ghost"
            fullWidth
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
          >
            Guardar y Emitir
          </Button>
        </div>
      </form>
    </Modal>
  )
})

ModalNuevoPresupuesto.displayName = 'ModalNuevoPresupuesto'
