import React from 'react'
import { useAppStore } from '../stores/appStore.js'

const DisplayTypeSelector = () => {
  const { config, updateDisplayType, addNotification } = useAppStore()

  const displayTypes = [
    { value: 'text', label: 'Text', icon: '📝' },
    { value: 'face', label: 'Faces', icon: '😊' },
    { value: 'heart', label: 'Hearts', icon: '💚' },
    { value: 'dot', label: 'Dots', icon: '🟢' }
  ]

  const currentDisplayType = config?.display_options?.item_display_type || 'text'

  const handleDisplayTypeChange = async (displayType) => {
    try {
      await updateDisplayType(displayType)
      addNotification({
        type: 'success',
        title: 'Display type updated',
        message: `Changed to ${displayType} display`
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update failed',
        message: 'Failed to update display type'
      })
    }
  }

  return (
    <div className="meadow-card p-4 border-2 border-primary-300 shadow-lg">
      <h3 className="text-lg font-bold text-primary-700 mb-4">Display Type (Global)</h3>
      <div className="grid grid-cols-2 gap-3">
        {displayTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => handleDisplayTypeChange(type.value)}
            className={`
              p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105
              ${currentDisplayType === type.value
                ? 'border-primary-500 bg-gradient-to-br from-primary-100 to-primary-50 text-primary-700 shadow-medium'
                : 'border-cream-400 bg-cream-500 text-gray-700 hover:border-primary-300 hover:bg-cream-400'
              }
            `}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">{type.icon}</div>
              <div className="text-sm font-medium">{type.label}</div>
            </div>
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-700 mt-3 font-medium">
        This setting applies to <span className="text-primary-600 font-semibold">all tracking items</span> throughout the app.
      </p>
      <p className="text-xs text-gray-500 mt-1">
        (You can add per-item display options in a future update!)
      </p>
      <p className="text-sm text-gray-600 mt-2">
        Current: {displayTypes.find(t => t.value === currentDisplayType)?.label}
      </p>
    </div>
  )
}

export default DisplayTypeSelector 