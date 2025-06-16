# labelReferences.js Documentation

## Overview

The `labelReferences.js` module serves as the central configuration hub for property mappings, icons, select options, and default values used throughout the application. It provides a comprehensive reference system for financial and process parameters with human-readable labels and associated metadata. This utility module (174 lines) is the foundation for UI consistency and data initialization in the ModEcon Matrix System.

## Core Architecture

### Level 1: Module Structure
- **Property Mappings**: Human-readable labels for parameter IDs
- **Select Options**: Dropdown choices for specific fields
- **Icon Mappings**: FontAwesome icon associations
- **Default Values**: Initial values for all parameters

### Level 2: Property Mapping System

#### Mapping Structure
```javascript
propertyMapping = {
  "plantLifetimeAmount10": "Plant Lifetime",
  "bECAmount11": "Bare Erected Cost",
  // ... 70+ parameter mappings
}
```

#### Parameter Categories
1. **Project Configuration (Amount10-19)**
   - Plant specifications
   - Construction parameters
   - Operating configurations

2. **Financial Settings (Amount20-29)**
   - Loan configurations
   - Depreciation methods
   - Construction timeline

3. **Tax & Rates (Amount30-39)**
   - IRR settings
   - Tax rates
   - Cost categories

4. **Variable Parameters (vAmount40-59)**
   - Process quantities
   - Variable inputs

5. **Rate Parameters (rAmount60-79)**
   - Cost rates
   - Price parameters

### Level 3: Select Options Configuration

#### Dropdown Mappings
```javascript
selectOptionsMapping = {
  depreciationMethodAmount20: ['Straight-Line', '5-MACRS', '7-MACRS', '15-MACRS', 'Custom'],
  loanTypeAmount21: ['simple', 'compounded'],
  interestTypeAmount22: ['fixed', 'variable'],
  loanRepaymentFrequencyAmount21: ['quarterly', 'semiannually', 'annually'],
  use_direct_operating_expensesAmount18: ['True', 'False'],
  use_direct_revenueAmount19: ['True', 'False']
}
```

### Level 4: Icon System

#### Icon Categories
- **Financial Icons**: faDollarSign for monetary values
- **Industrial Icons**: faIndustry, faBuilding for facilities
- **Process Icons**: faCogs, faTools for operations
- **Chart Icons**: faChartLine for rates and analysis
- **Resource Icons**: faWarehouse for materials

#### Dynamic Icon Assignment
```javascript
// Programmatic assignment for v and r parameters
vAmount40-59: faWarehouse (20 parameters)
rAmount60-99: faWarehouse (40 parameters)
```

### Level 5: Default Values System

#### Value Categories
1. **Monetary Defaults**
   - bECAmount11: $200,000
   - initialSellingPriceAmount13: $2

2. **Percentage Defaults**
   - totalOperatingCostPercentageAmount14: 10%
   - Various rates: 0-10%

3. **Count Defaults**
   - numberOfUnitsAmount12: 30,000
   - plantLifetimeAmount10: 20 years

4. **Boolean Defaults**
   - use_direct_operating_expensesAmount18: 'False'
   - use_direct_revenueAmount19: 'False'

### Level 6: Naming Conventions

#### Parameter ID Structure
```
Format: [description]Amount[number]
Examples:
- plantLifetimeAmount10
- bECAmount11
- vAmount40 (variable parameters)
- rAmount60 (rate parameters)
```

#### Label Conventions
- Proper case with spaces
- Abbreviated terms expanded
- Technical terms preserved
- Consistent terminology

### Level 7: Integration Points

#### Form Generation
- Dynamic form field creation
- Label display
- Icon rendering
- Default value population

#### Reset Functionality
- Original value restoration
- Bulk reset operations
- Selective parameter reset

#### Validation Support
- Type checking based on defaults
- Range validation
- Option validation for selects

### Level 8: Special Parameter Groups

#### Engineering Parameters
- BEC (Bare Erected Cost)
- EPC (Engineering Procurement Construction)
- PC (Process Contingency)
- PT (Project Contingency)

#### Financial Parameters
- Loan configurations
- Tax rates
- Depreciation methods
- Interest calculations

#### Operational Parameters
- Direct operating expenses
- Revenue configurations
- Cost percentages

### Level 9: Usage Patterns

#### Import Pattern
```javascript
import { 
  propertyMapping, 
  defaultValues, 
  iconMapping, 
  selectOptionsMapping 
} from './utils/labelReferences'
```

#### Access Pattern
```javascript
// Get label
const label = propertyMapping[parameterId]

// Get default
const defaultVal = defaultValues[parameterId]

// Get icon
const icon = iconMapping[parameterId]

// Get options
const options = selectOptionsMapping[parameterId]
```

### Level 10: Maintenance Considerations

#### Adding New Parameters
1. Add to propertyMapping
2. Define in defaultValues
3. Assign icon in iconMapping
4. Add options if select field

#### Naming Guidelines
- Maintain Amount[number] pattern
- Use descriptive prefixes
- Keep consistent numbering
- Document special cases

## Export Structure
```javascript
export {
  propertyMapping,    // Parameter ID to label mapping
  selectOptionsMapping, // Select field options
  iconMapping,        // Parameter icons
  defaultValues       // Initial values
}
```

This module serves as the single source of truth for parameter configuration, ensuring consistency across the entire application while providing flexibility for future extensions.