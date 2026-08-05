import { useState, useEffect, useMemo, useCallback } from 'react'
import { calcularResumenJornada } from '../utils/dashboardCalculations'

export const useDashboard = (pacientes = []) => {
  const [citas, setCitas] = useState([])
  const [pagos, setPagos] = useState([])
  const [presupuestos, setPresupuestos] = useState([])

  const cargarDatos = useCallback(() => {
    try {
      const citasStorage = JSON.parse(localStorage.getItem('clinica_citas') || '[]')
      const pagosStorage = JSON.parse(localStorage.getItem('clinica_historial_pagos') || '[]')
      const presupuestosStorage = JSON.parse(localStorage.getItem('clinica_presupuestos_globales') || '[]')

      // Recolectar abonos de presupuestos individuales para sumar a pagos
      const abonosGlobales = []
      pacientes.forEach(p => {
        const abonosPac = JSON.parse(localStorage.getItem(`abonos_${p.id}`) || '[]')
        abonosPac.forEach(a => abonosGlobales.push(a))
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