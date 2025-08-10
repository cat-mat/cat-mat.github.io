import { 
  getTimeBasedView, 
  isViewAvailable, 
  getNextViewTransition, 
  getViewAvailabilityMessage,
  isValidTimeFormat,
  timeToMinutes,
  compareTimes
} from '../time-based-view.js'

// Mock date-fns format function
jest.mock('date-fns', () => ({
  format: jest.fn()
}))

import { format } from 'date-fns'

describe('time-based-view utilities', () => {
  const mockConfig = {
    display_options: {
      view_times: {
        morning_end: '09:00',
        evening_start: '20:00'
      }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTimeBasedView', () => {
    it('should return morning for times before morning_end', () => {
      format.mockReturnValue('08:30')
      expect(getTimeBasedView(mockConfig)).toBe('morning')
    })

    it('should return evening for times after evening_start', () => {
      format.mockReturnValue('21:00')
      expect(getTimeBasedView(mockConfig)).toBe('evening')
    })

    it('should return quick for times between morning_end and evening_start', () => {
      format.mockReturnValue('14:30')
      expect(getTimeBasedView(mockConfig)).toBe('quick')
    })

    it('should use default times when config is missing', () => {
      format.mockReturnValue('08:30')
      expect(getTimeBasedView({})).toBe('morning')
    })

    it('should handle edge case at morning_end', () => {
      format.mockReturnValue('09:00')
      expect(getTimeBasedView(mockConfig)).toBe('quick')
    })

    it('should handle edge case at evening_start', () => {
      format.mockReturnValue('20:00')
      expect(getTimeBasedView(mockConfig)).toBe('evening')
    })
  })

  describe('isViewAvailable', () => {
    it('should return true for currently available view', () => {
      format.mockReturnValue('08:30')
      expect(isViewAvailable('morning', mockConfig)).toBe(true)
    })

    it('should return false for currently unavailable view', () => {
      format.mockReturnValue('08:30')
      expect(isViewAvailable('evening', mockConfig)).toBe(false)
    })
  })

  describe('getNextViewTransition', () => {
    it('should return quick transition when in morning', () => {
      format.mockReturnValue('08:30')
      const transition = getNextViewTransition(mockConfig)
      expect(transition.nextView).toBe('quick')
      expect(transition.time).toBe('09:00')
    })

    it('should return evening transition when in quick', () => {
      format.mockReturnValue('14:30')
      const transition = getNextViewTransition(mockConfig)
      expect(transition.nextView).toBe('evening')
      expect(transition.time).toBe('20:00')
    })

    it('should return morning transition when in evening', () => {
      format.mockReturnValue('21:00')
      const transition = getNextViewTransition(mockConfig)
      expect(transition.nextView).toBe('morning')
      expect(transition.time).toBe('00:00')
    })
  })

  describe('getViewAvailabilityMessage', () => {
    it('should return appropriate message for morning view', () => {
      format.mockReturnValue('08:30')
      const message = getViewAvailabilityMessage(mockConfig)
      expect(message).toContain('Morning Report is active until 09:00')
    })

    it('should return appropriate message for quick view', () => {
      format.mockReturnValue('14:30')
      const message = getViewAvailabilityMessage(mockConfig)
      expect(message).toContain('Quick Track is active until 20:00')
    })

    it('should return appropriate message for evening view', () => {
      format.mockReturnValue('21:00')
      const message = getViewAvailabilityMessage(mockConfig)
      expect(message).toContain('Evening Report is active')
    })
  })

  describe('isValidTimeFormat', () => {
    it('should validate correct time formats', () => {
      expect(isValidTimeFormat('09:00')).toBe(true)
      expect(isValidTimeFormat('23:59')).toBe(true)
      expect(isValidTimeFormat('00:00')).toBe(true)
    })

    it('should reject invalid time formats', () => {
      expect(isValidTimeFormat('9:00')).toBe(false)
      expect(isValidTimeFormat('09:0')).toBe(false)
      expect(isValidTimeFormat('24:00')).toBe(false)
      expect(isValidTimeFormat('09:60')).toBe(false)
      expect(isValidTimeFormat('invalid')).toBe(false)
    })
  })

  describe('timeToMinutes', () => {
    it('should convert time to minutes correctly', () => {
      expect(timeToMinutes('00:00')).toBe(0)
      expect(timeToMinutes('01:30')).toBe(90)
      expect(timeToMinutes('12:00')).toBe(720)
      expect(timeToMinutes('23:59')).toBe(1439)
    })
  })

  describe('compareTimes', () => {
    it('should compare times correctly', () => {
      expect(compareTimes('09:00', '10:00')).toBe(-1)
      expect(compareTimes('10:00', '09:00')).toBe(1)
      expect(compareTimes('09:00', '09:00')).toBe(0)
    })
  })
})
