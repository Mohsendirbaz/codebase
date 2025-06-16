# ItemDetailsModal Component Documentation

## Component Overview
The ItemDetailsModal component provides a comprehensive view of library item details with tabbed navigation, editing capabilities, and sharing functionality. It serves as the primary interface for inspecting, editing, and sharing process economics configurations.

### Core Functionality
- **Tabbed interface**: Overview, Configuration Details, and Share & Export tabs
- **Edit mode**: In-place editing for personal library items
- **Configuration preview**: Visual representation of scaling groups
- **Sharing capabilities**: Links, code snippets, and export options
- **Metadata display**: Comprehensive configuration information

### Dependencies
- React (useState)
- @heroicons/react (UI icons)
- framer-motion (animation)
- ScalingGroupsPreview (child component)
- EditItemForm (child component)

## Architecture Summary

### Level 1: Component Entry and Props
```
ItemDetailsModal({ item, onClose, onImport, isPersonal })
├─ Modal overlay for item details
├─ Conditional editing for personal items
└─ Multi-tab content organization
```

### Level 2: State Management
```
State Architecture:
├─ activeTab: Current tab selection ('overview'|'details'|'share')
├─ isEditing: Edit mode toggle
└─ isCopied: Clipboard copy feedback state
```

### Level 3: Functional Architecture
```
Core Functions:
├─ Tab Navigation
│  ├─ Overview tab: General information and preview
│  ├─ Details tab: Configuration structure breakdown
│  └─ Share tab: Export and sharing options
├─ handleCopySnippet()
│  ├─ Generate code snippet
│  ├─ Copy to clipboard
│  └─ Temporary success feedback
├─ formatDate(dateString)
│  └─ Locale-aware date formatting
└─ Metric Calculations
   ├─ Group count calculation
   └─ Total items count
```

### Level 4: UI Structure
```
Modal Layout:
├─ Modal Overlay
└─ Modal Container (motion.div)
   ├─ Modal Header
   │  ├─ Title (dynamic based on edit mode)
   │  └─ Action Buttons
   │     ├─ Edit (personal items only)
   │     ├─ Import
   │     └─ Close
   ├─ Edit Mode
   │  └─ EditItemForm component
   └─ View Mode
      ├─ Tab Navigation
      └─ Tab Content
         ├─ Overview Tab
         ├─ Details Tab
         └─ Share Tab
```

### Level 5: Tab Content Architecture

#### Overview Tab
```
Overview Structure:
├─ Header Information
│  ├─ Category and type badges
│  └─ Description
├─ Details Grid
│  ├─ Configuration Details Section
│  │  ├─ Scaling Groups count
│  │  ├─ Total Items count
│  │  ├─ Creation date
│  │  ├─ Modification date (if exists)
│  │  └─ Creator name (if exists)
│  └─ Tags Section
│     └─ Tag cloud display
└─ Scaling Preview Section
   └─ ScalingGroupsPreview component
```

#### Details Tab
```
Details Structure:
├─ Configuration Summary
│  └─ Groups and items count
├─ Groups Breakdown
│  └─ For each scaling group:
│     ├─ Group header (name, default badge, item count)
│     └─ Items list (first 5 + overflow indicator)
└─ Metadata Table
   ├─ Version
   ├─ Export Date
   ├─ Description
   └─ Scaling Type
```

#### Share Tab
```
Share Structure:
├─ Share Section
│  ├─ Sharable Link
│  │  ├─ URL input field
│  │  └─ Copy button
│  └─ Code Snippet
│     ├─ Snippet preview
│     └─ Copy button with feedback
├─ Export Section
│  └─ Export format buttons
│     ├─ JSON export
│     └─ JavaScript export
└─ Configuration ID Section
   └─ Blockchain ID display
```

## Key Features

### 1. Dynamic Code Snippet Generation
Creates shareable code snippets with metadata:
```javascript
const configSnippet = `// ${item.name} - ${item.category}
// Created by: ${item.modeler || 'Unknown'}
// Generated from Process Economics Library

const scalingConfig = ${JSON.stringify(item.configuration, null, 2).slice(0, 500)}...
// Full configuration has ${item.configuration.currentState.scalingGroups.length} scaling groups`;
```

### 2. Animation Integration
Smooth modal entrance/exit animations:
```javascript
initial={{ opacity: 0, y: 50 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: 50 }}
```

### 3. Conditional Editing
Edit functionality restricted to personal library items:
```javascript
{isPersonal && (
  <button onClick={() => setIsEditing(true)}>
    <PencilIcon />
  </button>
)}
```

### 4. Intelligent Group Display
Shows first 5 items per group with overflow indicator:
```javascript
{group.items.slice(0, 5).map((groupItem, itemIndex) => (...))}
{group.items.length > 5 && (
  <div className="more-items">
    +{group.items.length - 5} more items
  </div>
)}
```

### 5. Copy Feedback System
Visual feedback for clipboard operations:
```javascript
{isCopied ? (
  <>
    <CheckIcon className="copy-icon" />
    Copied!
  </>
) : (
  <>
    <ClipboardIcon className="copy-icon" />
    Copy Snippet
  </>
)}
```

## Technical Implementation Details

### Metric Calculations
```javascript
const groupCount = item.configuration.currentState.scalingGroups.length;
const itemCount = item.configuration.currentState.scalingGroups.reduce(
  (sum, group) => sum + group.items.length, 
  0
);
```

### URL Generation
```javascript
const shareableUrl = `${window.location.origin}/process-economics/item/${item.id}`;
```

### Date Formatting
Locale-aware date formatting for international users:
```javascript
date.toLocaleDateString(undefined, { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});
```

## Usage Example
```jsx
<ItemDetailsModal 
  item={selectedItem}
  onClose={() => setSelectedItem(null)}
  onImport={(config) => handleImportConfiguration(config)}
  isPersonal={true}
/>
```

## CSS Classes and Styling
- `.modal-overlay`: Full-screen overlay
- `.item-details-modal`: Main modal container
- `.modal-header`: Header with title and actions
- `.modal-tabs`: Tab navigation
- `.modal-content`: Tab content container
- `.item-overview`: Overview tab layout
- `.configuration-details`: Details tab layout
- `.share-export-panel`: Share tab layout
- `.code-snippet`: Code display formatting

## Export Functionality
The component provides export capabilities in multiple formats:
- **JSON Export**: Raw configuration data
- **JavaScript Export**: ES6 module format
- **Code Snippet**: Abbreviated version for sharing

## Accessibility Considerations
- Button titles for screen readers
- Semantic HTML structure
- Keyboard navigation support
- Focus management within modal