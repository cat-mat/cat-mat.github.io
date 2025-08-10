import React, { useState, useEffect } from 'react'
import { useAppStore } from '../stores/app-store.js'
import { TRACKING_ITEMS, getItemsByView, getDisplayValue, getItemColor, isItem3PointScale } from '../constants/tracking-items.js'
import { denormalizeScaleValue, normalizeScaleValue } from '../utils/scale-conversion.js'
import { format } from 'date-fns'
import { clsx } from 'clsx'

const QuickTrackView = () => {
  const { config, trackingData, addEntry, addNotification } = useAppStore()
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedValue, setSelectedValue] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get quick track items (user-configurable subset)
  const quickTrackItems = config?.quick_track_items || []
  const availableItems = Object.values(TRACKING_ITEMS).filter(item => 
    quickTrackItems.includes(item.id) && 
    (item.section === 'body' || item.section === 'mind')
  )

  const handleItemSelect = (item) => {
    setSelectedItem(item)
    setSelectedValue(null) // Reset value when selecting new item
  }

  const handleValueSelect = (value) => {
    setSelectedValue(value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedItem || selectedValue === null || isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      // Get the item to check if it's a 3-point scale
      const is3Point = isItem3PointScale(selectedItem)
      
      // For 3-point scale items, convert to 5-point for storage
      const storageValue = is3Point ? normalizeScaleValue(selectedValue, 3) : selectedValue
      
      // Create entry data
      const entryData = {
        [selectedItem.id]: storageValue,
        type: 'quick',
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles'
      }
      
      // Create new entry
      await addEntry(entryData)
      addNotification({
        type: 'success',
        title: 'Quick entry saved',
        message: `${selectedItem.label} tracked successfully! ⚡`
      })
      
      // Reset form
      setSelectedItem(null)
      setSelectedValue(null)
      
    } catch (error) {
      console.error('Error saving quick entry:', error)
      addNotification({
        type: 'error',
        title: 'Save failed',
        message: 'Failed to save quick entry. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderScaleButtons = (item) => {
    const is3Point = isItem3PointScale(item)
    const scaleValues = is3Point ? [1, 3, 5] : [1, 2, 3, 4, 5]
    const displayType = config?.display_type || 'text'
    
    return (
      <div className="grid grid-cols-5 gap-2">
        {scaleValues.map((value) => {
          const displayValue = getDisplayValue(value, displayType)
          const isSelected = selectedValue === value
          const color = getItemColor(value, displayType)
          
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleValueSelect(value)}
              className={clsx(
                'p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-medium flex flex-col items-center justify-center min-h-[80px]',
                isSelected
                  ? `${color.bg} ${color.border} ${color.text} shadow-medium`
                  : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              )}
            >
              <span className="text-2xl mb-1">{displayValue}</span>
              <span className="text-xs opacity-75">
                {value === 1 ? 'Very Low' : 
                 value === 2 ? 'Low' : 
                 value === 3 ? 'Moderate' : 
                 value === 4 ? 'High' : 'Very High'}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  const renderMultiSelect = (item) => {
    const selectedValues = selectedValue || []
    
    const handleOptionToggle = (option) => {
      if (selectedValues.includes(option)) {
        setSelectedValue(selectedValues.filter(val => val !== option))
      } else {
        setSelectedValue([...selectedValues, option])
      }
    }
    
    return (
      <div className="grid grid-cols-2 gap-2">
        {selectedValues.length > 0 && (
          <div className="col-span-2">
            <button
              type="button"
              onClick={() => setSelectedValue([])}
              className="text-sm text-green-700 hover:text-green-900"
            >
              Clear all
            </button>
          </div>
        )}
        {item.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleOptionToggle(option)}
            className={clsx(
              'p-3 rounded-lg border-2 transition-all duration-200 text-left',
              selectedValues.includes(option)
                ? 'bg-blue-100 border-blue-300 text-blue-800'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
            )}
          >
            {option}
          </button>
        ))}
      </div>
    )
  }

  const renderNumberInput = (item) => {
    return (
      <div className="flex items-center justify-center space-x-4">
        <input
          type="number"
          min={item.min || 0}
          max={item.max || 100}
          value={selectedValue || ''}
          onChange={(e) => setSelectedValue(e.target.value === '' ? null : Number(e.target.value))}
          className="input w-24 text-center text-2xl"
          placeholder="0"
        />
        <span className="text-gray-600 text-lg">/ {item.max || 100}</span>
        {(selectedValue ?? null) !== null && (
          <button
            type="button"
            onClick={() => setSelectedValue(null)}
            className="text-sm text-green-700 hover:text-green-900"
          >
            Clear
          </button>
        )}
      </div>
    )
  }

  const renderValueSelection = () => {
    if (!selectedItem) return null

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {selectedItem.label}
          </h3>
          <p className="text-gray-600">Select your current level:</p>
        </div>
        
        <div className="space-y-4">
          {selectedItem.scale_type === '3-point' || selectedItem.scale_type === '5-point' ? (
            renderScaleButtons(selectedItem)
          ) : selectedItem.scale_type === 'multi-select' ? (
            renderMultiSelect(selectedItem)
          ) : selectedItem.scale_type === 'numeric' ? (
            renderNumberInput(selectedItem)
          ) : null}
        </div>
        
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={selectedValue === null || isSubmitting}
            className={clsx(
              'btn-primary px-8 py-3 bg-green-600 hover:bg-green-700 text-white',
              (selectedValue === null || isSubmitting) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSubmitting ? 'Saving...' : 'Save Quick Entry'}
          </button>
        </div>
      </div>
    )
  }

  const renderItemGrid = () => {
    if (availableItems.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No quick track items configured.</p>
          <p className="text-sm text-gray-500">Go to Settings to configure your quick track items.</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        {availableItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleItemSelect(item)}
            className={clsx(
              'p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-medium text-center',
              selectedItem?.id === item.id
                ? 'bg-green-100 border-green-300 text-green-800 shadow-medium'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
            )}
          >
            <div className="text-lg font-medium mb-2">{item.label}</div>
            <div className="text-sm text-gray-500 capitalize">{item.section}</div>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="quick-track-view bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-green-800 mb-2">Quick Track ⚡</h1>
          <p className="text-green-600 mb-6">Quickly track a single item. What would you like to record?</p>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {selectedItem ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(null)
                    setSelectedValue(null)
                  }}
                  className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
                >
                  ← Back to items
                </button>
                {renderValueSelection()}
              </>
            ) : (
              renderItemGrid()
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default QuickTrackView
