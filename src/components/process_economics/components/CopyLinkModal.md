# CopyLinkModal Component Documentation

## Overview

CopyLinkModal is a sharing interface component that provides users with options to share process economics configurations via copyable links or email. It features a clean modal interface with animation support and clipboard integration.

## Architecture

### Component Structure
```
Modal Overlay
└── Modal Container (animated)
    ├── Header (title + close button)
    └── Content
        ├── Item Information
        ├── Share Link Section
        ├── Share Options (Email)
        └── Blockchain ID Display
```

## Component Props

```javascript
{
  item: Object,        // Configuration item to share
  onClose: Function,   // Handler to close the modal
  sharableLink: String // Generated sharable URL
}
```

## Core Features

### 1. Clipboard Integration
- One-click copy functionality
- Visual feedback with icon change
- Temporary "Copied!" confirmation

### 2. Email Sharing
- Pre-formatted email with item details
- Includes name, category, description, and link
- Opens default email client

### 3. Animated Interface
- Framer Motion animations for smooth transitions
- Scale and opacity effects
- Professional modal appearance

## Key Functions

### `handleCopyLink()`
```javascript
const handleCopyLink = () => {
  navigator.clipboard.writeText(sharableLink);
  setIsCopied(true);
  setTimeout(() => setIsCopied(false), 2000);
};
```
- Uses modern Clipboard API
- Provides temporary visual feedback
- Auto-resets after 2 seconds

### `handleEmailShare()`
```javascript
const handleEmailShare = () => {
  const subject = encodeURIComponent(`Check out this Process Economics configuration: ${item.name}`);
  const body = encodeURIComponent(
    `I found this process economics configuration that might be useful:\n\n` +
    `${item.name}\n` +
    `Category: ${item.category}\n` +
    `Description: ${item.description || 'No description provided'}\n\n` +
    `View it here: ${sharableLink}`
  );
  
  window.open(`mailto:?subject=${subject}&body=${body}`);
};
```
- Properly encodes email content
- Includes comprehensive item details
- Fallback for missing description

## UI Components

### Modal Elements
- **Overlay**: Semi-transparent background
- **Header**: Title and close button
- **Item Info**: Name, category, and scaling groups count
- **Link Section**: Input field with copy button
- **Share Options**: Email button
- **Blockchain ID**: Unique identifier display

### Visual States
- **Default**: Normal copy button state
- **Copied**: Checkmark icon with success message
- **Hover**: Interactive feedback on buttons

## Integration Points

### External Dependencies
- `@heroicons/react`: Icon components
- `framer-motion`: Animation library
- Browser APIs: Clipboard, mailto

### Data Requirements
```javascript
item: {
  id: String,
  name: String,
  category: String,
  description: String (optional),
  configuration: {
    currentState: {
      scalingGroups: Array
    }
  }
}
```

## CSS Classes

```css
.modal-overlay              // Full-screen overlay
.copy-link-modal           // Modal container
.modal-header              // Header section
.modal-title               // Modal title text
.modal-close-button        // Close button
.close-icon                // X icon
.modal-content             // Main content area
.share-item-info           // Item details section
.share-item-name           // Item name
.share-item-meta           // Metadata container
.share-item-category       // Category badge
.share-item-complexity     // Scaling groups count
.share-link-section        // Link sharing area
.share-link-header         // Section header
.share-link-container      // Input and button container
.share-link-input-container // Input wrapper
.link-icon                 // Link icon
.share-link-input          // URL input field
.copy-link-button          // Copy button
.copy-link-button.copied   // Copied state
.copy-icon                 // Clipboard/check icon
.share-options             // Additional sharing methods
.share-option-button       // Share method button
.share-option-button.email // Email specific styling
.share-option-icon         // Icon for share method
.blockchain-id-section     // Blockchain ID area
.blockchain-id-label       // ID label
.blockchain-id-value       // ID value display
```

## Animation Configuration

```javascript
motion.div {
  initial: { opacity: 0, scale: 0.9 }
  animate: { opacity: 1, scale: 1 }
  exit: { opacity: 0, scale: 0.9 }
}
```

## Best Practices

### Accessibility
- Proper button labels for screen readers
- Keyboard navigation support
- Focus management on modal open/close
- Click-outside-to-close functionality

### User Experience
- Clear visual feedback for actions
- Intuitive copy functionality
- Pre-selected text on input click
- Temporary success indicators

### Error Handling
- Graceful fallback if clipboard API unavailable
- Handle missing item properties
- Ensure email client compatibility

## Browser Compatibility

- **Clipboard API**: Modern browsers (Chrome 63+, Firefox 53+)
- **Mailto**: Universal support
- **Framer Motion**: Requires React 16.8+

## Future Enhancements

1. **Additional Sharing Methods**
   - Social media integration
   - QR code generation
   - Direct messaging apps

2. **Enhanced Features**
   - Custom message editing
   - Link expiration settings
   - Access control options

3. **Analytics**
   - Track share methods used
   - Monitor link clicks
   - Measure engagement rates