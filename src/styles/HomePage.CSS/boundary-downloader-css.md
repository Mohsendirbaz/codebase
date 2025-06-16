# Boundary Downloader CSS Documentation

## Overview
`boundary-downloader-css.css` provides styling for a geographic boundary downloading interface component. This stylesheet defines the visual presentation for downloading administrative boundaries, zones, and related geographic data with various format options.

## Component Structure

### Main Container
- `.boundary-downloader`: Flex column container with white background, rounded corners, and border
  - Full width display
  - 8px border radius
  - 1px solid border (#ddd)
  - Hidden overflow for clean edges

### Header Section
- `.boundary-downloader-header`: Flexbox header with stats display
  - Space-between alignment for title and stats
  - 16px vertical, 20px horizontal padding
  - Light gray background (#f5f5f5)
  - Bottom border separator

#### Header Elements
- `h3`: 18px font, 600 weight title
- `.boundary-downloader-stats`: Flex container for count displays
- `.boundary-count` / `.zone-count`: 
  - 14px font size
  - Color-coded circular indicators (8px)
  - Green (#4caf50) for boundaries
  - Blue (#2196f3) for zones

### Content Area
- `.boundary-downloader-content`: Main content container
  - 20px padding
  - Minimum height of 300px

### Loading State
- `.boundary-downloader-loading`: Centered loading display
  - Flexbox column layout
  - 240px minimum height
  - `.loading-spinner`: 40px rotating spinner animation
    - 3px border with green top accent
    - 1s linear infinite rotation

### Empty State
- `.boundary-downloader-empty`: Empty data display
  - Centered content with gray text (#666)
  - Light background (#f9f9f9)
  - 8px border radius
  - 20px padding

### Selection Interface

#### Container Layout
- `.boundary-selection-container`: Main flex container
  - 24px gap between sections
  - Responsive column layout on mobile

#### Tabs Section
- `.boundary-selection-tabs`: Left panel for boundary lists
  - Flex: 1 with 300px max width
  - 20px gap between tabs
  - Tab headers with bottom borders

#### Boundary Lists
- `.boundary-list`: Scrollable list container
  - Light background (#f5f5f5)
  - 6px border radius
  - 200px max height with scroll
  
- `.boundary-item`: Individual list items
  - 10px/12px padding
  - Hover effect with light green background
  - Selected state with green text (#2e7d32)
  - Bottom border separators

### Download Panel
- `.boundary-download-panel`: Right panel for download options
  - Flex: 2 ratio
  - Light gray background (#f9f9f9)
  - 8px border radius
  - 16px padding

#### Panel Sections
Common section styling for:
- `.boundary-format-section`
- `.boundary-advanced-section`
- `.boundary-for-zones-section`
- `.boundary-format-info`

Features:
- White background
- 6px border radius
- 14px padding
- 1px border (#eee)
- 20px bottom margin

### Format Options
- `.boundary-format-grid`: Auto-fill grid for format buttons
  - Minimum 100px columns
  - 8px gap
  
- `.boundary-download-button`: Download action buttons
  - Blue background (#2196f3)
  - White text
  - 10px padding
  - 4px border radius
  - Hover darkens to #1976d2

### Advanced Options
- `.advanced-options-grid`: Two-column layout
  - 12px gap
  - Responsive single column on mobile

- `.advanced-option-group`: Form control groups
- `.advanced-checkbox-label`: Checkbox with labels
  - 13px font size
  - 6px right margin on input

- `.advanced-input` / `.advanced-select`: Form inputs
  - 6px padding
  - 1px border (#ddd)
  - 4px border radius

### Zone Options
- `.boundary-zones-button`: Zone selection buttons
  - Light background (#f5f5f5)
  - 8px/12px padding
  - Hover effect to #e0e0e0

### Information Display
- `.format-info-grid`: Two-column info layout
  - 10px gap
  - Single column on mobile

- `.format-info-item`: Individual info blocks
  - `.format-name`: 500 weight, 13px
  - `.format-description`: 12px, gray text (#666)

## Responsive Design

### Mobile Breakpoint (768px)
- Selection container switches to column layout
- Tabs section expands to full width
- Advanced options and format info become single column

## Animation

### Loading Spinner
```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## Color Palette
- Primary Blue: #2196f3
- Success Green: #4caf50
- Background Light: #f5f5f5, #f9f9f9
- Borders: #ddd, #eee
- Text Primary: #333
- Text Secondary: #555, #666
- Green Accent: #e8f5e9, #2e7d32

## Typography
- Headers: 18px (h3), 16px (h4), 14px (h5)
- Body text: 13px-14px
- Small text: 11px-12px
- Font weights: 600 (headers), 500 (emphasis), 400 (normal)