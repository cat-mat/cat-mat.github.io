import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '../stores/appStore.js'
import { format } from 'date-fns'
import TrackingForm from './TrackingForm.jsx'
import LoadingSpinner from './LoadingSpinner.jsx'
import { clsx } from 'clsx'
import { useBannerContext } from './ServiceWorkerManager.jsx'

const Dashboard = () => {
  const { 
    auth, 
    config, 
    ui,
    trackingData, 
    signIn, 
    signOut, 
    loadConfig, 
    clearCorruptedConfig,
    exportConfig,
    importConfig,
    setCurrentView,
    addNotification 
  } = useAppStore()
  
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false)
  const [configImportError, setConfigImportError] = useState('')
  const [isConfigImporting, setIsConfigImporting] = useState(false)
  const [configImportSuccess, setConfigImportSuccess] = useState('')
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { bannerHeight } = useBannerContext()

  const { user } = auth
  const { currentView } = ui
  const { entries, isLoading } = trackingData

  // Get today's entries
  const today = format(new Date(), 'yyyy-MM-dd')
  const todaysEntries = entries.filter(entry => {
    // Ensure timestamp is a string before calling startsWith
    const timestamp = typeof entry.timestamp === 'string' 
      ? entry.timestamp 
      : entry.timestamp?.toISOString?.() || String(entry.timestamp || '')
    return timestamp.startsWith(today)
  })

  // Get current view entries
  const currentViewEntries = todaysEntries.filter(entry => entry.type === currentView)

  const handleSignOut = async () => {
    try {
      await signOut()
      addNotification({
        type: 'success',
        title: 'Signed out',
        message: 'You have been successfully signed out.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Sign out failed',
        message: 'There was an error signing out. Please try again.'
      })
    }
  }

  const handleClearConfig = async () => {
    try {
      await clearCorruptedConfig()
      addNotification({
        type: 'success',
        title: 'Configuration cleared',
        message: 'Your configuration has been reset to defaults.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Clear failed',
        message: 'Failed to clear configuration. Please try again.'
      })
    }
  }

  const handleExportConfig = () => {
    try {
      exportConfig()
      addNotification({
        type: 'success',
        title: 'Configuration exported',
        message: 'Your configuration has been exported successfully.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export failed',
        message: 'Failed to export configuration. Please try again.'
      })
    }
  }

  const handleImportConfig = async (file) => {
    try {
      setConfigImportError('')
      setConfigImportSuccess('')
      setIsConfigImporting(true)
      
      const text = await file.text()
      const importData = JSON.parse(text)
      
      const result = await importConfig(importData)
      
      const successMessage = 'Your configuration has been imported successfully.'
      
      addNotification({
        type: 'success',
        title: 'Configuration imported',
        message: successMessage
      })
      
      // Set prominent success message
      setConfigImportSuccess(successMessage)
      
      setShowImportModal(false)
    } catch (error) {
      console.error('Config import error:', error)
      setConfigImportError(error.message || 'Failed to import configuration. Please check the file format.')
    } finally {
      setIsConfigImporting(false)
    }
  }

  const handleConfigFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      handleImportConfig(file)
    }
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'morning':
        return 'Morning Report'
      case 'evening':
        return 'Evening Report'
      case 'quick':
        return 'Quick Track'
      default:
        return 'Tracking'
    }
  }

  const getViewIcon = () => {
    switch (currentView) {
      case 'morning':
        return '🌻'
      case 'evening':
        return '🌙'
      case 'quick':
        return '⚡'
      default:
        return '🌸'
    }
  }

  return (
    <div className="min-h-screen">
              {/* Header */}
        <header className="sticky top-0 z-40 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 shadow-wildflower"
          style={{ top: bannerHeight }}
        >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl mr-3 animate-bloom">🐦‍🔥 ❤️‍🔥</div>
              <h1 className="text-xl font-bold text-white wildflower-text-shadow">
                What Even With My Hot Self?!
              </h1>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-cream-500 rounded-xl shadow-wildflower py-1 z-50 border border-cream-400">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-cream-300">
                    <div className="font-medium">{user?.name || 'User'}</div>
                    <div className="text-gray-500">{user?.email}</div>
                  </div>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream-400 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    🌸 Settings
                  </Link>
                  <Link
                    to="/insights"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream-400 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📊 Insights
                  </Link>
                  <Link
                    to="/logs"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream-400 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📝 Logs
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleExportConfig()
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cream-400 transition-colors duration-200"
                  >
                    📤 Export Config
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      setConfigImportError('')
                      setConfigImportSuccess('')
                      setShowImportModal(true)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cream-400 transition-colors duration-200"
                  >
                    📥 Import Config
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      setShowResetConfirmModal(true)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    🔄 Reset Config
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleSignOut()
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cream-400 transition-colors duration-200"
                  >
                    🚪 Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

              {/* Main content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Date header */}
        <div className="mb-6 meadow-card">
          <h2 className="text-2xl font-bold text-gray-800 wildflower-text-shadow">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </h2>
          <p className="text-gray-600">
            {currentViewEntries.length > 0 
              ? `${currentViewEntries.length} ${currentViewEntries.length !== 1 ? 'entries' : 'entry'} today`
              : 'No entries yet today'
            }
          </p>
        </div>

        {/* Success Banner */}
        {configImportSuccess && (
          <div className="mb-6 meadow-card bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-green-600 mr-3 text-xl">✅</div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Configuration Imported!</h3>
                  <p className="text-green-700">{configImportSuccess}</p>
                </div>
              </div>
              <button
                onClick={() => setConfigImportSuccess('')}
                className="text-green-600 hover:text-green-800"
                title="Dismiss success message"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* View selector */}
        <div className="mb-8">
          <div className="flex space-x-3">
            {['morning', 'quick', 'evening'].map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={clsx(
                  'flex-1 py-4 px-4 rounded-xl border-2 transition-all duration-300 hover:shadow-medium',
                  currentView === view
                    ? 'border-primary-500 bg-gradient-to-br from-primary-100 to-primary-50 text-primary-700 shadow-medium'
                    : 'border-cream-400 bg-cream-500 text-gray-700 hover:border-primary-300 hover:bg-cream-400'
                )}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2 animate-bloom">
                    {view === 'morning' ? '🌻' : view === 'evening' ? '🌙' : '⚡'}
                  </div>
                  <div className="text-sm font-medium capitalize">{view}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current view content */}
        <div className="mb-8">
          <div className="meadow-card">
            <div className="section-header">
              <div className="flex items-center">
                <span className="text-3xl mr-3 animate-bloom">{getViewIcon()}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {getViewTitle()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {currentView === 'morning' && 'Start your day by tracking sleep and energy'}
                    {currentView === 'evening' && 'End your day with reflection and sentiment'}
                    {currentView === 'quick' && 'Add timestamped entries throughout the day'}
                  </p>
                </div>
              </div>
            </div>

            <div className="section-content">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="large" />
                </div>
              ) : (
                <TrackingForm key={currentView} viewType={currentView} />
              )}
            </div>
          </div>
        </div>

        {/* Today's summary */}
        {todaysEntries.length > 0 && (
          <div className="meadow-card">
            <div className="section-header">
              <h3 className="text-lg font-semibold text-gray-800">Today's Summary</h3>
            </div>
            <div className="section-content">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['morning', 'quick', 'evening'].map((view) => {
                  const viewEntries = todaysEntries.filter(entry => entry.type === view)
                  return (
                    <div key={view} className="text-center p-4 rounded-xl bg-gradient-to-br from-meadow-50 to-meadow-100 border border-meadow-200 transition-all duration-300">
                      <div className="text-3xl mb-2 animate-bloom">
                        {view === 'morning' ? '🌻' : view === 'evening' ? '🌙' : '⚡'}
                      </div>
                      <div className="text-sm font-medium text-gray-800 capitalize">{view}</div>
                      <div className="text-lg font-semibold text-primary-600">
                        {viewEntries.length}
                      </div>
                      <div className="text-xs text-gray-500">entries</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-cream-500 border-t border-cream-400 md:hidden z-50 shadow-wildflower">
        <div className="flex justify-around">
          <button
            onClick={() => setCurrentView('morning')}
            className={clsx(
              'flex-1 py-3 px-2 text-center transition-all duration-200',
              currentView === 'morning' ? 'text-primary-600' : 'text-gray-600'
            )}
          >
            <div className="text-xl mb-1 animate-bloom">🌻</div>
            <div className="text-xs">Morning</div>
          </button>
          <button
            onClick={() => setCurrentView('quick')}
            className={clsx(
              'flex-1 py-3 px-2 text-center transition-all duration-200',
              currentView === 'quick' ? 'text-primary-600' : 'text-gray-600'
            )}
          >
            <div className="text-xl mb-1 animate-bloom">⚡</div>
            <div className="text-xs">Quick</div>
          </button>
          <button
            onClick={() => setCurrentView('evening')}
            className={clsx(
              'flex-1 py-3 px-2 text-center transition-all duration-200',
              currentView === 'evening' ? 'text-primary-600' : 'text-gray-600'
            )}
          >
            <div className="text-xl mb-1 animate-bloom">🌙</div>
            <div className="text-xs">Evening</div>
          </button>
        </div>
      </nav>

      {/* Configuration Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="meadow-card max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Import Configuration</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="configImportFile" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Configuration File to Import
                </label>
                <input
                  type="file"
                  id="configImportFile"
                  accept=".json"
                  onChange={handleConfigFileSelect}
                  className="input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-2 text-sm text-gray-600">
                  Select a JSON file containing configuration data to import.
                  This will replace your current configuration.
                </p>
              </div>
              
              {/* Error Display */}
              {configImportError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="text-red-600 mr-3 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="text-sm font-medium text-red-800 mb-1">Import Error</h4>
                      <p className="text-sm text-red-700">{configImportError}</p>
                      <p className="text-xs text-red-600 mt-2">
                        Please check that your file is a valid configuration export from this application.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Loading State */}
              {isConfigImporting && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
                    <p className="text-sm text-blue-800">Importing configuration...</p>
                  </div>
                </div>
              )}
              
              {/* Success Display */}
              {configImportSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="text-green-600 mr-3 mt-0.5">✅</div>
                    <div>
                      <h4 className="text-sm font-medium text-green-800 mb-1">Import Successful</h4>
                      <p className="text-sm text-green-700">{configImportSuccess}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                <p className="font-medium mb-2">⚠️ Warning:</p>
                <p>• <strong>Backup First:</strong> Export your current configuration before importing</p>
                <p>• <strong>Replacement:</strong> Imported configuration will replace your current settings</p>
                <p>• <strong>Validation:</strong> Invalid configuration files will be rejected</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="btn-secondary px-4 py-2"
                disabled={isConfigImporting}
              >
                Cancel
              </button>
              <button
                onClick={() => document.getElementById('configImportFile').click()}
                className="btn-primary px-4 py-2"
                disabled={isConfigImporting}
              >
                {isConfigImporting ? 'Importing...' : 'Select File & Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Configuration Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="meadow-card max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reset Configuration</h3>
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="text-red-600 mr-3 mt-0.5">⚠️</div>
                  <div>
                    <h4 className="text-sm font-medium text-red-800 mb-2">Are you sure?</h4>
                    <p className="text-sm text-red-700 mb-2">
                      This will reset your configuration to default values. This action cannot be undone.
                    </p>
                    <p className="text-xs text-red-600">
                      Consider exporting your current configuration first if you want to save it.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p><strong>What will be reset:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All custom tracking fields and categories</li>
                  <li>Form configurations and layouts</li>
                  <li>User preferences and settings</li>
                  <li>Custom validation rules</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResetConfirmModal(false)
                  handleClearConfig()
                }}
                className="btn-danger px-4 py-2"
              >
                Yes, Reset Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard 