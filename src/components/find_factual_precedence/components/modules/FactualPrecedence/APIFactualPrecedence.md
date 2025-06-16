# API Factual Precedence Component

## Overview
An enhanced API client component for fetching and managing factual precedence data. Features intelligent caching, error handling, data enhancement, and fallback mechanisms to ensure reliable data delivery.

## Architecture

### Component Structure
- **Type**: React Functional Component with API integration
- **Pattern**: Wrapper around FactualPrecedenceBase
- **Dependencies**: axios, FactualPrecedenceBase

### Key Features
1. **Session-based caching** (30-minute TTL)
2. **Data enhancement** and confidence scoring
3. **Intelligent fallbacks** for offline/error scenarios
4. **User feedback system** for data quality

## Core Functions

### getAPIPrecedenceData
Main data fetching function with multi-layer resilience:

```javascript
async (itemId, formValue) => {
  // 1. Check cache (30-min TTL)
  // 2. API call with timeout
  // 3. Enhance data
  // 4. Cache results
  // 5. Fallback strategies
}
```

**Caching Strategy**:
- Key: `factual-precedence-${itemId}-${contextHash}`
- Storage: sessionStorage
- TTL: 30 minutes
- Stale cache as emergency fallback

### enhancePrecedenceData
Data enrichment pipeline:

1. **Sorting**: Examples by year (recent first)
2. **Confidence Level**: Calculated if missing
3. **Contextual Notes**: Added when values deviate >30%
4. **Structure Preservation**: Non-mutating operations

### calculateConfidenceLevel
Confidence scoring algorithm:

| Level | Criteria |
|-------|----------|
| High | ≥2 recent examples, ≥3 unique sources |
| Medium-High | ≥1 recent example, ≥2 unique sources |
| Medium | 3+ examples |
| Low | <3 examples or no data |

**Factors**:
- Example count
- Recency (within 5 years)
- Source diversity

### generateFallbackData
Context-aware fallback generation:

1. **Lifetime Parameters**:
   - Default: 25 years
   - Range: 20-40 years
   - Industry standard references

2. **Price Parameters**:
   - Market average baseline
   - Premium segment comparison
   - Competitive positioning

3. **Generic Fallback**:
   - Consultation guidance
   - Low confidence indicator

## API Integration

### Endpoint Configuration
```javascript
POST http://localhost:3060/api/factual-precedence
{
  itemId: string,
  formContext: {
    label: string,
    value: string,
    type: string,
    remarks: string
  }
}
```

### Request Features
- **Timeout**: 8 seconds
- **Headers**: JSON content type
- **Error Recovery**: Multiple fallback layers

### Response Processing
1. Success validation
2. Data enhancement
3. Cache storage
4. Error fallback chain

## Feedback System

### submitFeedback Function
```javascript
POST http://localhost:3060/api/factual-precedence/feedback
{
  itemId: string,
  feedbackType: string,
  comment: string,
  timestamp: ISO string
}
```

### Feedback Flow
1. User submits feedback
2. API call with timestamp
3. Status message display
4. Auto-clear after 3 seconds

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| All Base Props | - | Passed to FactualPrecedenceBase |
| getPrecedenceData | function | Injected data fetcher |
| onFeedbackSubmit | function | Feedback handler |
| feedbackStatus | object | Feedback state |

## Data Enhancement Details

### Value Deviation Analysis
```javascript
if (percentDiff > 30) {
  // Add contextual warning
  // Higher: Review assumptions
  // Lower: Ensure realistic conditions
}
```

### Example Prioritization
- Sort by year (descending)
- Recent data preferred
- Source diversity valued

## Error Handling

### Error Cascade
1. **Primary**: API call with timeout
2. **Secondary**: Stale cache usage
3. **Tertiary**: Generated fallback
4. **Final**: Error propagation

### Cache Management
- Session-based storage
- Graceful degradation
- Parse error recovery
- Fallback to stale data

## Performance Optimizations

### Caching Benefits
- Reduced API calls
- Instant repeat access
- Network failure resilience
- User experience consistency

### Data Processing
- Minimal transformations
- Non-blocking operations
- Efficient sorting
- Lazy enhancement

## Usage Example

```jsx
<APIFactualPrecedence
  show={true}
  position={{ top: 100, left: 200 }}
  onClose={handleClose}
  formValues={formData}
  id="Amount1_investment"
  handleInputChange={updateFormValue}
/>
```

## Best Practices

### API Integration
- Timeout configuration
- Error boundaries
- Graceful degradation
- User feedback

### Data Quality
- Confidence scoring
- Source attribution
- Recency prioritization
- User validation

### Performance
- Session caching
- Minimal re-fetches
- Efficient updates
- Resource cleanup