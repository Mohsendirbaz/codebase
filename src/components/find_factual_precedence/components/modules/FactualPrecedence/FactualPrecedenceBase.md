# Factual Precedence Base Component

## Overview
A sophisticated component providing historical business precedence data and industry insights for parameter decision-making. Features corporate evolution patterns, success strategies, and contextual data application with feedback mechanisms.

## Architecture

### Component Structure
- **Type**: React Functional Component
- **Size**: 487 lines
- **Pattern**: Modal-based insight system
- **Dependencies**: FontAwesome icons

### Sub-Components
1. **CorporateEvolutionInsights**: Company success patterns
2. **FeedbackForm**: User feedback collection
3. **FactualPrecedenceBase**: Main component

## Core Features

### 1. Parameter Context Analysis
```javascript
getParameterContext(itemId, formValue) {
  // Determines parameter type from ID patterns
  // Categories: investment, loan, rate, quantity, process-cost, sales-volume, price
  // Industries: energy, chemical, technology, healthcare
  // Returns industry-specific insights
}
```

### 2. Industry Insights
Dynamic insights based on parameter type:
- **Investment**: Scaling strategies (Amazon, Tesla, Spotify)
- **Price**: Pricing positioning (Apple, Salesforce, IKEA)
- **Process Cost**: Efficiency methods (Toyota, Dell, Southwest)
- **General**: Business model evolution (Google, Netflix, Microsoft)

### 3. Success Strategies
Parameter-specific recommendations:
- Investment: Phased deployment, partnerships, MVP approach
- Price: Value-based pricing, tiering, premium positioning
- Process Cost: Continuous improvement, vertical integration
- General: Focus, data-driven decisions, adaptability

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `show` | boolean | Visibility control |
| `position` | object | Positioning data |
| `onClose` | function | Close handler |
| `formValues` | object | Form data |
| `id` | string | Parameter ID |
| `handleInputChange` | function | Value update handler |
| `getPrecedenceData` | function | Data fetching function |

## State Management

### Main Component State
- `loading`: Data fetch status
- `factualData`: Retrieved precedence data
- `selectedSource`: Active data source
- `appliedValues`: History of applied values
- `activeTab`: Current view tab
- `showEvolutionInsights`: Modal visibility
- `showFeedbackForm`: Feedback visibility
- `parameterContext`: Analyzed context

### Feedback Form State
- `feedbackType`: helpful/inaccurate/outdated/irrelevant
- `comment`: User comments
- `isSubmitting`: Submit status
- `isSubmitted`: Success state

## UI Components

### Corporate Evolution Popup
1. **Header Section**
   - Title with parameter label
   - Close button

2. **Parameter Context**
   - Parameter type display
   - Type description
   - Industry context

3. **Success Strategies**
   - Icon-enhanced list
   - Context-specific strategies

4. **Industry Examples**
   - Company cards with:
     - Company name
     - Insight description
     - Year reference
     - External link option

### Feedback Form
1. **Radio Options**
   - Helpful
   - Inaccurate
   - Outdated
   - Irrelevant

2. **Comment Field**
   - Optional textarea
   - Placeholder guidance

3. **Submit Flow**
   - Loading state
   - Success confirmation
   - Auto-close after 2s

### Main Component Layout
1. **Tab Navigation**
   - Factual data
   - Evolution insights
   - Feedback

2. **Data Display**
   - Loading states
   - Source selection
   - Value application

3. **Applied Values History**
   - Track applied changes
   - Source attribution

## Data Flow

### Fetching Process
1. Component shows → Trigger fetch
2. Call `getPrecedenceData` prop
3. Pass parameter ID and value
4. Update factualData state

### Value Application
```javascript
applyValue(value, source) {
  // Update form value
  handleInputChange({ target: { value } }, id, 'value');
  
  // Add source to remarks
  if (source) {
    const updatedRemarks = `${formValues[id].remarks || ''}\nSource: ${source}`;
    handleInputChange({ target: { value: updatedRemarks } }, id, 'remarks');
  }
  
  // Track application
  setAppliedValues([...appliedValues, { value, source }]);
}
```

## Parameter Type Detection

### ID Pattern Matching
- `Amount1`: Investment parameters
- `Amount2`: Loan parameters
- `Amount3`: Rate parameters
- `Amount4`: Quantity parameters
- `Amount5`: Process cost parameters
- `Amount6`: Sales volume parameters
- `Amount7`: Price parameters
- `vAmount`: Variable parameters
- `rAmount`: Revenue parameters

### Industry Detection
Label-based keyword matching:
- Energy: energy, power, electricity, solar, wind
- Chemical: chemical, material, compound
- Technology: software, digital, tech, data
- Healthcare: medicine, health, patient, medical

## CSS Classes

### Layout Classes
- `.corporate-evolution-popup`: Modal container
- `.evolution-header`: Header section
- `.evolution-content`: Main content
- `.parameter-context`: Context display
- `.success-strategies`: Strategy section
- `.industry-examples`: Company cards

### Feedback Classes
- `.feedback-form-popup`: Form modal
- `.feedback-header`: Form header
- `.feedback-content`: Form body
- `.feedback-type-selection`: Radio group
- `.feedback-comment`: Textarea section
- `.feedback-success`: Success message

### State Classes
- `.loading`: Loading state
- `.applied`: Applied value indicator
- `.active-tab`: Tab selection

## Best Practices

### Performance
- Lazy loading of precedence data
- Memoized context calculation
- Efficient state updates

### User Experience
- Clear loading indicators
- Success feedback
- Auto-close patterns
- Source attribution

### Data Integrity
- Source tracking
- Remarks integration
- Applied value history
- Feedback collection