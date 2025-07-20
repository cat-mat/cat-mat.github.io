import React from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../stores/appStore.js'
import DisplayTypeSelector from './DisplayTypeSelector.jsx'

const Settings = () => {
  const { forceUpdateViewConfig, clearCorruptedConfig, addNotification } = useAppStore()

  const handleForceUpdateConfig = async () => {
    try {
      await forceUpdateViewConfig()
      addNotification({
        type: 'success',
        title: 'Configuration Updated',
        message: 'View configuration has been updated with new items!'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update view configuration'
      })
    }
  }

  const handleClearCorruptedConfig = async () => {
    if (window.confirm('This will clear your current configuration and start fresh. Are you sure?')) {
      try {
        await clearCorruptedConfig()
        addNotification({
          type: 'success',
          title: 'Configuration Cleared',
          message: 'Configuration has been cleared and recreated successfully!'
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Clear Failed',
          message: 'Failed to clear configuration'
        })
      }
    }
  }

  return (
    <div className="min-h-screen wildflower-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Link to="/" className="text-primary-600 hover:text-primary-700 mr-4 transition-colors duration-200">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 wildflower-text-shadow">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Display Type Settings */}
          <DisplayTypeSelector />

          {/* Force Update Configuration */}
          <div className="meadow-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Update View Configuration</h3>
            <p className="text-sm text-gray-600 mb-4">
              Force update the view configuration with the latest items and settings.
            </p>
            <button
              onClick={handleForceUpdateConfig}
              className="sunset-button px-6 py-3 mr-3"
            >
              🔄 Update Configuration
            </button>
          </div>

          {/* Clear Corrupted Configuration */}
          <div className="meadow-card p-6 border-l-4 border-danger-500">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">⚠️ Fix Configuration Issues</h3>
            <p className="text-sm text-gray-600 mb-4">
              If you're experiencing configuration errors, this will clear the corrupted configuration and start fresh.
            </p>
            <button
              onClick={handleClearCorruptedConfig}
              className="btn-danger px-6 py-3"
            >
              🗑️ Clear & Recreate Configuration
            </button>
          </div>

          {/* Coming Soon Section */}
          <div className="meadow-card p-8">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-bloom">⚙️</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                More Settings Coming Soon
              </h2>
              <p className="text-gray-600">
                Additional configuration options will be available here soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings 