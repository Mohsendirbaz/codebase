# EfficacyMapContainer Integration in Input Tab's Scaling Sub-tab

## Overview

This document describes the integration of the EfficacyMapContainer component into the Scaling sub-tab under the Input tab. The component was previously only available in the main Scaling tab, but has now been implemented in both locations to ensure consistency across the application.

## Implementation Details

### Previous State

Before this change, the EfficacyMapContainer component was only available in the main Scaling tab, accessed via:

```jsx
case 'Scaling':
    return (
        <>
            <CentralScalingTab
                // props...
            />

            {/* Integrate EfficacyMapContainer */}
            <EfficacyMapContainer
                parameters={formValues}
                plantLifetime={formValues.plantLifetimeAmount10?.value || 20}
                configurableVersions={20}
                scalingGroups={scalingGroups.length || 5}
                onParameterUpdate={(paramId, updatedParam) => {
                    handleInputChange(
                        { target: { value: updatedParam.value } },
                        paramId
                    );
                }}
            />
        </>
    );
```

However, it was not available in the Scaling sub-tab under the Input tab, which only contained the CentralScalingTab component:

```jsx
{activeSubTab === 'Scaling' && (
    <CentralScalingTab
        formValues={formValues}
        V={V}
        R={R}
        toggleV={toggleV}
        toggleR={toggleR}

        scalingBaseCosts={scalingBaseCosts}
        setScalingBaseCosts={setScalingBaseCosts}
        scalingGroups={scalingGroups}

        onScalingGroupsChange={handleScalingGroupsChange}
        onScaledValuesChange={handleScaledValuesChange}
    />
)}
```

### Current State

The EfficacyMapContainer component has now been integrated into the Scaling sub-tab under the Input tab, making it available in both locations:

```jsx
{activeSubTab === 'Scaling' && (
    <>
        <CentralScalingTab
            formValues={formValues}
            V={V}
            R={R}
            toggleV={toggleV}
            toggleR={toggleR}

            scalingBaseCosts={scalingBaseCosts}
            setScalingBaseCosts={setScalingBaseCosts}
            scalingGroups={scalingGroups}

            onScalingGroupsChange={handleScalingGroupsChange}
            onScaledValuesChange={handleScaledValuesChange}
        />

        {/* Integrate EfficacyMapContainer */}
        <EfficacyMapContainer
            parameters={formValues}
            plantLifetime={formValues.plantLifetimeAmount10?.value || 20}
            configurableVersions={20}
            scalingGroups={scalingGroups.length || 5}
            onParameterUpdate={(paramId, updatedParam) => {
                handleInputChange(
                    { target: { value: updatedParam.value } },
                    paramId
                );
            }}
        />
    </>
)}
```

### Props Passed to EfficacyMapContainer

The following props are passed to the EfficacyMapContainer in both locations:

- **parameters**: The form values object containing all parameters
- **plantLifetime**: The plant lifetime from the form values (default: 20)
- **configurableVersions**: The default value (20)
- **scalingGroups**: The number of scaling groups (default: 5)
- **onParameterUpdate**: A function to handle parameter updates

## Benefits

This integration ensures that users have access to the same functionality regardless of whether they access the Scaling functionality through the main Scaling tab or through the Scaling sub-tab under the Input tab. This provides a more consistent user experience and ensures that all features are available in both locations.

## Files Modified

- **src/HomePage.js**: Added the EfficacyMapContainer component to the Scaling sub-tab under the Input tab

## Testing

To test this change:

1. Navigate to the Input tab
2. Click on the "+ Scaling" sub-tab
3. Verify that the EfficacyMapContainer is displayed below the CentralScalingTab
4. Navigate to the main Scaling tab
5. Verify that the EfficacyMapContainer is displayed below the CentralScalingTab
6. Ensure that both instances of the EfficacyMapContainer function correctly

## Conclusion

The integration of the EfficacyMapContainer component into the Scaling sub-tab under the Input tab ensures that users have access to the same functionality regardless of how they access the Scaling features. This provides a more consistent user experience and ensures that all features are available in both locations.