import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../services/supabaseClient'
import { certificadosStorageService } from '../services/certificadosStorageService'
import {
  eliminarDefinitivo,
  restaurarCertificado,
  vaciarPapelera
} from '../services/papeleraCertificadosService'
import { createLogger } from '../../../services/logger'

const log = createLogger('usePapeleraCertificados')

/**
 * Hook que encapsula la lógica de papelera de certificados (M3).
 *
 * SOLUCIÓN DEFINITIVA: NO recargar desde storage después de operaciones.
 * El estado local es la fuente única de verdad. Solo persistimos en
 * storage sin sobrescribir el estado local.
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

  const moverAPapelera = async (certId, motivo = 'Movido a papelera') => {
    console.log('[TRACE-HOOK] moverAPapelera: certId =', certId)
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
    
    console.log('[TRACE-HOOK] setCertificados: actualizados.length =', actualizados.length)
    // CRÍTICO: actualizar estado local PRIMERO
    setCertificados(actualizados)
    
    // CRÍTICO: persistir en storage SIN esperar Supabase (fire-and-forget)
    // NO llamar recargarDesdeStorage() porque sobrescribe con datos viejos
    certificadosStorageService.guardarCertificados(pacienteId, actualizados)
      .catch(err => log.warn('Error persistiendo:', err))
    
    return true
  }

  const restaurar = async (certId) => {
    const ok = await restaurarCertificado(pacienteId, certId)
    if (ok) {
      // Construir lista localmente (NO leer de storage que puede estar stale)
      const actualizados = certificados.map(c =>
        String(c.id) === String(certId)
          ? { ...c, eliminadoAt: null, eliminadoPor: null, eliminadoMotivo: null }
          : c
      )
      setCertificados(actualizados)
    }
    return ok
  }

  const eliminarDef = async (certId) => {
    const ok = await eliminarDefinitivo(pacienteId, certId)
    if (ok) {
      // Filtrar directamente usando certificados actual
      const actualizados = certificados.filter(c => String(c.id) !== String(certId))
      setCertificados(actualizados)
    }
    return ok
  }

  const vaciarPapeleraLocal = async () => {
    const eliminados = certificados.filter(c => c.eliminadoAt)
    if (eliminados.length === 0) return 0
    
    // Llamar al service para cada uno (borra R2 + Supabase + localStorage)
    const resultados = await Promise.all(
      eliminados.map(c => eliminarDefinitivo(pacienteId, c.id))
    )
    
    const exitosos = resultados.filter(Boolean).length
    if (exitosos > 0) {
      // Actualizar estado local eliminando todos los que estaban en papelera
      const actualizados = certificados.filter(c => !c.eliminadoAt)
      setCertificados(actualizados)
    }
    
    return exitosos
  }

  return {
    papeleraAbierta,
    abrirPapelera: () => setPapeleraAbierta(true),
    cerrarPapelera: () => setPapeleraAbierta(false),
    certificadosActivos,
    hayEliminados,
    moverAPapelera,
    restaurar,
    eliminarDefinitivo: eliminarDef,
    vaciarPapelera: vaciarPapeleraLocal
  }
}
