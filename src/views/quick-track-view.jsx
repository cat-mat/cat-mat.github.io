import React, { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../stores/app-store.js'
import { TRACKING_ITEMS, getItemsByView, getDisplayValue, getItemColor, isItem3PointScale, getValueLabels } from '../constants/tracking-items.js'
import { denormalizeScaleValue, normalizeScaleValue } from '../utils/scale-conversion.js'
import { format } from 'date-fns'
import { clsx } from 'clsx'

const QuickTrackView = () => {
  const { config, trackingData, addEntry, addNotification } = useAppStore()
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedValue, setSelectedValue] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const topAnchorRef = useRef(null)
  const headingRef = useRef(null)

  // Get quick track items (user-configurable subset)
  // Use configured Quick Track items if present; fallback to all quick items
  const configuredQuickItems = config?.view_configurations?.quick_track?.sections
  let availableItems
  if (configuredQuickItems) {
    const bodyIds = configuredQuickItems.body?.items || []
    const mindIds = configuredQuickItems.mind?.items || []
    // Preserve user order by concatenating in sequence
    const orderedIds = [...bodyIds, ...mindIds]
    availableItems = orderedIds.map(id => TRACKING_ITEMS[id]).filter(Boolean)
  } else {
    availableItems = Object.values(TRACKING_ITEMS).filter(item => item.quick)
  }

  const handleItemSelect = (item) => {
    setSelectedItem(item)
    setSelectedValue(null) // Reset value when selecting new item
  }

  // When an item is selected, scroll the view to the top of the Quick Track card
  useEffect(() => {
    if (selectedItem) {
      try {
        if (topAnchorRef.current) {
          topAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        // Improve accessibility by moving focus to the heading after scroll
        setTimeout(() => {
          if (headingRef.current && typeof headingRef.current.focus === 'function') {
            headingRef.current.focus()
          }
        }, 250)
      } catch {}
    }
  }, [selectedItem])

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
        message: `${selectedItem.name} tracked successfully! ⚡`
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
    const scaleValues = is3Point ? [1, 2, 3] : [1, 2, 3, 4, 5]
    const displayType = config?.display_options?.item_display_type || 'text'

    const colorClassMap = {
      success: 'bg-green-100 border-green-400 text-green-800',
      warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      danger: 'bg-red-100 border-red-400 text-red-800',
      gray: 'bg-gray-100 border-gray-300 text-gray-700'
    }

    const cols = is3Point ? 'grid-cols-3' : 'grid-cols-5'
    return (
      <div className={clsx('grid gap-2', cols)}>
        {scaleValues.map((value) => {
          const { displayText, ariaLabel } = getValueLabels(item, value, displayType)
          const compareValue = is3Point ? normalizeScaleValue(value, 3) : value
          const isSelected = selectedValue === compareValue
          const tone = getItemColor(item, compareValue)
          const selectedClasses = colorClassMap[tone] || colorClassMap.gray
          const showCaption = displayType === 'face'
          const labelIndex = (is3Point ? value : value) - 1
          const captionText = item.textOptions?.[labelIndex]
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleValueSelect(compareValue)}
              className={clsx(
                'p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-medium flex flex-col items-center justify-center min-h-[80px] w-full',
                isSelected ? `${selectedClasses} shadow-medium` : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              )}
            >
              <span className="text-2xl mb-1" aria-label={ariaLabel}>{displayText}</span>
              {showCaption && (
                <span className="text-xs opacity-75">{captionText}</span>
              )}
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
            {item.optionLabels?.[option] || option}
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

  const renderDateInput = (item) => {
    return (
      <div className="flex items-center justify-center space-x-4 w-full">
        <input
          type="date"
          value={selectedValue || ''}
          onChange={(e) => setSelectedValue(e.target.value || null)}
          className="input w-full max-w-sm"
        />
        {selectedValue && (
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
            {selectedItem.name}
          </h3>
          {selectedItem.description && (
            <p className="text-sm text-gray-600 mb-1">{selectedItem.description}</p>
          )}
        </div>
        
        <div className="space-y-4">
          {(selectedItem.scale_type === '3-point' ||
            selectedItem.scale_type === '5-point' ||
            selectedItem.scale === 3 ||
            selectedItem.scale === 5) ? (
            renderScaleButtons(selectedItem)
          ) : (selectedItem.scale_type === 'multi-select' || selectedItem.type === 'multi-select') ? (
            renderMultiSelect(selectedItem)
          ) : (selectedItem.scale_type === 'numeric' || selectedItem.type === 'number') ? (
            renderNumberInput(selectedItem)
          ) : (selectedItem.type === 'date') ? (
            renderDateInput(selectedItem)
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
            <div className="text-lg font-medium mb-2">{item.name}</div>
            <div className="text-sm text-gray-500 capitalize">{item.category}</div>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="quick-track-view bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
      <div className="max-w-2xl mx-auto p-6">
        <div ref={topAnchorRef} className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 ref={headingRef} tabIndex="-1" className="text-2xl font-bold text-green-800 mb-2">Quick Track ⚡</h1>
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
