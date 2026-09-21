/**
 * Tests — useAppDialog (F10-C3.1)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppDialog } from './useAppDialog'
import { useDialogStore } from '../store/dialogStore'

describe('useAppDialog (F10-C3.1)', () => {
  beforeEach(() => {
    useDialogStore.setState({ dialog: null })
  })

  it('confirm abre un diálogo tipo confirm en el store', () => {
    const { result } = renderHook(() => useAppDialog())

    act(() => {
      result.current.confirm({
        title: '¿Eliminar?',
        description: '¿Estás seguro?',
        variant: 'danger',
      })
    })

    const state = useDialogStore.getState()
    expect(state.dialog).not.toBeNull()
    expect(state.dialog.type).toBe('confirm')
    expect(state.dialog.title).toBe('¿Eliminar?')
    expect(state.dialog.variant).toBe('danger')

    state.closeDialog(false)
  })

  it('alert abre un diálogo tipo alert en el store', () => {
    const { result } = renderHook(() => useAppDialog())

    act(() => {
      result.current.alert({
        title: 'Éxito',
        description: 'Guardado correctamente',
        variant: 'success',
      })
    })

    const state = useDialogStore.getState()
    expect(state.dialog).not.toBeNull()
    expect(state.dialog.type).toBe('alert')
    expect(state.dialog.variant).toBe('success')

    state.closeDialog(undefined)
  })

  it('confirm usa valores por defecto si no se especifican', () => {
    const { result } = renderHook(() => useAppDialog())

    act(() => {
      result.current.confirm({ title: 'Test' })
    })

    const state = useDialogStore.getState()
    expect(state.dialog.variant).toBe('warning')
    expect(state.dialog.confirmText).toBe('Confirmar')
    expect(state.dialog.cancelText).toBe('Cancelar')

    state.closeDialog(false)
  })

  it('alert usa "Entendido" como texto por defecto', () => {
    const { result } = renderHook(() => useAppDialog())

    act(() => {
      result.current.alert({ title: 'Test' })
    })

    const state = useDialogStore.getState()
    expect(state.dialog.confirmText).toBe('Entendido')
    expect(state.dialog.variant).toBe('info')

    state.closeDialog(undefined)
  })
})
