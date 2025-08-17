import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../stores/app-store.js'
import { TRACKING_ITEMS, getDisplayValue, getItemColor, getItemEffectiveScale } from '../constants/tracking-items.js'
import { format, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isWithinInterval } from 'date-fns'
import { clsx } from 'clsx'
import AppHeader from './app-header.jsx';
import ReauthBanner from './reauth-banner.jsx';
import { i18n } from '../utils/i18n.js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const Insights = () => {
  const { trackingData, loadAllHistoricalData } = useAppStore()
  const [selectedTimeframe, setSelectedTimeframe] = useState('6weeks')
  const [selectedView, setSelectedView] = useState('all')
  const [selectedItem, setSelectedItem] = useState(() => {
    // Load the last selected item from localStorage, default to 'hot_flashes'
    const savedItem = localStorage.getItem('insights-selected-item')
    return savedItem || 'hot_flashes'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { auth, signOut, addNotification } = useAppStore()

  // For config modals and notifications
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false)
  const [configImportError, setConfigImportError] = useState('')
  const [isConfigImporting, setIsConfigImporting] = useState(false)
  const [configImportSuccess, setConfigImportSuccess] = useState('')

  // Calculate 6-week date range (inclusive of current week and today)
  const getDateRange = () => {
    const now = new Date()
    // Use today as the end date to ensure today's data is included
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startDate = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 5) // 6 weeks back
    return { startDate, endDate }
  }

  // Load historical data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await loadAllHistoricalData()
      } catch (error) {
        console.error('Failed to load historical data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [loadAllHistoricalData])

  // Save selected item to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('insights-selected-item', selectedItem)
  }, [selectedItem])

  // Filter data for selected timeframe
  const filteredData = useMemo(() => {
    if (!trackingData.entries || trackingData.entries.length === 0) return []

    const { startDate, endDate } = getDateRange()
    
    const filtered = trackingData.entries.filter(entry => {
      // Parse the entry timestamp and truncate to date only for comparison
      const entryDate = parseISO(entry.timestamp)
      const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())
      
      // Compare dates only (not timestamps) to avoid time-of-day issues
      const isInRange = entryDateOnly >= startDate && entryDateOnly <= endDate
      const matchesView = selectedView === 'all' || entry.type === selectedView
      return isInRange && matchesView
    })



    return filtered
  }, [trackingData.entries, selectedView, selectedItem])

  // Get available tracking items for analysis
  const availableItems = useMemo(() => {
    const items = Object.values(TRACKING_ITEMS).filter(item => {
      // Only include items that have numeric scales or are relevant for trends
      return item.scale || item.type === 'number'
    })
    return items
  }, [])

  // Calculate trends for selected item
  const calculateTrends = (itemId) => {
    if (!filteredData.length) return null

    const item = TRACKING_ITEMS[itemId]
    
    const itemData = filteredData
      .map(entry => ({
        value: entry[itemId],
        date: parseISO(entry.timestamp),
        type: entry.type
      }))
      .filter(d => d.value !== undefined && d.value !== null)

    if (itemData.length === 0) return null

    // Group by actual weeks (Monday to Sunday)
    const weeklyData = {}
    itemData.forEach(d => {
      const weekStart = startOfWeek(d.date, { weekStartsOn: 1 }) // Monday start
      const weekKey = format(weekStart, 'yyyy-MM-dd')
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = []
      }
      weeklyData[weekKey].push(d.value)
    })

    // Calculate weekly averages and ensure we have 6 weeks of data
    const { startDate } = getDateRange()
    const weeklyAverages = []
    
    for (let i = 0; i < 6; i++) {
      const weekStart = new Date(startDate)
      weekStart.setDate(weekStart.getDate() + (i * 7))
      const weekKey = format(weekStart, 'yyyy-MM-dd')
      const weekValues = weeklyData[weekKey] || []
      
      weeklyAverages.push({
        week: weekKey,
        weekNumber: i + 1,
        average: weekValues.length > 0 ? weekValues.reduce((sum, val) => sum + val, 0) / weekValues.length : 0,
        count: weekValues.length
      })
    }

    // Calculate trend direction
    const validWeeks = weeklyAverages.filter(w => w.count > 0)
    if (validWeeks.length < 2) return { direction: 'stable', change: 0 }

    const firstWeek = validWeeks[0].average
    const lastWeek = validWeeks[validWeeks.length - 1].average
    const change = lastWeek - firstWeek
    const percentChange = firstWeek > 0 ? (change / firstWeek) * 100 : 0

    // Determine direction based on whether high or low is good
    const isHighGood = item.good === 'high'
    let direction = 'stable'
    if (Math.abs(percentChange) > 5) {
      if (isHighGood) {
        direction = percentChange > 0 ? 'improving' : 'declining'
      } else {
        direction = percentChange > 0 ? 'declining' : 'improving'
      }
    }

    return {
      direction,
      change: percentChange,
      weeklyAverages,
      totalEntries: itemData.length,
      averageValue: itemData.reduce((sum, d) => sum + d.value, 0) / itemData.length
    }
  }

  // Get insights and recommendations
  const analyzeWeeklyPatterns = (itemId) => {
    const itemData = filteredData
      .map(entry => ({
        value: entry[itemId],
        date: parseISO(entry.timestamp),
        dayOfWeek: format(parseISO(entry.timestamp), 'EEE')
      }))
      .filter(d => d.value !== undefined && d.value !== null)

    if (itemData.length < 7) return null

    // Group by day of week
    const dayAverages = {}
    const dayCounts = {}
    
    itemData.forEach(point => {
      if (!dayAverages[point.dayOfWeek]) {
        dayAverages[point.dayOfWeek] = 0
        dayCounts[point.dayOfWeek] = 0
      }
      dayAverages[point.dayOfWeek] += point.value
      dayCounts[point.dayOfWeek] += 1
    })

    // Calculate averages
    Object.keys(dayAverages).forEach(day => {
      dayAverages[day] = dayAverages[day] / dayCounts[day]
    })

    // Find patterns
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const dayNames = {
      'Mon': 'Mondays',
      'Tue': 'Tuesdays', 
      'Wed': 'Wednesdays',
      'Thu': 'Thursdays',
      'Fri': 'Fridays',
      'Sat': 'Saturdays',
      'Sun': 'Sundays'
    }
    const validDays = days.filter(day => dayAverages[day] !== undefined)
    
    if (validDays.length < 3) return null

    const overallAverage = Object.values(dayAverages).reduce((sum, val) => sum + val, 0) / Object.values(dayAverages).length
    
    const patterns = []
    
    // Find highest and lowest days
    const sortedDays = validDays.sort((a, b) => dayAverages[b] - dayAverages[a])
    const highestDay = sortedDays[0]
    const lowestDay = sortedDays[sortedDays.length - 1]
    
    const item = TRACKING_ITEMS[itemId]
    const isHighGood = item.good === 'high'
    
    if (dayAverages[highestDay] > overallAverage * 1.1) {
      const message = isHighGood 
        ? `${dayNames[highestDay]} show your highest ${item.name.toLowerCase()} (${dayAverages[highestDay].toFixed(1)} vs ${overallAverage.toFixed(1)} average).`
        : `${dayNames[highestDay]} show your highest ${item.name.toLowerCase()} (${dayAverages[highestDay].toFixed(1)} vs ${overallAverage.toFixed(1)} average).`
      
      patterns.push({
        type: isHighGood ? 'positive' : 'warning',
        message: message
      })
    }
    
    if (dayAverages[lowestDay] < overallAverage * 0.9) {
      const message = isHighGood
        ? `${dayNames[lowestDay]} show your lowest ${item.name.toLowerCase()} (${dayAverages[lowestDay].toFixed(1)} vs ${overallAverage.toFixed(1)} average).`
        : `${dayNames[lowestDay]} show your lowest ${item.name.toLowerCase()} (${dayAverages[lowestDay].toFixed(1)} vs ${overallAverage.toFixed(1)} average).`
      
      patterns.push({
        type: isHighGood ? 'warning' : 'positive',
        message: message
      })
    }

    // Check for weekend vs weekday patterns
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    const weekends = ['Sat', 'Sun']
    
    const weekdayAvg = weekdays
      .filter(day => dayAverages[day] !== undefined)
      .reduce((sum, day) => sum + dayAverages[day], 0) / weekdays.filter(day => dayAverages[day] !== undefined).length
    
    const weekendAvg = weekends
      .filter(day => dayAverages[day] !== undefined)
      .reduce((sum, day) => sum + dayAverages[day], 0) / weekends.filter(day => dayAverages[day] !== undefined).length
    
    if (weekdayAvg > 0 && weekendAvg > 0) {
      if (weekendAvg > weekdayAvg * 1.1) {
        const message = isHighGood
          ? `Your ${item.name.toLowerCase()} is ${((weekendAvg - weekdayAvg) / weekdayAvg * 100).toFixed(1)}% higher on weekends. Rest and recovery might be helping!`
          : `Your ${item.name.toLowerCase()} is ${((weekendAvg - weekdayAvg) / weekdayAvg * 100).toFixed(1)}% higher on weekends. You might want to investigate what's causing this increase.`
        
        patterns.push({
          type: isHighGood ? 'positive' : 'warning',
          message: message
        })
      } else if (weekdayAvg > weekendAvg * 1.1) {
        const message = isHighGood
          ? `Your ${item.name.toLowerCase()} is ${((weekdayAvg - weekendAvg) / weekendAvg * 100).toFixed(1)}% higher on weekdays. Your daily routine might be energizing you!`
          : `Your ${item.name.toLowerCase()} is ${((weekdayAvg - weekendAvg) / weekendAvg * 100).toFixed(1)}% higher on weekdays. Daily routine stress might be contributing to this.`
        
        patterns.push({
          type: isHighGood ? 'info' : 'warning',
          message: message
        })
      }
    }

    return patterns
  }

  const analyzeTextPatterns = (itemId) => {
    const textData = filteredData
      .filter(entry => entry.type === 'evening')
      .map(entry => ({
        date: parseISO(entry.timestamp),
        dayOfWeek: format(parseISO(entry.timestamp), 'EEE'),
        observations: entry.notes?.observations || '',
        reflections: entry.notes?.reflections || '',
        thankful_for: entry.notes?.thankful_for || '',
        energy_level: entry.energy_level,
        mood: entry.mood,
        sleep_quality: entry.sleep_quality
      }))
      .filter(d => d.observations || d.reflections || d.thankful_for)

    if (textData.length < 5) return null // Need at least 5 entries for meaningful patterns

    const insights = []

    // Writing consistency insights
    const totalEveningEntries = filteredData.filter(entry => entry.type === 'evening').length
    const entriesWithText = textData.length
    const writingRate = (entriesWithText / totalEveningEntries) * 100

    if (writingRate >= 70) {
      insights.push({
        type: 'positive',
        message: `You've written in your evening reports ${writingRate.toFixed(0)}% of the time.`
      })
    } else if (writingRate >= 50) {
      insights.push({
        type: 'info',
        message: `You've written in your evening reports ${writingRate.toFixed(0)}% of the time.`
      })
    }

    // Writing length patterns (correlation with numeric data)
    const entriesWithEnergy = textData.filter(d => d.energy_level)
    if (entriesWithEnergy.length >= 3) {
      const highEnergyEntries = entriesWithEnergy.filter(d => d.energy_level >= 4)
      const lowEnergyEntries = entriesWithEnergy.filter(d => d.energy_level <= 2)
      
      if (highEnergyEntries.length > 0 && lowEnergyEntries.length > 0) {
        const highEnergyAvgLength = highEnergyEntries.reduce((sum, d) => 
          sum + (d.observations.length + d.reflections.length + d.thankful_for.length), 0) / highEnergyEntries.length
        const lowEnergyAvgLength = lowEnergyEntries.reduce((sum, d) => 
          sum + (d.observations.length + d.reflections.length + d.thankful_for.length), 0) / lowEnergyEntries.length
        
        if (highEnergyAvgLength > lowEnergyAvgLength * 1.5) {
          insights.push({
            type: 'info',
            message: `Your writing tends to be more detailed on high-energy days. This could help identify what contributes to your energy levels.`
          })
        }
      }
    }

    // Writing frequency by day of week
    const dayWritingCounts = {}
    textData.forEach(entry => {
      if (!dayWritingCounts[entry.dayOfWeek]) {
        dayWritingCounts[entry.dayOfWeek] = 0
      }
      dayWritingCounts[entry.dayOfWeek]++
    })

    const mostWritingDay = Object.entries(dayWritingCounts)
      .sort(([,a], [,b]) => b - a)[0]
    
    if (mostWritingDay && mostWritingDay[1] >= 3) {
      const dayNames = {
        'Mon': 'Mondays', 'Tue': 'Tuesdays', 'Wed': 'Wednesdays',
        'Thu': 'Thursdays', 'Fri': 'Fridays', 'Sat': 'Saturdays', 'Sun': 'Sundays'
      }
      insights.push({
        type: 'info',
        message: `${dayNames[mostWritingDay[0]]} are your most active journaling days.`
      })
    }

    // Correlation with sleep quality
    const entriesWithSleep = textData.filter(d => d.sleep_quality)
    if (entriesWithSleep.length >= 3) {
      const goodSleepEntries = entriesWithSleep.filter(d => d.sleep_quality >= 4)
      const poorSleepEntries = entriesWithSleep.filter(d => d.sleep_quality <= 2)
      
      if (goodSleepEntries.length > 0 && poorSleepEntries.length > 0) {
        const goodSleepAvgLength = goodSleepEntries.reduce((sum, d) => 
          sum + (d.observations.length + d.reflections.length + d.thankful_for.length), 0) / goodSleepEntries.length
        const poorSleepAvgLength = poorSleepEntries.reduce((sum, d) => 
          sum + (d.observations.length + d.reflections.length + d.thankful_for.length), 0) / poorSleepEntries.length
        
        if (goodSleepAvgLength > poorSleepAvgLength * 1.3) {
          insights.push({
            type: 'info',
            message: `Your writing is more detailed after nights with better sleep. Good sleep might help with reflection and self-awareness.`
          })
        }
      }
    }

    return insights
  }

  const getInsights = (itemId, trends) => {
    if (!trends) return []

    const item = TRACKING_ITEMS[itemId]
    const insights = []

    // Trend insights
    const isHighGood = item.good === 'high'
    if (trends.direction === 'improving') {
              const message = isHighGood
          ? `Your ${item.name.toLowerCase()} has improved by ${Math.abs(trends.change).toFixed(1)}% over the last 6 weeks.`
          : `Your ${item.name.toLowerCase()} has decreased by ${Math.abs(trends.change).toFixed(1)}% over the last 6 weeks.`
      
      insights.push({
        type: 'positive',
        message: message
      })
    } else if (trends.direction === 'declining') {
      const message = isHighGood
        ? `Your ${item.name.toLowerCase()} has declined by ${Math.abs(trends.change).toFixed(1)}% over the last 6 weeks.`
        : `Your ${item.name.toLowerCase()} has increased by ${Math.abs(trends.change).toFixed(1)}% over the last 6 weeks.`
      
      insights.push({
        type: 'warning',
        message: message
      })
    }

    // Frequency insights
    if (trends.totalEntries < 10) {
      insights.push({
        type: 'info',
        message: `You've tracked ${item.name.toLowerCase()} ${trends.totalEntries} times. More frequent tracking will provide better insights.`
      })
    }

    // Value-based insights
    const effectiveScale = getItemEffectiveScale(item)
    if (item.good === 'high' && trends.averageValue < effectiveScale * 0.6) {
      insights.push({
        type: 'suggestion',
        message: `Your average ${item.name.toLowerCase()} is on the lower side. Consider what factors might be contributing to this.`
      })
    } else if (item.good === 'low' && trends.averageValue > effectiveScale * 0.6) {
      insights.push({
        type: 'suggestion',
        message: `Your average ${item.name.toLowerCase()} is on the higher side. Consider what factors might be contributing to this.`
      })
    }

    // Weekly pattern insights
    const weeklyPatterns = analyzeWeeklyPatterns(itemId)
    if (weeklyPatterns && weeklyPatterns.length > 0) {
      insights.push(...weeklyPatterns)
    }

    return insights
  }

  // Render trend chart
  const renderTrendChart = (trends) => {
    if (!trends || !trends.weeklyAverages) return null

    const validWeeks = trends.weeklyAverages.filter(w => w.count > 0)
    if (validWeeks.length === 0) return null

    // Get all individual data points for scatter plot
    const itemData = filteredData
      .map(entry => ({
        value: entry[selectedItem],
        date: parseISO(entry.timestamp),
        type: entry.type
      }))
      .filter(d => d.value !== undefined && d.value !== null)
      .sort((a, b) => a.date - b.date)

    if (itemData.length === 0) return null

    const item = TRACKING_ITEMS[selectedItem]
    const isWearable = !item?.textOptions || item.textOptions.length === 0
    
    // Calculate 7-day running average
    const calculateRunningAverage = (data, windowSize = 7) => {
      const runningAverages = []
      
      for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - windowSize + 1)
        const end = i + 1
        const window = data.slice(start, end)
        const average = window.reduce((sum, d) => sum + d.value, 0) / window.length
        runningAverages.push(average)
      }
      
      return runningAverages
    }

    // Group data by date for proper scatter plot
    const groupedData = {}
    itemData.forEach(d => {
      const dateKey = format(d.date, 'yyyy-MM-dd')
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: d.date,
          values: [],
          label: format(d.date, 'EEE, M/d')
        }
      }
      groupedData[dateKey].values.push(d.value)
    })

    // Convert grouped data to arrays for Chart.js
    const uniqueDates = Object.keys(groupedData).sort()
    const labels = uniqueDates.map(dateKey => groupedData[dateKey].label)
    
    // Create scatter plot data - each value gets its own point at the same x position
    const scatterData = []
    uniqueDates.forEach((dateKey, dateIndex) => {
      const dateData = groupedData[dateKey]
      dateData.values.forEach(value => {
        scatterData.push({
          x: dateIndex, // Use index for x position
          y: value
        })
      })
    })

    // Calculate running average based on daily averages
    const dailyAverages = uniqueDates.map(dateKey => {
      const values = groupedData[dateKey].values
      return values.reduce((sum, val) => sum + val, 0) / values.length
    })
    const runningAverages = calculateRunningAverage(dailyAverages.map((avg, index) => ({ value: avg, date: groupedData[uniqueDates[index]].date })))
    
    // Format running averages for Chart.js with proper x coordinates
    const runningAverageData = runningAverages.map((avg, index) => ({
      x: index,
      y: avg
    }))

    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Data Points',
          data: scatterData,
          borderColor: '#C41E3A',
          backgroundColor: '#C41E3A',
          pointBackgroundColor: '#C41E3A',
          pointBorderColor: '#C41E3A',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 0,
          fill: false,
          tension: 0,
          showLine: false, // Only show points, not connecting lines
        },
        {
          label: '7-Day Average',
          data: runningAverageData,
          borderColor: 'orange',
          backgroundColor: 'rgba(196, 30, 58, 0.1)',
          pointBackgroundColor: 'transparent',
          pointBorderColor: 'transparent',
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.1,
          showLine: true,
        }
      ]
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: false,
            padding: 20,
            font: {
              size: 12
            },
            generateLabels: function(chart) {
              const datasets = chart.data.datasets
              return datasets.map((dataset, index) => {
                const label = dataset.label || `Dataset ${index}`
                
                if (dataset.showLine === false) {
                  // For scatter points, show a circle
                  return {
                    text: label,
                    fillStyle: dataset.pointBackgroundColor,
                    strokeStyle: dataset.pointBorderColor,
                    lineWidth: 0,
                    pointStyle: 'circle',
                    hidden: !chart.isDatasetVisible(index),
                    index: index
                  }
                } else {
                  // For line data, show a thin line
                  return {
                    text: label,
                    fillStyle: 'transparent',
                    strokeStyle: dataset.borderColor,
                    lineWidth: 1,
                    lineDash: dataset.borderDash || [],
                    pointStyle: 'line',
                    hidden: !chart.isDatasetVisible(index),
                    index: index
                  }
                }
              })
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: function(context) {
              if (!context || context.length === 0) return ''
              
              // For scatter data, get the x coordinate to determine the date index
              let dataIndex
              if (context[0].datasetIndex === 0) {
                // Scatter data - use x coordinate
                dataIndex = context[0].parsed.x
              } else {
                // Line data - use dataIndex
                dataIndex = context[0].dataIndex
              }
              
              if (dataIndex === undefined || dataIndex < 0 || dataIndex >= uniqueDates.length) return ''
              
              const dateKey = uniqueDates[dataIndex]
              if (!dateKey || !groupedData[dateKey] || !groupedData[dateKey].date) return ''
              
              return format(groupedData[dateKey].date, 'EEE, MMM d, yyyy')
            },
            label: function(context) {
              if (!context) return ''
              
              const label = context.dataset.label || ''
              const value = context.parsed?.y
              if (value === undefined || value === null) return label
              
              return `${label}: ${value.toFixed(1)}`
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          display: true,
          title: {
            display: false
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 10
            },
            callback: function(value, index) {
              // Convert the tick value to the nearest integer index
              const dataIndex = Math.round(value)
              if (dataIndex >= 0 && dataIndex < labels.length) {
                return labels[dataIndex]
              }
              return ''
            }
          },
          grid: {
            display: false
          },
          min: 0,
          max: labels.length - 1
        },
        y: {
          type: 'linear',
          display: true,
          title: {
            display: false
          },
          beginAtZero: isWearable,
          min: isWearable ? 0 : 0.5,
          max: isWearable ? 100 : 5.5,
          ticks: {
            font: {
              size: 10
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      elements: {
        point: {
          hoverRadius: 6
        }
      }
    }

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4" style={{ height: '300px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    )
  }

  // Find the latest pill_pack_start_date value
  const latestPillPackEntry = useMemo(() => {
    const entries = trackingData.entries
      .filter(e => e.pill_pack_start_date && !e.is_deleted)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    return entries.length > 0 ? entries[0] : null
  }, [trackingData.entries])

  // Find the latest entry for the selected tracking item
  const latestSelectedItemEntry = useMemo(() => {
    const entries = trackingData.entries
      .filter(e => e[selectedItem] !== undefined && e[selectedItem] !== null && !e.is_deleted)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    return entries.length > 0 ? entries[0] : null
  }, [trackingData.entries, selectedItem])

  // Helper to calculate time ago
  const getTimeAgo = (dateStr) => {
    if (!dateStr) return ''
    // Accept both MM/DD/YYYY and ISO
    let date
    if (dateStr.includes('-')) {
      date = new Date(dateStr)
    } else {
      const [mm, dd, yyyy] = dateStr.split('/')
      date = new Date(`${yyyy}-${mm}-${dd}`)
    }
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.floor(diffDays / 7)
    return `(${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} / ${diffDays} day${diffDays !== 1 ? 's' : ''} ago)`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen wildflower-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-8">
            <Link to="/" className="text-primary-600 hover:text-primary-700 mr-4">
              ← {i18n.t('nav.backToDashboard')}
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 wildflower-text-shadow">{i18n.t('insights.title')}</h1>
          </div>
          <div className="meadow-card p-8">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">{i18n.t('insights.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const trends = calculateTrends(selectedItem)
  const insights = getInsights(selectedItem, trends)
  const selectedItemData = TRACKING_ITEMS[selectedItem]

  return (
    <div className="min-h-screen wildflower-bg">
      <AppHeader
        onExportConfig={null}
        setShowImportModal={setShowImportModal}
        setShowResetConfirmModal={setShowResetConfirmModal}
        configImportError={configImportError}
        configImportSuccess={configImportSuccess}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <ReauthBanner />
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Link 
            to="/" 
            className="btn-secondary px-4 py-2 text-sm flex items-center"
          >
            <span className="mr-2">←</span>
            {i18n.t('nav.backToDashboard')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 wildflower-text-shadow ml-4">{i18n.t('insights.title')}</h1>
        </div>

        {/* Filters */}
        <div className="meadow-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{i18n.t('insights.filters.timeframe')}</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="input"
              >
                <option value="6weeks">{i18n.t('insights.filters.options.last6weeks')}</option>
                <option value="4weeks">{i18n.t('insights.filters.options.last4weeks')}</option>
                <option value="2weeks">{i18n.t('insights.filters.options.last2weeks')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{i18n.t('insights.filters.viewType')}</label>
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="input"
              >
                <option value="all">{i18n.t('insights.filters.view.all')}</option>
                <option value="morning">{i18n.t('common.view.morning')}</option>
                <option value="quick">{i18n.t('common.view.quick')}</option>
                <option value="evening">{i18n.t('common.view.evening')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{i18n.t('insights.filters.trackingItem')}</label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="input"
              >
                {availableItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="meadow-card p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {filteredData.length}
            </div>
            <div className="text-sm text-gray-600">{i18n.t('insights.cards.totalEntries')}</div>
          </div>
          <div className="meadow-card p-6 text-center">
            <div className="text-3xl font-bold text-secondary-600 mb-2">
              {trends?.totalEntries || 0}
            </div>
            <div className="text-sm text-gray-600">{i18n.t('insights.cards.itemEntries', { item: selectedItemData?.name })}</div>
          </div>
          <div className="meadow-card p-6 text-center">
                      <div className="text-3xl font-bold text-accent-600 mb-2">
            {trends?.averageValue ? `${trends.averageValue.toFixed(1)} out of ${getItemEffectiveScale(selectedItemData) || 5}` : 'N/A'}
          </div>
            <div className="text-sm text-gray-600">{i18n.t('insights.cards.averageItem', { item: selectedItemData?.name })}</div>
          </div>
        </div>

        {/* Latest Entry Information */}
        <div className="mb-4 space-y-2">
          {/* Latest Selected Item Entry */}
          {latestSelectedItemEntry && (
            <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
              <span className="font-semibold text-green-700">Latest {selectedItemData?.name} Entry:</span>{' '}
              <span className="text-green-900">{format(parseISO(latestSelectedItemEntry.timestamp), 'MMM d, yyyy')}</span>{' '}
              <span className="text-green-500">{getTimeAgo(latestSelectedItemEntry.timestamp)}</span>
            </div>
          )}

          {/* Pill Pack Start Date display */}
          {latestPillPackEntry && (
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
              <span className="font-semibold text-blue-700">Pill Pack Start Date:</span>{' '}
                <span className="text-blue-900">{(() => {
                try {
                  // Handle different date formats like the getTimeAgo function
                  let date
                  if (latestPillPackEntry.pill_pack_start_date.includes('-')) {
                    date = new Date(latestPillPackEntry.pill_pack_start_date)
                  } else {
                    const [mm, dd, yyyy] = latestPillPackEntry.pill_pack_start_date.split('/')
                    date = new Date(`${yyyy}-${mm}-${dd}`)
                  }
                  return format(date, 'MMM d, yyyy')
                } catch (error) {
                  // Fallback to original format if parsing fails
                  return latestPillPackEntry.pill_pack_start_date
                }
              })()}</span>{' '}
              <span className="text-blue-500">{getTimeAgo(latestPillPackEntry.pill_pack_start_date)}</span>
            </div>
          )}
        </div>

        {/* Trend Analysis */}
        {trends && (
          <div className="meadow-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{i18n.t('insights.trend.title', { item: selectedItemData?.name })}</h3>
            
            <div className="space-y-6">
              {/* Trend Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">{i18n.t('insights.trend.weekly')}</h4>
                {renderTrendChart(trends)}
              </div>

              {/* Trend Summary */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3"><br /><br />{i18n.t('insights.trend.summary')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">{i18n.t('insights.trend.direction')}:</span>
                    <span className="text-sm font-medium text-gray-600">{trends.direction.charAt(0).toUpperCase() + trends.direction.slice(1)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">{i18n.t('insights.trend.change')}:</span>
                    <span className="text-sm font-medium text-gray-600">{trends.change > 0 ? '+' : ''}{trends.change.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insights and Recommendations */}
        {insights.length > 0 && (
          <div className="meadow-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{i18n.t('insights.section.insights')}</h3>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className={clsx(
                  'p-4 rounded-lg border-l-4',
                  insight.type === 'positive' && 'bg-success-50 border-success-500',
                  insight.type === 'warning' && 'bg-warning-50 border-warning-500',
                  insight.type === 'info' && 'bg-info-50 border-info-500',
                  insight.type === 'suggestion' && 'bg-accent-50 border-accent-500'
                )}>
                  <p className="text-sm text-gray-800">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evening Reports */}
        {(() => {
          const textInsights = analyzeTextPatterns(selectedItem)
          return textInsights && textInsights.length > 0 ? (
            <div className="meadow-card p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{i18n.t('insights.section.evening')}</h3>
              <div className="space-y-3">
                {textInsights.map((insight, index) => (
                  <div key={index} className={clsx(
                    'p-4 rounded-lg border-l-4',
                    insight.type === 'positive' && 'bg-success-50 border-success-500',
                    insight.type === 'warning' && 'bg-warning-50 border-warning-500',
                    insight.type === 'info' && 'bg-info-50 border-info-500',
                    insight.type === 'suggestion' && 'bg-accent-50 border-accent-500'
                  )}>
                    <p className="text-sm text-gray-800">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        })()}

        {/* No Data State */}
        {filteredData.length === 0 && (
          <div className="meadow-card p-8">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {i18n.t('insights.empty.title')}
              </h2>
              <p className="text-gray-600 mb-4">
                {i18n.t('insights.empty.subtitle', { item: selectedItemData?.name?.toLowerCase() })}
              </p>
              <Link
                to="/"
                className="btn-primary px-6 py-3"
              >
                {i18n.t('insights.empty.cta')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Insights 