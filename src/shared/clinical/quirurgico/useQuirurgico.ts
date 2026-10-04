import { useState, useEffect, useCallback } from 'react'
import {
  quirurgicoStorageService,
  type ImplanteItem,
  type EndodonciaItem,
  type ConductoItem
} from './quirurgicoStorageService'

export type NuevoImplanteInput = Partial<ImplanteItem> & {
  pieza?: string
  marca?: string
  diametro?: string
  longitud?: string
  torque?: number | null
  isq?: number | null
  notas?: string
  [key: string]: unknown
}

export type NuevaEndodonciaInput = Partial<EndodonciaItem> & {
  pieza?: string
  conductos?: number | string | ConductoItem[]
  longitudConducto?: string
  tecnica?: string
  obturacion?: string
  notas?: string
  [key: string]: unknown
}

export interface UseQuirurgicoReturn {
  implantes: ImplanteItem[]
  endodoncias: EndodonciaItem[]
  agregarImplante: (nuevoImplante: NuevoImplanteInput) => void
  eliminarImplante: (id: number | string) => void
  agregarEndodoncia: (nuevaEndodoncia: NuevaEndodonciaInput) => void
  eliminarEndodoncia: (id: number | string) => void
}

export const useQuirurgico = (
  pacienteId: string | number | null | undefined
): UseQuirurgicoReturn => {
  const [implantes, setImplantes] = useState<ImplanteItem[]>(() => {
    try {
      return quirurgicoStorageService.obtenerImplantesDePaciente<ImplanteItem[]>(
        pacienteId,
        []
      )
    } catch {
      return []
    }
  })

  const [endodoncias, setEndodoncias] = useState<EndodonciaItem[]>(() => {
    try {
      return quirurgicoStorageService.obtenerEndodonciasDePaciente<
        EndodonciaItem[]
      >(pacienteId, [])
    } catch {
      return []
    }
  })

  useEffect(() => {
    void quirurgicoStorageService.guardarImplantesDePaciente(
      pacienteId,
      implantes
    )
  }, [implantes, pacienteId])

  useEffect(() => {
    void quirurgicoStorageService.guardarEndodonciasDePaciente(
      pacienteId,
      endodoncias
    )
  }, [endodoncias, pacienteId])

  const agregarImplante = useCallback((nuevoImplante: NuevoImplanteInput) => {
    setImplantes(prev => [
      {
        id: Date.now(),
        fecha: new Date().toLocaleDateString('es-CL'),
        ...nuevoImplante
      },
      ...prev
    ])
  }, [])

  const eliminarImplante = useCallback((id: number | string) => {
    setImplantes(prev => prev.filter(item => item.id !== id))
  }, [])

  const agregarEndodoncia = useCallback(
    (nuevaEndodoncia: NuevaEndodonciaInput) => {
      setEndodoncias(prev => [
        {
          id: Date.now(),
          fecha: new Date().toLocaleDateString('es-CL'),
          ...nuevaEndodoncia
        },
        ...prev
      ])
    },
    []
  )

  const eliminarEndodoncia = useCallback((id: number | string) => {
    setEndodoncias(prev => prev.filter(item => item.id !== id))
  }, [])

  return {
    implantes,
    endodoncias,
    agregarImplante,
    eliminarImplante,
    agregarEndodoncia,
    eliminarEndodoncia
  }
}
