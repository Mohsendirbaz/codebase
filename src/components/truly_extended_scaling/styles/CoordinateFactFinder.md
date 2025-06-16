# CoordinateFactFinder CSS Documentation

## Overview
The CoordinateFactFinder stylesheet implements a fact-finding interface for coordinate-based data analysis. It features a clean, information-focused design with support for loading states, data tables, and interactive asset selection.

## Core Design System

### Container Architecture
- **Main Container** (`.coordinate-fact-finder`)
  - Light gray background (#f9fafb)
  - Standard border and rounded corners
  - Card-like appearance with soft shadow
  - Generous padding (1.5rem) for content

### Header Design
- **Layout** (`.fact-finder-header`)
  - Flex layout with space-between alignment
  - Bottom border separator
  - Blue accent color (#3b82f6) for titles
  - Status indicators on the right

- **Typography**
  - Title: 1.125rem with bold weight
  - Blue color for visual prominence
  - Zero margin for precise alignment

## State Management

### Loading State
- **Design** (`.fact-finder-loading`)
  - Gray background (#f3f4f6)
  - Compact padding (0.25rem × 0.5rem)
  - Pulse animation for activity indication
  - Rounded corners for consistency

- **Animation** (`@keyframes pulse`)
  - Opacity variation (0.6 to 1.0)
  - 1.5s duration with infinite loop
  - Smooth breathing effect

### Error State
- **Styling** (`.fact-finder-error`)
  - Red text color (#ef4444)
  - Light red background (#fee2e2)
  - Same padding as loading state
  - Clear error indication

## Content Sections

### Section Container
- **Design** (`.fact-finder-section`)
  - White background on gray
  - Bordered box with rounded corners
  - Internal padding (1rem)
  - Bottom margin for spacing
  - Hidden overflow for clean edges

### Section Headers
- **Typography** (`.fact-finder-section h5`)
  - 1rem font size with bold weight
  - Dark text color (#1f2937)
  - Bottom margin (0.75rem)
  - Clear section delineation

## Information Display

### Summary Text
- **Styling** (`.fact-finder-summary`)
  - Standard body text size (0.875rem)
  - Medium gray color (#4b5563)
  - 1.5 line height for readability
  - Bottom margin for separation

### Data Tables
- **Table Structure** (`.fact-finder-examples table`)
  - Full width with collapsed borders
  - Consistent font size (0.875rem)
  - Clean, scannable layout

- **Table Headers** (`th`)
  - Left-aligned text
  - Gray background (#f3f4f6)
  - Bold weight for emphasis
  - Bottom border separation

- **Table Cells** (`td`)
  - Consistent padding (0.5rem)
  - Bottom borders except last row
  - Medium gray text (#4b5563)

## Recommendation Display

### Recommendation Box
- **Design** (`.fact-finder-recommendation`)
  - Light blue background (#eff6ff)
  - Blue left border (3px solid)
  - Rounded corners (0.25rem)
  - Internal padding (0.75rem)

- **Typography**
  - Small font size (0.875rem)
  - Medium gray text
  - Clear information hierarchy

## Asset Selection Interface

### Selection Container
- **Layout** (`.fact-finder-asset-selection`)
  - Bottom margin for separation
  - Clear section structure

### Asset Buttons
- **Container** (`.asset-buttons`)
  - Flex layout with wrap
  - 0.5rem gaps between buttons
  - Responsive button arrangement

- **Button Design** (`.asset-button`)
  - Gray background (#f3f4f6)
  - Subtle border (#e5e7eb)
  - Compact padding (0.375rem × 0.75rem)
  - Smooth transitions (0.2s)

### Button States
- **Hover State**
  - Darker gray background (#e5e7eb)
  - Visual feedback for interaction

- **Active State** (`.asset-button.active`)
  - Blue background (#3b82f6)
  - White text for contrast
  - Blue border for consistency
  - Clear selection indicator

## Responsive Design

### Mobile Breakpoint (≤768px)

#### Layout Adaptations
1. **Header**: 
   - Switches to column layout
   - Left-aligned elements
   - Vertical gap (0.5rem)

2. **Asset Buttons**:
   - Full-width display
   - Vertical stack layout
   - Left-aligned text

3. **Tables**:
   - Horizontal scroll enabled
   - Maintains readability
   - Block display mode

### Mobile Optimizations
- Touch-friendly button sizes
- Improved spacing for fingers
- Maintained visual hierarchy
- Optimized information density

## Visual Design Patterns

### Color Scheme
- **Primary Blue**: #3b82f6 (headers, active states)
- **Grays**: Multiple shades for hierarchy
  - Light: #f9fafb (backgrounds)
  - Medium: #e5e7eb (borders)
  - Dark: #1f2937 (text)

### Information Hierarchy
1. Section titles (largest, bold)
2. Summary text (medium, regular)
3. Table data (small, structured)
4. Recommendations (highlighted box)

### Interactive Elements
- Clear hover states
- Active selection feedback
- Smooth state transitions
- Consistent interaction patterns

## Accessibility Features
- High contrast text combinations
- Clear focus indicators
- Semantic HTML support
- Screen reader friendly structure

## Performance Considerations
- Efficient CSS animations
- Minimal layout recalculations
- Optimized selector specificity
- Smooth transitions without jank

## Use Cases
- Coordinate data analysis
- Asset information lookup
- Fact-based decision support
- Location-specific insights