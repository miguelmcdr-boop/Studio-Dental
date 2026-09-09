/**
 * Tests — dialogStore (F10-C3.1)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useDialogStore } from './dialogStore'

describe('dialogStore (F10-C3.1)', () => {
  beforeEach(() => {
    // Resetear estado del store antes de cada test
    useDialogStore.setState({ dialog: null })
  })

  it('inicia con dialog en null', () => {
    const state = useDialogStore.getState()
    expect(state.dialog).toBeNull()
  })

  it('openDialog establece el diálogo en el store', async () => {
    const { openDialog } = useDialogStore.getState()

    // No esperar la promesa todavía (el diálogo está abierto)
    const promise = openDialog({
      type: 'confirm',
      title: 'Test',
      description: 'Test description',
    })

    const state = useDialogStore.getState()
    expect(state.dialog).not.toBeNull()
    expect(state.dialog.title).toBe('Test')
    expect(state.dialog.type).toBe('confirm')

    // Resolver para no dejar Promise pendiente
    state.closeDialog(false)
    await promise
  })

  it('closeDialog limpia el diálogo y resuelve la Promise', async () => {
    const { openDialog, closeDialog } = useDialogStore.getState()

    const promise = openDialog({
      type: 'confirm',
      title: 'Test',
    })

    closeDialog(true)

    const result = await promise
    expect(result).toBe(true)

    const state = useDialogStore.getState()
    expect(state.dialog).toBeNull()
  })

  it('closeDialog con false resuelve Promise con false', async () => {
    const { openDialog, closeDialog } = useDialogStore.getState()

    const promise = openDialog({ type: 'confirm', title: 'Test' })
    closeDialog(false)

    const result = await promise
    expect(result).toBe(false)
  })

  it('cada openDialog tiene ID único', () => {
    const { openDialog } = useDialogStore.getState()

    const p1 = openDialog({ type: 'confirm', title: 'T1' })
    const id1 = useDialogStore.getState().dialog.id

    useDialogStore.getState().closeDialog(false)

    const p2 = openDialog({ type: 'confirm', title: 'T2' })
    const id2 = useDialogStore.getState().dialog.id

    expect(id1).not.toBe(id2)

    useDialogStore.getState().closeDialog(false)

    return Promise.all([p1, p2])
  })
})
