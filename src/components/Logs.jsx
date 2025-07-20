import React, { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../stores/appStore'
import { TRACKING_ITEMS, getDisplayValue, getItemColor } from '../constants/trackingItems'
import { format, parseISO, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

const Logs = () => {
  const { trackingData, deleteEntry, restoreEntry, addNotification, generateTestData, loadAllHistoricalData } = useAppStore()
  
  // State for filtering and UI
  const [dateRange, setDateRange] = useState('last7days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedView, setSelectedView] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [sortBy, setSortBy] = useState('timestamp')
  const [sortOrder, setSortOrder] = useState('desc')

  // Load all historical data when component mounts
  useEffect(() => {
    loadAllHistoricalData()
  }, [loadAllHistoricalData])

  // Get date range based on selection
  const getDateRange = () => {
    const now = new Date()
    
    switch (dateRange) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) }
      case 'yesterday':
        const yesterday = subDays(now, 1)
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) }
      case 'last7days':
        return { start: subDays(now, 7), end: now }
      case 'last30days':
        return { start: subDays(now, 30), end: now }
      case 'thisWeek':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case 'custom':
        if (customStartDate && customEndDate) {
          return { 
            start: startOfDay(parseISO(customStartDate)), 
            end: endOfDay(parseISO(customEndDate)) 
          }
        }
        return { start: subDays(now, 7), end: now }
      default:
        return { start: subDays(now, 7), end: now }
    }
  }

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    const { start, end } = getDateRange()
    
    let entries = trackingData.entries.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      const isInDateRange = entryDate >= start && entryDate <= end
      const matchesView = selectedView === 'all' || entry.type === selectedView
      const matchesSearch = !searchTerm || 
        entry.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.entries(entry).some(([key, value]) => {
          if (key === 'notes' && typeof value === 'object') {
            return Object.values(value).some(note => 
              note && note.toLowerCase().includes(searchTerm.toLowerCase())
            )
          }
          // Search through item names and display values
          if (key !== 'id' && key !== 'timestamp' && key !== 'type' && 
              key !== 'sync_status' && key !== 'is_deleted' && key !== 'created_at' && 
              key !== 'updated_at' && value !== undefined && value !== null && value !== '') {
            
            const item = TRACKING_ITEMS[key]
            if (item) {
              // Search through item name
              if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return true
              }
              
              // Search through display value
              let displayValue = value
              if (Array.isArray(value)) {
                displayValue = value.map(v => item.optionLabels?.[v] || v.replace(/_/g, ' ')).join(', ')
              } else if (typeof value === 'number' && item.scale) {
                displayValue = getDisplayValue(item, value, 'text')
              }
              
              if (displayValue.toString().toLowerCase().includes(searchTerm.toLowerCase())) {
                return true
              }
            }
          }
          
          // Also search through raw values
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        })
      const matchesDeleted = showDeleted ? true : !entry.is_deleted
      
      return isInDateRange && matchesView && matchesSearch && matchesDeleted
    })

    // Sort entries
    entries.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp)
          bValue = new Date(b.timestamp)
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'sync_status':
          aValue = a.sync_status
          bValue = b.sync_status
          break
        default:
          aValue = new Date(a.timestamp)
          bValue = new Date(b.timestamp)
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return entries
  }, [trackingData.entries, dateRange, customStartDate, customEndDate, selectedView, searchTerm, showDeleted, sortBy, sortOrder])

  // Handle entry deletion (soft delete)
  const handleDeleteEntry = async (entryId) => {
    try {
      await deleteEntry(entryId)
      addNotification({
        type: 'success',
        title: 'Entry deleted',
        message: 'Entry has been moved to trash. You can restore it later.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: 'Failed to delete entry. Please try again.'
      })
    }
  }

  // Handle entry restoration
  const handleRestoreEntry = async (entryId) => {
    try {
      await restoreEntry(entryId)
      addNotification({
        type: 'success',
        title: 'Entry restored',
        message: 'Entry has been restored successfully.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Restore failed',
        message: 'Failed to restore entry. Please try again.'
      })
    }
  }

  // Render entry data in a readable format
  const renderEntryData = (entry) => {
    const dataItems = []
    
    // Add tracking items
    Object.entries(entry).forEach(([key, value]) => {
      if (key === 'notes' && typeof value === 'object') {
        Object.entries(value).forEach(([noteKey, noteValue]) => {
          if (noteValue) {
            dataItems.push({
              label: noteKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              value: noteValue,
              type: 'note'
            })
          }
        })
      } else if (key !== 'id' && key !== 'timestamp' && key !== 'type' && 
                 key !== 'sync_status' && key !== 'is_deleted' && key !== 'created_at' && 
                 key !== 'updated_at' && value !== undefined && value !== null && value !== '') {
        const item = TRACKING_ITEMS[key]
        if (item) {
          let displayValue = value
          if (Array.isArray(value)) {
            displayValue = value.map(v => item.optionLabels?.[v] || v.replace(/_/g, ' ')).join(', ')
          } else if (typeof value === 'number' && item.scale) {
            displayValue = getDisplayValue(item, value, 'text')
          }
          dataItems.push({
            label: item.name,
            value: displayValue,
            type: 'tracking'
          })
        }
      }
    })
    
    return dataItems
  }

  // Format date range for display
  const formatDateRange = (range) => {
    const mappings = {
      'today': 'today',
      'yesterday': 'yesterday', 
      'last7days': 'last 7 days',
      'last30days': 'last 30 days',
      'thisWeek': 'this week',
      'thisMonth': 'this month',
      'custom': 'custom range'
    }
    return mappings[range] || range
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link 
            to="/" 
            className="btn-secondary px-4 py-2 text-sm flex items-center"
          >
            <span className="mr-2">←</span>
            Back to Dashboard
          </Link>
          
          <button
            onClick={() => {
              const result = generateTestData()
              addNotification({
                type: 'success',
                title: 'Test Data Generated',
                message: `Generated ${result.entriesGenerated} entries across ${result.monthsGenerated} months for testing date ranges.`
              })
            }}
            className="btn-primary px-4 py-2 text-sm"
            title="Generate 60 days of test data to test date range filtering"
          >
            🧪 Generate Test Data
          </button>
        </div>
        <h1 className="wildflower-header text-4xl mb-4">📝 Tracking Logs</h1>
        <p className="text-gray-600 text-center">
          Review and manage your historical tracking data
        </p>
      </div>

      {/* Filters */}
      <div className="meadow-card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="input"
                />
              </div>
            </>
          )}

          {/* View Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              View Type
            </label>
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              className="input"
            >
              <option value="all">All Views</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="quick">Quick</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by item name, value, or notes..."
              className="input"
              title="Search through item names (e.g., 'Energy Level'), values (e.g., 'High'), or notes content"
            />
          </div>
        </div>

        {/* Additional Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showDeleted"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="showDeleted" className="text-sm text-gray-700">
              Show deleted entries
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input"
            >
              <option value="timestamp">Date & Time</option>
              <option value="type">View Type</option>
              <option value="sync_status">Sync Status</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="input"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing {filteredEntries.length} entry{filteredEntries.length !== 1 ? 's' : ''}
          {dateRange !== 'custom' && (
            <span> for {formatDateRange(dateRange)}</span>
          )}
        </p>
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="meadow-card text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No entries found</h3>
            <p className="text-gray-600">
              Try adjusting your filters or date range to see more entries.
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const entryData = renderEntryData(entry)
            const isDeleted = entry.is_deleted
            
            return (
              <div
                key={entry.id}
                className={clsx(
                  'meadow-card transition-all duration-200',
                  isDeleted && 'opacity-60 bg-gray-100'
                )}
              >
                {/* Entry Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={clsx(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      entry.type === 'morning' ? 'bg-yellow-100 text-yellow-800' :
                      entry.type === 'evening' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    )}>
                      {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className={clsx(
                      'px-2 py-1 rounded text-xs font-medium',
                      entry.sync_status === 'synced' ? 'bg-green-100 text-green-800' :
                      entry.sync_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    )}>
                      {entry.sync_status}
                    </div>
                    {isDeleted && (
                      <div className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        Deleted
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isDeleted ? (
                      <button
                        onClick={() => handleRestoreEntry(entry.id)}
                        className="btn-secondary px-3 py-1 text-sm"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="btn-danger px-3 py-1 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Entry Data */}
                {entryData.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {entryData.map((item, index) => (
                      <div key={index} className="border border-cream-300 rounded-lg p-3 bg-cream-50">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          {item.label}
                        </div>
                        <div className={clsx(
                          'text-sm',
                          item.type === 'note' ? 'text-gray-600 italic' : 'text-gray-800'
                        )}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Logs 