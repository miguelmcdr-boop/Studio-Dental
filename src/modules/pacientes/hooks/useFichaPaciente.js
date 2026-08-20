import { useState, useEffect, useMemo, useCallback } from 'react'
import { pacientesStorageService } from '../services/pacientesStorageService'
import { useFichaClinicaSync } from './useFichaClinicaSync'

export const useFichaPaciente = (paciente, alActualizarPaciente) => {
  // F6-D-1: Sincronizar datos clínicos desde Supabase al abrir la ficha
  const { sincronizando, error: syncError } = useFichaClinicaSync(paciente?.id)

  const [tabActiva, setTabActiva] = useState('Ficha Clínica')
  const [odontogramaInicial, setOdontogramaInicial] = useState({})
  const [odontogramaEvolucion, setOdontogramaEvolucion] = useState({})
  
  const [itemsPresupuesto, setItemsPresupuesto] = useState(() => 
    pacientesStorageService.obtenerItem(`presupuesto_items_${paciente.id}`, [])
  )
  const [abonos, setAbonos] = useState(() => 
    pacientesStorageService.obtenerItem(`abonos_${paciente.id}`, [])
  )
  const [recetas, setRecetas] = useState(() => 
    pacientesStorageService.obtenerItem(`recetas_${paciente.id}`, [])
  )
  const [evolucionesNotas, setEvolucionesNotas] = useState(() => 
    pacientesStorageService.obtenerItem(`evoluciones_notas_${paciente.id}`, [])
  )
  const [certificados, setCertificados] = useState(() => 
    pacientesStorageService.obtenerItem(`certificados_${paciente.id}`, [])
  )

  const [fichaData, setFichaData] = useState({
    motivoConsulta: paciente.motivoConsulta || '',
    anamnesisProxima: paciente.anamnesisProxima || '',
    alergias: paciente.alergias || '',
    enfermedades: paciente.enfermedades || '',
    medicamentos: paciente.medicamentos || '',
    habitos: paciente.habitos || '',
    examenExtraoral: paciente.examenExtraoral || '',
    examenIntraoral: paciente.examenIntraoral || '',
    presionArterial: paciente.presionArterial || '',
    riesgoCariogenico: paciente.riesgoCariogenico || 'Bajo',
    riesgoPeriodontal: paciente.riesgoPeriodontal || 'Gingivitis'
  })

  useEffect(() => {
    const dataInicial = pacientesStorageService.obtenerItem(`odonto_inicial_${paciente.id}`, {})
    setOdontogramaInicial(dataInicial)

    const dataEvolucion = pacientesStorageService.obtenerItem(`odonto_evolucion_${paciente.id}`, {})
    setOdontogramaEvolucion(dataEvolucion)
  }, [paciente.id])

  const handleFichaChange = useCallback((campo, valor) => {
    setFichaData(prev => {
      const nuevaFicha = { ...prev, [campo]: valor }
      alActualizarPaciente({ ...paciente, ...nuevaFicha })
      return nuevaFicha
    })
  }, [paciente, alActualizarPaciente])

  const guardarInicial = useCallback((nuevoOdonto) => {
    setOdontogramaInicial(nuevoOdonto)
    pacientesStorageService.guardarItem(`odonto_inicial_${paciente.id}`, nuevoOdonto)
  }, [paciente.id])

  const guardarEvolucion = useCallback((nuevoOdonto) => {
    setOdontogramaEvolucion(nuevoOdonto)
    pacientesStorageService.guardarItem(`odonto_evolucion_${paciente.id}`, nuevoOdonto)
  }, [paciente.id])

  const totalPresupuesto = useMemo(() => (itemsPresupuesto || []).reduce((acc, curr) => acc + (curr.valor || 0), 0), [itemsPresupuesto])
  const totalAbonado = useMemo(() => (abonos || []).reduce((acc, curr) => acc + (curr.monto || 0), 0), [abonos])
  const saldoPendiente = totalPresupuesto - totalAbonado

  return {
    // F6-D-1: estado de sincronización de datos clínicos
    sincronizando,
    syncError,
    tabActiva,
    setTabActiva,
    odontogramaInicial,
    odontogramaEvolucion,
    guardarInicial,
    guardarEvolucion,
    fichaData,
    handleFichaChange,
    itemsPresupuesto,
    setItemsPresupuesto,
    abonos,
    setAbonos,
    recetas,
    setRecetas,
    evolucionesNotas,
    setEvolucionesNotas,
    certificados,
    setCertificados,
    totalPresupuesto,
    totalAbonado,
    saldoPendiente
  }
}