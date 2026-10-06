import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeSwitcher } from './ThemeSwitcher'
import { useSidebarStore } from '../../app/stores/useSidebarStore'

describe('ThemeSwitcher (Blueprint 02)', () => {
  beforeEach(() => {
    useSidebarStore.setState({ theme: 'light' })
  })

  it('renderiza slider físico con 3 botones de tema', () => {
    render(<ThemeSwitcher />)
    expect(screen.getByTestId('theme-switcher-slider')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /activar modo claro/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /activar modo quirúrgico/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /activar modo oscuro/i })).toBeInTheDocument()
  })

  it('cambia de tema en store al presionar botón de modo quirúrgico', () => {
    render(<ThemeSwitcher />)
    const surgicalBtn = screen.getByRole('button', { name: /activar modo quirúrgico/i })
    fireEvent.click(surgicalBtn)
    expect(useSidebarStore.getState().theme).toBe('surgical')
  })

  it('cambia de tema en store al presionar botón de modo oscuro', () => {
    render(<ThemeSwitcher />)
    const darkBtn = screen.getByRole('button', { name: /activar modo oscuro/i })
    fireEvent.click(darkBtn)
    expect(useSidebarStore.getState().theme).toBe('dark')
  })
})
