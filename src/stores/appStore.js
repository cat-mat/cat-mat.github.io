import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { subscribeWithSelector } from 'zustand/middleware'
import googleDriveService from '../services/googleDriveService.js'
import { validateEntry, validateConfig, sanitizeEntry, migrateData } from '../utils/validation.js'
import { TRACKING_ITEMS, DEFAULT_VIEW_TIMES, SYNC_STATUS } from '../constants/trackingItems.js'

// Default configuration
const getDefaultConfig = (userEmail) => ({
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
            // Alphabetized body items with morning: true
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
            // Alphabetized mind items with morning: true
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
            // Alphabetized body items with evening: true
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
            // Alphabetized mind items with evening: true
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
            // Alphabetized body items with quick: true
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
            // Alphabetized mind items with quick: true
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
})

// Create the main app store
export const useAppStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Authentication state
        auth: {
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null
        },

        // Configuration state
        config: null,
        configLoading: false,
        configError: null,

        // Tracking data state
        trackingData: {
          currentMonth: null,
          entries: [],
          offlineEntries: [],
          isLoading: false,
          error: null
        },

        // Sync state
        sync: {
          isOnline: navigator.onLine,
          isSyncing: false,
          lastSyncTime: null,
          syncErrors: []
        },

        // UI state
        ui: {
          currentView: 'morning', // morning, evening, quick
          isLoading: false,
          notifications: [],
          modals: {
            settings: false,
            onboarding: false,
            insights: false
          }
        },

        // Authentication actions
        signIn: async () => {
          set(state => ({
            auth: { ...state.auth, isLoading: true, error: null }
          }))

          try {
            const result = await googleDriveService.signIn()
            
            if (result.success) {
              set(state => ({
                auth: {
                  isAuthenticated: true,
                  user: result.user,
                  isLoading: false,
                  error: null
                }
              }))

              // Load configuration after successful sign in
              get().loadConfig()
            } else {
              set(state => ({
                auth: {
                  ...state.auth,
                  isLoading: false,
                  error: result.error
                }
              }))
            }
          } catch (error) {
            set(state => ({
              auth: {
                ...state.auth,
                isLoading: false,
                error: error.message
              }
            }))
          }
        },

        signOut: async () => {
          try {
            await googleDriveService.signOut()
            set({
              auth: {
                isAuthenticated: false,
                user: null,
                isLoading: false,
                error: null
              },
              config: null,
              trackingData: {
                currentMonth: null,
                entries: [],
                offlineEntries: [],
                isLoading: false,
                error: null
              }
            })
          } catch (error) {
            console.error('Sign out error:', error)
          }
        },

        // Configuration actions
        loadConfig: async () => {
          const { auth } = get()
          if (!auth.isAuthenticated) return

          console.log('Loading config for user:', auth.user.email)

          set(state => ({
            configLoading: true,
            configError: null
          }))

          try {
            let config = await googleDriveService.getConfigFile()
            console.log('Retrieved config:', config)
            
            if (!config) {
              // Create default config for new user
              config = getDefaultConfig(auth.user.email)
              console.log('Created default config:', config)
              await googleDriveService.saveConfigFile(config)
            } else {
              // Migrate config if needed
              config = migrateData(config)
            }

            // Validate config
            const validation = validateConfig(config)
            if (!validation.isValid) {
              throw new Error(`Invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`)
            }

            console.log('Setting config:', validation.data)

            set({
              config: validation.data,
              configLoading: false,
              configError: null
            })

            // Load tracking data after config is loaded
            get().loadCurrentMonthData()
          } catch (error) {
            console.error('Config loading error:', error)
            set(state => ({
              configLoading: false,
              configError: error.message
            }))
          }
        },

        updateConfig: async (updates) => {
          const { config } = get()
          if (!config) return

          const updatedConfig = {
            ...config,
            ...updates,
            updated_at: new Date().toISOString()
          }

          // Validate updated config
          const validation = validateConfig(updatedConfig)
          if (!validation.isValid) {
            throw new Error(`Invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`)
          }

          set({ config: validation.data })

          // Save to Google Drive
          try {
            await googleDriveService.saveConfigFile(validation.data)
          } catch (error) {
            console.error('Failed to save config:', error)
            // Revert changes on save failure
            set({ config })
            throw error
          }
        },

        // Helper function to update display type
        updateDisplayType: async (displayType) => {
          const { config } = get()
          if (!config) return

          console.log('Updating display type to:', displayType)

          const updatedConfig = {
            ...config,
            display_options: {
              ...config.display_options,
              item_display_type: displayType
            },
            updated_at: new Date().toISOString()
          }

          // Validate updated config
          const validation = validateConfig(updatedConfig)
          if (!validation.isValid) {
            throw new Error(`Invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`)
          }

          set({ config: validation.data })

          // Save to Google Drive
          try {
            await googleDriveService.saveConfigFile(validation.data)
            console.log('Display type updated successfully')
          } catch (error) {
            console.error('Failed to save display type:', error)
            // Revert changes on save failure
            set({ config })
            throw error
          }
        },

        // Helper function to force update view configuration
        forceUpdateViewConfig: async () => {
          const { config } = get()
          if (!config) return

          console.log('Force updating view configuration...')

          const updatedConfig = {
            ...config,
            view_configurations: {
              morning_report: {
                sections: {
                  body: {
                    items: ['energy_level', 'sleep_quality'],
                    sort_order: ['sleep_quality', 'energy_level'],
                    visible: true,
                    collapsed: false
                  },
                  mind: {
                    items: ['mood'],
                    sort_order: ['mood'],
                    visible: true,
                    collapsed: false
                  }
                },
                wearables: ['wearables_sleep_score', 'wearables_body_battery']
              },
              evening_report: {
                sections: {
                  body: {
                    items: ['energy_level', 'irritability', 'mood'],
                    sort_order: ['energy_level', 'irritability', 'mood'],
                    visible: true,
                    collapsed: false
                  },
                  mind: {
                    items: ['mood', 'overall_sentiment', 'stress_level'],
                    sort_order: ['mood', 'overall_sentiment', 'stress_level'],
                    visible: true,
                    collapsed: false
                  }
                }
              },
              quick_track: {
                sections: {
                  body: {
                    items: ['energy_level', 'forehead_shine', 'headache', 'hot_flashes', 'joint_pain', 'nausea', 'temperature_sensitivity', 'workout_recovery'],
                    sort_order: ['energy_level', 'forehead_shine', 'headache', 'hot_flashes', 'joint_pain', 'nausea', 'temperature_sensitivity', 'workout_recovery'],
                    visible: true,
                    collapsed: false
                  },
                  mind: {
                    items: ['anxiety', 'brain_fog', 'depression', 'irritability', 'mood', 'stress_level'],
                    sort_order: ['anxiety', 'brain_fog', 'depression', 'irritability', 'mood', 'stress_level'],
                    visible: true,
                    collapsed: false
                  }
                }
              }
            },
            updated_at: new Date().toISOString()
          }

          // Validate updated config
          const validation = validateConfig(updatedConfig)
          if (!validation.isValid) {
            throw new Error(`Invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`)
          }

          set({ config: validation.data })

          // Save to Google Drive
          try {
            await googleDriveService.saveConfigFile(validation.data)
            console.log('View configuration updated successfully')
          } catch (error) {
            console.error('Failed to save view configuration:', error)
            // Revert changes on save failure
            set({ config })
            throw error
          }
        },

        // Helper function to clear corrupted configuration
        clearCorruptedConfig: async () => {
          const { auth } = get()
          if (!auth.isAuthenticated) return

          console.log('Clearing corrupted configuration...')

          try {
            // Create fresh config (this will overwrite the existing one)
            const freshConfig = getDefaultConfig(auth.user.email)
            await googleDriveService.saveConfigFile(freshConfig)
            
            // Update local state
            set({
              config: freshConfig,
              configLoading: false,
              configError: null
            })
            
            console.log('Configuration cleared and recreated successfully')
          } catch (error) {
            console.error('Failed to clear configuration:', error)
            throw error
          }
        },

        // Generate test data for date range testing
        generateTestData: () => {
          console.log('Generating test data for date range testing...')
          
          const testData = []
          const now = new Date()
          
          // Helper to get items by type
          const getItemsByType = (type) => {
            return Object.values(TRACKING_ITEMS).filter(item => item[type])
          }

          // Helper to generate a random value for an item
          const getRandomValue = (item) => {
            if (item.type === 'multi-select') {
              // Pick 1-3 random options
              const options = item.options || []
              const count = Math.floor(Math.random() * 3) + 1
              return options.sort(() => 0.5 - Math.random()).slice(0, count)
            } else if (item.type === 'number' && item.min !== undefined && item.max !== undefined) {
              return Math.floor(Math.random() * (item.max - item.min + 1)) + item.min
            } else if (item.type === 'date') {
              // Generate a recent date string in MM/DD/YYYY format (within the last 60 days)
              const daysAgo = Math.floor(Math.random() * 60)
              const d = new Date()
              d.setDate(d.getDate() - daysAgo)
              const mm = String(d.getMonth() + 1).padStart(2, '0')
              const dd = String(d.getDate()).padStart(2, '0')
              const yyyy = d.getFullYear()
              return `${mm}/${dd}/${yyyy}`
            } else if (item.scale) {
              return Math.floor(Math.random() * item.scale) + 1
            } else {
              return null
            }
          }

          // Generate data for a wider range: 30 days in the past to 10 days in the future
          for (let i = -60; i <= 10; i++) {
            const date = new Date(now)
            date.setDate(date.getDate() + i)
            
            const dateStr = date.toISOString().slice(0, 10)
            const timestamp = date.toISOString()
            
            // Generate morning entry (randomly)
            if (Math.random() < 0.4) { // 40% chance
              const morningItems = getItemsByType('morning')
              const entry = {
                id: `test_morning_${dateStr}`,
                timestamp: timestamp,
                type: 'morning',
                sync_status: 'synced',
                timezone: 'America/Los_Angeles',
                is_deleted: false,
                created_at: timestamp,
                updated_at: timestamp
              }
              morningItems.forEach(item => {
                entry[item.id] = getRandomValue(item)
              })
              testData.push(entry)
            }
            
            // Generate evening entry (randomly)
            if (Math.random() < 0.4) { // 40% chance
              const eveningItems = getItemsByType('evening')
              const entry = {
                id: `test_evening_${dateStr}`,
                timestamp: timestamp,
                type: 'evening',
                sync_status: 'synced',
                timezone: 'America/Los_Angeles',
                is_deleted: false,
                created_at: timestamp,
                updated_at: timestamp
              }
              eveningItems.forEach(item => {
                entry[item.id] = getRandomValue(item)
              })
              // Add notes for evening
              entry.notes = {
                observations: `Test observation for ${dateStr}`,
                reflections: `Test reflection for ${dateStr}`,
                thankful_for: `Test gratitude for ${dateStr}`
              }
              testData.push(entry)
            }
            
            // Generate 1-3 quick entries during the day
            const quickCount = Math.floor(Math.random() * 3) + 1
            for (let j = 0; j < quickCount; j++) {
              const quickTime = new Date(date)
              quickTime.setHours(10 + Math.floor(Math.random() * 9)) // 10 AM - 7 PM
              quickTime.setMinutes(Math.floor(Math.random() * 60))
              const quickItems = getItemsByType('quick')
              const entry = {
                id: `test_quick_${dateStr}_${j}`,
                timestamp: quickTime.toISOString(),
                type: 'quick',
                sync_status: 'synced',
                timezone: 'America/Los_Angeles',
                is_deleted: false,
                created_at: quickTime.toISOString(),
                updated_at: quickTime.toISOString()
              }
              quickItems.forEach(item => {
                entry[item.id] = getRandomValue(item)
              })
              testData.push(entry)
            }
          }
          
          // Group data by month and save to localStorage
          const monthlyData = {}
          testData.forEach(entry => {
            const month = entry.timestamp.slice(0, 7) // YYYY-MM
            if (!monthlyData[month]) {
              monthlyData[month] = {
                version: '1.0.0',
                month: month,
                file_part: 1,
                estimated_size_kb: 0,
                entries: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            }
            monthlyData[month].entries.push(entry)
          })
          
          // Save each month's data
          Object.entries(monthlyData).forEach(([month, data]) => {
            data.estimated_size_kb = Math.round(JSON.stringify(data).length / 1024)
            localStorage.setItem(`mock_tracking_${month}`, JSON.stringify(data))
          })
          
          // Update current tracking data
          const currentMonth = now.toISOString().slice(0, 7)
          const currentMonthData = monthlyData[currentMonth] || { entries: [] }
          
          set(state => ({
            trackingData: {
              ...state.trackingData,
              entries: currentMonthData.entries
            }
          }))
          
          console.log(`Generated ${testData.length} test entries across ${Object.keys(monthlyData).length} months`)
          console.log('Test data saved to localStorage. You can now test date range filtering!')
          
          return { success: true, entriesGenerated: testData.length, monthsGenerated: Object.keys(monthlyData).length }
        },

        // Import tracking data
        importTrackingData: async (importData) => {
          const { auth } = get()
          if (!auth.isAuthenticated) {
            throw new Error('User not authenticated')
          }

          console.log('Importing tracking data:', importData)

          try {
            // Validate import data structure
            if (!importData.version || !importData.entries || !Array.isArray(importData.entries)) {
              throw new Error('Invalid import file format')
            }

            // Validate and process entries
            const validEntries = importData.entries.filter(entry => {
              return entry.id && entry.timestamp && entry.type
            })

            if (validEntries.length === 0) {
              throw new Error('No valid entries found in import file')
            }

            // Group entries by month
            const monthlyData = {}
            validEntries.forEach(entry => {
              const month = entry.timestamp.slice(0, 7) // YYYY-MM
              if (!monthlyData[month]) {
                monthlyData[month] = {
                  version: '1.0.0',
                  month: month,
                  file_part: 1,
                  estimated_size_kb: 0,
                  entries: [],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              }
              monthlyData[month].entries.push(entry)
            })

            // Save each month's data
            for (const [month, data] of Object.entries(monthlyData)) {
              data.estimated_size_kb = Math.round(JSON.stringify(data).length / 1024)
              
              if (googleDriveService.isMockMode) {
                // Save to localStorage in mock mode
                localStorage.setItem(`mock_tracking_${month}`, JSON.stringify(data))
              } else {
                // Save to Google Drive
                await googleDriveService.saveMonthlyTrackingFile(month, data)
              }
            }

            // Update current tracking data if current month is in import
            const currentMonth = new Date().toISOString().slice(0, 7)
            const currentMonthData = monthlyData[currentMonth]
            
            if (currentMonthData) {
              set(state => ({
                trackingData: {
                  ...state.trackingData,
                  entries: currentMonthData.entries.filter(entry => !entry.is_deleted)
                }
              }))
            }

            console.log(`Successfully imported ${validEntries.length} entries across ${Object.keys(monthlyData).length} months`)
            
            return {
              success: true,
              entriesImported: validEntries.length,
              monthsImported: Object.keys(monthlyData).length,
              importMetadata: {
                version: importData.version,
                exportedAt: importData.exported_at,
                totalEntries: importData.total_entries
              }
            }
          } catch (error) {
            console.error('Import failed:', error)
            throw error
          }
        },

        // Tracking data actions
        loadCurrentMonthData: async () => {
          const { auth, config } = get()
          if (!auth.isAuthenticated || !config) return

          const currentMonth = new Date().toISOString().slice(0, 7)
          
          set(state => ({
            trackingData: {
              ...state.trackingData,
              currentMonth,
              isLoading: true,
              error: null
            }
          }))

          try {
            const monthlyData = await googleDriveService.getMonthlyTrackingFile(currentMonth)
            
            if (monthlyData) {
              set(state => ({
                trackingData: {
                  ...state.trackingData,
                  currentMonth,
                  entries: monthlyData.entries.filter(entry => !entry.is_deleted),
                  isLoading: false,
                  error: null
                }
              }))
            } else {
              set(state => ({
                trackingData: {
                  ...state.trackingData,
                  currentMonth,
                  entries: [],
                  isLoading: false,
                  error: null
                }
              }))
            }
          } catch (error) {
            set(state => ({
              trackingData: {
                ...state.trackingData,
                isLoading: false,
                error: error.message
              }
            }))
          }
        },

        addEntry: async (entryData) => {
          const { auth, config, trackingData } = get()
          if (!auth.isAuthenticated || !config) return

          // Sanitize and validate entry
          const sanitizedEntry = sanitizeEntry({
            ...entryData,
            type: get().ui.currentView
          })

          const validation = validateEntry(sanitizedEntry)
          if (!validation.isValid) {
            throw new Error(`Invalid entry: ${validation.errors.map(e => e.message).join(', ')}`)
          }

          const entry = validation.data

          // Add to local state immediately
          set(state => ({
            trackingData: {
              ...state.trackingData,
              entries: [...state.trackingData.entries, entry]
            }
          }))

          // Try to sync immediately if online
          if (get().sync.isOnline) {
            try {
              await get().syncEntry(entry)
            } catch (error) {
              console.error('Failed to sync entry:', error)
              // Entry will be synced later when online
            }
          } else {
            // Add to offline queue
            set(state => ({
              trackingData: {
                ...state.trackingData,
                offlineEntries: [...state.trackingData.offlineEntries, entry]
              }
            }))
          }

          return entry
        },

        updateEntry: async (entryId, updates) => {
          const { trackingData } = get()
          
          const entryIndex = trackingData.entries.findIndex(entry => entry.id === entryId)
          if (entryIndex === -1) return

          const updatedEntry = {
            ...trackingData.entries[entryIndex],
            ...updates,
            updated_at: new Date().toISOString(),
            sync_status: SYNC_STATUS.pending
          }

          // Validate updated entry
          const validation = validateEntry(updatedEntry)
          if (!validation.isValid) {
            throw new Error(`Invalid entry: ${validation.errors.map(e => e.message).join(', ')}`)
          }

          // Update local state
          const newEntries = [...trackingData.entries]
          newEntries[entryIndex] = validation.data

          set(state => ({
            trackingData: {
              ...state.trackingData,
              entries: newEntries
            }
          }))

          // Try to sync
          if (get().sync.isOnline) {
            try {
              await get().syncEntry(validation.data)
            } catch (error) {
              console.error('Failed to sync updated entry:', error)
            }
          }

          return validation.data
        },

        deleteEntry: async (entryId) => {
          const { trackingData } = get()
          
          const entryIndex = trackingData.entries.findIndex(entry => entry.id === entryId)
          if (entryIndex === -1) return

          // Soft delete
          const deletedEntry = {
            ...trackingData.entries[entryIndex],
            is_deleted: true,
            updated_at: new Date().toISOString(),
            sync_status: SYNC_STATUS.pending
          }

          // Update local state
          const newEntries = [...trackingData.entries]
          newEntries[entryIndex] = deletedEntry

          set(state => ({
            trackingData: {
              ...state.trackingData,
              entries: newEntries
            }
          }))

          // Try to sync
          if (get().sync.isOnline) {
            try {
              await get().syncEntry(deletedEntry)
            } catch (error) {
              console.error('Failed to sync deleted entry:', error)
            }
          }
        },

        restoreEntry: async (entryId) => {
          const { trackingData } = get()
          
          const entryIndex = trackingData.entries.findIndex(entry => entry.id === entryId)
          if (entryIndex === -1) return

          // Restore entry
          const restoredEntry = {
            ...trackingData.entries[entryIndex],
            is_deleted: false,
            updated_at: new Date().toISOString(),
            sync_status: SYNC_STATUS.pending
          }

          // Update local state
          const newEntries = [...trackingData.entries]
          newEntries[entryIndex] = restoredEntry

          set(state => ({
            trackingData: {
              ...state.trackingData,
              entries: newEntries
            }
          }))

          // Try to sync
          if (get().sync.isOnline) {
            try {
              await get().syncEntry(restoredEntry)
            } catch (error) {
              console.error('Failed to sync restored entry:', error)
            }
          }
        },

        // Sync actions
        syncEntry: async (entry) => {
          const { trackingData } = get()
          const month = new Date(entry.timestamp).toISOString().slice(0, 7)

          try {
            // Get or create monthly data
            let monthlyData = await googleDriveService.getMonthlyTrackingFile(month)
            
            if (!monthlyData) {
              monthlyData = {
                version: '1.0.0',
                month: month,
                file_part: 1,
                estimated_size_kb: 0,
                entries: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            }

            // Add or update entry
            const existingIndex = monthlyData.entries.findIndex(e => e.id === entry.id)
            if (existingIndex >= 0) {
              monthlyData.entries[existingIndex] = { ...entry, sync_status: SYNC_STATUS.synced }
            } else {
              monthlyData.entries.push({ ...entry, sync_status: SYNC_STATUS.synced })
            }

            // Update file metadata
            monthlyData.updated_at = new Date().toISOString()
            monthlyData.estimated_size_kb = Math.round(JSON.stringify(monthlyData).length / 1024)

            await googleDriveService.saveMonthlyTrackingFile(month, monthlyData)

            // Update local entry status
            const newEntries = trackingData.entries.map(e => 
              e.id === entry.id ? { ...e, sync_status: SYNC_STATUS.synced } : e
            )

            set(state => ({
              trackingData: {
                ...state.trackingData,
                entries: newEntries
              },
              sync: {
                ...state.sync,
                lastSyncTime: new Date().toISOString()
              }
            }))

          } catch (error) {
            // Mark entry as failed
            const newEntries = trackingData.entries.map(e => 
              e.id === entry.id ? { ...e, sync_status: SYNC_STATUS.failed } : e
            )

            set(state => ({
              trackingData: {
                ...state.trackingData,
                entries: newEntries
              },
              sync: {
                ...state.sync,
                syncErrors: [...state.sync.syncErrors, { entryId: entry.id, error: error.message }]
              }
            }))

            throw error
          }
        },

        syncOfflineEntries: async () => {
          const { trackingData } = get()
          if (trackingData.offlineEntries.length === 0) return

          set(state => ({
            sync: { ...state.sync, isSyncing: true }
          }))

          try {
            const result = await googleDriveService.syncOfflineEntries(trackingData.offlineEntries)
            
            if (result.success) {
              set(state => ({
                trackingData: {
                  ...state.trackingData,
                  offlineEntries: []
                },
                sync: {
                  ...state.sync,
                  isSyncing: false,
                  lastSyncTime: new Date().toISOString()
                }
              }))
            }
          } catch (error) {
            set(state => ({
              sync: {
                ...state.sync,
                isSyncing: false,
                syncErrors: [...state.sync.syncErrors, { error: error.message }]
              }
            }))
          }
        },

        // UI actions
        setCurrentView: (view) => {
          set(state => ({
            ui: { ...state.ui, currentView: view }
          }))
        },

        addNotification: (notification) => {
          const id = Date.now().toString()
          const newNotification = { id, ...notification, timestamp: new Date().toISOString() }
          
          // Check for duplicate notifications (same title and message within last 2 seconds)
          const { ui } = get()
          const recentNotifications = (ui.notifications || []).filter(n => 
            Date.now() - new Date(n.timestamp).getTime() < 2000
          )
          
          const isDuplicate = recentNotifications.some(n => 
            n.title === notification.title && n.message === notification.message
          )
          
          if (isDuplicate) {
            console.log('Skipping duplicate notification:', notification.title)
            return
          }
          
          set(state => ({
            ui: {
              ...state.ui,
              notifications: [...(state.ui.notifications || []), newNotification].slice(-3) // Keep only last 3 notifications
            }
          }))

          // Auto-remove notification after 5 seconds
          setTimeout(() => {
            get().removeNotification(id)
          }, 5000)
        },

        removeNotification: (id) => {
          set(state => ({
            ui: {
              ...state.ui,
              notifications: (state.ui.notifications || []).filter(n => n.id !== id)
            }
          }))
        },

        setModal: (modalName, isOpen) => {
          set(state => ({
            ui: {
              ...state.ui,
              modals: {
                ...state.ui.modals,
                [modalName]: isOpen
              }
            }
          }))
        },

        // Network status
        setOnlineStatus: (isOnline) => {
          set(state => ({
            sync: { ...state.sync, isOnline }
          }))

          // Sync offline entries when coming back online
          if (isOnline && get().trackingData.offlineEntries.length > 0) {
            get().syncOfflineEntries()
          }
        },

        // Utility actions
        clearSyncErrors: () => {
          set(state => ({
            sync: { ...state.sync, syncErrors: [] }
          }))
        },

        getEntriesByDate: (date) => {
          const { trackingData } = get()
          const dateStr = new Date(date).toISOString().split('T')[0]
          
          return trackingData.entries.filter(entry => 
            entry.timestamp.startsWith(dateStr)
          )
        },

        getEntriesByType: (type) => {
          const { trackingData } = get()
          return trackingData.entries.filter(entry => entry.type === type)
        },

        // Load all historical data for logs view
        loadAllHistoricalData: async () => {
          const { auth } = get()
          if (!auth.isAuthenticated) return

          set(state => ({
            trackingData: {
              ...state.trackingData,
              isLoading: true,
              error: null
            }
          }))

          try {
            // Get list of all monthly files
            const monthlyFiles = await googleDriveService.listMonthlyFiles()
            let allEntries = []

            // Load data from each monthly file
            for (const file of monthlyFiles) {
              const month = file.name.match(/tracking-my-hot-self_(\d{4}-\d{2})/)?.[1]
              if (month) {
                const monthlyData = await googleDriveService.getMonthlyTrackingFile(month)
                if (monthlyData && monthlyData.entries) {
                  allEntries = allEntries.concat(monthlyData.entries)
                }
              }
            }

            // Sort by timestamp (newest first)
            allEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

            set(state => ({
              trackingData: {
                ...state.trackingData,
                entries: allEntries,
                isLoading: false,
                error: null
              }
            }))

            console.log(`Loaded ${allEntries.length} historical entries`)
          } catch (error) {
            console.error('Failed to load historical data:', error)
            set(state => ({
              trackingData: {
                ...state.trackingData,
                isLoading: false,
                error: error.message
              }
            }))
          }
        },

        // Export configuration
        exportConfig: () => {
          const { config } = get()
          if (!config) {
            throw new Error('No configuration to export')
          }

          const exportData = {
            version: '1.0.0',
            exported_at: new Date().toISOString(),
            config: config
          }

          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `tracking-config-${new Date().toISOString().slice(0, 10)}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)

          return { success: true, configExported: true }
        },

        // Import configuration
        importConfig: async (importData) => {
          const { auth } = get()
          if (!auth.isAuthenticated) {
            throw new Error('User not authenticated')
          }

          try {
            // Validate import data structure
            if (!importData.version || !importData.config) {
              throw new Error('Invalid configuration file format')
            }

            // Validate the configuration
            const validation = validateConfig(importData.config)
            if (validation.error) {
              throw new Error(`Configuration validation failed: ${validation.error.message}`)
            }

            // Save the imported configuration
            await googleDriveService.saveConfigFile(validation.data)

            // Update local state
            set({
              config: validation.data,
              configLoading: false,
              configError: null
            })

            console.log('Configuration imported successfully')
            
            return {
              success: true,
              configImported: true,
              importMetadata: {
                version: importData.version,
                exportedAt: importData.exported_at
              }
            }
          } catch (error) {
            console.error('Configuration import failed:', error)
            throw error
          }
        }
      }),
      {
        name: 'hot-self-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist auth state as well
          auth: state.auth,
          config: state.config,
          trackingData: {
            entries: state.trackingData.entries,
            offlineEntries: state.trackingData.offlineEntries
          },
          ui: {
            currentView: state.ui.currentView,
            modals: state.ui.modals
          }
        })
      }
    )
  )
)

// Set up network status listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAppStore.getState().setOnlineStatus(true)
  })

  window.addEventListener('offline', () => {
    useAppStore.getState().setOnlineStatus(false)
  })
}

export default useAppStore 