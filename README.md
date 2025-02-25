# TEA Space Project Refactoring

## Project Structure

The project has been refactored to improve maintainability, reusability, and code organization. Here's an overview of the main components:

### Services

Located in `src/services/`:

- **apiService.js** - Base API service configuration
- **batchService.js** - Batch operations (create, remove, etc.)
- **configService.js** - Configuration management
- **contentService.js** - Content fetching (HTML, CSV, Images)

### Custom Hooks

Located in `src/hooks/`:

- **useFormValues.js** - Form state management
- **useVersion.js** - Version state and operations
- **useTheme.js** - Theme management and transitions
- **useContentLoading.js** - Content loading states
- **useAnalysis.js** - Analysis operations
- **useFeatureToggles.js** - Feature toggle management
- **useSensitivity.js** - Sensitivity parameters management

### Components

Located in `src/components/`:

- **tabs/** - Tab-related components
  - TabContent.js - Main tab content renderer
  - CsvContentTab.js - CSV file display
  - HtmlContentTab.js - HTML content display
  - PlotContentTab.js - Plot visualization
- **theme/** - Theme-related components
  - ThemeSelector.js - Theme selection UI
- **navigation/** - Navigation components
  - TabNavigation.js - Main tab navigation

### Utilities

Located in `src/utils/`:

- **pathTransformers.js** - Path transformation utilities

## Key Improvements

1. **Modular Architecture**
   - Separated concerns into distinct services and hooks
   - Improved code reusability and maintainability

2. **State Management**
   - Encapsulated state logic in custom hooks
   - Reduced prop drilling and state complexity

3. **Code Organization**
   - Clear directory structure
   - Consistent file naming
   - Logical grouping of related functionality

4. **Documentation**
   - TypeScript-style JSDoc comments
   - Clear function and parameter documentation
   - Usage examples in index files

## Usage Examples

### Using Custom Hooks

```javascript
import { 
  useFormValues, 
  useVersion, 
  useTheme,
  useContentLoading,
  useAnalysis,
  useFeatureToggles,
  useSensitivity 
} from '../hooks';

// Form management
const { formValues, handleInputChange } = useFormValues();

// Version management
const { version, handleVersionChange } = useVersion();

// Theme management
const { season, handleThemeChange } = useTheme();

// Content loading
const { loadingStates, handleIframeLoad } = useContentLoading({ activeTab });

// Analysis operations
const { analysisRunning, handleRun } = useAnalysis({ 
  version, 
  selectedVersions, 
  V, 
  F, 
  S 
});

// Feature toggles
const { remarks, toggleRemarks } = useFeatureToggles();

// Sensitivity parameters
const { S, enableParameter } = useSensitivity();
```

### Using Services

```javascript
import { contentService, batchService, configService } from '../services';

// Fetch content
await contentService.fetchHtmlFiles(version);

// Create new batch
await batchService.createNewBatch();

// Load configuration
await configService.loadConfiguration(version);
```

## Future Improvements

1. **Testing**
   - Add unit tests for hooks and services
   - Add integration tests for components
   - Add end-to-end tests for critical flows

2. **Performance**
   - Implement memoization where beneficial
   - Add lazy loading for components
   - Optimize re-renders

3. **Error Handling**
   - Add global error boundary
   - Improve error reporting
   - Add retry mechanisms for API calls

4. **Accessibility**
   - Add ARIA labels
   - Improve keyboard navigation
   - Add screen reader support

## Contributing

When adding new features or making changes:

1. Follow the established directory structure
2. Add appropriate documentation
3. Use TypeScript-style JSDoc comments
4. Update this README as needed
