# Efficacy Time and Degree of Freedom Implementation

## Overview

This document outlines the implementation of the efficacy time concept and its relationship to the degree of freedom constraint in the application. It addresses the requirement that only one value per parameter per time unit (year) is possible, and how this needs to be communicated via a map interface.

## Key Concepts

### 1. Efficacy Time

Efficacy time refers to the period during which a parameter value is effective or valid. In the application:

- Each parameter can have a start and end year within the plant lifetime
- The Efficacy component allows users to set these time periods using sliders
- Parameters are only applied during their efficacy period

### 2. Degree of Freedom Constraint

The degree of freedom concept introduces a fundamental constraint:

- **Only one value per parameter per time unit (year) is possible**
- This means that for any given parameter and year, there can only be one effective value
- This constraint must be clearly communicated to users through the interface

### 3. Relationship Between Concepts

- Efficacy time defines when a parameter value is active
- The degree of freedom constraint ensures that there is no ambiguity about which value to use at any point in time
- Together, they create a deterministic system where calculations produce consistent results

## Current Implementation Analysis

### Efficacy Component

The current Efficacy.js component:
- Allows setting start and end years for parameter efficacy
- Enforces that efficacy periods are within plant lifetime
- Provides visual feedback through a timeline
- Does not explicitly enforce or communicate the degree of freedom constraint

### Capacity Tracking

The CapacityTrackingService:
- Tracks usage of sensitivity variables and scaling groups
- Has default capacity limits (6 for sensitivity variables, 10 for scaling groups)
- Does not currently track or enforce the degree of freedom constraint

## Requirements for Map Implementation

### 1. Default Values and Calculations

- Plant lifetime: 20 years (configurable)
- Configurable versions: 20 (default)
- Scaling groups: 5 (default for calculations)
- Zones: Consider only one area initially

### 2. Exclusions

The following should be excluded from combinatorial calculations:
- Number of plots
- Other trivial combinatoric multipliers (e.g., interchangeable x and y axes)

### 3. Map Interface Requirements

The map interface should:
- Clearly visualize the efficacy periods for parameters
- Highlight conflicts when the degree of freedom constraint is violated
- Allow users to resolve conflicts by adjusting efficacy periods
- Show the relationship between parameters, time units, and values
- Provide a comprehensive view of all parameters across the plant lifetime

## Proposed Map Design

### 1. Time-Parameter Matrix

A matrix visualization where:
- Rows represent parameters (S10-S84, scaling groups, etc.)
- Columns represent years (1 to plant lifetime)
- Cells indicate whether a parameter has a value for that year
- Conflicts (multiple values for the same parameter in the same year) are highlighted in red

### 2. Efficacy Timeline

An enhanced version of the current timeline that:
- Shows all parameters on a single timeline
- Uses color coding to distinguish different parameter types
- Allows zooming and filtering to focus on specific time periods or parameters
- Provides tooltips with detailed information about parameter values

### 3. Conflict Resolution Panel

A dedicated panel that:
- Lists all conflicts where the degree of freedom constraint is violated
- Provides options to resolve each conflict (adjust efficacy period, change value, etc.)
- Shows the impact of resolution options on calculations

### 4. Capacity Management Integration

Integration with the capacity management panel to:
- Set limits for plant lifetime, configurable versions, and scaling groups
- Show usage percentages for each component
- Provide warnings when approaching capacity limits

## Implementation Plan

### Phase 1: Core Functionality

1. Update CapacityTrackingService:
   - Set default scaling groups limit to 5
   - Add tracking for configurable versions (default: 20)
   - Add tracking for plant lifetime (default: 20)

2. Implement degree of freedom constraint validation:
   - Create a service to detect when multiple values exist for the same parameter in the same year
   - Add validation to the Efficacy component to prevent creating conflicts

### Phase 2: Map Interface

1. Develop the Time-Parameter Matrix component:
   - Create a grid visualization of parameters and time units
   - Implement color coding for different states (active, inactive, conflict)
   - Add interactive features (tooltips, highlighting, filtering)

2. Enhance the Efficacy Timeline:
   - Modify to show multiple parameters simultaneously
   - Add zoom and filter controls
   - Implement conflict highlighting

### Phase 3: Conflict Resolution

1. Create the Conflict Resolution Panel:
   - Develop UI for listing and resolving conflicts
   - Implement resolution actions (adjust efficacy, change values)
   - Add impact analysis for resolution options

### Phase 4: Integration and Refinement

1. Integrate with existing components:
   - Connect to SensitivityMonitor
   - Connect to scaling groups management
   - Integrate with capacity management panel

2. Add user guidance:
   - Create tooltips and help text explaining the degree of freedom constraint
   - Add warnings when actions might create conflicts
   - Develop documentation on best practices

## Conclusion

The implementation of efficacy time and the degree of freedom constraint is essential for ensuring consistent and deterministic calculations in the application. By clearly communicating these concepts through a well-designed map interface, users will be able to understand and work within these constraints effectively.

The proposed design provides a comprehensive solution that not only enforces the constraint but also helps users visualize and manage parameter values across time, leading to a more intuitive and powerful user experience.