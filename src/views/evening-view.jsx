import React, { useState, useEffect } from 'react'
import { useAppStore } from '../stores/app-store.js'
import { TRACKING_ITEMS, getItemsByView, getDisplayValue, getItemColor, isItem3PointScale } from '../constants/tracking-items.js'
import { denormalizeScaleValue, normalizeScaleValue } from '../utils/scale-conversion.js'
import { format } from 'date-fns'
import { clsx } from 'clsx'

const EveningView = () => {
  const { config, trackingData, addEntry, updateEntry, addNotification } = useAppStore()
  const [formData, setFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingEntry, setExistingEntry] = useState(null)
  const [collapsedSections, setCollapsedSections] = useState({})

  // Get items for evening view
  const viewItems = getItemsByView('evening')

  // Check for existing entry today
  useEffect(() => {
    // Use local timezone instead of UTC
    const today = new Date().toLocaleDateString('en-CA') // Returns YYYY-MM-DD in local timezone
    
    // Find all entries for today and evening type (excluding deleted entries)
    const todaysEntries = trackingData.entries.filter(entry => {
      // Convert UTC timestamp to local date for comparison
      const entryDate = new Date(entry.timestamp).toLocaleDateString('en-CA')
      return entryDate === today && entry.type === 'evening' && !entry.is_deleted
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
      // Load all the data from the existing entry, including notes
      const entryData = {
        ...existing,
        notes: existing.notes || {}
      }
      setFormData(entryData)
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

  const handleNotesChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      notes: {
        ...prev.notes,
        [field]: value
      }
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
        type: 'evening',
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles'
      }
      
      if (existingEntry) {
        // Update existing entry
        await updateEntry(existingEntry.id, entryData)
        addNotification({
          type: 'success',
          title: 'Evening entry updated',
          message: 'Your evening entry has been updated successfully! 🌙'
        })
      } else {
        // Create new entry
        await addEntry(entryData)
        addNotification({
          type: 'success',
          title: 'Evening entry saved',
          message: 'Your evening entry has been saved successfully! 🌙'
        })
      }
      
    } catch (error) {
      console.error('Error saving evening entry:', error)
      addNotification({
        type: 'error',
        title: 'Save failed',
        message: 'Failed to save evening entry. Please try again.'
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
    const scaleValues = is3Point ? [1, 3, 5] : [1, 2, 3, 4, 5]
    const displayType = config?.display_type || 'text'
    
    return (
      <div className="flex flex-wrap gap-2">
        {scaleValues.map((value) => {
          const displayValue = getDisplayValue(value, displayType)
          const isSelected = formData[item.id] === value
          const color = getItemColor(value, displayType)
          
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleScaleChange(item.id, value)}
              className={clsx(
                'px-4 py-2 rounded-lg border-2 transition-all duration-200 hover:shadow-medium',
                isSelected
                  ? `${color.bg} ${color.border} ${color.text} shadow-medium`
                  : 'bg-white border-gray-300 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
              )}
            >
              <span className="text-lg">{displayValue}</span>
            </button>
          )
        })}
      </div>
    )
  }

  const renderMultiSelect = (item) => {
    const selectedValues = formData[item.id] || []
    
    return (
      <div className="space-y-2">
        {item.options.map((option) => (
          <label key={option} className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={(e) => handleMultiSelectChange(item.id, option, e.target.checked)}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-gray-700">{option}</span>
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
      </div>
    )
  }

  const renderNotesSection = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observations
          </label>
          <textarea
            value={formData.notes?.observations || ''}
            onChange={(e) => handleNotesChange('observations', e.target.value)}
            className="input w-full h-24 resize-none"
            placeholder="What did you notice today?"
            maxLength={2000}
          />
          <div className="text-xs text-gray-500 mt-1">
            {(formData.notes?.observations || '').length}/2000
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reflections
          </label>
          <textarea
            value={formData.notes?.reflections || ''}
            onChange={(e) => handleNotesChange('reflections', e.target.value)}
            className="input w-full h-24 resize-none"
            placeholder="What are your thoughts and feelings?"
            maxLength={2000}
          />
          <div className="text-xs text-gray-500 mt-1">
            {(formData.notes?.reflections || '').length}/2000
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thankful For
          </label>
          <textarea
            value={formData.notes?.thankful_for || ''}
            onChange={(e) => handleNotesChange('thankful_for', e.target.value)}
            className="input w-full h-24 resize-none"
            placeholder="What are you grateful for today?"
            maxLength={2000}
          />
          <div className="text-xs text-gray-500 mt-1">
            {(formData.notes?.thankful_for || '').length}/2000
          </div>
        </div>
      </div>
    )
  }

  const renderItem = (item) => {
    switch (item.scale_type) {
      case '3-point':
      case '5-point':
        return (
          <div key={item.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {item.label}
            </label>
            {renderScaleButtons(item)}
          </div>
        )
      
      case 'multi-select':
        return (
          <div key={item.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {item.label}
            </label>
            {renderMultiSelect(item)}
          </div>
        )
      
      case 'numeric':
        return (
          <div key={item.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {item.label}
            </label>
            {renderNumberInput(item)}
          </div>
        )
      
      default:
        return null
    }
  }

  const renderSection = (category) => {
    const categoryItems = viewItems.filter(item => item.section === category)
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
    <div className="evening-view bg-gradient-to-br from-orange-50 to-purple-50 min-h-screen">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-orange-800 mb-2">Good Evening! 🌙</h1>
          <p className="text-orange-600 mb-6">How was your day? Let's reflect on your experiences and feelings.</p>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Body Section */}
            {renderSection('body')}
            
            {/* Mind Section */}
            {renderSection('mind')}
            
            {/* Evening Only Section */}
            {renderSection('evening')}
            
            {/* Notes Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Reflection & Notes</h3>
              {renderNotesSection()}
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className={clsx(
                  'btn-primary px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white',
                  isSubmitting && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSubmitting ? 'Saving...' : existingEntry ? 'Update Evening Entry' : 'Save Evening Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EveningView
