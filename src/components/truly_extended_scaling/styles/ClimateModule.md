# ClimateModule CSS Documentation

## Overview
The ClimateModule stylesheet implements a comprehensive climate tracking and carbon emissions visualization system. It features a multi-layered design with sections for emissions breakdown, regulatory compliance, carbon incentives, and scope categorization following GHG Protocol standards.

## Core Design System

### Container Architecture
- **Main Module** (`.climate-module`)
  - Light background (#f9fafb) with subtle border
  - Rounded corners (0.5rem) and soft shadow
  - Generous padding (1.5rem) and top margin (2rem)
  - Card-based layout pattern

### Header System
- **Primary Header** (`.climate-module-header`)
  - Flexbox column layout with nested row
  - Green accent color (#10b981) for climate theme
  - Split layout between title and controls
  
- **Control Panel** (`.climate-module-controls`)
  - Horizontal flex with 1.5rem gaps
  - Toggle buttons for units (metric/imperial)
  - Region selection (global/regional)

### Button Design Patterns

#### Toggle Buttons
- **Base Style**
  - Grouped buttons with shared borders
  - Light gray background (#f9fafb)
  - Compact padding (0.375rem × 0.75rem)
  - Small font size (0.75rem)
  
- **Active States**
  - Unit toggle: Green background (#10b981)
  - Region toggle: Blue background (#3b82f6)
  - White text for contrast

### Summary Display
- **Container** (`.climate-module-summary`)
  - Green-themed highlight box (#ecfdf5)
  - 4px left border in primary green
  - Flex layout with space-between alignment
  
- **Value Display**
  - Bold font weight (700)
  - Dark green color (#047857)
  - Integrated version/zone info

## Emissions Breakdown

### Visual Hierarchy
- **Container** (`.climate-module-breakdown`)
  - White background with border
  - Horizontal flex layout
  - Equal spacing between items

### Category Styling
- **Hard to Decarbonize**: Amber color (#f59e0b)
- **Standard Emissions**: Green color (#10b981)
- **Percentage Display**: Gray subdued text (#6b7280)

## Content Grid System

### Two-Column Layout
- **Main Grid** (`.climate-module-content`)
  - 2:1 column ratio (2fr 1fr)
  - 1.5rem gap between columns
  - Responsive collapse on mobile

### Group Components
- **Group Container** (`.climate-module-group`)
  - White background with border
  - Header with gray background (#f3f4f6)
  - Overflow hidden for clean edges

- **Group Totals**
  - Right-aligned flex column
  - Color-coded badges for categories
  - Nested total displays

## Item Styling

### Individual Items
- **Base Item** (`.climate-module-item`)
  - Vertical flex layout
  - Subtle bottom borders
  - Padding for readability

- **Hard to Decarbonize Items**
  - 3px amber left border
  - Light amber background (#fffbeb)
  - Visual prominence for attention

### Badge System
- **Scope Badges**
  - Scope 1: Blue theme (#1e40af, #dbeafe)
  - Scope 2: Indigo theme (#4338ca, #e0e7ff)
  - Scope 3: Purple theme (#6d28d9, #ede9fe)
  - Uppercase text with tiny font (0.625rem)

## Regulatory Compliance Section

### Status Indicators
- **Compliant**: Green theme with checkmark metaphor
- **Warning**: Amber theme for caution
- **Non-Compliant**: Red theme for violations
- **Not Applicable**: Gray theme for N/A items

### Compliance Levels
- **Level Container** (`.climate-module-compliance-level`)
  - Light gray background
  - 3px left border indicating status
  - Horizontal flex with space-between

### Toggle Switch Design
- **Custom Toggle** (`.climate-module-regulatory-toggle`)
  - 2.5rem × 1.25rem dimensions
  - Smooth transitions (0.4s)
  - Green when active (#10b981)
  - Circular slider with transform animation

## Carbon Incentives Channel

### Channel Design
- **Header** (`.climate-module-incentives-header`)
  - Blue accent color (#3b82f6)
  - Bottom border separator
  - Total value display in header

### Incentive Display
- **Item Cards** (`.climate-module-incentive-item`)
  - White background on gray
  - Structured information hierarchy
  - Value badges with blue theme

### State Handling
- **Loading State**: Pulse animation with gray background
- **Error State**: Red background (#fee2e2) with error text
- **Empty State**: Centered message with gray text

## Hydrogen Gate Definition

### Specialized Section
- **Container** (`.climate-module-hydrogen-gate`)
  - White background with standard borders
  - Descriptive text in gray (#6b7280)
  - Keyword management system

### Keyword System
- **Keyword Tags** (`.climate-module-keyword`)
  - Flex layout with remove buttons
  - Gray background with borders
  - Hover state for remove action
  - Input field for adding new keywords

## Scopes Grid

### Three-Column Layout
- **Grid** (`.climate-module-scopes-grid`)
  - Equal columns (repeat(3, 1fr))
  - Responsive collapse to single column
  - 1rem gap between scopes

### Scope Cards
- **Design Pattern**
  - Light gray background
  - Centered text alignment
  - Title/subtitle hierarchy
  - Percentage display inline

## Responsive Design

### Mobile Breakpoint (≤768px)

#### Layout Transformations
1. **Content Grid**: Collapses to single column
2. **Header**: Stacks vertically
3. **Summary**: Column layout with left alignment
4. **Scopes Grid**: Single column stack
5. **Breakdown**: Vertical stack
6. **Controls**: Column layout

#### Mobile Optimizations
- Full-width buttons and inputs
- Increased touch targets
- Simplified navigation
- Preserved visual hierarchy

## Climate-Specific Styling

### Color Psychology
- **Green**: Positive environmental impact
- **Amber**: Caution or medium impact
- **Red**: High impact or non-compliance
- **Blue**: Information and incentives

### Visual Metaphors
- Left borders for status indication
- Badge patterns for categorization
- Toggle switches for binary choices
- Progress indicators for thresholds

## Accessibility Features
- High contrast color combinations
- Clear focus states for inputs
- Descriptive text for screen readers
- Logical tab order through sections

## Performance Considerations
- Efficient flexbox and grid layouts
- Minimal nested selectors
- CSS-only animations
- Optimized for rendering performance