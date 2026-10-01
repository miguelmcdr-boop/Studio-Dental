/**
 * useNavegacionClinica — Hook de navegación entre pacientes (F7-26)
 *
 * Permite navegar entre pacientes con botones anterior/siguiente
 * dentro de la ficha clínica, sin necesidad de volver al directorio.
 *
 * Contrato:
 * - Usa SIEMPRE la lista completa de pacientes del store (no la filtrada
 *   del DirectorioPacientes) para que navegación ← → recorra todos los
 *   pacientes disponibles.
 * - El orden de navegación es alfabético por nombre (predecible).
 * - El hook es idempotente: si el paciente actual no está en la lista
 *   (ej: paciente recién eliminado), retorna estado "fuera de rango".
 * - F7-26: Cada vez que pacienteActual cambia, se agrega al historial
 *   de pacientes recientes (sesionStore) para acceso rápido desde
 *   CommandPalette.
 *
 * Uso:
 *   const nav = useNavegacionClinica(pacienteSeleccionado, setPacienteSeleccionado)
 *   // nav.siguiente() → actualiza el paciente en el store
 *   // nav.anterior() → actualiza el paciente en el store
 *   // nav.indiceActual, nav.total → indicador "X de Y"
 *
 * Integración con App.jsx:
 *   El hook se instancia en App.jsx (donde vive pacienteSeleccionado)
 *   y se pasan las props de navegación a FichaPacienteModulo.
 */
import React, { useMemo, useCallback, useEffect } from 'react'
import { usePacientesStore } from '../../../store/pacientesStore'
import { useSesionStore } from '../../../store/sesionStore'

export const useNavegacionClinica = (pacienteActual, alCambiarPaciente) => {
  const pacientes = usePacientesStore((state) => state.pacientes)

  // Lista ordenada alfabéticamente por nombre (navegación predecible)
  const pacientesOrdenados = useMemo(
    () => [...pacientes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [pacientes]
  )

  const indiceActual = useMemo(() => {
    if (!pacienteActual) return -1
    return pacientesOrdenados.findIndex((p) => p.id === pacienteActual.id)
  }, [pacientesOrdenados, pacienteActual])

  const total = pacientesOrdenados.length
  const hayAnterior = indiceActual > 0
  const haySiguiente = indiceActual >= 0 && indiceActual < total - 1

  const irA = useCallback(
    (indice) => {
      if (indice < 0 || indice >= total) return
      const nuevo = pacientesOrdenados[indice]
      if (nuevo && alCambiarPaciente) {
        alCambiarPaciente(nuevo)
      }
    },
    [pacientesOrdenados, total, alCambiarPaciente]
  )

  const anterior = useCallback(() => {
    if (hayAnterior) irA(indiceActual - 1)
  }, [hayAnterior, irA, indiceActual])

  const siguiente = useCallback(() => {
    if (haySiguiente) irA(indiceActual + 1)
  }, [haySiguiente, irA, indiceActual])

  // F7-26: Cuando el paciente actual cambia, agregarlo al historial de recientes.
  // Esto cubre tanto navegación manual (← →) como selección desde Directorio/CommandPalette.
  // El método agregarPacienteReciente es idempotente (no duplica).
  useEffect(() => {
    if (pacienteActual?.id) {
      useSesionStore.getState().agregarPacienteReciente(pacienteActual)
    }
  }, [pacienteActual?.id])

  return {
    indiceActual,
    total,
    hayAnterior,
    haySiguiente,
    anterior,
    siguiente,
    irA,
    pacienteActual,
    listaOrdenada: pacientesOrdenados,
  }
}
