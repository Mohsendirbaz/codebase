# llmService.js - LLM Integration Service

## Overview

`llmService.js` provides the integration layer between the factual precedence system and OpenAI's GPT-4 API. It handles rate limiting, prompt formatting, and response parsing for intelligent factual data retrieval.

## Architecture

### Core Components

1. **Rate Limiter**
   - Queue-based rate limiting system
   - Prevents API rate limit violations
   - Processes requests sequentially with 1-second delays

2. **LLM Functions**
   - Basic factual precedence retrieval
   - Filtered factual precedence with context-aware filtering
   - JSON response formatting

3. **Error Handling**
   - Comprehensive error catching
   - User-friendly error messages
   - Logging for debugging

## Rate Limiter Implementation

### Structure
```javascript
const rateLimiter = {
  queue: [],         // Request queue
  processing: false, // Processing flag
  
  async add(fn, ...args) {
    // Adds function to queue and returns promise
  },
  
  async processQueue() {
    // Processes queued requests with delays
  }
}
```

### Features
- **Sequential Processing**: Ensures requests are processed one at a time
- **Automatic Delay**: 1-second delay between requests
- **Promise-based**: Returns promises for async handling
- **Error Propagation**: Properly propagates errors to callers

## API Functions

### 1. getLLMFactualPrecedence

**Purpose**: Retrieves general factual precedence data from GPT-4

**Parameters**:
- `itemId`: Parameter identifier (e.g., "plantLifetimeAmount10")
- `formContext`: Current form values and context

**Process**:
1. Generates prompt using promptGenerator
2. Calls GPT-4 API with structured system prompt
3. Parses JSON response
4. Returns formatted precedence data

**GPT-4 Configuration**:
- Model: `gpt-4-turbo`
- Temperature: `0.2` (low for factual consistency)
- Response format: JSON object

### 2. getLLMFilteredFactualPrecedence

**Purpose**: Retrieves filtered factual precedence based on specific criteria

**Parameters**:
- `itemId`: Parameter identifier
- `formContext`: Current form values
- `filters`: Object containing filter categories and selections

**Filter Categories Supported**:
- Industry Type (chemical, energy, manufacturing, etc.)
- Technology Level (conventional, emerging, novel)
- Scale (small, medium, large)
- Region (North America, Europe, Asia-Pacific, global)
- Time Period (current, recent, historical)
- Regulatory Framework (stringent, moderate, minimal)

**Process**:
1. Converts filter IDs to human-readable labels
2. Builds filter context description
3. Enhances base prompt with filter requirements
4. Calls GPT-4 with filtered context
5. Returns filtered results

## Response Format

### Expected JSON Structure
```json
{
  "summary": "Brief overview of the parameter",
  "examples": [
    {
      "entity": "Source name",
      "value": 25.5,
      "unit": "years",
      "year": 2023,
      "source": "Industry Report 2023"
    }
  ],
  "recommendedValue": 25,
  "recommendationRationale": "Based on industry averages...",
  "sources": [
    "Full citation 1",
    "Full citation 2"
  ]
}
```

## System Prompts

### Base System Prompt
Instructs GPT-4 to:
- Act as a factual database for techno-economic analysis
- Provide accurate, sourced information
- Focus on industrial parameters and economic factors
- Return structured JSON responses

### Enhanced Filtering
For filtered requests, adds:
- Specific focus on matching criteria
- Context-aware recommendations
- Filtered examples relevant to selections

## Error Handling

### Error Types
1. **API Errors**: Network or authentication failures
2. **Parsing Errors**: Invalid JSON responses
3. **Rate Limit Errors**: Too many requests

### Error Response
```javascript
throw new Error('Failed to retrieve data from LLM service');
```

## Configuration Requirements

### Environment Variables
- `OPENAI_API_KEY`: Required for API authentication

### API Headers
```javascript
{
  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  'Content-Type': 'application/json'
}
```

## Best Practices

1. **Rate Limiting**
   - Always use the rate limiter for API calls
   - Don't bypass the queue system
   - Monitor queue length in production

2. **Prompt Engineering**
   - Keep prompts clear and specific
   - Use structured response formats
   - Maintain low temperature for consistency

3. **Error Handling**
   - Always provide fallback options
   - Log errors for debugging
   - Return meaningful error messages

## Integration Points

- Used by factualPrecedence routes
- Depends on promptGenerator for prompt creation
- Requires OpenAI API access

## Performance Considerations

- 1-second minimum delay between requests
- Queue processing prevents request flooding
- JSON parsing adds minimal overhead
- Consider caching at the route level

This service provides intelligent, context-aware factual data retrieval while maintaining API rate limits and ensuring reliable operation.