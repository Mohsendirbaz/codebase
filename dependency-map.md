# Dependency Map for ModEcon System Refactoring

## Step Dependencies

1. **Step 1: Create Matrix-Based Atoms for Form Values**
   - Dependencies: None (foundational step)

2. **Step 2: Extend Efficacy Support to Scaling Items**
   - Dependencies: Step 1 (uses formValuesMatrixAtom, versionsAtom, zonesAtom)

3. **Step 3: Implement Matrix-Based History Tracking**
   - Dependencies: Step 1 (uses formValuesMatrixAtom, versionsAtom, zonesAtom)
   - Dependencies: Step 2 (uses extendedEfficacyPeriodsAtom)

4. **Step 4: Refactor CalSen.py to Support Matrix State**
   - Dependencies: Conceptually depends on Step 1 (implements backend counterpart of matrix structure)

5. **Step 5: Create Jotai-CalSen Synchronization Service**
   - Dependencies: Step 4 (communicates with CalSenMatrix.py backend service)

6. **Step 6: Create Matrix Editing Dialog Component**
   - Dependencies: Step 1 (uses formValuesMatrixAtom, versionsAtom, zonesAtom, updateMatrixValueAtom)
   - Dependencies: Step 3 (uses addHistoryEntryAtom)

7. **Step 7: Create Enhanced Scaling Item with Efficacy Support**
   - Dependencies: Step 1 (uses versionsAtom, zonesAtom)
   - Dependencies: Step 2 (uses extendedEfficacyPeriodsAtom, updateScalingItemEfficacyAtom)
   - Dependencies: Step 3 (uses addHistoryEntryAtom)

8. **Step 8: Create Version and Zone Management UI**
   - Dependencies: Step 1 (uses versionsAtom, zonesAtom)
   - Dependencies: Step 3 (uses addHistoryEntryAtom)
   - Dependencies: Step 5 (uses synchronizeWithCalSen)

9. **Step 9: Create Calculation Service**
   - Dependencies: Step 5 (uses calsenSyncService)

10. **Step 10: Create Main App with Complete Integration**
    - Dependencies: All previous steps (integrates all components and services)

## Foundational Steps

Based on the dependency analysis, the following steps are foundational and should be implemented first:

1. **Step 1: Create Matrix-Based Atoms for Form Values** - This is the most foundational step as it defines the core data structure used throughout the application.
2. **Step 4: Refactor CalSen.py to Support Matrix State** - This is foundational for the backend implementation.

## Recommended Implementation Sequence

Based on the dependencies and complexity, here is the recommended implementation sequence:

1. **Step 1: Create Matrix-Based Atoms for Form Values**
2. **Step 2: Extend Efficacy Support to Scaling Items**
3. **Step 3: Implement Matrix-Based History Tracking**
4. **Step 4: Refactor CalSen.py to Support Matrix State**
5. **Step 5: Create Jotai-CalSen Synchronization Service**
6. **Step 6: Create Matrix Editing Dialog Component**
7. **Step 7: Create Enhanced Scaling Item with Efficacy Support**
8. **Step 8: Create Version and Zone Management UI**
9. **Step 9: Create Calculation Service**
10. **Step 10: Create Main App with Complete Integration**

## Justification for the Proposed Sequence

1. **Start with foundational data structures (Steps 1-3)**: These steps establish the core data structures and state management that everything else depends on. Implementing these first ensures a solid foundation for the rest of the refactoring.

2. **Implement backend support (Steps 4-5)**: Once the core data structures are in place, implement the backend support for these structures. This allows for testing the synchronization between frontend and backend early in the process.

3. **Build UI components (Steps 6-8)**: With the data structures and backend support in place, implement the UI components that allow users to interact with the system. These components depend on the data structures and state management implemented in earlier steps.

4. **Add calculation capabilities (Step 9)**: With the UI components in place, implement the calculation service that allows users to perform calculations based on the matrix state.

5. **Integrate everything (Step 10)**: Finally, bring everything together in the main application, integrating all the components and services developed in the previous steps.

This sequence minimizes the risk of having to rework code due to changes in foundational components, and allows for incremental testing and validation of the refactored system.