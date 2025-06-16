# Matrix Value Editor Component

## Overview
A specialized editor component for modifying matrix values within the ModEcon system. Provides version and zone selection capabilities with inheritance tracking and type-aware input handling.

## Architecture

### Component Structure
- **Type**: React Functional Component
- **Purpose**: Matrix parameter value editing
- **Pattern**: Controlled component with local state

### State Management
- `selectedVersion`: Current version selection
- `selectedZone`: Current zone selection
- `currentValue`: Active value being edited
- `editing`: Edit mode toggle

## Core Features

### 1. Version/Zone Selection
- **Dynamic Dropdowns**: Populated from props
- **Label Display**: Uses metadata for friendly names
- **Active Defaults**: Initializes with active selections

### 2. Value Editing
- **Type-Aware Input**: Number vs text input types
- **Parse Logic**: Automatic float parsing for numbers
- **Empty Handling**: Clear empty value display

### 3. Inheritance Display
- **Source Tracking**: Shows inheritance source
- **Percentage Display**: Inheritance percentage
- **Conditional Rendering**: Only when inherited

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `paramId` | string | Parameter identifier |
| `formMatrix` | object | Complete form matrix data |
| `versions` | object | Version configuration |
| `zones` | object | Zone configuration |
| `updateParameterValue` | function | Value update callback |
| `onClose` | function | Editor close callback |

## Data Structures

### Parameter Object
```javascript
{
  label: "Parameter Name",
  type: "number" | "text",
  matrix: { [version]: { [zone]: value } },
  inheritance: { [version]: { source, percentage } }
}
```

### Versions/Zones Objects
```javascript
{
  active: "current_id",
  list: ["id1", "id2"],
  metadata: { [id]: { label: "Display Name" } }
}
```

## UI Components

### Layout Sections
1. **Header**
   - Parameter label display
   - Close button (×)

2. **Selectors**
   - Version dropdown
   - Zone dropdown

3. **Value Editor**
   - View mode with edit button
   - Edit mode with save/cancel

4. **Inheritance Info**
   - Source version display
   - Percentage indicator

## User Interactions

### Edit Flow
1. Click "Edit" button → Enter edit mode
2. Modify value in input field
3. Click "Save" → Update and exit edit mode
4. Click "Cancel" → Revert and exit edit mode

### Selection Changes
- Version change → Update current value
- Zone change → Update current value
- Automatic value synchronization

## Value Processing

### Type Handling
- **Number Type**: Parse as float, default to 0 if NaN
- **Text Type**: Store as string without parsing
- **Empty Values**: Display "No value set"

### Update Mechanism
```javascript
updateParameterValue(paramId, processedValue, selectedVersion, selectedZone)
```

## Styling Classes

### Component Classes
- `.matrix-value-editor`: Root container
- `.editor-header`: Title and close button
- `.editor-selectors`: Version/zone dropdowns
- `.editor-value`: Value display/edit area
- `.edit-mode`: Active editing interface
- `.view-mode`: Read-only display
- `.inheritance-info`: Inheritance details

### State Classes
- `.current-value`: Value display
- `.empty-value`: No value indicator
- `.edit-buttons`: Save/cancel actions

## Best Practices

### Performance
- Memoize parameter lookup
- Minimize re-renders on selection
- Efficient value parsing

### User Experience
- Auto-focus on edit input
- Clear empty state messaging
- Responsive button layout

### Data Integrity
- Type validation before save
- Proper number parsing
- Null/undefined handling