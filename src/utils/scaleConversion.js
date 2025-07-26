// Scale conversion utilities for backwards compatibility
// This allows 3-point scale items to be treated as 5-point scales internally
// while maintaining the original 3-point UI experience

/**
 * Converts a 3-point scale value to a 5-point scale value
 * 1 -> 1, 2 -> 3, 3 -> 5
 */
export const convert3To5Point = (value) => {
  if (value === 1) return 1
  if (value === 2) return 3
  if (value === 3) return 5
  return value // Return as-is if not a 3-point value
}

/**
 * Converts a 5-point scale value back to a 3-point scale value
 * 1 -> 1, 2-4 -> 2, 5 -> 3
 */
export const convert5To3Point = (value) => {
  if (value === 1) return 1
  if (value >= 2 && value <= 4) return 2
  if (value === 5) return 3
  return value // Return as-is if not a 5-point value
}

/**
 * Normalizes a scale value for storage and analysis
 * For 3-point scale items, converts to 5-point scale
 * For other scales, returns the value as-is
 */
export const normalizeScaleValue = (value, itemScale) => {
  if (itemScale === 3) {
    return convert3To5Point(value)
  }
  return value
}

/**
 * Denormalizes a scale value for display
 * For 3-point scale items, converts back to 3-point scale
 * For other scales, returns the value as-is
 */
export const denormalizeScaleValue = (value, itemScale) => {
  if (itemScale === 3) {
    return convert5To3Point(value)
  }
  return value
}

/**
 * Gets the effective scale for analysis (always 5 for 3-point items)
 */
export const getEffectiveScale = (itemScale) => {
  return itemScale === 3 ? 5 : itemScale
}

/**
 * Checks if an item uses 3-point scale
 */
export const is3PointScale = (itemScale) => {
  return itemScale === 3
} 