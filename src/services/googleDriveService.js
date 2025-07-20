// Google Drive Service for perimenopause tracking app
class GoogleDriveService {
  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'mock-client-id'
    this.scope = 'https://www.googleapis.com/auth/drive.appdata'
    this.discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    
    // Force mock mode for development (no Google API credentials)
    this.isMockMode = true // Always use mock mode for now
    
    this.isInitialized = false
    this.authInstance = null
    this.driveService = null
    this.requestQueue = []
    this.isProcessingQueue = false
    this.rateLimitDelay = 1000 // Start with 1 second delay
    this.maxRetries = 3
  }

  // Initialize Google API client
  async initialize() {
    if (this.isInitialized) {
      return true
    }

    if (this.isMockMode) {
      console.log('Running in mock mode - Google Drive API disabled')
      this.isInitialized = true
      return true
    }

    // Check if gapi is available and properly loaded
    if (typeof gapi === 'undefined' || !gapi.auth2) {
      console.warn('Google API not properly loaded, switching to mock mode')
      this.isMockMode = true
      this.isInitialized = true
      return true
    }

    try {
      await new Promise((resolve, reject) => {
        gapi.load('client:auth2', async () => {
          try {
            await gapi.client.init({
              clientId: this.clientId,
              scope: this.scope,
              discoveryDocs: this.discoveryDocs
            })

            this.authInstance = gapi.auth2.getAuthInstance()
            this.driveService = gapi.client.drive
            this.isInitialized = true

            // Set up auth state listener only if auth instance exists
            if (this.authInstance && this.authInstance.isSignedIn) {
              this.authInstance.isSignedIn.listen((isSignedIn) => {
                if (!isSignedIn) {
                  this.handleSignOut()
                }
              })
            }

            resolve()
          } catch (error) {
            reject(error)
          }
        })
      })

      return true
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error)
      // Fall back to mock mode on error
      this.isMockMode = true
      this.isInitialized = true
      return true
    }
  }

  // Authentication methods
  async signIn() {
    if (this.isMockMode) {
      console.log('Mock sign in successful')
      return { success: true, user: { email: 'mock@example.com', name: 'Mock User' } }
    }

    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) {
        return { success: false, error: 'Failed to initialize Google Drive service' }
      }
    }

    if (!this.authInstance) {
      console.error('Google Auth not initialized')
      return { success: false, error: 'Google Auth not initialized' }
    }

    try {
      const googleUser = await this.authInstance.signIn()
      const profile = googleUser.getBasicProfile()
      
      return {
        success: true,
        user: {
          id: profile.getId(),
          email: profile.getEmail(),
          name: profile.getName(),
          imageUrl: profile.getImageUrl()
        }
      }
    } catch (error) {
      console.error('Sign in failed:', error)
      return { success: false, error: error.message }
    }
  }

  async signOut() {
    if (this.isMockMode) {
      return { success: true }
    }

    try {
      await this.authInstance.signOut()
      return { success: true }
    } catch (error) {
      console.error('Sign out failed:', error)
      return { success: false, error: error.message }
    }
  }

  isSignedIn() {
    if (this.isMockMode) {
      return true
    }
    return this.authInstance?.isSignedIn()?.get() || false
  }

  getCurrentUser() {
    if (this.isMockMode) {
      return { email: 'mock@example.com', name: 'Mock User' }
    }

    const user = this.authInstance?.currentUser?.get()
    if (!user) return null

    const profile = user.getBasicProfile()
    return {
      id: profile.getId(),
      email: profile.getEmail(),
      name: profile.getName(),
      imageUrl: profile.getImageUrl()
    }
  }

  // Rate limiting and request queue management
  async executeRequest(requestFn) {
    if (this.isMockMode) {
      return this.mockRequest(requestFn)
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        requestFn,
        resolve,
        reject,
        retries: 0
      })

      if (!this.isProcessingQueue) {
        this.processQueue()
      }
    })
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()
      
      try {
        // Apply rate limiting delay
        if (this.rateLimitDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay))
        }

        const result = await request.requestFn()
        request.resolve(result)
        
        // Reset delay on success
        this.rateLimitDelay = 1000
      } catch (error) {
        if (error.status === 429 && request.retries < this.maxRetries) {
          // Rate limited - exponential backoff
          this.rateLimitDelay = Math.min(this.rateLimitDelay * 2, 8000)
          request.retries++
          this.requestQueue.unshift(request)
        } else {
          request.reject(error)
        }
      }
    }

    this.isProcessingQueue = false
  }

  // File operations
  async createFile(fileName, content, mimeType = 'application/json') {
    return this.executeRequest(async () => {
      const fileMetadata = {
        name: fileName,
        parents: ['appDataFolder']
      }

      const media = {
        mimeType: mimeType,
        body: typeof content === 'string' ? content : JSON.stringify(content)
      }

      const response = await this.driveService.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,size,modifiedTime'
      })

      return response.result
    })
  }

  async getFile(fileId) {
    if (this.isMockMode) {
      // Return mock file content from localStorage
      if (fileId === 'mock-config-id') {
        const mockConfig = localStorage.getItem('mock_config')
        return mockConfig || null
      } else if (fileId.startsWith('mock-tracking-')) {
        const month = fileId.replace('mock-tracking-', '')
        const mockData = localStorage.getItem(`mock_tracking_${month}`)
        return mockData || null
      }
      return null
    }

    return this.executeRequest(async () => {
      const response = await this.driveService.files.get({
        fileId: fileId,
        alt: 'media'
      })

      return response.body
    })
  }

  async updateFile(fileId, content, mimeType = 'application/json') {
    return this.executeRequest(async () => {
      const media = {
        mimeType: mimeType,
        body: typeof content === 'string' ? content : JSON.stringify(content)
      }

      const response = await this.driveService.files.update({
        fileId: fileId,
        media: media,
        fields: 'id,name,size,modifiedTime'
      })

      return response.result
    })
  }

  async listFiles(query = '') {
    if (this.isMockMode) {
      // Return mock file list based on query
      const mockFiles = []
      
      if (query.includes('config.json')) {
        const hasConfig = localStorage.getItem('mock_config')
        if (hasConfig) {
          mockFiles.push({
            id: 'mock-config-id',
            name: 'config.json',
            size: hasConfig.length,
            modifiedTime: new Date().toISOString()
          })
        }
      } else if (query.includes('tracking-my-hot-self_')) {
        // Return mock tracking files
        const currentMonth = new Date().toISOString().slice(0, 7)
        mockFiles.push({
          id: `mock-tracking-${currentMonth}`,
          name: `tracking-my-hot-self_${currentMonth}.json`,
          size: 1024,
          modifiedTime: new Date().toISOString()
        })
      }
      
      return mockFiles
    }

    return this.executeRequest(async () => {
      const response = await this.driveService.files.list({
        spaces: 'appDataFolder',
        fields: 'files(id,name,size,modifiedTime)',
        q: query
      })

      return response.result.files
    })
  }

  async deleteFile(fileId) {
    return this.executeRequest(async () => {
      await this.driveService.files.delete({
        fileId: fileId
      })

      return { success: true }
    })
  }

  // App-specific file operations
  async getConfigFile() {
    if (this.isMockMode) {
      // Return mock config or null for new users
      const mockConfig = localStorage.getItem('mock_config')
      return mockConfig ? JSON.parse(mockConfig) : null
    }

    try {
      const files = await this.listFiles("name='config.json'")
      if (files.length === 0) {
        return null
      }

      const content = await this.getFile(files[0].id)
      return JSON.parse(content)
    } catch (error) {
      console.error('Failed to get config file:', error)
      return null
    }
  }

  async saveConfigFile(config) {
    if (this.isMockMode) {
      // Save to localStorage in mock mode
      localStorage.setItem('mock_config', JSON.stringify(config))
      console.log('Mock config saved to localStorage')
      return { success: true, mock: true }
    }

    try {
      const files = await this.listFiles("name='config.json'")
      
      if (files.length === 0) {
        // Create new config file
        return await this.createFile('config.json', config)
      } else {
        // Update existing config file
        return await this.updateFile(files[0].id, config)
      }
    } catch (error) {
      console.error('Failed to save config file:', error)
      throw error
    }
  }

  async getMonthlyTrackingFile(month) {
    try {
      const fileName = `tracking-my-hot-self_${month}.json`
      const files = await this.listFiles(`name='${fileName}'`)
      
      if (files.length === 0) {
        return null
      }

      const content = await this.getFile(files[0].id)
      return JSON.parse(content)
    } catch (error) {
      console.error(`Failed to get monthly tracking file for ${month}:`, error)
      return null
    }
  }

  async saveMonthlyTrackingFile(month, data) {
    if (this.isMockMode) {
      // Save to localStorage in mock mode
      localStorage.setItem(`mock_tracking_${month}`, JSON.stringify(data))
      console.log(`Mock tracking data saved for ${month}`)
      return { success: true, mock: true }
    }

    try {
      const fileName = `tracking-my-hot-self_${month}.json`
      const files = await this.listFiles(`name='${fileName}'`)
      
      if (files.length === 0) {
        // Create new monthly file
        return await this.createFile(fileName, data)
      } else {
        // Update existing monthly file
        return await this.updateFile(files[0].id, data)
      }
    } catch (error) {
      console.error(`Failed to save monthly tracking file for ${month}:`, error)
      throw error
    }
  }

  async listMonthlyFiles() {
    try {
      const files = await this.listFiles("name contains 'tracking-my-hot-self_'")
      return files.sort((a, b) => b.name.localeCompare(a.name))
    } catch (error) {
      console.error('Failed to list monthly files:', error)
      return []
    }
  }

  // Offline sync support
  async syncOfflineEntries(offlineEntries) {
    if (offlineEntries.length === 0) {
      return { success: true, synced: 0 }
    }

    const results = []
    let syncedCount = 0

    for (const entry of offlineEntries) {
      try {
        const month = new Date(entry.timestamp).toISOString().slice(0, 7)
        const monthlyData = await this.getMonthlyTrackingFile(month) || {
          version: '1.0.0',
          month: month,
          file_part: 1,
          estimated_size_kb: 0,
          entries: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Add or update entry
        const existingIndex = monthlyData.entries.findIndex(e => e.id === entry.id)
        if (existingIndex >= 0) {
          monthlyData.entries[existingIndex] = { ...entry, sync_status: 'synced' }
        } else {
          monthlyData.entries.push({ ...entry, sync_status: 'synced' })
        }

        // Update file metadata
        monthlyData.updated_at = new Date().toISOString()
        monthlyData.estimated_size_kb = Math.round(JSON.stringify(monthlyData).length / 1024)

        await this.saveMonthlyTrackingFile(month, monthlyData)
        syncedCount++
        results.push({ id: entry.id, success: true })
      } catch (error) {
        console.error(`Failed to sync entry ${entry.id}:`, error)
        results.push({ id: entry.id, success: false, error: error.message })
      }
    }

    return { success: true, synced: syncedCount, results }
  }

  // Error handling
  handleSignOut() {
    // Clear any cached data or reset state
    console.log('User signed out')
  }

  // Mock mode support
  async mockRequest(requestFn) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
    
    // Simulate occasional failures
    if (Math.random() < 0.05) {
      throw new Error('Mock network error')
    }

    // Don't call the actual requestFn in mock mode
    // Instead, return mock data based on the operation
    console.log('Mock request executed')
    return { success: true, mock: true }
  }

  // Utility methods
  async getQuotaUsage() {
    if (this.isMockMode) {
      return { used: '1.2 MB', total: '15 GB' }
    }

    try {
      const response = await this.driveService.about.get({
        fields: 'storageQuota'
      })
      return response.result.storageQuota
    } catch (error) {
      console.error('Failed to get quota usage:', error)
      return null
    }
  }

  async checkFileExists(fileName) {
    try {
      const files = await this.listFiles(`name='${fileName}'`)
      return files.length > 0
    } catch (error) {
      console.error('Failed to check file existence:', error)
      return false
    }
  }

  // Compression utilities
  async compressData(data) {
    // Simple compression for large files
    const jsonString = JSON.stringify(data)
    if (jsonString.length > 50000) { // 50KB threshold
      // In a real implementation, you'd use a compression library
      // For now, we'll just return the original data
      console.log('Data compression would be applied here')
    }
    return data
  }

  async decompressData(data) {
    // Decompress data if needed
    return data
  }
}

// Create singleton instance
const googleDriveService = new GoogleDriveService()

export default googleDriveService 