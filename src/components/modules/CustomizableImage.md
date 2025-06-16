# CustomizableImage Component Documentation

## Overview
`CustomizableImage` is a React component that provides enhanced image loading capabilities with blob URL management, loading states, error handling, and download functionality. It fetches images as blobs for better memory management and provides a clean interface for image display.

## Purpose
This component addresses common image loading challenges:
- Asynchronous image loading with visual feedback
- Memory-efficient blob URL management
- Built-in download functionality
- Graceful error handling
- Proper cleanup of resources

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `src` | string | Yes | The URL or path to the image to load |
| `alt` | string | No | Alternative text for the image |
| `width` | number/string | No | Width of the image |
| `height` | number/string | No | Height of the image |
| `style` | object | No | Custom styles to apply to the container |
| `onLoad` | function | No | Callback function called when image loads successfully |

## Key Features

### 1. Blob URL Management
- Fetches images as blobs for better memory control
- Creates object URLs for efficient rendering
- Automatically revokes URLs on cleanup

### 2. Loading States
```javascript
const [imageState, setImageState] = useState({
    blobUrl: '',
    loading: true,
    error: null
});
```

### 3. Lifecycle Management
- Proper cleanup with `URL.revokeObjectURL()`
- Prevents memory leaks from orphaned blob URLs
- Handles component unmounting gracefully

### 4. Download Functionality
- Built-in download button overlay
- Opens image in new tab for saving
- Positioned absolutely within image container

## Component Behavior

### Loading Process
1. Component mounts and initiates fetch request
2. Displays "Loading..." message during fetch
3. Converts response to blob
4. Creates object URL from blob
5. Updates state with blob URL
6. Calls onLoad callback if provided

### Error Handling
- Catches fetch errors gracefully
- Displays user-friendly error messages
- Preserves component structure during errors

### Memory Management
- Uses `mounted` flag to prevent state updates after unmount
- Revokes blob URLs in cleanup function
- Prevents memory leaks from abandoned requests

## Usage Examples

### Basic Usage
```javascript
<CustomizableImage 
  src="/path/to/image.jpg"
  alt="Description of image"
  width={400}
  height={300}
/>
```

### With Styling and Callback
```javascript
<CustomizableImage 
  src={imageUrl}
  alt="Product image"
  width="100%"
  height="auto"
  style={{ borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
  onLoad={() => console.log('Image loaded successfully')}
/>
```

## Styling

### Container Styling
- Applies custom styles from `style` prop
- Sets `position: 'relative'` for download button positioning

### Download Button Styling
```javascript
{
  position: 'absolute',
  bottom: '10px',
  right: '10px',
  backgroundColor: '#4CAF50',
  color: 'white',
  padding: '5px 10px',
  border: 'none',
  cursor: 'pointer'
}
```

### Image Styling
- Adds `cursor: 'pointer'` for interactive feel
- Respects width and height props

## State Management

### Image State Object
```javascript
{
  blobUrl: '',      // The object URL created from blob
  loading: true,    // Loading state indicator
  error: null       // Error message if fetch fails
}
```

### State Transitions
1. **Initial**: `{ blobUrl: '', loading: true, error: null }`
2. **Success**: `{ blobUrl: 'blob:...', loading: false, error: null }`
3. **Error**: `{ blobUrl: '', loading: false, error: 'Error message' }`

## Best Practices

### Performance Optimization
1. Avoid passing new `onLoad` functions on each render
2. Use stable image URLs when possible
3. Consider implementing image caching for frequently used images

### Error Handling
1. Provide meaningful alt text for accessibility
2. Consider fallback images for critical content
3. Log errors for debugging in production

### Memory Management
1. Component automatically handles cleanup
2. No manual intervention required for blob URLs
3. Safe for use in lists and dynamic content

## Dependencies
- React (useState, useEffect hooks)
- Browser Fetch API
- Browser URL API

## Browser Compatibility
- Requires support for Fetch API
- Requires support for Blob URLs
- Works in all modern browsers

## Common Use Cases
1. **Gallery Applications**: Loading and displaying multiple images efficiently
2. **Product Catalogs**: Showing product images with download options
3. **Document Viewers**: Displaying scanned documents or PDFs as images
4. **Profile Pictures**: Loading user avatars with proper error handling

## Limitations
1. No built-in image optimization
2. Downloads open in new tab (browser-dependent behavior)
3. No progress indication for large images
4. No automatic retry on failure

## Future Enhancements
- Add loading progress indicator
- Implement retry logic for failed loads
- Add image optimization options
- Support for lazy loading
- Implement proper download with filename