import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  presupuestosStorageService,
  type PresupuestoLocal,
  type PresupuestoItemLocal
} from '../services/presupuestosStorageService'
import {
  calcularResumenPresupuestos,
  type ResumenPresupuestos
} from '../utils/presupuestosCalculations'
import { useAppDialog } from '../../../../shared/hooks/useAppDialog'
import type { Paciente } from '../../../../domains/clinical/patient/schemas/pacienteSchema'

export interface UsePresupuestosReturn {
  presupuestos: PresupuestoLocal[]
  resumen: ResumenPresupuestos
  modalNuevoAbierto: boolean
  setModalNuevoAbierto: React.Dispatch<React.SetStateAction<boolean>>
  presupuestoImprimir: PresupuestoLocal | null
  setPresupuestoImprimir: React.Dispatch<
    React.SetStateAction<PresupuestoLocal | null>
  >
  estadoFiltro: string
  setEstadoFiltro: React.Dispatch<React.SetStateAction<string>>
  busqueda: string
  setBusqueda: React.Dispatch<React.SetStateAction<string>>
  agregarPresupuesto: (nuevoPresupuesto: PresupuestoLocal) => void
  cambiarEstadoPresupuesto: (
    presupuestoId: string | number,
    nuevoEstado: string
  ) => void
  eliminarPresupuesto: (
    presupuestoId: string | number,
    pacienteId: string | number,
    items?: PresupuestoItemLocal[]
  ) => Promise<void>
}

export const usePresupuestos = (
  pacientes: (Paciente | { id: string | number; [key: string]: unknown })[] = [],
  _prestaciones: unknown[] = []
): UsePresupuestosReturn => {
  const { confirm } = useAppDialog()
  const [presupuestos, setPresupuestos] = useState<PresupuestoLocal[]>([])
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState<boolean>(false)
  const [presupuestoImprimir, setPresupuestoImprimir] =
    useState<PresupuestoLocal | null>(null)
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos')
  const [busqueda, setBusqueda] = useState<string>('')

  const cargarPresupuestos = useCallback(() => {
    // Solo presupuestos formales (creados manualmente desde PresupuestosModulo).
    // Los consolidados virtuales (PRES-PAC-*) quedan solo en la Ficha Clínica
    // del paciente, no aparecen en este módulo para evitar confusión
    // (su estado se calcula desde items del plan, no desde presupuestos formales).
    const creadosDirectos = presupuestosStorageService.obtenerPresupuestos([])
    setPresupuestos(creadosDirectos)
  }, [pacientes])

  useEffect(() => {
    cargarPresupuestos()
    window.addEventListener('storage', cargarPresupuestos)
    window.addEventListener('presupuestos_actualizados', cargarPresupuestos)
    return () => {
      window.removeEventListener('storage', cargarPresupuestos)
      window.removeEventListener('presupuestos_actualizados', cargarPresupuestos)
    }
  }, [cargarPresupuestos])

  const agregarPresupuesto = useCallback(
    (nuevoPresupuesto: PresupuestoLocal) => {
      const directos = presupuestosStorageService.obtenerPresupuestos([])
      const actualizados = [nuevoPresupuesto, ...directos]
      presupuestosStorageService.guardarPresupuestos(actualizados)
      if (typeof presupuestosStorageService.guardarPresupuesto === 'function') {
        presupuestosStorageService
          .guardarPresupuesto(nuevoPresupuesto)
          .catch(() => {})
      }
      cargarPresupuestos()
    },
    [cargarPresupuestos]
  )

  const cambiarEstadoPresupuesto = useCallback(
    (presupuestoId: string | number, nuevoEstado: string) => {
      presupuestosStorageService.actualizarEstadoPresupuesto(
        presupuestoId,
        nuevoEstado
      )
      cargarPresupuestos()
    },
    [cargarPresupuestos]
  )

  const eliminarPresupuesto = useCallback(
    async (
      presupuestoId: string | number,
      pacienteId: string | number,
      items: PresupuestoItemLocal[] = []
    ) => {
      const ok = await confirm({
        title: 'Eliminar presupuesto',
        description:
          '¿Estás seguro de eliminar este presupuesto? Se eliminará también del plan de tratamiento del paciente.',
        variant: 'danger',
        confirmText: 'Eliminar'
      })
      if (ok) {
        presupuestosStorageService.eliminarPresupuestoYFicha(
          presupuestoId,
          pacienteId,
          items
        )
        cargarPresupuestos()
      }
    },
    [cargarPresupuestos, confirm]
  )

  const resumen = useMemo(
    () => calcularResumenPresupuestos(presupuestos),
    [presupuestos]
  )

  const presupuestosFiltrados = useMemo(() => {
    return presupuestos.filter(p => {
      const coincideEstado =
        estadoFiltro === 'Todos' || p.estado === estadoFiltro
      const texto = busqueda.trim().toLowerCase()
      const coincideBusqueda =
        !texto ||
        p.folio?.toLowerCase().includes(texto) ||
        p.pacienteNombre?.toLowerCase().includes(texto) ||
        p.pacienteRut?.toLowerCase().includes(texto)
      return coincideEstado && coincideBusqueda
    })
  }, [presupuestos, estadoFiltro, busqueda])

  return {
    presupuestos: presupuestosFiltrados,
    resumen,
    modalNuevoAbierto,
    setModalNuevoAbierto,
    presupuestoImprimir,
    setPresupuestoImprimir,
    estadoFiltro,
    setEstadoFiltro,
    busqueda,
    setBusqueda,
    agregarPresupuesto,
    cambiarEstadoPresupuesto,
    eliminarPresupuesto
  }
}
