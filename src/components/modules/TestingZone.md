# TestingZone Component

## Overview
The `TestingZone` component is a development tool designed for isolated testing of UI components. It provides a controlled environment with mock data and state management for testing components without the full application context.

## Purpose
- Provide isolated component testing environment
- Enable rapid UI component development and debugging
- Test component integration with mock data
- Validate component behavior independently

## Component Structure
The component creates a self-contained testing environment with:
- Local state management
- Mock data generation
- Component lifecycle simulation
- Event handler implementations

## State Management

### Form Values
```javascript
const [formValues, setFormValues] = useState({});
```
Mock form data for testing form-dependent components.

### Toggle States (V and R)
```javascript
const [V, setV] = useState({});
const [R, setR] = useState({});
```
Binary toggle states for testing on/off functionality.

### Scaling Base Costs
```javascript
const [scalingBaseCosts, setScalingBaseCosts] = useState({
  Amount4: [],
  Amount5: [],
  Amount6: [],
  Amount7: []
});
```
Mock data structure for scaling cost calculations.

### Scaling Groups
```javascript
const [scalingGroups, setScalingGroups] = useState([]);
```
Array of scaling group configurations.

### Final Results
```javascript
const [finalResults, setFinalResults] = useState({
  Amount4: [],
  Amount5: [],
  Amount6: [],
  Amount7: []
});
```
Storage for generated results by category.

### Active Scaling Groups
```javascript
const [activeScalingGroups, setActiveScalingGroups] = useState({
  Amount4: 0,
  Amount5: 0,
  Amount6: 0,
  Amount7: 0
});
```
Tracks which scaling group is active per category.

## Event Handlers

### Toggle Functions
```javascript
const toggleV = (key) => {
  setV(prev => ({
    ...prev,
    [key]: prev[key] === 'off' ? 'on' : 'off',
  }));
};
```
Handles binary state toggling for V and R values.

### Scaling Group Management
```javascript
const handleScalingGroupsChange = (newGroups) => {
  setScalingGroups(newGroups);
};
```
Updates scaling groups when changes occur.

### Results Generation
```javascript
const handleFinalResultsGenerated = (summaryItems, filterKeyword) => {
  setFinalResults(prev => ({
    ...prev,
    [filterKeyword]: summaryItems
  }));
};
```
Stores generated results by filter keyword.

### Active Group Selection
```javascript
const handleActiveGroupChange = (groupIndex, filterKeyword) => {
  setActiveScalingGroups(prev => ({
    ...prev,
    [filterKeyword]: groupIndex
  }));
};
```
Updates the active group index for a specific filter.

## Current Test Subject
The component currently tests `LibraryIntegration` with the following configuration:

### Props Passed to LibraryIntegration
- `formValues`: Current form state
- `V`, `R`: Toggle states
- `toggleV`, `toggleR`: Toggle handlers
- `scalingBaseCosts`, `setScalingBaseCosts`: Cost data and setter
- `scalingGroups`: Current scaling groups
- `onScalingGroupsChange`: Group change handler
- `onScaledValuesChange`: Scaled value change handler
- `filterKeyword`: "Amount4" (Process Quantities)
- `initialScalingGroups`: Filtered groups by type
- `activeGroupIndex`: Current active group
- `onActiveGroupChange`: Active group change handler
- `onFinalResultsGenerated`: Results generation handler

## Component Layout
```jsx
<div className="testing-zone-container">
  <h2 className="testing-zone-header">UI Component Testing Zone</h2>
  <div className="testing-zone-content">
    <div className="component-test-area">
      <h3>Testing: LibraryIntegration</h3>
      {/* Component under test */}
    </div>
  </div>
</div>
```

## Styling
Uses `HCSS.css` for consistent styling with the main application.

## Usage Example
```jsx
// To test a different component, replace LibraryIntegration:
<TestingZone>
  <YourComponent
    prop1={mockData1}
    prop2={mockData2}
    onEvent={handleEvent}
  />
</TestingZone>
```

## Benefits
1. **Isolation**: Test components without full app dependencies
2. **Mock Data**: Easily provide test data scenarios
3. **Rapid Development**: Quick iteration on component behavior
4. **Debugging**: Simplified environment for troubleshooting
5. **Documentation**: Serves as a living example of component usage

## Best Practices
1. Keep mock data realistic but minimal
2. Test edge cases and error states
3. Verify all props are properly mocked
4. Test user interactions thoroughly
5. Document discovered issues or behaviors

## Future Enhancements
- Add component switcher for testing multiple components
- Implement test scenario presets
- Add performance monitoring
- Include prop validation testing
- Create automated test generation from TestingZone sessions