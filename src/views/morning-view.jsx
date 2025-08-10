import React, { useState, useEffect } from 'react'
import { useAppStore } from '../stores/app-store.js'
import { TRACKING_ITEMS, getItemsByView, getDisplayValue, getItemColor, isItem3PointScale, getValueLabels } from '../constants/tracking-items.js'
import { denormalizeScaleValue, normalizeScaleValue } from '../utils/scale-conversion.js'
import { format } from 'date-fns'
import { clsx } from 'clsx'

const MorningView = () => {
  const { config, trackingData, addEntry, updateEntry, addNotification } = useAppStore()
  const [formData, setFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingEntry, setExistingEntry] = useState(null)
  const [collapsedSections, setCollapsedSections] = useState({})

  // Helper to get configured items for morning view by category (preserves user sort order)
  const getConfiguredSectionItems = (category) => {
    const sections = config?.view_configurations?.morning_report?.sections
    const ids = sections?.[category]?.items
    if (ids && ids.length) {
      return ids.map(id => TRACKING_ITEMS[id]).filter(Boolean)
    }
    // Fallback to default items if config missing
    return Object.values(TRACKING_ITEMS).filter(item => item.morning && item.category === category)
  }

  // Check for existing entry today
  useEffect(() => {
    // Use local timezone instead of UTC
    const today = new Date().toLocaleDateString('en-CA') // Returns YYYY-MM-DD in local timezone
    
    // Find all entries for today and morning type (excluding deleted entries)
    const todaysEntries = trackingData.entries.filter(entry => {
      // Convert UTC timestamp to local date for comparison
      const entryDate = new Date(entry.timestamp).toLocaleDateString('en-CA')
      return entryDate === today && entry.type === 'morning' && !entry.is_deleted
    })
    
    // Get the most recent entry (latest timestamp)
    const existing = todaysEntries.length > 0 
      ? todaysEntries.reduce((latest, current) => {
          const latestTime = new Date(latest.timestamp).getTime()
          const currentTime = new Date(current.timestamp).getTime()
          return currentTime > latestTime ? current : latest
        })
      : null

    setExistingEntry(existing)
    
    if (existing) {
      // Load all the data from the existing entry
      setFormData(existing)
    } else {
      // Clear form data completely when no existing entry
      setFormData({})
    }
  }, [trackingData.entries])

  const handleScaleChange = (itemId, value) => {
    setFormData(prev => {
      // Get the item to check if it's a 3-point scale
      const item = TRACKING_ITEMS[itemId]
      const is3Point = isItem3PointScale(item)
      
      // For 3-point scale items, convert to 5-point for storage
      const storageValue = is3Point ? normalizeScaleValue(value, 3) : value
      
      // If the same value is clicked again, unselect it (set to undefined)
      if (prev[itemId] === storageValue) {
        const newData = { ...prev }
        delete newData[itemId] // Remove the item entirely
        return newData
      }
      
      // Otherwise, set the new value (converted if needed)
      const newData = {
        ...prev,
        [itemId]: storageValue
      }
      
      return newData
    })
  }

  const handleMultiSelectChange = (itemId, option, checked) => {
    setFormData(prev => {
      const currentValues = prev[itemId] || []
      
      if (checked) {
        return {
          ...prev,
          [itemId]: [...currentValues, option]
        }
      } else {
        return {
          ...prev,
          [itemId]: currentValues.filter(val => val !== option)
        }
      }
    })
  }

  const handleNumberChange = (itemId, value) => {
    const numValue = value === '' ? undefined : Number(value)
    setFormData(prev => ({
      ...prev,
      [itemId]: numValue
    }))
  }

  const handleDateChange = (itemId, value) => {
    setFormData(prev => ({
      ...prev,
      [itemId]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      // Create entry data
      const entryData = {
        ...formData,
        type: 'morning',
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles'
      }
      
      if (existingEntry) {
        // Update existing entry
        await updateEntry(existingEntry.id, entryData)
        addNotification({
          type: 'success',
          title: 'Morning entry updated',
          message: 'Your morning entry has been updated successfully! 🌅'
        })
      } else {
        // Create new entry
        await addEntry(entryData)
        addNotification({
          type: 'success',
          title: 'Morning entry saved',
          message: 'Your morning entry has been saved successfully! 🌅'
        })
      }
      
    } catch (error) {
      console.error('Error saving morning entry:', error)
      addNotification({
        type: 'error',
        title: 'Save failed',
        message: 'Failed to save morning entry. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleSection = (category) => {
    setCollapsedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const renderScaleButtons = (item) => {
    const is3Point = isItem3PointScale(item)
    const scaleValues = is3Point ? [1, 2, 3] : [1, 2, 3, 4, 5]
    const displayType = config?.display_options?.item_display_type || 'text'
    const colorClassMap = {
      success: 'bg-green-100 border-green-400 text-green-800',
      warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      danger: 'bg-red-100 border-red-400 text-red-800',
      gray: 'bg-gray-100 border-gray-300 text-gray-700'
    }

    return (
      <div className={clsx('grid gap-2 w-full', is3Point ? 'grid-cols-3' : 'grid-cols-5')}>
        {scaleValues.map((value) => {
          const { displayText, ariaLabel } = getValueLabels(item, value, displayType)
          const compareValue = is3Point ? normalizeScaleValue(value, 3) : value
          const isSelected = formData[item.id] === compareValue
          const tone = getItemColor(item, compareValue)
          const selectedClasses = colorClassMap[tone] || colorClassMap.gray
          const showCaption = displayType === 'face'
          const labelIndex = (is3Point ? value : value) - 1
          const captionText = item.textOptions?.[labelIndex]
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleScaleChange(item.id, value)}
              className={clsx(
                'px-4 py-2 rounded-lg border-2 transition-all duration-200 hover:shadow-medium w-full',
                isSelected
                  ? `${selectedClasses} shadow-medium`
                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              )}
            >
              <span className="text-lg block" aria-label={ariaLabel}>{displayText}</span>
              {showCaption && (
                <span className="text-xs opacity-75 block mt-1">{captionText}</span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  const renderMultiSelect = (item) => {
    const selectedValues = formData[item.id] || []
    
    return (
      <div className="grid grid-cols-2 gap-2 w-full">
        {selectedValues.length > 0 && (
          <div className="col-span-2">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, [item.id]: [] }))}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          </div>
        )}
        {item.options.map((option) => (
          <label key={option} className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={(e) => handleMultiSelectChange(item.id, option, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">{item.optionLabels?.[option] || option}</span>
          </label>
        ))}
      </div>
    )
  }

  const renderNumberInput = (item) => {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="number"
          min={item.min || 0}
          max={item.max || 100}
          value={formData[item.id] || ''}
          onChange={(e) => handleNumberChange(item.id, e.target.value)}
          className="input w-20 text-center"
          placeholder="0"
        />
        <span className="text-gray-600">/ {item.max || 100}</span>
        {(formData[item.id] ?? null) !== null && (
          <button
            type="button"
            onClick={() => handleNumberChange(item.id, '')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear
          </button>
        )}
      </div>
    )
  }

  const renderItem = (item) => {
    if (item.type === 'multi-select') {
      return (
        <div key={item.id} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 w-full">
            {item.name}
          </label>
          {item.description && (
            <p className="text-xs text-gray-500">{item.description}</p>
          )}
          {renderMultiSelect(item)}
        </div>
      )
    }
    if (item.type === 'number') {
      return (
        <div key={item.id} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 w-full">
            {item.name}
          </label>
          {item.description && (
            <p className="text-xs text-gray-500">{item.description}</p>
          )}
          {renderNumberInput(item)}
        </div>
      )
    }
    if (item.type === 'date') {
      return (
        <div key={item.id} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 w-full">
            {item.name}
          </label>
          {item.description && (
            <p className="text-xs text-gray-500">{item.description}</p>
          )}
          <input
            type="date"
            value={formData[item.id] || ''}
            onChange={(e) => handleDateChange(item.id, e.target.value)}
            className="input"
          />
        </div>
      )
    }
    if (
      item.scale_type === '3-point' ||
      item.scale_type === '5-point' ||
      item.scale === 3 ||
      item.scale === 5
    ) {
      return (
        <div key={item.id} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 w-full">
            {item.name}
          </label>
          {item.description && (
            <p className="text-xs text-gray-500">{item.description}</p>
          )}
          {renderScaleButtons(item)}
        </div>
      )
    }
    return null
  }

  const renderSection = (category) => {
    const categoryItems = getConfiguredSectionItems(category)
    if (categoryItems.length === 0) return null
    
    const isCollapsed = collapsedSections[category]
    
    return (
      <div key={category} className="space-y-4">
        <button
          type="button"
          onClick={() => toggleSection(category)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-semibold text-gray-800 capitalize">
            {category}
          </h3>
          <span className="text-gray-500">
            {isCollapsed ? '▼' : '▲'}
          </span>
        </button>
        
        {!isCollapsed && (
          <div className="space-y-6 pl-4">
            {categoryItems.map(renderItem)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="morning-view bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-blue-800 mb-2">Good Morning! 🌅</h1>
          <p className="text-blue-600 mb-6">How are you feeling this morning? Let's track your sleep quality and energy levels.</p>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Body Section */}
            {renderSection('body')}
            
            {/* Mind Section */}
            {renderSection('mind')}
            
            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className={clsx(
                  'btn-primary px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white',
                  isSubmitting && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSubmitting ? 'Saving...' : existingEntry ? 'Update Morning Entry' : 'Save Morning Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default MorningView
