import { compressData, decompressData, shouldCompress, getCompressionStats, validateCompressedData } from '../compression.js'

describe('compression', () => {
  const smallData = { test: 'small data', value: 123 }
  const largeData = {
    entries: Array.from({ length: 1000 }, (_, i) => ({
      id: `entry_${i}`,
      timestamp: new Date().toISOString(),
      type: 'morning',
      energy_level: Math.floor(Math.random() * 5) + 1,
      anxiety: Math.floor(Math.random() * 5) + 1,
      notes: {
        observations: 'This is a very long observation that will make the data larger. '.repeat(50),
        reflections: 'This is a very long reflection that will make the data larger. '.repeat(50),
        thankful_for: 'This is a very long thankful note that will make the data larger. '.repeat(50)
      }
    }))
  }

  describe('compressData', () => {
    it('should not compress small data', () => {
      const result = compressData(smallData)
      expect(result.compressed).toBe(false)
      expect(result.data).toBe(JSON.stringify(smallData))
    })

    it('should compress large data', () => {
      const result = compressData(largeData)
      expect(result.compressed).toBe(true)
      expect(result.originalSize).toBeGreaterThan(50 * 1024) // > 50KB
      expect(result.compressedSize).toBeLessThan(result.originalSize)
      expect(result.compressionRatio).toBeDefined()
    })

    it('should include compression metadata', () => {
      const result = compressData(largeData)
      expect(result).toHaveProperty('compressed')
      expect(result).toHaveProperty('originalSize')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('compressionRatio')
    })
  })

  describe('decompressData', () => {
    it('should handle uncompressed data', () => {
      const uncompressedData = {
        compressed: false,
        data: JSON.stringify(smallData)
      }
      const result = decompressData(uncompressedData)
      expect(result).toEqual(smallData)
    })

    it('should decompress compressed data', () => {
      const compressedData = compressData(largeData)
      const result = decompressData(compressedData)
      expect(result).toEqual(largeData)
    })

    it('should handle legacy uncompressed data', () => {
      const legacyData = JSON.stringify(smallData)
      const result = decompressData({ data: legacyData })
      expect(result).toEqual(smallData)
    })
  })

  describe('shouldCompress', () => {
    it('should return false for small data', () => {
      expect(shouldCompress(smallData)).toBe(false)
    })

    it('should return true for large data', () => {
      expect(shouldCompress(largeData)).toBe(true)
    })
  })

  describe('getCompressionStats', () => {
    it('should return stats for small data', () => {
      const stats = getCompressionStats(smallData)
      expect(stats.shouldCompress).toBe(false)
      expect(stats.originalSize).toBeGreaterThan(0)
      expect(stats.estimatedCompressedSize).toBeNull()
      expect(stats.estimatedSavings).toBeNull()
    })

    it('should return stats for large data', () => {
      const stats = getCompressionStats(largeData)
      expect(stats.shouldCompress).toBe(true)
      expect(stats.originalSize).toBeGreaterThan(50 * 1024)
      expect(stats.estimatedCompressedSize).toBeGreaterThan(0)
      expect(stats.estimatedSavings).toBeDefined()
    })
  })

  describe('validateCompressedData', () => {
    it('should validate uncompressed data', () => {
      const uncompressedData = {
        compressed: false,
        data: JSON.stringify(smallData)
      }
      const result = validateCompressedData(uncompressedData)
      expect(result.isValid).toBe(true)
      expect(result.data).toEqual(smallData)
    })

    it('should validate compressed data', () => {
      const compressedData = compressData(largeData)
      const result = validateCompressedData(compressedData)
      expect(result.isValid).toBe(true)
      expect(result.data).toEqual(largeData)
    })

    it('should reject invalid data structure', () => {
      const result = validateCompressedData(null)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid data structure')
    })

    it('should reject compressed data with missing data field', () => {
      const invalidData = {
        compressed: true,
        originalSize: 1000
        // missing data field
      }
      const result = validateCompressedData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Compressed data missing or invalid')
    })

    it('should reject invalid JSON', () => {
      const invalidData = {
        compressed: false,
        data: 'invalid json'
      }
      const result = validateCompressedData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('JSON parsing failed')
    })
  })
}) 