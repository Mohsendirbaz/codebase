# LibrarySystem.css Documentation

## Overview
This comprehensive stylesheet defines the visual design system for a complete process economics library interface. It includes styles for item management, search functionality, modals, forms, and usage statistics with a sophisticated, professional design language.

## Visual Design System

### CSS Custom Properties
```css
:root {
  /* Primary Colors */
  --primary-color: #2563eb;
  --primary-light: #3b82f6;
  --primary-dark: #1e40af;
  
  /* Secondary Colors */
  --secondary-color: #10b981;
  --secondary-light: #34d399;
  --secondary-dark: #059669;
  
  /* Gray Scale */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  /* Semantic Colors */
  --red-500: #ef4444;
  --red-600: #dc2626;
  --yellow-400: #facc15;
  --yellow-500: #eab308;
  --green-400: #4ade80;
  --green-500: #22c55e;
  --blue-400: #60a5fa;
  --blue-500: #3b82f6;
  --purple-400: #a78bfa;
  --purple-500: #8b5cf6;
  
  /* Border Radius System */
  --border-radius-sm: 0.25rem;
  --border-radius: 0.375rem;
  --border-radius-md: 0.5rem;
  --border-radius-lg: 0.75rem;
  --border-radius-xl: 1rem;
  --border-radius-full: 9999px;
  
  /* Shadow System */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Animation */
  --transition-speed: 0.15s;
}
```

### Category-Specific Color System
The library uses an extensive color-coding system for different process categories:

```css
/* Process Categories */
.capital-cost-estimation { background-color: #3b82f6; }  /* Blue */
.operating-cost-models { background-color: #10b981; }    /* Green */
.production-planning { background-color: #8b5cf6; }      /* Purple */
.energy-efficiency { background-color: #f59e0b; }        /* Amber */
.equipment-sizing { background-color: #ef4444; }         /* Red */
/* ... and 30+ more categories */
```

## Layout Patterns

### Main Container Structure
```css
.process-economics-library-system {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```
- System font stack for optimal readability
- Full viewport utilization
- Vertical layout with controlled overflow

### Header Layout
```css
.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background-color: white;
  border-bottom: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  z-index: 10;
}
```
- Fixed header with subtle shadow
- Space-between layout for logo and actions
- Elevated z-index for layering

### Navigation System
```css
.library-tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--gray-200);
  margin-bottom: 1rem;
  padding-bottom: 0.25rem;
}

.library-tab-selected {
  color: var(--primary-color);
  background-color: var(--gray-50);
  border-bottom: 2px solid var(--primary-color);
}
```
- Tab-based navigation with active indicators
- Subtle background changes on selection
- Border emphasis for current tab

### Grid Systems

#### Item Cards Grid
```css
.library-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(100vh - 12rem);
}
```
- Responsive auto-fill grid
- Minimum card width of 280px
- Dynamic height calculation

#### Usage Stats Grid
```css
.usage-summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
```
- Four-column layout for stat cards
- Responsive breakpoints for smaller screens

## Component-Specific Styles

### Item Cards
```css
.item-card {
  background-color: white;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}
```
- Lift animation on hover
- Enhanced shadow for depth
- Flexible height for content

### Complexity Badges
```css
.complexity-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-weight: 600;
}

.complexity-badge.simple {
  background-color: rgba(74, 222, 128, 0.2);
  color: var(--green-500);
}
.complexity-badge.medium {
  background-color: rgba(250, 204, 21, 0.2);
  color: var(--yellow-500);
}
.complexity-badge.complex {
  background-color: rgba(239, 68, 68, 0.2);
  color: var(--red-600);
}
```
- Color-coded complexity indicators
- Semi-transparent backgrounds
- Semantic color usage

### Usage Indicators
```css
.usage-indicator {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: var(--border-radius-sm);
  padding: 0.25rem 0.5rem;
  cursor: help;
}
```
- Five-tier usage system (very-low to very-high)
- Compact and full display modes
- Help cursor for additional information

### Search Components
```css
.search-input-L-container {
  display: flex;
  align-items: center;
  background-color: white;
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  padding: 0 0.75rem;
  flex: 1;
  transition: border-color var(--transition-speed);
}

.search-input-L-container:focus-within {
  border-color: var(--primary-color);
}
```
- Focus-within for container-level styling
- Icon integration within search field
- Clear button for quick reset

## Modal System

### Modal Structure
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.item-details-modal,
.save-library-modal,
.copy-link-modal {
  background-color: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```
- Full-screen overlay with centered modal
- Maximum dimensions for large screens
- Flexible internal layout

### Modal Tabs
```css
.modal-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--primary-color);
}
```
- Active tab indicator using pseudo-element
- Bottom border emphasis

## Form Design

### Form Layout
```css
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
```
- Two-column form layout
- Vertical grouping for labels and inputs
- Consistent spacing

### Input Styling
```css
.form-input,
.form-textarea,
.form-select {
  padding: 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  transition: border-color var(--transition-speed);
}

.form-input:focus {
  border-color: var(--primary-color);
  outline: none;
}

.form-input.error {
  border-color: var(--red-500);
}
```
- Consistent input styling across types
- Focus states with primary color
- Error state handling

### Tag Management
```css
.tag-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.5rem;
  background-color: var(--gray-100);
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  color: var(--gray-700);
}
```
- Pill-style tags with remove functionality
- Compact design for multiple tags

## Carousel System

### Carousel Container
```css
.popular-items-carousel {
  position: relative;
  margin: 0 2rem;
}

.carousel-track {
  display: flex;
  width: 100%;
}

.carousel-item {
  flex-shrink: 0;
  padding: 0 0.75rem;
}
```
- Flexible item display (1, 2, or 3 items)
- Navigation buttons with disabled states
- Indicator dots for position

## Animation and Transitions

### Standard Animations
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```
- Fade-in for smooth appearance
- Spin animation for loading states

### Hover Effects
```css
.item-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.carousel-button:hover:not(.disabled) {
  background-color: var(--primary-color);
  color: white;
}
```
- Lift effect for cards
- Color transitions for interactive elements

## Responsive Design

### Breakpoint Strategy

#### Desktop (> 1024px)
- Full multi-column layouts
- All features visible

#### Tablet (768px - 1024px)
```css
@media (max-width: 1024px) {
  .stats-content {
    grid-template-columns: 1fr;
  }
  .usage-summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
```
- Single column stats
- Two-column usage cards
- Stacked form fields

#### Mobile (< 768px)
```css
@media (max-width: 768px) {
  .library-items-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  .item-list-view {
    flex-direction: column;
  }
  .search-bar {
    flex-direction: column;
  }
}
```
- Smaller minimum card width
- Vertical list layout
- Stacked search components

#### Small Mobile (< 640px)
```css
@media (max-width: 640px) {
  .usage-summary-cards {
    grid-template-columns: 1fr;
  }
  .panel-actions {
    flex-wrap: wrap;
  }
}
```
- Single column for all grids
- Wrapped action buttons

## Special Features

### Tooltip System
```css
.tooltip {
  position: absolute;
  bottom: -2.5rem;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--gray-800);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: var(--border-radius);
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
}

.tooltip::before {
  content: '';
  position: absolute;
  top: -0.375rem;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 0.75rem;
  height: 0.75rem;
  background-color: var(--gray-800);
}
```
- Arrow indicator using pseudo-element
- Centered positioning
- Smooth visibility transitions

### Loading States
```css
.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}
```
- Circular spinner with partial border
- Continuous rotation animation

### CILO Section Styling
```css
.cilo-section {
  background-color: white;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
  margin-bottom: 1.5rem;
  overflow: hidden;
}

/* Specialized CILO colors */
.cilo-section.fluid-handling .cilo-icon { color: #3b82f6; }
.cilo-section.thermal-systems .cilo-icon { color: #ef4444; }
.cilo-section.columns .cilo-icon { color: #8b5cf6; }
.cilo-section.renewable-systems .cilo-icon { color: #10b981; }
.cilo-section.power-grid .cilo-icon { color: #f59e0b; }
```
- Category-specific icon colors
- Consistent section structure

## Key Class Hierarchies

### Library Structure
```
.process-economics-library-system
  ├── .library-header
  │   ├── .library-title
  │   └── .library-actions
  ├── .library-navigation
  │   └── .library-tabs
  └── .library-panels
      ├── .library-items-grid
      │   └── .item-card
      └── .general-library-content
          └── .item-list-view
```

### Modal Structure
```
.modal-overlay
  └── .item-details-modal
      ├── .modal-header
      ├── .modal-tabs
      └── .modal-content
          └── .edit-item-form
```

### Usage Stats Structure
```
.usage-stats-panel
  ├── .usage-summary-cards
  │   └── .usage-card
  └── .usage-details-section
      ├── .usage-timeline
      └── .recent-users-list
```

## Best Practices

1. **Consistent Spacing**: Uses gap utilities and padding scales throughout
2. **Color Semantics**: Colors convey meaning (green=success, red=error, etc.)
3. **Progressive Enhancement**: Core functionality works without animations
4. **Accessible Design**: Focus states, help cursors, and clear visual hierarchies
5. **Performance**: Efficient selectors and minimal repaints
6. **Maintainability**: Logical class naming and clear component boundaries