import React, { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore.js'
import { TRACKING_ITEMS, getItemsByView, getDisplayValue, getItemColor, isItem3PointScale } from '../constants/trackingItems.js'
import { denormalizeScaleValue, normalizeScaleValue } from '../utils/scaleConversion.js'
import { format } from 'date-fns'
import { clsx } from 'clsx'

const TrackingForm = ({ viewType }) => {
  const { config, trackingData, addEntry, updateEntry, addNotification } = useAppStore()
  const [formData, setFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingEntry, setExistingEntry] = useState(null)
  const [collapsedSections, setCollapsedSections] = useState({})

  // Get items for this view
  const viewItems = getItemsByView(viewType)
  const viewConfig = config?.view_configurations?.[`${viewType}_report`] || 
                    (viewType === 'quick' ? config?.view_configurations?.quick_track : null)
  


  // Check for existing entry today
  useEffect(() => {
    // For Quick Track, we don't look for existing entries - always create new ones
    if (viewType === 'quick') {
      setExistingEntry(null)
      setFormData({})
      return
    }

    // Use local timezone instead of UTC
    const today = new Date().toLocaleDateString('en-CA') // Returns YYYY-MM-DD in local timezone
    
    // Find all entries for today and this view type (excluding deleted entries)
    const todaysEntries = trackingData.entries.filter(entry => {
      // Convert UTC timestamp to local date for comparison
      const entryDate = new Date(entry.timestamp).toLocaleDateString('en-CA')
      return entryDate === today && entry.type === viewType && !entry.is_deleted
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
  }, [viewType, trackingData.entries])

  // Clear form when viewType changes (in case of cached data)
  useEffect(() => {
    if (!existingEntry) {
      setFormData({})
    }
  }, [viewType, existingEntry])

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
      const newValues = checked
        ? [...currentValues, option]
        : currentValues.filter(v => v !== option)
      
      return {
        ...prev,
        [itemId]: newValues
      }
    })
  }

  const handleNumberChange = (itemId, value) => {
    const numValue = parseInt(value) || 0
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
    setIsSubmitting(true)



    try {
      if (existingEntry) {
        await updateEntry(existingEntry.id, formData)
        addNotification({
          type: 'success',
          title: 'Entry updated',
          message: 'Your tracking entry has been updated successfully.'
        })
      } else {
        await addEntry(formData)
        addNotification({
          type: 'success',
          title: 'Entry saved',
          message: 'Your tracking entry has been saved successfully.'
        })
      }
    } catch (error) {
      console.error('🔍 TrackingForm Debug - Save Error:', {
        error: error.message,
        errorStack: error.stack,
        formData,
        viewType
      })
      addNotification({
        type: 'error',
        title: 'Save failed',
        message: 'There was an error saving your entry. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle section collapse
  const toggleSection = (category) => {
    setCollapsedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const renderScaleButtons = (item) => {
    const { scale, good } = item
    // Use existingEntry data directly if formData is empty
    let value = formData[item.id] !== undefined ? formData[item.id] : (existingEntry?.[item.id])
    

    
    // For 3-point scale items, convert stored 5-point value back to 3-point for display
    if (isItem3PointScale(item) && value !== undefined) {
      const displayValue = denormalizeScaleValue(value, 3)

      value = displayValue
    }
    
    const displayType = config?.display_options?.item_display_type || 'text'



    // Create responsive grid classes based on scale
    const gridCols = {
      3: 'grid-cols-3',
      4: 'grid-cols-4', 
      5: 'grid-cols-5'
    }[scale] || 'grid-cols-5'

    return (
      <div className={`grid ${gridCols} gap-1`}>
        {Array.from({ length: scale }, (_, i) => i + 1).map((scaleValue) => {
          // Explicitly check if the value exists and matches the scale value
          const isSelected = value !== undefined && value === scaleValue
          const colorClass = getItemColor(item, scaleValue)
          const displayValue = getDisplayValue(item, scaleValue, displayType)
          const textOption = item.textOptions ? item.textOptions[scaleValue - 1] : scaleValue
          

          
          return (
            <button
              key={scaleValue}
              type="button"
              onClick={() => handleScaleChange(item.id, scaleValue)}
              className={clsx(
                'scale-button',
                colorClass,
                isSelected && 'selected'
              )}
            >
              <div className={clsx(
                'mb-1',
                displayType === 'text' ? 'text-sm' : 'text-lg'
              )}>
                {displayValue}
              </div>
              {/* Only show bottom text if it's different from display value */}
              {displayValue !== textOption && (
                <div className="text-xs">
                  {textOption}
                </div>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  const renderMultiSelect = (item) => {
    // Use existingEntry data directly if formData is empty
    const values = formData[item.id] !== undefined ? formData[item.id] : (existingEntry?.[item.id] || [])

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {item.options.map((option) => {
          const isSelected = values.includes(option)
          const label = item.optionLabels?.[option] || option.replace(/_/g, ' ')

          return (
            <label
              key={option}
              className={clsx(
                'flex items-center p-3 border rounded-lg cursor-pointer transition-colors',
                isSelected
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => handleMultiSelectChange(item.id, option, e.target.checked)}
                className="sr-only"
              />
              <div className="flex-1 text-sm font-medium">{label}</div>
              {isSelected && (
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </label>
          )
        })}
      </div>
    )
  }

  const renderNumberInput = (item) => {
    // Use existingEntry data directly if formData is empty
    const value = formData[item.id] !== undefined ? formData[item.id] : (existingEntry?.[item.id] || '')

    return (
      <div className="flex items-center space-x-4">
        <input
          type="number"
          min={item.min}
          max={item.max}
          value={value}
          onChange={(e) => handleNumberChange(item.id, e.target.value)}
          className="input w-24 text-center"
          placeholder="0-100"
        />
        <span className="text-sm text-gray-600">
          {item.min}-{item.max}
        </span>
      </div>
    )
  }

  const renderNotesSection = () => {
    if (viewType !== 'evening') return null

    // Use existingEntry data directly if formData is empty
    const notes = formData.notes !== undefined ? formData.notes : (existingEntry?.notes || {})
    const isCollapsed = collapsedSections['notes']

    return (
      <div className="space-y-4">
        <div 
          className="section-header cursor-pointer hover:bg-meadow-200 transition-colors duration-200"
          onClick={() => toggleSection('notes')}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-800">Daily Notes</h4>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-3 ml-4">3 fields</span>
              <svg 
                className={clsx(
                  'w-5 h-5 text-gray-600 transition-transform duration-200',
                  isCollapsed ? 'rotate-180' : ''
                )} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="space-y-4">
            <div className="border border-white rounded-xl p-4 bg-gradient-to-br from-cream-400/30 to-cream-300/30 backdrop-blur-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observations
              </label>
              <textarea
                value={notes.observations || ''}
                onChange={(e) => handleNotesChange('observations', e.target.value)}
                placeholder="What did you notice today?"
                className="input h-20 resize-none"
                maxLength={2000}
              />
            </div>

            <div className="border border-white rounded-xl p-4 bg-gradient-to-br from-cream-400/30 to-cream-300/30 backdrop-blur-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reflections
              </label>
              <textarea
                value={notes.reflections || ''}
                onChange={(e) => handleNotesChange('reflections', e.target.value)}
                placeholder="How are you feeling about today?"
                className="input h-20 resize-none"
                maxLength={2000}
              />
            </div>

            <div className="border border-white rounded-xl p-4 bg-gradient-to-br from-cream-400/30 to-cream-300/30 backdrop-blur-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am thankful for...
              </label>
              <textarea
                value={notes.thankful_for || ''}
                onChange={(e) => handleNotesChange('thankful_for', e.target.value)}
                placeholder="What are you grateful for today?"
                className="input h-20 resize-none"
                maxLength={2000}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderItem = (item) => {
    // Date picker handler
    const handleDateChange = (itemId, value) => {
      setFormData(prev => ({
        ...prev,
        [itemId]: value
      }))
    }
    // Use existingEntry data directly if formData is empty
    const value = formData[item.id] !== undefined ? formData[item.id] : (existingEntry?.[item.id] || '')
    return (
      <div key={item.id} className="border border-white rounded-xl p-1 bg-gradient-to-br from-cream-400/30 to-cream-300/30 backdrop-blur-sm">
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              {item.name}
            </label>
            {item.description && (
              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
            )}
          </div>

          {item.type === 'date' && (
            <input
              type="date"
              value={value}
              onChange={e => handleDateChange(item.id, e.target.value)}
              className="input w-48"
              placeholder={item.format || 'YYYY-MM-DD'}
            />
          )}
          {item.type === 'multi-select' && renderMultiSelect(item)}
          {item.type === 'number' && renderNumberInput(item)}
          {!item.type && renderScaleButtons(item)}
        </div>
      </div>
    )
  }

  const renderSection = (category) => {
    const sectionConfig = viewConfig?.sections?.[category]
    if (!sectionConfig?.visible) return null

    const sectionItems = viewItems.filter(item => item.category === category)
    
    const sortedItems = sectionConfig.items
      .map(itemId => sectionItems.find(item => item.id === itemId))
      .filter(Boolean)

    if (sortedItems.length === 0) return null

    const isCollapsed = collapsedSections[category]

    return (
      <div key={category} className="space-y-4">
        <div 
          className="section-header cursor-pointer hover:bg-meadow-200 transition-colors duration-200"
          onClick={() => toggleSection(category)}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {category}
            </h3>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-3 ml-4">
                {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''}
              </span>
              <svg 
                className={clsx(
                  'w-5 h-5 text-gray-600 transition-transform duration-200',
                  isCollapsed ? 'rotate-180' : ''
                )} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        {!isCollapsed && (
          <div className="section-content space-y-4">
            {sortedItems.map(renderItem)}
          </div>
        )}
      </div>
    )
  }

  const renderWearablesSection = () => {
    if (viewType !== 'morning') return null

    const wearables = viewConfig?.wearables || []
    const wearableItems = wearables
      .map(itemId => TRACKING_ITEMS[itemId])
      .filter(Boolean)

    if (wearableItems.length === 0) return null

    const isCollapsed = collapsedSections['wearables']

    return (
      <div className="space-y-4">
        <div 
          className="section-header cursor-pointer hover:bg-meadow-200 transition-colors duration-200"
          onClick={() => toggleSection('wearables')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Wearable Data
            </h3>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-3 ml-4">
                {wearableItems.length} item{wearableItems.length !== 1 ? 's' : ''}
              </span>
              <svg 
                className={clsx(
                  'w-5 h-5 text-gray-600 transition-transform duration-200',
                  isCollapsed ? 'rotate-180' : ''
                )} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        {!isCollapsed && (
          <div className="section-content space-y-4">
            {wearableItems.map(renderItem)}
          </div>
        )}
      </div>
    )
  }

  // Show loading state if config is not loaded
  if (!config) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    )
  }

  // Show fallback if no view config
  if (!viewConfig) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">No configuration found for {viewType} view.</p>
        <p className="text-sm text-gray-500">Please complete the onboarding to configure your tracking items.</p>
      </div>
    )
  }



  return (
    <form 
      key={`${viewType}-${existingEntry?.id || 'new'}`}
      onSubmit={handleSubmit} 
      className="space-y-8"
    >
      {/* Pre-populated indicator */}
      {existingEntry && viewType !== 'quick' && (
        <div className="meadow-card bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <div className="text-blue-600 mr-3">📝</div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Editing existing {viewType} entry
              </p>
              <p className="text-xs text-blue-600">
                Submitted at {format(new Date(existingEntry.timestamp), 'h:mm a')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Body section */}
      {renderSection('body')}

      {/* Mind section */}
      {renderSection('mind')}

      {/* Notes section (evening only) */}
      {renderNotesSection()}

      {/* Submit button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary px-8 py-3"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
              Saving...
            </div>
          ) : (
            viewType === 'quick' ? 'Add Quick Entry' : (existingEntry ? 'Update Entry' : 'Save Entry')
          )}
        </button>
      </div>
    </form>
  )
}

export default TrackingForm