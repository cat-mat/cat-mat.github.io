import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '../stores/app-store.js'
import { format } from 'date-fns'
import MorningView from './morning-view.jsx'
import EveningView from './evening-view.jsx'
import QuickTrackView from './quick-track-view.jsx'
import LoadingSpinner from '../components/loading-spinner.jsx'
import { clsx } from 'clsx'
import { getTimeBasedView } from '../utils/time-based-view.js'
// Removed ServiceWorkerManager import - PWA functionality disabled
import AppHeader from '../components/app-header.jsx';
import ReauthBanner from '../components/reauth-banner.jsx';
import { i18n } from '../utils/i18n.js'

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
  const bannerHeight = 0 // PWA functionality disabled

  const { user } = auth
  const { currentView } = ui
  const { entries, isLoading } = trackingData
  const suggestedView = getTimeBasedView(config)

  // Get today's entries (using local timezone, excluding deleted entries)
  const today = new Date().toLocaleDateString('en-CA') // Returns YYYY-MM-DD in local timezone
  const todaysEntries = entries.filter(entry => {
    // Convert UTC timestamp to local date for comparison
    const entryDate = new Date(entry.timestamp).toLocaleDateString('en-CA')
    return entryDate === today && !entry.is_deleted
  })

  // Get current view entries
  const currentViewEntries = todaysEntries.filter(entry => entry.type === currentView)
  

  const handleSignOut = async () => {
    try {
      await signOut()
      addNotification({
        type: 'success',
        title: i18n.t('toast.signOut.success.title'),
        message: i18n.t('toast.signOut.success.message')
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: i18n.t('toast.signOut.error.title'),
        message: i18n.t('toast.signOut.error.message')
      })
    }
  }

  const handleClearConfig = async () => {
    try {
      await clearCorruptedConfig()
      addNotification({
        type: 'success',
        title: i18n.t('toast.config.cleared.title'),
        message: i18n.t('toast.config.cleared.message')
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: i18n.t('toast.config.clearFailed.title'),
        message: i18n.t('toast.config.clearFailed.message')
      })
    }
  }

  const handleExportConfig = () => {
    try {
      exportConfig()
      addNotification({
        type: 'success',
        title: i18n.t('toast.config.exported.title'),
        message: i18n.t('toast.config.exported.message')
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: i18n.t('toast.config.exportFailed.title'),
        message: i18n.t('toast.config.exportFailed.message')
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
      
      const successMessage = i18n.t('toast.config.imported.message')
      
      addNotification({
        type: 'success',
        title: i18n.t('toast.config.imported.title'),
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
        return i18n.t('dashboard.viewTitle.morning')
      case 'evening':
        return i18n.t('dashboard.viewTitle.evening')
      case 'quick':
        return i18n.t('dashboard.viewTitle.quick')
      default:
        return i18n.t('dashboard.viewTitle.tracking')
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
        <AppHeader
          bannerHeight={bannerHeight}
          onExportConfig={handleExportConfig}
          setShowImportModal={setShowImportModal}
          setShowResetConfirmModal={setShowResetConfirmModal}
          configImportError={configImportError}
          configImportSuccess={configImportSuccess}
        />

              {/* Main content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <ReauthBanner />
        {/* Date header */}
        <div className="mb-6 meadow-card">
          <h2 className="text-2xl font-bold text-gray-800 wildflower-text-shadow">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </h2>
          <p className="text-gray-600">
            {currentViewEntries.length > 0 
              ? `${currentViewEntries.length} ${currentView} ${currentViewEntries.length !== 1 ? 'entries' : 'entry'} today`
              : `No ${currentView} entries yet today`
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
            {['morning', 'quick', 'evening'].map((view) => {
              const isCurrent = currentView === view
              const isSuggested = suggestedView === view
              return (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={clsx(
                    'flex-1 py-4 px-4 rounded-xl border-2 transition-all duration-300 hover:shadow-medium',
                    isCurrent
                      ? 'border-primary-500 bg-gradient-to-br from-primary-100 to-primary-50 text-primary-700 shadow-medium'
                      : 'border-cream-400 bg-cream-500 text-gray-700 hover:border-primary-300 hover:bg-cream-400'
                  )}
                  title={`${view.charAt(0).toUpperCase() + view.slice(1)}${isSuggested ? ' (suggested for current time)' : ''}`}
                >
                  <div className="text-center">
                    <div className={clsx(
                      'text-3xl mb-2',
                      isSuggested && !isCurrent && 'animate-pulse'
                    )}>
                      {view === 'morning' ? '🌻' : view === 'evening' ? '🌙' : '⚡'}
                    </div>
                    <div className="text-sm font-medium capitalize">{view}</div>
                    {isSuggested && !isCurrent && (
                      <div className="text-xs text-primary-600 mt-1">Suggested</div>
                    )}
                  </div>
                </button>
              )
            })}
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
                    {currentView === 'morning' && i18n.t('dashboard.viewDesc.morning')}
                    {currentView === 'evening' && i18n.t('dashboard.viewDesc.evening')}
                    {currentView === 'quick' && i18n.t('dashboard.viewDesc.quick')}
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
                <>
                  {currentView === 'morning' && <MorningView key="morning" />}
                  {currentView === 'evening' && <EveningView key="evening" />}
                  {currentView === 'quick' && <QuickTrackView key="quick" />}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Today's summary */}
        {todaysEntries.length > 0 && (
          <div className="meadow-card">
            <div className="section-header">
              <h3 className="text-lg font-semibold text-gray-800">{i18n.t('dashboard.todaysSummary')}</h3>
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
                      <div className="text-sm font-medium text-gray-800 capitalize">{i18n.t(`common.view.${view}`)}</div>
                      <div className="text-lg font-semibold text-primary-600">
                        {viewEntries.length}
                      </div>
                      <div className="text-xs text-gray-500">{i18n.t('common.entries')}</div>
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
          {['morning', 'quick', 'evening'].map((view) => {
            const isCurrent = currentView === view
            const isSuggested = suggestedView === view
            return (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={clsx(
                  'flex-1 py-3 px-2 text-center transition-all duration-200',
                  isCurrent ? 'text-primary-600' : 'text-gray-600'
                )}
                title={`${view.charAt(0).toUpperCase() + view.slice(1)}${isSuggested ? ' (suggested)' : ''}`}
              >
                <div className={clsx(
                  'text-xl mb-1',
                  isSuggested && !isCurrent && 'animate-pulse'
                )}>
                  {view === 'morning' ? '🌻' : view === 'evening' ? '🌙' : '⚡'}
                </div>
                <div className="text-xs">{i18n.t(`common.view.${view}`)}</div>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Configuration Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="meadow-card max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{i18n.t('dashboard.import.title')}</h3>
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
                  {i18n.t('dashboard.import.selectFileLabel')}
                </label>
                <input
                  type="file"
                  id="configImportFile"
                  accept=".json,.lzjson"
                  onChange={handleConfigFileSelect}
                  className="input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-2 text-sm text-gray-600">
                  {i18n.t('dashboard.import.helpText')}
                </p>
              </div>
              
              {/* Error Display */}
              {configImportError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="text-red-600 mr-3 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="text-sm font-medium text-red-800 mb-1">{i18n.t('dashboard.import.error.title')}</h4>
                      <p className="text-sm text-red-700">{configImportError}</p>
                      <p className="text-xs text-red-600 mt-2">
                        {i18n.t('dashboard.import.error.hint')}
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
                    <p className="text-sm text-blue-800">{i18n.t('dashboard.import.loading')}</p>
                  </div>
                </div>
              )}
              
              {/* Success Display */}
              {configImportSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="text-green-600 mr-3 mt-0.5">✅</div>
                    <div>
                      <h4 className="text-sm font-medium text-green-800 mb-1">{i18n.t('dashboard.import.success.heading')}</h4>
                      <p className="text-sm text-green-700">{configImportSuccess}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                <p className="font-medium mb-2">{i18n.t('dashboard.import.warning.title')}</p>
                <p>• <strong>{i18n.t('dashboard.import.warning.backup.title')}</strong> {i18n.t('dashboard.import.warning.backup.text')}</p>
                <p>• <strong>{i18n.t('dashboard.import.warning.replacement.title')}</strong> {i18n.t('dashboard.import.warning.replacement.text')}</p>
                <p>• <strong>{i18n.t('dashboard.import.warning.validation.title')}</strong> {i18n.t('dashboard.import.warning.validation.text')}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="btn-secondary px-4 py-2"
                disabled={isConfigImporting}
              >
                {i18n.t('common.cancel')}
              </button>
              <button
                onClick={() => document.getElementById('configImportFile').click()}
                className="btn-primary px-4 py-2"
                disabled={isConfigImporting}
              >
                {isConfigImporting ? i18n.t('dashboard.import.loading') : i18n.t('dashboard.import.selectAndImport')}
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
              <h3 className="text-lg font-semibold text-gray-900">{i18n.t('dashboard.reset.title')}</h3>
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
                    <h4 className="text-sm font-medium text-red-800 mb-2">{i18n.t('dashboard.reset.confirmTitle')}</h4>
                    <p className="text-sm text-red-700 mb-2">
                      {i18n.t('dashboard.reset.confirmText')}
                    </p>
                    <p className="text-xs text-red-600">
                      {i18n.t('dashboard.reset.confirmHint')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p><strong>{i18n.t('dashboard.reset.detailsTitle')}</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{i18n.t('dashboard.reset.detail.fields')}</li>
                  <li>{i18n.t('dashboard.reset.detail.forms')}</li>
                  <li>{i18n.t('dashboard.reset.detail.preferences')}</li>
                  <li>{i18n.t('dashboard.reset.detail.validation')}</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="btn-secondary px-4 py-2"
              >
                {i18n.t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  setShowResetConfirmModal(false)
                  handleClearConfig()
                }}
                className="btn-danger px-4 py-2"
              >
                {i18n.t('dashboard.reset.confirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
