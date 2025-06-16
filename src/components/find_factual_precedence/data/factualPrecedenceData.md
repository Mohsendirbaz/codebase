# factualPrecedenceData.js - Factual Precedence Data Module

## Overview

`factualPrecedenceData.js` is a comprehensive data module that provides historical precedence data for financial and operational parameters in the ModEcon Matrix System. It contains industry-specific data, corporate evolution examples, and context-aware recommendations for various business parameters.

## Architecture

### Core Components

1. **Parameter Type Detection**
   - Function to categorize parameters based on ID patterns
   - Maps parameter IDs to business contexts (investment, loan, price, etc.)

2. **Corporate Evolution Data**
   - Industry-specific company evolution stories
   - Real-world examples from energy, technology, manufacturing, and healthcare sectors
   - Includes challenges and solutions for each company case

3. **Factual Precedence Dataset**
   - Comprehensive parameter-specific data
   - Industry insights and trends
   - Evolution insights across business lifecycle stages

4. **Context-Aware Functions**
   - Pre-population logic for enhanced data retrieval
   - Recommendation generation based on form values

## Data Structure

### Parameter Type Mapping
```javascript
const getParameterType = (itemId) => {
  if (itemId.includes('Amount1')) return 'investment';
  if (itemId.includes('Amount2')) return 'loan';
  if (itemId.includes('Price')) return 'price';
  if (itemId.includes('Cost')) return 'cost';
  if (itemId.includes('Volume')) return 'volume';
  if (itemId.includes('Lifetime')) return 'lifetime';
  return 'general';
}
```

### Corporate Evolution Data Structure
```javascript
corporateEvolutionData = {
  energy: [
    {
      company: "Tesla Energy",
      phase: "early",
      evolution: [
        {
          year: 2015,
          metric: "production",
          value: 10000,
          unit: "Powerwall units"
        }
      ],
      challenge: "Market description",
      solution: "Solution approach"
    }
  ]
}
```

### Factual Precedence Data Structure
```javascript
factualPrecedenceData = {
  "parameterIdAmount##": {
    summary: "Parameter description",
    examples: [
      {
        entity: "Example name",
        value: numeric_value,
        unit: "measurement unit",
        year: year,
        source: "Data source"
      }
    ],
    recommendedValue: numeric_value,
    recommendationRationale: "Reasoning",
    confidenceLevel: "high|medium|low",
    industryInsights: [
      {
        industryName: "Industry",
        averageValue: numeric_value,
        trend: "Trend description",
        keyFactors: ["Factor1", "Factor2"]
      }
    ],
    evolutionInsights: {
      earlyYears: "Early stage patterns",
      middlePhase: "Growth stage patterns",
      maturePhase: "Mature stage patterns"
    }
  }
}
```

## Key Parameters Covered

### 1. Plant Lifetime (plantLifetimeAmount10)
- **Typical Range**: 15-40 years
- **Industries**: Chemical, Power Generation, Renewable Energy, Pharmaceuticals
- **Key Factors**: Technology evolution, maintenance practices, regulatory environment

### 2. Initial Selling Price (initialSellingPriceAmount13)
- **Market Segments**: Premium, Standard, Budget
- **Channels**: Direct-to-Consumer, Wholesale
- **Pricing Evolution**: Premiumization trends, scale-based reductions

### 3. Initial Investment (bECAmount11)
- **Scale Categories**: Small Pilot, Mid-Size, Large Industrial
- **Investment Ranges**: $1.8M - $75M
- **Industry Variations**: Manufacturing vs Technology capital requirements

### 4. Production Volume (numberOfUnitsAmount12)
- **Lifecycle Stages**: Startup (10K), Growth (75K), Mature (250K+)
- **Industry Patterns**: Consumer electronics vs industrial equipment
- **Scaling Approach**: Conservative ramp-up strategies

### 5. Operating Cost Percentage (totalOperatingCostPercentageAmount14)
- **Industry Averages**: Manufacturing (65%), Technology (45%), Heavy Industry (78%)
- **Cost Drivers**: Labor, energy, materials
- **Improvement Potential**: 1-2% annual reduction through optimization

### 6. Loan Percentage (loanPercentageAmount26)
- **Structure Types**: Conservative (30%), Balanced (45%), Leveraged (70%)
- **Industry Norms**: Capital intensive vs technology sectors
- **Evolution Pattern**: Lower debt in early stages, optimization in growth phase

## Corporate Evolution Examples

### Energy Sector
- **Tesla Energy**: Battery storage evolution from 10K to 1M units
- **First Solar**: Manufacturing expansion from pilot to gigawatt scale

### Technology Sector
- **AWS**: Cloud services growth from startup to $90B revenue
- **Salesforce**: CRM market expansion through strategic acquisitions

### Manufacturing Sector
- **Proterra**: Electric bus production scaling challenges and solutions
- **3M**: Innovation-driven product portfolio expansion

### Healthcare Sector
- **Moderna**: mRNA platform development with phased funding approach
- **Intuitive Surgical**: Robotic surgery market creation and expansion

## Context-Aware Features

### Pre-Population Logic
- Enhances base data with relevant corporate evolution stories
- Filters stories based on parameter type (price, cost, volume, lifetime)
- Limits to 2 most relevant examples per parameter

### Recommendation Generation
- Analyzes existing form values to suggest missing parameters
- Production volume recommendations based on investment and price
- Lifetime suggestions based on investment scale
- Provides rationale for each recommendation

## Implementation Details

### Data Retrieval Function
```javascript
getPrePopulatedPrecedenceData(itemId, formValue)
// Returns enhanced precedence data with evolution stories
```

### Recommendation Function
```javascript
getContextAwareRecommendations(formValues)
// Returns object with parameter recommendations and rationales
```

## Best Practices

1. **Data Usage**
   - Always check for null values before using precedence data
   - Consider confidence levels when making decisions
   - Use industry insights for sector-specific applications

2. **Evolution Insights**
   - Apply lifecycle-appropriate strategies
   - Consider company phase when interpreting data
   - Learn from both challenges and solutions

3. **Recommendations**
   - Use as starting points, not absolute values
   - Adjust based on specific project context
   - Validate against current market conditions

## Integration Points

- Used by FactualPrecedence components for data display
- Provides context for parameter input validation
- Supports decision-making in financial modeling
- Enhances user understanding through real-world examples

## Data Sources

- Industry reports and benchmarks
- Market research databases
- Venture capital analysis
- Manufacturing associations
- Energy outlook reports
- Technology sector metrics

This module serves as the knowledge base for the factual precedence system, providing users with data-driven insights and real-world context for their financial modeling decisions.