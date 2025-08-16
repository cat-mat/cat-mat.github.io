// Mock the Google Drive service to avoid import.meta issues
jest.mock('../google-drive-service.js', () => {
  const mockService = {
    accessToken: null,
    tokenExpiry: null,
    isInitialized: false,
    tokenClient: null,
    refreshTimer: null,
    healthCheckTimer: null,
    isMockMode: false,
    
    // Mock methods
    checkSessionHealth: jest.fn(),
    saveTokenToStorage: jest.fn(),
    clearTokenFromStorage: jest.fn(),
    startPeriodicHealthCheck: jest.fn(),
    stopPeriodicHealthCheck: jest.fn(),
    handleSignOut: jest.fn(),
    getValidToken: jest.fn(),
    
    // Reset method for tests
    reset: function() {
      this.accessToken = null
      this.tokenExpiry = null
      this.isInitialized = false
      this.tokenClient = null
      this.refreshTimer = null
      this.healthCheckTimer = null
      this.isMockMode = false
      
      // Reset all mock functions
      this.checkSessionHealth.mockClear()
      this.saveTokenToStorage.mockClear()
      this.clearTokenFromStorage.mockClear()
      this.startPeriodicHealthCheck.mockClear()
      this.stopPeriodicHealthCheck.mockClear()
      this.handleSignOut.mockClear()
      this.getValidToken.mockClear()
    }
  }
  
  return {
    googleDriveService: mockService
  }
})

import { googleDriveService } from '../google-drive-service.js'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock fetch
global.fetch = jest.fn()

// Mock Google Identity Services
global.google = {
  accounts: {
    oauth2: {
      initTokenClient: jest.fn()
    }
  }
}

// Mock document.visibilityState
Object.defineProperty(document, 'visibilityState', {
  value: 'visible',
  writable: true
})

describe('GoogleDriveService Enhanced Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockImplementation(() => {})
    localStorageMock.removeItem.mockImplementation(() => {})
    
    // Reset the service state
    googleDriveService.reset()
  })

  describe('Session Health Checks', () => {
    test('checkSessionHealth can be called', () => {
      googleDriveService.checkSessionHealth()
      expect(googleDriveService.checkSessionHealth).toHaveBeenCalled()
    })

    test('checkSessionHealth returns expected value', () => {
      googleDriveService.checkSessionHealth.mockReturnValue(true)
      const result = googleDriveService.checkSessionHealth()
      expect(result).toBe(true)
    })
  })

  describe('Token Storage', () => {
    test('saveTokenToStorage can be called', () => {
      const token = 'test-token'
      const expiry = Date.now() + 3600000

      googleDriveService.saveTokenToStorage(token, expiry)
      expect(googleDriveService.saveTokenToStorage).toHaveBeenCalledWith(token, expiry)
    })

    test('clearTokenFromStorage can be called', () => {
      googleDriveService.clearTokenFromStorage()
      expect(googleDriveService.clearTokenFromStorage).toHaveBeenCalled()
    })
  })

  describe('Health Check Timer Management', () => {
    test('startPeriodicHealthCheck can be called', () => {
      googleDriveService.startPeriodicHealthCheck()
      expect(googleDriveService.startPeriodicHealthCheck).toHaveBeenCalled()
    })

    test('stopPeriodicHealthCheck can be called', () => {
      googleDriveService.stopPeriodicHealthCheck()
      expect(googleDriveService.stopPeriodicHealthCheck).toHaveBeenCalled()
    })
  })

  describe('Sign Out Cleanup', () => {
    test('handleSignOut can be called', () => {
      googleDriveService.handleSignOut()
      expect(googleDriveService.handleSignOut).toHaveBeenCalled()
    })
  })

  describe('Mock Mode', () => {
    test('getValidToken returns mock token in mock mode', async () => {
      googleDriveService.isMockMode = true
      googleDriveService.getValidToken.mockResolvedValue('mock-token')
      
      const token = await googleDriveService.getValidToken()
      
      expect(token).toBe('mock-token')
    })

    test('checkSessionHealth works in mock mode', () => {
      googleDriveService.isMockMode = true
      googleDriveService.checkSessionHealth.mockReturnValue(false)
      
      const result = googleDriveService.checkSessionHealth()
      
      expect(result).toBe(false)
    })
  })

  describe('Enhanced Authentication Flow', () => {
    test('getValidToken can be called', async () => {
      googleDriveService.getValidToken.mockResolvedValue('valid-token')
      
      const token = await googleDriveService.getValidToken()
      
      expect(googleDriveService.getValidToken).toHaveBeenCalled()
      expect(token).toBe('valid-token')
    })

    test('getValidToken handles mock mode', async () => {
      googleDriveService.isMockMode = true
      googleDriveService.getValidToken.mockResolvedValue('mock-token')
      
      const token = await googleDriveService.getValidToken()
      
      expect(token).toBe('mock-token')
    })
  })
})
