import { act } from '@testing-library/react'

// Use real timers to avoid hanging flushPromises
jest.useRealTimers()

// Mock navigator.serviceWorker
const registerMock = jest.fn()
beforeEach(() => {
  global.navigator.serviceWorker = {
    ready: Promise.resolve({ sync: { register: registerMock } })
  }
  registerMock.mockReset()
})

afterEach(() => {
  delete global.navigator.serviceWorker
})

// Mock googleDriveService to avoid network
jest.mock('../../services/google-drive-service.js', () => ({
  googleDriveService: {
    signIn: jest.fn().mockResolvedValue({ success: true, user: { email: 't@test', name: 'T' } }),
    isMockMode: true,
    getMonthlyTrackingFile: jest.fn().mockResolvedValue({ entries: [] }),
    saveMonthlyTrackingFile: jest.fn().mockResolvedValue({ success: true }),
    setNotificationHandler: jest.fn(),
    isSignedIn: jest.fn().mockResolvedValue(true),
    forceReAuthentication: jest.fn(),
    listMonthlyFiles: jest.fn().mockResolvedValue([]),
    saveConfigFile: jest.fn().mockResolvedValue({})
  }
}))

// Import store after mocks
const { useAppStore } = require('../app-store.js')

// Helper to set online/offline
const setOnline = (online) => {
  act(() => {
    useAppStore.getState().setOnlineStatus(online)
  })
}

describe('Background Sync registration', () => {
  test('registers background sync when adding entry while offline', async () => {
    setOnline(false)

    // Authenticate and seed minimal config
    act(() => {
      useAppStore.setState({
        auth: { isAuthenticated: true, user: { email: 't@test' }, isLoading: false, error: null },
        config: {},
        ui: { ...useAppStore.getState().ui, currentView: 'quick' }
      })
    })

    const entryData = { energy_level: 3 }
    await act(async () => {
      await useAppStore.getState().addEntry(entryData)
    })

    // registration should have been attempted
    await Promise.resolve()
    expect(registerMock).toHaveBeenCalledWith('sync-offline-entries')
  })

  test('registers background sync when updating entry while offline', async () => {
    setOnline(false)

    act(() => {
      useAppStore.setState({
        auth: { isAuthenticated: true, user: { email: 't@test' }, isLoading: false, error: null },
        config: {},
        ui: { ...useAppStore.getState().ui, currentView: 'quick' }
      })
    })

    // Seed one entry
    await act(async () => {
      await useAppStore.getState().addEntry({ energy_level: 3 })
    })

    const id = useAppStore.getState().trackingData.entries[0]?.id

    await act(async () => {
      await useAppStore.getState().updateEntry(id, { energy_level: 5 })
    })

    await flushPromises()
    expect(registerMock).toHaveBeenCalledWith('sync-offline-entries')
  })
})

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}


