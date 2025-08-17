// Google Drive Service for perimenopause tracking app
// Updated to use Google Identity Services (GIS) instead of deprecated gapi
// Enhanced with session health checks and proactive token management
import { DEFAULT_VIEW_TIMES } from '../constants/tracking-items.js'
import { compressData, decompressData, shouldCompress } from '../utils/compression.js'
import { performanceMonitor } from '../utils/performance.js'

class GoogleDriveService {
  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'mock-client-id'
    this.scope = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email'
    this.discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    
    // Only allow mock mode in development and only if explicitly configured
    this.isMockMode = import.meta.env.DEV && (!import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID === 'mock-client-id')
    
    // Debug logging
    console.log('Google Drive Service initialized with client ID:', this.clientId ? 'Set' : 'Not set')
    console.log('Mock mode:', this.isMockMode)
    
    this.isInitialized = false
    this.tokenClient = null
    this.accessToken = null
    this.tokenExpiry = null
    this.requestQueue = []
    this.isProcessingQueue = false
    this.rateLimitDelay = 1000 // Start with 1 second delay
    this.maxRetries = 3
    this.backoffSchedule = [1000, 2000, 4000, 8000]
    this.refreshTimer = null
    this.proactiveReauthTimer = null
    this.healthCheckTimer = null
    this.notificationHandler = null
    this.lastTokenError = null
    
    // Try to restore token from localStorage on initialization
    this.restoreTokenFromStorage()
    
    // Set up automatic token refresh
    this.setupAutoRefresh()

    // Set up proactive re-auth prompt (day 6)
    this.setupProactiveReauth()
    
    // Set up periodic health checks
    this.startPeriodicHealthCheck()
    
    // Set up visibility change listener for immediate token refresh on app resume
    this.setupVisibilityChangeHandler()
  }

  // Load Google Identity Services (GIS) dynamically
  async loadGoogleIdentityServices() {
    return new Promise((resolve, reject) => {
      // Add timeout to prevent infinite waiting
      const timeoutId = setTimeout(() => {
        reject(new Error('Google Identity Services loading timeout'))
      }, 10000) // 10 second timeout

      // Check if script is already loading
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        // Wait for existing script to load
        let checkCount = 0
        const maxChecks = 100 // 10 seconds max (100 * 100ms)
        const checkGIS = () => {
          checkCount++
          if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
            console.log('Google Identity Services already loaded')
            clearTimeout(timeoutId)
            resolve()
          } else if (checkCount >= maxChecks) {
            console.error('Google Identity Services loading timeout')
            clearTimeout(timeoutId)
            reject(new Error('Google Identity Services loading timeout'))
          } else {
            setTimeout(checkGIS, 100)
          }
        }
        checkGIS()
        return
      }

      // Load the script
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      
      script.onload = () => {
        console.log('Google Identity Services script loaded successfully')
        // Wait for google.accounts to be available
        let checkCount = 0
        const maxChecks = 200 // 10 seconds max (200 * 50ms)
        const checkGIS = () => {
          checkCount++
          if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
            console.log('Google Identity Services object available')
            clearTimeout(timeoutId)
            resolve()
          } else if (checkCount >= maxChecks) {
            console.error('Google Identity Services object timeout')
            clearTimeout(timeoutId)
            reject(new Error('Google Identity Services object timeout'))
          } else {
            setTimeout(checkGIS, 50)
          }
        }
        checkGIS()
      }
      script.onerror = () => {
        console.error('Failed to load Google Identity Services script')
        clearTimeout(timeoutId)
        reject(new Error('Failed to load Google Identity Services'))
      }
      
      document.head.appendChild(script)
    })
  }

  // Initialize Google Identity Services
  async initialize() {
    if (this.isInitialized) {
      return true
    }

    if (this.isMockMode) {
      console.log('Running in mock mode - Google Drive API disabled')
      this.isInitialized = true
      return true
    }

    try {
      // Load Google Identity Services dynamically if not already loaded
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        console.log('Loading Google Identity Services dynamically...')
        await this.loadGoogleIdentityServices()
      }

      // Check if Google Identity Services is available
      console.log('Checking Google Identity Services availability:', {
        googleDefined: typeof google !== 'undefined',
        googleAccounts: typeof google !== 'undefined' && !!google.accounts,
        googleOAuth2: typeof google !== 'undefined' && google.accounts && !!google.accounts.oauth2
      })

      if (typeof google === 'undefined') {
        throw new Error('Google Identity Services failed to load. Please refresh the page and try again.')
      }

      if (!google.accounts || !google.accounts.oauth2) {
        throw new Error('Google Identity Services not properly initialized. Please refresh the page and try again.')
      }

      // Initialize the token client
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: this.scope,
        access_type: 'offline', // Request refresh tokens for long-term access
        prompt: 'consent', // Force consent screen to ensure refresh token generation
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            this.lastTokenError = tokenResponse.error
            console.error('Token response error:', tokenResponse.error)
            if (tokenResponse.error === 'interaction_required') {
              // Surface a clear banner so user can re-auth
              this.notify({
                type: 'reauth-banner',
                title: 'Sign in required',
                message: 'Please sign in again to continue syncing with Google Drive.'
              })
            }
            return
          }
          this.lastTokenError = null
          this.accessToken = tokenResponse.access_token
          
          // Store refresh token if provided (for long-term access)
          if (tokenResponse.refresh_token) {
            this.refreshToken = tokenResponse.refresh_token
            console.log('Refresh token received for long-term access')
          }
          
          // Calculate token expiry (Google tokens can last up to 1 hour, but let's be conservative)
          // If we have an expires_in, use it, otherwise default to 50 minutes
          const expiresIn = tokenResponse.expires_in || 3000 // 50 minutes in seconds
          const expiryTime = new Date(Date.now() + (expiresIn * 1000))
          this.tokenExpiry = expiryTime
          
          // Save tokens to localStorage for persistence
          this.saveTokenToStorage(tokenResponse.access_token, expiryTime.getTime(), tokenResponse.refresh_token)

          // Record first auth time if absent for proactive re-auth prompt (day 6)
          try {
            const existing = localStorage.getItem('google_auth_first_ts')
            if (!existing) {
              localStorage.setItem('google_auth_first_ts', Date.now().toString())
            }
          } catch {}
          this.setupProactiveReauth()
          
          console.log('Access token obtained and saved successfully')
          console.log('Token expires at:', expiryTime.toISOString())
        }
      })

      this.isInitialized = true
      console.log('Google Identity Services initialized successfully')
      return true

    } catch (error) {
      console.error('Failed to initialize Google Identity Services:', error)
      throw error
    }
  }

  // Sign in using Google Identity Services
  async signIn() {
    // Only allow mock mode if explicitly configured for development
    if (this.isMockMode && import.meta.env.DEV) {
      console.log('Mock sign in successful (development mode only)')
      return { success: true, user: { email: 'mock@example.com', name: 'Mock User' } }
    }

    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      if (!this.tokenClient) {
        throw new Error('Token client not initialized')
      }

      // Request access token
      return new Promise((resolve, reject) => {
        // Add timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          reject(new Error('Sign in timeout - please try again. The authentication process may take a few minutes.'))
        }, 120000) // 2 minutes

        try {
          this.tokenClient.requestAccessToken({
            prompt: 'consent'
          })

          // Poll for token
          let checkCount = 0
          const maxChecks = 600 // 1 minute max (600 * 100ms)
          const checkToken = () => {
            checkCount++
            if (this.accessToken) {
              clearTimeout(timeoutId)
              // Get user info
              this.getUserInfo()
                .then(userInfo => {
                  resolve({ success: true, user: userInfo })
                })
                .catch(error => {
                  console.error('Failed to get user info:', error)
                  resolve({ success: true, user: { email: 'user@example.com', name: 'User' } })
                })
            } else if (checkCount >= maxChecks) {
              clearTimeout(timeoutId)
              reject(new Error('Token polling timeout'))
            } else {
              setTimeout(checkToken, 100)
            }
          }
          checkToken()

        } catch (error) {
          clearTimeout(timeoutId)
          reject(error)
        }
      })

    } catch (error) {
      console.error('Sign in failed:', error)
      return { success: false, error: error.message || 'Sign in failed. Please try again.' }
    }
  }

  // Get user information using the access token
  async getUserInfo() {
    if (!this.accessToken) {
      throw new Error('No access token available')
    }

    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get user info')
    }

    return await response.json()
  }

  // Sign out
  async signOut() {
    if (this.isMockMode) {
      console.log('Mock sign out successful')
      return { success: true }
    }

    try {
      if (this.accessToken) {
        // Revoke the token
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.accessToken}`, {
          method: 'POST'
        })
      }

      // Use the centralized cleanup method
      this.handleSignOut()
      
      // Clear stored token
      this.clearTokenFromStorage()

      console.log('Sign out successful')
      return { success: true }
    } catch (error) {
      console.error('Sign out failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Save token to localStorage
  saveTokenToStorage(token, expiry, refreshToken = null) {
    try {
      localStorage.setItem('google_access_token', token)
      localStorage.setItem('google_token_expiry', expiry.toString())
      localStorage.setItem('google_token_timestamp', Date.now().toString())
      
      // Store refresh token if provided (for long-term access)
      if (refreshToken) {
        localStorage.setItem('google_refresh_token', refreshToken)
        console.log('Refresh token saved to localStorage')
      }
      
      console.log('Tokens saved to localStorage')
      
      // Set up automatic refresh for the new token
      this.setupAutoRefresh()
    } catch (error) {
      console.error('Failed to save tokens to localStorage:', error)
    }
  }

  // Restore token from localStorage
  restoreTokenFromStorage() {
    try {
      const token = localStorage.getItem('google_access_token')
      const expiry = localStorage.getItem('google_token_expiry')
      const refreshToken = localStorage.getItem('google_refresh_token')
      
      if (token && expiry) {
        const expiryTime = new Date(parseInt(expiry))
        const now = new Date()
        
        // Check if token is still valid (with 5 minute buffer)
        if (expiryTime > new Date(now.getTime() + 5 * 60 * 1000)) {
          this.accessToken = token
          this.tokenExpiry = expiryTime
          
          // Restore refresh token if available
          if (refreshToken) {
            this.refreshToken = refreshToken
            console.log('Refresh token restored from localStorage')
          }
          
          console.log('Tokens restored from localStorage')
          
          // Set up auto-refresh for restored token
          this.setupAutoRefresh()
          return true
        } else {
          console.log('Stored token has expired, clearing localStorage')
          this.clearTokenFromStorage()
        }
      }
    } catch (error) {
      console.error('Failed to restore tokens from localStorage:', error)
    }
    return false
  }

  // Clear token from localStorage
  clearTokenFromStorage() {
    try {
      localStorage.removeItem('google_access_token')
      localStorage.removeItem('google_token_expiry')
      localStorage.removeItem('google_token_timestamp')
      localStorage.removeItem('google_refresh_token')
      console.log('Tokens cleared from localStorage')
      
      // Clear any pending refresh timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer)
        this.refreshTimer = null
      }
    } catch (error) {
      console.error('Failed to clear tokens from localStorage:', error)
    }
  }

  // Check session health and proactively refresh if needed
  checkSessionHealth() {
    try {
      const tokenTimestamp = localStorage.getItem('google_token_timestamp')
      if (!tokenTimestamp) return false
      
      const tokenAge = Date.now() - parseInt(tokenTimestamp)
      const daysOld = tokenAge / (1000 * 60 * 60 * 24)
      
      // Proactively refresh if token is older than 5 days
      if (daysOld > 5) {
        console.log('Token is getting old, proactively refreshing...')
        this.refreshToken().catch(error => {
          console.error('Proactive refresh failed:', error)
        })
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error checking session health:', error)
      return false
    }
  }

  // Start periodic health checks
  startPeriodicHealthCheck() {
    // Clear any existing timer
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }

    // Check every 4 hours when page is active
    this.healthCheckTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && this.isSignedIn()) {
        this.checkSessionHealth()
      }
    }, 4 * 60 * 60 * 1000) // 4 hours
  }

  // Stop periodic health checks
  stopPeriodicHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }
  }

  // Set up visibility change handler for immediate token refresh on app resume
  setupVisibilityChangeHandler() {
    // Only set up once
    if (this.visibilityHandler) {
      return
    }

    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible' && this.isSignedIn()) {
        console.log('App became visible, checking token health...')
        this.handleAppResume()
      }
    }

    document.addEventListener('visibilitychange', this.visibilityHandler)
  }

  // Handle app resume - immediate token refresh with graceful degradation
  async handleAppResume() {
    if (this.isMockMode) {
      return
    }

    try {
      // Check if we have a stored token
      const storedToken = localStorage.getItem('google_access_token')
      if (!storedToken) {
        console.log('No stored token found on app resume')
        return
      }

      // Test the token immediately
      const tokenValid = await this.testTokenValidity(storedToken)
      
      if (tokenValid) {
        console.log('Stored token is still valid on app resume')
        this.accessToken = storedToken
        return
      }

      console.log('Stored token is invalid, attempting immediate refresh...')
      
      // Try to refresh the token silently
      await this.refreshToken()
      console.log('Token refreshed successfully on app resume')
      
    } catch (error) {
      console.log('Token refresh failed on app resume:', error.message)
      
      // Don't spam the user - just clear the token and let them continue offline
      this.accessToken = null
      this.tokenExpiry = null
      
      // Show a single, clear notification
      this.notify({
        type: 'info',
        title: 'Working offline',
        message: 'Your entries are saved locally and will sync when you sign in again.'
      })
    }
  }

  // Test token validity without throwing errors
  async testTokenValidity(token) {
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { 'Authorization': `Bearer ${token}` },
        // Add a short timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch (error) {
      console.log('Token test failed:', error.message)
      return false
    }
  }

  // Set up automatic token refresh
  setupAutoRefresh() {
    // Clear any existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    // Only set up auto-refresh if we have a token and expiry; try to initialize client if missing
    if (!this.accessToken || !this.tokenExpiry) {
      return
    }
    if (!this.tokenClient && !this.isMockMode) {
      // Lazily initialize GIS client to enable refresh flow after restore
      this.initialize().catch(() => {})
    }

    const now = new Date()
    const timeUntilExpiry = this.tokenExpiry.getTime() - now.getTime()
    
    // Refresh token 10 minutes before it expires
    const refreshTime = Math.max(timeUntilExpiry - (10 * 60 * 1000), 60000) // At least 1 minute
    
    console.log(`Setting up auto-refresh in ${Math.round(refreshTime / 1000 / 60)} minutes`)
    
    this.refreshTimer = setTimeout(async () => {
      try {
        console.log('Auto-refreshing token...')
        await this.refreshToken()
        // Reset retry count on successful refresh
        this.autoRefreshRetryCount = 0
        // Set up the next refresh
        this.setupAutoRefresh()
      } catch (error) {
        console.error('Auto-refresh failed:', error)
        // Try again in 5 minutes, but limit retries to prevent infinite recursion
        if (!this.autoRefreshRetryCount) {
          this.autoRefreshRetryCount = 0
        }
        this.autoRefreshRetryCount++
        
        if (this.autoRefreshRetryCount <= 3) {
          this.refreshTimer = setTimeout(() => this.setupAutoRefresh(), 5 * 60 * 1000)
        } else {
          console.error('Auto-refresh retry limit exceeded, stopping auto-refresh')
          this.autoRefreshRetryCount = 0
        }
      }
    }, refreshTime)
  }

  // Proactive re-auth prompt at day 6 for unverified apps
  setupProactiveReauth() {
    // Clear any existing timer
    if (this.proactiveReauthTimer) {
      clearTimeout(this.proactiveReauthTimer)
    }
    try {
      const firstTsRaw = localStorage.getItem('google_auth_first_ts')
      if (!firstTsRaw) return
      const firstTs = parseInt(firstTsRaw, 10)
      if (Number.isNaN(firstTs)) return
      const sixDaysMs = 6 * 24 * 60 * 60 * 1000
      const now = Date.now()
      const delay = Math.max(firstTs + sixDaysMs - now, 0)
      if (delay === 0) {
        // Immediate banner prompt
        this.notify({
          type: 'reauth-banner',
          title: 'Heads up: sign in again soon',
          message: 'For unverified apps, access may expire every 7 days. Re-authenticate to keep syncing without interruption.'
        })
        return
      }
      this.proactiveReauthTimer = setTimeout(() => {
        this.notify({
          type: 'reauth-banner',
          title: 'Please sign in again',
          message: 'To keep your Google Drive connection active, sign in again. Your data is safe and will sync after re-auth.'
        })
      }, delay)
    } catch {}
  }

  // Check if user is signed in
  isSignedIn() {
    return this.isMockMode || (this.isInitialized && this.accessToken !== null && this.isTokenValid())
  }

  // Check if current token is still valid
  isTokenValid() {
    if (!this.accessToken || !this.tokenExpiry) {
      return false
    }
    
    const now = new Date()
    const expiryTime = new Date(this.tokenExpiry)
    
    // Token is valid if it expires more than 5 minutes from now
    return expiryTime > new Date(now.getTime() + 5 * 60 * 1000)
  }

  // Refresh the access token
  async refreshToken() {
    if (!this.tokenClient) {
      // Attempt to lazily initialize GIS and the token client when a token
      // was restored from storage but the service wasn't initialized yet.
      try {
        await this.initialize()
      } catch (e) {
        throw new Error('Token client not initialized')
      }
    }

    console.log('Attempting to refresh access token...')
    
    // Check if we have a stored refresh token
    const storedRefreshToken = localStorage.getItem('google_refresh_token')
    
    return new Promise((resolve, reject) => {
      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        reject(new Error('Token refresh timeout'))
      }, 60000) // 1 minute timeout

      // Store the current token to detect changes
      const currentToken = this.accessToken

      try {
        // Request a new access token using refresh token if available
        const requestOptions = {
          prompt: 'none' // Don't show consent screen if user is already signed in
        }
        
        // If we have a refresh token, use it for silent refresh
        if (storedRefreshToken) {
          console.log('Using stored refresh token for silent refresh')
        }
        
        this.tokenClient.requestAccessToken(requestOptions)

        // Poll for new token
        let checkCount = 0
        const maxChecks = 600 // 1 minute max (600 * 100ms)
        const checkToken = () => {
          checkCount++
          if (this.lastTokenError === 'interaction_required') {
            clearTimeout(timeoutId)
            reject(new Error('interaction_required'))
            return
          }
          // Check if we got a new token (different from current)
          if (this.accessToken && this.accessToken !== currentToken && this.isTokenValid()) {
            clearTimeout(timeoutId)
            console.log('Token refreshed successfully')
            console.log('New token expires at:', this.tokenExpiry.toISOString())
            resolve()
          } else if (this.accessToken === currentToken && checkCount < maxChecks) {
            // Still the same token, keep polling
            setTimeout(checkToken, 100)
          } else {
            // No token or invalid, stop polling
            clearTimeout(timeoutId)
            reject(new Error('Token refresh failed - no new token received'))
          }
        }
        checkToken()

      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }

  // Force re-authentication (for when refresh fails)
  async forceReAuthentication() {
    console.log('Forcing re-authentication...')
    
    // Make sure we're initialized
    if (!this.isInitialized) {
      console.log('Initializing Google Identity Services for re-authentication...')
      await this.initialize()
    }
    
    if (!this.tokenClient) {
      throw new Error('Token client not available for re-authentication')
    }
    
    // Clear current token
    this.accessToken = null
    this.tokenExpiry = null
    this.clearTokenFromStorage()
    
    // Request new token with consent
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Re-authentication timeout'))
      }, 120000) // 2 minutes timeout

      try {
        console.log('Requesting new token with consent...')
        this.tokenClient.requestAccessToken({
          prompt: 'consent' // Show consent screen
        })

        // Poll for new token
        let checkCount = 0
        const maxChecks = 1200 // 2 minutes max (1200 * 100ms)
        const checkToken = () => {
          checkCount++
          if (this.accessToken && this.isTokenValid()) {
            clearTimeout(timeoutId)
            console.log('Re-authentication successful')
            resolve()
          } else if (checkCount >= maxChecks) {
            clearTimeout(timeoutId)
            reject(new Error('Re-authentication polling timeout'))
          } else {
            setTimeout(checkToken, 100)
          }
        }
        checkToken()

      } catch (error) {
        clearTimeout(timeoutId)
        console.error('Error during force re-authentication:', error)
        reject(error)
      }
    })
  }

  // Get current user (for mock mode)
  getCurrentUser() {
    if (this.isMockMode) {
      return { email: 'mock@example.com', name: 'Mock User' }
    }
    return null // We don't store user info in memory for security
  }

  // Get a valid token with session health checks and automatic refresh
  async getValidToken() {
    if (this.isMockMode) {
      return 'mock-token'
    }

    // First check if we should proactively refresh based on session health
    const sessionHealthy = this.checkSessionHealth()
    
    const existingToken = localStorage.getItem('google_access_token')
    
    if (!existingToken || !sessionHealthy) {
      // No token or old token, need to authenticate
      if (!this.isInitialized) {
        await this.initialize()
      }
      
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Token request timeout'))
        }, 120000) // 2 minutes timeout

        try {
          this.tokenClient.requestAccessToken({
            prompt: 'consent'
          })

          // Poll for token
          let checkCount = 0
          const maxChecks = 1200 // 2 minutes max (1200 * 100ms)
          const checkToken = () => {
            checkCount++
            if (this.accessToken && this.isTokenValid()) {
              clearTimeout(timeoutId)
              resolve(this.accessToken)
            } else if (checkCount >= maxChecks) {
              clearTimeout(timeoutId)
              reject(new Error('Token request polling timeout'))
            } else {
              setTimeout(checkToken, 100)
            }
          }
          checkToken()

        } catch (error) {
          clearTimeout(timeoutId)
          reject(error)
        }
      })
    }
    
    // Test if existing token still works
    const tokenValid = await this.testTokenValidity(existingToken)
    
    if (tokenValid) {
      this.accessToken = existingToken
      return existingToken
    }
    
    console.log('Token test failed, getting new token...')
    
    // Token expired, get a new one
    if (!this.isInitialized) {
      await this.initialize()
    }
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Token refresh timeout'))
      }, 60000) // 1 minute timeout

      try {
        this.tokenClient.requestAccessToken({
          prompt: 'none' // Don't show consent screen if user is already signed in
        })

        // Poll for new token
        let checkCount = 0
        const maxChecks = 600 // 1 minute max (600 * 100ms)
        const checkToken = () => {
          checkCount++
          if (this.accessToken && this.isTokenValid()) {
            clearTimeout(timeoutId)
            resolve(this.accessToken)
          } else if (checkCount >= maxChecks) {
            clearTimeout(timeoutId)
            reject(new Error('Token refresh polling timeout'))
          } else {
            setTimeout(checkToken, 100)
          }
        }
        checkToken()

      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }

  // Execute a request with rate limiting and retries
  async executeRequest(requestFn) {
    if (this.isMockMode) {
      return this.mockRequest(requestFn)
    }

    // Get a valid token with session health checks
    try {
      await this.getValidToken()
    } catch (error) {
      console.log('Failed to get valid token, attempting force re-authentication...')
      try {
        await this.forceReAuthentication()
      } catch (reauthError) {
        console.log('Force re-authentication failed, clearing authentication')
        this.accessToken = null
        this.tokenExpiry = null
        this.clearTokenFromStorage()
        
        // Show a single, clear message instead of throwing an error that causes retries
        this.notify({
          type: 'error',
          title: 'Sign in required',
          message: 'Please sign in again to sync with Google Drive. Your entries are saved locally.'
        })
        
        // Return a mock response to prevent the request from failing completely
        // This allows the app to continue working offline
        return { success: false, offline: true, message: 'Working offline - sign in to sync' }
      }
    }

    if (!this.accessToken) {
      // Show a single, clear message instead of throwing an error
      this.notify({
        type: 'error',
        title: 'Sign in required',
        message: 'Please sign in again to sync with Google Drive. Your entries are saved locally.'
      })
      
      // Return a mock response to prevent the request from failing completely
      return { success: false, offline: true, message: 'Working offline - sign in to sync' }
    }

    // Add to queue and process
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject, retryCount: 0, backoffIndex: 0 })
      this.processQueue()
    })
  }

  // Process the request queue with rate limiting
  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true
    
    // Add a timeout to prevent infinite processing
    const queueTimeout = setTimeout(() => {
      console.error('Queue processing timeout - clearing queue')
      this.isProcessingQueue = false
      this.requestQueue.forEach(req => req.reject(new Error('Queue processing timeout')))
      this.requestQueue = []
    }, 30000) // 30 second timeout

    while (this.requestQueue.length > 0) {
      const req = this.requestQueue.shift()
      const { requestFn, resolve, reject } = req

      try {
        // Add delay between requests to respect rate limits
        if (this.requestQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay))
        }

        const result = await performanceMonitor.measureFunction('DriveRequest', requestFn)
        resolve(result)
      } catch (error) {
        console.error('Request failed:', error)
        
        // Check if it's an authentication error
        if (error.message && error.message.includes('Authentication expired')) {
          console.log('Authentication error detected, attempting token refresh...')
          try {
            await this.refreshToken()
            // Put the request back in the queue to retry with new token (increment retry count)
            req.retryCount += 1
            if (req.retryCount < this.maxRetries) {
              this.requestQueue.unshift(req)
              break
            } else {
              console.error('Max authentication retries exceeded')
              reject(error)
              this.notify({
                type: 'error',
                title: 'Authentication failed',
                message: 'Please sign in again to continue syncing.'
              })
            }
          } catch (refreshError) {
            console.error('Token refresh failed, attempting force re-authentication...')
            try {
              await this.forceReAuthentication()
              // Put the request back in the queue to retry with new token (increment retry count)
              req.retryCount += 1
              if (req.retryCount < this.maxRetries) {
                this.requestQueue.unshift(req)
                break
              } else {
                console.error('Max authentication retries exceeded')
                reject(error)
                this.notify({
                  type: 'error',
                  title: 'Authentication failed',
                  message: 'Please sign in again to continue syncing.'
                })
              }
            } catch (reauthError) {
              console.error('Force re-authentication failed:', reauthError)
              reject(error) // Return original error
              this.notify({
                type: 'error',
                title: 'Authentication expired',
                message: 'Please sign in again to continue syncing.'
              })
            }
          }
        }
        // Check if it's a rate limit error
        else if (this.isRateLimitError(error)) {
          const delay = this.backoffSchedule[Math.min(req.backoffIndex, this.backoffSchedule.length - 1)]
          console.log(`Rate limited, backing off for ${delay}ms (attempt ${req.backoffIndex + 1})`)
          await this.sleep(delay)
          req.backoffIndex += 1
          req.retryCount += 1
          if (req.retryCount >= this.backoffSchedule.length) {
            // Throttled user messaging for rate limits
            this.notify({
              type: 'rate-limit',
              title: 'Sync is throttled',
              message: 'Google Drive is rate limiting requests. We will keep trying in the background.'
            })
          }
          // Put the request back in the queue and continue
          this.requestQueue.unshift(req)
          break
        }
        else {
          // Network errors: surface friendly notification and rethrow
          if (this.isNetworkError(error)) {
            this.notify({
              type: 'info',
              title: 'Offline mode',
              message: 'You appear to be offline. Your entries are saved and will sync when back online.'
            })
          }
          reject(error)
        }
      }
    }

    clearTimeout(queueTimeout)
    this.isProcessingQueue = false
  }

  isRateLimitError(error) {
    if (!error) return false
    if (error.status === 429) return true
    if (error.status === 403 && error.code === 'userRateLimitExceeded') return true
    if (typeof error.message === 'string' && /rate limit|quota/i.test(error.message)) return true
    return false
  }

  isNetworkError(error) {
    return (
      (typeof navigator !== 'undefined' && !navigator.onLine) ||
      (error && error.message && /Failed to fetch|NetworkError|TypeError/i.test(error.message))
    )
  }

  sleep(ms) {
    return new Promise(res => setTimeout(res, ms))
  }

  setNotificationHandler(handler) {
    this.notificationHandler = typeof handler === 'function' ? handler : null
  }

  notify(notification) {
    try {
      if (this.notificationHandler) {
        this.notificationHandler(notification)
      }
    } catch {}
  }

  // Create a file in Google Drive
  async createFile(fileName, content, mimeType = 'application/json') {
    return this.executeRequest(async () => {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: fileName,
          parents: ['appDataFolder'],
          mimeType: mimeType
        })
      })

      await this.ensureOk(response, 'Failed to create file')
      const file = await response.json()

      // Upload the content
      const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': mimeType
        },
        body: typeof content === 'string' ? content : JSON.stringify(content)
      })

      await this.ensureOk(uploadResponse, 'Failed to upload file content')
      return await uploadResponse.json()
    })
  }

  // Get a file from Google Drive
  async getFile(fileId) {
    return this.executeRequest(async () => {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      await this.ensureOk(response, 'Failed to get file')
      try {
        return await response.json()
      } catch (e) {
        const err = new Error('Corrupted data: invalid JSON')
        err.status = response.status
        err.code = 'corruptedData'
        throw err
      }
    })
  }

  // Update a file in Google Drive
  async updateFile(fileId, content, mimeType = 'application/json') {
    return this.executeRequest(async () => {
      const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': mimeType
        },
        body: typeof content === 'string' ? content : JSON.stringify(content)
      })

      await this.ensureOk(response, 'Failed to update file')
      return await response.json()
    })
  }

  // List files in Google Drive
  async listFiles(query = '') {
    return this.executeRequest(async () => {
      let url = 'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,mimeType,modifiedTime,size)'
      
      if (query) {
        url += `&q=${encodeURIComponent(query)}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      await this.ensureOk(response, 'Failed to list files')
      return await response.json()
    })
  }

  // Delete a file from Google Drive
  async deleteFile(fileId) {
    return this.executeRequest(async () => {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      await this.ensureOk(response, 'Failed to delete file')
      return { success: true }
    })
  }

  // Ensure a fetch response is OK; otherwise throw structured error
  async ensureOk(response, message) {
    if (response.ok) return
    let details = null
    try {
      details = await response.json()
    } catch {}
    const err = new Error(`${message}: ${response.status} ${response.statusText}`)
    err.status = response.status
    err.details = details
    if (details && details.error && details.error.errors && details.error.errors[0]) {
      err.code = details.error.errors[0].reason
    }
    throw err
  }

  // Get the configuration file
  async getConfigFile(userEmail = null) {
    try {
      const files = await this.listFiles("name='config.json'")
      
      if (files.files.length === 0) {
        console.log('No config file found, creating default config')
        // Use provided user email or fallback
        const email = userEmail || this.getCurrentUser()?.email || 'user@example.com'
        const newFile = await this.createFile('config.json', this.getDefaultConfig(email))
        // Return the actual file content, not the metadata
        return await this.getFile(newFile.id)
      }

      // Get existing config file
      const fileId = files.files[0].id
      let existingConfig
      try {
        existingConfig = await this.getFile(fileId)
      } catch (e) {
        // Handle corrupted data recovery
        if (e && e.code === 'corruptedData') {
          const ts = new Date().toISOString().replace(/[:.]/g, '-')
          const backupName = `config_corrupted_backup_${ts}.json`
          try {
            // Attempt to fetch raw metadata to preserve corrupted bytes is not available; create a marker backup file
            await this.createFile(backupName, { note: 'Auto-created due to corrupted config.json', created_at: ts })
          } catch {}
          // Create new clean config
          const email = userEmail || this.getCurrentUser()?.email || 'user@example.com'
          const newFile = await this.createFile('config.json', this.getDefaultConfig(email))
          this.notify({
            type: 'warning',
            title: 'Recovered configuration',
            message: 'Your configuration appeared corrupted. A new clean config was created. A backup marker was saved.'
          })
          return await this.getFile(newFile.id)
        }
        throw e
      }
      
      // Check if the config has the old structure and needs migration
      if (existingConfig && (
        !existingConfig.user_id || 
        !existingConfig.view_configurations ||
        !existingConfig.display_options?.view_times?.morning_end ||
        !existingConfig.display_options?.view_times?.evening_start
      )) {
        console.log('Found old config structure, migrating to new format')
        console.log('Old config structure:', existingConfig)
        // Delete the old config file
        await this.deleteFile(fileId)
        // Create new config with proper structure
        const email = userEmail || this.getCurrentUser()?.email || 'user@example.com'
        const newFile = await this.createFile('config.json', this.getDefaultConfig(email))
        // Return the actual file content, not the metadata
        return await this.getFile(newFile.id)
      }

      return existingConfig
    } catch (error) {
      console.error('Error getting config file:', error)
      throw error
    }
  }

  // Helper method to create default config
  getDefaultConfig(userEmail = 'user@example.com') {
    return {
      version: '1.3.0',
      user_id: userEmail,
      onboarding: {
        completed: false,
        completed_at: null,
        skipped_steps: [],
        tour_completed: false
      },
      display_options: {
        item_display_type: 'face',
        view_times: DEFAULT_VIEW_TIMES
      },
      insights_settings: {
        enabled: true,
        frequency: 'weekly',
        advanced_analysis: false,
        last_generated: null
      },
      privacy_settings: {
        error_reporting: false,
        analytics: false,
        data_retention_days: 365
      },
      session_config: {
        timeout_minutes: 60,
        auto_save_interval: 30
      },
      section_configuration: {
        sections: ['body', 'mind'],
        section_sort_order: ['body', 'mind'],
        section_visibility: {
          body: true,
          mind: true
        }
      },
      view_configurations: {
        morning_report: {
          sections: {
            body: {
              items: [
                'bleeding_spotting',
                'energy_level',
                'forehead_shine',
                'headache',
                'hot_flashes',
                'joint_pain',
                'nausea',
                'pill_pack_start_date',
                'sleep_quality',
                'temperature_sensitivity',
                'wearables_body_battery',
                'wearables_sleep_score',
                'workout_recovery'
              ],
              sort_order: [
                'bleeding_spotting',
                'energy_level',
                'forehead_shine',
                'headache',
                'hot_flashes',
                'joint_pain',
                'nausea',
                'pill_pack_start_date',
                'sleep_quality',
                'temperature_sensitivity',
                'wearables_body_battery',
                'wearables_sleep_score',
                'workout_recovery'
              ],
              visible: true,
              collapsed: false
            },
            mind: {
              items: [
                'anxiety',
                'brain_fog',
                'depression',
                'irritability',
                'mood',
                'social_stamina',
                'stress_level',
                'weird_dreams'
              ],
              sort_order: [
                'anxiety',
                'brain_fog',
                'depression',
                'irritability',
                'mood',
                'social_stamina',
                'stress_level',
                'weird_dreams'
              ],
              visible: true,
              collapsed: false
            }
          },
          wearables: ['wearables_sleep_score', 'wearables_body_battery']
        },
        evening_report: {
          sections: {
            body: {
              items: [
                'allergic_reactions',
                'diet_triggers',
                'energy_level',
                'exercise_impact',
                'forehead_shine',
                'headache',
                'hormone_symptoms',
                'hot_flashes',
                'hydration',
                'irritability',
                'joint_pain',
                'nausea',
                'temperature_sensitivity',
                'workout_recovery'
              ],
              sort_order: [
                'allergic_reactions',
                'diet_triggers',
                'energy_level',
                'exercise_impact',
                'forehead_shine',
                'headache',
                'hormone_symptoms',
                'hot_flashes',
                'hydration',
                'irritability',
                'joint_pain',
                'nausea',
                'temperature_sensitivity',
                'workout_recovery'
              ],
              visible: true,
              collapsed: false
            },
            mind: {
              items: [
                'anxiety',
                'brain_fog',
                'depression',
                'irritability',
                'mood',
                'overall_sentiment',
                'social_stamina',
                'stress_level'
              ],
              sort_order: [
                'anxiety',
                'brain_fog',
                'depression',
                'irritability',
                'mood',
                'overall_sentiment',
                'social_stamina',
                'stress_level'
              ],
              visible: true,
              collapsed: false
            }
          }
        },
        quick_track: {
          sections: {
            body: {
              items: [
                'allergic_reactions',
                'energy_level',
                'forehead_shine',
                'headache',
                'hot_flashes',
                'hydration',
                'joint_pain',
                'nausea',
                'temperature_sensitivity',
                'workout_recovery'
              ],
              sort_order: [
                'allergic_reactions',
                'energy_level',
                'forehead_shine',
                'headache',
                'hot_flashes',
                'hydration',
                'joint_pain',
                'nausea',
                'temperature_sensitivity',
                'workout_recovery'
              ],
              visible: true,
              collapsed: false
            },
            mind: {
              items: [
                'anxiety',
                'brain_fog',
                'depression',
                'irritability',
                'mood',
                'social_stamina',
                'stress_level'
              ],
              sort_order: [
                'anxiety',
                'brain_fog',
                'depression',
                'irritability',
                'mood',
                'social_stamina',
                'stress_level'
              ],
              visible: true,
              collapsed: false
            }
          }
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // Save the configuration file
  async saveConfigFile(config) {
    try {
      console.log('saveConfigFile called')
      const files = await this.listFiles("name='config.json'")
      console.log('Found existing config files:', files.files.length)
      
      if (files.files.length === 0) {
        console.log('Creating new config file...')
        const result = await this.createFile('config.json', config)
        console.log('New config file created successfully')
        return result
      }

      const fileId = files.files[0].id
      console.log('Updating existing config file...')
      const result = await this.updateFile(fileId, config)
      console.log('Config file updated successfully')
      return result
    } catch (error) {
      console.error('Error saving config file:', error)
      throw error
    }
  }

  // Get monthly tracking file
  async getMonthlyTrackingFile(month) {
    try {
      const fileName = `tracking-my-hot-self_${month}.json`
      const files = await this.listFiles(`name='${fileName}'`)
      
      if (files.files.length === 0) {
        console.log(`No tracking file found for ${month}, creating empty file`)
        return { entries: [] }
      }

      const fileId = files.files[0].id
      const fileData = await this.getFile(fileId)
      
      // Decompress data if it was compressed
      if (fileData && typeof fileData === 'object' && fileData.compressed !== undefined) {
        return decompressData(fileData)
      }
      
      return fileData
    } catch (error) {
      console.error(`Error getting tracking file for ${month}:`, error)
      throw error
    }
  }

  // Save monthly tracking file
  async saveMonthlyTrackingFile(month, data) {
    try {
      const fileName = `tracking-my-hot-self_${month}.json`
      
      // Compress data if it's large
      const compressedData = compressData(data)
      const content = JSON.stringify(compressedData, null, 2)
      
      const files = await performanceMonitor.measureFunction('Drive:listFiles', () => this.listFiles(`name='${fileName}'`))
      
      if (files.files.length === 0) {
        const result = await performanceMonitor.measureFunction('Drive:createFile', () => this.createFile(fileName, content))
        console.log(`Created monthly tracking file: ${fileName}${compressedData.compressed ? ` (compressed: ${compressedData.compressionRatio}% smaller)` : ''}`)
        return result
      }

      const fileId = files.files[0].id
      const result = await performanceMonitor.measureFunction('Drive:updateFile', () => this.updateFile(fileId, content))
      console.log(`Updated monthly tracking file: ${fileName}${compressedData.compressed ? ` (compressed: ${compressedData.compressionRatio}% smaller)` : ''}`)
      return result
    } catch (error) {
      console.error(`Error saving tracking file for ${month}:`, error)
      throw error
    }
  }

  // List all monthly tracking files
  async listMonthlyFiles() {
    try {
      const files = await performanceMonitor.measureFunction('Drive:listMonthlyFiles', () => this.listFiles("name contains 'tracking-my-hot-self_' and name contains '.json'"))
      return files.files.map(file => ({
        id: file.id,
        name: file.name,
        month: file.name.replace('tracking-my-hot-self_', '').replace('.json', ''),
        modifiedTime: file.modifiedTime
      }))
    } catch (error) {
      console.error('Error listing monthly files:', error)
      throw error
    }
  }

  // Sync offline entries
  async syncOfflineEntries(offlineEntries) {
    if (!offlineEntries || offlineEntries.length === 0) {
      return { success: true, synced: 0, syncedIds: [] }
    }

    try {
      let syncedCount = 0
      const errors = []
      const syncedIds = []

      for (const entry of offlineEntries) {
        try {
          const month = new Date(entry.timestamp).toISOString().slice(0, 7) // YYYY-MM format
          const fileName = `tracking-my-hot-self_${month}.json`
          
          // Get existing data for this month
          let monthData
          try {
            monthData = await this.getMonthlyTrackingFile(month)
          } catch (error) {
            // File doesn't exist, create new
            monthData = { entries: [] }
          }

          // Add the offline entry and mark as synced for storage
          const entryToStore = { ...entry, sync_status: 'synced', updated_at: new Date().toISOString() }
          monthData.entries.push(entryToStore)
          
          // Save the updated data
          await this.saveMonthlyTrackingFile(month, monthData)
          syncedCount++
          syncedIds.push(entry.id)
          
        } catch (error) {
          console.error(`Failed to sync entry ${entry.id}:`, error)
          errors.push({ entry, error: error.message })
        }
      }

      return {
        success: errors.length === 0,
        synced: syncedCount,
        syncedIds,
        errors: errors
      }
    } catch (error) {
      console.error('Error syncing offline entries:', error)
      throw error
    }
  }

  // Handle sign out (cleanup)
  handleSignOut() {
    this.accessToken = null
    this.tokenClient = null
    this.isInitialized = false
    this.requestQueue = []
    this.isProcessingQueue = false
    
    // Clear refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    
    // Stop health checks
    this.stopPeriodicHealthCheck()
    
    // Remove visibility change handler
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
      this.visibilityHandler = null
    }
  }

  // Mock request for development
  async mockRequest(requestFn) {
    console.log('Mock request executed')
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
    return { success: true, mock: true }
  }

  // Get quota usage (not available with GIS, but kept for compatibility)
  async getQuotaUsage() {
    if (this.isMockMode) {
      return { used: 0, limit: 1000000, percentage: 0 }
    }
    
    // GIS doesn't provide quota info, return mock data
    return { used: 0, limit: 1000000, percentage: 0 }
  }

  // Check if file exists
  async checkFileExists(fileName) {
    try {
      const files = await this.listFiles(`name='${fileName}'`)
      return files.files.length > 0
    } catch (error) {
      console.error('Error checking file existence:', error)
      return false
    }
  }

  // Compress data (placeholder for future implementation)
  async compressData(data) {
    // For now, just return the data as-is
    return data
  }

  // Decompress data (placeholder for future implementation)
  async decompressData(data) {
    // For now, just return the data as-is
    return data
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService() 
