# Efficacy Time and Degree of Freedom Implementation Summary

## Overview

This document summarizes the implementation of the efficacy time concept and its relationship to the degree of freedom constraint in the application. The implementation includes a comprehensive map interface that visualizes parameter efficacy periods across the plant lifetime and helps users manage conflicts where the degree of freedom constraint is violated.

## Key Components

### 1. CapacityTrackingService

The CapacityTrackingService has been enhanced to:

- Set default capacity limits:
  - Plant lifetime: 20 years
  - Configurable versions: 20
  - Scaling groups: 5 (reduced from the previous default of 10)

- Track usage for these components and calculate usage percentages

- Provide methods to check for degree of freedom conflicts:
  - `checkDegreeOfFreedomConflict`: Checks if a parameter has multiple values for the same year
  - `findDegreeOfFreedomConflicts`: Finds all years where a parameter has conflicts

### 2. TimeParameterMatrix Component

This component visualizes parameters and their efficacy periods across time units (years):

- Displays a matrix where rows represent parameters and columns represent years
- Uses color coding to indicate parameter status (inactive, active, conflict)
- Highlights conflicts where the degree of freedom constraint is violated
- Provides tooltips with detailed information about each cell
- Allows clicking on conflicts to resolve them

### 3. ConflictResolutionPanel Component

This component helps users resolve conflicts where the degree of freedom constraint is violated:

- Provides three resolution methods:
  - Select one period to keep
  - Automatically adjust boundaries
  - Custom adjustment
- Shows a preview of the adjustments that will be made
- Allows users to apply the resolution or cancel

### 4. EfficacyMapContainer Component

This component serves as the main container for the efficacy time and degree of freedom visualization:

- Integrates the TimeParameterMatrix and ConflictResolutionPanel components
- Manages capacity limits and usage for plant lifetime, configurable versions, and scaling groups
- Handles conflict detection and resolution
- Provides a summary of capacity settings with visual indicators
- Includes exclusion notes about elements excluded from combinatorial calculations

## Exclusions from Combinatorial Calculations

The following elements are excluded from combinatorial calculations to maintain focus on the core parameters:

1. **Number of plots** - These are considered trivial multipliers and are excluded from capacity calculations
2. **Interchangeable x and y axes** - These are treated as a single configuration option
3. **Zones** - Currently only one area is considered for calculations

These exclusions help maintain a clear focus on the degree of freedom constraint: one value per parameter per time unit (year).

## Default Values for Calculations

The implementation uses the following default values for calculations:

- Plant lifetime: 20 years
- Configurable versions: 20
- Scaling groups: 5
- Zones: 1 area

## Degree of Freedom Constraint

The degree of freedom constraint is a fundamental concept in the application:

- Only one value per parameter per time unit (year) is possible
- This means that for any given parameter and year, there can only be one effective value
- The constraint is enforced through validation and conflict resolution
- Conflicts are highlighted in the TimeParameterMatrix and can be resolved using the ConflictResolutionPanel

## User Interface

The user interface is designed to clearly communicate the efficacy time concept and the degree of freedom constraint:

- The TimeParameterMatrix provides a visual representation of parameter efficacy periods
- Conflicts are highlighted in red and can be clicked to resolve them
- The ConflictResolutionPanel provides multiple methods for resolving conflicts
- Capacity settings are displayed with visual indicators showing usage percentages
- Exclusion notes explain which elements are excluded from combinatorial calculations

## Conclusion

The implementation of efficacy time and the degree of freedom constraint provides a comprehensive solution for managing parameter values across time. The map interface makes it easy for users to visualize and manage efficacy periods while ensuring that the degree of freedom constraint is maintained.

By clearly communicating which elements are excluded from combinatorial calculations, the implementation helps users understand the focus on core parameters and the importance of the degree of freedom constraint.