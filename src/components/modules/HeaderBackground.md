# HeaderBackground Component Documentation

## Overview
The `HeaderBackground` component (exported as `StickerHeader`) is a sophisticated interactive header component featuring animated floating stickers, physics-based rotation effects, dipole field interactions, integrated mini-games, and a pendulum clock. It serves as an engaging visual header for the application while providing entertainment through mini-games.

## Component Architecture

### Core Features
1. **Floating Stickers**: Animated messages that float across the header
2. **Physics-Based Rotation**: Realistic rotation animations with angular velocity and damping
3. **Dipole Field System**: Magnetic field-like interactions affecting sticker behavior
4. **Mini-Games Integration**: Tic-Tac-Toe and Whack-a-Mole games
5. **Pendulum Clock**: Time display with animated pendulum
6. **Dynamic Theming**: Theme-based gradient support

### State Management
```javascript
// Sticker management
const [stickers, setStickers] = useState([]);
const stickersRef = useRef([]);

// Animation controls
const [animationSpeed, setAnimationSpeed] = useState(1.0);
const [effectFrequency, setEffectFrequency] = useState(10);
const [dipoleStrength, setDipoleStrength] = useState(50);
const [dipoleRadius, setDipoleRadius] = useState(30);

// UI states
const [showClock, setShowClock] = useState(false);
const [showGamesMenu, setShowGamesMenu] = useState(false);
const [activeGame, setActiveGame] = useState(null);

// Dipole configuration
const [dipoles, setDipoles] = useState([
  { x: 25, y: 25, strength: 1, type: 'attractive' },
  { x: 75, y: 25, strength: -1, type: 'repulsive' },
  { x: 25, y: 75, strength: -1, type: 'repulsive' },
  { x: 75, y: 75, strength: 1, type: 'attractive' }
]);
```

## Physics Engine

### Rotation Animation System
The component implements a sophisticated physics-based rotation system:

```javascript
// Physics parameters for rotation
{
  angularVelocity: velocity,
  dampingCoefficient: 0.99,
  tangentialShear: shear,
  rotationDirection: direction,
  totalRotation: accumulated
}
```

### Dipole Field Calculations
Dipoles create magnetic-like fields that influence sticker behavior:

```javascript
calculateDipoleEffect = (stickerLeft, stickerTop) => {
  // Returns:
  // - rotationMultiplier: Speed modification factor
  // - velocityBoost: Additional velocity from dipole
  // - isInDipoleField: Boolean for field presence
}
```

## Sticker Configuration

### Sticker Properties
Each sticker maintains comprehensive state:

```javascript
{
  id: number,                    // Unique identifier
  message: string,               // Display text
  left: string,                  // X position (percentage)
  top: string,                   // Y position (percentage)
  duration: number,              // Animation duration
  background: string,            // Gradient style
  isSpinning: boolean,          // Currently rotating
  rotation: number,             // Current rotation angle
  totalRotation: number,        // Accumulated rotation
  pauseFloating: boolean,       // Pause float animation
  rotationDegree: number,       // Base rotation for float
  floatDistance: number,        // Float animation distance
  finalRotationApplied: boolean,// Transition flag
  dipoleInfluenced: boolean     // Dipole interaction flag
}
```

### Animation Modes
1. **Floating Animation**: Default CSS-based gentle movement
2. **Physics Rotation**: RequestAnimationFrame-based realistic spinning
3. **Dipole Enhancement**: Modified behavior in dipole fields

## Animation Control System

### Speed Control
- Range: 0.1x to 2.0x speed multiplier
- Affects all animations uniformly
- Real-time adjustment without interruption

### Effect Frequency
- Controls random rotation trigger frequency
- Range: 2-30 seconds between effects
- Prevents animation overload

### Dipole Controls
- **Strength**: 0-100% field intensity
- **Radius**: 10-50% field coverage
- Visual indicators for field locations

## Game Integration

### Supported Games
1. **Tic-Tac-Toe**: Classic two-player game
2. **Whack-a-Mole**: Reaction-based clicking game

### Game Management
```javascript
// Launch game overlay
launchGame = (gameType) => {
  setActiveGame(gameType);
  setShowGamesMenu(false);
}

// Close game and return to header
closeGame = () => {
  setActiveGame(null);
}
```

## Theme Integration

### Dynamic Gradients
The component uses CSS variables for theme-aware gradients:

```javascript
const gradients = [
  'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
  'linear-gradient(135deg, var(--accent-color), var(--info-color))',
  // ... more theme-based gradients
];
```

### Visual Feedback
- Neumorphic shadows for depth
- Glow effects for dipole-influenced stickers
- Smooth transitions between states

## Performance Optimizations

### Animation Frame Management
```javascript
animationFramesRef.current = {};  // Track all active animations

// Cleanup on unmount
useEffect(() => {
  return () => {
    Object.keys(animationFramesRef.current).forEach(id => {
      cancelAnimationFrame(animationFramesRef.current[id]);
    });
  };
}, []);
```

### Ref-Based Updates
Uses dual state/ref pattern for immediate access:
```javascript
updateSticker = (id, updates) => {
  // Update state for React rendering
  setStickers(prev => ...);
  
  // Update ref for immediate access in animations
  stickersRef.current = ...;
}
```

## User Interface

### Control Panel
Located at bottom of header:
1. **Speed Slider**: Animation speed control
2. **Frequency Slider**: Effect frequency adjustment
3. **Dipole Strength**: Field intensity control
4. **Dipole Radius**: Field size adjustment

### Interactive Elements
1. **Clock Toggle Button**: Show/hide pendulum clock
2. **Games Menu Button**: Access mini-games
3. **Dipole Visualizers**: Semi-transparent field indicators

## Accessibility Features

### ARIA Labels
```javascript
aria-label="Clock"         // Clock toggle
aria-label="Games"         // Games menu
aria-label="Expand panel"  // Panel controls
```

### Keyboard Support
- All buttons keyboard accessible
- Modal dialogs trap focus appropriately
- Game controls support keyboard input

## CSS Dependencies

### Required Stylesheets
```javascript
import '../../styles/HomePage.CSS/HCSS.css';
```

### CSS Classes
- `.sticker-header`: Main container
- `.sticker`: Individual sticker element
- `.sticker-floating`: Float animation class
- `.dipole-influenced`: Enhanced sticker state
- `.dipole-marker`: Field visualizer
- `.game-overlay`: Game container

## Component Props
The component accepts no props and manages all state internally.

## Usage Example

```javascript
import StickerHeader from './components/modules/HeaderBackground';

function App() {
  return (
    <div className="app">
      <StickerHeader />
      {/* Rest of application */}
    </div>
  );
}
```

## Advanced Features

### Multi-Sticker Coordination
- Prevents multiple stickers from spinning simultaneously
- Manages animation queue to prevent performance issues
- Coordinates color and speed changes across all stickers

### Dipole Field Physics
- Inverse square law for field strength
- Attractive and repulsive field types
- Dynamic field visualization with opacity based on strength
- Real-time field influence calculations during animation

### Game State Management
- Overlay system for full-screen game display
- Proper cleanup when switching between games
- Integration with existing header animations

## Future Enhancement Possibilities

1. **Additional Games**: Framework supports easy game additions
2. **Custom Messages**: User-defined sticker messages
3. **Dipole Editing**: Interactive dipole placement and configuration
4. **Animation Presets**: Saved animation configurations
5. **Performance Metrics**: FPS monitoring and optimization
6. **Particle Effects**: Enhanced visual feedback for interactions