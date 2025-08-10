import { normalizeScaleValue, denormalizeScaleValue, getEffectiveScale, is3PointScale } from '../scaleConversion.js'

describe('scaleConversion', () => {
  describe('normalizeScaleValue', () => {
    it('should convert 3-point scale to 5-point scale', () => {
      expect(normalizeScaleValue(1, 3)).toBe(1)
      expect(normalizeScaleValue(2, 3)).toBe(3)
      expect(normalizeScaleValue(3, 3)).toBe(5)
    })

    it('should handle 5-point scale unchanged', () => {
      expect(normalizeScaleValue(1, 5)).toBe(1)
      expect(normalizeScaleValue(3, 5)).toBe(3)
      expect(normalizeScaleValue(5, 5)).toBe(5)
    })

    it('should handle edge cases', () => {
      expect(normalizeScaleValue(0, 3)).toBe(0)
      expect(normalizeScaleValue(4, 3)).toBe(4)
    })
  })

  describe('denormalizeScaleValue', () => {
    it('should convert 5-point scale back to 3-point scale', () => {
      expect(denormalizeScaleValue(1, 3)).toBe(1)
      expect(denormalizeScaleValue(3, 3)).toBe(2)
      expect(denormalizeScaleValue(5, 3)).toBe(3)
    })

    it('should handle 5-point scale unchanged', () => {
      expect(denormalizeScaleValue(1, 5)).toBe(1)
      expect(denormalizeScaleValue(3, 5)).toBe(3)
      expect(denormalizeScaleValue(5, 5)).toBe(5)
    })
  })

  describe('getEffectiveScale', () => {
    it('should return 5 for 3-point scale items', () => {
      expect(getEffectiveScale(3)).toBe(5)
    })

    it('should return original scale for non-3-point items', () => {
      expect(getEffectiveScale(4)).toBe(4)
      expect(getEffectiveScale(5)).toBe(5)
    })
  })

  describe('is3PointScale', () => {
    it('should return true for 3-point scale', () => {
      expect(is3PointScale(3)).toBe(true)
    })

    it('should return false for other scales', () => {
      expect(is3PointScale(4)).toBe(false)
      expect(is3PointScale(5)).toBe(false)
    })
  })
}) 