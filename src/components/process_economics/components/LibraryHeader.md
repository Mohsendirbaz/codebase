# LibraryHeader Component Documentation

## Component Overview
The LibraryHeader component provides the top navigation bar for the Process Economics Library interface. It displays the library title and offers quick access to key actions including usage statistics, help documentation, tutorials, and the close function.

### Core Functionality
- **Library branding**: Display library logo and title
- **Usage statistics toggle**: Switch between library view and statistics
- **Help navigation**: Quick access to documentation
- **Tutorial access**: Link to tutorial resources
- **Close functionality**: Exit the library interface

### Dependencies
- React
- @heroicons/react (UI icons)

## Architecture Summary

### Level 1: Component Entry and Props
```
LibraryHeader({ onClose, onToggleUsageStats, showUsageStats })
├─ Header navigation interface
├─ Dynamic button states based on view
└─ External link navigation
```

### Level 2: Component Structure
```
Layout Architecture:
├─ Library Title Section
│  ├─ BookOpenIcon (logo)
│  └─ Library name text
└─ Actions Section
   ├─ Usage Stats Toggle
   ├─ Help Documentation Link
   ├─ Tutorials Link
   └─ Close Button
```

### Level 3: Button Configuration
```
Action Buttons:
├─ Usage Statistics Toggle
│  ├─ Icon: ChartBarIcon
│  ├─ Dynamic title based on showUsageStats
│  └─ Dynamic tooltip text
├─ Help Documentation
│  ├─ Icon: InformationCircleIcon
│  ├─ Opens: /help/process-economics-library
│  └─ Target: _blank (new tab)
├─ Tutorials
│  ├─ Icon: QuestionMarkCircleIcon
│  ├─ Opens: /tutorials/process-economics
│  └─ Target: _blank (new tab)
└─ Close
   ├─ Icon: XMarkIcon
   ├─ Special styling: .close class
   └─ Triggers: onClose callback
```

## Key Features

### 1. Dynamic Usage Stats Button
The usage statistics button changes its tooltip and title based on the current view:
```javascript
title={showUsageStats ? "Return to library" : "View usage statistics"}
```

### 2. Tooltip System
Each button includes a tooltip container with hover-activated tooltips:
```jsx
<button className="header-action-button tooltip-container">
  <Icon className="header-action-icon" />
  <span className="tooltip">{tooltipText}</span>
</button>
```

### 3. External Link Handling
Documentation and tutorial links open in new tabs for non-disruptive navigation:
```javascript
onClick={() => window.open('/help/process-economics-library', '_blank')}
```

### 4. Semantic Icon Usage
Icons are carefully chosen to represent their functions:
- 📊 ChartBarIcon: Statistics and analytics
- ℹ️ InformationCircleIcon: Help and documentation
- ❓ QuestionMarkCircleIcon: Tutorials and learning
- ✖️ XMarkIcon: Close and exit

## Technical Implementation Details

### Button Structure Pattern
Each action button follows a consistent structure:
1. Container with tooltip class
2. Click handler (callback or window.open)
3. Title attribute for accessibility
4. Icon component
5. Hidden tooltip span

### CSS Class Organization
- `.library-header`: Main container
- `.library-title`: Left-aligned branding section
- `.library-logo`: Icon styling
- `.library-name`: Title text styling
- `.library-actions`: Right-aligned button group
- `.header-action-button`: Base button styling
- `.tooltip-container`: Tooltip functionality
- `.header-action-icon`: Icon within buttons
- `.tooltip`: Hidden tooltip text
- `.close`: Special styling for close button

## Usage Example
```jsx
<LibraryHeader 
  onClose={() => setShowLibrary(false)}
  onToggleUsageStats={() => setShowStats(!showStats)}
  showUsageStats={showStats}
/>
```

## Accessibility Features
- Title attributes on all buttons
- Semantic button elements
- Clear visual hierarchy
- Keyboard navigation support
- Screen reader friendly tooltips

## Navigation Paths
The component provides navigation to:
- `/help/process-economics-library` - Help documentation
- `/tutorials/process-economics` - Tutorial resources

Both paths open in new browser tabs to maintain the user's current context.

## Styling Considerations
The header uses a consistent design language:
- Tooltip-based hover interactions
- Icon-first button design
- Special emphasis on the close button
- Responsive button spacing
- Clear visual separation between title and actions