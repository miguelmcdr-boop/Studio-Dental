/**
 * ModalNuevoBloqueo v2 — Modal de bloqueo de horario (F10-C2.5)
 *
 * Migración al Design System v2:
 * - Iconos lucide en botones (Ban) y selects de box (Building, Armchair)
 * - Emojis de motivos (🍱 🛠️ 🎓 🚨) se mantienen en <option> (son contenido, no iconos UI)
 *
 * Pendiente C3: migrar alert() a <ConfirmDialog>
 *
 * Contratos: API de props sin cambios, mensaje de alert() preservado.
 */
import React, { memo, useState } from 'react'
import { Ban, Building, Armchair } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { useAppDialog } from '../../../hooks/useAppDialog'
import { CustomSelect } from '../../../components/ui/CustomSelect'
import { Utensils, Wrench, GraduationCap, AlertTriangle } from 'lucide-react'
import { TIPOS_BLOQUEO_AGENDA, SILLONES_DENTALES } from '../constants/agendaConstants'
import { obtenerFechaLocalISO } from '../../../utils/dateUtils'
import { detectarConflictoBloqueo } from '../utils/agendaConflictos'


const MOTIVOS_BLOQUEO = [
  { value: '🍱 Horario de Almuerzo', label: 'Horario de Almuerzo', icon: Utensils },
  { value: '🛠️ Mantenimiento Técnico', label: 'Mantenimiento Técnico de Box', icon: Wrench },
  { value: '🎓 Capacitación / Evento', label: 'Capacitación / Evento Clínico', icon: GraduationCap },
  { value: '🚨 Ausencia / Urgencia', label: 'Ausencia del Profesional', icon: AlertTriangle },
]

export const ModalNuevoBloqueo = memo(({ fechaPredeterminada, alGuardar, alCerrar, citasExistentes = [] }) => {
  const { alert: dialogAlert } = useAppDialog()
  const [form, setForm] = useState({
    motivoBloqueo: '🍱 Horario de Almuerzo',
    fecha: fechaPredeterminada || obtenerFechaLocalISO(),
    horaInicio: '13:00',
    horaFin: '14:00',
    boxAsignado: 'Todos los Boxes',
    observaciones: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (form.horaInicio >= form.horaFin) {
      await dialogAlert({
        title: 'Horario inválido',
        description: 'La hora de fin debe ser posterior a la hora de inicio.',
        variant: 'warning',
        confirmText: 'Entendido'
      })
      return
    }

    // Validar conflicto con citas/bloqueos existentes
    const { hayConflicto, citasConflicto } = detectarConflictoBloqueo(
      {
        fecha: form.fecha,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        boxAsignado: form.boxAsignado,
      },
      citasExistentes
    )

    if (hayConflicto) {
      const descripcion = citasConflicto
        .map(c => {
          const label = c.esBloqueo
            ? `Bloqueo: ${c.motivoBloqueo || 'Sin motivo'}`
            : `Cita: ${c.pacienteNombre || c.trataMiento || 'Sin paciente'}`
          return `• ${label} (${c.horaInicio} - ${c.horaFin}, ${c.boxAsignado || 'Box'})`
        })
        .join('\n')

      await dialogAlert({
        title: 'Conflicto de horario',
        description: `El bloqueo se superpone con ${citasConflicto.length === 1 ? 'una actividad existente' : `${citasConflicto.length} actividades existentes`}:\n${descripcion}`,
        variant: 'warning',
        confirmText: 'Entendido'
      })
      return
    }

    alGuardar({
      id: Date.now(),
      esBloqueo: true,
      fecha: form.fecha,
      motivoBloqueo: form.motivoBloqueo,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      boxAsignado: form.boxAsignado,
      observaciones: form.observaciones,
      estado: 'Bloqueado'
    })
  }

  return (
    <Modal isOpen={true} onClose={alCerrar} title="Añadir bloqueo / mantenimiento" size="md">
      <p className="text-xs text-graphite-500 dark:text-graphite-400 mb-4">
        Reserva franjas horarias no disponibles para atención.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <CustomSelect
            label="Motivo del Bloqueo"
            options={MOTIVOS_BLOQUEO}
            value={form.motivoBloqueo}
            onChange={(value) => setForm({ ...form, motivoBloqueo: value })}
          />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Fecha"
            type="date"
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            required
          />

          <div>
            <label className="font-semibold text-graphite-700 dark:text-graphite-300 block mb-1">
              Box / Sillón
            </label>
            <select
              value={form.boxAsignado}
              onChange={(e) => setForm({ ...form, boxAsignado: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-graphite-300 dark:border-graphite-600 font-semibold bg-graphite-50 dark:bg-graphite-900 focus:bg-white dark:focus:bg-graphite-800 dark:text-graphite-100"
            >
              <option value="Todos los Boxes">Todos los Boxes</option>
              {SILLONES_DENTALES.map(s => (
                <option key={s.id} value={s.nombre}>{s.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Hora Inicio"
            type="time"
            value={form.horaInicio}
            onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
            required
          />

          <Input
            label="Hora Fin"
            type="time"
            value={form.horaFin}
            onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
            required
          />
        </div>

        <Input
          label="Notas / Observaciones (Opcional)"
          type="text"
          value={form.observaciones}
          onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
          placeholder="Ej. Revisión anual de compresor dental"
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-graphite-100 dark:border-graphite-700">
          <Button type="button" onClick={alCerrar} variant="ghost">
            Cancelar
          </Button>
          <Button type="submit" variant="danger" icon={Ban}>
            Bloquear horario
          </Button>
        </div>
      </form>
    </Modal>
  )
})

ModalNuevoBloqueo.displayName = 'ModalNuevoBloqueo'
