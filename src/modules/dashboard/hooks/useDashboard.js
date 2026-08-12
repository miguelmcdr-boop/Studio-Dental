import { useState, useEffect, useMemo, useCallback } from 'react'
import { calcularResumenJornada } from '../utils/dashboardCalculations'
import { agendaStorageService } from '../../agenda'
import { pagosStorageService } from '../../pagos/services/pagosStorageService'
import { presupuestosStorageService } from '../../presupuestos/services/presupuestosStorageService'

export const useDashboard = (pacientes = []) => {
  const [citas, setCitas] = useState([])
  const [pagos, setPagos] = useState([])
  const [presupuestos, setPresupuestos] = useState([])

  const cargarDatos = useCallback(() => {
    try {
      // Cargar datos desde servicios (F2-07a)
      const citasStorage = agendaStorageService.obtenerCitas([])
      const pagosStorage = pagosStorageService.obtenerPagos([])
      const presupuestosStorage = presupuestosStorageService.obtenerPresupuestos([])

      // Recolectar abonos de presupuestos individuales para sumar a pagos (vía pagosStorageService, F2-07a)
      const abonosGlobales = []
      pacientes.forEach(p => {
        const abonosPac = pagosStorageService.obtenerAbonosPorPaciente(p.id)
        if (Array.isArray(abonosPac)) {
          abonosPac.forEach(a => abonosGlobales.push(a))
        }
      })

      setCitas(Array.isArray(citasStorage) ? citasStorage : [])
      setPagos([...(Array.isArray(pagosStorage) ? pagosStorage : []), ...abonosGlobales])
      setPresupuestos(Array.isArray(presupuestosStorage) ? presupuestosStorage : [])
    } catch (e) {
      console.error('Error al cargar datos en Dashboard:', e)
    }
  }, [pacientes])

  useEffect(() => {
    cargarDatos()

    window.addEventListener('storage', cargarDatos)
    window.addEventListener('arancel_actualizado', cargarDatos)
    return () => {
      window.removeEventListener('storage', cargarDatos)
      window.removeEventListener('arancel_actualizado', cargarDatos)
    }
  }, [cargarDatos])

  const resumen = useMemo(() => {
    return calcularResumenJornada(pacientes, citas, pagos, presupuestos)
  }, [pacientes, citas, pagos, presupuestos])

  return {
    resumen,
    refrescar: cargarDatos
  }
}