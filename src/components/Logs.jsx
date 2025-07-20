import React, { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../stores/appStore'
import { TRACKING_ITEMS, getDisplayValue, getItemColor } from '../constants/trackingItems'
import { format, parseISO, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

const Logs = () => {
  const { trackingData, deleteEntry, restoreEntry, addNotification, generateTestData, loadAllHistoricalData, importTrackingData } = useAppStore()
  
  // State for filtering and UI
  const [dateRange, setDateRange] = useState('last7days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedView, setSelectedView] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [sortBy, setSortBy] = useState('timestamp')
  const [sortOrder, setSortOrder] = useState('desc')
  const [exportFormat, setExportFormat] = useState('json')
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [exportScope, setExportScope] = useState('all')
  const [importError, setImportError] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState('')

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

  // Export functions
  const exportToJSON = (data) => {
    const exportData = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      total_entries: data.length,
      date_range: {
        start: customStartDate || 'all',
        end: customEndDate || 'all'
      },
      entries: data
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tracking-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToCSV = (data) => {
    if (data.length === 0) {
      addNotification({
        type: 'error',
        title: 'Export failed',
        message: 'No data to export.'
      })
      return
    }

    // Get all unique keys from all entries
    const allKeys = new Set()
    data.forEach(entry => {
      Object.keys(entry).forEach(key => {
        if (key !== 'notes' || typeof entry[key] === 'string') {
          allKeys.add(key)
        }
      })
    })

    // Add note fields separately
    allKeys.add('notes_observations')
    allKeys.add('notes_reflections')
    allKeys.add('notes_thankful_for')

    const headers = Array.from(allKeys)
    const csvRows = [headers.join(',')]

    data.forEach(entry => {
      const row = headers.map(header => {
        let value = ''
        
        if (header.startsWith('notes_')) {
          const noteField = header.replace('notes_', '')
          value = entry.notes?.[noteField] || ''
        } else if (header === 'notes') {
          value = typeof entry.notes === 'string' ? entry.notes : ''
        } else {
          value = entry[header] || ''
        }
        
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`
        }
        
        return value
      })
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tracking-export-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExport = () => {
    try {
      const dataToExport = exportScope === 'all' ? trackingData.entries : filteredEntries
      
      if (dataToExport.length === 0) {
        addNotification({
          type: 'error',
          title: 'Export failed',
          message: 'No data to export.'
        })
        return
      }

      if (exportFormat === 'json') {
        exportToJSON(dataToExport)
      } else if (exportFormat === 'csv') {
        exportToCSV(dataToExport)
      }

      addNotification({
        type: 'success',
        title: 'Export successful',
        message: `Exported ${dataToExport.length} entries as ${exportFormat.toUpperCase()}.`
      })
      
      setShowExportModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export failed',
        message: 'Failed to export data. Please try again.'
      })
    }
  }

  // Import functions
  const handleImport = async (file) => {
    try {
      setImportError('')
      setImportSuccess('')
      setIsImporting(true)
      
      const text = await file.text()
      const importData = JSON.parse(text)
      
      // Use the app store import function
      const result = await importTrackingData(importData)
      
      const successMessage = `Successfully imported ${result.entriesImported} entries across ${result.monthsImported} months.`
      
      addNotification({
        type: 'success',
        title: 'Import successful',
        message: successMessage
      })
      
      // Set prominent success message
      setImportSuccess(successMessage)
      
      // Reload historical data to show imported entries
      await loadAllHistoricalData()
      
      setShowImportModal(false)
    } catch (error) {
      console.error('Import error:', error)
      setImportError(error.message || 'Failed to import data. Please check the file format.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      handleImport(file)
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
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setImportError('')
                setImportSuccess('')
                setShowImportModal(true)
              }}
              className="btn-secondary px-4 py-2 text-sm"
              title="Import tracking data from a backup file"
            >
              📥 Import
            </button>
            
            <button
              onClick={() => setShowExportModal(true)}
              className="btn-primary px-4 py-2 text-sm"
              title="Export tracking data for backup or analysis"
            >
              📤 Export
            </button>
            
            <button
              onClick={() => {
                const result = generateTestData()
                addNotification({
                  type: 'success',
                  title: 'Test Data Generated',
                  message: `Generated ${result.entriesGenerated} entries across ${result.monthsGenerated} months for testing date ranges.`
                })
              }}
              className="btn-secondary px-4 py-2 text-sm"
              title="Generate 60 days of test data to test date range filtering"
            >
              🧪 Generate Test Data
            </button>
          </div>
        </div>
        <h1 className="wildflower-header text-4xl mb-4">📝 Tracking Logs</h1>
        <p className="text-gray-600 text-center">
          Review and manage your historical tracking data
        </p>
      </div>

      {/* Success Banner */}
      {importSuccess && (
        <div className="mb-6 meadow-card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-green-600 mr-3 text-xl">✅</div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Import Successful!</h3>
                <p className="text-green-700">{importSuccess}</p>
              </div>
            </div>
            <button
              onClick={() => setImportSuccess('')}
              className="text-green-600 hover:text-green-800"
              title="Dismiss success message"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
          Showing {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="meadow-card max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="input w-full"
                >
                  <option value="json">JSON (Backup/Restore)</option>
                  <option value="csv">CSV (Spreadsheet Analysis)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Scope
                </label>
                <select
                  value={exportScope}
                  onChange={(e) => setExportScope(e.target.value)}
                  className="input w-full"
                >
                  <option value="all">All Data</option>
                  <option value="filtered">Current Filter Results</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>JSON:</strong> Complete backup with metadata</p>
                <p><strong>CSV:</strong> Spreadsheet-friendly format for analysis</p>
                <p><strong>All Data:</strong> Export everything in your account</p>
                <p><strong>Filtered:</strong> Export only the currently filtered results</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="btn-primary px-4 py-2"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="meadow-card max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Import Tracking Data</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="importFile" className="block text-sm font-medium text-gray-700 mb-2">
                  Select JSON File to Import
                </label>
                <input
                  type="file"
                  id="importFile"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-2 text-sm text-gray-600">
                  Select a JSON file containing tracking data to import.
                  The file should be a valid export from this application.
                </p>
              </div>
              
              {/* Error Display */}
              {importError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="text-red-600 mr-3 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="text-sm font-medium text-red-800 mb-1">Import Error</h4>
                      <p className="text-sm text-red-700">{importError}</p>
                      <p className="text-xs text-red-600 mt-2">
                        Please check that your file is a valid JSON export from this application.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Loading State */}
              {isImporting && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
                    <p className="text-sm text-blue-800">Importing data...</p>
                  </div>
                </div>
              )}
              
              {/* Success Message */}
              {importSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="text-green-600 mr-3 mt-0.5">✅</div>
                    <div>
                      <h4 className="text-sm font-medium text-green-800 mb-1">Import Successful</h4>
                      <p className="text-sm text-green-700">{importSuccess}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <p className="font-medium mb-2">Import Information:</p>
                <p>• <strong>JSON Format:</strong> Only JSON export files from this app are supported</p>
                <p>• <strong>Data Validation:</strong> Invalid entries will be automatically filtered out</p>
                <p>• <strong>Existing Data:</strong> Imported entries will be added to your existing data</p>
                <p>• <strong>Backup:</strong> Consider exporting your current data before importing</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="btn-secondary px-4 py-2"
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                onClick={() => document.getElementById('importFile').click()}
                className="btn-primary px-4 py-2"
                disabled={isImporting}
              >
                {isImporting ? 'Importing...' : 'Select File & Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Logs 