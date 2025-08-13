import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AuthScreen from '../auth-screen.jsx'
import axe from 'axe-core'

describe('Accessibility - AuthScreen', () => {
  test('has no detectable a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthScreen onSignIn={() => {}} isLoading={false} error={null} onReset={() => {}} />
      </MemoryRouter>
    )

    const results = await axe.run(container, {
      rules: {
        // Color contrast is unreliable in jsdom without real rendering
        'color-contrast': { enabled: false }
      }
    })

    expect(results.violations).toEqual([])
  })

  test('primary action is reachable by role and focusable', () => {
    render(
      <MemoryRouter>
        <AuthScreen onSignIn={() => {}} isLoading={false} error={null} onReset={() => {}} />
      </MemoryRouter>
    )
    const btn = screen.getByRole('button', { name: /connect with google drive/i })
    expect(btn).toBeInTheDocument()
    btn.focus()
    expect(document.activeElement).toBe(btn)
  })
})


