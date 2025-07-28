import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { TRACKING_ITEMS } from '../constants/trackingItems.js'
import { useAppStore } from '../stores/appStore.js'
import DisplayTypeSelector from './DisplayTypeSelector.jsx'
import AppHeader from './AppHeader.jsx';

const Settings = () => {
  const { config, updateConfig, addNotification, auth, signOut } = useAppStore()
  const [selectedReport, setSelectedReport] = useState('morning')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // For config modals and notifications
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false)
  const [configImportError, setConfigImportError] = useState('')
  const [isConfigImporting, setIsConfigImporting] = useState(false)
  const [configImportSuccess, setConfigImportSuccess] = useState('')

  // Helper to get items by category
  const getItemsByCategory = (category) => {
    return Object.values(TRACKING_ITEMS).filter(item => item.category === category)
  }

  // Helper to get sorted items for the current report and category
  const getSortedItems = (category, reportType) => {
    const sectionByType = type => {
      if (type === 'quick') {
        return config?.view_configurations?.quick_track?.sections
      }
      return config?.view_configurations?.[`${type}_report`]?.sections
    }
    const section = sectionByType(reportType)
    const checkedIds = section?.[category]?.items || []
    const allItems = getItemsByCategory(category)
    if (!section || !section[category] || checkedIds.length === 0) {
      // No config: sort all alphabetically
      return [...allItems].sort((a, b) => a.name.localeCompare(b.name))
    }
    // Checked items in user-defined order (no sort)
    const checked = checkedIds
      .map(id => allItems.find(item => item.id === id))
      .filter(Boolean)
    // Unchecked items alphabetically
    const unchecked = allItems
      .filter(item => !checkedIds.includes(item.id))
      .sort((a, b) => a.name.localeCompare(b.name))
    return [...checked, ...unchecked]
  }

  // Handler for toggling item inclusion
  const handleToggle = (itemId, reportType, checked) => {
    const sectionKey = reportType === 'quick' ? 'quick_track' : `${reportType}_report`
    const newConfig = { ...config, view_configurations: { ...config.view_configurations } }
    const oldSections = config.view_configurations[sectionKey]?.sections || {}
    const newSections = { ...oldSections }
    const cat = TRACKING_ITEMS[itemId].category
    const oldArr = oldSections[cat]?.items || []
    let arr = [...oldArr]
    if (checked) {
      if (!arr.includes(itemId)) arr.push(itemId) // Add to end
    } else {
      arr = arr.filter(id => id !== itemId)
    }
    newSections[cat] = { ...oldSections[cat], items: arr, sort_order: arr }
    newConfig.view_configurations[sectionKey] = {
      ...config.view_configurations[sectionKey],
      sections: newSections
    }
    updateConfig(newConfig)
    addNotification({ type: 'success', title: 'Updated', message: 'Tracking items updated!' })
  }

  // Handler for moving item up/down
  const handleMove = (itemId, reportType, direction) => {
    const sectionKey = reportType === 'quick' ? 'quick_track' : `${reportType}_report`
    const newConfig = { ...config, view_configurations: { ...config.view_configurations } }
    const oldSections = config.view_configurations[sectionKey]?.sections || {}
    const newSections = { ...oldSections }
    const cat = TRACKING_ITEMS[itemId].category
    const oldArr = oldSections[cat]?.items || []
    const idx = oldArr.indexOf(itemId)
    if (idx === -1) return
    let newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= oldArr.length) return
    // Only operate on checked items
    const arr = [...oldArr]
    ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
    newSections[cat] = { ...oldSections[cat], items: arr, sort_order: arr }
    newConfig.view_configurations[sectionKey] = {
      ...config.view_configurations[sectionKey],
      sections: newSections
    }
    updateConfig(newConfig)
    addNotification({ type: 'success', title: 'Order Updated', message: 'Tracking item order updated!' })
  }

  // Handler for toggling notification preferences
  const handleNotificationToggle = (type, checked) => {
    const key = `${type}_enabled`
    const newConfig = {
      ...config,
      notification_settings: {
        ...config.notification_settings,
        [key]: checked
      }
    }
    updateConfig(newConfig)
    addNotification({ type: 'success', title: 'Notification Preference Updated', message: `Reminder for ${type} report ${checked ? 'enabled' : 'disabled'}` })
  }

  // Handler for changing notification times
  const handleNotificationTimeChange = (type, value) => {
    const newConfig = { ...config }
    if (!newConfig.notification_settings) newConfig.notification_settings = {}
    newConfig.notification_settings[`${type}_time`] = value
    updateConfig(newConfig)
    addNotification({ type: 'success', title: 'Notification Time Updated', message: `Notification time for ${type} report updated!` })
  }

  // Handler for changing report times
  const handleTimeChange = (key, value) => {
    const newConfig = { ...config }
    if (!newConfig.display_options) newConfig.display_options = {}
    if (!newConfig.display_options.view_times) newConfig.display_options.view_times = { morning_end: '09:00', evening_start: '20:00' }
    newConfig.display_options.view_times[key] = value
    updateConfig(newConfig)
    addNotification({ type: 'success', title: 'Report Time Updated', message: `Report time for ${key.replace('_', ' ')} updated!` })
  }

  // Render checkboxes and up/down buttons for each item in a table row
  const renderTableRow = (item, idx, reportType) => {
    const sectionByType = type => {
      if (type === 'quick') {
        return config?.view_configurations?.quick_track?.sections
      }
      return config?.view_configurations?.[`${type}_report`]?.sections
    }
    const rowBg = idx % 2 === 0 ? 'bg-cream-100' : 'bg-cream-50'
    const section = sectionByType(reportType)
    const cat = item.category
    const arr = section?.[cat]?.items || []
    const checked = arr.includes(item.id)
    // Only checked items are reorderable
    const checkedIds = section?.[cat]?.items || []
    const arrIdx = checkedIds.indexOf(item.id)
    return (
      <tr key={item.id} className={rowBg}>
        <td className="px-2 py-1 w-48 font-medium text-gray-800 align-middle">{item.name}</td>
        <td className="px-2 py-1 text-center align-middle">
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={!!checked}
              onChange={e => handleToggle(item.id, reportType, e.target.checked)}
            />
            <span className="text-xs text-gray-600 capitalize">{reportType}</span>
          </label>
          {checked && (
            <span className="ml-1 inline-flex">
              <button
                className="px-1 text-xs text-gray-500 hover:text-primary-600 disabled:opacity-30"
                onClick={() => handleMove(item.id, reportType, 'up')}
                disabled={arrIdx <= 0}
                title="Move up"
              >▲</button>
              <button
                className="px-1 text-xs text-gray-500 hover:text-primary-600 disabled:opacity-30"
                onClick={() => handleMove(item.id, reportType, 'down')}
                disabled={arrIdx === (checkedIds.length - 1)}
                title="Move down"
              >▼</button>
            </span>
          )}
        </td>
      </tr>
    )
  }

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
        // Small delay to prevent notification overlap
        setTimeout(() => {
          addNotification({
            type: 'success',
            title: 'Configuration Cleared',
            message: 'Configuration has been cleared and recreated successfully!'
          })
        }, 100)
      } catch (error) {
        setTimeout(() => {
          addNotification({
            type: 'error',
            title: 'Clear Failed',
            message: 'Failed to clear configuration'
          })
        }, 100)
      }
    }
  }

  // PWA functionality removed - app works as regular web app

  return (
    <div className="min-h-screen wildflower-bg">
      <AppHeader
        onExportConfig={null}
        setShowImportModal={null}
        setShowResetConfirmModal={null}
        configImportError={null}
        configImportSuccess={null}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Link 
            to="/" 
            className="btn-secondary px-4 py-2 text-sm flex items-center"
          >
            <span className="mr-2">←</span>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 wildflower-text-shadow ml-4">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Report Times */}
          <div className="meadow-card p-6 border-l-4 border-accent-400">
            <h3 className="text-lg font-semibold text-accent-800 mb-4">Report Times</h3>
            <p className="text-sm text-gray-600 mb-4">Set your preferred cutoff times for morning and evening reports.</p>
            <div className="flex flex-col gap-4 max-w-xs">
              <label className="flex items-center gap-3">
                <span className="w-32 text-gray-700 font-medium">Morning End</span>
                <input
                  type="time"
                  value={config?.display_options?.view_times?.morning_end || '09:00'}
                  onChange={e => handleTimeChange('morning_end', e.target.value)}
                  className="input w-36"
                />
              </label>
              <label className="flex items-center gap-3">
                <span className="w-32 text-gray-700 font-medium">Evening Start</span>
                <input
                  type="time"
                  value={config?.display_options?.view_times?.evening_start || '20:00'}
                  onChange={e => handleTimeChange('evening_start', e.target.value)}
                  className="input w-36"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">These times affect when your morning and evening reports are available and when reminders are sent.</p>
          </div>
          {/* Notification Preferences */}
          <div className="meadow-card p-6 border-l-4 border-info-400">
            <h3 className="text-lg font-semibold text-info-800 mb-4">Notification Preferences</h3>
            <p className="text-sm text-gray-600 mb-4">Choose which reminders you want to receive and set the time for each notification.</p>
            <div className="flex flex-col gap-4 max-w-xs">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config?.notification_settings?.morning_enabled ?? true}
                  onChange={e => handleNotificationToggle('morning', e.target.checked)}
                  className="checkbox"
                />
                <span className="w-32 text-gray-700 font-medium">Morning Report</span>
                <input
                  type="time"
                  value={config?.notification_settings?.morning_time || '08:00'}
                  onChange={e => handleNotificationTimeChange('morning', e.target.value)}
                  className="input w-36 ml-2"
                  disabled={!(config?.notification_settings?.morning_enabled ?? true)}
                />
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config?.notification_settings?.evening_enabled ?? true}
                  onChange={e => handleNotificationToggle('evening', e.target.checked)}
                  className="checkbox"
                />
                <span className="w-32 text-gray-700 font-medium">Evening Report</span>
                <input
                  type="time"
                  value={config?.notification_settings?.evening_time || '20:00'}
                  onChange={e => handleNotificationTimeChange('evening', e.target.value)}
                  className="input w-36 ml-2"
                  disabled={!(config?.notification_settings?.evening_enabled ?? true)}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">Reminders will be sent at the selected time for each report, regardless of the report cutoff times above.</p>
          </div>
          {/* Customize Tracking Items */}
          <div className="meadow-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Customize Tracking Items</h3>
            <p className="text-sm text-gray-600 mb-4">Choose which items appear in your Morning, Evening, and Quick reports.</p>
            <div className="flex gap-2 mb-4">
                {['morning', 'quick', 'evening'].map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedReport(type)}
                    className={
                      [
                        'flex-1 py-4 px-4 rounded-xl border-2 transition-all duration-300 hover:shadow-medium',
                        selectedReport === type
                          ? 'border-primary-500 bg-gradient-to-br from-primary-100 to-primary-50 text-primary-700 shadow-medium'
                          : 'border-cream-400 bg-cream-500 text-gray-700 hover:border-primary-300 hover:bg-cream-400'
                      ].join(' ')
                    }
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2 animate-bloom">
                        {type === 'morning' ? '🌻' : type === 'evening' ? '🌙' : '⚡'}
                      </div>
                      <div className="text-sm font-medium capitalize">{type}</div>
                    </div>
                  </button>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['body', 'mind'].map(category => (
                <div key={category}>
                  <h4 className="font-semibold text-gray-700 mb-2 capitalize">{category}</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-cream-200">
                          <th className="px-2 py-2 text-left font-semibold text-gray-700">Item</th>
                          <th className="px-2 py-2 text-center font-semibold text-gray-700">{selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSortedItems(category, selectedReport).map((item, idx) => renderTableRow(item, idx, selectedReport))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

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



          {/* Config Actions */}
          <div className="meadow-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuration Actions</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  // Export config logic
                  if (typeof window !== 'undefined' && window.exportConfig) {
                    window.exportConfig();
                  }
                  if (typeof exportConfig === 'function') {
                    exportConfig();
                  }
                  
                  // Mobile-friendly notification
                  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                  if (isMobile) {
                    addNotification({
                      type: 'success',
                      title: 'Configuration copied!',
                      message: 'Your config has been copied to clipboard. Paste it into a text file to save it.'
                    });
                  } else {
                    addNotification({
                      type: 'success',
                      title: 'Configuration exported',
                      message: 'Your configuration has been exported successfully.'
                    });
                  }
                }}
                className="btn-primary px-4 py-2 text-sm"
              >
                📤 Export Config
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                📥 Import Config
              </button>
              <button
                onClick={() => setShowResetConfirmModal(true)}
                className="btn-secondary px-4 py-2 text-sm text-red-600 border-red-400 hover:bg-red-50"
              >
                🔄 Reset Config
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings 