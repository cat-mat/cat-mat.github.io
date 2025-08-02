/**
 * Security Utilities
 * Centralized security functions and best practices
 */

// Content Security Policy nonce generator
export const generateNonce = () => {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Sanitize user input to prevent XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Validate and sanitize JSON data
export const safeJSONParse = (jsonString, fallback = null) => {
  try {
    const parsed = JSON.parse(jsonString)
    
    // Additional validation for expected data structures
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
    return fallback
  } catch (error) {
    console.error('JSON parsing failed:', error)
    return fallback
  }
}

// Rate limiting utility
export class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) {
    this.maxRequests = maxRequests
    this.timeWindow = timeWindow
    this.requests = new Map()
  }

  isAllowed(key) {
    const now = Date.now()
    const userRequests = this.requests.get(key) || []
    
    // Remove old requests outside the time window
    const recentRequests = userRequests.filter(time => now - time < this.timeWindow)
    
    if (recentRequests.length >= this.maxRequests) {
      return false
    }
    
    recentRequests.push(now)
    this.requests.set(key, recentRequests)
    return true
  }

  reset(key) {
    this.requests.delete(key)
  }
}

// CSRF protection
export const generateCSRFToken = () => {
  return generateNonce()
}

export const validateCSRFToken = (token, expectedToken) => {
  return token === expectedToken
}

// Secure random ID generation
export const generateSecureId = () => {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Input validation for tracking data
export const validateTrackingInput = (input) => {
  const maxLength = 2000 // Maximum length for text inputs
  const allowedTypes = ['morning', 'evening', 'quick']
  const allowedScales = [1, 2, 3, 4, 5]
  
  if (input.type && !allowedTypes.includes(input.type)) {
    return { isValid: false, error: 'Invalid tracking type' }
  }
  
  // Validate scale values
  for (const [key, value] of Object.entries(input)) {
    if (key.includes('level') || key.includes('score') || key.includes('feeling')) {
      if (value !== undefined && value !== null) {
        if (!Number.isInteger(value) || value < 1 || value > 5) {
          return { isValid: false, error: `Invalid scale value for ${key}` }
        }
      }
    }
  }
  
  // Validate text inputs
  if (input.notes) {
    for (const [key, value] of Object.entries(input.notes)) {
      if (typeof value === 'string' && value.length > maxLength) {
        return { isValid: false, error: `${key} exceeds maximum length` }
      }
    }
  }
  
  return { isValid: true }
}

// Secure storage key validation
export const validateStorageKey = (key) => {
  const allowedKeys = [
    'config',
    'auth_token',
    'encryption_key',
    'offline_entries',
    'sync_queue',
    'notifications'
  ]
  
  // Only allow known keys or keys with specific patterns
  if (allowedKeys.includes(key) || key.startsWith('mock_tracking_') || key.startsWith('tracking_')) {
    return true
  }
  
  return false
}

// Log security events
export const logSecurityEvent = (event, details = {}) => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  }
  
  // In production, this could be sent to a secure logging service
  console.warn('Security Event:', securityLog)
  
  // Store in localStorage for debugging (limited to last 10 events)
  const existingLogs = JSON.parse(localStorage.getItem('security_logs') || '[]')
  existingLogs.push(securityLog)
  
  if (existingLogs.length > 10) {
    existingLogs.shift()
  }
  
  localStorage.setItem('security_logs', JSON.stringify(existingLogs))
}

// Check for suspicious activity
export const detectSuspiciousActivity = (action, context = {}) => {
  const suspiciousPatterns = [
    { pattern: /<script/i, description: 'Potential XSS attempt' },
    { pattern: /javascript:/i, description: 'Potential code injection' },
    { pattern: /on\w+\s*=/i, description: 'Potential event handler injection' }
  ]
  
  for (const { pattern, description } of suspiciousPatterns) {
    if (pattern.test(JSON.stringify(context))) {
      logSecurityEvent('suspicious_activity', {
        action,
        description,
        context: JSON.stringify(context).substring(0, 100)
      })
      return true
    }
  }
  
  return false
}

// Secure headers for API requests
export const getSecureHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }
}

// Validate environment variables
export const validateEnvironment = () => {
  const requiredVars = ['VITE_GOOGLE_CLIENT_ID']
  const missing = requiredVars.filter(varName => !import.meta.env[varName])
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing)
    return false
  }
  
  return true
}

// Initialize security features
export const initializeSecurity = () => {
  // Validate environment
  if (!validateEnvironment()) {
    console.error('Security initialization failed: Invalid environment')
    return false
  }
  
  // Set up global error handler for security events
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message) {
      logSecurityEvent('javascript_error', {
        message: event.error.message,
        filename: event.filename,
        lineno: event.lineno
      })
    }
  })
  
  // Monitor for suspicious console usage
  const originalConsole = { ...console }
  console.log = (...args) => {
    if (args.some(arg => typeof arg === 'string' && arg.includes('password'))) {
      logSecurityEvent('potential_password_logging', { args: args.map(String) })
    }
    originalConsole.log(...args)
  }
  
  return true
} 