# Efficacy Map Integration

## Overview

This document describes the integration of the Efficacy Map components into the application's UI. The components were created to visualize parameter efficacy periods across the plant lifetime and help users manage conflicts where the degree of freedom constraint is violated.

## Integration Details

The following components have been integrated into the application:

1. **EfficacyMapContainer**: The main container component that integrates the TimeParameterMatrix and ConflictResolutionPanel components.
2. **TimeParameterMatrix**: Visualizes parameters and their efficacy periods across time units (years).
3. **ConflictResolutionPanel**: Helps users resolve conflicts where the degree of freedom constraint is violated.

### Integration Location

The components have been integrated into the **Scaling** tab of the application. This tab was chosen because:

1. It's directly related to parameter scaling and configuration
2. Users are likely to need to visualize and manage efficacy periods when working with scaling groups
3. The degree of freedom constraint is most relevant in this context

### Implementation

The integration was implemented by:

1. Adding the EfficacyMapContainer component to the 'Scaling' case in the `renderTabContent` function in `HomePage.js`
2. Importing the EfficacyMapContainer component at the top of the `HomePage.js` file
3. Passing the necessary props to the EfficacyMapContainer:
   - parameters: The form values object
   - plantLifetime: The plant lifetime from the form values (default: 20)
   - configurableVersions: The default value (20)
   - scalingGroups: The number of scaling groups (default: 5)
   - onParameterUpdate: A function to handle parameter updates

## User Experience

When users navigate to the Scaling tab, they will now see:

1. The original CentralScalingTab component at the top
2. The new EfficacyMapContainer below it, which includes:
   - A summary of capacity settings with visual indicators
   - A matrix visualization of parameter efficacy periods
   - Tools to identify and resolve conflicts

This integration provides users with a comprehensive view of parameter efficacy periods and helps them maintain the degree of freedom constraint (one value per parameter per time unit).

## Future Enhancements

Potential future enhancements to this integration include:

1. Adding a toggle to show/hide the Efficacy Map
2. Integrating the Efficacy Map with other tabs where parameter configuration is relevant
3. Adding more interactive features to the TimeParameterMatrix
4. Enhancing the conflict resolution workflow

## Conclusion

The integration of the Efficacy Map components into the Scaling tab provides users with powerful tools to visualize and manage parameter efficacy periods while ensuring the degree of freedom constraint is maintained. This enhancement improves the user experience and helps prevent configuration errors.