// Google Drive Service for perimenopause tracking app
// Updated to use Google Identity Services (GIS) instead of deprecated gapi
import { DEFAULT_VIEW_TIMES } from '../constants/trackingItems.js'

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
    
    // Try to restore token from localStorage on initialization
    this.restoreTokenFromStorage()
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
        const checkGIS = () => {
          if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
            console.log('Google Identity Services already loaded')
            clearTimeout(timeoutId)
            resolve()
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
        const checkGIS = () => {
          if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
            console.log('Google Identity Services object available')
            clearTimeout(timeoutId)
            resolve()
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
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('Token response error:', tokenResponse.error)
            return
          }
          this.accessToken = tokenResponse.access_token
          
          // Calculate token expiry (Google tokens typically last 1 hour)
          const expiryTime = new Date(Date.now() + 3600000) // 1 hour from now
          this.tokenExpiry = expiryTime
          
          // Save token to localStorage for persistence
          this.saveTokenToStorage(tokenResponse.access_token, expiryTime.getTime())
          
          console.log('Access token obtained and saved successfully')
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
          const checkToken = () => {
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

      this.accessToken = null
      this.tokenExpiry = null
      this.tokenClient = null
      this.isInitialized = false
      
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
  saveTokenToStorage(token, expiry) {
    try {
      localStorage.setItem('google_access_token', token)
      localStorage.setItem('google_token_expiry', expiry.toString())
      console.log('Token saved to localStorage')
    } catch (error) {
      console.error('Failed to save token to localStorage:', error)
    }
  }

  // Restore token from localStorage
  restoreTokenFromStorage() {
    try {
      const token = localStorage.getItem('google_access_token')
      const expiry = localStorage.getItem('google_token_expiry')
      
      if (token && expiry) {
        const expiryTime = new Date(parseInt(expiry))
        const now = new Date()
        
        // Check if token is still valid (with 5 minute buffer)
        if (expiryTime > new Date(now.getTime() + 5 * 60 * 1000)) {
          this.accessToken = token
          this.tokenExpiry = expiryTime
          console.log('Token restored from localStorage')
          return true
        } else {
          console.log('Stored token has expired, clearing localStorage')
          this.clearTokenFromStorage()
        }
      }
    } catch (error) {
      console.error('Failed to restore token from localStorage:', error)
    }
    return false
  }

  // Clear token from localStorage
  clearTokenFromStorage() {
    try {
      localStorage.removeItem('google_access_token')
      localStorage.removeItem('google_token_expiry')
      console.log('Token cleared from localStorage')
    } catch (error) {
      console.error('Failed to clear token from localStorage:', error)
    }
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

  // Get current user (for mock mode)
  getCurrentUser() {
    if (this.isMockMode) {
      return { email: 'mock@example.com', name: 'Mock User' }
    }
    return null // We don't store user info in memory for security
  }

  // Execute a request with rate limiting and retries
  async executeRequest(requestFn) {
    if (this.isMockMode) {
      return this.mockRequest(requestFn)
    }

    // Check if we need to refresh authentication
    if (!this.isTokenValid()) {
      console.log('Token is invalid or expired, clearing authentication')
      this.accessToken = null
      this.tokenExpiry = null
      this.clearTokenFromStorage()
      throw new Error('Authentication expired. Please sign in again.')
    }

    if (!this.accessToken) {
      throw new Error('Not authenticated. Please sign in first.')
    }

    // Add to queue and process
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject })
      this.processQueue()
    })
  }

  // Process the request queue with rate limiting
  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0) {
      const { requestFn, resolve, reject } = this.requestQueue.shift()

      try {
        // Add delay between requests to respect rate limits
        if (this.requestQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay))
        }

        const result = await requestFn()
        resolve(result)
      } catch (error) {
        console.error('Request failed:', error)
        
        // Check if it's a rate limit error
        if (error.status === 429 || (error.message && error.message.includes('quota'))) {
          // Increase delay and retry
          this.rateLimitDelay = Math.min(this.rateLimitDelay * 2, 10000)
          console.log(`Rate limited, increasing delay to ${this.rateLimitDelay}ms`)
          
          // Put the request back in the queue
          this.requestQueue.unshift({ requestFn, resolve, reject })
          break
        }

        reject(error)
      }
    }

    this.isProcessingQueue = false
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

      if (!response.ok) {
        throw new Error(`Failed to create file: ${response.statusText}`)
      }

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

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file content: ${uploadResponse.statusText}`)
      }

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

      if (!response.ok) {
        throw new Error(`Failed to get file: ${response.statusText}`)
      }

      return await response.json()
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

      if (!response.ok) {
        throw new Error(`Failed to update file: ${response.statusText}`)
      }

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

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.statusText}`)
      }

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

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`)
      }

      return { success: true }
    })
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
      const existingConfig = await this.getFile(fileId)
      
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
      return await this.getFile(fileId)
    } catch (error) {
      console.error(`Error getting tracking file for ${month}:`, error)
      throw error
    }
  }

  // Save monthly tracking file
  async saveMonthlyTrackingFile(month, data) {
    try {
      const fileName = `tracking-my-hot-self_${month}.json`
      const files = await this.listFiles(`name='${fileName}'`)
      
      if (files.files.length === 0) {
        return await this.createFile(fileName, data)
      }

      const fileId = files.files[0].id
      return await this.updateFile(fileId, data)
    } catch (error) {
      console.error(`Error saving tracking file for ${month}:`, error)
      throw error
    }
  }

  // List all monthly tracking files
  async listMonthlyFiles() {
    try {
      const files = await this.listFiles("name contains 'tracking-my-hot-self_' and name contains '.json'")
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
      return { success: true, synced: 0 }
    }

    try {
      let syncedCount = 0
      const errors = []

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

          // Add the offline entry
          monthData.entries.push(entry)
          
          // Save the updated data
          await this.saveMonthlyTrackingFile(month, monthData)
          syncedCount++
          
        } catch (error) {
          console.error(`Failed to sync entry ${entry.id}:`, error)
          errors.push({ entry, error: error.message })
        }
      }

      return {
        success: errors.length === 0,
        synced: syncedCount,
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