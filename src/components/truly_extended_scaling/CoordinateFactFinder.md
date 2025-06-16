# CoordinateFactFinder Component Documentation

## Overview
The `CoordinateFactFinder` component provides intelligent fact-finding capabilities for geographic coordinates and assets within the ModEcon Matrix System. It integrates with the existing factual precedence system to fetch location-based data and provides enhanced geographical context using external APIs.

## Purpose
- Fetch and display location-based facts for given coordinates
- Provide asset-specific information including carbon intensity and decarbonization potential
- Maintain a searchable history of fact-finding operations
- Offer visual representations of carbon intensity and decarbonization pathways

## Key Features

### 1. Location Intelligence
- **Coordinate Analysis**: Automatically fetches facts when coordinates change
- **Geographic Context**: Integration with OpenStreetMap for reverse geocoding
- **Climate Risk Assessment**: Simplified climate risk evaluation based on latitude
- **Regional Determination**: Basic regional classification from coordinates

### 2. Asset Analysis
- **Carbon Intensity Visualization**: Visual gauge showing emission levels
- **Decarbonization Pathways**: Different pathways for standard vs hard-to-decarbonize assets
- **Sectoral Classification**: Automatic categorization of emission levels
- **Recommendations**: Context-aware suggestions for decarbonization strategies

### 3. Data Management
- **Fact History**: Comprehensive tracking of all searches with timestamps
- **Filtering Options**: Filter history by confidence level and fact type
- **Fallback Data**: Automatic generation of basic facts when API fails
- **Error Handling**: Graceful degradation with informative error messages

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `coordinates` | `Object` | - | Object containing `longitude` and `latitude` |
| `assets` | `Array` | `[]` | Array of asset objects with carbon intensity data |
| `onFactFound` | `Function` | `() => {}` | Callback when new facts are discovered |
| `autoFetch` | `Boolean` | `true` | Whether to automatically fetch data on coordinate changes |

### Asset Object Structure
```javascript
{
  id: string,              // Unique identifier
  name: string,            // Display name
  type: string,            // Asset type/category
  carbonIntensity: number, // kg CO2e/unit
  isHardToDecarbonize: boolean // Difficulty flag
}
```

## Component Architecture

### State Management
- `locationFacts`: Stores facts about the current location
- `assetFacts`: Object mapping asset IDs to their facts
- `loading`: Loading state indicator
- `error`: Error message storage
- `activeAssetId`: Currently selected asset
- `factHistory`: Array of all fact-finding operations
- `showHistory`: Toggle for history panel visibility
- `confidenceFilter`: Filter for confidence levels
- `factType`: Filter for fact types

### Key Methods

#### `fetchLocationFacts(coords)`
Fetches location-specific facts using the factual precedence API.
- Creates appropriate context for API call
- Handles success/failure with fallback data
- Updates history with results

#### `fetchGeoData(coords)`
Retrieves additional geographical data from OpenStreetMap.
- Performs reverse geocoding
- Extracts address components
- Determines terrain type
- Merges with existing location facts

#### `fetchAssetFacts(asset)`
Fetches asset-specific information and decarbonization recommendations.
- Checks cache before fetching
- Creates context with carbon intensity data
- Generates fallback data on failure
- Updates asset facts collection

## UI Components

### 1. Header Section
- Title and action buttons
- Refresh and geo-detail fetch buttons
- Loading and error indicators

### 2. History Panel (Collapsible)
- Searchable list of past queries
- Filters for confidence and type
- Success/failure indicators
- Timestamp display

### 3. Location Facts Display
- Summary with confidence indicator
- Tabular display of attributes
- Recommendations section
- Geographical context visualization

### 4. Asset Selection
- Button grid for asset selection
- Visual indicators for hard-to-decarbonize assets
- Active state highlighting

### 5. Asset Facts Display
- Carbon intensity gauge visualization
- Decarbonization pathway visualization
- Detailed metrics table
- Context-specific recommendations

## Integration Points

### 1. Factual Precedence API
```javascript
import { getAPIPrecedenceData } from '../find_factual_precedence/components/modules/FactualPrecedence/APIFactualPrecedence';
```
Uses existing API for fact retrieval with custom contexts.

### 2. OpenStreetMap Integration
Direct API calls to Nominatim service for geographical data:
- Reverse geocoding
- Address extraction
- Location naming

### 3. Parent Component Communication
Via `onFactFound` callback with type and data:
```javascript
onFactFound('location', factsData);
onFactFound('asset', { assetId: asset.id, facts: factsData });
```

## Styling
Component uses dedicated CSS file: `./styles/CoordinateFactFinder.css`

Key style classes:
- `.coordinate-fact-finder`: Main container
- `.fact-finder-section`: Content sections
- `.confidence-indicator`: Confidence level display
- `.gauge-indicator`: Carbon intensity visualization
- `.pathway-visualization`: Decarbonization pathways

## Usage Example

```javascript
<CoordinateFactFinder
  coordinates={{ longitude: -122.4194, latitude: 37.7749 }}
  assets={[
    {
      id: "asset1",
      name: "Industrial Plant A",
      type: "manufacturing",
      carbonIntensity: 45.5,
      isHardToDecarbonize: true
    }
  ]}
  onFactFound={(type, data) => {
    console.log(`Found ${type} facts:`, data);
  }}
  autoFetch={true}
/>
```

## Performance Considerations
- Caches asset facts to avoid redundant API calls
- Implements fallback data generation for offline capability
- Uses AnimatePresence for smooth UI transitions
- Filters are applied client-side for responsive UX

## Future Enhancements
1. Integration with more sophisticated climate models
2. Real-time carbon pricing data
3. Advanced decarbonization pathway recommendations
4. Machine learning for improved fact relevance
5. Multi-language support for international deployments