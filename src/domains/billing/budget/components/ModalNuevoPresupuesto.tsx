/**
 * ModalNuevoPresupuesto — Modal para emitir presupuesto formal cotizado
 * Migrado a <Modal> base + CamposFormularioPresupuesto (F7-25)
 */
import React, { memo, useState, useEffect } from 'react'
import { generarFolioPresupuesto } from '../utils/presupuestosCalculations'
import {
  presupuestosStorageService,
  type PresupuestoLocal
} from '../services/presupuestosStorageService'
import { obtenerFechaLocalISO } from '../../../../utils/dateUtils'
import { odontogramaStorageService } from '../../../../modules/odontograma'
import { createLogger } from '../../../../services/logger'
import { Modal } from '../../../../components/ui/Modal'
import { Button } from '../../../../components/ui/Button'
import {
  CamposFormularioPresupuesto,
  type PacienteFormRef,
  type PrestacionFormRef,
  type HallazgoOdontograma,
  type ItemSeleccionadoPresupuesto
} from './CamposFormularioPresupuesto'
import { useAppDialog } from '../../../../hooks/useAppDialog'

const log = createLogger('ModalNuevoPresupuesto')

export interface ModalNuevoPresupuestoProps {
  pacientes?: PacienteFormRef[]
  prestaciones?: PrestacionFormRef[]
  alGuardar: (nuevoPresupuesto: PresupuestoLocal) => void
  alCerrar: () => void
}

export const ModalNuevoPresupuesto: React.FC<ModalNuevoPresupuestoProps> = memo(({
  pacientes = [],
  prestaciones = [],
  alGuardar,
  alCerrar
}) => {
  const [pacienteId, setPacienteId] = useState<string>('')
  const { alert: dialogAlert } = useAppDialog()
  const [convenio, setConvenio] = useState<string>('Particular')
  const [observacion, setObservacion] = useState<string>('')

  const [itemsSeleccionados, setItemsSeleccionados] = useState<ItemSeleccionadoPresupuesto[]>([])
  const [prestacionSelId, setPrestacionSelId] = useState<string>('')
  const [piezaDental, setPiezaDental] = useState<string>('')

  const [hallazgosOdontograma, setHallazgosOdontograma] = useState<HallazgoOdontograma[]>([])

  useEffect(() => {
    if (!pacienteId) {
      setHallazgosOdontograma([])
      return
    }

    try {
      const odonto = odontogramaStorageService.obtenerOdontograma(
        `odonto_inicial_${pacienteId}`,
        {}
      )
      if (odonto && typeof odonto === 'object') {
        const listaHallazgos: HallazgoOdontograma[] = []

        Object.keys(odonto as Record<string, unknown>).forEach((pieza) => {
          const estados = (odonto as Record<string, unknown>)[pieza]
          if (Array.isArray(estados)) {
            estados.forEach((est) => {
              if (est && est !== 'Sano') {
                listaHallazgos.push({ pieza, diagnostico: String(est) })
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

  const handleAgregarItem = (): void => {
    if (!prestacionSelId) return
    const prest = prestaciones.find((p) => String(p.id) === String(prestacionSelId))
    if (!prest) return

    const nuevoItem: ItemSeleccionadoPresupuesto = {
      id: Date.now(),
      pieza: piezaDental || 'General',
      prestacion: prest.nombre,
      convenio,
      precioBase: parseFloat(String(prest.precioParticular ?? prest.precio ?? 0)) || 0,
      valor: parseFloat(String(prest.precioParticular ?? prest.precio ?? 0)) || 0,
      estado: 'Pendiente'
    }

    setItemsSeleccionados([...itemsSeleccionados, nuevoItem])
    setPrestacionSelId('')
    setPiezaDental('')
  }

  const handleImportarHallazgo = (hallazgo: HallazgoOdontograma): void => {
    const prestacionEncontrada =
      prestaciones.find((p) =>
        p.nombre.toLowerCase().includes(hallazgo.diagnostico.toLowerCase())
      ) || prestaciones[0]

    const precio = prestacionEncontrada
      ? parseFloat(String(prestacionEncontrada.precioParticular ?? prestacionEncontrada.precio ?? 0)) || 0
      : 35000

    const nuevoItem: ItemSeleccionadoPresupuesto = {
      id: Date.now() + Math.random(),
      pieza: hallazgo.pieza,
      prestacion: prestacionEncontrada
        ? `${hallazgo.diagnostico} — ${prestacionEncontrada.nombre}`
        : hallazgo.diagnostico,
      convenio,
      precioBase: precio,
      valor: precio,
      estado: 'Pendiente'
    }

    setItemsSeleccionados((prev) => [...prev, nuevoItem])
  }

  const handleEliminarItem = (itemId: string | number): void => {
    setItemsSeleccionados(itemsSeleccionados.filter((i) => i.id !== itemId))
  }

  const montoTotal = itemsSeleccionados.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (!pacienteId) {
      await dialogAlert({
        title: 'Paciente requerido',
        description: 'Por favor selecciona un paciente.',
        variant: 'warning',
        confirmText: 'Entendido'
      })
      return
    }
    if (itemsSeleccionados.length === 0) {
      await dialogAlert({
        title: 'Prestaciones requeridas',
        description: 'Agrega al menos una prestación al presupuesto.',
        variant: 'warning',
        confirmText: 'Entendido'
      })
      return
    }

    const pac = pacientes.find((p) => String(p.id) === String(pacienteId))

    const nuevoPresupuesto: PresupuestoLocal = {
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

    if (pac?.id) {
      presupuestosStorageService.sincronizarConFichaPaciente(
        pac.id,
        itemsSeleccionados,
        convenio
      )
    }

    alGuardar(nuevoPresupuesto)

    await dialogAlert({
      title: 'Presupuesto creado',
      description: `Presupuesto ${nuevoPresupuesto.folio} creado exitosamente para ${pac?.nombre || 'paciente'}.`,
      variant: 'success',
      confirmText: 'Entendido'
    })

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
          <Button type="button" onClick={alCerrar} variant="ghost" fullWidth>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            Guardar y Emitir
          </Button>
        </div>
      </form>
    </Modal>
  )
})

ModalNuevoPresupuesto.displayName = 'ModalNuevoPresupuesto'
