# promptGenerator.js - LLM Prompt Generation Utility

## Overview

`promptGenerator.js` creates structured prompts for the LLM service to retrieve factual precedence data. It maintains field-specific descriptors and generates context-aware prompts for different parameters.

## Architecture

### Core Components

1. **Field Descriptors Object**
   - Detailed metadata for each form field
   - Industry context and relevance
   - Units and usage information

2. **Prompt Generation Function**
   - Creates structured prompts based on field type
   - Includes context and requirements
   - Handles unknown fields gracefully

## Field Descriptor Structure

### Descriptor Properties
```javascript
{
  "fieldId": {
    description: "What this parameter represents",
    context: "How it's used in analysis",
    units: "Measurement units",
    industryRelevance: "Applicable industries/sectors"
  }
}
```

### Current Field Descriptors

#### Plant Lifetime (plantLifetimeAmount10)
- **Description**: Typical operational lifetime of industrial facilities
- **Context**: Used for depreciation calculations and long-term economic modeling
- **Units**: years
- **Industry Relevance**: All industrial sectors, especially capital-intensive industries

#### Initial Selling Price (initialSellingPriceAmount13)
- **Description**: Market price for the primary product
- **Context**: Critical revenue parameter impacting project economics
- **Units**: $/unit
- **Industry Relevance**: Product market dynamics, competitive landscape

## Prompt Generation

### Function: getPromptForField

**Parameters**:
- `itemId`: Field identifier
- `formContext`: Current form values and metadata

**Process**:
1. Looks up field descriptor
2. Falls back to generic descriptor if not found
3. Constructs structured prompt with requirements

### Prompt Template Structure

The generated prompt includes:

1. **Parameter Introduction**
   - Description and units
   - Industry relevance

2. **Context Section**
   - Usage in techno-economic analysis
   - Specific application context

3. **Requirements List**
   - Brief summary of importance and ranges
   - 3-5 real-world examples with sources
   - Recommended value with rationale
   - Variability notes if applicable

### Example Generated Prompt
```
Provide factual information about Typical operational lifetime of industrial facilities (years) in All industrial sectors, especially capital-intensive industries.

Context: This parameter is used for depreciation calculations and long-term economic modeling.

Include:
1. A brief summary of this parameter's importance and typical ranges
2. At least 3-5 real-world examples from industry with specific values, sources, and years
3. A recommended value based on current industry standards
4. A brief rationale for your recommendation

If the value is highly variable based on specific industries or applications, please indicate this and provide ranges for different contexts.
```

## Fallback Handling

### Unknown Fields
When a field ID is not found in descriptors:
```javascript
{
  description: formContext.label || "parameter value",
  context: "techno-economic analysis",
  units: "",
  industryRelevance: "industrial projects"
}
```

This ensures:
- Graceful handling of new parameters
- Basic context from form labels
- Generic but functional prompts

## Best Practices

1. **Descriptor Maintenance**
   - Add descriptors for all new form fields
   - Keep descriptions concise and accurate
   - Include relevant units and context

2. **Prompt Quality**
   - Be specific about requirements
   - Request sources and years for credibility
   - Ask for ranges when variability exists

3. **Extensibility**
   - Design prompts to handle various parameter types
   - Maintain consistent structure
   - Allow for field-specific customization

## Integration Points

- Used by llmService.js for prompt generation
- References form field identifiers
- Provides context for LLM responses

## Future Enhancements

1. **Dynamic Descriptors**
   - Load descriptors from configuration
   - Support multiple languages
   - Industry-specific variations

2. **Prompt Templates**
   - Multiple prompt templates for different use cases
   - A/B testing different prompt structures
   - User-customizable prompts

3. **Context Enhancement**
   - Include more form context in prompts
   - Reference related parameters
   - Industry-specific prompt variations

This utility ensures consistent, high-quality prompts that help the LLM provide accurate and relevant factual precedence data for the ModEcon Matrix System.