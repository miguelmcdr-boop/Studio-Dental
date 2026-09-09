import React, { memo, useState } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { EQUIPOS_AUTOCLAVE, PROGRAMAS_ESTERILIZACION, INDICADORES_QUIMICOS, INDICADORES_BIOLOGICOS } from '../constants/esterilizacionConstants'
import { generarCodigoLoteEsterilizacion } from '../utils/esterilizacionCalculations'

export const ModalNuevaCarga = memo(({ userProfile, alGuardar, alCerrar }) => {
  const [equipo, setEquipo] = useState(EQUIPOS_AUTOCLAVE[0])
  const [programaId, setProgramaId] = useState(PROGRAMAS_ESTERILIZACION[0].id)
  const [temperatura, setTemperatura] = useState(134)
  const [presion, setPresion] = useState(2.1)
  const [tiempoMinutos, setTiempoMinutos] = useState(4)
  const [indicadorQuimico, setIndicadorQuimico] = useState(INDICADORES_QUIMICOS[0])
  const [indicadorBiologico, setIndicadorBiologico] = useState(INDICADORES_BIOLOGICOS[0])
  const [contenido, setContenido] = useState('')
  const [responsable, setResponsable] = useState(userProfile?.nombreCompleto || 'Operador Clínico')

  const handleProgramaChange = (pId) => {
    setProgramaId(pId)
    const prog = PROGRAMAS_ESTERILIZACION.find(p => p.id === pId)
    if (prog) {
      setTemperatura(prog.tempEsperada)
      setTiempoMinutos(prog.tiempoEsperado)
      setPresion(prog.presionEsperada)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!contenido.trim()) {
      alert('Ingresa el contenido o paquetes esterilizados en la carga.')
      return
    }

    const esConforme = !indicadorQuimico.includes('Fallo') && !indicadorBiologico.includes('Positivo')

    const nuevaCarga = {
      id: Date.now(),
      lote: generarCodigoLoteEsterilizacion(),
      equipo,
      programa: PROGRAMAS_ESTERILIZACION.find(p => p.id === programaId)?.nombre || 'Programa Personalizado',
      fecha: new Date().toLocaleDateString('es-CL'),
      hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      temperatura: parseFloat(temperatura),
      presion: parseFloat(presion),
      tiempoMinutos: parseInt(tiempoMinutos),
      responsable,
      indicadorQuimico,
      indicadorBiologico,
      contenido,
      estado: esConforme ? 'Conforme' : 'Rechazado'
    }

    alGuardar(nuevaCarga)
    alCerrar()
  }

  return (
    <Modal
      isOpen={true}
      onClose={alCerrar}
      title="Registrar Nuevo Ciclo de Autoclave"
      size="lg"
    >

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Equipo Autoclave *</label>
            <select
              value={equipo}
              onChange={(e) => setEquipo(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-bold"
            >
              {EQUIPOS_AUTOCLAVE.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Programa Seleccionado</label>
            <select
              value={programaId}
              onChange={(e) => handleProgramaChange(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 bg-white font-semibold"
            >
              {PROGRAMAS_ESTERILIZACION.map(pr => <option key={pr.id} value={pr.id}>{pr.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Temp (°C)"
              type="number"
              value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)}
            />
            <Input
              label="Presión (Bar)"
              type="number"
              step="0.1"
              value={presion}
              onChange={(e) => setPresion(e.target.value)}
            />
            <Input
              label="Tiempo (min)"
              type="number"
              value={tiempoMinutos}
              onChange={(e) => setTiempoMinutos(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Contenido de la Carga / Instrumental *</label>
            <textarea
              rows="2"
              placeholder="Ej: 5 Cajas Cirugía, 8 Kits Exploración, 4 Mangos Bisturí..."
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Indicador Químico</label>
              <select
                value={indicadorQuimico}
                onChange={(e) => setIndicadorQuimico(e.target.value)}
                className="w-full p-2 rounded-xl border border-gray-300 bg-white"
              >
                {INDICADORES_QUIMICOS.map(iq => <option key={iq} value={iq}>{iq}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Indicador Biológico</label>
              <select
                value={indicadorBiologico}
                onChange={(e) => setIndicadorBiologico(e.target.value)}
                className="w-full p-2 rounded-xl border border-gray-300 bg-white"
              >
                {INDICADORES_BIOLOGICOS.map(ib => <option key={ib} value={ib}>{ib}</option>)}
              </select>
            </div>
          </div>

          <Input
            label="Responsable del Ciclo"
            type="text"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
          />

          <div className="flex gap-2 pt-3">
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
              Guardar Carga
            </Button>
          </div>
        </form>
    </Modal>
  )
})

ModalNuevaCarga.displayName = 'ModalNuevaCarga'