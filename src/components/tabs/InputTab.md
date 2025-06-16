# Input Tab Component

## Overview
A comprehensive input form interface with sub-tab navigation for different configuration sections in the ModEcon system. Manages multiple categories of financial parameters through a unified interface.

## Architecture

### Component Structure
- **Type**: React Functional Component
- **Purpose**: Multi-section form management
- **Pattern**: Tab-based navigation with conditional rendering

### State Management
- `activeSubTab`: Current sub-tab selection
- Initial state: 'ProjectConfig'

## Core Features

### 1. Sub-Tab Navigation
Nine configuration sections:
1. **Project Configuration** (Amount1)
2. **Loan Configuration** (Amount2)
3. **Rates & Fixed Costs** (Amount3)
4. **Process Quantities** (Amount4)
5. **Process Costs** (Amount5)
6. **Revenue Quantities** (Amount6)
7. **Revenue Prices** (Amount7)
8. **+ Scaling** (Amount8)
9. **Fixed Revenue Components** (Amount9)

### 2. Dynamic Form Rendering
- Conditional rendering based on active tab
- Filtered content by keyword
- Appropriate toggle controls per section

### 3. GeneralFormConfig Integration
- Consistent form interface
- Category-specific filtering
- State management pass-through

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `formValues` | object | Form data values |
| `handleInputChange` | function | Input change handler |
| `version` | string | Current version |
| `setVersion` | function | Version setter |
| `S` | object | S state values |
| `setS` | function | S state setter |
| `V` | object | V toggle states |
| `setV` | function | V state setter |
| `R` | object | R toggle states |
| `setR` | function | R state setter |
| `toggleV` | function | V toggle handler |
| `toggleR` | function | R toggle handler |
| `F` | object | F toggle states |
| `toggleF` | function | F toggle handler |

## UI Structure

### Layout Components
1. **Container**: `.form-container`
2. **Navigation**: `.sub-tab-buttons`
3. **Content Area**: `.form-content`

### Sub-Tab Buttons
- Multi-line labels with line breaks
- Active state indication
- Click handlers for navigation

## Configuration Mapping

### Amount Categories
| Tab | Filter Keyword | Description | Special Props |
|-----|----------------|-------------|---------------|
| ProjectConfig | Amount1 | Basic project settings | S only |
| LoanConfig | Amount2 | Loan parameters | S only |
| RatesConfig | Amount3 | Rates and fixed costs | F, S |
| Process1Config | Amount4 | Process quantities | V, R, S |
| Process2Config | Amount5 | Process costs | V, R, S |
| Revenue1Config | Amount6 | Revenue quantities | V, R, S |
| Revenue2Config | Amount7 | Revenue prices | V, R, S |
| Scaling | Amount8 | Scaling parameters | V, R, S |
| FixedRevenueConfig | Amount9 | Fixed revenues | V, R, S |

## State Flow

### Toggle System Distribution
- **S State**: All tabs
- **F State**: RatesConfig only
- **V/R States**: Process and Revenue tabs

### Default Values
- S defaults to empty object: `S || {}`
- Prevents undefined errors
- Ensures consistent behavior

## CSS Architecture

### Component Classes
- `.form-container`: Root wrapper
- `.sub-tab-buttons`: Navigation container
- `.sub-tab-button`: Individual buttons
- `.active`: Active tab indicator
- `.form-content`: Content wrapper

### Button Styling
- Multi-line text support with `<br />`
- Active state differentiation
- Consistent spacing

## Rendering Logic

### Conditional Content
```javascript
{activeSubTab === 'ProjectConfig' && (
    <GeneralFormConfig
        filterKeyword="Amount1"
        // Props specific to this section
    />
)}
```

### Prop Passing Pattern
- Common props for all configs
- Section-specific toggles
- Consistent interface

## Best Practices

### Performance
- Single active component render
- Minimal re-renders on tab switch
- Efficient state updates

### User Experience
- Clear section labels
- Logical grouping
- Consistent navigation

### Maintainability
- Centralized form component
- Clear section mapping
- Extensible structure