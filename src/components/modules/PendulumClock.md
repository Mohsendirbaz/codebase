# PendulumClock Component Documentation

## Overview
The `PendulumClock` component is an animated analog clock with a swinging pendulum, providing real-time display with smooth hand movements and customizable sizing. It features continuous animation using requestAnimationFrame for optimal performance.

## Component Architecture

### Core Features
1. **Real-Time Clock**: Accurate time display with smooth hand movements
2. **Animated Pendulum**: Continuous swinging animation
3. **Size Variants**: Small, medium, and large size options
4. **Smooth Animation**: RequestAnimationFrame-based updates
5. **Millisecond Precision**: Ultra-smooth second hand movement

### Props Interface
```javascript
{
  size: 'small' | 'medium' | 'large'  // Default: 'medium'
}
```

## Animation System

### Clock Hand Updates
The component uses requestAnimationFrame for smooth, continuous updates:

```javascript
useEffect(() => {
  const updateClock = () => {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();

    // Calculate angles with millisecond precision
    const secondAngle = (seconds * 6) + (milliseconds * 0.006);
    const minuteAngle = (minutes * 6) + (seconds * 0.1);
    const hourAngle = (hours * 30) + (minutes * 0.5);

    // Apply rotations
    if (secondHandRef.current) secondHandRef.current.style.transform = `rotate(${secondAngle}deg)`;
    if (minuteHandRef.current) minuteHandRef.current.style.transform = `rotate(${minuteAngle}deg)`;
    if (hourHandRef.current) hourHandRef.current.style.transform = `rotate(${hourAngle}deg)`;

    requestAnimationFrame(updateClock);
  };

  const animationFrame = requestAnimationFrame(updateClock);

  return () => {
    cancelAnimationFrame(animationFrame);
  };
}, []);
```

### Angle Calculations
- **Second Hand**: 6° per second + 0.006° per millisecond
- **Minute Hand**: 6° per minute + 0.1° per second
- **Hour Hand**: 30° per hour + 0.5° per minute

## Clock Face Generation

### Dynamic Number Positioning
Clock numbers are positioned using trigonometric calculations:

```javascript
for (let i = 1; i <= 12; i++) {
  const angle = (i * 30) - 90; // 30 degrees per hour, -90 to start at 12
  const radians = angle * (Math.PI / 180);
  const radius = size === 'small' ? 80 : size === 'large' ? 160 : 120;

  const x = Math.cos(radians) * radius;
  const y = Math.sin(radians) * radius;

  // Position number at calculated coordinates
}
```

### Size-Based Radius
- **Small**: 80px radius
- **Medium**: 120px radius (default)
- **Large**: 160px radius

## Component Structure

### DOM Hierarchy
```html
<div className="clock-container {size}">
  <div className="clock-face">
    <!-- Clock numbers (1-12) -->
    <div className="clock-number">...</div>
    
    <!-- Clock hands -->
    <div className="hour-hand" ref={hourHandRef}></div>
    <div className="minute-hand" ref={minuteHandRef}></div>
    <div className="second-hand" ref={secondHandRef}></div>
    
    <!-- Center dot -->
    <div className="clock-center"></div>
  </div>
  
  <!-- Pendulum assembly -->
  <div className="pendulum-container">
    <div className="pendulum-rod pendulum-animate">
      <div className="pendulum-bob"></div>
    </div>
  </div>
</div>
```

## Styling Classes

### Container Classes
- `.clock-container`: Main wrapper with size variants
- `.clock-container.small`: Small size variant
- `.clock-container.medium`: Medium size variant
- `.clock-container.large`: Large size variant

### Clock Face Elements
- `.clock-face`: Clock face container
- `.clock-number`: Individual number positioning
- `.hour-hand`: Hour hand styling
- `.minute-hand`: Minute hand styling
- `.second-hand`: Second hand styling
- `.clock-center`: Center pivot point

### Pendulum Elements
- `.pendulum-container`: Pendulum assembly wrapper
- `.pendulum-rod`: Pendulum rod element
- `.pendulum-animate`: Animation class for swinging
- `.pendulum-bob`: Pendulum weight at bottom

## Performance Considerations

### Optimization Strategies
1. **Single Animation Loop**: One requestAnimationFrame for all hands
2. **Direct DOM Manipulation**: Transform updates via refs
3. **No State Updates**: Avoids React re-renders
4. **Proper Cleanup**: Cancels animation frame on unmount

### Resource Management
```javascript
// Refs for direct DOM access
const secondHandRef = useRef(null);
const minuteHandRef = useRef(null);
const hourHandRef = useRef(null);

// Cleanup on unmount
return () => {
  cancelAnimationFrame(animationFrame);
};
```

## Usage Examples

### Basic Usage
```javascript
import PendulumClock from './components/modules/PendulumClock';

function App() {
  return <PendulumClock />;
}
```

### With Size Prop
```javascript
// Small clock
<PendulumClock size="small" />

// Medium clock (default)
<PendulumClock size="medium" />

// Large clock
<PendulumClock size="large" />
```

### In Header Component
```javascript
{showClock && (
  <div className="clock-overlay">
    <PendulumClock size="medium" />
  </div>
)}
```

## CSS Requirements

### Import Dependencies
```javascript
import '../../styles/HomePage.CSS/HCSS.css';
```

### Expected CSS Variables
The component relies on theme CSS variables for styling:
- Clock face background
- Hand colors
- Number styling
- Shadow effects

## Animation Details

### Pendulum Animation
The pendulum uses CSS animations (defined in HCSS.css):
- Continuous swinging motion
- Physics-based easing
- Synchronized with clock mechanism

### Hand Movement
- Smooth, continuous rotation
- No stepping or jumping
- Millisecond-level precision for second hand

## Accessibility Considerations

### Visual Design
- High contrast between hands and face
- Clear number visibility
- Appropriate sizing for readability

### Animation Performance
- Respects prefers-reduced-motion
- Efficient animation loop
- Minimal CPU usage

## Component Lifecycle

### Initialization
1. Component mounts
2. Refs are established
3. Clock numbers are generated
4. Animation loop starts

### Update Cycle
1. Get current time
2. Calculate angles
3. Apply transformations
4. Request next frame

### Cleanup
1. Component unmounts
2. Animation frame cancelled
3. Resources released

## Integration Points

### With HeaderBackground
The clock integrates seamlessly with the header component:
- Toggle visibility
- Overlay positioning
- Theme consistency

### Standalone Usage
Can be used independently in any component:
- Dashboard widgets
- Time-sensitive displays
- Educational interfaces

## Future Enhancement Possibilities

1. **Digital Display**: Add digital time readout
2. **Time Zones**: Support for different time zones
3. **Alarm Function**: Set and display alarms
4. **Custom Styling**: Props for colors and styles
5. **Date Display**: Show current date
6. **Stopwatch Mode**: Additional timing functionality
7. **Theme Variants**: Different clock face designs
8. **Sound Effects**: Ticking sounds (optional)
9. **12/24 Hour**: Toggle between formats
10. **Custom Pendulum**: Different pendulum styles