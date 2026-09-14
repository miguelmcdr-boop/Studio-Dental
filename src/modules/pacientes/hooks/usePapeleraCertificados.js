import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../services/supabaseClient'
import { certificadosStorageService } from '../services/certificadosStorageService'
import {
  eliminarDefinitivo,
  restaurarCertificado
} from '../services/papeleraCertificadosService'
import { createLogger } from '../../../services/logger'

const log = createLogger('usePapeleraCertificados')

/**
 * Hook que encapsula la lógica de papelera de certificados (M3).
 *
 * FIX CRÍTICO: Todas las operaciones recargan desde storage después
 * para mantener el estado del padre sincronizado.
 */
export const usePapeleraCertificados = (pacienteId, certificados, setCertificados) => {
  const [papeleraAbierta, setPapeleraAbierta] = useState(false)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    let activo = true
    supabase.auth.getUser().then(({ data }) => {
      if (activo && data?.user?.id) setUserId(data.user.id)
    }).catch(e => log.warn('No se pudo obtener user.id:', e.message))
    return () => { activo = false }
  }, [])

  const certificadosActivos = useMemo(() => {
    if (!Array.isArray(certificados)) return []
    return certificados.filter(c => !c.eliminadoAt)
  }, [certificados])

  const hayEliminados = useMemo(() => {
    if (!Array.isArray(certificados)) return false
    return certificados.some(c => c.eliminadoAt)
  }, [certificados])

  /**
   * Recarga certificados desde storage y actualiza estado del padre
   */
  const recargarDesdeStorage = () => {
    if (!pacienteId) return
    const recargados = certificadosStorageService.obtenerCertificados(pacienteId, [])
    setCertificados(recargados)
  }

  const moverAPapelera = async (certId, motivo = 'Movido a papelera') => {
    if (!Array.isArray(certificados) || !pacienteId) return false

    const actualizados = certificados.map(c =>
      String(c.id) === String(certId)
        ? {
            ...c,
            eliminadoAt: new Date().toISOString(),
            eliminadoPor: userId,
            eliminadoMotivo: motivo
          }
        : c
    )
    setCertificados(actualizados)
    await certificadosStorageService.guardarCertificados(pacienteId, actualizados)
    
    // CRÍTICO: recargar desde storage para sincronizar estado
    recargarDesdeStorage()
    
    return true
  }

  const restaurar = async (certId) => {
    const ok = await restaurarCertificado(pacienteId, certId)
    if (ok) {
      // CRÍTICO: recargar desde storage
      recargarDesdeStorage()
    }
    return ok
  }

  const eliminarDef = async (certId) => {
    const ok = await eliminarDefinitivo(pacienteId, certId)
    if (ok) {
      // CRÍTICO: recargar desde storage
      recargarDesdeStorage()
    }
    return ok
  }

  return {
    papeleraAbierta,
    abrirPapelera: () => setPapeleraAbierta(true),
    cerrarPapelera: () => setPapeleraAbierta(false),
    certificadosActivos,
    hayEliminados,
    moverAPapelera,
    restaurar,
    eliminarDefinitivo: eliminarDef
  }
}
