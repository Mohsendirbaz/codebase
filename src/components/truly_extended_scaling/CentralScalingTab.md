# CentralScalingTab.js - Unified Scaling Manager Component

## Overview

`CentralScalingTab.js` provides a centralized interface for managing all scaling operations in the ModEcon Matrix System. It organizes scaling functionality into four distinct categories and provides a tabbed interface for easy navigation between different scaling types.

## Architecture

### Core Features
- Tabbed interface for 4 scaling types
- Dynamic base cost extraction from form values
- Scaling group management per type
- V/R state integration
- Active group tracking across tabs

### Scaling Types Configuration
```javascript
const scalingTypes = [
  {
    id: 'Amount4',
    label: 'Process Quantities',
    filterKeyword: 'Amount4',
    icon: CubeIcon,
    description: 'Scale process input quantities (Vs, units)'
  },
  {
    id: 'Amount5',
    label: 'Process Costs',
    filterKeyword: 'Amount5',
    icon: CurrencyDollarIcon,
    description: 'Scale process costs (Vs, $ / unit)'
  },
  {
    id: 'Amount6',
    label: 'Revenue Quantities',
    filterKeyword: 'Amount6',
    icon: ChartBarIcon,
    description: 'Scale revenue stream quantities (Rs, units)'
  },
  {
    id: 'Amount7',
    label: 'Revenue Prices',
    filterKeyword: 'Amount7',
    icon: CalculatorIcon,
    description: 'Scale revenue stream prices (Rs, $ / unit)'
  }
]
```

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `formValues` | Object | Form values from parent component |
| `V` | Object | Process quantities variables state |
| `R` | Object | Revenue variables state |
| `toggleV` | Function | Toggle V state function |
| `toggleR` | Function | Toggle R state function |
| `scalingBaseCosts` | Object | Base costs for each scaling type |
| `setScalingBaseCosts` | Function | Update base costs function |
| `scalingGroups` | Array | Scaling groups array |
| `onScalingGroupsChange` | Function | Update scaling groups callback |
| `onScaledValuesChange` | Function | Handle scaled values changes |
| `onActiveGroupChange` | Function | Handle active group changes |

## State Management

### Local State
```javascript
const [activeTab, setActiveTab] = useState(0);
const [activeScalingGroups, setActiveScalingGroups] = useState({
  Amount4: 0,
  Amount5: 0,
  Amount6: 0,
  Amount7: 0
});
```

### Active Group Tracking
- Maintains active group index for each scaling type
- Preserves selection when switching tabs
- Syncs with parent component via callback

## Key Functions

### 1. Base Cost Extraction
```javascript
useEffect(() => {
  const newBaseCosts = {};
  scalingTypes.forEach(type => {
    const filteredCosts = Object.entries(formValues || {})
      .filter(([key]) => key.includes(type.filterKeyword))
      .map(([key, value]) => ({
        id: key,
        label: value.label || 'Unnamed Item',
        baseValue: parseFloat(value.value) || 0,
        vKey: getVKey(key),
        rKey: getRKey(key)
      }));
    newBaseCosts[type.id] = filteredCosts;
  });
  setScalingBaseCosts(newBaseCosts);
}, [formValues]);
```

**Process**:
1. Filters form values by keyword
2. Extracts relevant data
3. Maps to base cost structure
4. Updates parent state

### 2. V/R Number Mapping

#### V Number Determination
```javascript
function getVNumber(vAmountNum) {
  const num = parseInt(vAmountNum);
  if (num >= 40 && num <= 49) return `V${num - 39}`;
  if (num >= 50 && num <= 59) return `V${num - 49}`;
  return null;
}
```

#### R Number Determination
```javascript
function getRNumber(rAmountNum) {
  const num = parseInt(rAmountNum);
  if (num >= 50 && num <= 69) return `R${num - 59}`;
  if (num >= 50 && num <= 79) return `R${num - 69}`;
  return null;
}
```

### 3. Scaling Group Management

#### Filtering Active Groups
```javascript
const getActiveScalingGroups = useCallback(() => {
  const activeType = scalingTypes[activeTab].id;
  return (scalingGroups || []).filter(
    group => group._scalingType === activeType
  );
}, [activeTab, scalingGroups]);
```

#### Updating Groups
```javascript
const handleScalingGroupsChange = (newGroups) => {
  const activeType = scalingTypes[activeTab].id;
  const updatedGroups = newGroups.map(group => ({
    ...group,
    _scalingType: group._scalingType || activeType
  }));
  const otherGroups = scalingGroups.filter(
    group => group._scalingType !== activeType
  );
  onScalingGroupsChange([...otherGroups, ...updatedGroups]);
};
```

## UI Structure

### Tab System
```javascript
<Tab.Group selectedIndex={activeTab} onChange={handleTabChange}>
  <Tab.List className="central-scaling-tab-list">
    {scalingTypes.map((type) => (
      <Tab className="central-scaling-tab">
        <Icon className="central-scaling-tab-icon" />
        <span>{type.label}</span>
      </Tab>
    ))}
  </Tab.List>
</Tab.Group>
```

### Tab Panels
Each panel contains:
1. **Type Description**: Icon and descriptive text
2. **ExtendedScaling Component**: Full scaling interface

### CSS Classes
- `.central-scaling-container`: Main wrapper
- `.central-scaling-title`: Component title
- `.central-scaling-tab-list`: Tab navigation
- `.central-scaling-tab`: Individual tab
- `.central-scaling-tab-selected`: Active tab
- `.central-scaling-panels`: Content area
- `.scaling-type-description`: Type header

## Data Flow

1. **Form Values → Base Costs**
   - Filters by scaling type keyword
   - Extracts relevant parameters
   - Updates scalingBaseCosts

2. **Scaling Groups → Filtered Groups**
   - Filters by _scalingType property
   - Passes to ExtendedScaling component

3. **User Actions → Parent Updates**
   - Group changes propagated up
   - Active group changes tracked
   - Scaled values passed to parent

## Integration with ExtendedScaling

Each tab renders an ExtendedScaling instance with:
- Type-specific base costs
- Filtered scaling groups
- V/R state and toggles
- Active group tracking
- Change callbacks

## Best Practices

1. **State Management**
   - Preserve tab state during session
   - Track active groups per type
   - Sync with parent component

2. **Performance**
   - Use callbacks for expensive operations
   - Filter data efficiently
   - Minimize re-renders

3. **User Experience**
   - Clear tab labels and icons
   - Descriptive content per type
   - Smooth tab transitions

## Usage Example

```javascript
<CentralScalingTab
  formValues={formData}
  V={vState}
  R={rState}
  toggleV={handleToggleV}
  toggleR={handleToggleR}
  scalingBaseCosts={baseCosts}
  setScalingBaseCosts={setBaseCosts}
  scalingGroups={groups}
  onScalingGroupsChange={handleGroupsChange}
  onScaledValuesChange={handleScaledValues}
  onActiveGroupChange={handleActiveGroup}
/>
```

This component serves as the primary interface for all scaling operations, providing a clean, organized way to manage complex scaling configurations across different parameter types.