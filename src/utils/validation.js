import Joi from 'joi'
import { TRACKING_ITEMS } from '../constants/trackingItems.js'
import { normalizeScaleValue, denormalizeScaleValue } from './scaleConversion.js'

// Base validation schemas
const baseEntrySchema = Joi.object({
  id: Joi.string().required(),
  timestamp: Joi.date().iso().required(),
  type: Joi.string().valid('morning', 'evening', 'quick').required(),
  sync_status: Joi.string().valid('synced', 'pending', 'failed').required(),
  timezone: Joi.string().optional(),
  is_deleted: Joi.boolean().optional(),
  created_at: Joi.date().iso().optional(),
  updated_at: Joi.date().iso().optional()
})

// Scale validation helpers
const scaleValidation = {
  3: Joi.number().integer().min(1).max(3),
  4: Joi.number().integer().min(1).max(4),
  5: Joi.number().integer().min(1).max(5)
}

// Custom validation for scale values that converts 3-point to 5-point internally
const createScaleValidator = (scale) => {
  return Joi.number().integer().min(1).max(scale).custom((value, helpers) => {
    // For 3-point scales, convert to 5-point for storage
    if (scale === 3) {
      return normalizeScaleValue(value, 3)
    }
    return value
  })
}

// Multi-select validation
const jointPainSchema = Joi.array().items(
  Joi.string().valid(
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_hip', 'right_hip', 'left_knee', 'right_knee', 'other'
  )
).unique()

// Wearable data validation
const wearableSchema = Joi.number().integer().min(0).max(100)

// Notes validation
const notesSchema = Joi.object({
  observations: Joi.string().max(2000).optional(),
  reflections: Joi.string().max(2000).optional(),
  thankful_for: Joi.string().max(2000).optional()
})

// Entry validation schema
export const entryValidationSchema = baseEntrySchema.keys({
  // 5-point scale items
  energy_level: scaleValidation[5].optional(),
  anxiety: scaleValidation[5].optional(),
  depression: scaleValidation[5].optional(),
  irritability: scaleValidation[5].optional(),
  stress_level: scaleValidation[5].optional(),
  overall_sentiment: scaleValidation[5].optional(),
  
  // 3-point scale items (converted to 5-point internally)
  allergic_reactions: createScaleValidator(3).optional(),
  bleeding_spotting: createScaleValidator(3).optional(),
  brain_fog: createScaleValidator(3).optional(),
  forehead_shine: createScaleValidator(3).optional(),
  hydration: createScaleValidator(3).optional(),
  mood: createScaleValidator(3).optional(),
  nausea: createScaleValidator(3).optional(),
  temperature_sensitivity: createScaleValidator(3).optional(),
  weird_dreams: createScaleValidator(3).optional(),
  
  // 4-point scale items
  headache: scaleValidation[4].optional(),
  hot_flashes: scaleValidation[4].optional(),
  
  // Multi-select items
  joint_pain: jointPainSchema.optional(),
  
  // Wearable data
  wearables_sleep_score: wearableSchema.optional(),
  wearables_body_battery: wearableSchema.optional(),
  
  // Notes
  notes: notesSchema.optional()
})

// Configuration validation schema
export const configValidationSchema = Joi.object({
  version: Joi.string().required(),
  user_id: Joi.string().required(),
  onboarding: Joi.object({
    completed: Joi.boolean().required(),
    completed_at: Joi.date().iso().allow(null).optional(),
    skipped_steps: Joi.array().items(Joi.string()).optional(),
    tour_completed: Joi.boolean().optional()
  }).required(),
  display_options: Joi.object({
    item_display_type: Joi.string().valid('text', 'face', 'heart', 'dot').required(),
    view_times: Joi.object({
      morning_end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      evening_start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
    }).required()
  }).required(),
  insights_settings: Joi.object({
    enabled: Joi.boolean().required(),
    frequency: Joi.string().valid('weekly', 'monthly').required(),
    advanced_analysis: Joi.boolean().required(),
    last_generated: Joi.date().iso().allow(null).optional()
  }).required(),
  privacy_settings: Joi.object({
    error_reporting: Joi.boolean().required(),
    analytics: Joi.boolean().required(),
    data_retention_days: Joi.number().integer().min(30).max(3650).required()
  }).required(),
  session_config: Joi.object({
    timeout_minutes: Joi.number().integer().min(15).max(480).required(),
    auto_save_interval: Joi.number().integer().min(10).max(300).required()
  }).required(),
  section_configuration: Joi.object({
    sections: Joi.array().items(Joi.string().valid('body', 'mind')).required(),
    section_sort_order: Joi.array().items(Joi.string().valid('body', 'mind')).required(),
    section_visibility: Joi.object({
      body: Joi.boolean().required(),
      mind: Joi.boolean().required()
    }).required()
  }).required(),
  view_configurations: Joi.object({
    morning_report: Joi.object({
      sections: Joi.object({
        body: Joi.object({
          items: Joi.array().items(Joi.string()).required(),
          sort_order: Joi.array().items(Joi.string()).required(),
          visible: Joi.boolean().required(),
          collapsed: Joi.boolean().required()
        }).required(),
        mind: Joi.object({
          items: Joi.array().items(Joi.string()).required(),
          sort_order: Joi.array().items(Joi.string()).required(),
          visible: Joi.boolean().required(),
          collapsed: Joi.boolean().required()
        }).required()
      }).required(),
      wearables: Joi.array().items(Joi.string()).required()
    }).required(),
    evening_report: Joi.object({
      sections: Joi.object({
        body: Joi.object({
          items: Joi.array().items(Joi.string()).required(),
          sort_order: Joi.array().items(Joi.string()).required(),
          visible: Joi.boolean().required(),
          collapsed: Joi.boolean().required()
        }).required(),
        mind: Joi.object({
          items: Joi.array().items(Joi.string()).required(),
          sort_order: Joi.array().items(Joi.string()).required(),
          visible: Joi.boolean().required(),
          collapsed: Joi.boolean().required()
        }).required()
      }).required()
    }).required(),
    quick_track: Joi.object({
      sections: Joi.object({
        body: Joi.object({
          items: Joi.array().items(Joi.string()).required(),
          sort_order: Joi.array().items(Joi.string()).required(),
          visible: Joi.boolean().required(),
          collapsed: Joi.boolean().required()
        }).required(),
        mind: Joi.object({
          items: Joi.array().items(Joi.string()).required(),
          sort_order: Joi.array().items(Joi.string()).required(),
          visible: Joi.boolean().required(),
          collapsed: Joi.boolean().required()
        }).required()
      }).required()
    }).required()
  }).required(),
  created_at: Joi.date().iso().required(),
  updated_at: Joi.date().iso().required()
})

// Monthly tracking file validation schema
export const monthlyTrackingSchema = Joi.object({
  version: Joi.string().required(),
  month: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
  file_part: Joi.number().integer().min(1).required(),
  estimated_size_kb: Joi.number().positive().required(),
  entries: Joi.array().items(entryValidationSchema).required(),
  created_at: Joi.date().iso().required(),
  updated_at: Joi.date().iso().required()
})

// Time validation helpers
export const timeValidation = {
  validateTimeZone: (timestamp) => {
    try {
      const entry = new Date(timestamp)
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return entry.getTime() > oneWeekAgo.getTime()
    } catch (error) {
      return false
    }
  },
  
  validateReasonableTime: (timestamp) => {
    try {
      const now = Date.now()
      const entryTime = new Date(timestamp).getTime()
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
      return entryTime <= now && entryTime > thirtyDaysAgo
    } catch (error) {
      return false
    }
  },
  
  validateEntryTime: (timestamp) => {
    try {
      const now = Date.now()
      const entryTime = new Date(timestamp).getTime()
      const maxFutureTime = now + 60 * 60 * 1000 // 1 hour in future
      const minPastTime = now - 30 * 24 * 60 * 60 * 1000 // 30 days ago
      
      return entryTime <= maxFutureTime && entryTime >= minPastTime
    } catch (error) {
      return false
    }
  }
}

// Concurrency handling helpers
export const concurrencyHandling = {
  generateEntryId: () => {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  handleConcurrentModification: (localEntry, remoteEntry) => {
    const localTime = new Date(localEntry.updated_at || localEntry.created_at).getTime()
    const remoteTime = new Date(remoteEntry.updated_at || remoteEntry.created_at).getTime()
    return localTime > remoteTime ? localEntry : remoteEntry
  },
  
  deduplicateEntries: (entries) => {
    const seen = new Set()
    return entries.filter(entry => {
      const key = `${entry.timestamp}_${entry.type}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
}

// Validation functions
export const validateEntry = (entry) => {
  const { error, value } = entryValidationSchema.validate(entry, { 
    abortEarly: false,
    allowUnknown: true 
  })
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    }
  }
  
  return { isValid: true, data: value }
}

export const validateConfig = (config) => {
  const { error, value } = configValidationSchema.validate(config, { 
    abortEarly: false,
    allowUnknown: true 
  })
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    }
  }
  
  return { isValid: true, data: value }
}

export const validateMonthlyTracking = (data) => {
  const { error, value } = monthlyTrackingSchema.validate(data, { 
    abortEarly: false,
    allowUnknown: true 
  })
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    }
  }
  
  return { isValid: true, data: value }
}

// Data sanitization
export const sanitizeEntry = (entry) => {
  const sanitized = { ...entry }
  
  // Remove undefined values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key]
    }
  })
  
  // Ensure required fields
  if (!sanitized.id) {
    sanitized.id = concurrencyHandling.generateEntryId()
  }
  
  if (!sanitized.timestamp) {
    sanitized.timestamp = new Date().toISOString()
  }
  
  if (!sanitized.sync_status) {
    sanitized.sync_status = 'pending'
  }
  
  if (!sanitized.timezone) {
    sanitized.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  }
  
  if (!sanitized.created_at) {
    sanitized.created_at = new Date().toISOString()
  }
  
  sanitized.updated_at = new Date().toISOString()
  
  return sanitized
}

// Schema migration helpers
export const migrations = {
  '1.0.0': (data) => data, // baseline
  '1.1.0': (data) => {
    // Add insights settings if missing
    if (!data.insights_settings) {
      data.insights_settings = {
        enabled: true,
        frequency: 'weekly',
        advanced_analysis: false,
        last_generated: null
      }
    }
    return data
  },
  '1.2.0': (data) => {
    // Restructure view configuration if needed
    if (data.view_configurations) {
      Object.keys(data.view_configurations).forEach(viewType => {
        if (data.view_configurations[viewType].sections) {
          Object.keys(data.view_configurations[viewType].sections).forEach(category => {
            const section = data.view_configurations[viewType].sections[category]
            if (!section.collapsed) {
              section.collapsed = false
            }
          })
        }
      })
    }
    return data
  },
  '1.3.0': (data) => {
    // Migrate 3-point scale values to 5-point scale for consistency
    if (data.entries && Array.isArray(data.entries)) {
      const threePointItems = [
        'allergic_reactions', 'bleeding_spotting', 'brain_fog', 'forehead_shine',
        'hydration', 'mood', 'nausea', 'temperature_sensitivity', 'weird_dreams'
      ]
      
      data.entries.forEach(entry => {
        threePointItems.forEach(itemId => {
          if (entry[itemId] !== undefined && entry[itemId] !== null) {
            // Only convert if the value is still in 3-point format (1, 2, 3)
            if (entry[itemId] >= 1 && entry[itemId] <= 3) {
              entry[itemId] = normalizeScaleValue(entry[itemId], 3)
            }
          }
        })
      })
    }
    return data
  }
}

export const migrateData = (data, targetVersion = '1.3.0') => {
  let currentData = { ...data }
  const currentVersion = currentData.version || '1.0.0'
  
  const versionOrder = ['1.0.0', '1.1.0', '1.2.0', '1.3.0']
  const currentIndex = versionOrder.indexOf(currentVersion)
  const targetIndex = versionOrder.indexOf(targetVersion)
  
  if (currentIndex === -1 || targetIndex === -1) {
    throw new Error('Invalid version')
  }
  
  for (let i = currentIndex; i < targetIndex; i++) {
    const nextVersion = versionOrder[i + 1]
    if (migrations[nextVersion]) {
      currentData = migrations[nextVersion](currentData)
      currentData.version = nextVersion
    }
  }
  
  return currentData
} 