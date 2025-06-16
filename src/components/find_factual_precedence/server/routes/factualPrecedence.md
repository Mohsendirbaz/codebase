# factualPrecedence.js - Factual Precedence API Routes

## Overview

`factualPrecedence.js` defines the Express.js API routes for the factual precedence system. It handles requests for precedence data, implements caching, and provides fallback mechanisms for LLM service failures.

## Architecture

### Environment Detection
The module includes smart environment detection to handle both server and client contexts:
- Server environment: Loads Express.js and creates actual routes
- Client environment: Provides mock router to prevent bundling errors

### Core Components
1. **Router Setup**: Conditional Express router initialization
2. **Caching System**: In-memory cache with 24-hour TTL
3. **API Endpoints**: Three main routes for precedence operations
4. **Error Handling**: Comprehensive error handling with fallbacks

## API Endpoints

### 1. Get Factual Precedence
**Endpoint**: `POST /api/factual-precedence`

**Request Body**:
```json
{
  "itemId": "parameterIdAmount##",
  "formContext": {
    // Current form values and context
  }
}
```

**Response**:
```json
{
  "success": true,
  "factualPrecedence": {
    // Precedence data object
  },
  "note": "Optional message about data source"
}
```

**Features**:
- Cache checking with 24-hour expiration
- LLM service integration with fallback
- Returns local data if LLM service fails

### 2. Get Filtered Factual Precedence
**Endpoint**: `POST /api/factual-precedence/filtered`

**Request Body**:
```json
{
  "itemId": "parameterIdAmount##",
  "formContext": {
    // Current form values
  },
  "filters": {
    "industryType": ["chemical", "energy"],
    "scale": ["medium"],
    // Other filter categories
  }
}
```

**Response**:
```json
{
  "success": true,
  "factualPrecedence": {
    // Filtered precedence data
  }
}
```

**Features**:
- Applies multiple filter criteria
- Separate cache entries for different filter combinations
- No fallback mechanism (requires LLM service)

### 3. Submit Feedback
**Endpoint**: `POST /api/factual-precedence/feedback`

**Request Body**:
```json
{
  "itemId": "parameterIdAmount##",
  "feedbackType": "helpful|not_helpful|inaccurate",
  "comment": "User feedback text",
  "timestamp": 1234567890
}
```

**Response**:
```json
{
  "success": true
}
```

**Status**: Currently logs feedback (TODO: implement storage)

## Caching Strategy

### Cache Implementation
```javascript
const cache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

### Cache Key Generation
- Basic precedence: `${itemId}-${JSON.stringify(formContext)}`
- Filtered precedence: `${itemId}-${formContext}-${filters}`

### Cache Benefits
- Reduces LLM API calls
- Improves response times
- Provides consistent data within 24-hour windows

## Error Handling

### LLM Service Failures
1. Attempts LLM service call
2. On failure, checks for local fallback data
3. Returns fallback with notification
4. If no fallback available, returns error

### General Error Handling
- Logs errors to console
- Returns 500 status with error message
- Provides user-friendly error messages

## Integration Points

### Dependencies
- Express.js (server-side only)
- LLM Service module
- Factual precedence data module

### Service Integration
```javascript
const { getLLMFactualPrecedence, getLLMFilteredFactualPrecedence } = require('../services/llmService');
const { factualPrecedenceData } = require('../data/factualPrecedenceData');
```

## Best Practices

1. **Error Resilience**
   - Always provide fallback options
   - Log errors for debugging
   - Return meaningful error messages

2. **Performance**
   - Use caching to reduce external API calls
   - Implement appropriate cache expiration
   - Consider cache size limits for production

3. **Security**
   - Validate input parameters
   - Sanitize error messages
   - Implement rate limiting (TODO)

## Future Enhancements

1. **Feedback Storage**
   - Implement database storage for feedback
   - Create feedback analytics dashboard
   - Use feedback to improve recommendations

2. **Cache Improvements**
   - Implement Redis for distributed caching
   - Add cache size management
   - Implement cache warming strategies

3. **API Enhancements**
   - Add authentication/authorization
   - Implement rate limiting
   - Add request validation middleware

This module serves as the API gateway for the factual precedence system, providing reliable access to precedence data with built-in resilience and performance optimization.