# keyPointsMapping.js - Key Points Category Mapping

## Overview

`keyPointsMapping.js` defines the categorization system for contextual filters in the factual precedence system. It provides structured categories and mappings that help users filter and contextualize precedence data based on various business dimensions.

## Architecture

### Category Constants
The module defines six primary category types used throughout the factual precedence system:
- `INDUSTRY_TYPE`: Industrial sector classification
- `TECHNOLOGY`: Technology maturity levels
- `SCALE`: Project size categories
- `REGION`: Geographic regions
- `TIME_PERIOD`: Data recency classifications
- `REGULATORY_FRAMEWORK`: Regulatory environment types

### Data Structure Components
1. **Category Constants Object**: String constants for type-safe category references
2. **Key Points Data**: Detailed options for each category
3. **Form Value Relevance Mapping**: Links form parameters to relevant categories

## Core Features

### Category Definitions

#### Industry Types
- Chemical Processing
- Energy Generation
- Manufacturing
- Pharmaceuticals
- Renewable Energy

#### Technology Levels
- **Conventional**: Established, proven technologies
- **Emerging**: Technologies in growth phase
- **Novel/Experimental**: Cutting-edge, unproven technologies

#### Scale Classifications
- **Small Scale**: Projects under $100M USD
- **Medium Scale**: Projects between $100M-1B USD
- **Large Scale**: Projects exceeding $1B USD

#### Geographic Regions
- North America
- Europe
- Asia-Pacific
- Global Average

#### Time Periods
- **Current**: Data from last 2 years
- **Recent**: Data from 3-5 years ago
- **Historical**: Data older than 5 years

#### Regulatory Frameworks
- **Stringent**: Highly regulated environments
- **Moderate**: Standard regulatory oversight
- **Minimal**: Light regulatory requirements

## Parameter Relevance Mapping

### Plant Lifetime (plantLifetimeAmount10)
Relevant categories:
- Industry Type (different industries have different asset lifespans)
- Technology (maturity affects expected lifetime)
- Regulatory Framework (regulations impact operational requirements)

### Initial Selling Price (initialSellingPriceAmount13)
Relevant categories:
- Industry Type (sector-specific pricing norms)
- Region (geographic price variations)
- Time Period (price trends over time)

## Data Format

### Key Points Structure
```javascript
{
  categoryName: [
    {
      id: 'unique_identifier',
      label: 'Display Name'
    }
  ]
}
```

### Relevance Mapping Structure
```javascript
{
  "formParameterId": [
    keyPointCategories.CATEGORY1,
    keyPointCategories.CATEGORY2
  ]
}
```

## Usage Patterns

1. **Category Selection**: Used in filter interfaces to narrow down precedence data
2. **Contextual Relevance**: Helps determine which filters apply to specific parameters
3. **Data Organization**: Structures precedence data retrieval and display

## Integration Points

- Used by FilteredFactualPrecedence component for dynamic filtering
- Referenced in factualPrecedenceData.js for data categorization
- Supports context-aware recommendation systems

## Best Practices

1. Use category constants instead of string literals for type safety
2. Ensure all new parameters have relevance mappings defined
3. Keep category options concise and mutually exclusive
4. Update mappings when adding new form parameters

## Extension Guidelines

To add new categories:
1. Add constant to `keyPointCategories`
2. Define options in `keyPointsData`
3. Update relevant parameter mappings in `formValueKeyPointRelevance`
4. Ensure UI components handle new category types

This module provides the foundational structure for contextualizing financial and operational data within the ModEcon Matrix System's factual precedence framework.