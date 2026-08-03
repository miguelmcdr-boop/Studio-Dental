import React, { useState, useEffect } from 'react'
import { VADEMECUM_ODONTOLOGICO } from '../data/vademecum'
import { INDICACIONES_POST_OPERATORIAS, DIAGNOSTICOS_CIE10, PLANTILLAS_EVOLUCION } from '../data/plantillas'
import { calcularTubosAnestesia } from '../utils/anestesiaCalc'
import { OdontogramaModulo } from './OdontogramaModulo'
import { OdontoAnatomicoModulo } from './odontoAnatomico/OdontoAnatomicoModulo'
import { PeriodontogramaModulo } from './periodontograma/PeriodontogramaModulo'
import { QuirurgicoModulo } from './quirurgico/QuirurgicoModulo'
import { OdontopediatriaModulo } from './odontopediatria/OdontopediatriaModulo'
import { SmileDesignModulo } from './dsd/SmileDesignModulo'
import { DienteSVG } from '../components/DienteSVG'

export const FichaPaciente = ({ paciente, userProfile, prestacionesArancel = [], alActualizarPaciente, alEliminarPaciente, alVolver }) => {
  const [tabActiva, setTabActiva] = useState('Ficha Clínica')
  const [odontogramaInicial, setOdontogramaInicial] = useState({})
  const [odontogramaEvolucion, setOdontogramaEvolucion] = useState({})
  const [fotos, setFotos] = useState([])
  const [radiografias, setRadiografias] = useState([])
  const [consentimientos, setConsentimientos] = useState([])

  const [itemsPresupuesto, setItemsPresupuesto] = useState(() => {
    const saved = localStorage.getItem(`presupuesto_items_${paciente.id}`)
    return saved ? JSON.parse(saved) : []
  })
  const [abonos, setAbonos] = useState(() => {
    const saved = localStorage.getItem(`abonos_${paciente.id}`)
    return saved ? JSON.parse(saved) : []
  })
  const [montoAbono, setValorAbono] = useState('')
  const [metodoPagoAbono, setMetodoPagoAbono] = useState('Efectivo')

  // SINCRONIZACIÓN CON CONVENIOS DE FINANZAS
  const [convenioAplicado, setConvenioAplicado] = useState(paciente.prevision || 'Particular')
  const [piezaPresupuesto, setPiezaPresupuesto] = useState('')
  const [prestacionSeleccionadaId, setPrestacionSeleccionadaId] = useState('')
  const [nombrePrestacion, setNombrePrestacion] = useState('')
  const [valorPrestacion, setValorPrestacion] = useState('')
  const [precioBaseOriginal, setPrecioBaseOriginal] = useState(0)
  const [porcentajeDescuentoAplicado, setPorcentajeDescuentoAplicado] = useState(0)

  const [tipoCertificado, setTipoCertificado] = useState('asistencia')
  const [horaInicioCert, setHoraInicioCert] = useState('10:00')
  const [horaFinCert, setHoraFinCert] = useState('11:00')
  const [diasReposoCert, setDiasReposoCert] = useState('2')
  const [diagnosticoCert, setDiagnosticoCert] = useState('Atención clínica quirúrgica odontológica.')

  // INDICACIONES POSTOPERATORIAS
  const [tipoPostOp, setTipoPostOp] = useState('Exodoncia y Cirugía Oral')
  const [textoPostOp, setTextoPostOp] = useState(INDICACIONES_POST_OPERATORIAS[0].texto)

  // RECETAS Y ALERTAS FARMACOLÓGICAS
  const [recetas, setRecetas] = useState(() => {
    const saved = localStorage.getItem(`recetas_${paciente.id}`)
    return saved ? JSON.parse(saved) : []
  })
  const [nuevaReceta, setNuevaReceta] = useState({ medicamento: '', indicacion: '' })
  const [sugerenciasVademecum, setSugerenciasVademecum] = useState([])
  const [alertaFarmaco, setAlertaFarmaco] = useState(null)

  const [mostrarEditarDatos, setMostrarEditarDatos] = useState(false)
  const [datosPersonalesEdit, setDatosPersonalesEdit] = useState({ ...paciente })

  // BITÁCORA Y DICTADO POR VOZ
  const [evolucionesNotas, setEvolucionesNotas] = useState(() => {
    const saved = localStorage.getItem(`evoluciones_notas_${paciente.id}`)
    return saved ? JSON.parse(saved) : []
  })
  const [nuevaNota, setNuevaNota] = useState('')
  const [sugerenciasNota, setSugerenciasNota] = useState([])
  const [idNotaEditando, setIdNotaEditando] = useState(null)
  const [textoNotaEditando, setTextoNotaEditando] = useState('')
  const [escuchandoVoz, setEscuchandoVoz] = useState(false)

  // CALCULADORA DE ANESTESIA
  const [pesoPaciente, setPesoPaciente] = useState(paciente.peso || 70)
  const [tipoAnestesicoCalc, setTipoAnestesicoCalc] = useState('lidocaina')

  const [sugerenciasCie, setSugerenciasCie] = useState([])
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
    const dataInicial = localStorage.getItem(`odonto_inicial_${paciente.id}`)
    if (dataInicial) setOdontogramaInicial(JSON.parse(dataInicial))

    const dataEvolucion = localStorage.getItem(`odonto_evolucion_${paciente.id}`)
    if (dataEvolucion) setOdontogramaEvolucion(JSON.parse(dataEvolucion))
  }, [paciente.id])

  // Obtiene el % de descuento configurado en el módulo de Finanzas
  const obtenerDescuentoConvenio = (nombreConvenio) => {
    try {
      const saved = localStorage.getItem('finanzas_config_convenios')
      if (!saved) return 0
      const convenios = JSON.parse(saved)
      const encontrado = convenios.find(c => 
        c.nombre.toLowerCase().includes(nombreConvenio.toLowerCase()) ||
        c.id.toLowerCase().includes(nombreConvenio.toLowerCase())
      )
      return encontrado ? encontrado.descuentoDefecto : 0
    } catch (e) {
      return 0
    }
  }

  const guardarInicial = (nuevoOdonto) => {
    setOdontogramaInicial(nuevoOdonto)
    localStorage.setItem(`odonto_inicial_${paciente.id}`, JSON.stringify(nuevoOdonto))
  }

  const guardarEvolucion = (nuevoOdonto) => {
    setOdontogramaEvolucion(nuevoOdonto)
    localStorage.setItem(`odonto_evolucion_${paciente.id}`, JSON.stringify(nuevoOdonto))
  }

  const handleFichaChange = (campo, valor) => {
    const nuevaFicha = { ...fichaData, [campo]: valor }
    setFichaData(nuevaFicha)
    alActualizarPaciente({ ...paciente, ...nuevaFicha })

    if (campo === 'motivoConsulta' && valor.trim().length > 1) {
      const coindicencias = DIAGNOSTICOS_CIE10.filter(d => d.toLowerCase().includes(valor.toLowerCase()))
      setSugerenciasCie(coindicencias)
    } else {
      setSugerenciasCie([])
    }
  }

  const handleGuardarDatosPersonales = (e) => {
    e.preventDefault()
    alActualizarPaciente({ ...paciente, ...datosPersonalesEdit })
    setMostrarEditarDatos(false)
  }

  const handleToggleDictadoVoz = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta el dictado por voz. Te recomendamos usar Google Chrome o Microsoft Edge.')
      return
    }

    if (escuchandoVoz) {
      setEscuchandoVoz(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-CL'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onstart = () => setEscuchandoVoz(true)
    recognition.onend = () => setEscuchandoVoz(false)
    recognition.onerror = () => setEscuchandoVoz(false)

    recognition.onresult = (event) => {
      const textoDictado = event.results[event.results.length - 1][0].transcript
      setNuevaNota(prev => prev ? `${prev} ${textoDictado}` : textoDictado)
    }

    recognition.start()
  }

  const handleNotaInputChange = (texto) => {
    setNuevaNota(texto)
    if (texto.trim().length > 1) {
      const coincidencias = PLANTILLAS_EVOLUCION.filter(p => p.clave.toLowerCase().includes(texto.toLowerCase()))
      setSugerenciasNota(coincidencias)
    } else {
      setSugerenciasNota([])
    }
  }

  const handleConcatenarPlantillaNota = (textoPlantilla) => {
    setNuevaNota(prev => prev ? `${prev} ${textoPlantilla}` : textoPlantilla)
    setSugerenciasNota([])
  }

  const handleMedicamentoInputChange = (texto) => {
    setNuevaReceta({ ...nuevaReceta, medicamento: texto })
    setAlertaFarmaco(null)

    if (texto.trim().length > 1) {
      const coindicencias = VADEMECUM_ODONTOLOGICO.filter(v =>
        v.medicamento.toLowerCase().includes(texto.toLowerCase())
      )
      setSugerenciasVademecum(coindicencias)

      const alergiasTexto = (fichaData.alergias || '').toLowerCase()
      const textoLower = texto.toLowerCase()

      if ((alergiasTexto.includes('penicilina') || alergiasTexto.includes('amoxicilina') || alergiasTexto.includes('betalactamico')) &&
          (textoLower.includes('amoxicilina') || textoLower.includes('penicilina'))) {
        setAlertaFarmaco({
          tipo: 'critica',
          mensaje: '⚠️ ¡ALERTA GRAVE! Paciente registrado con alergia a Penicilinas / Betalactámicos.',
          sugerencia: 'Alternativa segura: Clindamicina 300 mg o Azitromicina 500 mg.'
        })
      } else if ((alergiasTexto.includes('aine') || alergiasTexto.includes('ibuprofeno') || alergiasTexto.includes('aspirina')) &&
                 (textoLower.includes('ibuprofeno') || textoLower.includes('ketoprofeno') || textoLower.includes('ketorolaco') || textoLower.includes('diclofenaco') || textoLower.includes('naproxeno'))) {
        setAlertaFarmaco({
          tipo: 'advertencia',
          mensaje: '⚠️ ¡ALERTA DE ALERGIA! Paciente alérgico a AINEs.',
          sugerencia: 'Alternativa segura: Paracetamol 500 mg / 1 g o Clonixinato de Lisina.'
        })
      }
    } else {
      setSugerenciasVademecum([])
    }
  }

  const handleSeleccionarSugerenciaVademecum = (item) => {
    setNuevaReceta({ medicamento: item.medicamento, indicacion: item.posologia })
    setSugerenciasVademecum([])

    const alergiasTexto = (fichaData.alergias || '').toLowerCase()
    if ((alergiasTexto.includes('penicilina') || alergiasTexto.includes('amoxicilina')) && item.familia === 'penicilina') {
      setAlertaFarmaco({
        tipo: 'critica',
        mensaje: '⚠️ ¡ALERTA GRAVE! Paciente alérgico a Penicilinas. Evitar Amoxicilina.',
        sugerencia: 'Usar Clindamicina 300 mg.'
      })
    } else if (alergiasTexto.includes('aine') && item.familia === 'aine') {
      setAlertaFarmaco({
        tipo: 'advertencia',
        mensaje: '⚠️ ¡ALERTA DE ALERGIA! Paciente alérgico a AINEs.',
        sugerencia: 'Usar Paracetamol 500 mg / 1 g.'
      })
    } else {
      setAlertaFarmaco(null)
    }
  }

  // Selección de Prestación con cálculo automático del descuento de convenio
  const handleSeleccionarPrestacionArancel = (id, convenioNombre = convenioAplicado) => {
    setPrestacionSeleccionadaId(id)
    const prest = prestacionesArancel.find(p => p.id === parseInt(id))
    if (prest) {
      setNombrePrestacion(prest.nombre)
      setPrecioBaseOriginal(prest.precio)
      const pctDesc = obtenerDescuentoConvenio(convenioNombre)
      setPorcentajeDescuentoAplicado(pctDesc)
      const precioConDescuento = Math.round(prest.precio * (1 - pctDesc / 100))
      setValorPrestacion(precioConDescuento)
    }
  }

  const handleCambiarConvenioSelect = (nuevoConvenio) => {
    setConvenioAplicado(nuevoConvenio)
    if (prestacionSeleccionadaId) {
      handleSeleccionarPrestacionArancel(prestacionSeleccionadaId, nuevoConvenio)
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
    localStorage.setItem(`presupuesto_items_${paciente.id}`, JSON.stringify(actualizados))
    setPiezaPresupuesto('')
    setPrestacionSeleccionadaId('')
    setNombrePrestacion('')
    setValorPrestacion('')
    setPrecioBaseOriginal(0)
    setPorcentajeDescuentoAplicado(0)
  }

  const handleCambiarEstadoItem = (id, nuevoEstado) => {
    const actualizados = itemsPresupuesto.map(item => item.id === id ? { ...item, estado: nuevoEstado } : item)
    setItemsPresupuesto(actualizados)
    localStorage.setItem(`presupuesto_items_${paciente.id}`, JSON.stringify(actualizados))
  }

  const handleEliminarItemPresupuesto = (id) => {
    const actualizados = itemsPresupuesto.filter(i => i.id !== id)
    setItemsPresupuesto(actualizados)
    localStorage.setItem(`presupuesto_items_${paciente.id}`, JSON.stringify(actualizados))
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
    localStorage.setItem(`abonos_${paciente.id}`, JSON.stringify(actualizados))
    setValorAbono('')
  }

  const handleEliminarAbono = (idAbono) => {
    if (window.confirm('¿Deseas eliminar este registro de abono ingresado?')) {
      const actualizados = abonos.filter(a => a.id !== idAbono)
      setAbonos(actualizados)
      localStorage.setItem(`abonos_${paciente.id}`, JSON.stringify(actualizados))
    }
  }

  const handleAgregarReceta = (e) => {
    e.preventDefault()
    if (!nuevaReceta.medicamento || !nuevaReceta.indicacion) return
    const recetaObj = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL'),
      medicamento: nuevaReceta.medicamento,
      indicacion: nuevaReceta.indicacion
    }
    const actualizadas = [recetaObj, ...recetas]
    setRecetas(actualizadas)
    localStorage.setItem(`recetas_${paciente.id}`, JSON.stringify(actualizadas))
    setNuevaReceta({ medicamento: '', indicacion: '' })
    setAlertaFarmaco(null)
  }

  const handleEliminarReceta = (id) => {
    const actualizadas = recetas.filter(r => r.id !== id)
    setRecetas(actualizadas)
    localStorage.setItem(`recetas_${paciente.id}`, JSON.stringify(actualizadas))
  }

  const handleAgregarEvolucionNota = (e) => {
    e.preventDefault()
    if (!nuevaNota.trim()) return
    const notaObj = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      texto: nuevaNota
    }
    const actualizadas = [notaObj, ...evolucionesNotas]
    setEvolucionesNotas(actualizadas)
    localStorage.setItem(`evoluciones_notas_${paciente.id}`, JSON.stringify(actualizadas))
    setNuevaNota('')
  }

  const handleEliminarNota = (idNota) => {
    const actualizadas = evolucionesNotas.filter(n => n.id !== idNota)
    setEvolucionesNotas(actualizadas)
    localStorage.setItem(`evoluciones_notas_${paciente.id}`, JSON.stringify(actualizadas))
  }

  const handleIniciarEditarNota = (nota) => {
    setIdNotaEditando(nota.id)
    setTextoNotaEditando(nota.texto)
  }

  const handleGuardarNotaEditada = (idNota) => {
    const actualizadas = evolucionesNotas.map(n => n.id === idNota ? { ...n, texto: textoNotaEditando } : n)
    setEvolucionesNotas(actualizadas)
    localStorage.setItem(`evoluciones_notas_${paciente.id}`, JSON.stringify(actualizadas))
    setIdNotaEditando(null)
    setTextoNotaEditando('')
  }

  const handleSubirArchivo = (e, tipo) => {
    const files = Array.from(e.target.files)
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      url: URL.createObjectURL(file),
      nombre: file.name,
      fecha: new Date().toLocaleDateString('es-CL')
    }))
    if (tipo === 'foto') setFotos(prev => [...prev, ...newFiles])
    if (tipo === 'rx') setRadiografias(prev => [...prev, ...newFiles])
    if (tipo === 'consentimiento') setConsentimientos(prev => [...prev, ...newFiles])
  }

  const handleCambiarTipoPostOp = (tipo) => {
    setTipoPostOp(tipo)
    const encontrado = INDICACIONES_POST_OPERATORIAS.find(i => i.tipo === tipo)
    if (encontrado) setTextoPostOp(encontrado.texto)
  }

  const enviarWhatsAppPostOp = () => {
    let numeroTel = paciente?.telefono || ''
    numeroTel = numeroTel.replace(/\s+/g, '').replace('+', '').replace(/-/g, '')
    const textoMensaje = `Hola ${paciente.nombre}, te enviamos tus Indicaciones Postoperatorias (${tipoPostOp}) del ${userProfile?.nombreCompleto || 'Dr. Miguel Díaz'}:\n\n${textoPostOp}\n\nAnte cualquier duda o sangrado excesivo, comunícate con nosotros.`
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroTel}&text=${encodeURIComponent(textoMensaje)}`
    window.open(urlWhatsApp, '_blank')
  }

  const resultadoAnestesia = calcularTubosAnestesia(pesoPaciente, tipoAnestesicoCalc)
  const totalPresupuesto = itemsPresupuesto.reduce((acc, curr) => acc + curr.valor, 0)
  const totalAbonado = abonos.reduce((acc, curr) => acc + curr.monto, 0)
  const saldoPendiente = totalPresupuesto - totalAbonado

  const PERMANENTE_SUPERIOR = ['1.8', '1.7', '1.6', '1.5', '1.4', '1.3', '1.2', '1.1', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8']
  const PERMANENTE_INFERIOR = ['4.8', '4.7', '4.6', '4.5', '4.4', '4.3', '4.2', '4.1', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8']

  return (
    <div>
      <div className="flex justify-between items-center mb-4 print:hidden">
        <button onClick={alVolver} className="text-xs font-semibold text-gray-500 hover:text-black flex items-center gap-1">
          ← Volver a la lista de pacientes
        </button>

        <button
          onClick={() => alEliminarPaciente(paciente.id)}
          className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg"
        >
          🗑️ Eliminar Paciente
        </button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6 flex justify-between items-start print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{paciente.nombre}</h2>
            <button
              onClick={() => { setDatosPersonalesEdit({ ...paciente }); setMostrarEditarDatos(true); }}
              className="text-xs bg-white border border-gray-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-gray-100"
            >
              ✏️ Editar Datos
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs text-gray-600 mt-3">
            <p><span className="font-semibold text-gray-800">RUT:</span> {paciente.rut}</p>
            <p><span className="font-semibold text-gray-800">Edad:</span> {paciente.edad} años</p>
            <p><span className="font-semibold text-gray-800">Teléfono:</span> {paciente.telefono || 'N/I'}</p>
            <p><span className="font-semibold text-gray-800">Correo:</span> {paciente.email || 'N/I'}</p>
            <p><span className="font-semibold text-gray-800">Ocupación:</span> {paciente.ocupacion || 'N/I'}</p>
            <p><span className="font-semibold text-gray-800">Previsión:</span> {paciente.prevision || 'Particular'}</p>
            <p><span className="font-semibold text-gray-800">Presión Arterial:</span> {fichaData.presionArterial || 'No registrada'}</p>
            <p><span className="font-semibold text-gray-800">Contacto Emergencia:</span> {paciente.contactoEmergencia || 'N/I'}</p>
          </div>
        </div>

        <div className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-xl text-xs font-semibold">
          ⚠️ Alertas: {fichaData.alergias || 'Sin alergias registradas'}
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto print:hidden">
        {[
          'Ficha Clínica', 'Odontograma Anatómico', 'Odontograma Inicial', 'Odontograma Evolución',
          'Periodontograma', 'Endodoncia & Implantes', 'Odontopediatría', 'Diseño de Sonrisa (DSD)',
          'Plan de Tratamiento', 'Recetas Médicas', 'Indicaciones PostOp', 'Calculadora Anestesia',
          'Certificados', 'Consentimientos', 'Fotografías Clínicas', 'Radiografías'
        ].map(tab => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              tabActiva === tab ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {tabActiva === 'Ficha Clínica' && (
        <div className="space-y-6 print:hidden">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 text-xs text-gray-700 shadow-sm">
            <div className="border-b pb-2 flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Anamnesis y Signos Vitales</h3>
              <span className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">Guardado automático</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Presión Arterial (PA)</label>
                <input
                  type="text"
                  value={fichaData.presionArterial}
                  onChange={(e) => handleFichaChange('presionArterial', e.target.value)}
                  placeholder="Ej: 120/80 mmHg"
                  className="w-full p-2.5 rounded-lg border border-gray-300 font-semibold text-gray-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Riesgo Cariogénico</label>
                <select
                  value={fichaData.riesgoCariogenico}
                  onChange={(e) => handleFichaChange('riesgoCariogenico', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 bg-white"
                >
                  <option value="Bajo">Bajo Riesgo</option>
                  <option value="Medio">Medio Riesgo</option>
                  <option value="Alto">Alto Riesgo</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Diagnóstico Periodontal</label>
                <select
                  value={fichaData.riesgoPeriodontal}
                  onChange={(e) => handleFichaChange('riesgoPeriodontal', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 bg-white"
                >
                  <option value="Sano">Salud Periodontal</option>
                  <option value="Gingivitis">Gingivitis</option>
                  <option value="Periodontitis Leve">Periodontitis Leve</option>
                  <option value="Periodontitis Severa">Periodontitis Severa</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div className="relative">
                <label className="block font-semibold text-gray-600 mb-1">Diagnóstico Principal (Autocompletado CIE-10)</label>
                <textarea
                  rows="2"
                  value={fichaData.motivoConsulta}
                  onChange={(e) => handleFichaChange('motivoConsulta', e.target.value)}
                  placeholder="Escribe para buscar... Ej: Caries, Pulpitis, Gingivitis..."
                  className="w-full p-2.5 rounded-lg border border-gray-300"
                />
                {sugerenciasCie.length > 0 && (
                  <div className="absolute left-0 right-0 top-full bg-white border border-gray-300 rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto mt-1">
                    {sugerenciasCie.map((diag, idx) => (
                      <div
                        key={idx}
                        onClick={() => { handleFichaChange('motivoConsulta', diag); setSugerenciasCie([]); }}
                        className="p-2 hover:bg-gray-100 cursor-pointer font-bold text-gray-800 border-b border-gray-100 text-xs"
                      >
                        {diag}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-600 mb-1">Anamnesis Próxima</label>
                <textarea
                  rows="2"
                  value={fichaData.anamnesisProxima}
                  onChange={(e) => handleFichaChange('anamnesisProxima', e.target.value)}
                  placeholder="Ej: Paciente refiere molestias de 3 días de evolución..."
                  className="w-full p-2.5 rounded-lg border border-gray-300"
                />
              </div>
            </div>

            <h4 className="font-bold text-xs text-gray-800 border-b pt-2 pb-1 uppercase">Antecedentes Médicos (Anamnesis Remota)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-red-600 mb-1">Alergias (Medicamentos, Látex)</label>
                <input
                  type="text"
                  value={fichaData.alergias}
                  onChange={(e) => handleFichaChange('alergias', e.target.value)}
                  placeholder="Ej: Penicilina, AINEs, Ninguna"
                  className="w-full p-2.5 rounded-lg border border-red-200 bg-red-50/30 font-bold text-red-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Enfermedades Sistémicas / Crónicas</label>
                <input
                  type="text"
                  value={fichaData.enfermedades}
                  onChange={(e) => handleFichaChange('enfermedades', e.target.value)}
                  placeholder="Ej: Hipertensión, Diabetes, Cardiopatía"
                  className="w-full p-2.5 rounded-lg border border-gray-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Medicamentos Habituales</label>
                <input
                  type="text"
                  value={fichaData.medicamentos}
                  onChange={(e) => handleFichaChange('medicamentos', e.target.value)}
                  placeholder="Ej: Losartán 50mg, Metformina..."
                  className="w-full p-2.5 rounded-lg border border-gray-300"
                />
              </div>
            </div>

            <h4 className="font-bold text-xs text-gray-800 border-b pt-2 pb-1 uppercase">Examen Físico y Hábitos</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Examen Extraoral (ATM, Cuello, Ganglios)</label>
                <textarea
                  rows="2"
                  value={fichaData.examenExtraoral}
                  onChange={(e) => handleFichaChange('examenExtraoral', e.target.value)}
                  placeholder="Ej: Sin adenopatías palpables, ATM asintomática..."
                  className="w-full p-2.5 rounded-lg border border-gray-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Examen Intraoral (Mucosas, Lengua)</label>
                <textarea
                  rows="2"
                  value={fichaData.examenIntraoral}
                  onChange={(e) => handleFichaChange('examenIntraoral', e.target.value)}
                  placeholder="Ej: Mucosa yugular sana, gingivitis marginal leve..."
                  className="w-full p-2.5 rounded-lg border border-gray-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Hábitos (Fumador, Bruxismo)</label>
                <textarea
                  rows="2"
                  value={fichaData.habitos}
                  onChange={(e) => handleFichaChange('habitos', e.target.value)}
                  placeholder="Ej: Tabaquismo ocasional, bruxismo nocturno..."
                  className="w-full p-2.5 rounded-lg border border-gray-300"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 text-xs shadow-sm">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Bitácora de Atenciones / Ficha de Evolución Diaria</h3>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleDictadoVoz}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                    escuchandoVoz ? 'bg-red-600 text-white animate-pulse' : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  <span>🎙️</span> {escuchandoVoz ? 'Escuchando... (Haz clic para parar)' : 'Dictar por Voz'}
                </button>

                <div className="flex gap-1 overflow-x-auto">
                  {PLANTILLAS_EVOLUCION.map(p => (
                    <button
                      key={p.clave}
                      type="button"
                      onClick={() => handleConcatenarPlantillaNota(p.texto)}
                      className="bg-gray-100 hover:bg-black hover:text-white border px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all"
                    >
                      + {p.clave}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <form onSubmit={handleAgregarEvolucionNota} className="flex gap-2 relative">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={nuevaNota}
                  onChange={(e) => handleNotaInputChange(e.target.value)}
                  placeholder="Escribe, dicta por voz o presiona las frases rápidas de arriba para concatenarlas..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300"
                />

                {sugerenciasNota.length > 0 && (
                  <div className="absolute left-0 right-0 top-full bg-white border border-gray-300 rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto mt-1">
                    {sugerenciasNota.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleConcatenarPlantillaNota(item.texto)}
                        className="p-2.5 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                      >
                        <p className="font-bold text-gray-900">{item.clave}</p>
                        <p className="text-[10px] text-gray-500 truncate">{item.texto}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="bg-black text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800">
                + Agregar Nota
              </button>
            </form>

            <div className="space-y-2 mt-4">
              {evolucionesNotas.map(nota => (
                <div key={nota.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-start gap-4">
                  {idNotaEditando === nota.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={textoNotaEditando}
                        onChange={(e) => setTextoNotaEditando(e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-xs"
                      />
                      <button onClick={() => handleGuardarNotaEditada(nota.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold">Guardar</button>
                      <button onClick={() => setIdNotaEditando(null)} className="bg-gray-300 text-gray-800 px-3 py-1 rounded text-xs">Cancelar</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className="font-bold text-gray-800 block text-[11px]">{nota.fecha}</span>
                        <p className="text-gray-700 mt-1">{nota.texto}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleIniciarEditarNota(nota)} className="text-gray-500 hover:text-black font-semibold text-xs">✏️ Editar</button>
                        <button onClick={() => handleEliminarNota(nota.id)} className="text-red-500 hover:text-red-700 font-semibold text-xs">🗑️ Borrar</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {evolucionesNotas.length === 0 && (
                <p className="text-gray-400 text-center py-4">No hay evoluciones clínicas registradas todavía.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'Odontograma Anatómico' && (
        <div className="print:hidden">
          <OdontoAnatomicoModulo pacienteId={paciente.id} />
        </div>
      )}

      {tabActiva === 'Periodontograma' && (
        <div className="print:hidden">
          <PeriodontogramaModulo pacienteId={paciente.id} />
        </div>
      )}

      {tabActiva === 'Endodoncia & Implantes' && (
        <div className="print:hidden">
          <QuirurgicoModulo pacienteId={paciente.id} />
        </div>
      )}

      {tabActiva === 'Odontopediatría' && (
        <div className="print:hidden">
          <OdontopediatriaModulo pacienteId={paciente.id} />
        </div>
      )}

      {tabActiva === 'Diseño de Sonrisa (DSD)' && (
        <div className="print:hidden">
          <SmileDesignModulo pacienteId={paciente.id} />
        </div>
      )}

      {tabActiva === 'Indicaciones PostOp' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 print:hidden space-y-4 text-xs">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Generar Indicaciones Postoperatorias Impresas / WhatsApp</h3>
            
            <div className="flex gap-2 overflow-x-auto">
              {INDICACIONES_POST_OPERATORIAS.map(i => (
                <button
                  key={i.tipo}
                  onClick={() => handleCambiarTipoPostOp(i.tipo)}
                  className={`px-3 py-2 rounded-xl font-bold border transition-all ${
                    tipoPostOp === i.tipo ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {i.tipo}
                </button>
              ))}
            </div>

            <textarea
              rows="8"
              value={textoPostOp}
              onChange={(e) => setTextoPostOp(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 font-mono text-xs leading-relaxed"
            />

            <div className="flex gap-3">
              <button onClick={() => window.print()} className="bg-black text-white font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800">
                🖨️ Imprimir Hoja de Cuidados (PDF)
              </button>
              <button onClick={enviarWhatsAppPostOp} className="bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700">
                💬 Enviar por WhatsApp
              </button>
            </div>
          </div>

          <div className="hidden print:block bg-white border border-gray-200 rounded-2xl p-10 print:border-none print:p-0">
            <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez'}</h1>
                <p className="text-xs text-gray-600">{userProfile?.especialidad || 'Cirujano Dentista'} | RUT: {userProfile?.rut || 'N/I'}</p>
                <p className="text-xs text-gray-500">Consulta Odontológica</p>
              </div>
              <div className="text-right">
                <h2 className="text-base font-bold text-gray-800 uppercase">Cuidados Postoperatorios</h2>
                <p className="text-xs text-gray-500">Fecha: {new Date().toLocaleDateString('es-CL')}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-xs print:bg-white print:border">
              <p><span className="font-bold">Paciente:</span> {paciente.nombre} | RUT: {paciente.rut}</p>
              <p><span className="font-bold">Procedimiento:</span> {tipoPostOp}</p>
            </div>

            <div className="text-xs text-gray-800 whitespace-pre-line leading-relaxed p-4 border rounded-xl">
              {textoPostOp}
            </div>

            <div className="mt-20 pt-10 border-t border-gray-300 text-center">
              <div className="w-64 mx-auto border-t border-black pt-2">
                <p className="font-bold text-xs">{userProfile?.nombreCompleto}</p>
                <p className="text-[10px] text-gray-600">Firma y Timbre del Cirujano Dentista</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'Calculadora Anestesia' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 print:hidden space-y-6">
          <div className="border-b pb-3">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Calculadora de Dosis Máxima de Anestesia Local</h3>
            <p className="text-xs text-gray-500">Cálculo de seguridad de miligramos máximos y cantidad máxima de tubos por peso corporal.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Peso del Paciente (Kg)</label>
                <input
                  type="number"
                  value={pesoPaciente}
                  onChange={(e) => setPesoPaciente(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Tipo de Anestésico Local</label>
                <select
                  value={tipoAnestesicoCalc}
                  onChange={(e) => setTipoAnestesicoCalc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-semibold bg-white"
                >
                  <option value="lidocaina">Lidocaína 2% con Epinefrina (36 mg/tubo — Máx 4.4 mg/kg)</option>
                  <option value="mepivacaina">Mepivacaína 3% sin vasoconstrictor (54 mg/tubo — Máx 6.6 mg/kg)</option>
                  <option value="articaina">Articaína 4% con Epinefrina (72 mg/tubo — Máx 7.0 mg/kg)</option>
                  <option value="bupivacaina">Bupivacaína 0.5% con Epinefrina (9 mg/tubo — Máx 1.3 mg/kg)</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col justify-center text-center">
              <span className="text-xs uppercase font-bold text-blue-800 block mb-1">Límite de Seguridad Recomendado</span>
              <span className="text-3xl font-extrabold text-blue-900">{resultadoAnestesia.tubos} Tubos</span>
              <span className="text-xs font-semibold text-blue-700 mt-1">
                Dosis máxima absoluta: {resultadoAnestesia.mgMax} mg
              </span>
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'Odontograma Inicial' && (
        <div className="print:hidden">
          <OdontogramaModulo odontograma={odontogramaInicial} guardarOdontograma={guardarInicial} />
        </div>
      )}

      {tabActiva === 'Odontograma Evolución' && (
        <div className="print:hidden">
          <OdontogramaModulo odontograma={odontogramaEvolucion} guardarOdontograma={guardarEvolucion} esEvolucion={true} />
        </div>
      )}

      {tabActiva === 'Plan de Tratamiento' && (
        <div>
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
                  <option value="Fonasa">Fonasa</option>
                  <option value="Isapre">Isapre</option>
                  <option value="Empresa">Convenio Institucional / Empresa</option>
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
                <label className="block text-gray-600 mb-1 font-semibold">Seleccionar de tu Arancel</label>
                <select
                  value={prestacionSeleccionadaId}
                  onChange={(e) => handleSeleccionarPrestacionArancel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-semibold"
                >
                  <option value="">-- Buscar en catálogo de prestaciones --</option>
                  {prestacionesArancel.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.especialidad}] {p.nombre} — Base: ${p.precio.toLocaleString('es-CL')}
                    </option>
                  ))}
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

              <button type="submit" className="bg-black text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-800">
                + Agregar al Presupuesto
              </button>
            </form>

            {precioBaseOriginal > 0 && porcentajeDescuentoAplicado > 0 && (
              <div className="text-[11px] bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-200 flex justify-between items-center">
                <span>🏷️ Descuento por Convenio (<strong>{convenioAplicado}</strong>): -{porcentajeDescuentoAplicado}% aplicado al precio base.</span>
                <span>Precio Original: <del>${precioBaseOriginal.toLocaleString('es-CL')}</del> → Final: <strong>${parseInt(valorPrestacion).toLocaleString('es-CL')} CLP</strong></span>
              </div>
            )}
          </div>

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
                  className="px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Débito">Tarjeta de Débito</option>
                  <option value="Crédito">Tarjeta de Crédito</option>
                </select>
              </div>

              <button type="submit" className="bg-green-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-800">
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
                      <button onClick={() => handleEliminarAbono(a.id)} className="text-red-500 hover:text-red-700 font-bold ml-2">🗑️ Borrar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mb-4 print:hidden">
            <button onClick={() => window.print()} className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 shadow-sm">
              🖨️ Imprimir Presupuesto con Odontograma (PDF)
            </button>
          </div>

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

            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 print:bg-white print:border">
              <h4 className="text-[11px] font-bold text-gray-600 uppercase mb-3 text-center">Estado del Odontograma Inicial</h4>
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
                            className="bg-gray-100 border text-[11px] rounded px-2 py-0.5 font-semibold print:border-none print:bg-transparent"
                          >
                            <option value="Pendiente">🟡 Pendiente</option>
                            <option value="En Proceso">🔵 En Proceso</option>
                            <option value="Realizado">🟢 Realizado</option>
                          </select>
                        </td>
                        <td className="p-3 text-right font-medium text-gray-900">${item.valor.toLocaleString('es-CL')} CLP</td>
                        <td className="p-3 text-right print:hidden">
                          <button onClick={() => handleEliminarItemPresupuesto(item.id)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
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
                    <p className="font-bold text-xs">{userProfile?.nombreCompleto}</p>
                    <p className="text-[10px] text-gray-600">{userProfile?.especialidad}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tabActiva === 'Certificados' && (
        <div>
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl mb-6 print:hidden space-y-4 text-xs">
            <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider">Emitir Certificado / Comprobante Médico</h4>
            
            <div className="flex gap-4">
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="tipoCert"
                  checked={tipoCertificado === 'asistencia'}
                  onChange={() => setTipoCertificado('asistencia')}
                />
                Certificado de Asistencia a Consulta
              </label>
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="tipoCert"
                  checked={tipoCertificado === 'reposo'}
                  onChange={() => setTipoCertificado('reposo')}
                />
                Certificado de Reposo / Licencia Odontológica
              </label>
            </div>

            {tipoCertificado === 'asistencia' ? (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-gray-600 mb-1 font-semibold">Hora Inicio Atención</label>
                  <input
                    type="text"
                    value={horaInicioCert}
                    onChange={(e) => setHoraInicioCert(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 font-semibold">Hora Término Atención</label>
                  <input
                    type="text"
                    value={horaFinCert}
                    onChange={(e) => setHoraFinCert(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-gray-600 mb-1 font-semibold">Días de Reposo Indicados</label>
                  <input
                    type="number"
                    value={diasReposoCert}
                    onChange={(e) => setDiasReposoCert(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 font-semibold">Diagnóstico / Motivo del Reposo</label>
                  <input
                    type="text"
                    value={diagnosticoCert}
                    onChange={(e) => setDiagnosticoCert(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mb-4 print:hidden">
            <button onClick={() => window.print()} className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 shadow-sm">
              🖨️ Imprimir Certificado (PDF)
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-10 print:border-none print:p-0">
            <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez'}</h1>
                <p className="text-xs text-gray-600">{userProfile?.especialidad || 'Cirujano Dentista'} | RUT: {userProfile?.rut || 'N/I'}</p>
                <p className="text-xs text-gray-500">Consulta Odontológica</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-gray-800 uppercase">
                  {tipoCertificado === 'asistencia' ? 'Certificado de Asistencia' : 'Certificado Médico Odontológico'}
                </h2>
                <p className="text-xs text-gray-500">Fecha: {new Date().toLocaleDateString('es-CL')}</p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-gray-800 leading-relaxed py-6">
              <p>
                El profesional que suscribe certifica que don(ña) <strong className="text-gray-900">{paciente.nombre}</strong>, 
                RUT <strong className="text-gray-900">{paciente.rut}</strong>:
              </p>

              {tipoCertificado === 'asistencia' ? (
                <p className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-justify print:bg-white print:border">
                  Ha concurrido a atención clínica odontológica en esta consulta el día de hoy,{' '}
                  <strong>{new Date().toLocaleDateString('es-CL')}</strong>, desde las <strong>{horaInicioCert}</strong> hrs. 
                  hasta las <strong>{horaFinCert}</strong> hrs.
                </p>
              ) : (
                <p className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-justify print:bg-white print:border">
                  Requiere guardar reposo relativo por un período de <strong>{diasReposoCert} días</strong> a contar de esta fecha, 
                  debido a procedimiento odontológico / diagnóstico: <em>"{diagnosticoCert}"</em>.
                </p>
              )}

              <p className="text-xs text-gray-500 pt-4">
                Se extiende el presente certificado a solicitud del interesado para los fines que estime convenientes.
              </p>
            </div>

            <div className="hidden print:block mt-32 pt-10 border-t border-gray-300 text-center">
              <div className="w-64 mx-auto border-t border-black pt-2">
                <p className="font-bold text-xs">{userProfile?.nombreCompleto}</p>
                <p className="text-[10px] text-gray-600">Firma y Timbre Médico</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'Recetas Médicas' && (
        <div>
          <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl mb-6 print:hidden">
            <h4 className="font-bold text-xs text-gray-800 mb-3 uppercase tracking-wider">Emitir Nueva Receta Médica</h4>
            
            {alertaFarmaco && (
              <div className={`p-4 rounded-xl border mb-4 text-xs ${
                alertaFarmaco.tipo === 'critica' ? 'bg-red-100 border-red-300 text-red-900' : 'bg-yellow-100 border-yellow-300 text-yellow-900'
              }`}>
                <p className="font-bold text-sm">{alertaFarmaco.mensaje}</p>
                <p className="mt-1 font-semibold">{alertaFarmaco.sugerencia}</p>
              </div>
            )}

            <form onSubmit={handleAgregarReceta} className="space-y-3 text-xs relative">
              <div className="relative">
                <label className="block text-gray-600 mb-1 font-semibold">Fármaco / Medicamento</label>
                <input
                  type="text"
                  placeholder="Empieza a escribir... Ej: Amoxicilina, Ibuprofeno, Lidocaína..."
                  value={nuevaReceta.medicamento}
                  onChange={(e) => handleMedicamentoInputChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />

                {sugerenciasVademecum.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                    {sugerenciasVademecum.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSeleccionarSugerenciaVademecum(item)}
                        className="p-2.5 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-none"
                      >
                        <p className="font-bold text-gray-800">{item.medicamento}</p>
                        <p className="text-[10px] text-gray-500">{item.posologia}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-semibold">Posología e Indicaciones</label>
                <textarea
                  rows="2"
                  placeholder="Ej: Tomar 1 comprimido cada 8 horas por 7 días vía oral."
                  value={nuevaReceta.indicacion}
                  onChange={(e) => setNuevaReceta({ ...nuevaReceta, indicacion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>

              <button type="submit" className="bg-black text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-800">
                + Emitir Receta
              </button>
            </form>
          </div>

          <div className="flex justify-end mb-4 print:hidden">
            <button onClick={() => window.print()} className="bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 shadow-sm">
              🖨️ Imprimir Receta
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 print:border-none print:p-0">
            <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{userProfile?.nombreCompleto || 'Dr. Miguel Díaz Rodríguez'}</h1>
                <p className="text-xs text-gray-600">{userProfile?.especialidad || 'Cirujano Dentista'} | RUT: {userProfile?.rut || 'N/I'}</p>
                <p className="text-xs text-gray-500">Consulta Odontológica</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-gray-800 uppercase">Receta Médica</h2>
                <p className="text-xs text-gray-500">Fecha: {new Date().toLocaleDateString('es-CL')}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-xs grid grid-cols-2 gap-2 print:bg-white print:border">
              <p><span className="font-bold">Paciente:</span> {paciente.nombre}</p>
              <p><span className="font-bold">RUT:</span> {paciente.rut}</p>
            </div>

            <div className="space-y-4">
              {recetas.map((r, i) => (
                <div key={r.id} className="p-4 border rounded-xl bg-gray-50 print:bg-white print:border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-sm text-gray-900 block">{i + 1}. {r.medicamento}</span>
                      <p className="text-xs text-gray-700 mt-1"><span className="font-semibold">Indicación:</span> {r.indicacion}</p>
                    </div>
                    <button onClick={() => handleEliminarReceta(r.id)} className="text-red-500 font-bold print:hidden">✕</button>
                  </div>
                </div>
              ))}
              {recetas.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No hay recetas prescritas para este paciente.</p>}
            </div>

            <div className="hidden print:block mt-24 pt-10 border-t border-gray-300 text-center">
              <div className="w-64 mx-auto border-t border-black pt-2">
                <p className="font-bold text-xs">{userProfile?.nombreCompleto}</p>
                <p className="text-[10px] text-gray-600">Firma y Timbre Médico</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'Consentimientos' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 print:hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Consentimientos Informados Firmados</h3>
              <p className="text-xs text-gray-500">Carga documentos firmados en formato PDF o imagen.</p>
            </div>
            <label className="bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
              📄 Adjuntar Consentimiento
              <input 
                type="file" 
                multiple 
                accept="image/*,.pdf" 
                onChange={(e) => handleSubirArchivo(e, 'consentimiento')} 
                className="hidden" 
              />
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {consentimientos.map(doc => (
              <div key={doc.id} className="border rounded-xl p-3 bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-800 truncate max-w-[150px]">{doc.nombre}</p>
                  <p className="text-[10px] text-gray-400">{doc.fecha}</p>
                </div>
                <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">Adjunto ✓</span>
              </div>
            ))}
          </div>

          {consentimientos.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">No hay consentimientos informados cargados todavía.</p>
          )}
        </div>
      )}

      {(tabActiva === 'Fotografías Clínicas' || tabActiva === 'Radiografías') && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 print:hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-sm text-gray-900">{tabActiva}</h3>
            <label className="bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
              📷 Cargar Archivos
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={(e) => handleSubirArchivo(e, tabActiva === 'Fotografías Clínicas' ? 'foto' : 'rx')} 
                className="hidden" 
              />
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(tabActiva === 'Fotografías Clínicas' ? fotos : radiografias).map(img => (
              <div key={img.id} className="border rounded-xl overflow-hidden bg-gray-50 p-2">
                <img src={img.url} alt={img.nombre} className="w-full h-32 object-cover rounded-lg mb-2" />
                <p className="text-[10px] font-semibold text-gray-700 truncate">{img.nombre}</p>
                <p className="text-[9px] text-gray-400">{img.fecha}</p>
              </div>
            ))}
          </div>

          {(tabActiva === 'Fotografías Clínicas' ? fotos : radiografias).length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">No hay imágenes cargadas para este paciente.</p>
          )}
        </div>
      )}

      {mostrarEditarDatos && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Editar Datos Personales de {paciente.nombre}</h3>
              <button onClick={() => setMostrarEditarDatos(false)} className="text-gray-400 hover:text-black font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleGuardarDatosPersonales} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={datosPersonalesEdit.nombre || ''}
                    onChange={(e) => setDatosPersonalesEdit({ ...datosPersonalesEdit, nombre: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">RUT</label>
                  <input
                    type="text"
                    required
                    value={datosPersonalesEdit.rut || ''}
                    onChange={(e) => setDatosPersonalesEdit({ ...datosPersonalesEdit, rut: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Edad</label>
                  <input
                    type="number"
                    value={datosPersonalesEdit.edad || ''}
                    onChange={(e) => setDatosPersonalesEdit({ ...datosPersonalesEdit, edad: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={datosPersonalesEdit.telefono || ''}
                    onChange={(e) => setDatosPersonalesEdit({ ...datosPersonalesEdit, telefono: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={datosPersonalesEdit.email || ''}
                    onChange={(e) => setDatosPersonalesEdit({ ...datosPersonalesEdit, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Ocupación</label>
                  <input
                    type="text"
                    value={datosPersonalesEdit.ocupacion || ''}
                    onChange={(e) => setDatosPersonalesEdit({ ...datosPersonalesEdit, ocupacion: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Dirección / Comuna</label>
                  <input
                    type="text"
                    value={datosPersonalesEdit.direccion || ''}
                    onChange={(e) => setDatosPersonalesEdit({ ...datosPersonalesEdit, direccion: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 uppercase mb-1">Previsión</label>
                  <select
                    value={datosPersonalesEdit.prevision || 'Fonasa'}
                    onChange={(e) => setDatosPersonalesEdit({ ...datosPersonalesEdit, prevision: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
                  >
                    <option value="Fonasa">Fonasa</option>
                    <option value="Isapre">Isapre</option>
                    <option value="Particular">Particular</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-600 uppercase mb-1">Contacto de Emergencia</label>
                <input
                  type="text"
                  value={datosPersonalesEdit.contactoEmergencia || ''}
                  onChange={(e) => setDatosPersonalesEdit({ ...datosPersonalesEdit, contactoEmergencia: e.target.value })}
                  placeholder="Ej: María Pérez +56 9 1111 2222"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarEditarDatos(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-black text-white py-2.5 rounded-xl font-semibold hover:bg-gray-800"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}