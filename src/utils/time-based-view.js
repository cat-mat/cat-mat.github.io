import { format } from 'date-fns'

/**
 * Determines the appropriate view based on current time and user configuration
 * @param {Object} config - User configuration object
 * @param {string} config.morning_end - Morning end time in HH:MM format (default: "09:00")
 * @param {string} config.evening_start - Evening start time in HH:MM format (default: "20:00")
 * @returns {string} - The suggested view: 'morning', 'evening', or 'quick'
 */
export const getTimeBasedView = (config) => {
  const now = new Date()
  const currentTime = format(now, 'HH:mm')
  
  // Get user's configured times or use defaults
  const morningEnd = config?.display_options?.view_times?.morning_end || '09:00'
  const eveningStart = config?.display_options?.view_times?.evening_start || '20:00'
  
  // Time-based view logic as specified in .cursorrules
  if (currentTime < morningEnd) {
    return 'morning'
  } else if (currentTime >= eveningStart) {
    return 'evening'
  } else {
    return 'quick'
  }
}

/**
 * Checks if a specific view is currently available based on time
 * @param {string} viewType - The view to check: 'morning', 'evening', or 'quick'
 * @param {Object} config - User configuration object
 * @returns {boolean} - Whether the view is currently available
 */
export const isViewAvailable = (viewType, config) => {
  const suggestedView = getTimeBasedView(config)
  return suggestedView === viewType
}

/**
 * Gets the next view transition time
 * @param {Object} config - User configuration object
 * @returns {Object} - Object with next transition time and view
 */
export const getNextViewTransition = (config) => {
  const now = new Date()
  const currentTime = format(now, 'HH:mm')
  
  const morningEnd = config?.display_options?.view_times?.morning_end || '09:00'
  const eveningStart = config?.display_options?.view_times?.evening_start || '20:00'
  
  if (currentTime < morningEnd) {
    return {
      time: morningEnd,
      nextView: 'quick',
      message: `Quick Track becomes available at ${morningEnd}`
    }
  } else if (currentTime < eveningStart) {
    return {
      time: eveningStart,
      nextView: 'evening',
      message: `Evening Report becomes available at ${eveningStart}`
    }
  } else {
    // After evening start, next transition is tomorrow morning
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0) // Start of tomorrow
    
    return {
      time: '00:00',
      nextView: 'morning',
      message: 'Morning Report becomes available tomorrow'
    }
  }
}

/**
 * Gets a user-friendly message about the current view availability
 * @param {Object} config - User configuration object
 * @returns {string} - User-friendly message
 */
export const getViewAvailabilityMessage = (config) => {
  const currentView = getTimeBasedView(config)
  const transition = getNextViewTransition(config)
  
  switch (currentView) {
    case 'morning':
      return `Morning Report is active until ${transition.time}. ${transition.message}`
    case 'evening':
      return 'Evening Report is active. Morning Report will be available tomorrow.'
    case 'quick':
      return `Quick Track is active until ${transition.time}. ${transition.message}`
    default:
      return 'View availability information unavailable'
  }
}

/**
 * Validates time format (HH:MM)
 * @param {string} time - Time string to validate
 * @returns {boolean} - Whether the time format is valid
 */
export const isValidTimeFormat = (time) => {
  const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

/**
 * Converts time string to minutes for comparison
 * @param {string} time - Time in HH:MM format
 * @returns {number} - Minutes since midnight
 */
export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Compares two times
 * @param {string} time1 - First time in HH:MM format
 * @param {string} time2 - Second time in HH:MM format
 * @returns {number} - -1 if time1 < time2, 0 if equal, 1 if time1 > time2
 */
export const compareTimes = (time1, time2) => {
  const minutes1 = timeToMinutes(time1)
  const minutes2 = timeToMinutes(time2)
  
  if (minutes1 < minutes2) return -1
  if (minutes1 > minutes2) return 1
  return 0
}
