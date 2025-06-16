# HomePage_monitoring.css Documentation

## Overview
This CSS file implements an ultra-compact monitoring system design for the HomePage component. It focuses on creating space-efficient monitoring panels with responsive behavior and minimal visual footprint.

## Architectural Structure

### 1. Layout System

#### Grid-Based Content Container
```css
.content-container
```
- **Purpose**: Primary layout structure for monitoring panels
- **Layout**: CSS Grid with 3 auto-sized columns
- **Design Pattern**: Compact grid system with minimal gaps
- **Key Features**:
  - Full height utilization
  - Hidden overflow for clean edges
  - 4px gap between grid items

### 2. Monitor Components

#### Base Monitor Styles
```css
.sensitivity-monitor,
.config-monitor
```
- **Purpose**: Container styling for sensitivity and configuration monitors
- **Visual Design**:
  - Compact 12px font size
  - Minimal border radius (4px)
  - No box shadows for cleaner appearance
  - Background uses CSS variable for theme consistency

#### Monitor Header System
```css
.monitor-header
```
- **Layout**: Flexbox with space-between alignment
- **Visual Hierarchy**:
  - Minimal padding (2px 4px)
  - Bottom border for content separation
  - Bold 12px heading text
- **Interactive Elements**: Toggle button integration

#### Monitor Body
```css
.monitor-body
```
- **Purpose**: Content container with ultra-compact padding
- **Design Choice**: 3px padding maximizes content space

### 3. Content Elements

#### Monitor Items
```css
.monitor-item
```
- **Visual Design**:
  - Minimal vertical margins (2px)
  - Subtle background differentiation
  - 2px border radius for soft edges

#### Label-Value Pairs
```css
.monitor-label,
.monitor-value
```
- **Typography**: 11px font size for maximum density
- **Layout**: Inline display with minimal spacing
- **Hierarchy**: Bold labels for quick scanning

### 4. Interactive Elements

#### Toggle Buttons
```css
.monitor-toggle
```
- **Size**: Compact 16x16px
- **Design**: Borderless with centered icon
- **State**: Uses text-secondary color variable
- **Interaction**: Pointer cursor on hover

### 5. Calculation Monitor

#### Specialized Monitor Component
```css
.calculation-monitor
```
- **Purpose**: Display calculation results in tabular format
- **Design Features**:
  - Thin borders (1px)
  - Compact padding (3px)
  - Separated header section

#### Table Styling
```css
.calculation-monitor table,
.calculation-monitor th,
.calculation-monitor td
```
- **Layout**: Collapsed borders for space efficiency
- **Typography**: 10px font size in tables
- **Padding**: Minimal 1px/3px for cells
- **Visual**: Header cells with distinct background

### 6. Responsive Design

#### Medium Screens (≤1200px)
```css
@media screen and (max-width: 1200px)
```
- **Layout Change**: Flex wrap enabled
- **Expanded State**: Fixed 520px width for expanded monitors

#### Small Screens (≤520px)
```css
@media screen and (max-width: 520px)
```
- **Layout**: Vertical column direction
- **Sizing**:
  - Full width for all monitors
  - Height-based constraints (max 200px)
  - Scrollable overflow
- **Special Cases**:
  - Sensitivity monitor: 150px expanded height
  - Collapsed state: 24px height

## Design Philosophy

### Space Efficiency
- Ultra-compact measurements throughout
- Minimal padding and margins
- Efficient use of available screen space

### Visual Hierarchy
- Clear header/body separation
- Consistent label/value formatting
- Subtle background variations

### Responsive Behavior
- Progressive enhancement approach
- Mobile-first considerations
- Flexible sizing with fixed constraints

## Component States

### Expanded State
- Shows full monitor content
- Fixed widths on larger screens
- Height constraints on mobile

### Collapsed State
- Minimal height representation
- Full width on mobile devices
- Preserves toggle functionality

## Theme Integration
The file uses CSS variables for consistent theming:
- `--sidebar-background`: Monitor backgrounds
- `--border-color`: All borders
- `--text-secondary`: Secondary text elements
- `--input-background`: Input field backgrounds

## Performance Considerations
- No complex animations
- Minimal reflows with fixed dimensions
- Efficient selectors
- Hardware-accelerated transforms where applicable