import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog z-index (F10-C3.3 fix)', () => {
  it('renderiza con z-[60] para estar sobre modales normales', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test"
        description="Test description"
        variant="warning"
        confirmText="OK"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )

    const overlay = screen.getByRole('presentation')
    expect(overlay.className).toContain('z-[60]')
    expect(overlay.className).not.toContain('z-50')
  })
})
