# Results Tab Component

## Overview
A versatile results display component that renders different types of content based on the specified tab type. Supports CSV tables, HTML content, and plot visualizations with tabbed sub-navigation.

## Architecture

### Component Structure
- **Type**: React Functional Component
- **Purpose**: Multi-format results display
- **Pattern**: Conditional rendering with nested tabs

### Content Types
1. **Case1**: Cash Flow Analysis (CSV tables)
2. **Case2**: Dynamic SubPlots (HTML content)
3. **Case3**: Plots (HTML-based visualizations)

## Core Features

### 1. Dynamic Content Rendering
- Tab type-based content selection
- Loading state management
- Empty state handling

### 2. Nested Tab Navigation
- Sub-tabs for multiple files/plots
- Dynamic tab generation
- Consistent interface across types

### 3. Content Display Methods
- **CSV**: CustomizableTable component
- **HTML**: dangerouslySetInnerHTML rendering
- **Plots**: HTML-based plot rendering

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabType` | string | - | Type of tab ('Case1', 'Case2', 'Case3') |
| `htmlContent` | array | [] | HTML content for Case2 |
| `plotContent` | array | [] | Plot content for Case3 |
| `csvFiles` | array | [] | CSV data for Case1 |
| `yearColumnsToHighlight` | array | [] | Columns to highlight in tables |
| `isLoading` | boolean | false | Loading state indicator |

## Content Rendering

### Case1: CSV Tables
```javascript
<CustomizableTable 
    data={file.data} 
    fileName={file.name} 
    yearColumnsToHighlight={yearColumnsToHighlight}
/>
```
- Uses CustomizableTable component
- Supports column highlighting
- File name display

### Case2: Dynamic SubPlots
```javascript
<div 
    className="html-content"
    dangerouslySetInnerHTML={{ __html: htmlContent.join('') }}
/>
```
- Direct HTML rendering
- Multiple album support
- Combined content display

### Case3: Plot Visualizations
```javascript
<div 
    className="plot-content"
    dangerouslySetInnerHTML={{ __html: plotContent.join('') }}
/>
```
- HTML-based plot rendering
- Multiple plot support
- Dynamic tab generation

## UI Components

### Loading States
- Specific messages per content type
- Consistent loading indicator
- User-friendly feedback

### Empty States
- Clear messaging for no data
- Type-specific messages
- Fallback rendering

### Tab Structure
- Dynamic tab labels
- Index-based or named tabs
- Consistent tab panel rendering

## CSS Architecture

### Container Classes
- `.results-tab-container`: Main wrapper
- `.csv-container`: CSV content wrapper
- `.html-container`: HTML content wrapper
- `.plot-container`: Plot content wrapper

### Content Classes
- `.loading-indicator`: Loading state
- `.no-data-message`: Empty state
- `.html-content`: HTML render area
- `.plot-content`: Plot render area

### Style Imports
- `HCSS.css`: General styles
- `CustomizableTable.css`: Table-specific styles

## Rendering Logic

### Content Switch
```javascript
switch (tabType) {
    case 'Case1': return renderCase1Content();
    case 'Case2': return renderCase2Content();
    case 'Case3': return renderCase3Content();
    default: return <div>Please select a valid tab type.</div>;
}
```

### Tab Generation Pattern
- Map over content arrays
- Generate tab labels dynamically
- Create corresponding panels

## Best Practices

### Security Considerations
- dangerouslySetInnerHTML usage
- Content should be sanitized
- Trust source validation

### Performance
- Conditional rendering
- Lazy content loading
- Minimal re-renders

### User Experience
- Clear loading states
- Informative empty states
- Consistent navigation

## Integration Points

### CustomizableTable
- Handles CSV data display
- Column highlighting support
- File name context

### React Tabs
- Nested tab functionality
- Controlled tab state
- Flexible tab content

## Error Handling
- Default case for invalid tab types
- Empty array defaults
- Loading state management