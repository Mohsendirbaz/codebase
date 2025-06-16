# Factual Precedence Index Module

## Overview
Central routing component that dynamically selects the appropriate factual precedence implementation based on environment configuration. Provides a unified interface while allowing flexible backend selection.

## Architecture

### Component Structure
- **Type**: React Functional Component (Router)
- **Pattern**: Strategy pattern implementation
- **Purpose**: Implementation selection and routing

### Available Implementations
1. **Local**: Pre-populated offline data
2. **API**: External API integration
3. **Filtered**: Advanced filtering system

## Configuration

### Environment Variable
```bash
REACT_APP_FACTUAL_PRECEDENCE_TYPE=api|filtered|local
```

### Default Behavior
- Default: `'local'`
- Fallback: LocalFactualPrecedence
- Runtime switching: Not supported

## Implementation Selection

### Switch Logic
```javascript
switch (implementationType) {
  case 'api':
    return <APIFactualPrecedence {...props} />;
  case 'filtered':
    return <FilteredFactualPrecedence {...props} />;
  case 'local':
  default:
    return <LocalFactualPrecedence {...props} />;
}
```

### Selection Criteria

| Type | Use Case | Requirements |
|------|----------|--------------|
| `local` | Development, Offline | None |
| `api` | Production, Live data | API endpoint |
| `filtered` | Advanced features | API + Filters |

## Component Characteristics

### LocalFactualPrecedence
- **Data Source**: Static files
- **Performance**: Fastest
- **Features**: Basic
- **Dependencies**: None

### APIFactualPrecedence
- **Data Source**: HTTP API
- **Performance**: Network-dependent
- **Features**: Enhanced caching, feedback
- **Dependencies**: API server

### FilteredFactualPrecedence
- **Data Source**: Multiple
- **Performance**: Variable
- **Features**: Advanced filtering, AI suggestions
- **Dependencies**: Complex data structures

## Usage Pattern

### Basic Implementation
```jsx
import FactualPrecedence from './components/FactualPrecedence';

<FactualPrecedence
  show={showPopup}
  position={position}
  onClose={handleClose}
  formValues={formData}
  id={parameterId}
  handleInputChange={updateValue}
/>
```

### Environment Setup
```bash
# Development
REACT_APP_FACTUAL_PRECEDENCE_TYPE=local

# Staging
REACT_APP_FACTUAL_PRECEDENCE_TYPE=api

# Production
REACT_APP_FACTUAL_PRECEDENCE_TYPE=filtered
```

## Props Interface

All implementations receive the same props:

| Prop | Type | Description |
|------|------|-------------|
| `show` | boolean | Visibility control |
| `position` | object | UI positioning |
| `onClose` | function | Close handler |
| `formValues` | object | Form data |
| `id` | string | Parameter ID |
| `handleInputChange` | function | Value updater |

## Architecture Benefits

### 1. Flexibility
- Easy implementation switching
- No code changes required
- Environment-based control

### 2. Consistency
- Unified interface
- Same props structure
- Predictable behavior

### 3. Maintainability
- Single entry point
- Clear separation
- Easy testing

## Development Workflow

### Adding New Implementation
1. Create new component
2. Import in index
3. Add switch case
4. Document behavior

### Testing Different Modes
```bash
# Test local mode
REACT_APP_FACTUAL_PRECEDENCE_TYPE=local npm start

# Test API mode
REACT_APP_FACTUAL_PRECEDENCE_TYPE=api npm start

# Test filtered mode
REACT_APP_FACTUAL_PRECEDENCE_TYPE=filtered npm start
```

## Best Practices

### Environment Management
- Use `.env.local` for development
- `.env.production` for production
- Never commit sensitive configs

### Performance Considerations
- Local: No optimization needed
- API: Implement caching
- Filtered: Optimize queries

### Error Handling
- Graceful fallback to local
- User-friendly messages
- Logging for debugging

## Future Extensions

### Potential Implementations
- GraphQL variant
- WebSocket real-time
- Blockchain verified
- ML-enhanced predictions

### Dynamic Selection
```javascript
// Future: Runtime switching
const [implType, setImplType] = useState('local');

// User preference
localStorage.setItem('precedenceType', 'api');
```