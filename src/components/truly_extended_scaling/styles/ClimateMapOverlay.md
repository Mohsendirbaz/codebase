# ClimateMapOverlay CSS Documentation

## Overview
The ClimateMapOverlay stylesheet defines visual design patterns for displaying climate impact data and regulatory zones on interactive maps. It implements a comprehensive overlay system with multiple visualization modes including heatmaps, bubble charts, and gradient displays.

## Core Design System

### Container Structure
- **Main Container** (`.climate-map-overlay`)
  - Light gray background (#f9fafb) with subtle border
  - Rounded corners (0.5rem) and soft shadow
  - Generous padding (1.5rem) for content breathing room
  - Top margin (1.5rem) for separation from preceding elements

### Control System
- **Overlay Controls** (`.overlay-controls`)
  - Flexbox layout with space-between alignment
  - Separator border at bottom
  - Responsive collapse on mobile devices
  
- **Toggle Controls** (`.overlay-toggles`)
  - Horizontal flex layout with 1.5rem gap
  - Checkbox inputs sized at 1rem × 1rem
  - Label styling with cursor pointer for better UX

### Color Coding System

#### Impact Levels
- **Low Impact**: Green (#10b981)
- **Medium Impact**: Amber (#f59e0b)
- **High Impact**: Red (#ef4444)
- **Critical Impact**: Dark Red (#7f1d1d)

#### Background Highlights
- **Low**: Light green (#ecfdf5)
- **Medium**: Light amber (#fffbeb)
- **High**: Light red (#fee2e2)
- **Critical**: Very light red (#fef2f2)

## Visualization Patterns

### 1. Heatmap Visualization
- **Container** (`.impact-heatmap`)
  - Flex layout with 1rem gap
  - Full-width indicator with 2rem height
  - Rounded corners (0.25rem)
  
- **Value Display** (`.heatmap-value`)
  - Bold 0.875rem font
  - No text wrapping for consistency

### 2. Bubble Chart Visualization
- **Bubble Container** (`.impact-bubbles`)
  - Flexbox with wrap enabled
  - Centered content with 1rem gaps
  - Vertical padding for visual balance
  
- **Individual Bubbles** (`.impact-bubble`)
  - Circular shape (border-radius: 50%)
  - Centered content alignment
  - Relative positioning for label placement
  
- **Bubble Labels** (`.bubble-label`)
  - Absolute positioning below bubble
  - Centered horizontally with transform
  - Small font size (0.75rem) in gray

### 3. Gradient Visualization
- **Gradient Bar** (`.gradient-bar`)
  - Linear gradient from green to dark red
  - Fixed height (1.5rem) with rounded corners
  - Relative positioning for indicator placement
  
- **Position Indicator** (`.gradient-indicator`)
  - Thin vertical bar (0.5rem wide)
  - Dark color for contrast
  - Absolute positioning with animation potential

## Regulatory Zones Overlay

### Compliance Status System
- **Compliant**: Green theme (#10b981, #ecfdf5, #047857)
- **Warning**: Amber theme (#f59e0b, #fffbeb, #b45309)
- **Non-Compliant**: Red theme (#ef4444, #fee2e2, #b91c1c)

### Zone Display
- **Zone Container** (`.regulatory-zone`)
  - Flex layout with space-between alignment
  - Light gray background with padding
  - 3px left border indicating status
  - Smooth border radius (0.25rem)

### Information Hierarchy
- **Zone Name**: Bold weight, dark text (#1f2937)
- **Threshold**: Smaller text (0.875rem), medium gray (#4b5563)
- **Status**: Large text (1rem), bold, color-coded

## Responsive Design

### Mobile Breakpoint (≤768px)
1. **Control Layout Changes**
   - Overlay controls stack vertically
   - Toggle controls become column layout
   - Full-width visualization selector

2. **Content Adaptations**
   - Heatmap switches to column layout
   - Regulatory zones stack vertically
   - Zone status moves to bottom-right

### Layout Principles
- Flexible gaps that collapse on smaller screens
- Maintained visual hierarchy through size and color
- Preserved functionality with touch-friendly targets
- Optimized information density for mobile viewing

## Accessibility Considerations
- High contrast ratios for all text elements
- Clear visual indicators for interactive elements
- Consistent color coding across all visualizations
- Sufficient touch target sizes (minimum 44px on mobile)

## Performance Optimizations
- CSS-only animations (pulse effect)
- Efficient flexbox layouts
- Minimal DOM manipulation requirements
- Hardware-accelerated transforms for smooth interactions