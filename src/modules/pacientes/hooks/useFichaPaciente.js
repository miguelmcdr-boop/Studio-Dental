import { useState, useEffect, useMemo, useCallback } from 'react'
import { pacientesStorageService } from '../services/pacientesStorageService'
// F6-D-4: usar recetasStorageService para recetas
import { recetasStorageService } from '../services/recetasStorageService'
import { odontogramaStorageService } from '../../odontograma/services/odontogramaStorageService'
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
  // F6-D-4: cargar recetas desde Supabase (vía recetasStorageService)
  const [recetas, setRecetas] = useState(() => 
    recetasStorageService.obtenerRecetas(paciente.id, [])
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

  // F6-D-2: cargar odontogramas desde Supabase (vía odontogramaStorageService)
  useEffect(() => {
    const dataInicial = odontogramaStorageService.obtenerOdontogramaInicial(paciente.id, {})
    setOdontogramaInicial(dataInicial)

    const dataEvolucion = odontogramaStorageService.obtenerOdontogramaEvolucion(paciente.id, {})
    setOdontogramaEvolucion(dataEvolucion)
  }, [paciente.id])

  const handleFichaChange = useCallback((campo, valor) => {
    setFichaData(prev => {
      const nuevaFicha = { ...prev, [campo]: valor }
      alActualizarPaciente({ ...paciente, ...nuevaFicha })
      return nuevaFicha
    })
  }, [paciente, alActualizarPaciente])

  // F6-D-2: guardar en Supabase + localStorage
  const guardarInicial = useCallback(async (nuevoOdonto) => {
    setOdontogramaInicial(nuevoOdonto)
    await odontogramaStorageService.guardarOdontogramaInicial(paciente.id, nuevoOdonto)
  }, [paciente.id])

  // F6-D-2: guardar en Supabase + localStorage
  const guardarEvolucion = useCallback(async (nuevoOdonto) => {
    setOdontogramaEvolucion(nuevoOdonto)
    await odontogramaStorageService.guardarOdontogramaEvolucion(paciente.id, nuevoOdonto)
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