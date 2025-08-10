// src/constants/scale-types.js

export const SCALE_TYPES = {
  THREE_POINT: '3-point',
  FIVE_POINT: '5-point',
  MULTI_SELECT: 'multi-select',
  NUMERIC: 'numeric'
}

// Strict allowed values per .cursorrules
export const SCALE_VALIDATIONS = {
  '3-point': [1, 3, 5],
  '5-point': [1, 2, 3, 4, 5]
}

// Wearable numeric ranges per .cursorrules
export const WEARABLE_RANGES = {
  sleep_score: [0, 100],
  body_battery: [0, 100]
}

// Small helpers (pure, optional to use)
export const getAllowedValues = (scaleType) => SCALE_VALIDATIONS[scaleType] || null
export const isThreePoint = (scaleType) => scaleType === SCALE_TYPES.THREE_POINT
export const isFivePoint = (scaleType) => scaleType === SCALE_TYPES.FIVE_POINT
