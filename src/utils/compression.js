import LZString from 'lz-string'

/**
 * Compression utilities for handling large data files
 * Uses LZString for client-side compression
 */

// Compression threshold in bytes (50KB as per spec)
const COMPRESSION_THRESHOLD = 50 * 1024

/**
 * Compress data if it exceeds the threshold
 * @param {Object} data - Data to compress
 * @returns {Object} - Compressed data with metadata
 */
export const compressData = (data) => {
  const jsonString = JSON.stringify(data)
  const sizeInBytes = new Blob([jsonString]).size
  
  if (sizeInBytes > COMPRESSION_THRESHOLD) {
    console.log(`Compressing data: ${sizeInBytes} bytes`)
    const compressed = LZString.compress(jsonString)
    return {
      compressed: true,
      originalSize: sizeInBytes,
      compressedSize: new Blob([compressed]).size,
      data: compressed,
      compressionRatio: ((sizeInBytes - new Blob([compressed]).size) / sizeInBytes * 100).toFixed(1)
    }
  }
  
  return {
    compressed: false,
    originalSize: sizeInBytes,
    data: jsonString
  }
}

/**
 * Decompress data if it was compressed
 * @param {Object} compressedData - Compressed data object
 * @returns {Object} - Decompressed data
 */
export const decompressData = (compressedData) => {
  if (!compressedData.compressed) {
    return JSON.parse(compressedData.data)
  }
  
  console.log(`Decompressing data: ${compressedData.compressedSize} -> ${compressedData.originalSize} bytes`)
  const decompressed = LZString.decompress(compressedData.data)
  return JSON.parse(decompressed)
}

/**
 * Check if data should be compressed based on size
 * @param {Object} data - Data to check
 * @returns {boolean} - Whether compression is recommended
 */
export const shouldCompress = (data) => {
  const jsonString = JSON.stringify(data)
  const sizeInBytes = new Blob([jsonString]).size
  return sizeInBytes > COMPRESSION_THRESHOLD
}

/**
 * Get compression statistics
 * @param {Object} data - Data to analyze
 * @returns {Object} - Compression statistics
 */
export const getCompressionStats = (data) => {
  const jsonString = JSON.stringify(data)
  const originalSize = new Blob([jsonString]).size
  
  if (originalSize <= COMPRESSION_THRESHOLD) {
    return {
      shouldCompress: false,
      originalSize,
      estimatedCompressedSize: null,
      estimatedSavings: null
    }
  }
  
  const compressed = LZString.compress(jsonString)
  const compressedSize = new Blob([compressed]).size
  const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
  
  return {
    shouldCompress: true,
    originalSize,
    estimatedCompressedSize: compressedSize,
    estimatedSavings: savings
  }
}

/**
 * Validate compressed data structure
 * @param {Object} data - Data to validate
 * @returns {Object} - Validation result
 */
export const validateCompressedData = (data) => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid data structure' }
  }
  
  if (data.compressed) {
    if (!data.data || typeof data.data !== 'string') {
      return { isValid: false, error: 'Compressed data missing or invalid' }
    }
    
    if (!data.originalSize || typeof data.originalSize !== 'number') {
      return { isValid: false, error: 'Original size missing or invalid' }
    }
    
    // Try to decompress to validate
    try {
      const decompressed = LZString.decompress(data.data)
      if (!decompressed) {
        return { isValid: false, error: 'Failed to decompress data' }
      }
      
      const parsed = JSON.parse(decompressed)
      if (!parsed || typeof parsed !== 'object') {
        return { isValid: false, error: 'Decompressed data is not valid JSON object' }
      }
      
      return { isValid: true, data: parsed }
    } catch (error) {
      return { isValid: false, error: `Decompression failed: ${error.message}` }
    }
  } else {
    // Not compressed, validate as regular JSON
    try {
      const parsed = JSON.parse(data.data)
      if (!parsed || typeof parsed !== 'object') {
        return { isValid: false, error: 'Data is not valid JSON object' }
      }
      
      return { isValid: true, data: parsed }
    } catch (error) {
      return { isValid: false, error: `JSON parsing failed: ${error.message}` }
    }
  }
} 