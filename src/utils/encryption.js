/**
 * Client-Side Encryption Utilities
 * Uses Web Crypto API to encrypt sensitive data before localStorage storage
 */

class EncryptionService {
  constructor() {
    this.isSupported = typeof window !== 'undefined' && window.crypto && window.crypto.subtle
    this.key = null
    this.algorithm = { name: 'AES-GCM', length: 256 }
  }

  /**
   * Generate encryption key
   */
  async generateKey() {
    if (!this.isSupported) {
      console.warn('Web Crypto API not supported')
      return false
    }

    try {
      this.key = await window.crypto.subtle.generateKey(
        this.algorithm,
        true,
        ['encrypt', 'decrypt']
      )
      return true
    } catch (error) {
      console.error('Failed to generate encryption key:', error)
      return false
    }
  }

  /**
   * Import key from stored key material
   */
  async importKey(keyMaterial) {
    if (!this.isSupported) {
      console.warn('Web Crypto API not supported')
      return false
    }

    try {
      this.key = await window.crypto.subtle.importKey(
        'raw',
        keyMaterial,
        this.algorithm,
        true,
        ['encrypt', 'decrypt']
      )
      return true
    } catch (error) {
      console.error('Failed to import encryption key:', error)
      return false
    }
  }

  /**
   * Export key material for storage
   */
  async exportKey() {
    if (!this.key) {
      throw new Error('No key available for export')
    }

    try {
      const keyMaterial = await window.crypto.subtle.exportKey('raw', this.key)
      return Array.from(new Uint8Array(keyMaterial))
    } catch (error) {
      console.error('Failed to export encryption key:', error)
      throw error
    }
  }

  /**
   * Encrypt data
   */
  async encrypt(data) {
    if (!this.isSupported || !this.key) {
      console.warn('Encryption not available, storing unencrypted')
      return { encrypted: false, data: JSON.stringify(data) }
    }

    try {
      const jsonString = JSON.stringify(data)
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(jsonString)

      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12))

      // Encrypt the data
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.key,
        dataBuffer
      )

      // Combine IV and encrypted data
      const encryptedArray = new Uint8Array(encryptedBuffer)
      const combined = new Uint8Array(iv.length + encryptedArray.length)
      combined.set(iv)
      combined.set(encryptedArray, iv.length)

      return {
        encrypted: true,
        data: btoa(String.fromCharCode(...combined)),
        algorithm: this.algorithm.name
      }
    } catch (error) {
      console.error('Encryption failed:', error)
      return { encrypted: false, data: JSON.stringify(data) }
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData) {
    if (!encryptedData.encrypted) {
      return JSON.parse(encryptedData.data)
    }

    if (!this.isSupported || !this.key) {
      console.warn('Decryption not available')
      return null
    }

    try {
      // Decode from base64
      const combined = new Uint8Array(
        atob(encryptedData.data).split('').map(char => char.charCodeAt(0))
      )

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12)
      const encryptedArray = combined.slice(12)

      // Decrypt the data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.key,
        encryptedArray
      )

      const decoder = new TextDecoder()
      const jsonString = decoder.decode(decryptedBuffer)
      return JSON.parse(jsonString)
    } catch (error) {
      console.error('Decryption failed:', error)
      return null
    }
  }

  /**
   * Initialize encryption service
   */
  async initialize() {
    if (!this.isSupported) {
      console.warn('Web Crypto API not supported, encryption disabled')
      return false
    }

    // Try to load existing key from localStorage
    const storedKey = localStorage.getItem('encryption_key')
    
    if (storedKey) {
      try {
        const keyMaterial = new Uint8Array(JSON.parse(storedKey))
        const success = await this.importKey(keyMaterial)
        if (success) {
          console.log('Encryption key loaded from storage')
          return true
        }
      } catch (error) {
        console.warn('Failed to load stored encryption key:', error)
      }
    }

    // Generate new key
    const success = await this.generateKey()
    if (success) {
      try {
        const keyMaterial = await this.exportKey()
        localStorage.setItem('encryption_key', JSON.stringify(Array.from(keyMaterial)))
        console.log('New encryption key generated and stored')
        return true
      } catch (error) {
        console.error('Failed to store encryption key:', error)
        return false
      }
    }

    return false
  }

  /**
   * Encrypt sensitive data for localStorage
   */
  async encryptForStorage(key, data) {
    const encrypted = await this.encrypt(data)
    return {
      key,
      ...encrypted,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Decrypt data from localStorage
   */
  async decryptFromStorage(encryptedData) {
    return await this.decrypt(encryptedData)
  }

  /**
   * Check if encryption is available
   */
  isAvailable() {
    return this.isSupported && this.key !== null
  }

  /**
   * Get encryption status
   */
  getStatus() {
    return {
      supported: this.isSupported,
      available: this.isAvailable(),
      algorithm: this.algorithm.name
    }
  }
}

// Create singleton instance
export const encryptionService = new EncryptionService()

/**
 * Secure localStorage wrapper
 */
export class SecureStorage {
  constructor() {
    this.encryptionService = encryptionService
  }

  /**
   * Set item with encryption
   */
  async setItem(key, value) {
    if (this.encryptionService.isAvailable()) {
      const encrypted = await this.encryptionService.encryptForStorage(key, value)
      localStorage.setItem(key, JSON.stringify(encrypted))
    } else {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }

  /**
   * Get item with decryption
   */
  async getItem(key) {
    const stored = localStorage.getItem(key)
    if (!stored) return null

    try {
      const parsed = JSON.parse(stored)
      
      if (parsed.encrypted && this.encryptionService.isAvailable()) {
        return await this.encryptionService.decryptFromStorage(parsed)
      } else {
        return parsed
      }
    } catch (error) {
      console.error('Failed to retrieve item:', error)
      return null
    }
  }

  /**
   * Remove item
   */
  removeItem(key) {
    localStorage.removeItem(key)
  }

  /**
   * Clear all items
   */
  clear() {
    localStorage.clear()
  }
}

// Create secure storage instance
export const secureStorage = new SecureStorage() 