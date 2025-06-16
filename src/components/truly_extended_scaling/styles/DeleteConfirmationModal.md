# DeleteConfirmationModal CSS Documentation

## Overview
The DeleteConfirmationModal stylesheet implements a comprehensive modal dialog system for handling deletion confirmations. It features a multi-step confirmation process with affected item visualization, deletion options, and clear warning states.

## Core Design System

### Modal Overlay
- **Overlay** (`.modal-overlay`)
  - Full-screen fixed positioning
  - Semi-transparent black background (50% opacity)
  - Flexbox centering for modal content
  - High z-index (1000) for stacking
  - Click-outside-to-close functionality support

### Modal Container
- **Main Modal** (`.delete-confirmation-modal`)
  - White background with rounded corners (8px)
  - Elevated shadow (0 4px 12px)
  - Responsive width (90%, max 600px)
  - Scrollable content (max-height: 90vh)
  - Flexible column layout

## Header Design

### Standard Header
- **Layout** (`.modal-header`)
  - Horizontal flex with center alignment
  - Padding: 1rem horizontal, 1.5rem vertical
  - Bottom border separator (#e5e7eb)
  - Icon and title alignment

### Warning State
- **Warning Header** (`.modal-header.warning`)
  - Light red background (#fef2f2)
  - Dark red text (#b91c1c)
  - Visual urgency indication

### Icon System
- **Warning Icon** (`.warning-icon`)
  - Fixed dimensions (1.5rem × 1.5rem)
  - Right margin for spacing (0.75rem)
  - Red color for danger indication
  - SVG-ready sizing

## Content Area

### Main Content
- **Container** (`.modal-content`)
  - Generous padding (1.5rem)
  - Flexible growth for variable content
  - Scrollable overflow
  - Clean background

### Warning Message
- **Typography** (`.delete-warning`)
  - Standard font size (1rem)
  - Gray text color (#4b5563)
  - Bottom margin (1.5rem)
  - Clear warning communication

## Affected Items Display

### Section Structure
- **Container** (`.affected-groups`)
  - Bottom margin for separation
  - Clear section organization

### List Design
- **List Container** (`.affected-groups-list`)
  - No default list styling
  - Bordered box with rounded corners
  - Hidden overflow for clean edges
  - Zero padding/margin

### Item Display
- **List Items** (`.affected-group-item`)
  - Horizontal flex layout
  - Space-between alignment
  - Gray background (#f9fafb)
  - Bottom borders except last item
  - Padding for readability

### Typography
- **Group Name** (`.group-name`)
  - Medium weight (500)
  - Dark gray color (#374151)
  
- **Item Count** (`.item-count`)
  - Smaller font (0.875rem)
  - Muted gray (#6b7280)
  - Right-aligned metadata

### Empty State
- **No Items** (`.no-affected-groups`)
  - Padded container (1rem)
  - Light gray background (#f3f4f6)
  - Rounded corners (6px)
  - Informative text styling

## Deletion Options

### Options Container
- **Section** (`.deletion-options`)
  - Bottom margin for spacing
  - Clear section header

### Option Cards
- **Layout** (`.options-list`)
  - Vertical flex with 0.75rem gaps
  - Clean card arrangement

- **Individual Options** (`.option-item`)
  - Bordered cards with rounded corners
  - Internal padding (1rem)
  - Pointer cursor for interactivity
  - Smooth transitions (0.2s)

### Option States
- **Hover State**
  - Light gray background (#f9fafb)
  - Subtle interaction feedback

- **Selected State** (`.option-item.selected`)
  - Blue border (#3b82f6)
  - Light blue background (#eff6ff)
  - Clear selection indicator

### Option Content
- **Header** (`.option-header`)
  - Flex layout with radio input
  - Bold labels (weight 600)
  - Proper input spacing

- **Details** (`.option-details`)
  - Left padding (1.5rem) for indentation
  - Structured information display

- **Impact Display** (`.option-impact`)
  - Small font size (0.875rem)
  - Muted colors for secondary info
  - Bold labels for emphasis

## Help Section

### Help Container
- **Design** (`.help-section`)
  - Flex layout with icon
  - Gray background (#f3f4f6)
  - Rounded corners (6px)
  - Top margin for separation

### Help Icon
- **Styling** (`.help-icon`)
  - Fixed size (1.25rem × 1.25rem)
  - Gray color (#6b7280)
  - Flex shrink prevention
  - Precise top alignment

### Help Text
- **Typography** (`.help-text`)
  - Small font (0.875rem)
  - Medium gray color
  - Increased line height (1.4)
  - Zero margins

## Action Buttons

### Button Container
- **Layout** (`.modal-actions`)
  - Right-aligned flex layout
  - Consistent padding (1rem × 1.5rem)
  - Top border separator
  - Button gap (0.75rem)

### Button Styles

#### Cancel Button
- **Design** (`.cancel-button`)
  - White background with border
  - Gray text (#4b5563)
  - Rounded corners (6px)
  - Hover: gray background

#### Confirm Button
- **Standard** (`.confirm-button`)
  - Blue background (#3b82f6)
  - White text
  - No border for emphasis
  - Hover: darker blue

- **Warning Variant** (`.confirm-button.warning`)
  - Red background (#ef4444)
  - Destructive action indicator
  - Hover: darker red (#dc2626)

### Button Properties
- Consistent padding (0.5rem × 1rem)
- Medium font weight (500)
- Smooth transitions (0.2s)
- Pointer cursors

## Visual Hierarchy

### Z-Index Layers
1. Modal overlay (1000)
2. Modal content (implicit)
3. Interactive elements (implicit)

### Color Coding
- **Danger/Warning**: Red tones
- **Selection/Info**: Blue tones
- **Neutral**: Gray scale
- **Background**: White/Light gray

### Spacing System
- Consistent padding multiples
- Clear section separation
- Breathing room for content
- Touch-friendly targets

## Responsive Considerations
- Maximum width constraint (600px)
- Percentage-based width (90%)
- Scrollable content area
- Flexible button layout
- Mobile-friendly touch targets

## Accessibility Features
- Clear focus indicators
- High contrast ratios
- Semantic color usage
- Keyboard navigation support
- Screen reader friendly structure

## Animation Support
- Smooth transitions on interactions
- No jarring state changes
- Performance-optimized properties
- Hardware acceleration ready