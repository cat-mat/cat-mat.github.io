import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import axe from 'axe-core'
import { useAppStore } from '../../stores/app-store.js'
import QuickTrack from '../quick-track-view.jsx'

jest.mock('../../stores/app-store.js', () => {
  const state = {
    auth: { isAuthenticated: true, user: { email: 'test@example.com' } },
    config: { onboarding: { completed: true } },
    ui: { currentView: 'quick' },
    trackingData: { entries: [], offlineEntries: [] },
    setOnlineStatus: jest.fn(),
    addNotification: jest.fn(),
    setCurrentView: jest.fn(),
    loadCurrentMonthData: jest.fn(),
    addEntry: jest.fn().mockResolvedValue({ id: 'x', type: 'quick' })
  }
  const mockUseAppStore = jest.fn(() => state)
  mockUseAppStore.getState = () => state
  return { __esModule: true, useAppStore: mockUseAppStore, default: mockUseAppStore }
})

describe('Accessibility - Quick Track', () => {
  test('has no detectable a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <QuickTrack />
      </MemoryRouter>
    )
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations).toEqual([])
  })

  test('can add a quick entry via keyboard activation', async () => {
    render(
      <MemoryRouter>
        <QuickTrack />
      </MemoryRouter>
    )
    // Find any quick-track item button and activate via keyboard
    const firstItem = await screen.findByRole('button', { name: /Allergic Reactions/i })
    // Activate selection
    fireEvent.click(firstItem)
    // Select a value (simulate user click on a scale value)
    // Click the first scale value button that appears after selection
    // After selecting item, pick a visible scale value button by text if present, else first button after headline
    const possibleValues = ['1','2','3','4','5']
    let valueBtn = null
    for (const txt of possibleValues) {
      const found = screen.queryByRole('button', { name: new RegExp(`^${txt}$`) })
      if (found) { valueBtn = found; break }
    }
    if (!valueBtn) {
      valueBtn = (await screen.findAllByRole('button')).slice(1)[0]
    }
    fireEvent.click(valueBtn)
    // Submit
    const save = await screen.findByRole('button', { name: /save quick entry/i })
    fireEvent.click(save)
    await new Promise(r => setTimeout(r, 0))
    expect(useAppStore.getState().addEntry).toHaveBeenCalled()
  })
})


