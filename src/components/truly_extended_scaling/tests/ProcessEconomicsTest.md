# ProcessEconomicsTest Component Documentation

## Overview
`ProcessEconomicsTest` is a comprehensive test component designed to verify the functionality and integration of the ProcessEconomics module. It performs automated testing of critical features including history tracking, import/export functionality, and coordinate-climate synchronization.

## Purpose
This test component ensures the ProcessEconomics implementation meets the specified requirements for:
- Climate Module integration
- History tracking with undo/redo functionality
- Import/Export capabilities (v2.0.0 format)
- Coordinate-climate synchronization
- Factual Precedence integration

## Key Features

### Test Suite Structure
The component runs 10 automated tests covering:

1. **Initial State Verification**
   - Validates ProcessEconomics has proper initial state
   - Ensures hard-to-decarbonize sectors data is present

2. **Coordinate Management**
   - Tests adding coordinates to zones
   - Verifies coordinate storage and retrieval

3. **Asset Management**
   - Tests adding assets to zones
   - Validates asset properties including carbon intensity

4. **History Tracking**
   - Verifies state changes are recorded in history
   - Ensures proper history entry count

5. **Undo/Redo Functionality**
   - Tests state rollback capabilities
   - Validates state restoration after redo

6. **Export Configuration**
   - Validates export format (v2.0.0)
   - Ensures all state data is included

7. **Import Configuration**
   - Tests importing modified configurations
   - Verifies state updates from imports

8. **API Function Verification**
   - Confirms existence of fetchLocationFacts
   - Validates fetchRegulatoryThresholds
   - Checks synchronizeCoordinateClimate

## Component Structure

### State Management
```javascript
const [testResults, setTestResults] = useState([]);
const [testStatus, setTestStatus] = useState('running');
```

### Test Execution
- Tests run automatically on component mount
- Each test adds results to the test results array
- Status updates reflect overall test completion

### Visual Feedback
- Color-coded test results (green for pass, red for fail)
- Status indicator shows test progress
- Detailed implementation summary provided

## Implementation Details

### Test Data
```javascript
const testZoneId = 'z1';
const testCoordinates = { longitude: 34.5, latitude: 45.6 };
const testAssets = [
  { 
    id: 'asset-1', 
    name: 'Test Asset 1', 
    type: 'industrial', 
    carbonIntensity: 100,
    isHardToDecarbonize: true
  }
];
```

### Error Handling
- Catches and reports test execution errors
- Provides descriptive error messages
- Updates test status to 'error' on failure

## Integration Points

### ProcessEconomics Module
- Creates instance for testing
- Accesses all public methods and properties
- Validates state changes and data flow

### History Management
- Tests complete history tracking system
- Validates undo/redo stack management
- Ensures state consistency

### Climate Module Integration
- Verifies coordinate-climate synchronization
- Tests emission factor updates
- Validates regulatory threshold integration

## Styling
- Uses dedicated CSS file: `ProcessEconomicsTest.css`
- Provides visual distinction for test results
- Implements responsive layout for test display

## Usage
```javascript
import ProcessEconomicsTest from './ProcessEconomicsTest';

// In your test suite or development environment
<ProcessEconomicsTest />
```

## Test Result Structure
Each test result includes:
- **name**: Test identifier
- **passed**: Boolean indicating success/failure
- **message**: Descriptive message about test purpose

## Implementation Summary Section
The component includes a comprehensive summary of implemented features:
- History Tracking capabilities
- Import/Export functionality
- Factual Precedence Integration
- Coordinate-Climate Synchronization
- Climate Impact Visualization

## Best Practices
1. Run tests in development environment
2. Review all test results before deployment
3. Ensure all tests pass before production release
4. Use test results to validate feature completeness

## Dependencies
- React hooks (useState, useEffect)
- ProcessEconomics module
- CSS styling file

## Future Enhancements
- Add performance benchmarking
- Include edge case testing
- Implement continuous integration hooks
- Add visual regression testing