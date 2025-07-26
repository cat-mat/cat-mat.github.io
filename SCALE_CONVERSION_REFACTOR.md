# Scale Conversion Refactor

## Overview
This refactor implements a system where 3-point scale tracking items are internally stored and analyzed as 5-point scales while maintaining the original 3-point UI experience. This ensures backwards compatibility and consistent insights reporting with a maximum of 5 points for every tracked item.

## Changes Made

### 1. New Utility Functions (`src/utils/scaleConversion.js`)
- `convert3To5Point(value)`: Converts 3-point values (1,2,3) to 5-point values (1,3,5)
- `convert5To3Point(value)`: Converts 5-point values back to 3-point values
- `normalizeScaleValue(value, itemScale)`: Normalizes values for storage (3-point → 5-point)
- `denormalizeScaleValue(value, itemScale)`: Denormalizes values for display (5-point → 3-point)
- `getEffectiveScale(itemScale)`: Returns effective scale for analysis (always 5 for 3-point items)
- `is3PointScale(itemScale)`: Checks if an item uses 3-point scale

### 2. Updated Validation (`src/utils/validation.js`)
- Added custom validation for 3-point scale items that automatically converts to 5-point internally
- Updated all 3-point scale items to use the new validation:
  - `allergic_reactions`, `bleeding_spotting`, `brain_fog`, `forehead_shine`
  - `hydration`, `mood`, `nausea`, `temperature_sensitivity`, `weird_dreams`

### 3. Updated Tracking Items (`src/constants/trackingItems.js`)
- Added helper functions for scale conversion
- Updated `getItemColor()` to use effective scale for color determination
- Added `getItemEffectiveScale()` and `isItem3PointScale()` helper functions

### 4. Updated UI Components
- **TrackingForm**: Converts stored 5-point values back to 3-point for display
- **Logs**: Converts stored 5-point values back to 3-point for display
- **Insights**: Uses effective scale (5-point) for all calculations and displays

### 5. Data Migration
- Added migration to version 1.3.0 that converts existing 3-point values to 5-point format
- Updated default config version to 1.3.0

## How It Works

### Storage
- 3-point scale values are automatically converted to 5-point scale when saved
- 1 → 1, 2 → 3, 3 → 5

### Display
- Stored 5-point values are converted back to 3-point for UI display
- 1 → 1, 2-4 → 2, 5 → 3

### Analysis
- All insights and trends use the 5-point scale internally
- This ensures consistent reporting across all tracking items

## Benefits

1. **Backwards Compatibility**: Existing 3-point scale items continue to work as before
2. **Consistent Insights**: All items now report on a 5-point scale maximum
3. **Future Flexibility**: Easy to convert 3-point items to 5-point items later
4. **Data Integrity**: No data loss during conversion

## Affected Items

The following tracking items now use the 3-point to 5-point conversion:
- Allergic Reactions
- Bleeding/Spotting  
- Brain Fog
- Forehead Shine
- Hydration
- Mood
- Nausea
- Temperature Sensitivity
- Weird Dreams

## Testing

The scale conversion utilities have been tested and verified to work correctly:
- 3-point to 5-point conversion: 1→1, 2→3, 3→5
- 5-point to 3-point conversion: 1→1, 2-4→2, 5→3
- Normalization and denormalization work as expected
- Effective scale detection works correctly 