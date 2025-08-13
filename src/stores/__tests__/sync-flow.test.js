import { act } from '@testing-library/react'

jest.mock('../../services/google-drive-service.js', () => ({
  googleDriveService: {
    isMockMode: true,
    getMonthlyTrackingFile: jest.fn().mockResolvedValue({ entries: [] }),
    saveMonthlyTrackingFile: jest.fn().mockResolvedValue({ success: true }),
    setNotificationHandler: jest.fn(),
    isSignedIn: jest.fn().mockResolvedValue(true),
    forceReAuthentication: jest.fn(),
    listMonthlyFiles: jest.fn().mockResolvedValue([]),
    saveConfigFile: jest.fn().mockResolvedValue({}),
    syncOfflineEntries: jest.fn().mockImplementation(async (entries) => ({
      success: true,
      synced: Array.isArray(entries) ? entries.length : 0,
      syncedIds: Array.isArray(entries) ? entries.map(e => e.id) : []
    }))
  }
}))

const { useAppStore } = require('../app-store.js')

describe('Sync flow - offline queue to online sync', () => {
  test('queues entry offline then marks as synced when back online', async () => {
    act(() => useAppStore.getState().setOnlineStatus(false))
    // Seed auth/config
    act(() => {
      useAppStore.setState({
        auth: { isAuthenticated: true, user: { email: 't@test' }, isLoading: false, error: null },
        config: { onboarding: { completed: true } },
        ui: { ...useAppStore.getState().ui, currentView: 'quick' }
      })
    })

    // Add entry (goes to offline queue)
    await act(async () => {
      await useAppStore.getState().addEntry({ energy_level: 3 })
    })
    expect(useAppStore.getState().trackingData.offlineEntries.length).toBeGreaterThan(0)

    // Go online and let sync run
    await act(async () => {
      await useAppStore.getState().setOnlineStatus(true)
    })
    // Allow any microtasks from sync to flush
    await new Promise(resolve => setTimeout(resolve, 0))
    // After sync, offline queue should clear (in mock mode it simulates success)
    expect(useAppStore.getState().trackingData.offlineEntries.length).toBe(0)
  })
})


